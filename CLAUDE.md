# 집구해조 — 청년 실질 주거비 진단 대시보드

팀명·서비스명: 집구해조

## 서비스 한 줄 요약
이용자가 나이·소득·무주택 여부·희망 동·보증금을 입력하면
① 신청 가능한 청년 주거정책을 매칭하고
② 지원금을 반영한 실질 월/연 주거비를 계산하고
③ 광진구 동별 실질 주거비를 지도로 비교하며
④ AI가 결과를 요약·해설하는 웹 대시보드.
단순 시세 조회나 정책 검색이 아니라, 시세와 정책을 결합해 "체감 주거비"를 진단하는 도구다.

## 마감 / 범위
- 마감: 10월 8일. MVP 우선, 기능 욕심 금지.
- 지역: 서울 광진구 7개 법정동. 동 이름/코드는 data/ 파일에서만 읽고 코드에 하드코딩하지 않는다 (나중에 동 추가·다른 구 확장 가능하게).
- 지역 단위: 법정동 (국토부 실거래 데이터 기준).
- 주택유형: 오피스텔, 연립·다세대만. 아파트·단독·다가구 제외.
- 면적: 전용 40㎡ 이하 (현재 데이터 기준, config 의 AREA_MAX 로 관리).
- 계약: 월세만 사용 (전세 제외). 정책이 월세 지원 중심이기 때문.
- 범위 밖: 교통 접근성, 상권, 인구, 편의시설, 비수도권 비교 도시 (발표에서 확장 계획으로만 언급).

## 기능 동결 (2026-10-06 ~ 마감)
기준점: git 태그 `feature-freeze` (이 시점의 화면·기능이 발표 버전).
- 허용: 버그 수정, 공식 출처로 확인한 정책 데이터 수정(data/), 문구·정렬 같은 표시 다듬기, 테스트·문서·발표 자료.
- 금지: 새 화면·새 기능·새 입력 항목 추가, 계산식·판정 규칙 변경(버그 수정 제외), 큰 리팩터링, 새 라이브러리 추가.
- 애매하면 고치기 전에 먼저 묻는다. 고친 뒤에는 npm test, npm run test:e2e, npm run build 를 모두 통과해야 커밋한다.

## 기술 스택
- Next.js (App Router) + TypeScript + Tailwind CSS
- 지도: Leaflet + react-leaflet (OpenStreetMap 타일). Next.js에서는 dynamic import, ssr: false 로 불러온다.
- 차트: Recharts
- DB 없음. data/ 폴더의 CSV·GeoJSON을 서버에서 읽어 사용.
- AI: Claude API. app/api/ 서버 라우트에서만 호출, 키는 .env.local 의 ANTHROPIC_API_KEY.
- API 키가 없으면 템플릿 기반 해설로 자동 대체되는 "제한형 응답 모드"로 동작한다 (발표 시연 안전장치).

## 핵심 원칙
- 정책 매칭과 금액 계산은 lib/ 의 순수 함수로 작성하고 단위 테스트를 함께 만든다. 화면 컴포넌트는 app/components/.
- AI는 숫자를 계산하지 않는다. 계산 결과(JSON)를 받아 해설 문장만 만든다.
- AI 해설 API는 화면이 보낸 계산 결과를 믿지 않고, 서버에서 입력 조건으로 다시 계산해 Claude에 넘긴다.
- 계산 상수는 data/constants.csv 를 읽는 lib/config.ts 한 곳에서 관리한다.
- 화면에는 "예상 금액이며 최종 자격은 공고 기준" 안내 문구를 넣는다.

## 데이터 파일 (예나 작성 형식 기준)
공통 규칙: CSV UTF-8, 영문 컬럼명, 금액 단위 만원(숫자만), 예/아니오 Y/N.
컬럼의 정확한 의미와 값 목록은 data/columns_guide.csv 가 기준이다. 코드와 이 문서가 다르면 columns_guide.csv 를 따른다.

예나 작성 가이드 (data/guide/, 코드 작성 전 먼저 읽는다)
- data/guide/guide_policies.md : policies.csv 최종본(12개 정책, 33열) 안내. NONE 의미, 정책 종류별 결과 표시, 매물 조건, 새 열 5개
- data/guide/guide_input_fields.md : input_fields.csv(입력란 19개) 안내. 특수값 NONE/UNKNOWN, 화면 구성, 입력값 → 정책 열 판정 규칙
- data/guide/personas.md : 시연 페르소나 A·B·D 와 기대 결과 (persona_expected.csv 와 함께 판정 로직 검증용)

- data/constants.csv : key, name, value, unit, base_date, verify_needed, note, source_url
  - MEDIAN_1P 256.4238 (1인 기준중위소득, 만원/월), MEDIAN_3P, URBAN_1P, URBAN_3P
  - BOK_BASE_RATE 3.00 (%), CONVERSION_RATE 5.00 (%, 기준금리 + 2%p), MARKET_JEONSE_RATE 4.35 (%)
  - lib/config.ts 는 이 파일을 읽어 상수를 제공한다. 숫자를 코드에 하드코딩하지 않는다.

- data/rent_gwangjin_clean.csv (계산에 쓰는 전월세)
  dong, housing_type, building, jibun, road_addr, lease_type, area_m2, contract_ym, contract_day,
  deposit, rent, floor, built_year, lease_period, is_new, renewal_right_used, prev_deposit, prev_rent,
  cap_seoul_rent, cap_youth_rent_loan
  - housing_type: officetel / villa(연립·다세대). lease_type: RENT(월세만, 전세 제외)
  - 기간 2025-09 ~ 2026-09, 7개 동, 5,578건
- data/rent_gwangjin_summary_by_dong.csv : 동별 신규 월세 요약 (참고·검증용)
- data/rent_gwangjin_raw_officetel.csv : 국토부 원본 (출처 증빙용, 계산에 쓰지 않음)

- data/policies.csv
  policy_id, 정책명·기관·연령 등 기본 컬럼 +
  category_code (RENT=월세 현금지원 / LOAN=정책대출 / INTEREST=이자지원 / REFUND=비용 환급 / HOUSING=임대주택 / BENEFIT=복지급여),
  income_type (MEDIAN_PCT / ANNUAL / URBAN_PCT), income_min, income_max,
  single_only, asset_max, parent_income_check (Y / COND / N),
  housing_type (RENT / JEONSE / BOTH / NA), deposit_max, rent_max,
  benefit_monthly, benefit_months, benefit_lump, loan_limit, loan_rate,
  exclusive_with (함께 못 받는 policy_id, | 로 구분), apply_open (Y/N), verify_needed (Y/N)

- data/gwangjin_bjd.geojson
  광진구 7개 법정동 경계, WGS84(CRS84). properties: dong, emd_cd, count, rent_median, deposit_median,
  area_median, cap_seoul_rent_pct, cap_youth_rent_loan_pct. dong 이 rent 파일과 정확히 일치한다.

## 계산식
상수 (constants.csv 에서 읽음)
- r = CONVERSION_RATE ÷ 100 (현재 0.05)
- MIN_SAMPLE = 10, AREA_MAX = 40 (현재 데이터 기준. 60으로 바꾸면 데이터도 다시 뽑아야 함)

1. 거래별 환산 월세 = rent + (deposit × r ÷ 12)
2. 동 기준 주거비 C = 해당 동 + 선택 housing_type + 신규 계약(is_new=Y) 거래들의 ①값 중앙값
   - 월세·보증금을 따로 중앙값 내지 않는다.
   - 거래가 MIN_SAMPLE 미만이면 "표본 부족" 표시.
3. 정책 지원금 S (월 계산에는 category_code=RENT, BENEFIT 사용. data/guide/guide_policies.md 기준)
   - 정책별 인정 지원액 = min(benefit_monthly, 실제 월세)
   - S = 자격 충족 RENT 정책들의 인정 지원액 합
   - exclusive_with 로 함께 못 받는 정책끼리는 가장 유리한 1개만 적용
   - 기본 계산에는 apply_open=Y 인 정책만 포함
4. 실질 월 주거비 = max(C − S, 0), 절감률 = S ÷ C × 100
5. 연 주거비: 연차별 12개월 합. 각 달에 유효한 지원금만 차감하고 benefit_months 가 끝난 달부터는 차감 없음. 1~3년차 + 3년 누적.
6. 지역 비교: 모든 동에 같은 조건으로 1~5 계산 → 실질 월 주거비 오름차순, 차이 = 선택 동 − 비교 동. 지도 색은 하위 1/3 초록, 중간 주황, 상위 1/3 빨강.
7. (선택) 내 보증금 기준 예상 월세 = C − (내 보증금 × r ÷ 12)

category_code 별 화면 처리
- RENT: 월 계산에 반영 (apply_open=N 이면 "내년 신청 시" 시나리오로 따로 표시)
- 추첨으로 선정하는 정책(예: 광진형 청년월세)은 기본 계산에서 빼고 "선정 시" 금액을 따로 표시. 추첨 여부 컬럼이 없으면 해당 policy_id 목록을 config 에 둔다.
- INTEREST: 계산 제외, 보증금 이자지원 카드
- LOAN: 계산 제외, 정책대출 카드 (한도·금리 안내)
- REFUND / benefit_lump: 월 계산과 섞지 않고 "초기 비용" 카드
- HOUSING: 계산 제외, 임대주택 안내 카드
- BENEFIT: 월 계산에 반영 (지급액 = min(실제 월세, benefit_monthly)). P12 주거급여 청년 분리지급
- verify_needed=Y 인 정책은 카드에 "공고 재확인 필요" 표시
- 관리비는 계산 제외, 화면에 "관리비 별도" 표시

검증 예시 (테스트 케이스로 사용, r = 5%)
- 월세 55, 보증금 1000 → C = 55 + 4.17 = 59.17
- RENT 정책 월 20 × 24개월 적용 → 실질 월 39.17, 절감률 약 33.8%
- 1·2년차 각 470, 3년차 710, 3년 누적 1650 (지원 없으면 2130, 480 절감)

## 소득 판정
- 사용자 입력: 월소득(만원)
- income_type 별 판정
  - MEDIAN_PCT: 월소득 ÷ MEDIAN_1P × 100 이 income_min ~ income_max 사이
  - ANNUAL: 월소득 × 12 가 income_min ~ income_max 사이 (만원)
  - URBAN_PCT: 월소득 ÷ URBAN_1P × 100 이 income_min ~ income_max 사이
- 빈칸은 조건 없음으로 본다.
- parent_income_check: N 이면 무시, Y 또는 COND 면 판정은 충족으로 가정하고 "부모 소득 조건 확인 필요" 안내를 붙인다 (입력 항목 추가 여부 보류 중).
- asset_max: 입력 항목이 없으므로 안내 문구로만 표시.

## LLM Wiki (정책 설명·근거 층)
- raw/ : 정책 공고문 원문 (파일명 P01_정책명.pdf 형식)
- wiki/rules.md : 위키 페이지 작성 규칙 (조건, 중복 규칙, 출처 항목)
- wiki/P01_정책명.md : 정책별 페이지. 모든 조건에 출처(공고문 몇 항)를 남긴다.
- 위키에서 숫자 조건만 뽑은 CSV를 수작업 policies.csv(정답지)와 비교해 정확도를 기록한다.
- AI 해설은 해당 정책의 위키 페이지를 근거로 참고하고 "근거: ○○ 공고"를 표시한다.
- 자격 판정과 금액 계산에는 위키를 쓰지 않는다. 계산은 항상 policies.csv 기준.

## 화면 구성 (대시보드, 한 화면)
1. 상단 헤더: 작은 영문 라벨 "YOUTH REAL HOUSING COST", 서비스명 "집구해조", 한 줄 설명 "지원정책을 반영한 나의 진짜 주거비", 모드 토글 [내 조건 진단 / 지역 비교]
2. 좌측: 조건 입력 카드 (나이, 월소득, 무주택, 독립거주, 주택유형, 보유 보증금) + 광진구 지도
   - 지도 색상 = 실질 월 주거비, 동 클릭 시 선택
   - 배경 타일은 연한 회색 톤, 폴리곤 fillOpacity 0.55 정도, 얇은 흰 테두리
3. 중앙: 선택 동 상세 분석 패널
   - 정책 적용 전 / 후 월 주거비 큰 숫자 카드, 절감률
   - 비용 구성 막대 (월세, 보증금 환산분, 지원금 차감)
   - 매칭된 정책 카드 (확정 지원 / 선정 시 / 내년 신청 시 구분, 신청 링크)
   - 초기 비용 카드, 보증금 이자지원 카드
   - 월 / 연 토글, 연 단위는 1~3년차 표와 3년 누적
   - 거래 건수 표시, 표본 부족이면 경고
4. 우측: 주거비 해석 AI Agent
   - 연결 상태 배지 (실제 LLM / 제한형 응답 모드)
   - 추천 질문 버튼 4개
   - 답변 영역(근거 표시) + 질문 입력창
5. 푸터: © 2026 집구해조, 데이터 출처(국토교통부 실거래가, 각 정책 공고), "예상 금액이며 최종 자격은 공고 기준"

## 디자인
- 배경: 따뜻한 아이보리 (#FAF7F2 계열), 카드: 흰색, 둥근 모서리, 옅은 테두리
- 포인트 색: 딥그린 (#1F4D3A 계열)
- 상태 색: 초록 #5B9A78 (저렴) / 주황 #E0A458 (보통) / 빨강 #D0654F (부담 큼)
- 작은 영문 라벨(대문자, 자간 넓게) + 굵은 한글 제목 조합
- 데스크톱 3단 레이아웃, 모바일에서는 세로로 쌓기

## 작업 방식
- 한 번에 한 기능씩 구현하고, 끝나면 npm run dev 로 확인 가능하게 둔다.
- 기존 코드를 크게 바꿀 때는 먼저 계획을 설명한다.
- .env.local 은 절대 커밋하지 않는다.
