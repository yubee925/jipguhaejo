"use client";

import { useState } from "react";

type Segment = { key: string; label: string; value: number; color: string };

type Props = {
  rent: number;
  depositCost: number;
  support: number;
  format: (v: number) => string;
};

const HATCH =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.92) 0 3px, rgba(255,255,255,0.35) 3px 6px)";

/** 지원 전 비용(월세 + 보증금 기회비용) 누적 막대. 정책 지원분은 오른쪽 끝에 빗금으로 덮어 차감을 표시한다. */
export default function CostBar({ rent, depositCost, support, format }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const gross = rent + depositCost;

  const segments: Segment[] = [
    { key: "rent", label: "월세", value: rent, color: "var(--series-1)" },
    { key: "deposit", label: "보증금 기회비용", value: depositCost, color: "var(--series-2)" },
  ].filter((s) => s.value > 0);

  if (gross <= 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted">
        보증금이나 월세를 입력하면 비용 구성이 표시됩니다
      </div>
    );
  }

  const pct = (v: number) => `${(v / gross) * 100}%`;
  const hovered =
    hover === "support"
      ? { label: "정책 지원 (차감)", value: support }
      : segments.find((s) => s.key === hover);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative" onMouseLeave={() => setHover(null)}>
        {hovered && (
          <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs text-white shadow">
            {hovered.label} <span className="font-semibold tabular-nums">{format(hovered.value)}</span>
            <span className="ml-1 opacity-70">({Math.round((hovered.value / gross) * 100)}%)</span>
          </div>
        )}
        <div className="flex h-7 gap-[2px]" role="img" aria-label={segments.map((s) => `${s.label} ${format(s.value)}`).join(", ")}>
          {segments.map((s, i) => (
            <div
              key={s.key}
              onMouseEnter={() => setHover(s.key)}
              className={`h-full transition-[width,opacity] duration-500 ease-out motion-reduce:transition-none ${i === 0 ? "rounded-l" : ""} ${i === segments.length - 1 ? "rounded-r" : ""} ${
                hover && hover !== s.key ? "opacity-60" : ""
              }`}
              style={{ width: pct(s.value), background: s.color }}
            />
          ))}
        </div>
        {support > 0 && (
          <div
            onMouseEnter={() => setHover("support")}
            className="absolute inset-y-0 right-0 rounded-r border-l-2 border-dashed border-foreground/60 transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: pct(support), background: HATCH }}
          />
        )}
      </div>

      <ul className="flex flex-col gap-1.5 text-xs">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center justify-between" onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(null)}>
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="tabular-nums">{format(s.value)}</span>
          </li>
        ))}
        {support > 0 && (
          <li className="flex items-center justify-between" onMouseEnter={() => setHover("support")} onMouseLeave={() => setHover(null)}>
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-sm border border-foreground/40" style={{ background: "repeating-linear-gradient(45deg, #9ca3af 0 2px, #fff 2px 4px)" }} />
              정책 지원 (차감)
            </span>
            <span className="tabular-nums text-positive">−{format(support)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
