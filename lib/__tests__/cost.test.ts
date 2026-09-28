import { describe, expect, it } from "vitest";
import { calcHousingCost, policyMonthlySupport } from "../cost";
import { makePolicy } from "./fixtures";

describe("calcHousingCost", () => {
  it("월세 + 보증금 × 4.5% / 12 (정책 없음)", () => {
    // 1000 × 0.045 / 12 = 3.75
    const c = calcHousingCost({ deposit: 1000, monthly_rent: 80 });
    expect(c.depositCost).toBeCloseTo(3.75);
    expect(c.policySupport).toBe(0);
    expect(c.applied).toEqual([]);
    expect(c.monthly).toBeCloseTo(83.75);
    expect(c.annual).toBeCloseTo(1005);
  });

  it("전세는 보증금 기회비용만 남는다", () => {
    // 20000 × 0.045 / 12 = 75
    const c = calcHousingCost({ deposit: 20000, monthly_rent: 0 });
    expect(c.monthly).toBeCloseTo(75);
    expect(c.annual).toBeCloseTo(900);
  });

  it("연이율을 바꿀 수 있다", () => {
    const c = calcHousingCost({ deposit: 12000, monthly_rent: 0 }, { annualRate: 0.03 });
    expect(c.monthly).toBeCloseTo(30);
  });

  it("월세지원 정책을 차감한다", () => {
    const policies = [makePolicy({ support_type: "월세지원", support_amount_manwon: 20 })];
    const c = calcHousingCost({ deposit: 1000, monthly_rent: 50 }, { policies });
    expect(c.policySupport).toBe(20);
    expect(c.monthly).toBeCloseTo(33.75);
  });

  it("이자지원은 지원 한도 내 보증금에 금리 차이만큼 차감한다", () => {
    // min(30000, 20000) × (0.045 − 0.02) / 12 = 41.666…
    const policies = [makePolicy({ support_type: "이자지원", support_amount_manwon: 20000 })];
    const c = calcHousingCost({ deposit: 30000, monthly_rent: 0 }, { policies });
    expect(c.depositCost).toBeCloseTo(112.5);
    expect(c.policySupport).toBeCloseTo(41.6667, 3);
    expect(c.monthly).toBeCloseTo(70.8333, 3);
  });

  it("같은 유형은 가장 큰 1건만, 월세지원과 보증금 정책은 합산한다", () => {
    const policies = [
      makePolicy({ policy_id: "A", support_type: "이자지원", support_amount_manwon: 10000 }),
      makePolicy({ policy_id: "B", support_type: "대출", support_amount_manwon: 20000 }),
      makePolicy({ policy_id: "C", support_type: "월세지원", support_amount_manwon: 10 }),
      makePolicy({ policy_id: "D", support_type: "월세지원", support_amount_manwon: 20 }),
    ];
    // 보증금 정책 최대: 20000 × 0.025 / 12 = 41.666…, 월세지원 최대: 20
    const c = calcHousingCost({ deposit: 20000, monthly_rent: 100 }, { policies });
    expect(c.policySupport).toBeCloseTo(61.6667, 3);
    expect(c.applied.map((p) => p.policy_id)).toEqual(["D", "B"]);
  });

  it("지원액이 비용보다 커도 주거비는 0 미만이 되지 않는다", () => {
    const policies = [makePolicy({ support_type: "월세지원", support_amount_manwon: 20 })];
    const c = calcHousingCost({ deposit: 0, monthly_rent: 15 }, { policies });
    expect(c.policySupport).toBe(15);
    expect(c.monthly).toBe(0);
    expect(c.annual).toBe(0);
  });
});

describe("policyMonthlySupport", () => {
  it("월세지원은 월세를 넘지 않는다", () => {
    const p = makePolicy({ support_type: "월세지원", support_amount_manwon: 20 });
    expect(policyMonthlySupport({ deposit: 500, monthly_rent: 12 }, p)).toBe(12);
  });

  it("정책 금리가 기회비용 이율보다 높으면 0", () => {
    const p = makePolicy({ support_type: "대출", support_amount_manwon: 10000 });
    expect(policyMonthlySupport({ deposit: 10000, monthly_rent: 0 }, p, 0.02, 0.03)).toBe(0);
  });
});
