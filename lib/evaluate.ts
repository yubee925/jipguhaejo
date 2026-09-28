import { calcHousingCost, type CostBreakdown } from "./cost";
import { matchPolicies, type UserProfile } from "./policy";
import type { ContractType, DongMedians, Policy } from "./types";

type Listing = { deposit: number; monthly_rent: number };

/** 매물 하나에 대해 정책 매칭 → 실질 주거비 계산 */
export function evaluateListing(
  listing: Listing,
  profile: UserProfile,
  policies: Policy[],
  annualRate: number,
): { matched: Policy[]; cost: CostBreakdown } {
  const matched = matchPolicies(profile, policies, listing);
  return { matched, cost: calcHousingCost(listing, { annualRate, policies: matched }) };
}

export type DongCost = { dong: string; listing: Listing; cost: CostBreakdown };

/** 동별 중앙값 매물(계약유형 기준)의 실질 주거비 */
export function costByDong(
  dongMedians: DongMedians,
  contractType: ContractType,
  profile: UserProfile,
  policies: Policy[],
  annualRate: number,
): DongCost[] {
  return Object.entries(dongMedians)
    .filter(([, byType]) => byType[contractType])
    .map(([dong, byType]) => {
      const listing = byType[contractType];
      return { dong, listing, cost: evaluateListing(listing, profile, policies, annualRate).cost };
    });
}
