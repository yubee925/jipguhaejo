import type { UserProfile } from "./policy";
import type { ContractType } from "./types";

/** 조건 입력 폼 상태. 입력 중 빈 칸을 허용하려고 숫자 필드는 문자열로 보관 */
export type Conditions = {
  age: string;
  annualIncome: string;
  isNewlywed: boolean;
  dong: string;
  contractType: ContractType;
  deposit: string;
  monthlyRent: string;
  annualRatePct: string;
};

export type ParsedConditions = {
  dong: string;
  contractType: ContractType;
  profile: UserProfile;
  listing: { deposit: number; monthly_rent: number };
  annualRate: number;
};

const toNumber = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** 폼 상태 → 계산 입력. 음수·NaN은 0, 전세는 월세 0. */
export function parseConditions(c: Conditions): ParsedConditions {
  const contractType: ContractType = c.contractType === "전세" ? "전세" : "월세";
  return {
    dong: String(c.dong ?? ""),
    contractType,
    profile: {
      age: toNumber(c.age),
      annualIncomeManwon: toNumber(c.annualIncome),
      isNewlywed: c.isNewlywed === true,
    },
    listing: {
      deposit: toNumber(c.deposit),
      monthly_rent: contractType === "전세" ? 0 : toNumber(c.monthlyRent),
    },
    annualRate: toNumber(c.annualRatePct) / 100,
  };
}
