"use client";

import type { ReactNode } from "react";
import { formatManwon } from "@/lib/format";
import type { Conditions } from "@/lib/conditions";
import type { DongMedians } from "@/lib/types";
import Card from "./Card";

export type { Conditions };

type Props = {
  value: Conditions;
  onChange: (next: Conditions) => void;
  dongMedians: DongMedians;
  /** 동 변경(해당 동 중앙값으로 입력값 교체) */
  onDongChange: (dong: string) => void;
};

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm tabular-nums outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:bg-background disabled:text-muted";

function Field({ label, unit, children }: { label: string; unit?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="relative">
        {children}
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{unit}</span>
        )}
      </div>
    </label>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-flow-col auto-cols-fr rounded-lg bg-background p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          aria-pressed={value === opt}
          onClick={() => onChange(opt)}
          className={`h-8 rounded-md text-sm transition ${
            value === opt ? "bg-surface font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.08)]" : "text-muted hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function ConditionForm({ value, onChange, dongMedians, onDongChange }: Props) {
  const set = <K extends keyof Conditions>(key: K, v: Conditions[K]) => onChange({ ...value, [key]: v });
  const isJeonse = value.contractType === "전세";
  const median = dongMedians[value.dong]?.[value.contractType];

  const applyMedian = () => {
    if (!median) return;
    onChange({ ...value, deposit: String(median.deposit), monthlyRent: String(median.monthly_rent) });
  };

  return (
    <Card title="조건 입력" subtitle="금액 단위: 만원" className="flex-1">
      <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">내 정보</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label="나이" unit="세">
              <input type="number" inputMode="numeric" min={0} className={inputClass} value={value.age} onChange={(e) => set("age", e.target.value)} />
            </Field>
            <Field label="연 소득" unit="만원">
              <input type="number" inputMode="numeric" min={0} step={100} className={`${inputClass} pr-11`} value={value.annualIncome} onChange={(e) => set("annualIncome", e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={value.isNewlywed} onChange={(e) => set("isNewlywed", e.target.checked)} />
            신혼부부 (혼인 7년 이내)
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-3 border-t border-border pt-4">
          <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">매물 조건</legend>
          <Field label="지역 (강남구)">
            <select className={inputClass} value={value.dong} onChange={(e) => onDongChange(e.target.value)}>
              {Object.keys(dongMedians).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Segmented
            options={["전세", "월세"] as const}
            value={value.contractType}
            onChange={(v) => onChange({ ...value, contractType: v, monthlyRent: v === "전세" ? "0" : value.monthlyRent })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="보증금" unit="만원">
              <input type="number" inputMode="numeric" min={0} step={100} className={`${inputClass} pr-11`} value={value.deposit} onChange={(e) => set("deposit", e.target.value)} />
            </Field>
            <Field label="월세" unit="만원">
              <input type="number" inputMode="numeric" min={0} step={5} disabled={isJeonse} className={`${inputClass} pr-11`} value={isJeonse ? "0" : value.monthlyRent} onChange={(e) => set("monthlyRent", e.target.value)} />
            </Field>
          </div>
          {median && (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2 text-xs">
              <span className="text-muted">
                {value.dong} {value.contractType} 중앙값{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatManwon(median.deposit)}
                  {!isJeonse && ` / ${formatManwon(median.monthly_rent)}`}
                </span>
              </span>
              <button type="button" onClick={applyMedian} className="shrink-0 font-medium text-accent hover:underline">
                적용
              </button>
            </div>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-3 border-t border-border pt-4">
          <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">계산 설정</legend>
          <Field label="보증금 기회비용 연이율" unit="%">
            <input type="number" inputMode="decimal" min={0} step={0.1} className={`${inputClass} pr-8`} value={value.annualRatePct} onChange={(e) => set("annualRatePct", e.target.value)} />
          </Field>
        </fieldset>
      </form>
    </Card>
  );
}
