// policies.csv 열만으로 표현되지 않는 정책별 규칙. data/guide/guide_input_fields.md "판정 규칙" 기준.
// 정책이 바뀌면 이 파일과 policies.csv 만 고친다.
import type { Constants, UserInput } from "./types";

/** 추첨으로 선정하는 정책 (policies.csv 에 lottery 열이 없어서 여기서 관리) */
export const LOTTERY_POLICY_IDS = ["P03"];

/** 부모와 따로 거주(independent)해야 하는 정책 */
export const INDEPENDENT_POLICY_IDS = ["P01", "P12"];

/** 이미 받는 지원(current_support) 중 정책 ID 가 아닌 것 → 함께 못 받는 정책 */
export const SUPPORT_EXCLUSIVE: Record<string, string[]> = {
  YOUTH_ALLOWANCE: ["P02"],
};

/**
 * parent_income_check = COND 인 정책이 부모 포함 가구소득(UNDER_100)을 요구하는 조건.
 * 목록에 없는 COND 정책은 "확인 필요"만 표시한다.
 */
export const PARENT_INCOME_NEEDED: Record<string, (u: UserInput, k: Constants) => boolean> = {
  // 만 30세 미만이고 본인소득 중위 50% 미만일 때만 부모 심사
  P01: (u, k) => u.age < 30 && (u.monthlyIncome / k.MEDIAN_1P) * 100 < 50,
  // 본인 무소득일 때만 부모 합산
  P09: (u) => u.monthlyIncome === 0,
  P11: (u) => u.monthlyIncome === 0,
};

export interface RuleCheck {
  reasons: string[];
  warnings: string[];
}

/**
 * 월세가 rent_max(60) 를 넘어도 보증금 월세 환산액 + 월세가 상한 이하이면 신청 가능한 예외.
 * policies.csv 에는 rent_max 만 있어 이런 매물이 탈락 처리되므로, 판정은 그대로 두고 확인 안내만 붙인다.
 * 환산액 = 보증금 × 환산율 ÷ 12 (천원 단위 절사)
 */
function rentSumException(
  listing: { deposit: number; rent: number },
  o: { depositMax: number; depositInclusive: boolean; rentMax: number; ratePct: number; sumMax: number },
): RuleCheck {
  const depositOk = o.depositInclusive ? listing.deposit <= o.depositMax : listing.deposit < o.depositMax;
  const converted = Math.floor(((listing.deposit * o.ratePct) / 100 / 12) * 10) / 10;
  const warnings =
    listing.rent > o.rentMax && depositOk && listing.rent + converted <= o.sumMax
      ? [`보증금·월세 환산 합계 ${o.sumMax}만원 이하인지 확인 필요`]
      : [];
  return { reasons: [], warnings };
}

/** 특정 정책 전용 조건 (열로 표현되지 않는 것) */
export const EXTRA_RULES: Record<string, (u: UserInput, listing: { deposit: number; rent: number }) => RuleCheck> = {
  P08: (u, listing) => {
    const reasons: string[] = [];
    const warnings: string[] = [];
    if (u.basicBenefitFamily) reasons.push("급여 수급 가구 제외");
    if (u.parentHouseRent) reasons.push("부모 소유 주택 임차 제외");
    if (u.movedInYear === "BEFORE_2024") reasons.push("2024.1.1 이후 서울 전입·이사");
    else if (u.movedInYear !== "AFTER_2024") warnings.push("서울 전입 시점(2024.1.1 이후) 확인 필요");
    if (listing.deposit + listing.rent * 100 > 20000) reasons.push("거래금액(보증금+월세×100) 2억 이하 매물");
    return { reasons, warnings };
  },
  // 서울시 공고 제2026-1440호 4쪽 ㅇ(거주): 보증금 8천만원 이하 + 월세 60만원 초과 시
  // 환산액(4.5%, '25.12. 기준) + 월세 90만원 이하면 신청 가능
  P02: (_u, listing) =>
    rentSumException(listing, { depositMax: 8000, depositInclusive: true, rentMax: 60, ratePct: 4.5, sumMax: 90 }),
  // 광진구 공고 제2026-977호 2쪽 ○(거주), 3쪽 【보증금 월세 환산액】: 보증금 8천만원 미만 + 월세 60만원 초과 시
  // 환산액(4.75%, 2026.7. 기준) + 월세 96만원 이하면 신청 가능
  P03: (_u, listing) =>
    rentSumException(listing, { depositMax: 8000, depositInclusive: false, rentMax: 60, ratePct: 4.75, sumMax: 96 }),
  P12: (u) => {
    const reasons: string[] = [];
    const warnings: string[] = [];
    if (u.parentRegion === "SEOUL") reasons.push("부모 서울 거주(분리 불인정)");
    else if (u.parentRegion == null || u.parentRegion === "UNKNOWN") warnings.push("부모 주소지(서울 외) 확인 필요");
    return { reasons, warnings };
  },
};
