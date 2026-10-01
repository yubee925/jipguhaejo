// 시연 페르소나 정답표(data/persona_expected.csv)와 실제 policies.csv 판정 결과 비교.
// 페르소나 설명은 data/guide/personas.md
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import { loadConstants, loadPolicies } from "../data";
import { matchPolicy } from "../match";
import type { MatchResult, UserInput } from "../types";

const policies = loadPolicies();
const K = loadConstants();

// 공통: 미혼 / 광진구 주민등록 / 무주택 / 부모와 따로 거주 / 1인가구 / 세대주 / 월세 60·보증금 1000 매물
const base: UserInput = {
  age: 27, monthlyIncome: 150, homeless: true, independent: true, single: true, housingType: "officetel",
  myDeposit: 1000, marital: "SINGLE", resident: "GWANGJIN", houseHead: true,
};
const listing = { deposit: 1000, rent: 60 };

const PERSONAS: Record<string, UserInput> = {
  A: base,
  B: { ...base, age: 22, monthlyIncome: 40, basicBenefitFamily: true, parentRegion: "OTHER" },
  B2: { ...base, age: 22, monthlyIncome: 40, basicBenefitFamily: true, parentRegion: "SEOUL" },
  D: { ...base, age: 36, monthlyIncome: 420 },
};

const toResult = (m: MatchResult) => (m.bucket === "na" ? "해당없음" : m.eligible ? "가능" : "탈락");

const expected = Papa.parse<{ persona: string; policy_id: string; result: string }>(
  fs.readFileSync(path.join(process.cwd(), "data", "persona_expected.csv"), "utf-8").replace(/^﻿/, ""),
  { header: true, skipEmptyLines: true },
).data;

describe("시연 페르소나 정답표", () => {
  it("policies.csv 최종본 12개를 읽는다", () => {
    expect(policies).toHaveLength(12);
    expect(policies.find((p) => p.policy_id === "P02")?.deposit_max).toBe(8000);
    expect(policies.find((p) => p.policy_id === "P01")?.deposit_max).toBeNull(); // NONE = 제한 없음
  });

  for (const [id, user] of Object.entries(PERSONAS)) {
    it(`페르소나 ${id}`, () => {
      const got = Object.fromEntries(policies.map((p) => [p.policy_id, toResult(matchPolicy(p, user, K, listing))]));
      const want = Object.fromEntries(expected.filter((r) => r.persona === id).map((r) => [r.policy_id, r.result]));
      expect(got).toEqual(want);
    });
  }
});
