"use client";

import "leaflet/dist/leaflet.css";
import type { FeatureCollection, Polygon } from "geojson";
import L, { type LatLngBounds, type Path, type PathOptions } from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { GeoJSON, MapContainer, Polygon as LeafletPolygon, TileLayer, useMap } from "react-leaflet";
import { won1 } from "./money";
import type { DongFeatureProps } from "./AppProvider";

type Props = {
  geojson: FeatureCollection<Polygon, DongFeatureProps>;
  /** 동 → 채울 색 */
  fills: Record<string, string>;
  /** 동 → 실질 월 주거비(만원) */
  values: Record<string, number>;
  selected: string;
  onSelect: (dong: string) => void;
};

const FIT_PADDING: [number, number] = [8, 8];
/** 경계 밖으로 끌 수 있는 여유(경계 크기 대비 비율) */
const PAN_MARGIN = 0.08;
/** 처음 맞춘 줌보다 이만큼까지만 축소 허용 (0이면 자치구보다 넓게 못 봄) */
const ZOOM_OUT_LIMIT = 0;
const MAX_ZOOM = 17;
/** 라벨 금액이 바뀔 때 숫자가 변하는 시간(ms) */
const LABEL_TWEEN_MS = 500;

const STROKE = { base: "#ffffff", hover: "#374151", selected: "#111827" };

export function boundsOf(geojson: FeatureCollection<Polygon>): LatLngBounds {
  return L.geoJSON(geojson).getBounds();
}

const labelHtml = (dong: string, value: number | undefined) =>
  `<strong>${dong}</strong><br/><span>${value === undefined ? "거래 없음" : won1(value)}</span>`;

/**
 * 자치구 바깥을 가리는 마스크: 넓은 사각형에서 각 동 경계를 구멍으로 뚫는다.
 * 경계 파일만 바꾸면 모양이 따라온다.
 */
export function outsideMask(geojson: FeatureCollection<Polygon>, bounds: LatLngBounds): L.LatLngExpression[][] {
  const outer = bounds.pad(3);
  const sw = outer.getSouthWest();
  const ne = outer.getNorthEast();
  const frame: L.LatLngExpression[] = [
    [sw.lat, sw.lng],
    [ne.lat, sw.lng],
    [ne.lat, ne.lng],
    [sw.lat, ne.lng],
  ];
  const holes = geojson.features.map((f) => f.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as L.LatLngTuple));
  return [frame, ...holes];
}

const dongOf = (layer: L.Layer) => ((layer as L.Polygon).feature?.properties as DongFeatureProps).dong;

/** 처음 열 때 자치구(데이터의 전체 동) 영역에 맞추고, 그보다 크게 축소하거나 멀리 끌지 못하게 제한 */
function FitToDistrict({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.fitBounds(bounds, { padding: FIT_PADDING, animate: false });
    map.setMinZoom(map.getZoom() - ZOOM_OUT_LIMIT);
    map.setMaxBounds(bounds.pad(PAN_MARGIN));
  }, [map, bounds]);
  return null;
}

export default function DongMap({ geojson, fills, values, selected, onSelect }: Props) {
  const bounds = useMemo(() => boundsOf(geojson), [geojson]);
  const mask = useMemo(() => outsideMask(geojson, bounds), [geojson, bounds]);
  const layerRef = useRef<L.GeoJSON | null>(null);
  /** 라벨에 지금 표시 중인 값(애니메이션 시작점) */
  const shownRef = useRef<Record<string, number>>({});

  // 이벤트 핸들러가 항상 최신 값을 보도록 (다른 효과보다 먼저 실행되게 위에 둠)
  const latest = useRef({ fills, selected, onSelect });
  useEffect(() => {
    latest.current = { fills, selected, onSelect };
  }, [fills, selected, onSelect]);

  const styleFor = (dong: string, hover = false): PathOptions => {
    const { fills, selected } = latest.current;
    const isSelected = dong === selected;
    return {
      fillColor: fills[dong] ?? "#e5e7eb",
      fillOpacity: 0.55,
      color: isSelected ? STROKE.selected : hover ? STROKE.hover : STROKE.base,
      weight: isSelected || hover ? 2 : 1,
      opacity: 1,
    };
  };

  // 색·선택 갱신: 폴리곤을 다시 만들지 않고 스타일만 바꿔 CSS 전환 효과가 보이게
  useEffect(() => {
    const group = layerRef.current;
    if (!group) return;
    group.eachLayer((layer) => {
      const dong = dongOf(layer);
      (layer as Path).setStyle(styleFor(dong));
      if (dong === selected) (layer as Path).bringToFront();
    });
    // styleFor는 latest ref만 읽는다
  }, [fills, selected]);

  // 라벨 금액 갱신: 이전 값에서 새 값까지 숫자가 변하고, 바뀐 라벨은 잠깐 강조
  useEffect(() => {
    const group = layerRef.current;
    if (!group) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layers: { layer: L.Layer; dong: string; from: number; to: number }[] = [];
    group.eachLayer((layer) => {
      const dong = dongOf(layer);
      const to = values[dong];
      const from = shownRef.current[dong] ?? to;
      layers.push({ layer, dong, from, to });
      if (from !== to && to !== undefined) {
        const el = layer.getTooltip()?.getElement();
        el?.classList.remove("dong-label-flash");
        void el?.offsetWidth; // 애니메이션 재시작
        el?.classList.add("dong-label-flash");
      }
    });

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = reduce ? 1 : Math.min(1, (now - start) / LABEL_TWEEN_MS);
      const e = 1 - Math.pow(1 - k, 3);
      for (const { layer, dong, from, to } of layers) {
        const v = to === undefined ? undefined : k === 1 ? to : from + (to - from) * e;
        if (v !== undefined) shownRef.current[dong] = v;
        layer.setTooltipContent(labelHtml(dong, v));
      }
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [values]);

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: FIT_PADDING }}
      maxBoundsViscosity={1}
      maxZoom={MAX_ZOOM}
      zoomSnap={0.25}
      scrollWheelZoom={false}
      attributionControl
      className="dong-map h-full w-full rounded-lg"
    >
      <FitToDistrict bounds={bounds} />
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        className="dong-map-tiles"
      />
      {/* 자치구 바깥 가림 (동 폴리곤보다 아래) */}
      <LeafletPolygon
        positions={mask}
        interactive={false}
        pathOptions={{ stroke: false, fillColor: "#f3f4f6", fillOpacity: 0.78 }}
      />
      <GeoJSON
        ref={layerRef}
        data={geojson}
        style={(f) => styleFor(f?.properties.dong)}
        onEachFeature={(feature, layer) => {
          const { dong } = feature.properties as DongFeatureProps;
          shownRef.current[dong] = values[dong];
          layer.bindTooltip(labelHtml(dong, values[dong]), {
            permanent: true,
            direction: "center",
            className: "dong-label",
          });
          layer.on({
            click: () => latest.current.onSelect(dong),
            mouseover: (e) => {
              const path = e.target as Path;
              path.setStyle(styleFor(dong, true));
              path.bringToFront();
            },
            mouseout: (e) => {
              const path = e.target as Path;
              path.setStyle(styleFor(dong));
              if (dong !== latest.current.selected) path.bringToBack();
            },
          });
        }}
      />
    </MapContainer>
  );
}
