// 정책 매칭 + 지원금 합산 (순수 함수). CLAUDE.md "소득 판정", "category_code 별 화면 처리" 기준.
import type { Constants, MatchResult, Policy, UserInput } from "./types";
import { recognizedSupport, type MonthlySupport } from "./calc";
import { amountMaxText, incomeText } from "./policyText";
import { EXTRA_RULES, PARENT_INCOME_NEEDED, SUPPORT_EXCLUSIVE } from "./policyRules";

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

/** 월 실질 주거비에서 차감하는 정책 종류 (BENEFIT 은 지급액 = min(실제 월세, benefit_monthly)) */
const MONTHLY_CATEGORIES = ["RENT", "BENEFIT"];

/**
 * 한 정책의 자격 판정. 규칙은 data/guide/guide_input_fields.md "판정 규칙" 기준.
 * listing: 대상 매물 (보증금·월세·면적). 매물 조건(deposit_max, rent_max, area_max_m2) 판정에 사용.
 * 사용자가 "모름"을 고른 값이 필요한 조건은 탈락이 아니라 warnings("확인 필요")로 남긴다.
 */
export function matchPolicy(
  p: Policy,
  u: UserInput,
  k: Constants,
  listing: { deposit: number; rent: number; area_m2?: number },
): MatchResult {
  // 전세 전용 정책은 월세 서비스에서 해당 없음
  if (p.housing_type === "JEONSE") {
    return { policy: p, eligible: false, reasons: ["전세 전용(월세 서비스)"], warnings: [], bucket: "na" };
  }

  const reasons: string[] = [];
  const warnings: string[] = [];
  const resident = u.resident ?? "GWANGJIN";
  const marital = u.marital ?? "SINGLE";

  if (p.min_age != null && u.age < p.min_age) reasons.push(`만 ${p.min_age}세 이상`);
  if (p.max_age != null && u.age > p.max_age) reasons.push(`만 ${p.max_age}세 이하`);
  if (p.residence === "seoul" && resident === "OTHER") reasons.push("서울 주민등록");
  if (p.residence === "gwangjin" && resident !== "GWANGJIN") reasons.push("광진구 주민등록");
  if (p.homeless_required && !u.homeless) reasons.push("무주택");
  if (p.independent_required && !u.independent) reasons.push("부모와 별도 거주");
  if (p.single_only && !u.single) reasons.push("1인 가구");
  if (p.marriage_req === "SINGLE" && marital !== "SINGLE") reasons.push("미혼");
  if (p.marriage_req === "SINGLE_OR_NEWLYWED" && !((marital === "SINGLE" && u.single) || marital === "NEWLYWED"))
    reasons.push("1인 가구 미혼 또는 신혼부부");
  if (p.head_req && u.houseHead === false) reasons.push("세대주");
  if (p.special_req === "BASIC_BENEFIT_FAMILY" && !u.basicBenefitFamily) reasons.push("기초생활수급 가구");
  if (!incomeOk(p, u, k)) reasons.push(`소득 기준(${incomeText(p)})`);
  if (p.deposit_max != null && listing.deposit > p.deposit_max)
    reasons.push(`${amountMaxText("보증금", p.deposit_max)} 매물`);
  if (p.rent_max != null && listing.rent > p.rent_max) reasons.push(`${amountMaxText("월세", p.rent_max)} 매물`);
  if (p.area_max_m2 != null && listing.area_m2 != null && listing.area_m2 > p.area_max_m2)
    reasons.push(`전용 ${p.area_max_m2}㎡ 이하 매물`);

  // 자산: 모르면 확인 필요
  if (p.asset_max != null) {
    const asset = amountMaxText("자산", p.asset_max);
    if (u.asset == null) warnings.push(`${asset} 확인 필요`);
    else if (u.asset > p.asset_max) reasons.push(asset!);
  }

  // 부모 포함 가구소득
  if (p.parent_income_check === "COND") {
    const rule = PARENT_INCOME_NEEDED[p.policy_id];
    if (!rule) warnings.push("부모 소득 조건 확인 필요");
    else if (rule(u, k)) {
      if (u.parentIncome === "OVER_100") reasons.push("부모 포함 가구소득 중위 100% 이하");
      else if (u.parentIncome !== "UNDER_100") warnings.push("부모 포함 가구소득(중위 100% 이하) 확인 필요");
    }
  } else if (p.parent_income_check === "Y" && p.special_req !== "BASIC_BENEFIT_FAMILY") {
    warnings.push("부모 소득 조건 확인 필요");
  }

  const extra = EXTRA_RULES[p.policy_id]?.(u, listing);
  if (extra) {
    reasons.push(...extra.reasons);
    warnings.push(...extra.warnings);
  }

  // 이미 받는 지원과 함께 못 받는 정책 제외
  for (const s of u.currentSupport ?? []) {
    if (s === p.policy_id) reasons.push("이미 받는 중");
    else if (p.exclusive_with.includes(s) || SUPPORT_EXCLUSIVE[s]?.includes(p.policy_id))
      reasons.push(`이미 받는 지원(${s})과 중복 불가`);
  }

  if (p.verify_needed) warnings.push("공고 재확인 필요");

  const eligible = reasons.length === 0;
  let bucket: MatchResult["bucket"];
  if (!eligible) bucket = "ineligible";
  else if (!MONTHLY_CATEGORIES.includes(p.category_code)) bucket = "card";
  else if (!p.apply_open) bucket = "next_year";
  else if (p.lottery) bucket = "lottery";
  else bucket = "confirmed";

  return { policy: p, eligible, reasons, warnings, bucket };
}

/**
 * 월 지원금 S 계산: 주어진 bucket 들의 RENT·BENEFIT 정책만 대상으로,
 * exclusive_with 충돌이 없는 모든 조합을 비교해 총지원액(월 × 개월)이 가장 큰 조합을 고른다.
 * (큰 것부터 하나씩 고르면 P01 480만원 하나 대신 P03+P12 682.8만원 같은 더 나은 조합을 놓친다)
 * 후보는 월세 지원 정책 몇 개뿐(현재 최대 4개 → 16가지)이라 전체 조합 비교로 충분하다.
 */
export function pickSupports(
  results: MatchResult[],
  actualRent: number,
  buckets: MatchResult["bucket"][] = ["confirmed"],
): MonthlySupport[] {
  const cands = results
    .filter((r) => buckets.includes(r.bucket) && MONTHLY_CATEGORIES.includes(r.policy.category_code))
    .map((r) => ({
      policyId: r.policy.policy_id,
      excl: r.policy.exclusive_with,
      monthly: recognizedSupport(r.policy.benefit_monthly ?? 0, actualRent),
      months: r.policy.benefit_months ?? 0,
    }))
    .sort((a, b) => b.monthly * b.months - a.monthly * a.months);

  const clash = (x: (typeof cands)[number], y: (typeof cands)[number]) =>
    x.excl.includes(y.policyId) || y.excl.includes(x.policyId);
  const total = (set: typeof cands) => set.reduce((a, x) => a + x.monthly * x.months, 0);

  let best: typeof cands = [];
  for (let mask = 1; mask < 1 << cands.length; mask++) {
    const set = cands.filter((_, i) => mask & (1 << i));
    if (set.some((x, i) => set.slice(i + 1).some((y) => clash(x, y)))) continue;
    // 총액이 같으면 먼저 찾은 조합(총액 큰 정책이 들어간 쪽)을 유지
    if (total(set) > total(best)) best = set;
  }
  return best.map(({ policyId, monthly, months }) => ({ policyId, monthly, months }));
}

export const sumMonthly = (s: MonthlySupport[]) => s.reduce((a, x) => a + x.monthly, 0);
