"use client";

import dynamic from "next/dynamic";
import type { FeatureCollection, Polygon } from "geojson";
import type { DongCost } from "@/lib/evaluate";
import { formatManwon } from "@/lib/format";
import { DISTRICT } from "@/lib/region";
import { ORDERED, rankClasses } from "@/lib/scale";
import type { ContractType, DongFeatureProps } from "@/lib/types";
import AnimatedNumber from "./AnimatedNumber";
import StepBadge from "./StepBadge";

// Leaflet은 window가 필요해 SSR 제외
const DongMap = dynamic(() => import("./DongMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-background" />,
});

type Props = {
  geojson: FeatureCollection<Polygon, DongFeatureProps>;
  dongCosts: DongCost[];
  contractType: ContractType;
  selected: string;
  onSelect: (dong: string) => void;
};

const won = (v: number) => formatManwon(v, 1);

export default function MapCard({ geojson, dongCosts, contractType, selected, onSelect }: Props) {
  const values = Object.fromEntries(dongCosts.map((d) => [d.dong, d.cost.monthly]));
  const nums = Object.values(values);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  // 순위 기준: 가장 저렴한 동 노랑 → 가장 비싼 동 암갈색
  const classes = rankClasses(values);
  const fills = Object.fromEntries(Object.entries(classes).map(([dong, c]) => [dong, ORDERED[c]]));
  const ranked = [...dongCosts].sort((a, b) => a.cost.monthly - b.cost.monthly);

  return (
    <section className="flex flex-col rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <StepBadge step={2} />
          동네별 실질 월 주거비
        </h2>
        <span className="text-xs text-muted">{contractType} 중앙값 · 동을 눌러 자세히 보기</span>
      </header>

      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="relative z-0 h-[360px] lg:h-[420px]">
            <DongMap geojson={geojson} fills={fills} values={values} selected={selected} onSelect={onSelect} />
          </div>

          {/* 범례 */}
          {nums.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex h-2 gap-[2px]">
                {ORDERED.map((c, i) => (
                  <span
                    key={c}
                    className={`flex-1 ${i === 0 ? "rounded-l" : ""} ${i === ORDERED.length - 1 ? "rounded-r" : ""}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-muted">
                <span>
                  저렴 <AnimatedNumber value={min} format={won} />
                </span>
                <span>
                  <AnimatedNumber value={max} format={won} /> 비쌈
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 순위 목록: 표 보기 겸 키보드 선택 */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-muted">저렴한 순</h3>
          <ul className="flex flex-col text-xs">
            {ranked.map(({ dong, cost }, i) => (
              <li key={dong}>
                <button
                  type="button"
                  onClick={() => onSelect(dong)}
                  aria-pressed={dong === selected}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 transition ${
                    dong === selected ? "bg-accent-soft font-semibold" : "hover:bg-background"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-3 text-right tabular-nums text-muted">{i + 1}</span>
                    <span
                      className="h-2.5 w-2.5 rounded-sm transition-colors duration-500"
                      style={{ background: fills[dong] }}
                    />
                    {dong}
                  </span>
                  <AnimatedNumber value={cost.monthly} format={won} />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-auto text-[11px] leading-relaxed text-muted">
            각 동의 {contractType} 중앙값 매물에 내 조건으로 받을 수 있는 정책을 반영한 금액입니다. 색은 {DISTRICT}{" "}
            {ranked.length}개 동 중 순위로, 저렴할수록 노랑·비쌀수록 어두운 색입니다. 경계는 임시 사각형입니다.
          </p>
        </div>
      </div>
    </section>
  );
}
