import { describe, expect, it } from "vitest";
import { colorBuckets, convertedRent, dongBase, expectedRent, median, realMonthly, recognizedSupport, round2, yearlyCost } from "../calc";
import { compareDongs, diagnoseDong } from "../diagnose";
import { incomeOk, matchPolicy, pickSupports } from "../match";
import type { Constants, Policy, RentRecord, UserInput } from "../types";

const R = 0.05;
const K: Constants = { MEDIAN_1P: 256.4238, URBAN_1P: 381.3363, CONVERSION_RATE: 5 };

const rec = (o: Partial<RentRecord> = {}): RentRecord => ({
  dong: "화양동", housing_type: "officetel", area_m2: 20, contract_ym: "202609", deposit: 1000, rent: 55, is_new: "Y", ...o,
});

const pol = (o: Partial<Policy> = {}): Policy => ({
  policy_id: "P01", name: "청년월세", agency: "국토교통부", level: "national",
  min_age: 19, max_age: 34, residence: "none", homeless_required: true, independent_required: true,
  category_code: "RENT", income_type: "MEDIAN_PCT", income_min: null, income_max: 60,
  single_only: false, asset_max: null, parent_income_check: "N", housing_type: "RENT",
  deposit_max: 5000, rent_max: 70, benefit_monthly: 20, benefit_months: 24, benefit_lump: null,
  loan_limit: null, loan_rate: null, exclusive_with: [], apply_open: true, lottery: false,
  verify_needed: false, source_url: "", notes: "", ...o,
});

const user = (o: Partial<UserInput> = {}): UserInput => ({
  age: 27, monthlyIncome: 120, homeless: true, independent: true, single: true, housingType: "officetel", myDeposit: 1000, ...o,
});

describe("CLAUDE.md 검증 예시 (r = 5%)", () => {
  const C = convertedRent(55, 1000, R);

  it("월세 55, 보증금 1000 → C = 59.17", () => {
    expect(round2(C)).toBe(59.17);
  });

  it("RENT 정책 월 20 × 24개월 → 실질 월 39.17, 절감률 약 33.8%", () => {
    const { real, savingRate } = realMonthly(C, 20);
    expect(round2(real)).toBe(39.17);
    expect(savingRate).toBeCloseTo(33.8, 1);
  });

  it("1·2년차 각 470, 3년차 710, 3년 누적 1650 (지원 없으면 2130, 480 절감)", () => {
    const y = yearlyCost(C, [{ policyId: "P01", monthly: 20, months: 24 }]);
    expect(y.perYear.map((v) => Math.round(v))).toEqual([470, 470, 710]);
    expect(Math.round(y.total)).toBe(1650);
    expect(Math.round(y.withoutSupport)).toBe(2130);
    expect(Math.round(y.saved)).toBe(480);
  });
});

describe("calc", () => {
  it("median: 홀수·짝수·빈 배열", () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it("dongBase: 동·유형·면적·신규 조건, 표본 부족", () => {
    const rows = [rec({ rent: 50 }), rec({ rent: 60 }), rec({ rent: 70 }), rec({ rent: 999, is_new: "N" }), rec({ rent: 999, area_m2: 45 }), rec({ rent: 999, housing_type: "villa" })];
    const b = dongBase(rows, "화양동", "officetel", R);
    expect(b.count).toBe(3);
    expect(b.C).toBeCloseTo(60 + (1000 * R) / 12);
    expect(b.rentMedian).toBe(60);
    expect(b.lowSample).toBe(true);
  });

  it("인정 지원액은 실제 월세를 넘지 않는다", () => {
    expect(recognizedSupport(20, 15)).toBe(15);
    expect(recognizedSupport(20, 55)).toBe(20);
  });

  it("내 보증금 기준 예상 월세", () => {
    expect(expectedRent(59.17, 1000, R)).toBeCloseTo(55, 1);
  });

  it("지도 색: 하위 1/3 green, 중간 orange, 상위 1/3 red", () => {
    const c = colorBuckets([1, 2, 3, 4, 5, 6].map((v) => ({ dong: `d${v}`, value: v })));
    expect(Object.values(c)).toEqual(["green", "green", "orange", "orange", "red", "red"]);
  });
});

describe("match", () => {
  const listing = { deposit: 1000, rent: 55 };

  it("소득: MEDIAN_PCT / ANNUAL / URBAN_PCT", () => {
    expect(incomeOk(pol({ income_max: 60 }), user({ monthlyIncome: 150 }), K)).toBe(true); // 58.5%
    expect(incomeOk(pol({ income_max: 60 }), user({ monthlyIncome: 160 }), K)).toBe(false); // 62.4%
    expect(incomeOk(pol({ income_type: "ANNUAL", income_max: 5000 }), user({ monthlyIncome: 400 }), K)).toBe(true);
    expect(incomeOk(pol({ income_type: "URBAN_PCT", income_max: 100 }), user({ monthlyIncome: 390 }), K)).toBe(false);
    expect(incomeOk(pol({ income_type: "" }), user({ monthlyIncome: 9999 }), K)).toBe(true);
  });

  it("bucket: confirmed / lottery / next_year / card / ineligible", () => {
    expect(matchPolicy(pol(), user(), K, listing).bucket).toBe("confirmed");
    expect(matchPolicy(pol({ lottery: true }), user(), K, listing).bucket).toBe("lottery");
    expect(matchPolicy(pol({ apply_open: false }), user(), K, listing).bucket).toBe("next_year");
    expect(matchPolicy(pol({ category_code: "INTEREST" }), user(), K, listing).bucket).toBe("card");
    const no = matchPolicy(pol(), user({ age: 40, homeless: false }), K, listing);
    expect(no.bucket).toBe("ineligible");
    expect(no.reasons).toEqual(["만 34세 이하", "무주택"]);
  });

  it("부모 소득·재산·공고 재확인은 안내만", () => {
    const m = matchPolicy(pol({ parent_income_check: "COND", asset_max: 10000, verify_needed: true }), user(), K, listing);
    expect(m.eligible).toBe(true);
    expect(m.warnings).toEqual(["부모 소득 조건 확인 필요", "재산 10000만 원 이하 조건 확인", "공고 재확인 필요"]);
  });

  it("exclusive_with 로 묶인 정책은 총 지원액이 큰 1개만", () => {
    const a = matchPolicy(pol({ policy_id: "A", exclusive_with: ["B"] }), user(), K, listing);
    const b = matchPolicy(pol({ policy_id: "B", benefit_months: 12 }), user(), K, listing);
    const c = matchPolicy(pol({ policy_id: "C", benefit_monthly: 5, benefit_months: 10 }), user(), K, listing);
    expect(pickSupports([a, b, c], 55).map((s) => s.policyId)).toEqual(["A", "C"]);
  });
});

describe("diagnose", () => {
  const rows = [rec({ rent: 50 }), rec({ rent: 55 }), rec({ rent: 60 }), rec({ dong: "능동", rent: 40 })];

  it("diagnoseDong: 동 기준 주거비, 지원금, 연차별", () => {
    const d = diagnoseDong(user(), "화양동", rows, [pol()], K);
    expect(d.available).toBe(true);
    if (!d.available) return;
    expect(d.base.C).toBe(59.17);
    expect(d.S).toBe(20);
    expect(d.real).toBe(39.17);
    expect(d.yearly.perYear).toEqual([470, 470, 710]);
  });

  it("거래가 없으면 available = false", () => {
    expect(diagnoseDong(user({ housingType: "villa" }), "화양동", rows, [pol()], K).available).toBe(false);
  });

  it("compareDongs: 실질 월 주거비 오름차순 순위와 색", () => {
    const res = compareDongs(user(), ["화양동", "능동"], rows, [], K);
    expect(res.ranked.map((x) => [x.rank, x.dong])).toEqual([[1, "능동"], [2, "화양동"]]);
    expect(res.colors).toEqual({ 능동: "green", 화양동: "orange" });
  });
});
