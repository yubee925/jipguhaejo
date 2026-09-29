"use client";

import Link from "next/link";
import { DISTRICT } from "@/lib/region";
import { useApp } from "../components/AppProvider";
import ConditionForm from "../components/ConditionForm";
import DetailPanel from "../components/DetailPanel";

export default function DiagnosisView() {
  const { conditions, setConditions, selectDong, dongMedians, cost, matched, parsed } = useApp();

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="flex flex-col gap-3 lg:sticky lg:top-24">
        <ConditionForm value={conditions} onChange={setConditions} dongMedians={dongMedians} onDongChange={selectDong} />
        <Link href="/compare" className="text-center text-sm font-semibold text-accent hover:underline">
          다른 동과 비교해 보기 →
        </Link>
      </div>
      <DetailPanel
        cost={cost}
        matched={matched}
        listing={parsed.listing}
        annualRate={parsed.annualRate}
        context={`${DISTRICT} ${conditions.dong} · ${conditions.contractType}`}
      />
    </div>
  );
}
