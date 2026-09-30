# 집구해조 — 청년 실질 주거비 진단 대시보드

팀명·서비스명: 집구해조

@AGENTS.md

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
- 면적: 전용 60㎡ 이하.
- 범위 밖: 교통 접근성, 상권, 인구, 편의시설, 비수도권 비교 도시 (발표에서 확장 계획으로만 언급).

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
- 계산 상수는 lib/config.ts 한 곳에서 관리한다 (환산 이율, 기준중위소득, 표본 최소 건수 등).
- 화면에는 "예상 금액이며 최종 자격은 공고 기준" 안내 문구를 넣는다.

## 계산식
config.ts 상수
- RATE r = 0.045 (법정 전환율 = 한국은행 기준금리 + 2%p. 기준금리 확인 후 수정)
- MEDIAN_INCOME_1P = 2026년 1인가구 기준중위소득(월, 만원). 확인 후 입력
- MIN_SAMPLE = 10

1. 거래별 환산 월세 = 월세 + (보증금 × r ÷ 12)
   - 전세 거래(월세 0)도 같은 식으로 환산해 포함한다.
2. 동 기준 주거비 C = 해당 동 + 선택 주택유형 + 전용 60㎡ 이하 거래들의 ①값 중앙값
   - 월세·보증금을 따로 중앙값 내지 않는다 (서로 다른 매물이 섞임).
   - 거래가 MIN_SAMPLE 미만이면 "표본 부족" 표시.
3. 정책 지원금 S
   - 정책별 인정 지원액 = min(월 지원액, 실제 월세)
   - S = 자격 충족 정책들의 인정 지원액 합
   - stack_rule로 같이 못 받는 정책끼리는 가장 유리한 1개만 적용
   - 기본 계산에는 selection=auto 이고 apply_open=Y 이거나 상시(always)인 정책만 포함
4. 실질 월 주거비 = max(C − S, 0), 절감률 = S ÷ C × 100
5. 연 주거비: 연차별 12개월 합. 각 달에 유효한 지원금만 차감하고, 정책 max_months가 끝난 달부터는 차감 없음. 1~3년차 + 3년 누적을 보여준다.
6. 지역 비교: 모든 동에 같은 사용자 조건으로 1~5를 계산 → 실질 월 주거비 오름차순 순위, 차이 = 선택 동 − 비교 동. 지도 색상은 순위 기준 7단계(노랑 저렴 → 암갈색 비쌈, lib/scale.ts), 표본 부족 동은 회색.
7. (선택) 내 보증금 기준 예상 월세 = C − (내 보증금 × r ÷ 12)

처리 규칙
- 추첨형 정책(selection=lottery, 예: 광진형 청년월세): 기본 계산 제외, "선정 시" 금액을 따로 표시
- 신청 마감 정책(apply_open=N): 기본 계산 제외, "내년 신청 시" 시나리오로 따로 표시
- 관리비: 계산 제외, 화면에 "관리비 별도" 표시
- 이자지원 정책(support_type=interest): 계산 제외, 보증금 카드로 설명
- 중개보수·이사비 등 일회성(support_type=one_time): 월 계산과 섞지 않고 "초기 비용" 카드로 표시

검증 예시 (테스트 케이스로 사용)
- 월세 55, 보증금 1000, r 4.5% → C = 58.75
- 국토부 청년월세 월 20 × 24개월 적용 → 실질 월 38.75, 절감률 약 34%
- 1·2년차 각 465, 3년차 705, 3년 누적 1635 (지원 없으면 2115)

## 소득 판정
- 사용자 입력: 월소득(만원)
- 소득 비율 = 월소득 ÷ MEDIAN_INCOME_1P × 100 → 정책 income_pct 이하이면 충족
- 원가구(부모) 소득 조건(parent_income_pct)은 입력 항목 추가 여부 보류 중. 결정 전까지는 "부모 소득 조건 확인 필요" 안내로 처리하고 판정에서는 충족으로 가정한다.

## 데이터 스키마 (실제 데이터 전달 전까지는 같은 형식의 샘플 데이터 사용)
공통 규칙: CSV UTF-8, 영문 컬럼명, 금액 단위 만원(숫자만), 예/아니오 Y/N, 빈칸 = 조건 없음.

- data/rent_data.csv
  dong, contract_ym, house_type, area_m2, deposit, monthly_rent, floor, built_year
  (house_type: officetel / rowhouse. 전세는 monthly_rent = 0)

- data/policy_data.csv
  policy_id, name, level, agency,
  min_age, max_age, residence, homeless_required, independent_required, single_only,
  income_pct, parent_income_pct, parent_exempt, asset_limit,
  deposit_limit, rent_limit,
  support_type, monthly_support, max_months, total_limit, interest_rate, lifetime_once,
  stack_rule, selection, apply_start, apply_end, apply_open,
  source_url, source_date, notes
  (level: national / seoul / gu, residence: none / seoul / gwangjin,
   support_type: monthly / interest / one_time, selection: auto / lottery,
   stack_rule: 같이 못 받는 policy_id를 ; 로 구분, apply_start/apply_end: YYYY-MM-DD 또는 always)

- data/gwangjin_dong.geojson
  광진구 법정동 경계, 좌표계 WGS84(EPSG:4326), 단순화된 경계.
  properties.dong 이 rent_data 의 dong 과 정확히 일치해야 함.

## LLM Wiki (정책 설명·근거 층)
- raw/ : 정책 공고문 원문 (파일명 P01_정책명.pdf 형식)
- wiki/rules.md : 위키 페이지 작성 규칙 (조건, 중복 규칙, 출처 항목)
- wiki/P01_정책명.md : 정책별 페이지. 모든 조건에 출처(공고문 몇 항)를 남긴다.
- 위키에서 숫자 조건만 뽑은 CSV를 수작업 policy_data.csv(정답지)와 비교해 정확도를 기록한다.
- AI 해설은 해당 정책의 위키 페이지를 근거로 참고하고 "근거: ○○ 공고"를 표시한다.
- 자격 판정과 금액 계산에는 위키를 쓰지 않는다. 계산은 항상 policy_data.csv 기준.
- wiki/project/ : 프로젝트 위키(계산식·데이터·구조·결정 기록·변경 이력). 목차는 wiki/project/index.md. 계산식·데이터 형식·화면·API를 바꾸면 같은 작업에서 관련 문서와 wiki/project/log.md 를 함께 고친다. raw/ 원본은 수정하지 않는다.

## 화면 구성 (웹사이트) — 2026-09-30 강사 피드백 반영
대시보드 한 화면이 아니라 메뉴와 페이지가 있는 웹사이트다.

- 공통 헤더: 작은 영문 라벨 "YOUTH REAL HOUSING COST" + 서비스명 "집구해조", 메뉴 [주거비 진단 / 동네 비교 / 청년 주거정책 / 서비스 소개]
- 공통 푸터: © 2026 집구해조, 데이터 출처(국토교통부 실거래가, 각 정책 공고), "예상 금액이며 최종 자격은 공고 기준"
- AI 도우미: 모든 페이지 오른쪽 아래 캐릭터 "구해봇" 버튼 → 채팅 창
  - 연결 상태 배지 (실제 LLM / 제한형 응답 모드), 추천 질문 버튼 4개, 답변 영역(근거 표시) + 질문 입력창
- 사용자 조건은 사이트 전체에서 공유한다(app/components/AppProvider.tsx). 페이지를 옮겨도 유지.

페이지
1. 홈 `/` : 한 줄 설명 "지원정책을 반영한 나의 진짜 주거비", [내 주거비 진단하기]·[동네 비교 보기] 버튼, 이용 방법 3단계, 실질 주거비 설명
2. 주거비 진단 `/diagnosis`
   - 왼쪽: 조건 입력 카드 (나이, 월소득, 무주택, 독립거주, 주택유형, 보유 보증금, 희망 동)
   - 오른쪽 위: 선택한 동 지도 — 선택 동만 색칠, 나머지 동은 회색, 선택 동으로 이동. 회색 동 클릭 시 그 동으로 변경
   - 오른쪽 아래: 진단 결과
     - 정책 적용 전 / 후 월 주거비 큰 숫자 카드, 절감률
     - 비용 구성 막대 (월세, 보증금 환산분, 지원금 차감)
     - 매칭된 정책 카드 (확정 지원 / 선정 시 / 내년 신청 시 구분, 신청 링크)
     - 초기 비용 카드, 보증금 이자지원 카드
     - 월 / 연 토글, 연 단위는 1~3년차 표와 3년 누적
     - 거래 건수 표시, 표본 부족이면 경고
3. 동네 비교 `/compare` : 광진구 지도 + 저렴한 순 목록, 선택한 동 요약과 [이 동으로 자세히 진단] 버튼
   - 지도 색상 = 실질 월 주거비, 조건 변경 시 색·금액 애니메이션
   - 배경 타일 연한 회색, 폴리곤 fillOpacity 0.55 정도, 얇은 흰 테두리, 광진구 바깥은 흐리게 가림
4. 청년 주거정책 `/policies` : 정책 카드 목록, 내 조건 기준 해당 여부와 이유
5. 서비스 소개 `/about` : 계산 방법, 데이터 출처, 안내 문구, 팀

## 디자인 (현재 톤 유지)
- 배경: 연한 회색 (#f6f7f9), 카드: 흰색, 둥근 모서리, 옅은 테두리
- 포인트 색: 파랑 (#2563eb), 지원·절감 표시는 초록 (#047857)
- 지도: 순위 기준 7단계 다색 팔레트 (lib/scale.ts ORDERED), 표본 부족 동은 회색
- 작은 영문 라벨(대문자, 자간 넓게) + 굵은 한글 제목 조합
- 모바일에서는 세로로 쌓기

## 현재 구현 상태 (2026-09-30) — 위 명세와 다른 점
계산식·소득 판정·데이터 스키마는 명세대로 구현됨 (lib/config.ts, market.ts, policy.ts, diagnosis.ts). 남은 차이:
- 실거래가: raw/rent/rent_gwangjin_clean.csv → scripts/build-rent-data.mjs → data/rent_data.csv. 월세만(팀 결정), 전용 40㎡ 이하(데이터 정리 기준), 5,578건. 스키마에 is_new(Y/N) 컬럼을 추가함.
- 동 기준 주거비 C는 신규 계약만 사용 (config USE_NEW_CONTRACTS_ONLY, 팀 결정 전 기본값).
- 전환율 r = 5.0% (constants.xlsx: 기준금리 3.00% + 2%p, 시행령 원문 확인 필요). 검증 예시 테스트는 r = 4.5%로 따로 확인.
- 정책 data/policy_data.csv 는 명세 형식의 예시 5건 (공고 확인 전). 실제 정책·공고 링크 필요.
- 동 경계 data/gwangjin_dong.geojson 은 임시 사각형. 실제 법정동 경계 필요.
- 지도 색은 상태색 3단계 대신 순위 7단계(디자인 절 참고). 표본 부족 동은 회색.
- 월세 상한(rent_limit) 판정에는 "내 보증금 기준 예상 월세 = C − 보증금 × r ÷ 12"를 쓴다.
- 판정 가정: 거주 요건·1인 가구·부모 소득·재산 조건은 충족으로 보고 "확인 필요"로 안내.

## 작업 방식
- 한 번에 한 기능씩 구현하고, 끝나면 npm run dev 로 확인 가능하게 둔다.
- 기존 코드를 크게 바꿀 때는 먼저 계획을 설명한다.
- .env.local 은 절대 커밋하지 않는다.
