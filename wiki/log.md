# 위키 변경 이력

새 항목은 맨 아래에 추가합니다. 형식: `## [YYYY-MM-DD] 종류 | 제목` (종류: create, ingest, update, lint, query)

## [2026-09-30] create | 위키 초기 구성

- 코드와 커밋 이력(`b1ecaf6`~`44d0d0c`)을 근거로 첫 문서들을 작성했다.
- 작성: index, overview, open-questions, decisions, concepts 3개, data 3개, tech 2개.
- `raw/`는 비어 있다. 정책 공고·데이터 명세 등 원본 자료가 아직 없어, 정책 수치와 법정동 코드는 "미확인"으로 표시했다.

## [2026-09-30] ingest | 강사 UI 피드백 반영

- 원본: `raw/2026-09-30-강사-피드백-UI.md`
- 화면을 개편하고(좌 조건 · 우 지도·상세, 단계 안내, 애니메이션, 채팅 버튼) overview, tech/architecture, tech/ai-agent, decisions를 고쳤다.
- "데이터베이스 주기적 관리"는 실제 데이터 도입 때 정하기로 하고 open-questions에 추가했다.
- tech/architecture에 iCloud 동기화로 생기는 `.next` 중복 파일 주의를 적었다.

## [2026-09-30] update | 캐릭터 "구해봇" 추가

- AI 도우미 버튼에 자체 제작 캐릭터를 넣고 버튼을 흰 바탕으로 바꿨다(캐릭터가 파란 배경에 묻혀서). tech/architecture, tech/ai-agent 반영.

## [2026-09-30] update | 좌우 반반 배치, 광진구만 보이게

- 조건 칸과 지도 칸을 1:1로. 순위 목록은 아주 넓은 화면에서만 지도 옆, 그 외에는 지도 아래.
- 지도: 광진구 바깥 마스크, 축소 제한(처음 맞춘 줌까지), 이동 여유 20% → 8%. overview, tech/architecture 반영.
- 실제 광진구 동 경계는 2026-10-01에 받아 오기로 함.
