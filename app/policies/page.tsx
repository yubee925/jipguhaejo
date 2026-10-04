import type { Metadata } from "next";
import PageHeading from "../components/PageHeading";
import PolicyList from "./PolicyList";

export const metadata: Metadata = { title: "청년 주거정책" };

export default function PoliciesPage() {
  return (
    // 한글이 단어 중간에서 끊기지 않게 (예: "이/하", "대/출") 단어 단위로 줄바꿈
    <div className="mx-auto flex max-w-6xl flex-col gap-6 break-keep px-5 py-10">
      <PageHeading label="Policies" title="청년 주거정책">
        집구해조가 계산에 반영하는 정책입니다. 내 조건으로 받을 수 있는지도 함께 표시합니다.
      </PageHeading>
      <PolicyList />
    </div>
  );
}
