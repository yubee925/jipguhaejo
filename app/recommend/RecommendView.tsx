"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HOUSING_TYPE_LABEL } from "@/lib/conditions";
import { formatManwon } from "@/lib/format";
import { LOW_PRICE_RATIO, recommend, type Listing, type Recommendation } from "@/lib/recommend";
import { DISTRICT } from "@/lib/region";
import AnimatedNumber from "../components/AnimatedNumber";
import { useApp } from "../components/AppProvider";
import ConditionForm from "../components/ConditionForm";

const PAGE = 12;
const m1 = (v: number) => formatManwon(v, 1);
const pyeong = (m2: number) => (m2 / 3.3058).toFixed(1);

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm tabular-nums outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

function naverMapUrl(l: Listing) {
  return `https://map.naver.com/p/search/${encodeURIComponent(`서울 ${DISTRICT} ${l.road_addr || `${l.dong} ${l.jibun}`}`)}`;
}

function ListingCard({ rec, rank, names }: { rec: Recommendation; rank: number; names: Record<string, string> }) {
  const l = rec.listing;
  const title = l.buildingIsAddress ? l.road_addr : l.building;
  const ym = `${l.contract_ym.slice(0, 4)}.${l.contract_ym.slice(4, 6)}`;
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-stretch sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent tabular-nums">{rank}</span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div>
            <h3 className="truncate text-base font-bold leading-snug">{title}</h3>
            <p className="text-xs text-muted">
              {DISTRICT} {l.dong} · {l.road_addr}
              {l.buildingIsAddress ? "" : ` (지번 ${l.jibun})`}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {[
              HOUSING_TYPE_LABEL[l.housing_type],
              `전용 ${l.area_m2}㎡ (${pyeong(l.area_m2)}평)`,
              l.floor < 0 ? `지하 ${-l.floor}층` : `${l.floor}층`,
              l.built_year ? `${l.built_year}년 준공` : null,
            ]
              .filter(Boolean)
              .map((t) => (
                <span key={t} className="rounded-md bg-background px-2 py-0.5 text-muted">
                  {t}
                </span>
              ))}
          </div>
          <p className="text-xs">
            실제 계약: 보증금 <b className="tabular-nums">{formatManwon(l.deposit)}</b> / 월세 <b className="tabular-nums">{formatManwon(l.rent)}</b>
            <span className="text-muted">
              {" "}
              · {ym} 계약{rec.contracts > 1 ? ` · 이 건물 최근 1년 계약 ${rec.contracts}건` : ""}
            </span>
          </p>
          <a href={naverMapUrl(l)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-accent hover:underline">
            네이버 지도에서 보기 →
          </a>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-1 border-t border-border pt-3 sm:w-52 sm:items-end sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 sm:text-right">
        <span className="text-[11px] text-muted">실질 월 주거비</span>
        <AnimatedNumber value={rec.real} format={m1} className="text-2xl font-bold" />
        <span className="text-[11px] text-muted">
          환산 월세 {m1(rec.converted)}
          {rec.S > 0 ? ` − 지원 ${m1(rec.S)}` : ""}
        </span>
        <div className="mt-1 flex flex-wrap gap-1 sm:justify-end">
          {rec.supports.map((s) => (
            <span key={s.policyId} className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
              {names[s.policyId] ?? s.policyId} −{formatManwon(s.monthly)}
            </span>
          ))}
          {rec.extraIfSelected > 0 && (
            <span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-muted">추첨·내년 신청 시 −{formatManwon(rec.extraIfSelected)} 더</span>
          )}
        </div>
      </div>
    </li>
  );
}

export default function RecommendView({ listings }: { listings: Listing[] }) {
  const { conditions, setConditions, dongs, k, user, policies } = useApp();
  const [dong, setDong] = useState("");
  const [maxMonthly, setMaxMonthly] = useState("");
  const [withinDeposit, setWithinDeposit] = useState(true);
  const [includeUnusual, setIncludeUnusual] = useState(false);
  const [shown, setShown] = useState(PAGE);

  const max = Number(maxMonthly);
  const result = useMemo(
    () =>
      recommend(listings, user, policies, k, {
        dong: dong || undefined,
        maxMonthly: maxMonthly && Number.isFinite(max) && max > 0 ? max : null,
        withinDeposit,
        includeUnusual,
      }),
    [listings, user, policies, k, dong, maxMonthly, max, withinDeposit, includeUnusual],
  );
  const names = useMemo(() => Object.fromEntries(policies.map((p) => [p.policy_id, p.name])), [policies]);
  const typeLabel = HOUSING_TYPE_LABEL[user.housingType];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        <ConditionForm value={conditions} onChange={setConditions} dongs={dongs} medianIncome={k.MEDIAN_1P} />
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <h2 className="text-sm font-semibold tracking-tight">추천 조건</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">동</span>
              <select className={inputClass} value={dong} onChange={(e) => (setDong(e.target.value), setShown(PAGE))}>
                <option value="">{DISTRICT} 전체</option>
                {dongs.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">월 최대 부담</span>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={5}
                  placeholder="제한 없음"
                  className={`${inputClass} pr-14`}
                  value={maxMonthly}
                  onChange={(e) => (setMaxMonthly(e.target.value), setShown(PAGE))}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">만원</span>
              </div>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--accent)]"
              checked={withinDeposit}
              onChange={(e) => (setWithinDeposit(e.target.checked), setShown(PAGE))}
            />
            {user.myDeposit != null ? `내 보증금(${formatManwon(user.myDeposit)}) 안에서 계약한 집만` : "내 보증금 안에서 계약한 집만 (보증금을 입력하면 적용)"}
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
              checked={includeUnusual}
              onChange={(e) => (setIncludeUnusual(e.target.checked), setShown(PAGE))}
            />
            <span>
              시세보다 크게 싼 계약도 보기
              <span className="block text-[11px] text-muted">
                동 시세의 {Math.round(LOW_PRICE_RATIO * 100)}% 미만. 공공임대·특수 계약일 수 있어요
              </span>
            </span>
          </label>
        </section>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 rounded-xl bg-surface px-4 py-3 text-sm ring-1 ring-border sm:flex-row sm:items-center sm:justify-between">
          <span>
            {dong ? `${DISTRICT} ${dong}` : `${DISTRICT} 전체`} {typeLabel} · 조건에 맞는 건물{" "}
            <b className="tabular-nums">{result.items.length}</b>곳
          </span>
          <span className="text-xs text-muted">
            실질 월 주거비 낮은 순
            {!includeUnusual && result.unusual > 0 ? ` · 특수 계약 추정 ${result.unusual}건 제외` : ""}
          </span>
        </div>

        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
          최근 1년 국토교통부 월세 <b>실거래 사례</b>입니다. 지금 비어 있는 매물인지는 부동산이나 매물 앱에서 확인하세요. 금액은
          예상치이며 최종 자격은 공고 기준, 관리비 별도입니다.
        </p>

        {result.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-muted">
            조건에 맞는 집이 없습니다. 월 최대 부담을 늘리거나, &ldquo;내 보증금 안에서만&rdquo;을 끄거나, 다른 동·유형을 골라 보세요.
          </div>
        ) : (
          <>
            <ol className="flex flex-col gap-3">
              {result.items.slice(0, shown).map((rec, i) => (
                <ListingCard key={rec.listing.id} rec={rec} rank={i + 1} names={names} />
              ))}
            </ol>
            {shown < result.items.length && (
              <button
                type="button"
                onClick={() => setShown((n) => n + PAGE)}
                className="self-center rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold transition hover:bg-background"
              >
                더 보기 ({result.items.length - shown}곳 남음)
              </button>
            )}
          </>
        )}

        <Link href="/diagnosis" className="self-start text-sm font-semibold text-accent hover:underline">
          동네 평균 기준으로 진단해 보기 →
        </Link>
      </div>
    </div>
  );
}
