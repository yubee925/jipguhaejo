"use client";

import Link from "next/link";
import { formatManwon } from "@/lib/format";
import { won1 } from "../components/money";
import { DISTRICT } from "@/lib/region";
import AnimatedNumber from "../components/AnimatedNumber";
import { useApp } from "../components/AppProvider";
import MapCard from "../components/MapCard";
import RequiredNotice from "../components/RequiredNotice";
import { HOUSING_TYPE_LABEL } from "@/lib/conditions";

export default function CompareView() {
  const { geojson, comparison, conditions, selectDong, user, missing } = useApp();
  const ranked = comparison?.ranked ?? [];
  const current = ranked.find((x) => x.dong === conditions.dong);
  const cheapest = ranked[0];
  const typeLabel = HOUSING_TYPE_LABEL[user.housingType];
  // 결론 카드: 표본 충분한 동끼리 비교 (모두 부족하면 전체). ranked 는 실질 월 주거비 오름차순
  const solid = ranked.filter((x) => !x.base.lowSample);
  const pool = solid.length >= 2 ? solid : ranked;
  const low = pool[0];
  const high = pool[pool.length - 1];
  const gap = low && high ? high.real - low.real : 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted ring-1 ring-border">
        비교 조건:{" "}
        <span className="font-medium text-foreground">
          {missing.includes("나이") ? "나이 미입력" : `만 ${user.age}세`} · {missing.includes("월소득") ? "월소득 미입력" : `월소득 ${formatManwon(user.monthlyIncome)}`} ·{" "}
          {user.homeless ? "무주택" : "유주택"} · {typeLabel}
        </span>{" "}
        <Link href="/diagnosis" className="ml-1 font-semibold text-accent hover:underline">
          조건 바꾸기
        </Link>
      </p>

      {low && high && low.dong !== high.dong && (
        <section className="rounded-xl bg-deep px-5 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Bottom line</p>
          <p className="mt-2 break-keep text-xl font-bold leading-snug sm:text-2xl">
            같은 조건이어도 {low.dong}과 {high.dong}은 월 {won1(gap)}, 1년이면 약 {Math.round(gap * 12).toLocaleString("ko-KR")}만원 차이나요
          </p>
          <p className="mt-2 text-xs text-white/70">
            실질 월 주거비 {low.dong} {won1(low.real)} · {high.dong} {won1(high.real)}
          </p>
        </section>
      )}

      {/* 필수 입력(나이·월소득)이 비면 계산하지 않고 안내만 */}
      {comparison ? (
        <MapCard geojson={geojson} comparison={comparison} housingType={user.housingType} selected={conditions.dong} onSelect={selectDong} />
      ) : (
        <RequiredNotice missing={missing} />
      )}

      {current && (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs text-muted">선택한 동</div>
            <div className="mt-1 text-lg font-bold">
              {DISTRICT} {current.dong}{" "}
              <span className="text-sm font-medium text-muted">
                {ranked.length}개 동 중 {current.rank}번째로 저렴{current.base.lowSample ? " · 표본 부족" : ""}
              </span>
            </div>
            <div className="mt-1 text-sm">
              실질 월 주거비 <AnimatedNumber value={current.real} format={won1} className="font-semibold" />
              {cheapest && cheapest.dong !== current.dong && (
                <span className="text-muted">
                  {" "}
                  · 가장 저렴한 {cheapest.dong}보다 월 <AnimatedNumber value={current.real - cheapest.real} format={won1} /> 더 듦
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
