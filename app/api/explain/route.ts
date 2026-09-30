import Anthropic from "@anthropic-ai/sdk";
import { toUserInput, type Conditions } from "@/lib/conditions";
import { listDongs, loadConstants, loadPolicies, loadRent } from "@/lib/data";
import { DISTRICT } from "@/lib/region";
import {
  buildExplainContext,
  contextToPrompt,
  detectIntent,
  SUGGESTED_QUESTIONS,
  templateAnswer,
  type QuestionId,
} from "@/lib/explain";

const MODEL = "claude-opus-5";
const MAX_QUESTION_LENGTH = 300;

const SYSTEM_PROMPT = `당신은 서울 ${DISTRICT} 주거비 대시보드의 해설 도우미입니다.
<calculation> 안의 수치만 근거로 사용자의 질문에 한국어로 답하세요.
- 새 수치를 추정하거나 만들지 마세요. 계산에 없는 정보(실제 시세, 최신 정책 공고 등)는 모른다고 말하세요.
- 시세는 국토교통부 월세 실거래가(신규 계약)로 계산했고, 정책 수치는 아직 예시입니다. 판단에 영향을 줄 때만 짧게 언급하세요.
- 관리비는 계산에 포함되지 않았고, 모든 금액은 예상 금액이며 최종 자격은 공고 기준임을 필요할 때 알려 주세요.
- 주거비·정책과 무관한 질문에는 이 대시보드 범위에서만 답할 수 있다고 안내하세요.
- 5~8문장 이내로, 마크다운 제목·표·굵은 글씨 없이 평문과 "•" 목록만 쓰세요.
지연에 민감한 화면이니 바로 답을 시작하세요.`;

type ExplainMode = "ai" | "template";

let dataCache: {
  rent: ReturnType<typeof loadRent>;
  policies: ReturnType<typeof loadPolicies>;
  k: ReturnType<typeof loadConstants>;
  dongs: string[];
} | null = null;
function getData() {
  if (!dataCache) {
    const rent = loadRent();
    dataCache = { rent, policies: loadPolicies(), k: loadConstants(), dongs: listDongs(rent) };
  }
  return dataCache;
}

/** 사용자가 요청한 기준: 환경변수에 API 키(또는 토큰)가 있을 때만 Claude 호출 */
const hasApiKey = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

function textResponse(body: string | ReadableStream<Uint8Array>, mode: ExplainMode, reason?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Explain-Mode": mode,
  };
  if (reason) headers["X-Explain-Reason"] = reason;
  return new Response(body, { headers });
}

function errorReason(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "auth_error";
  if (err instanceof Anthropic.RateLimitError) return "rate_limited";
  if (err instanceof Anthropic.APIError) return `api_error_${err.status ?? "network"}`;
  return "api_error";
}

/** 패널 배지용: 현재 응답 모드 */
export function GET() {
  return Response.json({ mode: hasApiKey() ? "ai" : "template" satisfies ExplainMode });
}

export async function POST(request: Request) {
  let body: { question?: unknown; questionId?: unknown; conditions?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim().slice(0, MAX_QUESTION_LENGTH) : "";
  if (!question || typeof body.conditions !== "object" || body.conditions === null) {
    return Response.json({ error: "question과 conditions가 필요합니다." }, { status: 400 });
  }

  const data = getData();
  const conditions = body.conditions as Conditions;
  const dong = String(conditions.dong ?? "");
  if (!data.dongs.includes(dong)) {
    return Response.json({ error: `알 수 없는 동입니다: ${dong}` }, { status: 400 });
  }

  // 화면이 보낸 결과가 아니라 조건으로 서버에서 diagnoseDong 으로 다시 계산한 값만 사용
  const ctx = buildExplainContext(toUserInput(conditions), dong, data);
  const knownId = SUGGESTED_QUESTIONS.find((q) => q.id === body.questionId)?.id;
  const intent: QuestionId | null = knownId ?? detectIntent(question);
  const fallback = () => templateAnswer(intent, ctx);

  if (!hasApiKey()) return textResponse(fallback(), "template", "no_api_key");

  const client = new Anthropic();
  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: 16000,
      // 안전 분류기가 거절하면 서버가 권장 모델로 자동 재시도
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `<calculation>\n${contextToPrompt(ctx)}\n</calculation>\n\n질문: ${question}`,
        },
      ],
    },
    { signal: request.signal },
  );
  const events = stream[Symbol.asyncIterator]();

  // 첫 텍스트가 올 때까지 기다려, 그 전에 실패하면 템플릿으로 대체(헤더를 보내기 전이라 모드 전환 가능)
  let first: string | null = null;
  try {
    for (let r = await events.next(); !r.done; r = await events.next()) {
      const e = r.value;
      if (e.type === "content_block_delta" && e.delta.type === "text_delta") {
        first = e.delta.text;
        break;
      }
    }
    if (first === null) {
      const final = await stream.finalMessage();
      return textResponse(fallback(), "template", final.stop_reason === "refusal" ? "refusal" : "empty_response");
    }
  } catch (err) {
    console.error("[api/explain] Claude 호출 실패:", err);
    return textResponse(fallback(), "template", errorReason(err));
  }

  const encoder = new TextEncoder();
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));
      send(first);
      try {
        for (let r = await events.next(); !r.done; r = await events.next()) {
          const e = r.value;
          if (e.type === "content_block_delta" && e.delta.type === "text_delta") send(e.delta.text);
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") send(`\n\n(응답이 중단되어 기본 해설로 대신합니다)\n\n${fallback()}`);
        else if (final.stop_reason === "max_tokens") send("\n\n(응답이 길어 중간에 끊겼습니다)");
      } catch (err) {
        if (!request.signal.aborted) {
          console.error("[api/explain] 스트리밍 중단:", err);
          send(`\n\n(연결이 끊겨 기본 해설로 대신합니다)\n\n${fallback()}`);
        }
      }
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });
  return textResponse(out, "ai");
}
