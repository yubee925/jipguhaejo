// data/*.csv 스키마. 금액 단위는 모두 만원.

export type ContractType = "전세" | "월세";

export type RentRecord = {
  id: string;
  sigungu: string;
  dong: string;
  dong_code: string;
  building_type: string;
  contract_type: ContractType;
  deposit: number;
  monthly_rent: number;
  area_m2: number;
  floor: number;
  built_year: number;
  contract_date: string;
  lat: number;
  lng: number;
};

export type SupportType = "월세지원" | "이자지원" | "대출";

export type Policy = {
  policy_id: string;
  policy_name: string;
  provider: string;
  target: string;
  age_min: number;
  age_max: number;
  income_limit_manwon: number;
  support_type: SupportType;
  /** 월세지원: 월 지원액, 이자지원·대출: 지원 대상 보증금 한도 */
  support_amount_manwon: number;
  support_period_months: number;
  /** 0이면 제한 없음 */
  max_deposit_manwon: number;
  /** 0이면 제한 없음 */
  max_monthly_rent_manwon: number;
  region: string;
  description: string;
};

/** 동 × 계약유형별 보증금·월세 중앙값 */
export type DongMedians = Record<string, Record<ContractType, { deposit: number; monthly_rent: number }>>;

export type DongFeatureProps = { dong: string; dong_code: string; sigungu: string };
