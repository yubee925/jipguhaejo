import { describe, expect, it } from "vitest";
import { computeDongMedians } from "../data";
import { costByDong } from "../evaluate";
import { rankClasses } from "../scale";
import { loadPolicyData, loadRentData } from "./fixtures";

describe("costByDong", () => {
  const medians = computeDongMedians(loadRentData());
  const profile = { age: 27, annualIncomeManwon: 3000 };

  it("동마다 중앙값 매물로 실질 주거비를 계산한다", () => {
    const result = costByDong(medians, "월세", profile, [], 0.045);
    expect(result.map((d) => d.dong)).toEqual(["광장동", "구의동", "군자동", "능동", "자양동", "중곡동", "화양동"]);
    for (const { listing, cost } of result) {
      expect(cost.monthly).toBeCloseTo(listing.monthly_rent + (listing.deposit * 0.045) / 12);
    }
  });

  it("정책을 넘기면 지원 후 금액이 지원 전보다 작거나 같다", () => {
    const without = costByDong(medians, "전세", profile, [], 0.045);
    const withPolicies = costByDong(medians, "전세", profile, loadPolicyData(), 0.045);
    withPolicies.forEach((d, i) => expect(d.cost.monthly).toBeLessThanOrEqual(without[i].cost.monthly));
  });
});

describe("rankClasses", () => {
  it("값 간격이 고르지 않아도 7개 동이 7개 색에 하나씩", () => {
    const values = { a: 50, b: 52, c: 55, d: 60, e: 61, f: 80, g: 120 };
    expect(rankClasses(values)).toEqual({ a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6 });
  });

  it("값이 같아도 서로 다른 색, 가나다순으로 앞선 동이 더 밝은 쪽", () => {
    // 샘플 월세 기준: 군자동·자양동 모두 81.7
    const values = { 능동: 29.2, 중곡동: 36.3, 구의동: 47.5, 자양동: 81.7, 군자동: 81.7, 광장동: 101.7, 화양동: 139.2 };
    const c = rankClasses(values);
    expect(c["군자동"]).toBe(3);
    expect(c["자양동"]).toBe(4);
    expect(new Set(Object.values(c)).size).toBe(7);
  });

  it("구간 수가 동 수보다 적으면 순위를 비율로 나눈다", () => {
    expect(rankClasses({ a: 1, b: 2, c: 3 }, 5)).toEqual({ a: 0, b: 2, c: 4 });
  });

  it("동이 하나면 가운데", () => {
    expect(rankClasses({ a: 5 })).toEqual({ a: 3 });
  });
});
