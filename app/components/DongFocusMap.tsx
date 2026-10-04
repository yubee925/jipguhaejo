"use client";

import "leaflet/dist/leaflet.css";
import type { FeatureCollection, Polygon } from "geojson";
import L, { type Path, type PathOptions } from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, GeoJSON, MapContainer, Pane, Polygon as LeafletPolygon, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { BuildingPoint } from "@/lib/buildingPoints";
import { formatManwon } from "@/lib/format";
import type { DongFeatureProps } from "./AppProvider";
import { boundsOf, outsideMask } from "./DongMap";
import { POINT_CHEAP, POINT_PRICEY } from "./statusColors";

type Props = {
  geojson: FeatureCollection<Polygon, DongFeatureProps>;
  selected: string;
  /** 선택한 동을 칠할 색 */
  color: string;
  /** 선택한 동 라벨에 보일 실질 월 주거비(만원) */
  value: number;
  onSelect: (dong: string) => void;
  /** 선택한 동·주택유형의 실거래 건물 (신규 계약, 건물별 최근 계약) */
  points?: BuildingPoint[];
  /** 동 기준 주거비 C(만원). 점 색: 이하면 초록, 넘으면 빨강 */
  baseCost?: number | null;
  /** 전월세 전환율 r (0.05 형태) */
  rate?: number;
};


/** 같은 좌표(도로 중심 근사 등)에 겹치는 건물은 점 하나로 묶는다 */
function groupByCoord(points: BuildingPoint[]) {
  const m = new Map<string, BuildingPoint[]>();
  for (const p of points) {
    const k = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
    m.set(k, [...(m.get(k) ?? []), p]);
  }
  return [...m.values()];
}

const ym = (s: string) => `${s.slice(0, 4)}.${s.slice(4, 6)}`;

function PointMarkers({ points, baseCost, rate }: { points: BuildingPoint[]; baseCost: number | null; rate: number }) {
  const groups = useMemo(() => groupByCoord(points), [points]);
  const converted = (p: BuildingPoint) => p.rent + (p.deposit * rate) / 12;
  return (
    <Pane name="points" style={{ zIndex: 450 }}>
      {groups.map((g) => {
        const sorted = [...g].sort((a, b) => converted(a) - converted(b));
        const best = sorted[0];
        const cheap = baseCost == null || converted(best) <= baseCost;
        return (
          <CircleMarker
            key={`${best.lat},${best.lng}`}
            center={[best.lat, best.lng]}
            radius={g.length > 1 ? 6.5 : 5}
            pathOptions={{ color: "#ffffff", weight: 1.5, fillColor: cheap ? POINT_CHEAP : POINT_PRICEY, fillOpacity: 0.95 }}
          >
            <Tooltip direction="top" offset={[0, -4]} className="point-tip">
              <div className="flex flex-col gap-1">
                {sorted.slice(0, 4).map((p) => (
                  <div key={p.road_addr + p.name}>
                    <strong>{p.name}</strong>
                    <br />
                    보증금 {formatManwon(p.deposit)} / 월세 {formatManwon(p.rent)} · {ym(p.contract_ym)}
                    {p.count > 1 ? ` · 1년 ${p.count}건` : ""}
                  </div>
                ))}
                {g.length > 4 && <div>외 {g.length - 4}곳</div>}
                {best.approx && <div className="point-tip-note">위치는 도로 기준 근사</div>}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </Pane>
  );
}

const DIMMED: PathOptions = { fillColor: "#6b7280", fillOpacity: 0.3, color: "#ffffff", weight: 1, opacity: 1 };
const DIMMED_HOVER: PathOptions = { ...DIMMED, fillOpacity: 0.45, color: "#374151", weight: 1.5 };

const dongOf = (layer: L.Layer) => ((layer as L.Polygon).feature?.properties as DongFeatureProps).dong;
const labelHtml = (dong: string, value: number) => `<strong>${dong}</strong><br/><span>${formatManwon(value, 1)}</span>`;

/** 선택한 동으로 지도를 옮긴다(처음엔 바로, 이후엔 부드럽게) */
function FlyToDong({ geojson, selected }: { geojson: FeatureCollection<Polygon, DongFeatureProps>; selected: string }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    const feature = geojson.features.find((f) => f.properties.dong === selected);
    if (!feature) return;
    const b = L.geoJSON(feature).getBounds();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (first.current || reduce) {
      map.invalidateSize();
      map.fitBounds(b, { padding: [36, 36], animate: false });
      first.current = false;
    } else {
      map.flyToBounds(b, { padding: [36, 36], duration: 0.6 });
    }
  }, [map, geojson, selected]);
  return null;
}

/** 진단 페이지용: 선택한 동만 색칠하고 나머지 동은 회색으로 흐리게 */
export default function DongFocusMap({ geojson, selected, color, value, onSelect, points = [], baseCost = null, rate = 0.05 }: Props) {
  const district = useMemo(() => boundsOf(geojson), [geojson]);
  const mask = useMemo(() => outsideMask(geojson, district), [geojson, district]);
  const layerRef = useRef<L.GeoJSON | null>(null);

  const latest = useRef({ selected, color, onSelect });
  useEffect(() => {
    latest.current = { selected, color, onSelect };
  }, [selected, color, onSelect]);

  const styleFor = (dong: string, hover = false): PathOptions =>
    dong === latest.current.selected
      ? { fillColor: latest.current.color, fillOpacity: 0.7, color: "#111827", weight: 2, opacity: 1 }
      : hover
        ? DIMMED_HOVER
        : DIMMED;

  // 선택·색·금액이 바뀌면 스타일과 라벨 갱신 (선택한 동에만 라벨)
  useEffect(() => {
    const group = layerRef.current;
    if (!group) return;
    group.eachLayer((layer) => {
      const dong = dongOf(layer);
      (layer as Path).setStyle(styleFor(dong));
      if (dong === selected) {
        (layer as Path).bringToFront();
        if (layer.getTooltip()) layer.setTooltipContent(labelHtml(dong, value));
        else layer.bindTooltip(labelHtml(dong, value), { permanent: true, direction: "center", className: "dong-label" });
      } else if (layer.getTooltip()) {
        layer.unbindTooltip();
      }
    });
    // styleFor는 latest ref만 읽는다
  }, [selected, color, value]);

  return (
    <MapContainer
      bounds={district}
      maxBounds={district.pad(0.15)}
      maxBoundsViscosity={1}
      maxZoom={18}
      zoomSnap={0.25}
      scrollWheelZoom
      attributionControl
      className="dong-map h-full w-full rounded-lg"
    >
      <FlyToDong geojson={geojson} selected={selected} />
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        className="dong-map-tiles"
      />
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
          if (dong === selected) {
            layer.bindTooltip(labelHtml(dong, value), { permanent: true, direction: "center", className: "dong-label" });
          }
          layer.on({
            click: () => latest.current.onSelect(dong),
            mouseover: (e) => {
              if (dong !== latest.current.selected) (e.target as Path).setStyle(styleFor(dong, true));
            },
            mouseout: (e) => (e.target as Path).setStyle(styleFor(dong)),
          });
        }}
      />
      <PointMarkers points={points} baseCost={baseCost} rate={rate} />
    </MapContainer>
  );
}
