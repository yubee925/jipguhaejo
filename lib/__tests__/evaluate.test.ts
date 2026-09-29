import { describe, expect, it } from "vitest";
import { computeDongMedians } from "../data";
import { costByDong } from "../evaluate";
import { rankClass } from "../scale";
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

describe("rankClass", () => {
  it("값 간격이 고르지 않아도 7개 동이 7개 색에 하나씩", () => {
    const values = [50, 52, 55, 60, 61, 80, 120];
    expect(values.map((v) => rankClass(v, values))).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("입력 순서와 무관", () => {
    const values = [155.8, 75.8, 117.5, 91.7, 101.7];
    expect(values.map((v) => rankClass(v, values, 5))).toEqual([4, 0, 3, 1, 2]);
  });

  it("같은 값은 같은 구간, 값이 하나뿐이면 가운데", () => {
    const values = [10, 10, 20];
    expect(rankClass(10, values)).toBe(0);
    expect(rankClass(20, values)).toBe(6);
    expect(rankClass(5, [5, 5])).toBe(3);
  });
});
