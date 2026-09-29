# 집구해조 위키 — 목차

LLM이 관리하는 프로젝트 지식 베이스입니다. 질문에 답하거나 작업을 시작하기 전에 이 목차에서 관련 문서를 먼저 찾습니다. 관리 규칙은 루트의 `CLAUDE.md` "LLM Wiki" 절을 따릅니다.

## 서비스

- [overview.md](overview.md) — 집구해조가 무엇이고 누구를 위한 서비스인지, 화면 구성
- [open-questions.md](open-questions.md) — 아직 정하지 않았거나 확인이 필요한 것들

## 개념·계산

- [concepts/real-housing-cost.md](concepts/real-housing-cost.md) — 실질 주거비 계산식과 가정값(기회비용 이율, 정책 금리)
- [concepts/policy-matching.md](concepts/policy-matching.md) — 정책 해당 여부 판정과 중복 지원 처리 규칙
- [concepts/map-coloring.md](concepts/map-coloring.md) — 지도 색칠 방식(순위 기준 7단계)과 그렇게 정한 이유

## 데이터

- [data/data-schema.md](data/data-schema.md) — `data/` 폴더 파일별 컬럼 정의와 단위
- [data/gwangjin-dongs.md](data/gwangjin-dongs.md) — 광진구 법정동 7개, 코드, 임시 경계
- [data/youth-housing-policies.md](data/youth-housing-policies.md) — 샘플 정책 5건의 조건과 출처 상태

## 기술

- [tech/architecture.md](tech/architecture.md) — 폴더 구조, 데이터 흐름, API, 배포
- [tech/ai-agent.md](tech/ai-agent.md) — AI Agent 패널과 `/api/explain`(Claude / 제한형 응답 모드)

## 기록

- [decisions.md](decisions.md) — 주요 결정과 이유 (지역 변경, 지도 선택 등)
- [log.md](log.md) — 위키 변경 이력
