import type { Metadata } from "next";
import PageHeading from "../components/PageHeading";
import CompareView from "./CompareView";

export const metadata: Metadata = { title: "동네 비교" };

export default function ComparePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10">
      <PageHeading label="Compare" title="동네별 실질 주거비 비교">
        같은 조건으로 광진구의 모든 동을 계산해 비교합니다. 동을 누르면 그 동의 결과를 볼 수 있습니다.
      </PageHeading>
      <CompareView />
    </div>
  );
}
