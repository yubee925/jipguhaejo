"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  format: (v: number) => string;
  /** 애니메이션 시간(ms) */
  duration?: number;
  className?: string;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** 값이 바뀌면 이전 값에서 새 값까지 숫자가 부드럽게 변한다. 동작 줄이기 설정이면 바로 바뀐다. */
export default function AnimatedNumber({ value, format, duration = 500, className }: Props) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = reduce ? 1 : Math.min(1, (now - start) / duration);
      const v = k === 1 ? value : from + (value - from) * easeOutCubic(k);
      shownRef.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={`tabular-nums ${className ?? ""}`}>{format(shown)}</span>;
}
