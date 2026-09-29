import type { Metadata } from "next";
import { DEFAULT_ANNUAL_RATE, DEFAULT_POLICY_LOAN_RATE } from "@/lib/cost";
import { DISTRICT } from "@/lib/region";
import PageHeading from "../components/PageHeading";

export const metadata: Metadata = { title: "서비스 소개" };

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-5 py-10">
      <PageHeading label="About" title="서비스 소개">
        집구해조는 시세와 청년 주거정책을 함께 계산해, 청년이 실제로 부담하는 &ldquo;체감 주거비&rdquo;를 진단하는 웹
        서비스입니다.
      </PageHeading>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">계산 방법</h2>
        <ol className="flex flex-col gap-2 text-sm leading-relaxed">
          <li>
            <b>보증금 기회비용</b> = 보증금 × 연 {pct(DEFAULT_ANNUAL_RATE)} ÷ 12 (보증금을 예금했다면 받았을 이자)
          </li>
          <li>
            <b>지원 전 월 주거비</b> = 월세 + 보증금 기회비용
          </li>
          <li>
            <b>정책 지원금</b> = 월세 지원은 월 지원액(월세를 넘지 않게), 보증금 이자지원·대출은 지원 한도 안의 보증금에
            대해 금리 차이(연 {pct(DEFAULT_ANNUAL_RATE)} − {pct(DEFAULT_POLICY_LOAN_RATE)})만큼
          </li>
          <li>
            <b>실질 월 주거비</b> = 지원 전 월 주거비 − 정책 지원금 (연 주거비는 × 12)
          </li>
        </ol>
        <p className="text-xs text-muted">같은 유형의 정책은 함께 받을 수 없다고 보고, 지원액이 가장 큰 1건만 반영합니다.</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">데이터</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed">
          <li>지역: 서울 {DISTRICT} 법정동</li>
          <li>전월세 거래: 국토교통부 전월세 실거래가 형식 (현재는 샘플 데이터, 실제 데이터로 교체 예정)</li>
          <li>정책: 서울시·주택도시기금 청년 주거정책 (현재 수치는 예시, 공고 확인 후 갱신 예정)</li>
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

      <section className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">만든 사람들</h2>
        <p className="text-sm text-muted">팀 집구해조</p>
      </section>
    </div>
  );
}
