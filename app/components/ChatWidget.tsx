"use client";

import { useEffect, useRef, useState } from "react";
import type { Conditions } from "@/lib/conditions";
import AgentPanel from "./AgentPanel";
import Mascot from "./Mascot";

/**
 * 화면 오른쪽 아래 챗봇 버튼. 누르면 AI 도우미 창이 열린다.
 * 닫아도 대화가 유지되도록 창은 항상 마운트해 두고 숨기기만 한다.
 */
export default function ChatWidget({ conditions }: { conditions: Conditions }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div
        ref={panelRef}
        id="ai-chat"
        role="dialog"
        aria-label="AI 주거비 도우미"
        tabIndex={-1}
        inert={!open}
        className={`fixed bottom-24 right-4 z-[1000] flex h-[min(600px,calc(100dvh-8rem))] w-[min(400px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_12px_40px_rgba(16,24,40,0.18)] outline-none transition duration-200 ease-out motion-reduce:transition-none ${
          open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0"
        }`}
      >
        <AgentPanel conditions={conditions} onClose={close} />
      </div>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="ai-chat"
        className="group fixed bottom-6 right-4 z-[1000] flex h-14 items-center gap-1 rounded-full border border-accent/25 bg-surface pl-1.5 pr-5 text-sm font-semibold text-accent shadow-[0_8px_24px_rgba(37,99,235,0.22)] transition hover:border-accent/50 hover:bg-accent-soft active:scale-95 motion-reduce:transition-none"
      >
        <span className="-mt-7 grid h-16 w-16 place-items-center">
          <Mascot awake={open} className="mascot-bob h-16 w-16 drop-shadow-[0_4px_6px_rgba(16,24,40,0.25)]" />
        </span>
        {open ? "닫기" : "AI에게 물어보기"}
      </button>
    </>
  );
}
