import { describe, expect, it } from "vitest";
import { amountMaxText, incomeText, rangeText, supportMissText } from "../policyText";
import type { MatchResult, Policy } from "../types";

const inc = (income_type: "MEDIAN_PCT" | "URBAN_PCT" | "ANNUAL" | "", income_min: number | null, income_max: number | null) =>
  incomeText({ income_type, income_min, income_max });

describe("소득 기준 표시", () => {
  it("하한 0 또는 빈칸 + 상한 → 이하만", () => {
    expect(inc("MEDIAN_PCT", 0, 60)).toBe("기준중위소득 60% 이하");
    expect(inc("MEDIAN_PCT", null, 60)).toBe("기준중위소득 60% 이하");
    expect(inc("URBAN_PCT", 0, 120)).toBe("도시근로자 월평균소득 120% 이하");
  });
  it("하한만 → 이상", () => expect(inc("MEDIAN_PCT", 48, null)).toBe("기준중위소득 48% 이상"));
  it("둘 다, 하한 > 0 → 범위", () => expect(inc("MEDIAN_PCT", 48, 150)).toBe("기준중위소득 48~150%"));
  it("둘 다 비어 있거나 유형 없음 → 소득 기준 없음", () => {
    expect(inc("MEDIAN_PCT", null, null)).toBe("소득 기준 없음");
    expect(inc("MEDIAN_PCT", 0, null)).toBe("소득 기준 없음");
    expect(inc("", null, null)).toBe("소득 기준 없음");
  });
  it("연소득은 만원 단위, 천 단위 쉼표", () => {
    expect(inc("ANNUAL", 0, 5000)).toBe("연소득 5,000만원 이하");
    expect(inc("ANNUAL", 1200, 5000)).toBe("연소득 1,200~5,000만원");
  });
});

describe("금액 표시에 '0 이상' 없음", () => {
  it("rangeText", () => {
    expect(rangeText(0, null, String)).toBeNull();
    expect(rangeText(0, 0, String)).toBe("0 이하");
  });
  it("자산 상한", () => {
    expect(amountMaxText("자산", 12200)).toBe("자산 1억 2,200만원 이하");
    expect(amountMaxText("자산", null)).toBeNull();
  });
});

describe("월세 지원을 못 받는 이유 한 줄", () => {
  const mr = (o: Partial<MatchResult>): MatchResult => ({
    policy: { policy_id: "PX", name: "테스트", benefit_monthly: 20 } as Policy,
    eligible: true, reasons: [], warnings: [], bucket: "confirmed", ...o,
  });
  it("내년 신청 → 접수 마감 + 월 지원액", () =>
    expect(supportMissText(mr({ bucket: "next_year" }))).toBe("올해 접수 마감 → 내년 신청하면 월 20만원"));
  it("추첨 → 선정되면 월 지원액", () => expect(supportMissText(mr({ bucket: "lottery" }))).toBe("추첨 선정 → 선정되면 월 20만원"));
  it("탈락 → reasons 그대로, 환산 합계 경고만 덧붙임", () => {
    const m = mr({
      eligible: false, bucket: "ineligible", reasons: ["월세 60만원 이하 매물"],
      warnings: ["자산 1억 3,000만원 이하 확인 필요", "보증금·월세 환산 합계 90만원 이하인지 확인 필요"],
    });
    expect(supportMissText(m)).toBe("조건 미충족: 월세 60만원 이하 매물 (단, 보증금·월세 환산 합계 90만원 이하인지 확인 필요)");
    expect(supportMissText(mr({ eligible: false, bucket: "ineligible", reasons: ["기초생활수급 가구", "소득 기준(기준중위소득 48% 이하)"] }))).toBe(
      "조건 미충족: 기초생활수급 가구, 소득 기준(기준중위소득 48% 이하)",
    );
  });
  it("확정 지원·해당 없음 → null", () => {
    expect(supportMissText(mr({}))).toBeNull();
    expect(supportMissText(mr({ bucket: "na" }))).toBeNull();
  });
});
