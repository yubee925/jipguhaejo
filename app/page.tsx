import { computeDongMedians, loadDongGeoJson, loadPolicyData, loadRentData } from "@/lib/data";
import Dashboard from "./components/Dashboard";

export default function Home() {
  const policies = loadPolicyData();
  const dongMedians = computeDongMedians(loadRentData());
  const geojson = loadDongGeoJson();

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-5 py-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Youth Real Housing Cost</span>
          <h1 className="mt-0.5 text-2xl font-bold leading-tight tracking-tight">집구해조</h1>
          <p className="mt-0.5 text-sm text-muted">지원정책을 반영한 나의 진짜 주거비</p>
        </div>
        <span className="hidden text-xs text-muted sm:block">청년 실질 주거비 진단 대시보드</span>
      </header>

      <Dashboard policies={policies} dongMedians={dongMedians} geojson={geojson} />

      <footer className="shrink-0 border-t border-border bg-surface px-5 py-2 text-[11px] text-muted">
        © 2026 집구해조
      </footer>
    </div>
  );
}
