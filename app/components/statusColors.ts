/** compareDongs 의 colors 값 → 화면 색 (CLAUDE.md "디자인" 상태 색) */
export const STATUS_COLOR = {
  green: "#5B9A78",
  orange: "#E0A458",
  red: "#D0654F",
} as const;

export const STATUS_LABEL: Record<keyof typeof STATUS_COLOR, string> = {
  green: "저렴",
  orange: "보통",
  red: "부담 큼",
};
