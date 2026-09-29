/**
 * 순서형 다색 팔레트 7단계: 노랑(저렴) → 초록 → 청록 → 파랑 → 보라 → 자주 → 암갈색(비쌈).
 * 색상은 다양하지만 밝기가 한 방향으로 줄어들어 순서가 읽힌다.
 * dataviz 검증기 기준 이웃 색 CVD ΔE ≥ 9.3, 일반 시야 ΔE ≥ 15.8, 밝기 단조 감소.
 */
export const ORDERED = ["#f9e03f", "#5bd97f", "#24aeb5", "#0d7dd4", "#6c3cab", "#72034a", "#421201"] as const;

/**
 * 순위 기준 구간 번호(0부터, 저렴한 쪽이 0)를 항목마다 매긴다.
 * 값 간격이 고르지 않아도, 값이 같아도 항목마다 다른 색이 돌아가게 순위로 나눈다.
 * 값이 같으면 이름 가나다순으로 앞선 쪽이 더 밝은(저렴한 쪽) 색.
 */
export function rankClasses(values: Record<string, number>, n: number = ORDERED.length): Record<string, number> {
  const keys = Object.keys(values).sort((a, b) => values[a] - values[b] || a.localeCompare(b, "ko"));
  if (keys.length === 1) return { [keys[0]]: Math.floor(n / 2) };
  return Object.fromEntries(keys.map((k, i) => [k, Math.round((i / (keys.length - 1)) * (n - 1))]));
}
