/**
 * 순서형 다색 팔레트(viridis 계열): 노랑(저렴) → 초록 → 청록 → 남색 → 보라(비쌈).
 * 색상은 다양하지만 밝기가 한 방향으로 줄어들어 순서가 읽힌다.
 */
export const ORDERED = ["#fde725", "#5ec962", "#21918c", "#3b528b", "#440154"] as const;

/**
 * 순위(분위) 기준 구간 번호(0부터, 저렴한 쪽이 0).
 * 값 간격이 고르지 않아도 동마다 서로 다른 색이 돌아가게 순위로 나눈다. 같은 값은 같은 구간.
 */
export function rankClass(value: number, values: number[], n = ORDERED.length): number {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  if (sorted.length <= 1) return Math.floor(n / 2);
  const rank = sorted.findIndex((v) => v >= value);
  const idx = rank === -1 ? sorted.length - 1 : rank;
  return Math.round((idx / (sorted.length - 1)) * (n - 1));
}
