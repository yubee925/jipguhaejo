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
  // 2026-10 최종본에서 추가된 열 (data/guide/guide_policies.md). 없으면 제한 없음
  area_max_m2?: number | null;
  marriage_req?: "ANY" | "SINGLE" | "SINGLE_OR_NEWLYWED";
  job_req?: string;
  head_req?: boolean;
  special_req?: "NONE" | "BASIC_BENEFIT_FAMILY";
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
  // 아래는 data/input_fields.csv 기준. 없으면 input_fields.csv 의 기본값으로 본다
  marital?: "SINGLE" | "NEWLYWED" | "MARRIED"; // 기본 SINGLE
  job?: "EMPLOYED" | "JOBSEEKER" | "STUDENT" | "FREELANCE"; // 판정 미사용 (AI 설명용)
  resident?: "GWANGJIN" | "SEOUL_OTHER" | "OTHER"; // 주민등록지, 기본 GWANGJIN
  houseHead?: boolean; // 세대주, 기본 Y
  asset?: number | null; // 본인 총자산(만원), null = 모름
  parentIncome?: "UNDER_100" | "OVER_100" | "UNKNOWN";
  basicBenefitFamily?: boolean; // 기초생활수급 가구(본인 또는 부모)
  parentRegion?: "SEOUL" | "OTHER_METRO" | "OTHER" | "UNKNOWN";
  movedInYear?: "AFTER_2024" | "BEFORE_2024" | "UNKNOWN";
  parentHouseRent?: boolean; // 부모 소유 집에 세 들어 사는 중
  currentSupport?: string[]; // 이미 받는 지원 (YOUTH_ALLOWANCE, P01, P03, P12)
}

export interface MatchResult {
  policy: Policy;
  eligible: boolean;
  reasons: string[]; // 불충족 사유
  warnings: string[]; // 확인 필요 안내
  /** na: 전세 전용 정책이라 월세 서비스에서 해당 없음 */
  bucket: "confirmed" | "lottery" | "next_year" | "card" | "ineligible" | "na";
}
