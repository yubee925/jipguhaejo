"use client";

import Link from "next/link";
import { formatManwon } from "@/lib/format";
import { DISTRICT } from "@/lib/region";
import AnimatedNumber from "../components/AnimatedNumber";
import { useApp } from "../components/AppProvider";
import MapCard from "../components/MapCard";

const won = (v: number) => formatManwon(v, 1);

export default function CompareView() {
  const { geojson, dongCosts, conditions, selectDong, parsed } = useApp();
  const ranked = [...dongCosts].sort((a, b) => a.cost.monthly - b.cost.monthly);
  const rank = ranked.findIndex((d) => d.dong === conditions.dong);
  const current = ranked[rank];
  const cheapest = ranked[0];
  const { profile } = parsed;

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted ring-1 ring-border">
        비교 조건: <span className="font-medium text-foreground">{profile.age}세 · 연 소득 {formatManwon(profile.annualIncomeManwon)}{profile.isNewlywed ? " · 신혼부부" : ""} · {conditions.contractType}</span>{" "}
        <Link href="/diagnosis" className="ml-1 font-semibold text-accent hover:underline">
          조건 바꾸기
        </Link>
      </p>

      <MapCard
        geojson={geojson}
        dongCosts={dongCosts}
        contractType={conditions.contractType}
        selected={conditions.dong}
        onSelect={selectDong}
      />

      {current && (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs text-muted">선택한 동</div>
            <div className="mt-1 text-lg font-bold">
              {DISTRICT} {current.dong}{" "}
              <span className="text-sm font-medium text-muted">
                {ranked.length}개 동 중 {rank + 1}번째로 저렴
              </span>
            </div>
            <div className="mt-1 text-sm">
              실질 월 주거비 <AnimatedNumber value={current.cost.monthly} format={won} className="font-semibold" />
              {cheapest && cheapest.dong !== current.dong && (
                <span className="text-muted">
                  {" "}
                  · 가장 저렴한 {cheapest.dong}보다 월{" "}
                  <AnimatedNumber value={current.cost.monthly - cheapest.cost.monthly} format={won} /> 더 듦
                </span>
              )}
            </div>
          </div>
          <Link
            href="/diagnosis"
            className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            이 동으로 자세히 진단 →
          </Link>
        </section>
      )}
    </div>
  );
}
