"use client";

import { useMemo, useState } from "react";
import type { FeatureCollection, Polygon } from "geojson";
import { DEFAULT_ANNUAL_RATE } from "@/lib/cost";
import { costByDong, evaluateListing } from "@/lib/evaluate";
import type { DongFeatureProps, DongMedians, Policy } from "@/lib/types";
import { parseConditions, type Conditions } from "@/lib/conditions";
import AgentPanel from "./AgentPanel";
import ConditionForm from "./ConditionForm";
import DetailPanel from "./DetailPanel";
import MapCard from "./MapCard";

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
    <main className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)_360px] lg:overflow-hidden">
      {/* 좌: 지도 + 조건 입력 */}
      <aside className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto">
        <MapCard
          geojson={geojson}
          dongCosts={dongCosts}
          contractType={conditions.contractType}
          selected={conditions.dong}
          onSelect={selectDong}
        />
        <ConditionForm value={conditions} onChange={setConditions} dongMedians={dongMedians} onDongChange={selectDong} />
      </aside>

      {/* 중앙: 상세 패널 */}
      <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto">
        <DetailPanel
          cost={cost}
          matched={matched}
          listing={listing}
          annualRate={annualRate}
          context={`강남구 ${conditions.dong} · ${conditions.contractType}`}
        />
      </div>

      {/* 우: AI Agent */}
      <aside className="flex flex-col gap-4 lg:min-h-0">
        <AgentPanel conditions={conditions} />
      </aside>
    </main>
  );
}
