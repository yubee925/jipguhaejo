// 시연 페르소나 정답표(data/persona_expected.csv)와 실제 policies.csv 판정 결과 비교.
// 페르소나 설명은 data/guide/personas.md
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import { toUserInput } from "../conditions";
import { loadConstants, loadPolicies } from "../data";
import { matchPolicy } from "../match";
import { PERSONA_B2, PERSONAS, applyPersona } from "../personas";
import type { MatchResult, UserInput } from "../types";

const policies = loadPolicies();
const K = loadConstants();

// 페르소나 조건은 lib/personas.ts. 매물은 월세 60·보증금 1000 기준
const listing = { deposit: 1000, rent: 60 };
const PERSONA_INPUT: Record<string, UserInput> = Object.fromEntries(
  [...PERSONAS, PERSONA_B2].map((p) => [p.id, toUserInput(applyPersona(p, { dong: "화양동", housingType: "officetel" }))]),
);

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

  for (const [id, user] of Object.entries(PERSONA_INPUT)) {
    it(`페르소나 ${id}`, () => {
      const got = Object.fromEntries(policies.map((p) => [p.policy_id, toResult(matchPolicy(p, user, K, listing))]));
      const want = Object.fromEntries(expected.filter((r) => r.persona === id).map((r) => [r.policy_id, r.result]));
      expect(got).toEqual(want);
    });
  }
});

describe("페르소나 목록", () => {
  it("정답표에 있는 페르소나를 모두 정의했다", () => {
    expect([...new Set(expected.map((r) => r.persona))].sort()).toEqual(Object.keys(PERSONA_INPUT).sort());
  });
});
