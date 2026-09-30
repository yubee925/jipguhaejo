// 화면·AI 해설 API가 공통으로 쓰는 진단 함수 (순수 함수).
// 서버 라우트: const k = loadConstants(); diagnose(input, dong, loadRent(), loadPolicies(), k)
import type { Constants, MatchResult, Policy, RentRecord, UserInput } from "./types";
import { colorBuckets, dongBase, expectedRent, realMonthly, round2, yearlyCost } from "./calc";
import { matchPolicy, pickSupports, sumMonthly } from "./match";

export function diagnoseDong(
  u: UserInput,
  dong: string,
  rent: RentRecord[],
  policies: Policy[],
  k: Constants,
) {
  const r = k.CONVERSION_RATE / 100;
  const base = dongBase(rent, dong, u.housingType, r);
  if (base.C == null || base.rentMedian == null) {
    return { dong, base, available: false as const };
  }
  // 대표 매물: 해당 동 중앙값 수준 (월세 중앙값, 보증금은 C에서 역산)
  const listingRent = base.rentMedian;
  const listingDeposit = Math.max(((base.C - listingRent) * 12) / r, 0);
  const matches: MatchResult[] = policies.map((p) =>
    matchPolicy(p, u, k, { deposit: listingDeposit, rent: listingRent }),
  );

  const confirmed = pickSupports(matches, listingRent, ["confirmed"]);
  const S = sumMonthly(confirmed);
  const { real, savingRate } = realMonthly(base.C, S);
  const yearly = yearlyCost(base.C, confirmed);

  // 시나리오: 선정 시 / 내년 신청 시
  const withLottery = pickSupports(matches, listingRent, ["confirmed", "lottery"]);
  const withNextYear = pickSupports(matches, listingRent, ["confirmed", "lottery", "next_year"]);

  return {
    dong,
    available: true as const,
    base: { ...base, C: round2(base.C) },
    listing: { rent: listingRent, deposit: Math.round(listingDeposit) },
    matches,
    supports: confirmed,
    S,
    real: round2(real),
    savingRate: round2(savingRate),
    yearly: {
      perYear: yearly.perYear.map(round2),
      total: round2(yearly.total),
      withoutSupport: round2(yearly.withoutSupport),
      saved: round2(yearly.saved),
    },
    scenarios: {
      lottery: round2(Math.max(base.C - sumMonthly(withLottery), 0)),
      nextYear: round2(Math.max(base.C - sumMonthly(withNextYear), 0)),
    },
    expectedRent: u.myDeposit != null ? round2(expectedRent(base.C, u.myDeposit, r)) : null,
  };
}

/** 모든 동 비교 + 순위 + 지도 색 */
export function compareDongs(
  u: UserInput,
  dongs: string[],
  rent: RentRecord[],
  policies: Policy[],
  k: Constants,
) {
  const rows = dongs.map((d) => diagnoseDong(u, d, rent, policies, k));
  const ok = rows.filter((x) => x.available) as Extract<(typeof rows)[number], { available: true }>[];
  const ranked = [...ok].sort((a, b) => a.real - b.real).map((x, i) => ({ rank: i + 1, ...x }));
  const colors = colorBuckets(ok.map((x) => ({ dong: x.dong, value: x.real })));
  return { ranked, colors, unavailable: rows.filter((x) => !x.available).map((x) => x.dong) };
}
