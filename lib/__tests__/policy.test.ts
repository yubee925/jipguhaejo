import { describe, expect, it } from "vitest";
import { matchPolicies } from "../policy";
import { loadPolicyData, makePolicy } from "./fixtures";

const youth = { age: 27, annualIncomeManwon: 3000 };

describe("matchPolicies", () => {
  it("나이 경계값(최소·최대)을 포함한다", () => {
    const p = [makePolicy({ age_min: 19, age_max: 39 })];
    expect(matchPolicies({ ...youth, age: 19 }, p)).toHaveLength(1);
    expect(matchPolicies({ ...youth, age: 39 }, p)).toHaveLength(1);
    expect(matchPolicies({ ...youth, age: 18 }, p)).toHaveLength(0);
    expect(matchPolicies({ ...youth, age: 40 }, p)).toHaveLength(0);
  });

  it("소득 한도 이하만 통과한다", () => {
    const p = [makePolicy({ income_limit_manwon: 4000 })];
    expect(matchPolicies({ ...youth, annualIncomeManwon: 4000 }, p)).toHaveLength(1);
    expect(matchPolicies({ ...youth, annualIncomeManwon: 4001 }, p)).toHaveLength(0);
  });

  it("신혼부부 정책은 isNewlywed가 true일 때만 매칭한다", () => {
    const p = [makePolicy({ target: "신혼부부", age_max: 99, income_limit_manwon: 13000 })];
    expect(matchPolicies(youth, p)).toHaveLength(0);
    expect(matchPolicies({ ...youth, isNewlywed: true }, p)).toHaveLength(1);
  });

  it("지역: 전국 정책은 항상, 시·도 정책은 해당 지역만", () => {
    const seoul = makePolicy({ policy_id: "S", region: "서울특별시" });
    const nation = makePolicy({ policy_id: "N", region: "전국" });
    expect(matchPolicies(youth, [seoul, nation]).map((p) => p.policy_id)).toEqual(["S", "N"]);
    expect(matchPolicies({ ...youth, region: "부산광역시" }, [seoul, nation]).map((p) => p.policy_id)).toEqual(["N"]);
  });

  it("매물의 보증금·월세 상한을 확인한다 (0은 제한 없음)", () => {
    const p = [makePolicy({ max_deposit_manwon: 5000, max_monthly_rent_manwon: 60 })];
    expect(matchPolicies(youth, p, { deposit: 5000, monthly_rent: 60 })).toHaveLength(1);
    expect(matchPolicies(youth, p, { deposit: 5001, monthly_rent: 60 })).toHaveLength(0);
    expect(matchPolicies(youth, p, { deposit: 5000, monthly_rent: 61 })).toHaveLength(0);

    const unlimited = [makePolicy({ support_type: "대출", max_deposit_manwon: 0, max_monthly_rent_manwon: 0 })];
    expect(matchPolicies(youth, unlimited, { deposit: 999999, monthly_rent: 999 })).toHaveLength(1);
  });

  it("월세지원은 전세 매물(월세 0)에 매칭하지 않는다", () => {
    const p = [makePolicy({ support_type: "월세지원" })];
    expect(matchPolicies(youth, p, { deposit: 20000, monthly_rent: 0 })).toHaveLength(0);
  });

  it("샘플 정책 데이터: 27세·연 3000만원 청년, 보증금 1000/월세 50 매물", () => {
    const ids = matchPolicies(youth, loadPolicyData(), { deposit: 1000, monthly_rent: 50 }).map((p) => p.policy_id);
    expect(ids).toEqual(["P001", "P002", "P004", "P005"]);
  });

  it("샘플 정책 데이터: 36세는 34세 상한 대출 정책에서 빠진다", () => {
    const ids = matchPolicies({ ...youth, age: 36 }, loadPolicyData()).map((p) => p.policy_id);
    expect(ids).toEqual(["P001", "P002"]);
  });
});
