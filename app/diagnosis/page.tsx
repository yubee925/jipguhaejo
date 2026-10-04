import type { Metadata } from "next";
import { loadBuildingPoints } from "@/lib/buildingPoints";
import PageHeading from "../components/PageHeading";
import DiagnosisView from "./DiagnosisView";

export const metadata: Metadata = { title: "주거비 진단" };

export default function DiagnosisPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10">
      <PageHeading label="Diagnosis" title="내 주거비 진단">
        조건을 입력하면 받을 수 있는 정책을 찾아 지원금을 반영한 실질 주거비를 바로 계산합니다.
      </PageHeading>
      <DiagnosisView points={loadBuildingPoints()} />
    </div>
  );
}
