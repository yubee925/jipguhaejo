import { describe, expect, it } from "vitest";
import { median, medianByDong } from "../stats";
import { loadRentData, makeRecord } from "./fixtures";

describe("median", () => {
  it("홀수 개는 가운데 값", () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it("짝수 개는 가운데 두 값의 평균", () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it("빈 배열은 NaN", () => {
    expect(median([])).toBeNaN();
  });

  it("입력 배열을 변경하지 않는다", () => {
    const values = [3, 1, 2];
    median(values);
    expect(values).toEqual([3, 1, 2]);
  });
});

describe("medianByDong", () => {
  it("동별로 묶어 개수와 중앙값을 반환한다", () => {
    const records = [
      makeRecord({ dong: "역삼동", deposit: 1000 }),
      makeRecord({ dong: "역삼동", deposit: 3000 }),
      makeRecord({ dong: "대치동", deposit: 5000 }),
      makeRecord({ dong: "역삼동", deposit: 2000 }),
    ];
    expect(medianByDong(records, (r) => r.deposit)).toEqual([
      { dong: "대치동", count: 1, median: 5000 },
      { dong: "역삼동", count: 3, median: 2000 },
    ]);
  });

  it("빈 입력은 빈 배열", () => {
    expect(medianByDong([], (r) => r.deposit)).toEqual([]);
  });

  it("샘플 데이터: 5개 동, 동별 40건", () => {
    const result = medianByDong(loadRentData(), (r) => r.deposit);
    expect(result.map((d) => d.dong)).toEqual(["논현동", "대치동", "삼성동", "역삼동", "청담동"]);
    expect(result.every((d) => d.count === 40 && d.median > 0)).toBe(true);
  });
});
