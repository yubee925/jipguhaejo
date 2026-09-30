import type { Metadata } from "next";
import { loadListings } from "@/lib/listings";
import PageHeading from "../components/PageHeading";
import RecommendView from "./RecommendView";

export const metadata: Metadata = { title: "집 추천" };

export default function RecommendPage() {
  // 추천은 신규 계약만 쓰므로 화면에 넘기는 데이터도 신규 계약만
  const listings = loadListings().filter((l) => l.is_new === "Y");
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10">
      <PageHeading label="Recommend" title="내 조건에 맞는 집 추천">
        최근 1년 광진구 월세 실거래 중에서, 내 조건으로 받을 수 있는 정책 지원까지 반영했을 때 실제 부담이 가장 적었던 집을
        골라 드립니다.
      </PageHeading>
      <RecommendView listings={listings} />
    </div>
  );
}
