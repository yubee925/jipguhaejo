// 서버 전용: data/ 폴더 파일을 읽어 타입으로 변환. (클라이언트 컴포넌트에서 import 금지)
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { INDEPENDENT_POLICY_IDS, LOTTERY_POLICY_IDS } from "./policyRules";
import type { Constants, Policy, RentRecord, CategoryCode, IncomeType } from "./types";

const DATA = path.join(process.cwd(), "data");

function readCsv(file: string): Record<string, string>[] {
  const text = fs.readFileSync(path.join(DATA, file), "utf-8").replace(/^﻿/, "");
  const out = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  return out.data;
}

/** 빈칸·NONE(해당 없음/제한 없음)은 null. 숫자로 변환하지 않는다 */
const num = (v: string | undefined): number | null => {
  const t = (v ?? "").trim();
  return t === "" || t.toUpperCase() === "NONE" ? null : Number(t.replace(/,/g, ""));
};
/** NONE 은 빈 문자열로 */
const str = (v: string | undefined) => {
  const t = (v ?? "").trim();
  return t.toUpperCase() === "NONE" ? "" : t;
};
const yn = (v: string | undefined) => (v ?? "").trim().toUpperCase() === "Y";

export function loadConstants(): Constants {
  const k: Record<string, number> = {};
  for (const row of readCsv("constants.csv")) {
    const v = num(row.value);
    if (row.key && v != null) k[row.key.trim()] = v;
  }
  for (const need of ["MEDIAN_1P", "URBAN_1P", "CONVERSION_RATE"]) {
    if (k[need] == null) throw new Error(`constants.csv 에 ${need} 가 없습니다`);
  }
  return k as Constants;
}

/** r (0.05 형태) */
export const rate = (k: Constants) => k.CONVERSION_RATE / 100;

export function loadRent(): RentRecord[] {
  return readCsv("rent_gwangjin_clean.csv")
    .filter((x) => (x.lease_type ?? "RENT") === "RENT")
    .map((x) => ({
      dong: x.dong,
      housing_type: x.housing_type as RentRecord["housing_type"],
      area_m2: Number(x.area_m2),
      contract_ym: x.contract_ym,
      deposit: Number(x.deposit),
      rent: Number(x.rent),
      is_new: (x.is_new ?? "") as RentRecord["is_new"],
    }))
    .filter((x) => Number.isFinite(x.deposit) && Number.isFinite(x.rent));
}

// 열 이름은 2026-10 최종본(data/guide/guide_policies.md) 기준, 예전 이름도 읽는다
export function loadPolicies(): Policy[] {
  return readCsv("policies.csv").map((x) => {
    const id = x.policy_id.trim();
    const residentReq = str(x.resident_req ?? x.residence).toLowerCase();
    return {
      policy_id: id,
      name: x.name ?? x.policy_name ?? "",
      agency: str(x.agency ?? x.portal),
      level: str(x.level ?? x.region),
      min_age: num(x.age_min ?? x.min_age),
      max_age: num(x.age_max ?? x.max_age),
      residence: residentReq || "none",
      // 무주택은 전 정책 공통 조건 (guide_input_fields.md)
      homeless_required: x.homeless_required == null ? true : yn(x.homeless_required),
      independent_required: x.independent_required == null ? INDEPENDENT_POLICY_IDS.includes(id) : yn(x.independent_required),
      category_code: (str(x.category_code) || "RENT") as CategoryCode,
      income_type: (str(x.income_type) as IncomeType) || "",
      income_min: num(x.income_min),
      income_max: num(x.income_max),
      single_only: yn(x.single_only),
      asset_max: num(x.asset_max),
      parent_income_check: (str(x.parent_income_check) || "N") as Policy["parent_income_check"],
      housing_type: (str(x.housing_type) || "NA") as Policy["housing_type"],
      deposit_max: num(x.deposit_max),
      rent_max: num(x.rent_max),
      area_max_m2: num(x.area_max_m2),
      benefit_monthly: num(x.benefit_monthly),
      benefit_months: num(x.benefit_months),
      benefit_lump: num(x.benefit_lump),
      loan_limit: num(x.loan_limit),
      loan_rate: num(x.loan_rate),
      exclusive_with: str(x.exclusive_with).split("|").map((s) => s.trim()).filter(Boolean),
      apply_open: yn(x.apply_open),
      lottery: yn(x.lottery) || LOTTERY_POLICY_IDS.includes(id),
      verify_needed: yn(x.verify_needed),
      source_url: str(x.source_url),
      notes: str(x.notes ?? x.note),
      marriage_req: (str(x.marriage_req) || "ANY") as Policy["marriage_req"],
      job_req: str(x.job_req) || "ANY",
      head_req: yn(x.head_req),
      special_req: (str(x.special_req) || "NONE") as Policy["special_req"],
    };
  });
}

/** 데이터에 있는 동 목록 (코드에 하드코딩하지 않음) */
export const listDongs = (rent: RentRecord[]) => [...new Set(rent.map((x) => x.dong))].sort();
