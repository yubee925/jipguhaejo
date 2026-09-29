import Link from "next/link";
import { NAV } from "./nav";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-xs text-muted sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-foreground">© 2026 집구해조</span>
          <span>데이터: 국토교통부 전월세 실거래가 형식의 샘플 데이터, 각 정책 공고(예시 수치)</span>
          <span>예상 금액이며 최종 자격은 공고 기준입니다.</span>
        </div>
        <nav aria-label="바닥 메뉴" className="flex flex-wrap gap-x-4 gap-y-1">
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-foreground">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
