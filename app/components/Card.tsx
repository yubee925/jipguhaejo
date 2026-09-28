import type { ReactNode } from "react";

type CardProps = {
  title: string;
  subtitle?: string;
  className?: string;
  children?: ReactNode;
};

export default function Card({ title, subtitle, className = "", children }: CardProps) {
  return (
    <section
      className={`flex flex-col rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}
    >
      <header className="flex items-baseline justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
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
