// 폼 선택지·기본값이 data/input_fields.csv 와 일치하는지 검사
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import { CURRENT_SUPPORT, DEFAULT_CONDITIONS, JOB, MARITAL, MOVED_IN, PARENT_INCOME, PARENT_REGION, RESIDENT, invalidConditions, isJsonObject, missingRequired, toUserInput, type Conditions } from "../conditions";

const rows = Papa.parse<Record<string, string>>(
  fs.readFileSync(path.join(process.cwd(), "data", "input_fields.csv"), "utf-8").replace(/^﻿/, ""),
  { header: true, skipEmptyLines: true },
).data;
const field = (id: string) => rows.find((r) => r.field_id === id)!;
/** "SINGLE(미혼)|NEWLYWED(신혼 7년 이내)" → 코드 목록 */
const codes = (id: string) => field(id).options.split("|").map((o) => o.replace(/\(.*$/, "").trim());

describe("input_fields.csv 와 폼 일치", () => {
  it("입력란 19개", () => expect(rows).toHaveLength(19));

  it.each([
    ["marital", MARITAL],
    ["job", JOB],
    ["resident", RESIDENT],
    ["parent_income", PARENT_INCOME],
    ["parent_region", PARENT_REGION],
    ["moved_in_year", MOVED_IN],
  ] as const)("%s 선택지", (id, opts) => {
    expect(opts.map((o) => o.value).sort()).toEqual(codes(id).sort());
  });

  it("current_support 선택지 (NONE 은 아무것도 고르지 않은 상태)", () => {
    expect(CURRENT_SUPPORT.map((o) => o.value).sort()).toEqual(codes("current_support").filter((c) => c !== "NONE").sort());
  });

  it("기본값", () => {
    expect(DEFAULT_CONDITIONS.marital).toBe(field("marital").default);
    expect(DEFAULT_CONDITIONS.job).toBe(field("job").default);
    expect(DEFAULT_CONDITIONS.resident).toBe(field("resident").default);
    expect(DEFAULT_CONDITIONS.parentIncome).toBe(field("parent_income").default);
    expect(DEFAULT_CONDITIONS.parentRegion).toBe(field("parent_region").default);
    expect(DEFAULT_CONDITIONS.movedInYear).toBe(field("moved_in_year").default);
    expect(DEFAULT_CONDITIONS.houseHead).toBe(field("house_head").default === "Y");
    expect(DEFAULT_CONDITIONS.basicBenefitFamily).toBe(field("basic_benefit_family").default === "Y");
    expect(DEFAULT_CONDITIONS.parentHouseRent).toBe(field("parent_house_rent").default === "Y");
    expect(DEFAULT_CONDITIONS.asset).toBe(""); // UNKNOWN
  });
});

describe("toUserInput", () => {
  const c: Conditions = { ...DEFAULT_CONDITIONS, dong: "화양동" };
  it("자산 빈 칸은 모름(null)", () => {
    expect(toUserInput(c).asset).toBeNull();
    expect(toUserInput({ ...c, asset: "5000" }).asset).toBe(5000);
  });
  it("선택지에 없는 값은 기본값으로", () => {
    const u = toUserInput({ ...c, marital: "X" as never, currentSupport: ["P01", "BAD"] as never });
    expect(u.marital).toBe("SINGLE");
    expect(u.currentSupport).toEqual(["P01"]);
  });
});

describe("빈칸과 0 구분 (교수님 리뷰 2-1, 2-3)", () => {
  const c: Conditions = { ...DEFAULT_CONDITIONS, dong: "화양동" };
  it("보유 보증금: 빈칸은 미입력, 0은 0", () => {
    expect(toUserInput({ ...c, myDeposit: "" }).myDeposit).toBeUndefined();
    expect(toUserInput({ ...c, myDeposit: "  " }).myDeposit).toBeUndefined();
    expect(toUserInput({ ...c, myDeposit: "0" }).myDeposit).toBe(0);
    expect(toUserInput({ ...c, myDeposit: "500" }).myDeposit).toBe(500);
    expect(toUserInput({ ...c, myDeposit: "-3" }).myDeposit).toBe(0);
  });
  it("나이·월소득 빈칸은 필수 입력으로 안내", () => {
    expect(missingRequired({ age: "", monthlyIncome: "150" })).toEqual(["나이"]);
    expect(missingRequired({ age: "27", monthlyIncome: "0" })).toEqual([]); // 소득 0은 정상 입력
  });
});

describe("API 입력 검증 (교수님 리뷰 2-2)", () => {
  const ok = { ...DEFAULT_CONDITIONS, dong: "화양동" };
  it("정상 입력은 통과", () => {
    expect(invalidConditions(ok)).toBeNull();
    expect(invalidConditions({ ...ok, myDeposit: "" })).toBeNull();
  });
  it("빈칸·범위 밖·이상한 값은 거절", () => {
    expect(invalidConditions({ ...ok, age: "" })).toMatch("나이");
    expect(invalidConditions({ ...ok, age: "200" })).toMatch("나이");
    expect(invalidConditions({ ...ok, monthlyIncome: "abc" })).toMatch("월소득");
    expect(invalidConditions({ ...ok, myDeposit: "-1" })).toMatch("보증금");
    expect(invalidConditions({ ...ok, housingType: "apartment" as never })).toMatch("주택유형");
  });
});

describe("API 본문은 JSON 객체여야 함", () => {
  it("객체만 통과", () => {
    expect(isJsonObject({ question: "q", conditions: {} })).toBe(true);
    expect(isJsonObject({})).toBe(true);
  });
  it("null·배열·숫자·문자열·불리언은 거부", () => {
    for (const v of [null, [], [1, 2], 0, 42, "", "text", true]) expect(isJsonObject(v)).toBe(false);
  });
});
