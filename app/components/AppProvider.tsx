"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { FeatureCollection, Polygon } from "geojson";
import { parseConditions, type Conditions, type ParsedConditions } from "@/lib/conditions";
import { DEFAULT_ANNUAL_RATE, type CostBreakdown } from "@/lib/cost";
import { costByDong, evaluateListing, type DongCost } from "@/lib/evaluate";
import type { DongFeatureProps, DongMedians, Policy } from "@/lib/types";

export type SiteData = {
  policies: Policy[];
  dongMedians: DongMedians;
  geojson: FeatureCollection<Polygon, DongFeatureProps>;
};

type AppState = SiteData & {
  conditions: Conditions;
  setConditions: (next: Conditions) => void;
  /** 동을 바꾸고 그 동의 현재 계약유형 중앙값을 입력값으로 가져온다 */
  selectDong: (dong: string) => void;
  parsed: ParsedConditions;
  matched: Policy[];
  cost: CostBreakdown;
  dongCosts: DongCost[];
};

const AppContext = createContext<AppState | null>(null);

/** 사이트 전체에서 데이터와 사용자 조건을 공유한다. 페이지를 옮겨도 조건이 유지된다. */
export function AppProvider({ data, children }: { data: SiteData; children: ReactNode }) {
  const { policies, dongMedians } = data;
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

  const selectDong = (dong: string) => {
    setConditions((c) => {
      const median = dongMedians[dong]?.[c.contractType];
      return median
        ? { ...c, dong, deposit: String(median.deposit), monthlyRent: String(median.monthly_rent) }
        : { ...c, dong };
    });
  };

  const derived = useMemo(() => {
    const parsed = parseConditions(conditions);
    const { matched, cost } = evaluateListing(parsed.listing, parsed.profile, policies, parsed.annualRate);
    const dongCosts = costByDong(dongMedians, conditions.contractType, parsed.profile, policies, parsed.annualRate);
    return { parsed, matched, cost, dongCosts };
  }, [conditions, policies, dongMedians]);

  return (
    <AppContext.Provider value={{ ...data, conditions, setConditions, selectDong, ...derived }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp은 AppProvider 안에서만 쓸 수 있습니다.");
  return ctx;
}
