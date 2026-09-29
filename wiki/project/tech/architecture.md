# 아키텍처

Next.js 16(App Router) + TypeScript + Tailwind CSS 4. 이 Next.js 버전은 기존과 다른 점이 있어, 코드 작성 전 `node_modules/next/dist/docs/`를 확인한다(`AGENTS.md`).

## 폴더

| 경로 | 역할 |
|---|---|
| `app/page.tsx` | 서버 컴포넌트. `data/`를 읽어 헤더·대시보드·푸터 렌더 |
| `app/components/` | 화면(클라이언트 컴포넌트). Dashboard, ConditionForm, MapCard/DongMap, DetailPanel/CostBar, ChatWidget/AgentPanel, AnimatedNumber(숫자 변화 애니메이션), StepBadge(단계 번호), Mascot(캐릭터 "구해봇") |
| `app/api/explain/route.ts` | AI 해설 API → [ai-agent.md](ai-agent.md) |
| `lib/` | 계산 로직(순수 함수). 화면과 API가 함께 쓴다 |
| `lib/__tests__/` | vitest 단위 테스트 (`npm test`) |
| `data/` | CSV·GeoJSON → [../data/data-schema.md](../data/data-schema.md) |
| `scripts/generate-sample-data.mjs` | 샘플 데이터 생성 |
| `wiki/`, `raw/` | 이 위키와 원본 자료 |

## lib 모듈

| 파일 | 내용 |
|---|---|
| `cost.ts` | 실질 주거비 계산 → [../concepts/real-housing-cost.md](../concepts/real-housing-cost.md) |
| `policy.ts` | 정책 매칭 → [../concepts/policy-matching.md](../concepts/policy-matching.md) |
| `evaluate.ts` | 매물 하나 평가, 동별 평가(`costByDong`) |
| `stats.ts` | 중앙값, 동별 중앙값 |
| `data.ts` | 서버 전용 CSV·GeoJSON 로더, 동×계약유형 중앙값 |
| `conditions.ts` | 폼 입력(문자열) → 계산 입력(숫자) |
| `explain.ts` | AI 해설 문맥, 추천 질문, 템플릿 답변 |
| `scale.ts` | 지도 색 → [../concepts/map-coloring.md](../concepts/map-coloring.md) |
| `format.ts` | 만원 금액 표시("3억 2,500만원") |
| `region.ts` | 자치구 이름 `DISTRICT` |

## 데이터 흐름

1. `page.tsx`(서버)가 정책·동별 중앙값·경계를 계산해 `Dashboard`에 넘긴다.
2. `Dashboard`가 조건 입력 상태를 들고, 입력이 바뀔 때마다 `lib`로 다시 계산해 지도·상세 패널에 넘긴다.
3. 지도에서 동을 고르면 그 동의 중앙값이 입력에 채워진다.
   - 값이 바뀌면 `AnimatedNumber`가 이전 값에서 새 값까지 숫자를 바꾸고, 지도는 폴리곤을 다시 만들지 않고 스타일·라벨만 바꿔 색이 CSS 전환으로 부드럽게 변한다. `prefers-reduced-motion`이면 애니메이션 없이 바로 바뀐다.
4. AI Agent는 조건만 `/api/explain`에 보내고, 서버가 같은 `lib`로 다시 계산한다.

## 지도

Leaflet + react-leaflet, OpenStreetMap 타일(회색 필터). SSR에서 window가 없어 `next/dynamic`(`ssr: false`)로 불러온다. 처음 열 때 전체 동 영역에 맞추고, 그보다 넓게 축소할 수 없으며 이동은 영역 밖 8%까지로 제한. 자치구 바깥은 동 경계로 구멍을 뚫은 마스크로 흐리게 가린다(경계 파일을 바꾸면 모양이 따라옴).

## 개발 환경 주의

- 이 폴더는 iCloud와 동기화되는 바탕화면(Desktop)에 있다. 빌드 중 `.next/types/`에 `파일명 2.ts` 같은 충돌 복사본이 생겨 `tsc`가 "Duplicate identifier" 오류를 낼 수 있다. 빌드를 한 번 더 하거나 잠시 뒤 다시 실행하면 사라진다. 근본 해결은 프로젝트를 iCloud 동기화 밖(예: `~/dev`)으로 옮기는 것.

## 배포

- GitHub `yubee925/jipguhaejo`(비공개) `main` → Vercel 자동 배포, https://jipguhaejo.vercel.app
- `next.config.ts`의 `outputFileTracingIncludes`로 `/api/explain` 서버 함수에 `data/`를 포함(빠지면 서버에서 CSV를 못 읽음).
- `.env*`, `.vercel`, `node_modules`는 `.gitignore`로 제외.

## 검증 명령

`npm test` · `npx tsc --noEmit` · `npm run lint` · `npm run build`
