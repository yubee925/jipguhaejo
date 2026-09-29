/** 사용 순서를 보여 주는 단계 번호 */
export default function StepBadge({ step }: { step: number }) {
  return (
    <span
      aria-hidden
      className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold leading-none text-white"
    >
      {step}
    </span>
  );
}
