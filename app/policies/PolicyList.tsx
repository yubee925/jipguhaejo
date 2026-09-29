"use client";

import Link from "next/link";
import { policyMonthlySupport } from "@/lib/cost";
import { formatManwon } from "@/lib/format";
import { policyRejectReason } from "@/lib/policy";
import type { Policy } from "@/lib/types";
import { useApp } from "../components/AppProvider";

const TYPE_LABEL: Record<Policy["support_type"], string> = {
  월세지원: "월세 지원",
  이자지원: "보증금 이자 지원",
  대출: "보증금 대출",
};

function supportText(p: Policy) {
  return p.support_type === "월세지원"
    ? `월 ${formatManwon(p.support_amount_manwon)} · 최대 ${p.support_period_months}개월`
    : `보증금 ${formatManwon(p.support_amount_manwon)}까지 · ${p.support_period_months}개월`;
}

export default function PolicyList() {
  const { policies, parsed, cost } = useApp();
  const appliedIds = new Set(cost.applied.map((p) => p.policy_id));

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted ring-1 ring-border">
        정책 수치는 예시이며 실제 조건은 각 공고를 확인하세요. 해당 여부는{" "}
        <Link href="/diagnosis" className="font-semibold text-accent hover:underline">
          주거비 진단
        </Link>
        에 입력한 조건 기준입니다.
      </p>

      <ul className="grid gap-4 md:grid-cols-2">
        {policies.map((p) => {
          const reason = policyRejectReason(parsed.profile, p, parsed.listing);
          const ok = reason === null;
          const monthly = ok ? policyMonthlySupport(parsed.listing, p, parsed.annualRate) : 0;
          return (
            <li key={p.policy_id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted">
                    {p.provider} · {TYPE_LABEL[p.support_type]}
                  </div>
                  <h2 className="mt-1 text-base font-bold leading-snug">{p.policy_name}</h2>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    ok ? "bg-accent-soft text-accent" : "bg-background text-muted"
                  }`}
                >
                  {ok ? (appliedIds.has(p.policy_id) ? "✓ 해당 · 적용" : "✓ 해당") : "해당 안 됨"}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{p.description}</p>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-background p-3 text-xs">
                <div>
                  <dt className="text-muted">대상</dt>
                  <dd className="font-medium">
                    {p.target} · {p.age_max >= 99 ? `${p.age_min}세 이상` : `${p.age_min}~${p.age_max}세`}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">소득 한도</dt>
                  <dd className="font-medium">연 {formatManwon(p.income_limit_manwon)}</dd>
                </div>
                <div>
                  <dt className="text-muted">지원</dt>
                  <dd className="font-medium">{supportText(p)}</dd>
                </div>
                <div>
                  <dt className="text-muted">매물 조건</dt>
                  <dd className="font-medium">
                    {p.max_deposit_manwon > 0 ? `보증금 ${formatManwon(p.max_deposit_manwon)} 이하` : "제한 없음"}
                    {p.max_monthly_rent_manwon > 0 && ` · 월세 ${formatManwon(p.max_monthly_rent_manwon)} 이하`}
                  </dd>
                </div>
              </dl>

              <div className="text-xs">
                {ok ? (
                  <span className="text-positive">
                    내 조건 기준 월 <span className="font-semibold">{formatManwon(monthly, 1)}</span> 아낄 수 있어요
                  </span>
                ) : (
                  <span className="text-muted">해당 안 되는 이유: {reason}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
