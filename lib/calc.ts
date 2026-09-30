// 순수 계산 함수 (파일 읽기 없음 → 테스트 가능). CLAUDE.md "계산식" 기준.
import type { RentRecord, HousingType } from "./types";

export const MIN_SAMPLE = 10;
export const AREA_MAX = 40;

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** ① 거래별 환산 월세 = 월세 + 보증금 × r ÷ 12 (r: 0.05 형태) */
export function convertedRent(rent: number, deposit: number, r: number): number {
  return rent + (deposit * r) / 12;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface DongBase {
  dong: string;
  count: number;
  C: number | null; // 환산 월세 중앙값
  rentMedian: number | null; // 참고: 월세 중앙값 (지원액 상한 계산용)
  lowSample: boolean;
}

/** ② 동 기준 주거비 C: 동 + 주택유형 + 신규계약 + 면적 이하 거래의 환산 월세 중앙값 */
export function dongBase(
  records: RentRecord[],
  dong: string,
  housingType: HousingType,
  r: number,
  opts: { newOnly?: boolean; areaMax?: number } = {},
): DongBase {
  const { newOnly = true, areaMax = AREA_MAX } = opts;
  const rows = records.filter(
    (x) =>
      x.dong === dong &&
      x.housing_type === housingType &&
      x.area_m2 <= areaMax &&
      (!newOnly || x.is_new === "Y"),
  );
  const C = median(rows.map((x) => convertedRent(x.rent, x.deposit, r)));
  return {
    dong,
    count: rows.length,
    C,
    rentMedian: median(rows.map((x) => x.rent)),
    lowSample: rows.length < MIN_SAMPLE,
  };
}

export interface MonthlySupport {
  policyId: string;
  monthly: number; // 인정 지원액 = min(지원액, 월세)
  months: number;
}

/** ③ 인정 지원액 */
export function recognizedSupport(benefitMonthly: number, actualRent: number): number {
  return Math.max(0, Math.min(benefitMonthly, actualRent));
}

/** ④ 실질 월 주거비 */
export function realMonthly(C: number, S: number) {
  const real = Math.max(C - S, 0);
  return { real, savingRate: C > 0 ? (S / C) * 100 : 0 };
}

/** ⑤ 연차별 주거비: 각 달에 유효한 지원금만 차감 */
export function yearlyCost(C: number, supports: MonthlySupport[], years = 3) {
  const perYear: number[] = [];
  for (let y = 0; y < years; y++) {
    let sum = 0;
    for (let m = 0; m < 12; m++) {
      const idx = y * 12 + m;
      const s = supports.filter((p) => idx < p.months).reduce((a, p) => a + p.monthly, 0);
      sum += Math.max(C - s, 0);
    }
    perYear.push(sum);
  }
  const total = perYear.reduce((a, b) => a + b, 0);
  return { perYear, total, withoutSupport: C * 12 * years, saved: C * 12 * years - total };
}

/** ⑦ 내 보증금 기준 예상 월세 */
export function expectedRent(C: number, myDeposit: number, r: number): number {
  return Math.max(C - (myDeposit * r) / 12, 0);
}

/** ⑥ 지도 색: 하위 1/3 green, 중간 orange, 상위 1/3 red */
export function colorBuckets(values: { dong: string; value: number }[]) {
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const n = sorted.length;
  const out: Record<string, "green" | "orange" | "red"> = {};
  sorted.forEach((v, i) => {
    out[v.dong] = i < n / 3 ? "green" : i < (2 * n) / 3 ? "orange" : "red";
  });
  return out;
}
