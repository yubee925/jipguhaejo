/** 필수 입력(나이·월소득)이 비었을 때 결과 대신 보여 주는 안내. 빈칸을 0으로 계산하지 않는다. */
export default function RequiredNotice({ missing }: { missing: string[] }) {
  return (
    <div role="status" className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="text-sm font-semibold">나이와 월소득을 입력하면 결과가 보여요</p>
      <p className="mt-1 text-xs text-muted">비어 있는 항목: {missing.join(", ")}</p>
    </div>
  );
}
