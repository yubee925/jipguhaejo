import type { Policy } from "@/lib/types";

/** 정책 카드 맨 아래 전체 폭 "신청·공고 보기" 버튼 */
export default function PolicyApplyLink({ p }: { p: Policy }) {
  const base = "flex w-full items-center justify-center whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold";
  return p.source_url ? (
    <a
      href={p.source_url}
      target="_blank"
      rel="noreferrer"
      className={`${base} border-accent/30 text-accent transition hover:border-accent/50 hover:bg-accent-soft`}
    >
      신청·공고 보기 →
    </a>
  ) : (
    <span className={`${base} border-border text-muted`}>공고 링크 준비 중</span>
  );
}
