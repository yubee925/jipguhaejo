"use client";

import { useState, type ReactNode } from "react";
import { formatManwon } from "@/lib/format";
import { supportMissText } from "@/lib/policyText";
import type { CategoryCode, MatchResult, Policy } from "@/lib/types";
import AnimatedNumber from "./AnimatedNumber";
import type { Diagnosis } from "./AppProvider";
import CostBar from "./CostBar";
import PolicyApplyLink from "./PolicyApplyLink";

type Period = "월" | "연";

type Props = {
  diagnosis: Diagnosis;
  /** 헤더 표시용 (예: "광진구 화양동 · 오피스텔") */
  context: string;
  /** 전월세 전환율(%) */
  conversionRate: number;
};

const m1 = (v: number) => formatManwon(v, 1);
const m0 = (v: number) => formatManwon(v);

const CARD_KIND: Record<CategoryCode, string> = {
  RENT: "월세 지원",
  LOAN: "정책대출",
  INTEREST: "보증금 이자지원",
  REFUND: "초기 비용",
  HOUSING: "임대주택",
  BENEFIT: "복지급여",
};

/** 안내 카드(월 계산 제외) 한 줄 설명 */
function cardDetail(p: Policy): string {
  const parts: string[] = [];
  if (p.loan_limit != null) parts.push(`한도 ${m0(p.loan_limit)}`);
  if (p.loan_rate != null) parts.push(`금리 ${p.loan_rate}%`);
  if (p.benefit_lump != null) parts.push(`최대 ${m0(p.benefit_lump)} (1회)`);
  if (p.benefit_monthly != null && p.category_code !== "RENT") parts.push(`월 ${m0(p.benefit_monthly)}`);
  return parts.join(" · ");
}

function Bucket({ title, desc, tone, children }: { title: string; desc?: string; tone: "accent" | "muted" | "warn"; children: ReactNode }) {
  const color = tone === "accent" ? "text-accent" : tone === "warn" ? "text-amber-700" : "text-muted";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h4 className={`text-xs font-semibold ${color}`}>{title}</h4>
        {desc && <span className="text-[11px] text-muted">{desc}</span>}
      </div>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function PolicyRow({ m, right, note, highlight }: { m: MatchResult; right?: ReactNode; note?: ReactNode; highlight?: boolean }) {
  const p = m.policy;
  return (
    <li className={`flex flex-col gap-1 rounded-lg border p-3 text-xs ${highlight ? "border-accent/40 bg-accent-soft/50" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold leading-snug">{p.name}</span>
            {p.verify_needed && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800 ring-1 ring-amber-200">공고 재확인 필요</span>}
          </div>
          <div className="text-muted">
            {p.agency} · {CARD_KIND[p.category_code]}
          </div>
        </div>
        {right && <div className="shrink-0 whitespace-nowrap text-right font-semibold tabular-nums">{right}</div>}
      </div>
      {note && <div className="text-muted">{note}</div>}
      {m.eligible && m.warnings.filter((w) => w !== "공고 재확인 필요").length > 0 && (
        <div className="text-amber-700">확인 필요: {m.warnings.filter((w) => w !== "공고 재확인 필요").join(", ")}</div>
      )}
      <div className="mt-1">
        <PolicyApplyLink p={p} />
      </div>
    </li>
  );
}

export default function DetailPanel({ diagnosis: d, context, conversionRate }: Props) {
  const [period, setPeriod] = useState<Period>("월");

  const header = (
    <header className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h2 className="text-sm font-semibold tracking-tight">실질 주거비 진단 결과</h2>
        <span className="text-xs text-muted">{context}</span>
      </div>
      <div className="flex rounded-lg bg-background p-0.5 text-xs" role="group" aria-label="기간">
        {(["월", "연"] as const).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
            className={`h-7 w-10 rounded-md transition ${period === p ? "bg-surface font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.08)]" : "text-muted hover:text-foreground"}`}
          >
            {p}
          </button>
        ))}
      </div>
    </header>
  );

  if (!d.available) {
    return (
      <section className="flex flex-col rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        {header}
        <div className="p-6 text-center text-sm text-muted">이 동·주택유형의 신규 월세 거래가 없어 계산할 수 없습니다. 다른 동이나 유형을 골라 주세요.</div>
      </section>
    );
  }

  const C = d.base.C!;
  const by = (b: MatchResult["bucket"]) => d.matches.filter((x) => x.bucket === b);
  const supportOf = (id: string) => d.supports.find((s) => s.policyId === id);
  const confirmed = by("confirmed");
  const lottery = by("lottery");
  const nextYear = by("next_year");
  const cards = by("card");
  // 지원 0원일 때 월세 지원 정책별로 못 받는 이유
  const missed = d.matches
    .filter((x) => x.policy.category_code === "RENT" || x.policy.category_code === "BENEFIT")
    .map((x) => ({ name: x.policy.name, text: supportMissText(x, d.listing) }))
    .filter((x): x is { name: string; text: string } => x.text != null);

  return (
    <section className="flex flex-col rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      {header}
      <div className="flex flex-col gap-6 p-4">
        {/* 거래 건수 */}
        <div className={`rounded-lg px-3 py-2 text-xs ${d.base.lowSample ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200" : "bg-background text-muted"}`}>
          {d.base.lowSample
            ? `⚠ 신규 월세 거래가 ${d.base.count}건뿐이라 표본이 부족합니다. 결과를 참고용으로만 보세요.`
            : `최근 1년 신규 월세 거래 ${d.base.count}건의 환산 월세 중앙값 기준`}
        </div>

        {period === "월" ? (
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="rounded-lg bg-background px-4 py-3">
                <div className="text-xs text-muted">정책 적용 전 월 주거비</div>
                <AnimatedNumber value={C} format={m1} className="mt-1 block text-xl font-semibold text-muted line-through decoration-1" />
              </div>
              <span className="text-muted" aria-hidden>
                →
              </span>
              <div className="rounded-lg bg-accent-soft px-4 py-3">
                <div className="text-xs text-accent">정책 적용 후 월 주거비</div>
                <AnimatedNumber value={d.real} format={m1} className="mt-1 block text-2xl font-bold" />
              </div>
            </div>
            {d.S > 0 ? (
              <p className="-mt-3 text-xs text-positive">
                정책 지원으로 월 <AnimatedNumber value={d.S} format={m1} className="font-semibold" /> 절감 (절감률 {Math.round(d.savingRate)}%)
              </p>
            ) : (
              <div className="-mt-3 flex flex-col gap-1">
                <p className="text-xs text-muted">지금 바로 반영되는 월세 지원은 없습니다.</p>
                {missed.length > 0 && (
                  <ul aria-label="월세 지원을 받지 못하는 이유" className="flex flex-col gap-0.5 text-[11px] leading-relaxed text-muted">
                    {missed.map((x) => (
                      <li key={x.name} className="break-keep">
                        · <span className="font-medium">{x.name}</span>: {x.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* 환산 비용과 실제 현금 지출 구분 (교수님 리뷰 1-4-2) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border px-3 py-2">
                <div className="text-muted">매달 실제로 나가는 돈</div>
                <div className="mt-0.5 text-base font-semibold tabular-nums">{m1(Math.max(d.listing.rent - d.S, 0))}</div>
                <div className="text-[11px] text-muted">월세 − 지원금 (현금 지출)</div>
              </div>
              <div className="rounded-lg border border-border px-3 py-2">
                <div className="text-muted">보증금 환산분</div>
                <div className="mt-0.5 text-base font-semibold tabular-nums">{m1(Math.max(C - d.listing.rent, 0))}</div>
                <div className="text-[11px] text-muted">현금으로 나가진 않지만 보증금을 묶어 두는 비용</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-muted">비용 구성 (대표 매물: 월세 {m0(d.listing.rent)} · 보증금 {m0(d.listing.deposit)})</h3>
              <CostBar rent={d.listing.rent} depositCost={Math.max(C - d.listing.rent, 0)} support={d.S} format={m1} />
              <p className="text-[11px] leading-relaxed text-muted">
                동 기준 주거비 = 월세 + 보증금 × 연 {conversionRate}% ÷ 12 (거래별 환산 후 중앙값). 관리비 별도.
                {d.expectedRent != null && <> 내 보증금으로 계약하면 예상 월세는 월 {m1(d.expectedRent)}입니다.</>}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="rounded-lg bg-background px-4 py-3">
                <div className="text-xs text-muted">3년 누적 (지원 없음)</div>
                <AnimatedNumber value={d.yearly.withoutSupport} format={m0} className="mt-1 block text-xl font-semibold text-muted line-through decoration-1" />
              </div>
              <span className="text-muted" aria-hidden>
                →
              </span>
              <div className="rounded-lg bg-accent-soft px-4 py-3">
                <div className="text-xs text-accent">3년 누적 (정책 적용)</div>
                <AnimatedNumber value={d.yearly.total} format={m0} className="mt-1 block text-2xl font-bold" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm tabular-nums">
                <thead>
                  <tr className="text-xs text-muted">
                    <th className="py-2 text-left font-medium">연차</th>
                    <th className="py-2 text-right font-medium">지원 없음</th>
                    <th className="py-2 text-right font-medium">정책 적용</th>
                    <th className="py-2 text-right font-medium">절감</th>
                  </tr>
                </thead>
                <tbody>
                  {d.yearly.perYear.map((v, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-2">{i + 1}년차</td>
                      <td className="py-2 text-right text-muted">{m0(C * 12)}</td>
                      <td className="py-2 text-right font-semibold">{m0(v)}</td>
                      <td className="py-2 text-right text-positive">{C * 12 - v > 0.05 ? `−${m0(C * 12 - v)}` : "-"}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border font-semibold">
                    <td className="py-2">3년 합계</td>
                    <td className="py-2 text-right text-muted">{m0(d.yearly.withoutSupport)}</td>
                    <td className="py-2 text-right">{m0(d.yearly.total)}</td>
                    <td className="py-2 text-right text-positive">{d.yearly.saved > 0.05 ? `−${m0(d.yearly.saved)}` : "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="-mt-3 text-[11px] text-muted">지원 기간(개월)이 끝난 달부터는 지원금을 빼지 않습니다. 관리비 별도.</p>
          </>
        )}

        {/* 정책 카드: bucket 별 */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-semibold text-muted">내 조건으로 본 청년 주거정책</h3>
          {confirmed.length > 0 && (
            <Bucket title="지원 확정" desc="월 계산에 반영" tone="accent">
              {confirmed.map((x) => {
                const s = supportOf(x.policy.policy_id);
                return (
                  <PolicyRow
                    key={x.policy.policy_id}
                    m={x}
                    highlight={!!s}
                    right={s ? <>월 {m1(s.monthly)}</> : "중복으로 제외"}
                    note={x.policy.benefit_months ? `${x.policy.benefit_months}개월 지원` : undefined}
                  />
                );
              })}
            </Bucket>
          )}
          {lottery.length > 0 && (
            <Bucket title="선정 시" desc={`추첨 정책, 선정되면 실질 월 ${m1(d.scenarios.lottery)}`} tone="muted">
              {lottery.map((x) => (
                <PolicyRow key={x.policy.policy_id} m={x} right={x.policy.benefit_monthly != null ? <>월 {m1(x.policy.benefit_monthly)}</> : undefined} />
              ))}
            </Bucket>
          )}
          {nextYear.length > 0 && (
            <Bucket title="내년 신청 시" desc={`올해 모집 마감, 내년에 받으면 실질 월 ${m1(d.scenarios.nextYear)}`} tone="muted">
              {nextYear.map((x) => (
                <PolicyRow key={x.policy.policy_id} m={x} right={x.policy.benefit_monthly != null ? <>월 {m1(x.policy.benefit_monthly)}</> : undefined} />
              ))}
            </Bucket>
          )}
          {cards.length > 0 && (
            <Bucket title="대출·이자지원 등 안내" desc="월 계산 제외" tone="muted">
              {cards.map((x) => (
                <PolicyRow key={x.policy.policy_id} m={x} note={cardDetail(x.policy) || undefined} />
              ))}
            </Bucket>
          )}
        </div>

        <p className="border-t border-border pt-3 text-[11px] text-muted">예상 금액이며 최종 자격과 지원 금액은 공고 기준입니다. 관리비 별도.</p>
      </div>
    </section>
  );
}
