// 서버 전용: 진단 지도에 찍을 실거래 건물 점. 좌표는 data/building_coords.csv (scripts/geocode_buildings.py 로 생성)
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { AREA_MAX } from "./calc";
import { loadListings } from "./listings";
import type { HousingType } from "./types";

export interface BuildingPoint {
  dong: string;
  housing_type: HousingType;
  /** 건물명 (없으면 도로명주소) */
  name: string;
  road_addr: string;
  lat: number;
  lng: number;
  /** 도로 중심 등 근사 위치 */
  approx: boolean;
  /** 가장 최근 신규 계약 */
  deposit: number;
  rent: number;
  contract_ym: string;
  /** 최근 1년 신규 계약 건수 */
  count: number;
}

type Coord = { lat: number; lng: number; approx: boolean };

function loadCoords(): Map<string, Coord> {
  const file = path.join(process.cwd(), "data", "building_coords.csv");
  if (!fs.existsSync(file)) return new Map();
  const rows = Papa.parse<Record<string, string>>(fs.readFileSync(file, "utf-8").replace(/^﻿/, ""), { header: true, skipEmptyLines: true }).data;
  const out = new Map<string, Coord>();
  for (const r of rows) {
    const lat = Number(r.lat);
    const lng = Number(r.lng);
    if (!r.lat || !r.road_addr?.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.set(`${r.dong}|${r.road_addr}`, { lat, lng, approx: r.precision === "none" });
  }
  return out;
}

/** 동 기준 주거비 C 와 같은 범위(신규 계약, 전용 AREA_MAX ㎡ 이하)의 건물별 최근 계약 */
export function loadBuildingPoints(): BuildingPoint[] {
  const coords = loadCoords();
  const groups = new Map<string, BuildingPoint>();
  for (const l of loadListings()) {
    if (l.is_new !== "Y" || l.area_m2 > AREA_MAX) continue;
    const c = coords.get(`${l.dong}|${l.road_addr}`);
    if (!c) continue;
    const key = `${l.dong}|${l.road_addr}|${l.housing_type}`;
    const ym = `${l.contract_ym}${l.contract_day.padStart(2, "0")}`;
    const g = groups.get(key);
    if (!g) {
      groups.set(key, {
        dong: l.dong,
        housing_type: l.housing_type,
        name: l.buildingIsAddress ? l.road_addr : l.building,
        road_addr: l.road_addr,
        ...c,
        deposit: l.deposit,
        rent: l.rent,
        contract_ym: ym,
        count: 1,
      });
    } else {
      g.count += 1;
      if (ym > g.contract_ym) Object.assign(g, { deposit: l.deposit, rent: l.rent, contract_ym: ym });
    }
  }
  return [...groups.values()];
}
