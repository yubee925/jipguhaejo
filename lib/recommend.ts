// 조건에 맞는 집 추천 (순수 함수). 최근 실거래 사례를 건물 단위로 묶고,
// 그 집 조건(보증금·월세)으로 받을 수 있는 정책 지원금을 반영한 실질 월 주거비가 낮은 순으로 고른다.
// 계산은 팀 lib(calc·match)를 그대로 쓴다.
import { AREA_MAX, convertedRent, median, round2, type MonthlySupport } from "./calc";
import { matchPolicy, pickSupports, sumMonthly } from "./match";
import type { Constants, HousingType, MatchResult, Policy, UserInput } from "./types";

export interface Listing {
  id: number;
  dong: string;
  housing_type: HousingType;
  building: string;
  buildingIsAddress: boolean;
  road_addr: string;
  jibun: string;
  area_m2: number;
  floor: number;
  built_year: number;
  contract_ym: string;
  contract_day: string;
  deposit: number;
  rent: number;
  is_new: "Y" | "N" | "";
}

/**
 * 동·유형 시세(환산 월세 중앙값)의 이 비율 미만인 계약은 추천에서 뺀다.
 * 보증금·월세가 불규칙하게 매우 낮은 계약은 공공임대·특수 계약일 가능성이 커서 일반 매물로 보기 어렵다.
 */
export const LOW_PRICE_RATIO = 0.5;

export interface RecommendOptions {
  /** 특정 동만 (빈 값이면 전체) */
  dong?: string;
  /** 실질 월 주거비 상한(만원). null 이면 제한 없음 */
  maxMonthly?: number | null;
  /** 보증금이 내 보유 보증금 이하인 집만 */
  withinDeposit?: boolean;
  /** 신규 계약만 (갱신 계약은 인상 상한 때문에 시세보다 낮음) */
  newOnly?: boolean;
  areaMax?: number;
  /** 시세 대비 너무 싼 계약(공공임대·특수 계약 추정)도 포함 */
  includeUnusual?: boolean;
}

export interface Recommendation {
  listing: Listing;
  /** 같은 건물(주소)의 조건에 맞는 계약 건수 */
  contracts: number;
  /** 환산 월세 = 월세 + 보증금 × r ÷ 12 */
  converted: number;
  /** 이 집 조건으로 확정 반영되는 월세 지원 */
  supports: MonthlySupport[];
  S: number;
  /** 실질 월 주거비 = max(환산 월세 − S, 0) */
  real: number;
  matches: MatchResult[];
  /** 추첨·내년 신청 정책까지 받으면 더 줄어드는 월 금액 */
  extraIfSelected: number;
}

const ymd = (l: Listing) => `${l.contract_ym}${l.contract_day.padStart(2, "0")}`;
const buildingKey = (l: Listing) => `${l.dong}|${l.road_addr || l.jibun}`;

export function recommend(
  listings: Listing[],
  u: UserInput,
  policies: Policy[],
  k: Constants,
  opts: RecommendOptions = {},
): { items: Recommendation[]; candidates: number; buildings: number; unusual: number } {
  const { dong, maxMonthly = null, withinDeposit = true, newOnly = true, areaMax = AREA_MAX, includeUnusual = false } = opts;
  const r = k.CONVERSION_RATE / 100;
  const myDeposit = u.myDeposit ?? 0;

  const comparable = listings.filter(
    (l) => l.housing_type === u.housingType && l.area_m2 <= areaMax && (!newOnly || l.is_new === "Y"),
  );

  // 동별 시세(환산 월세 중앙값): 특수 계약 판별용
  const byDong = new Map<string, number[]>();
  for (const l of comparable) {
    const arr = byDong.get(l.dong) ?? [];
    arr.push(convertedRent(l.rent, l.deposit, r));
    byDong.set(l.dong, arr);
  }
  const market = new Map([...byDong].map(([d, v]) => [d, median(v) ?? 0]));
  const isUnusual = (l: Listing) => convertedRent(l.rent, l.deposit, r) < (market.get(l.dong) ?? 0) * LOW_PRICE_RATIO;

  let unusual = 0;
  const pool = comparable.filter((l) => {
    if (dong && l.dong !== dong) return false;
    if (withinDeposit && myDeposit > 0 && l.deposit > myDeposit) return false;
    if (!includeUnusual && isUnusual(l)) {
      unusual += 1;
      return false;
    }
    return true;
  });

  // 같은 건물은 가장 최근 계약 1건으로 묶는다
  const groups = new Map<string, { latest: Listing; count: number }>();
  for (const l of pool) {
    const key = buildingKey(l);
    const g = groups.get(key);
    if (!g) groups.set(key, { latest: l, count: 1 });
    else {
      g.count += 1;
      if (ymd(l) > ymd(g.latest)) g.latest = l;
    }
  }

  const items: Recommendation[] = [];
  for (const { latest: l, count } of groups.values()) {
    const converted = convertedRent(l.rent, l.deposit, r);
    const matches = policies.map((p) => matchPolicy(p, u, k, { deposit: l.deposit, rent: l.rent, area_m2: l.area_m2 }));
    const supports = pickSupports(matches, l.rent, ["confirmed"]);
    const S = sumMonthly(supports);
    const real = Math.max(converted - S, 0);
    const withMore = sumMonthly(pickSupports(matches, l.rent, ["confirmed", "lottery", "next_year"]));
    if (maxMonthly != null && real > maxMonthly) continue;
    items.push({
      listing: l,
      contracts: count,
      converted: round2(converted),
      supports,
      S,
      real: round2(real),
      matches,
      extraIfSelected: round2(Math.max(withMore - S, 0)),
    });
  }

  items.sort((a, b) => a.real - b.real || ymd(b.listing).localeCompare(ymd(a.listing)));
  return { items, candidates: pool.length, buildings: groups.size, unusual };
}
