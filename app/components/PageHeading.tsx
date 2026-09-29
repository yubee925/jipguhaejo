import type { ReactNode } from "react";

/** 각 페이지 상단 제목 영역 */
export default function PageHeading({ label, title, children }: { label: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{label}</span>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {children && <p className="max-w-2xl text-sm leading-relaxed text-muted">{children}</p>}
    </div>
  );
}
