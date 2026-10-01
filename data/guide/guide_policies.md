# policies.csv 안내 (정책 12개 최종본)

한 줄이 정책 하나, 33개 열입니다. **빈칸은 없습니다.**

## 값 NONE의 뜻
모든 열에서 `NONE`은 "해당 없음 / 제한 없음"입니다. 일부러 채운 값이고 미지정이 아닙니다.
- deposit_max = NONE이면 보증금 상한이 없다는 뜻
- benefit_monthly = NONE이면 현금 월 지원이 없는 정책(대출·임대주택 등)
- 코드에서는 NONE이면 그 조건 검사를 건너뛰고, 숫자로 변환하지 않습니다.

## 정책 종류별 결과 표시 (category_code, housing_type)
| 구분 | 정책 | 결과 화면 |
|---|---|---|
| RENT 월세 현금 | P01 P02 P03 | 월 지원액 × 개월 → 실질 월세에서 차감 |
| BENEFIT 급여 | P12 | 지급액 = min(실제 월세, 36.9만) → 차감 |
| LOAN 대출 | P05 | 시중 전세대출 금리(constants의 MARKET_JEONSE_RATE)와 loan_rate의 차이만큼 이자 절감 |
| INTEREST 이자지원 | P06 | 대출 이자 중 최대 연 3.0%p 지원 |
| REFUND 환급 | P08 | 일시금 40만 (benefit_lump) |
| HOUSING 임대주택 | P09 P10 P11 | 금액 계산 없이 "신청 가능" 안내만 |
| 전세 전용 | P04 P07 (housing_type=JEONSE) | 월세 서비스라 "해당 없음" 표시 |

## 매물 조건 (지도)
- P02·P03: 보증금 ≤ 8000 그리고 월세 ≤ 60 (rent_clean의 cap_seoul_rent와 같음)
- P05: 보증금 ≤ 6500 그리고 월세 ≤ 70, 면적 ≤ 60㎡ (cap_youth_rent_loan과 같음)
- P08: 보증금 + 월세×100 ≤ 20000

## 중복 (exclusive_with)
`|`로 연결된 정책끼리는 함께 받을 수 없습니다. 겹치면 혜택이 큰 하나만 적용합니다.

## 새로 추가된 열 5개
| 열 | 값 |
|---|---|
| marriage_req | ANY / SINGLE(미혼) / SINGLE_OR_NEWLYWED(1인가구 미혼 또는 신혼) |
| job_req | 현재 12개 모두 ANY(무관). 정책 추가용 |
| resident_req | NONE / SEOUL / GWANGJIN |
| head_req | Y(세대주 필요) / N |
| special_req | NONE / BASIC_BENEFIT_FAMILY(수급가구) |

## verify_needed = Y의 뜻
값은 모두 채워져 있고 계산에 그대로 써도 됩니다. Y는 **"모집 회차마다 바뀔 수 있어 발표 전 공고로 다시 볼 것"**이라는 표시일 뿐입니다 (P01 P05 P08 P09 P10 P11). 코드 동작과는 무관합니다.

## 실거래 파일(rent_gwangjin_clean.csv) 참고
prev_deposit·prev_rent의 빈칸은 신규 계약이라 "갱신 전 금액"이 원래 없는 것입니다. 오류가 아닙니다.
