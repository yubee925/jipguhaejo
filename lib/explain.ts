// AI 도우미용: diagnoseDong·compareDongs 결과를 해설 문맥으로 묶고, 제한형(템플릿) 답변을 만든다.
// AI는 숫자를 계산하지 않는다. 여기서 만든 수치만 넘긴다.
import { HOUSING_TYPE_LABEL, JOB, MARITAL, RESIDENT } from "./conditions";
import { compareDongs, diagnoseDong } from "./diagnose";
import { formatManwon } from "./format";
import { isRentSumWarning } from "./policyRules";
import { DISTRICT } from "./region";
import type { Constants, HousingType, MatchResult, Policy, RentRecord, UserInput } from "./types";

export const SUGGESTED_QUESTIONS = [
  { id: "summary", label: "이 동의 실질 주거비를 요약해줘" },
  { id: "policy", label: "받을 수 있는 정책은 뭐야?" },
  { id: "compare_type", label: "오피스텔과 연립·다세대 중 뭐가 나아?" },
  { id: "compare_dong", label: "다른 동과 비교하면 어때?" },
] as const;

export type QuestionId = (typeof SUGGESTED_QUESTIONS)[number]["id"];

type Diagnosis = ReturnType<typeof diagnoseDong>;
type Available = Extract<Diagnosis, { available: true }>;
type Ranked = ReturnType<typeof compareDongs>["ranked"];

export type ExplainContext = {
  u: UserInput;
  dong: string;
  k: Constants;
  diagnosis: Diagnosis;
  /** 같은 동의 주택유형별 진단 */
  byType: Record<HousingType, Diagnosis>;
  /** 같은 유형 기준 동 순위 */
  ranking: Ranked;
};

export function buildExplainContext(
  u: UserInput,
  dong: string,
  data: { rent: RentRecord[]; policies: Policy[]; k: Constants; dongs: string[] },
): ExplainContext {
  const { rent, policies, k, dongs } = data;
  const byType = {
    officetel: diagnoseDong({ ...u, housingType: "officetel" }, dong, rent, policies, k),
    villa: diagnoseDong({ ...u, housingType: "villa" }, dong, rent, policies, k),
  };
  return { u, dong, k, diagnosis: byType[u.housingType], byType, ranking: compareDongs(u, dongs, rent, policies, k).ranked };
}

const m = (v: number) => formatManwon(v, 1);
const typeLabel = (t: HousingType) => HOUSING_TYPE_LABEL[t];

/** 자유 질문을 추천 질문 유형으로 분류. 해당 없으면 null. */
export function detectIntent(question: string): QuestionId | null {
  const q = question.replace(/\s+/g, "");
  if (/오피스텔|빌라|연립|다세대|주택유형|유형/.test(q)) return "compare_type";
  if (/다른동|비교|순위|제일싼|가장싼|저렴한동/.test(q)) return "compare_dong";
  if (/정책|지원|혜택|대출|이자|자격/.test(q)) return "policy";
  if (/요약|얼마|주거비|비용|정리/.test(q)) return "summary";
  return null;
}

const sampleLine = (d: Available) =>
  d.base.lowSample ? `거래 ${d.base.count}건뿐이라 표본이 부족합니다` : `신규 월세 거래 ${d.base.count}건 기준`;

const byBucket = (d: Available, b: MatchResult["bucket"]) => d.matches.filter((x) => x.bucket === b);
const nameOf = (d: Available, id: string) => d.matches.find((x) => x.policy.policy_id === id)?.policy.name ?? id;

function summary(ctx: ExplainContext): string {
  const d = ctx.diagnosis;
  const place = `${DISTRICT} ${ctx.dong} ${typeLabel(ctx.u.housingType)}`;
  if (!d.available) return `${place} 월세 거래가 없어 계산할 수 없습니다.`;
  const rank = ctx.ranking.find((x) => x.dong === ctx.dong)?.rank;
  const r = ctx.k.CONVERSION_RATE;
  const lines = [
    `${place}의 실질 월 주거비는 ${m(d.real)}입니다(${sampleLine(d)}).`,
    "",
    `• 동 기준 주거비 ${m(d.base.C!)} = 대표 매물 월세 ${m(d.listing.rent)} + 대표 매물 보증금 ${formatManwon(d.listing.deposit)}의 환산분(연 ${r}%)`,
    d.S > 0
      ? `• 정책 지원 −${m(d.S)} (${d.supports.map((s) => nameOf(d, s.policyId)).join(", ")}), 절감률 ${Math.round(d.savingRate)}%`
      : "• 지금 바로 반영되는 월세 지원은 없습니다.",
    `• 3년 누적 ${formatManwon(d.yearly.total)} (지원 없으면 ${formatManwon(d.yearly.withoutSupport)})`,
  ];
  if (rank) lines.push(`• ${typeLabel(ctx.u.housingType)} 기준 ${DISTRICT} ${ctx.ranking.length}개 동 중 ${rank}번째로 저렴합니다.`);
  lines.push("", "관리비는 계산에 포함되지 않았고, 예상 금액이며 최종 자격은 공고 기준입니다.");
  return lines.join("\n");
}

function policy(ctx: ExplainContext): string {
  const d = ctx.diagnosis;
  if (!d.available) return summary(ctx);
  const lines: string[] = [];
  const confirmed = byBucket(d, "confirmed");
  lines.push(confirmed.length ? "지원 확정:" : "지금 바로 반영되는 월세 지원은 없습니다.");
  for (const x of confirmed) lines.push(`• ${x.policy.name}: 월 ${m(x.policy.benefit_monthly ?? 0)}${x.policy.benefit_months ? `, ${x.policy.benefit_months}개월` : ""}`);
  const lottery = byBucket(d, "lottery");
  if (lottery.length) lines.push("", `선정 시(추첨): ${lottery.map((x) => x.policy.name).join(", ")} → 실질 월 ${m(d.scenarios.lottery)}`);
  const next = byBucket(d, "next_year");
  if (next.length) lines.push("", `내년 신청 시: ${next.map((x) => x.policy.name).join(", ")} → 실질 월 ${m(d.scenarios.nextYear)}`);
  const card = byBucket(d, "card");
  if (card.length) lines.push("", `안내(월 계산 제외): ${card.map((x) => x.policy.name).join(", ")}`);
  const no = byBucket(d, "ineligible");
  if (no.length) {
    lines.push("", "해당되지 않은 정책:");
    for (const x of no) lines.push(`• ${x.policy.name}: ${x.reasons.join(", ")}`);
  }
  const na = byBucket(d, "na");
  if (na.length) lines.push("", `전세 전용이라 해당 없음: ${na.map((x) => x.policy.name).join(", ")}`);
  const warnings = [
    ...new Set([
      ...d.matches.filter((x) => x.eligible).flatMap((x) => x.warnings),
      // 탈락했어도 환산 합계 예외로 신청 가능할 수 있는 정책
      ...d.matches.filter((x) => !x.eligible).flatMap((x) => x.warnings.filter(isRentSumWarning).map((w) => `${x.policy.name} ${w}`)),
    ]),
  ];
  if (warnings.length) lines.push("", `확인 필요: ${warnings.join(", ")}`);
  return lines.join("\n");
}

function compareType(ctx: ExplainContext): string {
  const o = ctx.byType.officetel;
  const v = ctx.byType.villa;
  if (!o.available || !v.available) return `${ctx.dong}에는 한쪽 유형의 월세 거래가 없어 비교할 수 없습니다.`;
  const cheaper = o.real <= v.real ? "오피스텔" : "연립·다세대";
  return [
    `${ctx.dong}에서는 ${cheaper}이 실질 월 ${m(Math.abs(o.real - v.real))} 더 저렴합니다.`,
    "",
    `• 오피스텔: 실질 월 ${m(o.real)} (${sampleLine(o)})`,
    `• 연립·다세대: 실질 월 ${m(v.real)} (${sampleLine(v)})`,
    "",
    "관리비는 계산에 포함되지 않았습니다.",
  ].join("\n");
}

function compareDong(ctx: ExplainContext): string {
  if (!ctx.ranking.length) return "비교할 동 데이터가 없습니다.";
  const cheapest = ctx.ranking[0];
  const current = ctx.ranking.find((x) => x.dong === ctx.dong);
  const lines = [`${typeLabel(ctx.u.housingType)}·내 조건 기준 실질 월 주거비 순위입니다.`, ""];
  for (const x of ctx.ranking)
    lines.push(`${x.rank}. ${x.dong} ${m(x.real)}${x.base.lowSample ? " (표본 부족)" : ""}${x.dong === ctx.dong ? " ← 선택" : ""}`);
  if (current && current.dong !== cheapest.dong) lines.push("", `${cheapest.dong}으로 옮기면 월 ${m(current.real - cheapest.real)} 줄어듭니다.`);
  else if (current) lines.push("", `${current.dong}이 가장 저렴합니다.`);
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
  return `${summary(ctx)}\n\n제한형 응답 모드에서는 추천 질문 범위(요약·정책·주택유형 비교·동 비교)만 답할 수 있습니다.`;
}

/** Claude에 넘길 계산 결과 요약(모든 수치는 서버에서 diagnoseDong으로 다시 계산한 값) */
export function contextToPrompt(ctx: ExplainContext): string {
  const { u } = ctx;
  const pct = Math.round((u.monthlyIncome / ctx.k.MEDIAN_1P) * 100);
  const d = ctx.diagnosis;
  return [
    `지역: 서울 ${DISTRICT} ${ctx.dong} / 주택유형: ${typeLabel(u.housingType)}`,
    // 대표 매물 보증금과 사용자 보유 보증금을 AI가 섞지 않도록 이름을 분명히 붙인다
    d.available
      ? `동 대표 매물(중앙값 기준): 월세 ${m(d.listing.rent)}, 보증금 ${formatManwon(d.listing.deposit)}`
      : "동 대표 매물(중앙값 기준): 거래 없음",
    `사용자 보유 보증금: ${u.myDeposit != null ? formatManwon(u.myDeposit) : "미입력"} (실질 주거비 계산에는 쓰지 않음, 예상 월세 계산에만 사용)`,
    `사용자: 만 ${u.age}세, 월소득 ${formatManwon(u.monthlyIncome)}(기준중위소득 ${pct}%), ${u.homeless ? "무주택" : "유주택"}, ${u.independent ? "독립거주" : "부모와 거주"}, ${u.single ? "1인 가구" : "2인 이상 가구"}`,
    // 취업 상태는 판정에 쓰지 않고 설명 문구 맞춤에만 쓴다 (input_fields.csv)
    `혼인: ${MARITAL.find((o) => o.value === u.marital)?.label ?? "미혼"} / 취업: ${JOB.find((o) => o.value === u.job)?.label ?? "-"} / 주민등록지: ${RESIDENT.find((o) => o.value === u.resident)?.label ?? "광진구"}`,
    `전월세 전환율: 연 ${ctx.k.CONVERSION_RATE}%`,
    "",
    "[요약]",
    summary(ctx),
    "",
    "[정책]",
    policy(ctx),
    "",
    "[주택유형 비교]",
    compareType(ctx),
    "",
    "[동 비교]",
    compareDong(ctx),
  ].join("\n");
}
