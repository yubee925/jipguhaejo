# 데이터 스키마

모든 파일은 `data/`에 있고 `scripts/generate-sample-data.mjs`가 생성한다(시드 고정, 다시 실행해도 같은 결과). 서버에서 `lib/data.ts`가 읽는다. **금액 단위는 모두 만원.**

## rent_data.csv — 전월세 거래 (샘플 200건)

| 컬럼 | 설명 | 예 |
|---|---|---|
| id | 거래 ID | R0106 |
| sigungu | 자치구 | 광진구 |
| dong | 법정동 | 화양동 |
| dong_code | 법정동코드 10자리(문자열로 읽음) | 1121510700 |
| building_type | 아파트 / 오피스텔 / 연립다세대 / 단독다가구 | 오피스텔 |
| contract_type | 전세 / 월세 | 월세 |
| deposit | 보증금 | 1000 |
| monthly_rent | 월세(전세는 0) | 50 |
| area_m2 | 전용면적 ㎡ | 32.5 |
| floor | 층 | 2 |
| built_year | 건축연도 | 1997 |
| contract_date | 계약일 YYYY-MM-DD (2025-10 ~ 2026-09) | 2025-10-06 |
| lat, lng | 좌표(해당 동 임시 경계 안 무작위) | 37.54, 127.07 |

샘플 생성 규칙: 동마다 28~29건, 주택유형 비율 아파트·오피스텔 각 30%, 연립·단독 각 20%. 가격은 유형별 ㎡당 전세가 × 동별 가격계수. 월세는 전세가 일부를 보증금으로 두고 나머지를 연 4.5~6%로 월세 환산.

**주의:** 동별 표본이 적어 중앙값이 크게 흔들린다(예: 화양동이 가장 비싸게 나옴). 실제 데이터로 교체 전까지 결과 수치를 해석하지 않는다.

## policy_data.csv — 정책 (5건)

`policy_id, policy_name, provider, target, age_min, age_max, income_limit_manwon, support_type, support_amount_manwon, support_period_months, max_deposit_manwon, max_monthly_rent_manwon, region, description`

- `support_type`: 월세지원 / 이자지원 / 대출
- `support_amount_manwon`: 월세지원은 **월** 지원액, 이자지원·대출은 **지원 대상 보증금 한도**
- `max_deposit_manwon`, `max_monthly_rent_manwon`: 0이면 제한 없음

내용은 [youth-housing-policies.md](youth-housing-policies.md).

## dong_boundaries.geojson — 동 경계

FeatureCollection, 동마다 Polygon 1개. properties: `dong`, `dong_code`, `sigungu`. 좌표는 [경도, 위도]. 현재 **임시 사각형**(실제 행정 경계 아님).

## 실제 데이터로 바꿀 때

- 전월세: 국토교통부 전월세 실거래가(공공데이터포털). 컬럼명을 위 스키마에 맞추면 코드 수정 없이 동작한다.
- 경계: 브이월드·통계청 SGIS의 법정동 경계. properties에 `dong`을 넣어야 지도와 연결된다.
- 원본 파일은 `raw/`에 두고 위키에 출처를 남긴다.
