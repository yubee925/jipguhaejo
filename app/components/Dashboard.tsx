"use client";

import { useMemo, useState } from "react";
import type { FeatureCollection, Polygon } from "geojson";
import { DEFAULT_ANNUAL_RATE } from "@/lib/cost";
import { costByDong, evaluateListing } from "@/lib/evaluate";
import type { DongFeatureProps, DongMedians, Policy } from "@/lib/types";
import { parseConditions, type Conditions } from "@/lib/conditions";
import { DISTRICT } from "@/lib/region";
import ChatWidget from "./ChatWidget";
import ConditionForm from "./ConditionForm";
import DetailPanel from "./DetailPanel";
import MapCard from "./MapCard";
import StepBadge from "./StepBadge";

const GUIDE_STEPS = ["내 조건을 입력하세요", "지도에서 동네별 실질 주거비를 비교하세요", "동을 눌러 자세히 보세요"];

type Props = {
  policies: Policy[];
  dongMedians: DongMedians;
  geojson: FeatureCollection<Polygon, DongFeatureProps>;
};

export default function Dashboard({ policies, dongMedians, geojson }: Props) {
  const [conditions, setConditions] = useState<Conditions>(() => {
    const dong = Object.keys(dongMedians)[0] ?? "";
    const median = dongMedians[dong]?.["월세"];
    return {
      age: "27",
      annualIncome: "3000",
      isNewlywed: false,
      dong,
      contractType: "월세",
      deposit: String(median?.deposit ?? 1000),
      monthlyRent: String(median?.monthly_rent ?? 60),
      annualRatePct: String(DEFAULT_ANNUAL_RATE * 100),
    };
  });

  /** 동을 바꾸면 그 동의 현재 계약유형 중앙값을 입력값으로 가져온다 */
  const selectDong = (dong: string) => {
    setConditions((c) => {
      const median = dongMedians[dong]?.[c.contractType];
      return median
        ? { ...c, dong, deposit: String(median.deposit), monthlyRent: String(median.monthly_rent) }
        : { ...c, dong };
    });
  };

  const { listing, annualRate, matched, cost, dongCosts } = useMemo(() => {
    const { listing, profile, annualRate } = parseConditions(conditions);
    const { matched, cost } = evaluateListing(listing, profile, policies, annualRate);
    const dongCosts = costByDong(dongMedians, conditions.contractType, profile, policies, annualRate);
    return { listing, annualRate, matched, cost, dongCosts };
  }, [conditions, policies, dongMedians]);

  return (
    <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 lg:min-h-0 lg:overflow-hidden">
      {/* 사용 순서 안내 */}
      <ol className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-accent/20 bg-accent-soft px-4 py-2.5 text-sm">
        {GUIDE_STEPS.map((text, i) => (
          <li key={text} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden className="text-accent/50">
                →
              </span>
            )}
            <StepBadge step={i + 1} />
            <span className={i === 0 ? "font-semibold" : ""}>{text}</span>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
        {/* 좌: 내 조건 */}
        <aside className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto">
          <ConditionForm value={conditions} onChange={setConditions} dongMedians={dongMedians} onDongChange={selectDong} />
        </aside>

        {/* 우: 지도 → 선택한 동 상세 (채팅 버튼에 가리지 않게 아래 여백) */}
        <div className="flex flex-col gap-4 pb-24 lg:min-h-0 lg:overflow-y-auto">
          <MapCard
            geojson={geojson}
            dongCosts={dongCosts}
            contractType={conditions.contractType}
            selected={conditions.dong}
            onSelect={selectDong}
          />
          <DetailPanel
            cost={cost}
            matched={matched}
            listing={listing}
            annualRate={annualRate}
            context={`${DISTRICT} ${conditions.dong} · ${conditions.contractType}`}
          />
        </div>
      </div>

      <ChatWidget conditions={conditions} />
    </main>
  );
}
