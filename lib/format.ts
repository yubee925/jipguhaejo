/** 만원 단위 금액 표시. 1억 이상은 "3억 2,500만원" 형태. */
export function formatManwon(value: number, digits = 0): string {
  const rounded = Number(value.toFixed(digits));
  if (Math.abs(rounded) >= 10000) {
    const eok = Math.trunc(rounded / 10000);
    const rest = Math.round(Math.abs(rounded - eok * 10000));
    return rest ? `${eok}억 ${rest.toLocaleString("ko-KR")}만원` : `${eok}억원`;
  }
  return `${rounded.toLocaleString("ko-KR", { maximumFractionDigits: digits })}만원`;
}
