import { formatManwon } from "./format";
import type { Policy, RentRecord } from "./types";

export type UserProfile = {
  age: number;
  /** 연 소득(만원) */
  annualIncomeManwon: number;
  isNewlywed?: boolean;
  /** 거주 희망 시·도. 기본값 서울특별시 */
  region?: string;
};

type Listing = Pick<RentRecord, "deposit" | "monthly_rent">;

/** 정책에 해당하지 않는 이유. 해당하면 null. */
export function policyRejectReason(profile: UserProfile, policy: Policy, listing?: Listing): string | null {
  const p = policy;
  const region = profile.region ?? "서울특별시";
  if (profile.age < p.age_min || profile.age > p.age_max) return `나이 조건(${p.age_min}~${p.age_max}세) 밖`;
  if (profile.annualIncomeManwon > p.income_limit_manwon) return `소득 한도(연 ${formatManwon(p.income_limit_manwon)}) 초과`;
  if (p.target === "신혼부부" && !profile.isNewlywed) return "신혼부부 대상";
  if (p.region !== "전국" && p.region !== region) return `${p.region} 거주자 대상`;

  if (listing) {
    if (p.max_deposit_manwon > 0 && listing.deposit > p.max_deposit_manwon)
      return `보증금 상한(${formatManwon(p.max_deposit_manwon)}) 초과`;
    if (p.max_monthly_rent_manwon > 0 && listing.monthly_rent > p.max_monthly_rent_manwon)
      return `월세 상한(${formatManwon(p.max_monthly_rent_manwon)}) 초과`;
    if (p.support_type === "월세지원" && listing.monthly_rent <= 0) return "월세 계약 대상";
  }
  return null;
}

/**
 * 사용자 조건(나이·소득·대상·지역)에 맞는 정책을 고른다.
 * listing을 주면 보증금·월세 상한과 지원 유형(월세지원은 월세 매물만)까지 확인한다.
 */
export function matchPolicies(profile: UserProfile, policies: Policy[], listing?: Listing): Policy[] {
  return policies.filter((p) => policyRejectReason(profile, p, listing) === null);
}
