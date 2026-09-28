// 샘플 데이터 생성기: node scripts/generate-sample-data.mjs
// data/rent_data.csv, data/policy_data.csv, data/gangnam_dong.geojson 을 생성한다.
// 시드 고정이라 여러 번 실행해도 같은 결과가 나온다.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const RENT_COUNT = 200;

// mulberry32
let seed = 20260929;
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (min, max) => min + rand() * (max - min);
const intBetween = (min, max) => Math.floor(between(min, max + 1));
const roundTo = (v, step) => Math.round(v / step) * step;
function pickWeighted(items) {
  let r = rand() * items.reduce((s, i) => s + i.weight, 0);
  for (const item of items) if ((r -= item.weight) < 0) return item;
  return items[items.length - 1];
}

// 대략적인 사각형 경계 (위도/경도). 실제 행정 경계가 아님.
const DONGS = [
  { name: "역삼동", code: "1168010100", bounds: [37.492, 127.026, 37.504, 127.046], priceFactor: 1.0 },
  { name: "청담동", code: "1168010400", bounds: [37.517, 127.038, 37.53, 127.058], priceFactor: 1.15 },
  { name: "삼성동", code: "1168010500", bounds: [37.504, 127.038, 37.517, 127.066], priceFactor: 1.1 },
  { name: "대치동", code: "1168010600", bounds: [37.49, 127.046, 37.504, 127.068], priceFactor: 1.1 },
  { name: "논현동", code: "1168010800", bounds: [37.504, 127.018, 37.52, 127.038], priceFactor: 0.95 },
];

// jeonsePerM2: ㎡당 전세가(만원), jeonseRatio: 전세 계약 비율
const BUILDING_TYPES = [
  { name: "아파트", weight: 0.3, area: [59, 135], jeonsePerM2: [1000, 1400], floors: [1, 25], jeonseRatio: 0.55 },
  { name: "오피스텔", weight: 0.3, area: [20, 60], jeonsePerM2: [550, 750], floors: [2, 20], jeonseRatio: 0.3 },
  { name: "연립다세대", weight: 0.2, area: [30, 85], jeonsePerM2: [450, 650], floors: [1, 5], jeonseRatio: 0.35 },
  { name: "단독다가구", weight: 0.2, area: [15, 40], jeonsePerM2: [400, 550], floors: [1, 4], jeonseRatio: 0.25 },
];

function randomDate() {
  const start = Date.UTC(2025, 9, 1); // 2025-10-01
  const end = Date.UTC(2026, 8, 28); // 2026-09-28
  return new Date(start + rand() * (end - start)).toISOString().slice(0, 10);
}

function toCsv(header, rows) {
  const esc = (v) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header, ...rows.map((r) => header.map((h) => r[h]))].map((r) => r.map(esc).join(",")).join("\n") + "\n";
}

const rentRows = [];
for (let i = 0; i < RENT_COUNT; i++) {
  const dong = DONGS[i % DONGS.length];
  const type = pickWeighted(BUILDING_TYPES);
  const area = Math.round(between(...type.area) * 10) / 10;
  const jeonseValue = area * between(...type.jeonsePerM2) * dong.priceFactor;
  const isJeonse = rand() < type.jeonseRatio;

  let deposit, monthlyRent;
  if (isJeonse) {
    deposit = roundTo(jeonseValue, jeonseValue >= 10000 ? 500 : 100);
    monthlyRent = 0;
  } else {
    // 보증금 일부 + 나머지를 전월세 전환율(연 4.5~6%)로 월세 환산
    deposit = Math.max(500, roundTo(jeonseValue * between(0.05, 0.4), 500));
    monthlyRent = Math.max(30, roundTo(((jeonseValue - deposit) * between(0.045, 0.06)) / 12, 5));
  }

  const [latMin, lngMin, latMax, lngMax] = dong.bounds;
  const pad = 0.001;
  rentRows.push({
    id: `R${String(i + 1).padStart(4, "0")}`,
    sigungu: "강남구",
    dong: dong.name,
    dong_code: dong.code,
    building_type: type.name,
    contract_type: isJeonse ? "전세" : "월세",
    deposit,
    monthly_rent: monthlyRent,
    area_m2: area,
    floor: intBetween(...type.floors),
    built_year: intBetween(type.name === "아파트" ? 1983 : 1990, 2024),
    contract_date: randomDate(),
    lat: between(latMin + pad, latMax - pad).toFixed(6),
    lng: between(lngMin + pad, lngMax - pad).toFixed(6),
  });
}
rentRows.sort((a, b) => a.contract_date.localeCompare(b.contract_date));

// 샘플 정책. 수치는 대략적인 예시이며 실제 공고 기준과 다를 수 있음.
const policyRows = [
  {
    policy_id: "P001", policy_name: "서울시 청년월세지원", provider: "서울특별시", target: "청년",
    age_min: 19, age_max: 39, income_limit_manwon: 4300, support_type: "월세지원",
    support_amount_manwon: 20, support_period_months: 12, max_deposit_manwon: 5000, max_monthly_rent_manwon: 60,
    region: "서울특별시", description: "무주택 청년 1인가구 월세 월 최대 20만원 지원",
  },
  {
    policy_id: "P002", policy_name: "서울시 청년 임차보증금 이자지원", provider: "서울특별시", target: "청년",
    age_min: 19, age_max: 39, income_limit_manwon: 5000, support_type: "이자지원",
    support_amount_manwon: 20000, support_period_months: 24, max_deposit_manwon: 30000, max_monthly_rent_manwon: 0,
    region: "서울특별시", description: "임차보증금 대출(최대 2억원) 이자 일부 지원",
  },
  {
    policy_id: "P003", policy_name: "신혼부부 임차보증금 이자지원", provider: "서울특별시", target: "신혼부부",
    age_min: 19, age_max: 99, income_limit_manwon: 13000, support_type: "이자지원",
    support_amount_manwon: 30000, support_period_months: 48, max_deposit_manwon: 70000, max_monthly_rent_manwon: 0,
    region: "서울특별시", description: "혼인 7년 이내 신혼부부 전세보증금 대출(최대 3억원) 이자 지원",
  },
  {
    policy_id: "P004", policy_name: "청년전용 버팀목 전세자금대출", provider: "주택도시기금", target: "청년",
    age_min: 19, age_max: 34, income_limit_manwon: 5000, support_type: "대출",
    support_amount_manwon: 20000, support_period_months: 24, max_deposit_manwon: 30000, max_monthly_rent_manwon: 0,
    region: "전국", description: "무주택 청년 전세자금 저리 대출(최대 2억원)",
  },
  {
    policy_id: "P005", policy_name: "중소기업취업청년 전월세보증금대출", provider: "주택도시기금", target: "청년",
    age_min: 19, age_max: 34, income_limit_manwon: 3500, support_type: "대출",
    support_amount_manwon: 10000, support_period_months: 24, max_deposit_manwon: 20000, max_monthly_rent_manwon: 0,
    region: "전국", description: "중소·중견기업 재직 청년 전월세보증금 저리 대출(최대 1억원)",
  },
];

const geojson = {
  type: "FeatureCollection",
  features: DONGS.map(({ name, code, bounds: [latMin, lngMin, latMax, lngMax] }) => ({
    type: "Feature",
    properties: { dong: name, dong_code: code, sigungu: "강남구" },
    geometry: {
      type: "Polygon",
      // GeoJSON 좌표 순서는 [경도, 위도], 외곽 링은 반시계 방향
      coordinates: [[[lngMin, latMin], [lngMax, latMin], [lngMax, latMax], [lngMin, latMax], [lngMin, latMin]]],
    },
  })),
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "rent_data.csv"), toCsv(Object.keys(rentRows[0]), rentRows));
writeFileSync(join(OUT_DIR, "policy_data.csv"), toCsv(Object.keys(policyRows[0]), policyRows));
writeFileSync(join(OUT_DIR, "gangnam_dong.geojson"), JSON.stringify(geojson, null, 2) + "\n");
console.log(`rent_data.csv ${rentRows.length}건, policy_data.csv ${policyRows.length}건, gangnam_dong.geojson ${geojson.features.length}개 동`);
