"use client";

import dynamic from "next/dynamic";
import type { FeatureCollection, Polygon } from "geojson";
import type { DongCost } from "@/lib/evaluate";
import { formatManwon } from "@/lib/format";
import { ORDERED, rankClass } from "@/lib/scale";
import { DISTRICT } from "@/lib/region";
import type { ContractType, DongFeatureProps } from "@/lib/types";

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

export default function MapCard({ geojson, dongCosts, contractType, selected, onSelect }: Props) {
  const values = Object.fromEntries(dongCosts.map((d) => [d.dong, d.cost.monthly]));
  const nums = Object.values(values);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  // 순위 기준: 가장 저렴한 동 노랑 → 가장 비싼 동 암갈색
  const colorOf = (v: number) => ORDERED[rankClass(v, nums)];
  const fills = Object.fromEntries(Object.entries(values).map(([dong, v]) => [dong, colorOf(v)]));
  const ranked = [...dongCosts].sort((a, b) => a.cost.monthly - b.cost.monthly);

  return (
    <section className="flex flex-col rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <header className="flex items-baseline justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">동별 실질 월 주거비</h2>
        <span className="text-xs text-muted">{contractType} 중앙값 기준</span>
      </header>

      <div className="flex flex-col gap-3 p-4">
        <div className="relative z-0 h-64">
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
            <div className="flex justify-between text-[11px] tabular-nums text-muted">
              <span>저렴 {formatManwon(min, 1)}</span>
              <span>{formatManwon(max, 1)} 비쌈</span>
            </div>
          </div>
        )}

        {/* 표 보기 겸 키보드 선택 */}
        <ul className="flex flex-col text-xs">
          {ranked.map(({ dong, cost }) => (
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
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colorOf(cost.monthly) }} />
                  {dong}
                </span>
                <span className="tabular-nums">{formatManwon(cost.monthly, 1)}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="text-[11px] leading-relaxed text-muted">
          각 동의 {contractType} 중앙값 매물에 내 조건으로 매칭된 정책을 반영한 금액입니다. 색은 {DISTRICT} {ranked.length}개 동 중 순위로, 저렴할수록 노랑·비쌀수록 어두운 색입니다. 경계는 임시 사각형입니다.
        </p>
      </div>
    </section>
  );
}
