// 정책 조건 표시 문구 (순수 함수). 정책 카드·탈락 사유·AI 해설이 모두 이 함수를 쓴다.
import { formatManwon } from "./format";
import type { Policy } from "./types";

/**
 * 하한·상한 → "○○ 이하" / "○○ 이상" / "○○~○○". 둘 다 없으면 null.
 * 하한이 0 이하이면 하한 없음으로 본다 ("0 이상"을 표시하지 않음).
 * unit 은 범위 끝에 한 번만 붙인다 (예: "48~150%").
 */
export function rangeText(min: number | null | undefined, max: number | null | undefined, fmt: (n: number) => string, unit = ""): string | null {
  const lo = min != null && min > 0 ? min : null;
  const hi = max ?? null;
  if (lo != null && hi != null) return `${fmt(lo)}~${fmt(hi)}${unit}`;
  if (hi != null) return `${fmt(hi)}${unit} 이하`;
  if (lo != null) return `${fmt(lo)}${unit} 이상`;
  return null;
}

const comma = (n: number) => n.toLocaleString("ko-KR");

const INCOME_PREFIX: Record<string, string> = {
  MEDIAN_PCT: "기준중위소득",
  URBAN_PCT: "도시근로자 월평균소득",
  ANNUAL: "연소득",
};

/** 소득 기준: "기준중위소득 60% 이하", "기준중위소득 48~150%", "연소득 5,000만원 이하", 없으면 "소득 기준 없음" */
export function incomeText(p: Pick<Policy, "income_type" | "income_min" | "income_max">): string {
  if (!p.income_type) return "소득 기준 없음";
  const range =
    p.income_type === "ANNUAL" ? rangeText(p.income_min, p.income_max, comma, "만원") : rangeText(p.income_min, p.income_max, String, "%");
  return range ? `${INCOME_PREFIX[p.income_type]} ${range}` : "소득 기준 없음";
}

/** 만원 금액 상한: "자산 1억 2,200만원 이하". 상한이 없으면 null */
export const amountMaxText = (label: string, max: number | null | undefined) => {
  const r = rangeText(null, max, formatManwon);
  return r ? `${label} ${r}` : null;
};

/** 정책 카드의 조건 목록 */
export function conditionParts(p: Policy): string[] {
  const parts: string[] = [];
  const age = rangeText(p.min_age, p.max_age, String, "세");
  if (age) parts.push(`만 ${age}`);
  parts.push(incomeText(p));
  if (p.homeless_required) parts.push("무주택");
  if (p.independent_required) parts.push("독립 거주");
  if (p.single_only) parts.push("1인 가구");
  if (p.marriage_req === "SINGLE") parts.push("미혼");
  if (p.marriage_req === "SINGLE_OR_NEWLYWED") parts.push("1인 가구 미혼 또는 신혼부부");
  if (p.residence === "seoul") parts.push("서울 주민등록");
  if (p.residence === "gwangjin") parts.push("광진구 주민등록");
  if (p.head_req) parts.push("세대주");
  if (p.special_req === "BASIC_BENEFIT_FAMILY") parts.push("기초생활수급 가구");
  if (p.housing_type === "JEONSE") parts.push("전세 전용");
  for (const t of [
    amountMaxText("자산", p.asset_max),
    amountMaxText("보증금", p.deposit_max),
    amountMaxText("월세", p.rent_max),
    p.area_max_m2 != null ? `전용 ${p.area_max_m2}㎡ 이하` : null,
  ])
    if (t) parts.push(t);
  return parts;
}
