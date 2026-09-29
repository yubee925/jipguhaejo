# AI Agent

화면 우측 패널(`app/components/AgentPanel.tsx`)과 API(`app/api/explain/route.ts`). 해설 문맥과 템플릿은 `lib/explain.ts`.

## 동작

- 추천 질문 4개: 요약 / 정책 계산 / 전세 vs 월세 / 다른 동 비교. 자유 질문(최대 300자)도 가능.
- 요청 본문은 질문과 **조건 입력값**만. 서버가 `lib`로 다시 계산한 수치만 Claude에 넘긴다(화면 계산 결과를 신뢰하지 않음).
- 질문마다 단발성(대화 기록 없음).

## 응답 모드

| 모드 | 조건 | 응답 헤더 |
|---|---|---|
| Claude 해설 | `ANTHROPIC_API_KEY` 또는 `ANTHROPIC_AUTH_TOKEN`이 설정됨 | `X-Explain-Mode: ai` |
| 제한형 응답 | 키 없음, 또는 첫 응답 전에 호출 실패 | `X-Explain-Mode: template`, `X-Explain-Reason: no_api_key` / `auth_error` / `rate_limited` / `refusal` 등 |

- 제한형 응답은 같은 계산 수치로 만든 템플릿 답변. 자유 질문은 키워드로 4가지 유형 중 하나로 분류하고, 맞는 유형이 없으면 요약 + 안내 문구.
- 스트리밍 중 끊기면 보낸 내용 뒤에 템플릿 답변을 덧붙인다.
- `GET /api/explain`은 현재 모드만 돌려준다(패널 배지용).

## Claude 설정

- 모델 `claude-opus-5`, adaptive thinking, `effort: "low"`(짧은 해설이라 응답 속도 우선), `max_tokens` 16000, 스트리밍.
- 거절 대체: `fallbacks: "default"` (베타 `server-side-fallback-2026-07-01`).
- 시스템 프롬프트: 넘겨받은 수치만 근거로 한국어 5~8문장, 없는 정보는 모른다고 답함, 마크다운 제목·표 금지.

## 운영 시 주의

- 운영 사이트에는 키가 없어 제한형 응답으로 동작한다.
- 키를 넣으면 누구나 호출해 비용이 발생한다. 사용 한도 설정과 요청 횟수 제한이 먼저 필요하다([../open-questions.md](../open-questions.md)).
