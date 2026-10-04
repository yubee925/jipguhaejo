"use client";

import dynamic from "next/dynamic";
import type { FeatureCollection, Polygon } from "geojson";
import { HOUSING_TYPE_LABEL } from "@/lib/conditions";
import { DISTRICT } from "@/lib/region";
import type { HousingType } from "@/lib/types";
import AnimatedNumber from "./AnimatedNumber";
import { won1 } from "./money";
import type { Comparison, DongFeatureProps } from "./AppProvider";
import { STATUS_COLOR, STATUS_LABEL } from "./statusColors";

// Leaflet은 window가 필요해 SSR 제외
const DongMap = dynamic(() => import("./DongMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-background" />,
});

type Props = {
  geojson: FeatureCollection<Polygon, DongFeatureProps>;
  comparison: Comparison;
  housingType: HousingType;
  selected: string;
  onSelect: (dong: string) => void;
};

const NO_DATA = "#d1d5db";

export default function MapCard({ geojson, comparison, housingType, selected, onSelect }: Props) {
  const { ranked, colors, unavailable } = comparison;
  // 지도 색은 compareDongs 가 준 colors (하위 1/3 초록 · 중간 주황 · 상위 1/3 빨강)
  const fills = Object.fromEntries(ranked.map((x) => [x.dong, STATUS_COLOR[colors[x.dong]]]));
  const values = Object.fromEntries(ranked.map((x) => [x.dong, x.real]));
  const typeLabel = HOUSING_TYPE_LABEL[housingType];

  return (
    <section className="flex flex-col rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">동네별 실질 월 주거비</h2>
        <span className="text-xs text-muted">{typeLabel} 월세 실거래 기준 · 동을 눌러 자세히 보기</span>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="relative z-0 h-[360px] lg:h-[420px]">
            <DongMap geojson={geojson} fills={fills} values={values} selected={selected} onSelect={onSelect} />
          </div>

          {/* 범례 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
            {(["green", "orange", "red"] as const).map((c) => (
              <span key={c} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLOR[c] }} />
                {STATUS_LABEL[c]}
              </span>
            ))}
            {unavailable.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: NO_DATA }} />
                거래 없음
              </span>
            )}
          </div>
        </div>

        {/* 순위 목록: 표 보기 겸 키보드 선택 */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-muted">저렴한 순</h3>
          <ul className="flex flex-col text-xs">
            {ranked.map((x) => (
              <li key={x.dong}>
                <button
                  type="button"
                  onClick={() => onSelect(x.dong)}
                  aria-pressed={x.dong === selected}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 transition ${
                    x.dong === selected ? "bg-accent-soft font-semibold" : "hover:bg-background"
                  } ${x.base.lowSample ? "text-muted" : ""}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="w-3 shrink-0 text-right tabular-nums text-muted">{x.rank}</span>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm transition-colors duration-500" style={{ background: fills[x.dong] }} />
                    <span className="whitespace-nowrap">{x.dong}</span>
                    <span className="whitespace-nowrap text-[11px] font-normal tabular-nums text-muted">거래 {x.base.count.toLocaleString("ko-KR")}건</span>
                    {x.base.lowSample && (
                      <span className="whitespace-nowrap rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted ring-1 ring-border">표본 부족</span>
                    )}
                  </span>
                  <AnimatedNumber value={x.real} format={won1} className="shrink-0 whitespace-nowrap" />
                </button>
              </li>
            ))}
            {unavailable.map((dong) => (
              <li key={dong} className="flex items-center justify-between px-2 py-1.5 text-muted">
                <span className="flex items-center gap-2">
                  <span className="w-3" />
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: NO_DATA }} />
                  {dong}
                </span>
                거래 없음
              </li>
            ))}
          </ul>
          <p className="mt-auto text-[11px] leading-relaxed text-muted">
            최근 1년 {typeLabel} 신규 월세 실거래의 환산 월세 중앙값에서 내 조건으로 받을 수 있는 월세 지원을 뺀 금액입니다.
            색은 {DISTRICT} 동들을 셋으로 나눠 저렴한 1/3은 초록, 중간은 주황, 비싼 1/3은 빨강입니다.
          </p>
        </div>
      </div>
    </section>
  );
}
