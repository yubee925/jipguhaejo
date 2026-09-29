# 서비스 개요

**집구해조**는 청년이 "이 집에 실제로 한 달에 얼마가 드는지"를 지원정책까지 반영해 계산해 보는 대시보드다. 슬로건은 "지원정책을 반영한 나의 진짜 주거비".

- 대상 지역: 서울 **광진구** 법정동 7개 → [data/gwangjin-dongs.md](data/gwangjin-dongs.md)
- 대상 사용자: 무주택 청년(신혼부부 정책 일부 포함)
- 운영 주소: https://jipguhaejo.vercel.app (Vercel, GitHub `yubee925/jipguhaejo` 비공개 저장소의 `main` 푸시 시 자동 배포)

## 화면 구성 (3단)

| 위치 | 내용 |
|---|---|
| 좌측 | 동별 실질 월 주거비 지도(순위 목록 포함) + 조건 입력 카드 |
| 중앙 | 실질 주거비 상세: 지원 전/후 금액, 비용 구성 막대, 매칭 정책 카드, 월/연 토글 |
| 우측 | AI Agent 패널: 추천 질문 4개, 자유 질문, Claude 해설 또는 제한형 응답 |

지도에서 동을 클릭하면 그 동의 중앙값 매물이 조건 입력에 채워지고 중앙·우측 패널이 그 동 기준으로 바뀐다.

## 핵심 개념

- 실질 주거비 = 월세 + 보증금 기회비용 − 정책 지원 → [concepts/real-housing-cost.md](concepts/real-housing-cost.md)
- 정책 매칭 → [concepts/policy-matching.md](concepts/policy-matching.md)

## 현재 상태 (2026-09-30)

- 전월세 거래 200건, 정책 5건, 동 경계는 **모두 샘플/임시 데이터**다. 결과 수치는 실제 시세가 아니다.
- AI Agent는 API 키가 없어 운영 사이트에서 제한형 응답 모드로 동작한다.
- 마감: 다음 주(강사 확인 필요 사항은 [open-questions.md](open-questions.md)).
