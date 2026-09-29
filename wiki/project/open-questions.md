# 열린 질문

답이 정해지면 해당 항목을 지우고, 결정 내용은 [decisions.md](decisions.md)에, 바뀐 사실은 관련 문서에 반영한다.

## 강사 확인 (마감 전)

- [ ] 샘플 데이터로 시연해도 되는가, 실제 공공데이터가 필요한가
- [ ] 제출물 범위: 배포 주소 / GitHub 저장소(비공개 → 초대 또는 공개 전환) / 발표 자료
- [ ] AI 코딩 도구 사용 범위와 표기 방법
- [ ] 코드 구조(`lib/` 계산 · `app/` 화면 분리, 단위 테스트) 피드백
- [ ] 공개 배포 시 `/api/explain` 요청 횟수 제한 방법

## 팀 결정 필요

- [ ] 보증금 기회비용 이율 4.5%가 적절한가 → [concepts/real-housing-cost.md](concepts/real-housing-cost.md)
- [ ] 이자지원·대출 정책의 실제 부담 금리 2% 가정
- [ ] 같은 유형 정책은 최대 1건만 반영하는 규칙
- [ ] 정책 지원 기간(`support_period_months`)을 연 주거비에 반영할지
- [ ] 운영 사이트에 `ANTHROPIC_API_KEY`를 넣어 Claude 해설을 켤지(비용·사용 한도)

## 데이터 관리

- [ ] 데이터를 주기적으로 갱신하는 방법(강사 피드백 "데이터베이스를 주기적으로 관리"). 실제 실거래가 데이터를 넣을 때(2026-10-01 예정) 갱신 주기와 방식(수동 스크립트 / GitHub Actions 정기 실행 / DB 도입)을 정한다.

## 데이터 확인

- [ ] 광진구 법정동 코드 10자리 검증 → [data/gwangjin-dongs.md](data/gwangjin-dongs.md)
- [ ] 정책 5건의 실제 공고 기준 수치 → [data/youth-housing-policies.md](data/youth-housing-policies.md)
- [ ] 실제 법정동 경계 GeoJSON 확보(브이월드, 통계청 SGIS 등)
