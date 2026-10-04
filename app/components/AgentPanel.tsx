"use client";

import { useEffect, useRef, useState } from "react";
import type { Conditions } from "@/lib/conditions";
import { SUGGESTED_QUESTIONS, type QuestionId } from "@/lib/explain";
import { DISTRICT } from "@/lib/region";
import { HOUSING_TYPE_LABEL } from "@/lib/conditions";

type Mode = "ai" | "template";

type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "agent"; text: string; mode: Mode | null; context: string; pending: boolean; error?: boolean };

const MODE_LABEL: Record<Mode, string> = { ai: "Claude 해설", template: "제한형 응답" };

type Props = {
  conditions: Conditions;
  /** 채팅 창 닫기(떠 있는 창에서 쓸 때) */
  onClose?: () => void;
};

export default function AgentPanel({ conditions, onClose }: Props) {
  const [serverMode, setServerMode] = useState<Mode | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const nextId = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/explain")
      .then((r) => r.json())
      .then((d: { mode: Mode }) => setServerMode(d.mode))
      .catch(() => setServerMode(null));
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const updateAgent = (id: number, patch: Partial<Extract<Message, { role: "agent" }>>) =>
    setMessages((ms) => ms.map((m) => (m.id === id && m.role === "agent" ? { ...m, ...patch } : m)));

  async function ask(question: string, questionId?: QuestionId) {
    const q = question.trim();
    if (!q || busy) return; // 답변 중 반복 전송 방지 (버튼 비활성화 + 함수에서도 한 번 더 막음)
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userId = nextId.current++;
    const agentId = nextId.current++;
    const context = `${conditions.dong} · ${HOUSING_TYPE_LABEL[conditions.housingType]}`;
    setMessages((ms) => [
      ...ms,
      { id: userId, role: "user", text: q },
      { id: agentId, role: "agent", text: "", mode: null, context, pending: true },
    ]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, questionId, conditions }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: `요청 실패 (${res.status})` }));
        throw new Error(err.error ?? `요청 실패 (${res.status})`);
      }
      const mode = (res.headers.get("X-Explain-Mode") as Mode | null) ?? null;
      updateAgent(agentId, { mode });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (let r = await reader.read(); !r.done; r = await reader.read()) {
        text += decoder.decode(r.value, { stream: true });
        updateAgent(agentId, { text });
      }
      updateAgent(agentId, { text: text + decoder.decode(), pending: false });
    } catch (err) {
      if (controller.signal.aborted) {
        updateAgent(agentId, { pending: false, text: "(새 질문으로 중단됨)", error: true });
      } else {
        updateAgent(agentId, { pending: false, text: err instanceof Error ? err.message : "응답을 받지 못했습니다.", error: true });
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold tracking-tight">AI 주거비 도우미</h2>
          <span className="text-[11px] text-muted">무엇이든 물어보세요</span>
        </div>
        <div className="flex items-center gap-2">
          {serverMode && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                serverMode === "ai" ? "bg-accent-soft text-accent" : "bg-background text-muted"
              }`}
              title={serverMode === "template" ? "API 키가 없어 계산 결과로 만든 정해진 답변만 제공합니다" : undefined}
            >
              {serverMode === "ai" ? "● Claude 연결됨" : "제한형 응답 모드"}
            </span>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="채팅 닫기"
              className="grid h-7 w-7 place-items-center rounded-md text-muted transition hover:bg-background hover:text-foreground"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          )}
        </div>
      </header>

      <div className="border-b border-border px-4 py-3">
        <div className="mb-2 text-xs text-muted">
          <span className="font-medium text-foreground">
            {DISTRICT} {conditions.dong} · {HOUSING_TYPE_LABEL[conditions.housingType]}
          </span>{" "}
          계산 결과 기준
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q.id}
              type="button"
              disabled={busy}
              onClick={() => ask(q.label, q.id)}
              className="rounded-lg border border-border px-2.5 py-2 text-left text-xs leading-snug transition hover:border-accent/50 hover:bg-accent-soft disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3" aria-live="polite">
        {messages.length === 0 && (
          <p className="m-auto max-w-[220px] text-center text-xs leading-relaxed text-muted">
            추천 질문을 누르거나 직접 물어보세요. 지금 선택한 동의 계산 결과로 답합니다.
          </p>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="ml-8 self-end rounded-lg rounded-br-sm bg-accent px-3 py-2 text-sm text-white">
              {m.text}
            </div>
          ) : (
            <div key={m.id} className="mr-4 flex flex-col gap-1">
              <div
                className={`whitespace-pre-wrap rounded-lg rounded-bl-sm px-3 py-2 text-sm leading-relaxed ${
                  m.error ? "bg-background text-muted" : "bg-background"
                }`}
              >
                {m.text || (m.pending ? <span className="animate-pulse text-muted">답변을 작성하는 중…</span> : "")}
              </div>
              <div className="text-[11px] text-muted">
                {m.context}
                {m.mode && ` · ${MODE_LABEL[m.mode]}`}
              </div>
            </div>
          ),
        )}
      </div>

      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={300}
          placeholder="질문을 입력하세요"
          aria-label="질문"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="h-9 shrink-0 rounded-lg bg-accent px-3 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-40"
        >
          보내기
        </button>
      </form>
    </section>
  );
}
