# input_fields.csv 안내 (개인정보 입력란, 19개)

한 줄이 입력칸 하나입니다. 빈칸은 없습니다.

## 열
| 열 | 뜻 |
|---|---|
| field_id | 코드용 이름 |
| label | 화면 표시 이름 |
| input_type | number / select(하나) / checkbox(Y·N) / multi(여러 개) |
| options | `코드(화면표시)`를 `\|`로 구분. 저장은 코드로 |
| required | Y=필수 / N=선택(접이식 "더 정확하게" 영역) |
| default | 기본값 |
| used_by_policies | 이 값을 판정에 쓰는 정책 (policies.csv의 policy_id) |

## 특수값
- `NONE`: 해당 없음. 오류나 미지정이 아닙니다.
- `UNKNOWN`: 사용자가 "모름"을 고른 상태입니다. 이 값이 필요한 정책은 탈락이 아니라 **"확인 필요"**로 표시합니다.

## 화면 구성
1. 기본(필수): age, monthly_income, marital, job, resident, homeless, independent, single_household
2. 집 조건(필수, 기존): house_type, dong, deposit
3. 더 정확하게(선택): house_head, asset, parent_income, basic_benefit_family, parent_region, moved_in_year, parent_house_rent, current_support

## 판정 규칙 (입력값 → 정책 열)
| 입력 | 비교하는 policies 열 | 규칙 |
|---|---|---|
| age | age_min, age_max | age_min ≤ age ≤ age_max |
| monthly_income | income_type, income_min, income_max | MEDIAN_PCT: 월소득 ÷ MEDIAN_1P × 100 / ANNUAL: 월소득 × 12 / URBAN_PCT: 월소득 ÷ URBAN_1P × 100. 결과가 income_min~income_max 안이면 통과 (기준값은 constants.csv) |
| marital, single_household | marriage_req | SINGLE: 미혼 / SINGLE_OR_NEWLYWED: (미혼이면서 1인가구) 또는 신혼 / ANY: 무관 |
| resident | resident_req | SEOUL: 광진구 또는 서울 타구 / GWANGJIN: 광진구만 / NONE: 무관 |
| house_head | head_req | Y이면 세대주여야 통과 |
| basic_benefit_family | special_req | BASIC_BENEFIT_FAMILY이면 Y여야 통과 (P12). P08은 Y면 제외 |
| asset | asset_max | 자산 ≤ asset_max. asset_max가 NONE이면 검사 안 함 |
| parent_income | parent_income_check | COND인 P01: 나이 30 미만이고 본인소득 중위 50% 미만일 때만 UNDER_100 필요. COND인 P09·P11: 본인 월소득 0일 때만 UNDER_100 필요 |
| parent_region | (P12 전용) | SEOUL이면 P12 탈락 |
| moved_in_year | (P08 전용) | BEFORE_2024면 P08 탈락 |
| parent_house_rent | (P08 전용) | Y면 P08 탈락 |
| homeless | (전체) | N이면 전 정책 탈락 |
| independent | (P01, P12) | N이면 탈락 |
| current_support | exclusive_with | 이미 받는 정책과 exclusive_with로 묶인 정책은 제외. YOUTH_ALLOWANCE면 P02 제외 |
| job | (판정 미사용) | AI 맞춤 설명 문구에만 사용 |
