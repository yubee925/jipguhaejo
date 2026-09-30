// 서버 전용: data/ 폴더 파일을 읽어 타입으로 변환. (클라이언트 컴포넌트에서 import 금지)
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import type { Constants, Policy, RentRecord, CategoryCode, IncomeType } from "./types";

const DATA = path.join(process.cwd(), "data");

function readCsv(file: string): Record<string, string>[] {
  const text = fs.readFileSync(path.join(DATA, file), "utf-8").replace(/^﻿/, "");
  const out = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  return out.data;
}

const num = (v: string | undefined): number | null =>
  v == null || v.trim() === "" ? null : Number(v.replace(/,/g, ""));
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

export function loadPolicies(): Policy[] {
  return readCsv("policies.csv").map((x) => ({
    policy_id: x.policy_id,
    name: x.name ?? x.policy_name ?? "",
    agency: x.agency ?? "",
    level: x.level ?? "",
    min_age: num(x.min_age ?? x.age_min),
    max_age: num(x.max_age ?? x.age_max),
    residence: (x.residence ?? "none").trim() || "none",
    homeless_required: yn(x.homeless_required),
    independent_required: yn(x.independent_required),
    category_code: (x.category_code ?? "RENT").trim() as CategoryCode,
    income_type: ((x.income_type ?? "").trim() as IncomeType) || "",
    income_min: num(x.income_min),
    income_max: num(x.income_max),
    single_only: yn(x.single_only),
    asset_max: num(x.asset_max),
    parent_income_check: ((x.parent_income_check ?? "N").trim() || "N") as Policy["parent_income_check"],
    housing_type: ((x.housing_type ?? "NA").trim() || "NA") as Policy["housing_type"],
    deposit_max: num(x.deposit_max),
    rent_max: num(x.rent_max),
    benefit_monthly: num(x.benefit_monthly),
    benefit_months: num(x.benefit_months),
    benefit_lump: num(x.benefit_lump),
    loan_limit: num(x.loan_limit),
    loan_rate: num(x.loan_rate),
    exclusive_with: (x.exclusive_with ?? "").split("|").map((s) => s.trim()).filter(Boolean),
    apply_open: yn(x.apply_open),
    lottery: yn(x.lottery),
    verify_needed: yn(x.verify_needed),
    source_url: x.source_url ?? "",
    notes: x.notes ?? "",
  }));
}

/** 데이터에 있는 동 목록 (코드에 하드코딩하지 않음) */
export const listDongs = (rent: RentRecord[]) => [...new Set(rent.map((x) => x.dong))].sort();
