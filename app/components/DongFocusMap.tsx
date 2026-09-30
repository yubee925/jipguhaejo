"use client";

import "leaflet/dist/leaflet.css";
import type { FeatureCollection, Polygon } from "geojson";
import L, { type Path, type PathOptions } from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { GeoJSON, MapContainer, Polygon as LeafletPolygon, TileLayer, useMap } from "react-leaflet";
import { formatManwon } from "@/lib/format";
import type { DongFeatureProps } from "./AppProvider";
import { boundsOf, outsideMask } from "./DongMap";

type Props = {
  geojson: FeatureCollection<Polygon, DongFeatureProps>;
  selected: string;
  /** 선택한 동을 칠할 색 */
  color: string;
  /** 선택한 동 라벨에 보일 실질 월 주거비(만원) */
  value: number;
  onSelect: (dong: string) => void;
};

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
export default function DongFocusMap({ geojson, selected, color, value, onSelect }: Props) {
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
      maxZoom={17}
      zoomSnap={0.25}
      scrollWheelZoom={false}
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
    </MapContainer>
  );
}
