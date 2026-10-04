"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { FeatureCollection, Polygon } from "geojson";
import { DEFAULT_CONDITIONS, missingRequired, toUserInput, type Conditions } from "@/lib/conditions";
import { compareDongs, diagnoseDong } from "@/lib/diagnose";
import type { Constants, Policy, RentRecord, UserInput } from "@/lib/types";

export type DongFeatureProps = { dong: string; emd_cd?: string };

export type SiteData = {
  rent: RentRecord[];
  policies: Policy[];
  k: Constants;
  /** 데이터에 있는 동 목록 */
  dongs: string[];
  geojson: FeatureCollection<Polygon, DongFeatureProps>;
};

export type Diagnosis = ReturnType<typeof diagnoseDong>;
export type Comparison = ReturnType<typeof compareDongs>;

type AppState = SiteData & {
  conditions: Conditions;
  setConditions: (next: Conditions) => void;
  selectDong: (dong: string) => void;
  user: UserInput;
  /** 비어 있는 필수 입력 (나이·월소득). 하나라도 있으면 결과를 계산하지 않는다 */
  missing: string[];
  /** 선택한 동 진단. 필수 입력이 비면 null (빈칸을 0으로 계산하지 않음) */
  diagnosis: Diagnosis | null;
  /** 같은 조건으로 계산한 모든 동 (순위·지도 색). 필수 입력이 비면 null */
  comparison: Comparison | null;
};

const AppContext = createContext<AppState | null>(null);

/** 사이트 전체에서 데이터와 사용자 조건을 공유한다. 페이지를 옮겨도 조건이 유지된다. */
export function AppProvider({ data, children }: { data: SiteData; children: ReactNode }) {
  const { rent, policies, k, dongs } = data;
  const [conditions, setConditions] = useState<Conditions>(() => ({ ...DEFAULT_CONDITIONS, dong: dongs[0] ?? "" }));

  const selectDong = (dong: string) => setConditions((c) => ({ ...c, dong }));

  const derived = useMemo(() => {
    const user = toUserInput(conditions);
    const missing = missingRequired(conditions);
    if (missing.length) return { user, missing, diagnosis: null, comparison: null };
    return {
      user,
      missing,
      diagnosis: diagnoseDong(user, conditions.dong, rent, policies, k),
      comparison: compareDongs(user, dongs, rent, policies, k),
    };
  }, [conditions, rent, policies, k, dongs]);

  return (
    <AppContext.Provider value={{ ...data, conditions, setConditions, selectDong, ...derived }}>{children}</AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp은 AppProvider 안에서만 쓸 수 있습니다.");
  return ctx;
}
