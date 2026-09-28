import type { RentRecord } from "./types";

/** 중앙값. 빈 배열이면 NaN. */
export function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export type DongMedian = { dong: string; count: number; median: number };

/** 동별 중앙값. valueOf로 대상 값을 고른다(예: r => r.deposit). 결과는 동 이름순. */
export function medianByDong(records: RentRecord[], valueOf: (r: RentRecord) => number): DongMedian[] {
  const groups = new Map<string, number[]>();
  for (const r of records) {
    const list = groups.get(r.dong) ?? [];
    list.push(valueOf(r));
    groups.set(r.dong, list);
  }
  return [...groups.entries()]
    .map(([dong, values]) => ({ dong, count: values.length, median: median(values) }))
    .sort((a, b) => a.dong.localeCompare(b.dong, "ko"));
}
