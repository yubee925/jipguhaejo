"use client";

import { useState } from "react";
import type { CostBreakdown } from "@/lib/cost";
import { policyMonthlySupport } from "@/lib/cost";
import { formatManwon } from "@/lib/format";
import type { Policy } from "@/lib/types";
import AnimatedNumber from "./AnimatedNumber";
import CostBar from "./CostBar";

type Period = "월" | "연";

type Props = {
  cost: CostBreakdown;
  matched: Policy[];
  listing: { deposit: number; monthly_rent: number };
  annualRate: number;
  /** 헤더 표시용 (예: "광진구 화양동 · 월세") */
  context: string;
};

export default function DetailPanel({ cost, matched, listing, annualRate, context }: Props) {
  const [period, setPeriod] = useState<Period>("월");
  const factor = period === "월" ? 1 : 12;
  const format = (v: number) => formatManwon(v * factor, period === "월" ? 1 : 0);

  const before = cost.rent + cost.depositCost;
  const appliedIds = new Set(cost.applied.map((p) => p.policy_id));
  const savingPct = before > 0 ? Math.round((cost.policySupport / before) * 100) : 0;

  return (
    <section className="flex flex-col rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
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

      <div className="flex flex-col gap-6 p-4">
        {/* 전/후 금액 */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="rounded-lg bg-background px-4 py-3">
            <div className="text-xs text-muted">지원 전 {period} 주거비</div>
            <AnimatedNumber value={before} format={format} className="mt-1 block text-xl font-semibold text-muted line-through decoration-1" />
          </div>
          <span className="text-muted" aria-hidden>
            →
          </span>
          <div className="rounded-lg bg-accent-soft px-4 py-3">
            <div className="text-xs text-accent">지원 후 {period} 주거비</div>
            <AnimatedNumber value={cost.monthly} format={format} className="mt-1 block text-2xl font-bold" />
          </div>
        </div>
        {cost.policySupport > 0 ? (
          <p className="-mt-3 text-xs text-positive">
            정책 지원으로 {period} <AnimatedNumber value={cost.policySupport} format={format} className="font-semibold" /> 절감 ({savingPct}%)
          </p>
        ) : (
          <p className="-mt-3 text-xs text-muted">적용 가능한 정책 지원이 없습니다.</p>
        )}

        {/* 비용 구성 */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-muted">비용 구성</h3>
          <CostBar rent={cost.rent} depositCost={cost.depositCost} support={cost.policySupport} format={format} />
          <p className="text-[11px] leading-relaxed text-muted">
            보증금 기회비용 = 보증금 × 연 {(annualRate * 100).toFixed(1)}% ÷ 12. 같은 유형의 정책은 지원액이 가장 큰 1건만 반영합니다.
          </p>
        </div>

        {/* 매칭 정책 */}
        <div className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-muted">
            매칭 정책 <span className="rounded-full bg-background px-2 py-0.5 tabular-nums">{matched.length}</span>
          </h3>
          {matched.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted">
              입력한 조건에 맞는 정책이 없습니다.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {matched.map((p) => {
                const applied = appliedIds.has(p.policy_id);
                const amount = policyMonthlySupport(listing, p, annualRate);
                return (
                  <li
                    key={p.policy_id}
                    className={`flex flex-col gap-2 rounded-lg border p-3 ${applied ? "border-accent/40 bg-accent-soft/50" : "border-border"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold leading-snug">{p.policy_name}</div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          applied ? "bg-accent text-white" : "bg-background text-muted"
                        }`}
                      >
                        {applied ? "✓ 적용" : "중복 제외"}
                      </span>
                    </div>
                    <div className="text-xs text-muted">
                      {p.provider} · {p.target} · {p.support_type}
                    </div>
                    <p className="text-xs leading-relaxed">{p.description}</p>
                    <div className="mt-auto flex items-baseline justify-between border-t border-border pt-2 text-xs">
                      <span className="text-muted">이 매물 기준 {period} 지원</span>
                      <AnimatedNumber value={amount} format={format} className="font-semibold" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
