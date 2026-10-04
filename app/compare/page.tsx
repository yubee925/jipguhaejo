import type { Metadata } from "next";
import PageHeading from "../components/PageHeading";
import CompareView from "./CompareView";

export const metadata: Metadata = { title: "동네 비교" };

export default function ComparePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10">
      <PageHeading label="Compare" title="실거래로 본 동네별 실질 주거비 비교">
        국토교통부 실거래가(최근 1년 신규 월세 계약)로 광진구의 모든 동을 같은 조건으로 계산했습니다. 각 동의 값은 (월세 +
        보증금 환산분)의 중앙값에서 받을 수 있는 월세 지원금을 뺀 금액입니다. 관리비는 별도이고, 동을 누르면 그 동의 결과를 볼 수
        있습니다.
      </PageHeading>
      <CompareView />
    </div>
  );
}
