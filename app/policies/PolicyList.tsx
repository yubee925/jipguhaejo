"use client";

import Link from "next/link";
import { formatManwon } from "@/lib/format";
import { conditionParts } from "@/lib/policyText";
import type { CategoryCode, MatchResult, Policy } from "@/lib/types";
import { useApp } from "../components/AppProvider";

const LEVEL: Record<string, string> = { national: "전국", seoul: "서울시", gu: "광진구" };
const CATEGORY: Record<CategoryCode, string> = {
  RENT: "월세 지원",
  LOAN: "정책대출",
  INTEREST: "보증금 이자지원",
  REFUND: "초기 비용",
  HOUSING: "임대주택",
  BENEFIT: "복지급여",
};
const BUCKET: Record<MatchResult["bucket"], { label: string; tone: string }> = {
  confirmed: { label: "✓ 지원 확정", tone: "bg-accent-soft text-accent" },
  lottery: { label: "선정 시", tone: "bg-accent-soft text-accent" },
  next_year: { label: "내년 신청 시", tone: "bg-background text-muted" },
  card: { label: "안내", tone: "bg-background text-muted" },
  ineligible: { label: "해당 안 됨", tone: "bg-background text-muted" },
  na: { label: "전세 전용", tone: "bg-background text-muted" },
};

function supportText(p: Policy) {
  const parts: string[] = [];
  if (p.benefit_monthly != null) parts.push(`월 ${formatManwon(p.benefit_monthly)}${p.benefit_months ? ` × ${p.benefit_months}개월` : ""}`);
  if (p.benefit_lump != null) parts.push(`최대 ${formatManwon(p.benefit_lump)} (1회)`);
  if (p.loan_limit != null) parts.push(`대출 한도 ${formatManwon(p.loan_limit)}`);
  if (p.loan_rate != null) parts.push(`금리 ${p.loan_rate}%`);
  return parts.join(" · ") || "-";
}

function conditionText(p: Policy) {
  return conditionParts(p).join(" · ");
}

export default function PolicyList() {
  const { policies, diagnosis } = useApp();
  // 해당 여부는 선택한 동의 진단(대표 매물 기준) 결과를 그대로 쓴다
  const matchOf = (id: string) => (diagnosis.available ? diagnosis.matches.find((m) => m.policy.policy_id === id) : undefined);
  const byId = Object.fromEntries(policies.map((p) => [p.policy_id, p.name]));

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted ring-1 ring-border">
        해당 여부는{" "}
        <Link href="/diagnosis" className="font-semibold text-accent hover:underline">
          주거비 진단
        </Link>
        에 입력한 조건과 선택한 동의 대표 매물 기준입니다. &ldquo;공고 재확인 필요&rdquo; 표시가 있는 정책은 공고를 꼭 확인하세요.
      </p>

      <ul className="grid gap-4 md:grid-cols-2">
        {policies.map((p) => {
          const m = matchOf(p.policy_id);
          const badge = m ? BUCKET[m.bucket] : null;
          return (
            <li key={p.policy_id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted">
                    {LEVEL[p.level] ?? p.level} · {p.agency} · {CATEGORY[p.category_code]}
                  </div>
                  <h2 className="mt-1 text-base font-bold leading-snug">{p.name}</h2>
                  {p.verify_needed && (
                    <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800 ring-1 ring-amber-200">공고 재확인 필요</span>
                  )}
                </div>
                {badge && <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.tone}`}>{badge.label}</span>}
              </div>

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl bg-background p-3 text-xs">
                <dt className="text-muted">지원</dt>
                <dd className="font-medium">{supportText(p)}</dd>
                <dt className="text-muted">조건</dt>
                <dd className="font-medium">{conditionText(p)}</dd>
                <dt className="text-muted">선정·신청</dt>
                <dd className="font-medium">
                  {p.lottery ? "추첨 선정" : "자격 충족 시 지원"} · {p.apply_open ? "신청 가능" : "올해 모집 마감"}
                </dd>
                {p.exclusive_with.length > 0 && (
                  <>
                    <dt className="text-muted">중복 불가</dt>
                    <dd className="font-medium">{p.exclusive_with.map((id) => byId[id] ?? id).join(", ")}</dd>
                  </>
                )}
              </dl>

              <div className="flex flex-col gap-1 text-xs">
                {m && !m.eligible && <span className="text-muted">탈락 사유: {m.reasons.join(", ")}</span>}
                {m && m.eligible && m.warnings.filter((w) => w !== "공고 재확인 필요").length > 0 && (
                  <span className="text-amber-700">확인 필요: {m.warnings.filter((w) => w !== "공고 재확인 필요").join(", ")}</span>
                )}
                {p.notes && <span className="text-muted">{p.notes}</span>}
                {p.source_url ? (
                  <a href={p.source_url} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">
                    신청·공고 보기 →
                  </a>
                ) : (
                  <span className="text-muted">공고 링크 준비 중</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
