// 조건 입력 폼 상태 ↔ 계산 입력(UserInput) 변환. 화면과 AI 해설 API가 같이 쓴다.
import type { HousingType, UserInput } from "./types";

/** 폼 상태. 입력 중 빈 칸을 허용하려고 숫자 필드는 문자열로 보관 */
export type Conditions = {
  age: string;
  /** 월소득(만원) */
  monthlyIncome: string;
  homeless: boolean;
  independent: boolean;
  /** 1인 가구 */
  single: boolean;
  housingType: HousingType;
  /** 보유 보증금(만원) */
  myDeposit: string;
  dong: string;
};

export const HOUSING_TYPE_LABEL: Record<HousingType, string> = {
  officetel: "오피스텔",
  villa: "연립·다세대",
};

const toNumber = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** 폼 상태 → UserInput. 음수·NaN은 0. 거주지는 광진구로 가정(types.ts 기본값) */
export function toUserInput(c: Conditions): UserInput {
  return {
    age: toNumber(c.age),
    monthlyIncome: toNumber(c.monthlyIncome),
    homeless: c.homeless === true,
    independent: c.independent === true,
    single: c.single === true,
    housingType: c.housingType === "villa" ? "villa" : "officetel",
    myDeposit: toNumber(c.myDeposit),
  };
}
