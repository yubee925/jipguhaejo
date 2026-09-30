// 집구해조 공통 타입 (컬럼 의미는 data/columns_guide.csv 기준)

export type HousingType = "officetel" | "villa";

export interface RentRecord {
  dong: string;
  housing_type: HousingType;
  area_m2: number;
  contract_ym: string;
  deposit: number; // 만원
  rent: number; // 만원
  is_new: "Y" | "N" | "";
}

export type CategoryCode = "RENT" | "LOAN" | "INTEREST" | "REFUND" | "HOUSING" | "BENEFIT";
export type IncomeType = "MEDIAN_PCT" | "ANNUAL" | "URBAN_PCT";

export interface Policy {
  policy_id: string;
  name: string;
  agency: string;
  level: string;
  min_age: number | null;
  max_age: number | null;
  residence: string; // none / seoul / gwangjin
  homeless_required: boolean;
  independent_required: boolean;
  category_code: CategoryCode;
  income_type: IncomeType | "";
  income_min: number | null;
  income_max: number | null;
  single_only: boolean;
  asset_max: number | null;
  parent_income_check: "Y" | "COND" | "N";
  housing_type: "RENT" | "JEONSE" | "BOTH" | "NA";
  deposit_max: number | null;
  rent_max: number | null;
  benefit_monthly: number | null;
  benefit_months: number | null;
  benefit_lump: number | null;
  loan_limit: number | null;
  loan_rate: number | null;
  exclusive_with: string[];
  apply_open: boolean;
  lottery: boolean; // 추첨 선정 여부 (컬럼이 없으면 false)
  verify_needed: boolean;
  source_url: string;
  notes: string;
}

export interface Constants {
  MEDIAN_1P: number; // 만원/월
  URBAN_1P: number; // 만원/월
  CONVERSION_RATE: number; // % (예: 5)
  [key: string]: number;
}

export interface UserInput {
  age: number;
  monthlyIncome: number; // 만원
  homeless: boolean;
  independent: boolean;
  single: boolean;
  housingType: HousingType;
  myDeposit?: number; // 만원
  residence?: { seoul: boolean; gwangjin: boolean }; // 기본: 광진구 거주로 가정
}

export interface MatchResult {
  policy: Policy;
  eligible: boolean;
  reasons: string[]; // 불충족 사유
  warnings: string[]; // 확인 필요 안내
  bucket: "confirmed" | "lottery" | "next_year" | "card" | "ineligible";
}
