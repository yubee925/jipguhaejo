import { describe, expect, it } from "vitest";
import { recommend, type Listing } from "../recommend";
import type { Constants, Policy, UserInput } from "../types";

const K: Constants = { MEDIAN_1P: 256.4238, URBAN_1P: 381.3363, CONVERSION_RATE: 5 };

let seq = 0;
const lst = (o: Partial<Listing> = {}): Listing => ({
  id: seq++, dong: "화양동", housing_type: "officetel", building: "A빌", buildingIsAddress: false,
  road_addr: "능동로 1", jibun: "1-1", area_m2: 20, floor: 3, built_year: 2015,
  contract_ym: "202609", contract_day: "01", deposit: 1000, rent: 55, is_new: "Y", ...o,
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
  age: 27, monthlyIncome: 120, homeless: true, independent: true, single: true, housingType: "officetel", myDeposit: 2000, ...o,
});

describe("recommend", () => {
  it("정책 지원 반영 실질 월 주거비가 낮은 순", () => {
    const cheapButNoSupport = lst({ road_addr: "가", rent: 45, deposit: 1000 }); // 49.17, 월세 상한 70 이하 → 지원 20 → 29.17
    const pricey = lst({ road_addr: "나", rent: 80, deposit: 1000 }); // 83.33, 월세 상한 초과 → 지원 없음
    const mid = lst({ road_addr: "다", rent: 60, deposit: 0 }); // 60 → 지원 20 → 40
    const { items } = recommend([pricey, mid, cheapButNoSupport], user(), [pol()], K);
    expect(items.map((x) => x.listing.road_addr)).toEqual(["가", "다", "나"]);
    expect(items[0].S).toBe(20);
    expect(items[0].real).toBe(29.17);
    expect(items[2].S).toBe(0);
  });

  it("같은 건물은 최근 계약 1건으로 묶고 건수를 센다", () => {
    const { items, buildings } = recommend(
      [lst({ contract_ym: "202601", rent: 50 }), lst({ contract_ym: "202609", rent: 60 }), lst({ road_addr: "다른", rent: 70 })],
      user(),
      [],
      K,
    );
    expect(buildings).toBe(2);
    const a = items.find((x) => x.listing.road_addr === "능동로 1")!;
    expect(a.contracts).toBe(2);
    expect(a.listing.rent).toBe(60);
  });

  it("필터: 주택유형·신규·동·보유 보증금·면적·월 상한", () => {
    const pool = [
      lst({ road_addr: "ok" }),
      lst({ road_addr: "villa", housing_type: "villa" }),
      lst({ road_addr: "renew", is_new: "N" }),
      lst({ road_addr: "otherdong", dong: "능동" }),
      lst({ road_addr: "bigdeposit", deposit: 5000 }),
      lst({ road_addr: "big", area_m2: 45 }),
    ];
    expect(recommend(pool, user(), [], K, { dong: "화양동" }).items.map((x) => x.listing.road_addr)).toEqual(["ok"]);
    expect(recommend(pool, user(), [], K, { withinDeposit: false, dong: "화양동" }).items).toHaveLength(2);
    expect(recommend(pool, user(), [], K, { maxMonthly: 50 }).items).toHaveLength(0);
  });

  it("추첨·내년 신청 정책까지 받으면 더 줄어드는 금액", () => {
    const { items } = recommend([lst()], user(), [pol(), pol({ policy_id: "P03", lottery: true, benefit_monthly: 10, benefit_months: 10 })], K);
    expect(items[0].S).toBe(20);
    expect(items[0].extraIfSelected).toBe(10);
  });

  it("동 시세의 절반 미만인 특수 계약은 기본으로 빼고 건수를 센다", () => {
    const pool = [
      lst({ road_addr: "a", rent: 60 }),
      lst({ road_addr: "b", rent: 62 }),
      lst({ road_addr: "c", rent: 64 }),
      lst({ road_addr: "public", rent: 7, deposit: 1317 }), // 환산 12.5 < 시세(약 66) × 0.5
    ];
    const res = recommend(pool, user(), [], K);
    expect(res.unusual).toBe(1);
    expect(res.items.map((x) => x.listing.road_addr)).not.toContain("public");
    expect(recommend(pool, user(), [], K, { includeUnusual: true }).items.map((x) => x.listing.road_addr)).toContain("public");
  });

  it("보유 보증금 0원이면 보증금 0원 매물만, 미입력이면 보증금 필터 없음 (교수님 리뷰 2-3)", () => {
    const pool = [lst({ road_addr: "zero", deposit: 0 }), lst({ road_addr: "some", deposit: 500 })];
    const names = (u: UserInput) => recommend(pool, u, [], K).items.map((x) => x.listing.road_addr).sort();
    expect(names(user({ myDeposit: 0 }))).toEqual(["zero"]);
    expect(names(user({ myDeposit: undefined }))).toEqual(["some", "zero"]);
    expect(names(user({ myDeposit: 500 }))).toEqual(["some", "zero"]);
  });
});
