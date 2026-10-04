/** 비교 화면용: 만원 금액을 항상 소수 한 자리로 (75 → "75.0만원") */
export const won1 = (v: number) =>
  `${v.toLocaleString("ko-KR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}만원`;
