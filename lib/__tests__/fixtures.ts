import type { Policy, RentRecord } from "../types";

export function makePolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    policy_id: "T001",
    policy_name: "테스트 정책",
    provider: "서울특별시",
    target: "청년",
    age_min: 19,
    age_max: 39,
    income_limit_manwon: 5000,
    support_type: "월세지원",
    support_amount_manwon: 20,
    support_period_months: 12,
    max_deposit_manwon: 0,
    max_monthly_rent_manwon: 0,
    region: "서울특별시",
    description: "",
    ...overrides,
  };
}

export function makeRecord(overrides: Partial<RentRecord> = {}): RentRecord {
  return {
    id: "R0001",
    sigungu: "광진구",
    dong: "화양동",
    dong_code: "1121510700",
    building_type: "오피스텔",
    contract_type: "월세",
    deposit: 1000,
    monthly_rent: 80,
    area_m2: 30,
    floor: 5,
    built_year: 2015,
    contract_date: "2026-01-01",
    lat: 37.543,
    lng: 127.069,
    ...overrides,
  };
}

export { loadPolicyData, loadRentData } from "../data";
