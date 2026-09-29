"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "./nav";

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-[900] border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">Youth Real Housing Cost</span>
          <span className="mt-1 text-xl font-bold tracking-tight">집구해조</span>
        </Link>

        <nav aria-label="주 메뉴" className="-mx-1 flex gap-1 overflow-x-auto text-sm">
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-2 transition ${
                  active ? "bg-accent-soft font-semibold text-accent" : "text-muted hover:bg-background hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
