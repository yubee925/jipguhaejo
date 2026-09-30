// 서버 전용: 추천에 쓰는 실거래 사례를 읽는다 (data.ts 의 loadRent 보다 표시용 컬럼이 많다).
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import type { Listing } from "./recommend";

export function loadListings(): Listing[] {
  const text = fs.readFileSync(path.join(process.cwd(), "data", "rent_gwangjin_clean.csv"), "utf-8").replace(/^﻿/, "");
  const rows = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data;
  return rows
    .filter((x) => (x.lease_type ?? "RENT") === "RENT")
    .map((x, i) => ({
      id: i,
      dong: x.dong,
      housing_type: x.housing_type as Listing["housing_type"],
      building: x.building ?? "",
      /** 건물명이 원래 없어 도로명으로 채운 경우 */
      buildingIsAddress: (x.building_source ?? "") === "ROAD_ADDR",
      road_addr: x.road_addr ?? "",
      jibun: x.jibun ?? "",
      area_m2: Number(x.area_m2),
      floor: Number(x.floor),
      built_year: Number(x.built_year),
      contract_ym: x.contract_ym ?? "",
      contract_day: x.contract_day ?? "",
      deposit: Number(x.deposit),
      rent: Number(x.rent),
      is_new: (x.is_new ?? "") as Listing["is_new"],
    }))
    .filter((x) => Number.isFinite(x.deposit) && Number.isFinite(x.rent) && Number.isFinite(x.area_m2));
}
