# 정책 매칭

코드: `lib/policy.ts` (`matchPolicies`, `policyRejectReason`) · 테스트: `lib/__tests__/policy.test.ts`

## 판정 순서

정책마다 아래를 차례로 확인하고, 처음 걸린 조건을 "해당하지 않는 이유"로 돌려준다(AI Agent 답변에 그대로 쓰임).

1. 나이: `age_min` ≤ 나이 ≤ `age_max` (경계값 포함)
2. 소득: 연 소득 ≤ `income_limit_manwon`
3. 대상: `target`이 "신혼부부"면 신혼부부 체크가 되어 있어야 함
4. 지역: `region`이 "전국"이거나 사용자 지역(기본 "서울특별시")과 같아야 함
5. 매물 조건(매물을 넘겼을 때만)
   - 보증금 ≤ `max_deposit_manwon` (0이면 제한 없음)
   - 월세 ≤ `max_monthly_rent_manwon` (0이면 제한 없음)
   - 월세지원 정책은 월세 매물(월세 > 0)에만 해당

## 중복 지원

같은 월세나 보증금을 두 번 지원받을 수 없다고 보고:

- 월세지원 중 지원액이 가장 큰 1건
- 이자지원·대출 중 지원액이 가장 큰 1건

만 합산한다. 나머지는 화면에 "중복 제외"로 표시된다. 지원액이 같으면 목록에서 먼저 나온 정책이 적용된다.

## 한계

- 무주택 여부, 가구원 수, 재직 여부(중소기업 청년 대출) 같은 조건은 입력받지 않아 판정하지 않는다.
- 지역은 시·도 단위까지만 본다.

관련: [real-housing-cost.md](real-housing-cost.md), [../data/youth-housing-policies.md](../data/youth-housing-policies.md)
