import Link from "next/link";
import { computeDongMedians, loadPolicyData, loadRentData } from "@/lib/data";
import { DISTRICT } from "@/lib/region";
import Mascot from "./components/Mascot";

const STEPS = [
  { title: "내 조건 입력", body: "나이, 소득, 찾는 집의 보증금·월세를 입력합니다." },
  { title: "정책 자동 매칭", body: "받을 수 있는 청년 주거정책을 찾아 지원금을 반영합니다." },
  { title: "진짜 주거비 확인", body: "보증금 기회비용까지 더한 실질 월·연 주거비와 동네 순위를 봅니다." },
];

export default function Home() {
  const dongCount = Object.keys(computeDongMedians(loadRentData())).length;
  const policyCount = loadPolicyData().length;

  return (
    <>
      {/* 히어로 */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[1fr_auto] md:py-24">
          <div className="flex flex-col gap-5">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Youth Real Housing Cost</span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              지원정책을 반영한
              <br />
              나의 <span className="text-accent">진짜 주거비</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted">
              월세만 보면 놓치는 비용이 있습니다. 집구해조는 보증금의 기회비용과 받을 수 있는 청년 주거정책까지 계산해,{" "}
              {DISTRICT}에서 실제로 한 달에 얼마가 드는지 알려 드립니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/diagnosis"
                className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.3)] transition hover:bg-accent/90"
              >
                내 주거비 진단하기
              </Link>
              <Link
                href="/compare"
                className="rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold transition hover:bg-background"
              >
                동네 비교 보기
              </Link>
            </div>
          </div>
          <div className="relative mx-auto grid h-56 w-56 place-items-center rounded-full bg-accent-soft md:h-64 md:w-64">
            <Mascot awake className="mascot-bob h-40 w-40 md:h-48 md:w-48" />
          </div>
        </div>
      </section>

      {/* 이용 방법 */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-2xl font-bold tracking-tight">이렇게 이용하세요</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-border bg-surface p-5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 실질 주거비란 */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">실질 주거비란?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              보증금도 비용입니다. 은행에 두었다면 받았을 이자만큼을 매달 내는 셈이죠. 여기에 월세를 더하고, 받을 수 있는
              정책 지원금을 빼면 실제로 부담하는 주거비가 나옵니다.
            </p>
            <Link href="/about" className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
              계산 방법 자세히 보기 →
            </Link>
          </div>
          <div className="rounded-2xl bg-background p-5 text-sm">
            <div className="font-mono text-[13px] leading-7">
              <div>
                월세 <span className="text-muted">+</span> 보증금 × 연이율 ÷ 12
              </div>
              <div>
                <span className="text-muted">−</span> 정책 지원금
              </div>
              <div className="mt-2 border-t border-border pt-2 font-semibold text-accent">= 실질 월 주거비</div>
            </div>
          </div>
        </div>
      </section>

      {/* 숫자 */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            { k: "대상 지역", v: `서울 ${DISTRICT}` },
            { k: "비교하는 동", v: `${dongCount}개 법정동` },
            { k: "반영하는 정책", v: `청년 주거정책 ${policyCount}건` },
          ].map(({ k, v }) => (
            <div key={k} className="rounded-2xl border border-border bg-surface p-5">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="mt-1 text-lg font-bold">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
