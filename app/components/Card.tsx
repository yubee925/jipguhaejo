import type { ReactNode } from "react";
import StepBadge from "./StepBadge";

type CardProps = {
  title: string;
  subtitle?: string;
  /** 사용 순서 번호 */
  step?: number;
  className?: string;
  children?: ReactNode;
};

export default function Card({ title, subtitle, step, className = "", children }: CardProps) {
  return (
    <section
      className={`flex flex-col rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          {step !== undefined && <StepBadge step={step} />}
          {title}
        </h2>
        {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
      </header>
      <div className="flex flex-1 flex-col p-4">
        {children ?? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted min-h-24">
            준비 중
          </div>
        )}
      </div>
    </section>
  );
}
