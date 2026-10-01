"use client";

import type { ReactNode } from "react";
import {
  CURRENT_SUPPORT,
  HOUSING_TYPE_LABEL,
  JOB,
  MARITAL,
  MOVED_IN,
  PARENT_INCOME,
  PARENT_REGION,
  RESIDENT,
  type Conditions,
} from "@/lib/conditions";
import { DISTRICT } from "@/lib/region";
import type { HousingType } from "@/lib/types";
import Card from "./Card";

export type { Conditions };

type Props = {
  value: Conditions;
  onChange: (next: Conditions) => void;
  /** 선택할 수 있는 동 (데이터에서 읽음) */
  dongs: string[];
  /** 1인가구 기준중위소득(월, 만원) — 소득 비율 안내용 */
  medianIncome: number;
};

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm tabular-nums outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:bg-background disabled:text-muted";

function Field({ label, unit, hint, children }: { label: string; unit?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="relative">
        {children}
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{unit}</span>
        )}
      </div>
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-flow-col auto-cols-fr rounded-lg bg-background p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`h-8 rounded-md text-sm transition ${
            value === opt.value ? "bg-surface font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.08)]" : "text-muted hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

function Select<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const HOUSING_TYPES = (Object.keys(HOUSING_TYPE_LABEL) as HousingType[]).map((v) => ({ value: v, label: HOUSING_TYPE_LABEL[v] }));

export default function ConditionForm({ value, onChange, dongs, medianIncome }: Props) {
  const set = <K extends keyof Conditions>(key: K, v: Conditions[K]) => onChange({ ...value, [key]: v });
  const income = Number(value.monthlyIncome);
  const pct = Number.isFinite(income) && income > 0 ? Math.round((income / medianIncome) * 100) : null;

  return (
    <Card title="내 조건 입력" subtitle="바꾸면 결과가 바로 바뀌어요" className="flex-1">
      <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">내 정보</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label="나이" unit="세">
              <input type="number" inputMode="numeric" min={0} className={`${inputClass} pr-14`} value={value.age} onChange={(e) => set("age", e.target.value)} />
            </Field>
            <Field label="월소득" unit="만원" hint={pct !== null ? `기준중위소득의 ${pct}%` : "세전 월 소득"}>
              <input type="number" inputMode="numeric" min={0} step={10} className={`${inputClass} pr-14`} value={value.monthlyIncome} onChange={(e) => set("monthlyIncome", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="혼인 상태">
              <Select options={MARITAL} value={value.marital} onChange={(v) => set("marital", v)} />
            </Field>
            <Field label="취업 상태">
              <Select options={JOB} value={value.job} onChange={(v) => set("job", v)} />
            </Field>
            <Field label="주민등록지">
              <Select options={RESIDENT} value={value.resident} onChange={(v) => set("resident", v)} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Check checked={value.homeless} onChange={(v) => set("homeless", v)}>
              무주택
            </Check>
            <Check checked={value.independent} onChange={(v) => set("independent", v)}>
              부모와 따로 거주(독립)
            </Check>
            <Check checked={value.single} onChange={(v) => set("single", v)}>
              1인 가구
            </Check>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3 border-t border-border pt-4">
          <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">찾는 집 (월세)</legend>
          <Segmented options={HOUSING_TYPES} value={value.housingType} onChange={(v) => set("housingType", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={`지역 (${DISTRICT})`}>
              <select className={inputClass} value={value.dong} onChange={(e) => set("dong", e.target.value)}>
                {dongs.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="보유 보증금" unit="만원">
              <input type="number" inputMode="numeric" min={0} step={100} className={`${inputClass} pr-14`} value={value.myDeposit} onChange={(e) => set("myDeposit", e.target.value)} />
            </Field>
          </div>
          <p className="text-[11px] leading-relaxed text-muted">전용 40㎡ 이하 월세 실거래(신규 계약)의 중앙값으로 동네 시세를 계산합니다.</p>
        </fieldset>

        <details className="group border-t border-border pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted">
            더 정확하게 (선택)
            <span className="text-xs normal-case tracking-normal transition group-open:rotate-180">▾</span>
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-[11px] leading-relaxed text-muted">모르면 비워 두세요. 탈락이 아니라 &ldquo;확인 필요&rdquo;로 표시합니다.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="본인 총자산" unit="만원">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={100}
                  placeholder="모름"
                  className={`${inputClass} pr-14`}
                  value={value.asset}
                  onChange={(e) => set("asset", e.target.value)}
                />
              </Field>
              <Field label="부모 포함 가구소득">
                <Select options={PARENT_INCOME} value={value.parentIncome} onChange={(v) => set("parentIncome", v)} />
              </Field>
              <Field label="부모 주소지">
                <Select options={PARENT_REGION} value={value.parentRegion} onChange={(v) => set("parentRegion", v)} />
              </Field>
              <Field label="서울 전입 시점">
                <Select options={MOVED_IN} value={value.movedInYear} onChange={(v) => set("movedInYear", v)} />
              </Field>
            </div>
            <div className="flex flex-col gap-2">
              <Check checked={value.houseHead} onChange={(v) => set("houseHead", v)}>
                세대주
              </Check>
              <Check checked={value.basicBenefitFamily} onChange={(v) => set("basicBenefitFamily", v)}>
                기초생활수급 가구 (본인 또는 부모)
              </Check>
              <Check checked={value.parentHouseRent} onChange={(v) => set("parentHouseRent", v)}>
                부모 소유 집에 세 들어 사는 중
              </Check>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">이미 받고 있는 지원</span>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {CURRENT_SUPPORT.map((o) => (
                  <Check
                    key={o.value}
                    checked={value.currentSupport.includes(o.value)}
                    onChange={(on) =>
                      set("currentSupport", on ? [...value.currentSupport, o.value] : value.currentSupport.filter((x) => x !== o.value))
                    }
                  >
                    {o.label}
                  </Check>
                ))}
              </div>
            </div>
          </div>
        </details>
      </form>
    </Card>
  );
}
