import type { Metadata } from "next";
import { AREA_MAX, MIN_SAMPLE } from "@/lib/calc";
import { loadConstants } from "@/lib/data";
import { DISTRICT } from "@/lib/region";
import PageHeading from "../components/PageHeading";

export const metadata: Metadata = { title: "서비스 소개" };

const TEAM = [
  { name: "최예나", school: "성균관대학교", major: "글로벌리더학부" },
  { name: "유병욱", school: "가천대학교", major: "스마트시티학과·도시계획학전공" },
];


export default function AboutPage() {
  const k = loadConstants();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-5 py-10">
      <PageHeading label="About" title="서비스 소개">
        집구해조는 시세와 청년 주거정책을 함께 계산해, 청년이 실제로 부담하는 &ldquo;체감 주거비&rdquo;를 진단하는 웹
        서비스입니다.
      </PageHeading>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">계산 방법</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
          <li>
            <b>거래별 환산 월세</b> = 월세 + 보증금 × 연 {k.CONVERSION_RATE}% ÷ 12 (전월세 전환율 = 한국은행 기준금리 {k.BOK_BASE_RATE}% + 2%p)
          </li>
          <li>
            <b>동 기준 주거비</b> = 그 동·선택한 주택유형·전용 {AREA_MAX}㎡ 이하 신규 월세 거래들의 환산 월세 중앙값. 거래가{" "}
            {MIN_SAMPLE}건 미만이면 &ldquo;표본 부족&rdquo;으로 표시합니다.
          </li>
          <li>
            <b>정책 지원금</b> = 받을 수 있는 월세 지원의 인정 지원액(월 지원액과 실제 월세 중 작은 값) 합. 같이 받을 수 없는
            정책끼리는 가장 유리한 1개만 반영합니다. 추첨·모집 마감 정책은 따로 &ldquo;선정 시&rdquo;, &ldquo;내년 신청
            시&rdquo;로 보여 줍니다.
          </li>
          <li>
            <b>실질 월 주거비</b> = 동 기준 주거비 − 정책 지원금. 연 주거비는 지원 기간이 끝나는 달을 반영해 1~3년차로
            계산합니다.
          </li>
        </ol>
        <p className="text-xs text-muted">
          소득은 월소득 ÷ 2026년 1인가구 기준중위소득({k.MEDIAN_1P.toLocaleString("ko-KR")}만원)으로 비교합니다. 대출·이자지원·초기 비용·임대주택·복지급여는
          월 계산에 넣지 않고 안내 카드로 보여 줍니다.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">데이터</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed">
          <li>지역: 서울 {DISTRICT} 법정동</li>
          <li>전월세 거래: 국토교통부 전월세 실거래가, 광진구 오피스텔·연립다세대 월세 5,578건 (2025년 9월 ~ 2026년 9월, 전용 40㎡ 이하)</li>
          <li>정책: 국토교통부·서울시·광진구 청년 주거정책 (현재 수치는 예시, 공고 확인 후 갱신 예정)</li>
          <li>기준값: 보건복지부 2026년 기준중위소득, 한국은행 기준금리</li>
          <li>지도: OpenStreetMap</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 text-sm leading-relaxed">
        <h2 className="font-bold">안내</h2>
        <p className="mt-1 text-muted">
          모든 금액은 예상 금액이며 최종 자격과 지원 금액은 각 정책 공고 기준입니다. 관리비, 중개보수, 이사비는 포함하지
          않습니다.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">만든 사람들</h2>
        <p className="text-sm font-semibold">팀 집구해조</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {TEAM.map((m) => (
            <li key={m.name} className="rounded-2xl border border-border bg-surface p-4">
              <div className="font-semibold">{m.name}</div>
              <div className="mt-1 text-sm text-muted">{m.school}</div>
              <div className="text-sm text-muted">{m.major}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
