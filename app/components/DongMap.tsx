"use client";

import "leaflet/dist/leaflet.css";
import type { FeatureCollection, Polygon } from "geojson";
import L, { type LatLngBounds, type Path, type PathOptions } from "leaflet";
import { useEffect, useMemo } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import { formatManwon } from "@/lib/format";
import type { DongFeatureProps } from "@/lib/types";

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
const PAN_MARGIN = 0.2;
/** 처음 맞춘 줌보다 이만큼까지만 축소 허용 */
const ZOOM_OUT_LIMIT = 0.5;
const MAX_ZOOM = 17;

const STROKE = { base: "#ffffff", hover: "#374151", selected: "#111827" };

function boundsOf(geojson: FeatureCollection<Polygon>): LatLngBounds {
  return L.geoJSON(geojson).getBounds();
}

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

  const styleFor = (dong: string, hover = false): PathOptions => ({
    fillColor: fills[dong] ?? "#e5e7eb",
    fillOpacity: 0.55,
    color: dong === selected ? STROKE.selected : hover ? STROKE.hover : STROKE.base,
    weight: dong === selected ? 2 : hover ? 2 : 1,
    opacity: 1,
  });

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
      {/* 값·선택이 바뀌면 다시 그려 툴팁과 스타일을 갱신 */}
      <GeoJSON
        key={`${selected}|${JSON.stringify(values)}`}
        data={geojson}
        style={(f) => styleFor(f?.properties.dong)}
        eventHandlers={{
          // 선택된 동의 테두리가 이웃 폴리곤에 가리지 않게 맨 위로
          add: (e) =>
            (e.target as L.GeoJSON).eachLayer((l) => {
              if ((l as L.Polygon).feature?.properties.dong === selected) (l as Path).bringToFront();
            }),
        }}
        onEachFeature={(feature, layer) => {
          const { dong } = feature.properties as DongFeatureProps;
          const value = values[dong];
          layer.bindTooltip(
            `<strong>${dong}</strong><br/><span>${value === undefined ? "-" : formatManwon(value, 1)}</span>`,
            { permanent: true, direction: "center", className: "dong-label" },
          );
          layer.on({
            click: () => onSelect(dong),
            mouseover: (e) => {
              const path = e.target as Path;
              path.setStyle(styleFor(dong, true));
              path.bringToFront();
            },
            mouseout: (e) => {
              const path = e.target as Path;
              path.setStyle(styleFor(dong));
              if (dong !== selected) path.bringToBack();
            },
          });
        }}
      />
    </MapContainer>
  );
}
