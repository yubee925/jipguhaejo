// 서버 전용: data/*.csv 를 읽는다.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Papa from "papaparse";
import { medianByDong } from "./stats";
import type { FeatureCollection, Polygon } from "geojson";
import type { DongFeatureProps, DongMedians, Policy, RentRecord } from "./types";

const DATA_DIR = join(process.cwd(), "data");

function loadCsv<T>(file: string): T[] {
  const text = readFileSync(join(DATA_DIR, file), "utf8");
  // dong_code는 앞자리 0 보존을 위해 문자열로 유지
  return Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: (field) => field !== "dong_code",
  }).data;
}

export const loadRentData = () => loadCsv<RentRecord>("rent_data.csv");
export const loadPolicyData = () => loadCsv<Policy>("policy_data.csv");

export const loadDongGeoJson = (): FeatureCollection<Polygon, DongFeatureProps> =>
  JSON.parse(readFileSync(join(DATA_DIR, "gangnam_dong.geojson"), "utf8"));

/** 동 × 계약유형별 보증금·월세 중앙값 */
export function computeDongMedians(records: RentRecord[]): DongMedians {
  const result: DongMedians = {};
  for (const type of ["전세", "월세"] as const) {
    const subset = records.filter((r) => r.contract_type === type);
    const deposits = medianByDong(subset, (r) => r.deposit);
    const rents = medianByDong(subset, (r) => r.monthly_rent);
    deposits.forEach(({ dong, median }, i) => {
      result[dong] ??= {} as DongMedians[string];
      result[dong][type] = { deposit: median, monthly_rent: rents[i].median };
    });
  }
  return result;
}
