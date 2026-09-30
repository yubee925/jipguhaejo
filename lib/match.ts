// 정책 매칭 + 지원금 합산 (순수 함수). CLAUDE.md "소득 판정", "category_code 별 화면 처리" 기준.
import type { Constants, MatchResult, Policy, UserInput } from "./types";
import { recognizedSupport, type MonthlySupport } from "./calc";

export function incomeOk(p: Policy, u: UserInput, k: Constants): boolean {
  if (!p.income_type) return true;
  let v: number;
  if (p.income_type === "MEDIAN_PCT") v = (u.monthlyIncome / k.MEDIAN_1P) * 100;
  else if (p.income_type === "URBAN_PCT") v = (u.monthlyIncome / k.URBAN_1P) * 100;
  else v = u.monthlyIncome * 12; // ANNUAL (만원)
  if (p.income_min != null && v < p.income_min) return false;
  if (p.income_max != null && v > p.income_max) return false;
  return true;
}

/**
 * 한 정책의 자격 판정.
 * listing: 해당 동의 대표 매물 (보증금·월세). 매물 조건(deposit_max, rent_max) 판정에 사용.
 */
export function matchPolicy(
  p: Policy,
  u: UserInput,
  k: Constants,
  listing: { deposit: number; rent: number },
): MatchResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const res = u.residence ?? { seoul: true, gwangjin: true };

  if (p.min_age != null && u.age < p.min_age) reasons.push(`만 ${p.min_age}세 이상`);
  if (p.max_age != null && u.age > p.max_age) reasons.push(`만 ${p.max_age}세 이하`);
  if (p.residence === "seoul" && !res.seoul) reasons.push("서울 거주");
  if (p.residence === "gwangjin" && !res.gwangjin) reasons.push("광진구 거주");
  if (p.homeless_required && !u.homeless) reasons.push("무주택");
  if (p.independent_required && !u.independent) reasons.push("부모와 별도 거주");
  if (p.single_only && !u.single) reasons.push("1인 가구");
  if (!incomeOk(p, u, k)) reasons.push("소득 기준 초과");
  if (p.deposit_max != null && listing.deposit > p.deposit_max)
    reasons.push(`보증금 ${p.deposit_max}만 원 이하 매물`);
  if (p.rent_max != null && listing.rent > p.rent_max) reasons.push(`월세 ${p.rent_max}만 원 이하 매물`);

  if (p.parent_income_check !== "N") warnings.push("부모 소득 조건 확인 필요");
  if (p.asset_max != null) warnings.push(`재산 ${p.asset_max}만 원 이하 조건 확인`);
  if (p.verify_needed) warnings.push("공고 재확인 필요");

  const eligible = reasons.length === 0;
  let bucket: MatchResult["bucket"];
  if (!eligible) bucket = "ineligible";
  else if (p.category_code !== "RENT") bucket = "card";
  else if (!p.apply_open) bucket = "next_year";
  else if (p.lottery) bucket = "lottery";
  else bucket = "confirmed";

  return { policy: p, eligible, reasons, warnings, bucket };
}

/**
 * 월 지원금 S 계산: 주어진 bucket 들의 RENT 정책만 대상으로,
 * exclusive_with 로 묶인 정책끼리는 총 지원액이 큰 1개만 남긴다.
 */
export function pickSupports(
  results: MatchResult[],
  actualRent: number,
  buckets: MatchResult["bucket"][] = ["confirmed"],
): MonthlySupport[] {
  const cands = results
    .filter((r) => buckets.includes(r.bucket) && r.policy.category_code === "RENT")
    .map((r) => ({
      policyId: r.policy.policy_id,
      excl: r.policy.exclusive_with,
      monthly: recognizedSupport(r.policy.benefit_monthly ?? 0, actualRent),
      months: r.policy.benefit_months ?? 0,
    }))
    .sort((a, b) => b.monthly * b.months - a.monthly * a.months);

  const chosen: typeof cands = [];
  for (const c of cands) {
    const clash = chosen.some((x) => x.excl.includes(c.policyId) || c.excl.includes(x.policyId));
    if (!clash) chosen.push(c);
  }
  return chosen.map(({ policyId, monthly, months }) => ({ policyId, monthly, months }));
}

export const sumMonthly = (s: MonthlySupport[]) => s.reduce((a, x) => a + x.monthly, 0);
