import { describe, expect, it } from "vitest";
import { parseConditions, type Conditions } from "../conditions";
import { computeDongMedians } from "../data";
import { buildExplainContext, detectIntent, templateAnswer } from "../explain";
import { loadPolicyData, loadRentData } from "./fixtures";

const data = { policies: loadPolicyData(), dongMedians: computeDongMedians(loadRentData()) };

const base: Conditions = {
  age: "27",
  annualIncome: "3000",
  isNewlywed: false,
  dong: "화양동",
  contractType: "월세",
  deposit: "1000",
  monthlyRent: "50",
  annualRatePct: "4.5",
};

describe("parseConditions", () => {
  it("문자열 입력을 숫자로, 음수·빈칸은 0으로", () => {
    const p = parseConditions({ ...base, age: "", deposit: "-5", annualRatePct: "3" });
    expect(p.profile.age).toBe(0);
    expect(p.listing.deposit).toBe(0);
    expect(p.annualRate).toBeCloseTo(0.03);
  });

  it("전세면 월세는 0", () => {
    expect(parseConditions({ ...base, contractType: "전세" }).listing.monthly_rent).toBe(0);
  });
});

describe("detectIntent", () => {
  it.each([
    ["전세랑 월세 중 어디가 나아?", "compare_type"],
    ["다른 동이랑 비교해줘", "compare_dong"],
    ["받을 수 있는 지원금은?", "policy"],
    ["한 달에 얼마 들어?", "summary"],
    ["날씨 어때?", null],
  ])("%s → %s", (q, expected) => {
    expect(detectIntent(q)).toBe(expected);
  });
});

describe("buildExplainContext / templateAnswer", () => {
  const ctx = buildExplainContext(parseConditions(base), data);

  it("계산 결과가 evaluateListing과 같다", () => {
    // 월세 50 + 1000×4.5%/12=3.75 − 월세지원 20 − 이자지원 1000×2.5%/12≈2.08
    expect(ctx.cost.monthly).toBeCloseTo(50 + 3.75 - 20 - 25 / 12);
  });

  it("정책마다 해당 여부와 사유를 가진다", () => {
    const newlywed = ctx.policies.find((p) => p.policy.policy_id === "P003");
    expect(newlywed?.matched).toBe(false);
    expect(newlywed?.reason).toBe("신혼부부 대상");
    expect(ctx.policies.filter((p) => p.applied)).toHaveLength(2);
  });

  it("동 순위는 광진구 7개 동, 저렴한 순", () => {
    expect(ctx.ranking).toHaveLength(7);
    const values = ctx.ranking.map((d) => d.cost.monthly);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });

  it("템플릿 답변에 핵심 수치가 들어간다", () => {
    expect(templateAnswer("summary", ctx)).toContain("광진구 화양동");
    expect(templateAnswer("policy", ctx)).toContain("신혼부부 임차보증금 이자지원: 신혼부부 대상");
    expect(templateAnswer("compare_type", ctx)).toMatch(/전세|월세/);
    expect(templateAnswer("compare_dong", ctx)).toContain("← 선택");
    expect(templateAnswer(null, ctx)).toContain("제한형 응답 모드");
  });
});
