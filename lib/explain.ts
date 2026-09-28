// AI Agent 패널용: 선택 동의 계산 결과를 해설 문맥으로 묶고, 제한형(템플릿) 답변을 만든다.
import type { ParsedConditions } from "./conditions";
import { policyMonthlySupport, type CostBreakdown } from "./cost";
import { costByDong, evaluateListing, type DongCost } from "./evaluate";
import { formatManwon } from "./format";
import { policyRejectReason, type UserProfile } from "./policy";
import type { ContractType, DongMedians, Policy } from "./types";

export const SUGGESTED_QUESTIONS = [
  { id: "summary", label: "이 동의 실질 주거비를 요약해줘" },
  { id: "policy", label: "정책 지원은 어떻게 계산됐어?" },
  { id: "compare_type", label: "전세와 월세 중 뭐가 유리해?" },
  { id: "compare_dong", label: "다른 동과 비교하면 어때?" },
] as const;

export type QuestionId = (typeof SUGGESTED_QUESTIONS)[number]["id"];

export type ExplainContext = {
  dong: string;
  contractType: ContractType;
  profile: UserProfile;
  listing: { deposit: number; monthly_rent: number };
  annualRate: number;
  cost: CostBreakdown;
  policies: { policy: Policy; matched: boolean; applied: boolean; monthlySupport: number; reason: string | null }[];
  /** 이 동의 전세·월세 중앙값 매물 비교 */
  byType: Partial<Record<ContractType, DongCost>>;
  /** 같은 계약유형 중앙값 기준 동 순위(저렴한 순) */
  ranking: DongCost[];
};

export function buildExplainContext(
  input: ParsedConditions,
  data: { policies: Policy[]; dongMedians: DongMedians },
): ExplainContext {
  const { dong, contractType, profile, listing, annualRate } = input;
  const { cost } = evaluateListing(listing, profile, data.policies, annualRate);
  const appliedIds = new Set(cost.applied.map((p) => p.policy_id));

  const policies = data.policies.map((policy) => {
    const reason = policyRejectReason(profile, policy, listing);
    return {
      policy,
      matched: reason === null,
      applied: appliedIds.has(policy.policy_id),
      monthlySupport: reason === null ? policyMonthlySupport(listing, policy, annualRate) : 0,
      reason,
    };
  });

  const byType: ExplainContext["byType"] = {};
  for (const type of ["전세", "월세"] as const) {
    const found = costByDong(data.dongMedians, type, profile, data.policies, annualRate).find((d) => d.dong === dong);
    if (found) byType[type] = found;
  }

  const ranking = costByDong(data.dongMedians, contractType, profile, data.policies, annualRate).sort(
    (a, b) => a.cost.monthly - b.cost.monthly,
  );

  return { dong, contractType, profile, listing, annualRate, cost, policies, byType, ranking };
}

const m = (v: number) => formatManwon(v, 1);
const listingText = (l: { deposit: number; monthly_rent: number }) =>
  l.monthly_rent > 0 ? `보증금 ${formatManwon(l.deposit)} / 월세 ${formatManwon(l.monthly_rent)}` : `전세 ${formatManwon(l.deposit)}`;

/** 자유 질문을 추천 질문 유형으로 분류. 해당 없으면 null. */
export function detectIntent(question: string): QuestionId | null {
  const q = question.replace(/\s+/g, "");
  if (/전세.*월세|월세.*전세|유리|어느쪽|계약유형/.test(q)) return "compare_type";
  if (/다른동|비교|순위|제일싼|가장싼|저렴한동/.test(q)) return "compare_dong";
  if (/정책|지원|혜택|대출|이자/.test(q)) return "policy";
  if (/요약|얼마|주거비|비용|정리/.test(q)) return "summary";
  return null;
}

function summary(ctx: ExplainContext): string {
  const { cost } = ctx;
  const gross = cost.rent + cost.depositCost;
  const applied = ctx.policies.filter((p) => p.applied).map((p) => p.policy.policy_name);
  const rank = ctx.ranking.findIndex((d) => d.dong === ctx.dong) + 1;
  const lines = [
    `강남구 ${ctx.dong} ${ctx.contractType}(${listingText(ctx.listing)}) 기준 실질 월 주거비는 ${m(cost.monthly)}, 연 ${formatManwon(cost.annual)}입니다.`,
    "",
    `• 월세 ${m(cost.rent)} + 보증금 기회비용 ${m(cost.depositCost)}(연 ${(ctx.annualRate * 100).toFixed(1)}%) = 지원 전 ${m(gross)}`,
    cost.policySupport > 0
      ? `• 정책 지원 −${m(cost.policySupport)} (${applied.join(", ")})`
      : "• 현재 조건으로 반영되는 정책 지원은 없습니다.",
  ];
  if (rank > 0) {
    lines.push(`• ${ctx.contractType} 중앙값 매물 기준으로 강남구 ${ctx.ranking.length}개 동 중 ${rank}번째로 저렴한 동입니다.`);
  }
  return lines.join("\n");
}

function policy(ctx: ExplainContext): string {
  const matched = ctx.policies.filter((p) => p.matched);
  const rejected = ctx.policies.filter((p) => !p.matched);
  const lines: string[] = [];
  if (matched.length === 0) {
    lines.push("현재 조건으로 해당되는 정책이 없습니다.");
  } else {
    lines.push(`해당 정책 ${matched.length}건 중 유형별로 지원액이 가장 큰 1건씩 반영했습니다. 반영 합계는 월 ${m(ctx.cost.policySupport)}입니다.`, "");
    for (const p of matched) {
      const how =
        p.policy.support_type === "월세지원"
          ? `월 ${formatManwon(p.policy.support_amount_manwon)} 한도 내 월세 지원`
          : `보증금 중 최대 ${formatManwon(p.policy.support_amount_manwon)}에 대해 금리 차이만큼 절감`;
      lines.push(`• ${p.policy.policy_name}: 월 ${m(p.monthlySupport)} (${how})${p.applied ? " — 반영" : " — 같은 유형 중복이라 제외"}`);
    }
  }
  if (rejected.length > 0) {
    lines.push("", "해당되지 않은 정책:");
    for (const p of rejected) lines.push(`• ${p.policy.policy_name}: ${p.reason}`);
  }
  return lines.join("\n");
}

function compareType(ctx: ExplainContext): string {
  const j = ctx.byType["전세"];
  const w = ctx.byType["월세"];
  if (!j || !w) return `${ctx.dong}에는 전세·월세 중 한쪽 샘플이 없어 비교할 수 없습니다.`;
  const cheaper = j.cost.monthly <= w.cost.monthly ? j : w;
  const cheaperType = cheaper === j ? "전세" : "월세";
  const diff = Math.abs(j.cost.monthly - w.cost.monthly);
  return [
    `${ctx.dong} 중앙값 매물 기준으로는 ${cheaperType}가 월 ${m(diff)} 더 저렴합니다.`,
    "",
    `• 전세(${listingText(j.listing)}): 실질 월 ${m(j.cost.monthly)}`,
    `• 월세(${listingText(w.listing)}): 실질 월 ${m(w.cost.monthly)}`,
    "",
    `전세는 보증금 기회비용(연 ${(ctx.annualRate * 100).toFixed(1)}% 가정)이 곧 주거비라, 이율 가정이 오르면 전세가 불리해집니다. 두 중앙값 매물은 면적·유형이 다를 수 있습니다.`,
  ].join("\n");
}

function compareDong(ctx: ExplainContext): string {
  if (ctx.ranking.length === 0) return "비교할 동 데이터가 없습니다.";
  const cheapest = ctx.ranking[0];
  const current = ctx.ranking.find((d) => d.dong === ctx.dong);
  const lines = [`${ctx.contractType} 중앙값 매물·내 조건 기준 실질 월 주거비 순위입니다.`, ""];
  ctx.ranking.forEach((d, i) => lines.push(`${i + 1}. ${d.dong} ${m(d.cost.monthly)}${d.dong === ctx.dong ? " ← 선택" : ""}`));
  if (current && current.dong !== cheapest.dong) {
    lines.push("", `${cheapest.dong}으로 옮기면 월 ${m(current.cost.monthly - cheapest.cost.monthly)} 줄어듭니다.`);
  } else if (current) {
    lines.push("", `${ctx.dong}이 5개 동 중 가장 저렴합니다.`);
  }
  return lines.join("\n");
}

const TEMPLATES: Record<QuestionId, (ctx: ExplainContext) => string> = {
  summary,
  policy,
  compare_type: compareType,
  compare_dong: compareDong,
};

/** 제한형 응답: 질문 유형별 템플릿 답변. 유형을 모르면 요약 + 안내. */
export function templateAnswer(intent: QuestionId | null, ctx: ExplainContext): string {
  if (intent) return TEMPLATES[intent](ctx);
  return `${summary(ctx)}\n\n제한형 응답 모드에서는 추천 질문 범위(요약·정책·전세/월세·동 비교)만 답할 수 있습니다.`;
}

/** Claude에 넘길 계산 결과 요약(모든 수치는 서버에서 다시 계산한 값) */
export function contextToPrompt(ctx: ExplainContext): string {
  const { profile } = ctx;
  return [
    `지역: 서울 강남구 ${ctx.dong} / 계약유형: ${ctx.contractType} / 매물: ${listingText(ctx.listing)}`,
    `사용자: ${profile.age}세, 연 소득 ${formatManwon(profile.annualIncomeManwon)}${profile.isNewlywed ? ", 신혼부부" : ""}`,
    `기회비용 연이율: ${(ctx.annualRate * 100).toFixed(1)}%`,
    "",
    "[요약]",
    summary(ctx),
    "",
    "[정책]",
    policy(ctx),
    "",
    "[전세 vs 월세]",
    compareType(ctx),
    "",
    "[동 비교]",
    compareDong(ctx),
  ].join("\n");
}
