"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import type { BuildingPoint } from "@/lib/buildingPoints";
import { HOUSING_TYPE_LABEL } from "@/lib/conditions";
import { formatManwon } from "@/lib/format";
import { DISTRICT } from "@/lib/region";
import { useApp } from "../components/AppProvider";
import ConditionForm from "../components/ConditionForm";
import DetailPanel from "../components/DetailPanel";
import { POINT_CHEAP, POINT_PRICEY, STATUS_COLOR } from "../components/statusColors";

// Leaflet은 window가 필요해 SSR 제외
const DongFocusMap = dynamic(() => import("../components/DongFocusMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-background" />,
});

export default function DiagnosisView({ points }: { points: BuildingPoint[] }) {
  const { conditions, setConditions, selectDong, diagnosis, comparison, geojson, dongs, k, user } = useApp();
  // 선택한 동·주택유형의 실거래 건물만 지도에 점으로
  const dongPoints = useMemo(
    () => points.filter((p) => p.dong === conditions.dong && p.housing_type === user.housingType),
    [points, conditions.dong, user.housingType],
  );

  // 동네 비교 지도와 같은 색 (compareDongs 의 colors). 거래가 없으면 회색
  const tone = comparison.colors[conditions.dong];
  const color = tone ? STATUS_COLOR[tone] : "#9ca3af";
  const rank = comparison.ranked.find((x) => x.dong === conditions.dong);
  const typeLabel = HOUSING_TYPE_LABEL[user.housingType];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="flex flex-col gap-3 lg:sticky lg:top-24">
        <ConditionForm value={conditions} onChange={setConditions} dongs={dongs} medianIncome={k.MEDIAN_1P} />
        <Link
          href="/recommend"
          className="rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          이 조건으로 집 추천받기 →
        </Link>
        <Link href="/compare" className="text-center text-sm font-semibold text-accent hover:underline">
          다른 동과 비교해 보기 →
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {/* 선택한 동 지도: 이 동만 색칠, 나머지는 흐리게 */}
        <section className="flex flex-col rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <span className="h-3 w-3 rounded-sm transition-colors duration-500" style={{ background: color }} />
              {DISTRICT} {conditions.dong} · {typeLabel}
            </h2>
            {rank && (
              <span className="text-xs text-muted">
                {comparison.ranked.length}개 동 중 {rank.rank}번째로 저렴 · 동 기준 주거비 월 {formatManwon(rank.base.C ?? 0, 1)}
              </span>
            )}
          </header>
          <div className="relative z-0 h-[36rem] p-3">
            <DongFocusMap
              geojson={geojson}
              selected={conditions.dong}
              color={color}
              value={diagnosis.available ? diagnosis.real : 0}
              onSelect={selectDong}
              points={dongPoints}
              baseCost={diagnosis.available ? diagnosis.base.C : null}
              rate={k.CONVERSION_RATE / 100}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-3 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: POINT_CHEAP }} />동 기준보다 저렴한 실거래
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: POINT_PRICEY }} />동 기준보다 비싼 실거래
            </span>
            <span>
              점 {dongPoints.length.toLocaleString("ko-KR")}곳 · 최근 1년 신규 계약 · 점에 마우스를 올리면 금액, 휠로 확대 · 회색 동을 누르면 그 동으로 바꿔 진단
            </span>
          </div>
        </section>

        <DetailPanel diagnosis={diagnosis} context={`${DISTRICT} ${conditions.dong} · ${typeLabel}`} conversionRate={k.CONVERSION_RATE} />
      </div>
    </div>
  );
}
