import type { Policy, RentRecord } from "./types";

/** 보증금 기회비용 계산용 연이율 */
export const DEFAULT_ANNUAL_RATE = 0.045;
/** 이자지원·대출 정책 적용 시 사용자가 실제 부담하는 연이율 */
export const DEFAULT_POLICY_LOAN_RATE = 0.02;

export type CostOptions = {
  annualRate?: number;
  policyLoanRate?: number;
  /** 적용할 정책(보통 matchPolicies 결과) */
  policies?: Policy[];
};

export type CostBreakdown = {
  /** 월세 */
  rent: number;
  /** 보증금 × 연이율 / 12 */
  depositCost: number;
  /** 정책 월 지원액 */
  policySupport: number;
  /** 실질 월 주거비 = 월세 + 보증금 기회비용 − 정책 지원 (0 미만이면 0) */
  monthly: number;
  /** 실질 연 주거비 = 실질 월 주거비 × 12 */
  annual: number;
  /** 실제로 합산된 정책(유형별 최대 1건) */
  applied: Policy[];
};

type Listing = Pick<RentRecord, "deposit" | "monthly_rent">;

/**
 * 정책별 월 지원액.
 * - 월세지원: min(월 지원액, 월세)
 * - 이자지원·대출: min(보증금, 지원 한도) × (연이율 − 정책 금리) / 12
 */
export function policyMonthlySupport(
  listing: Listing,
  policy: Policy,
  annualRate = DEFAULT_ANNUAL_RATE,
  policyLoanRate = DEFAULT_POLICY_LOAN_RATE,
): number {
  if (policy.support_type === "월세지원") {
    return Math.min(policy.support_amount_manwon, listing.monthly_rent);
  }
  const covered = Math.min(listing.deposit, policy.support_amount_manwon);
  return (covered * Math.max(0, annualRate - policyLoanRate)) / 12;
}

/**
 * 실질 월/연 주거비(만원).
 * 같은 보증금·월세를 중복 지원받을 수 없다고 보고, 월세지원 중 최대 1건과
 * 이자지원·대출 중 최대 1건만 합산한다.
 */
export function calcHousingCost(listing: Listing, options: CostOptions = {}): CostBreakdown {
  const { annualRate = DEFAULT_ANNUAL_RATE, policyLoanRate = DEFAULT_POLICY_LOAN_RATE, policies = [] } = options;

  const rent = listing.monthly_rent;
  const depositCost = (listing.deposit * annualRate) / 12;

  const best = { rent: { amount: 0, policy: null as Policy | null }, deposit: { amount: 0, policy: null as Policy | null } };
  for (const p of policies) {
    const amount = policyMonthlySupport(listing, p, annualRate, policyLoanRate);
    const slot = p.support_type === "월세지원" ? best.rent : best.deposit;
    if (amount > slot.amount) {
      slot.amount = amount;
      slot.policy = p;
    }
  }
  const applied = [best.rent.policy, best.deposit.policy].filter((p): p is Policy => p !== null);

  const gross = rent + depositCost;
  const policySupport = Math.min(gross, best.rent.amount + best.deposit.amount);
  const monthly = gross - policySupport;
  return { rent, depositCost, policySupport, monthly, annual: monthly * 12, applied };
}
