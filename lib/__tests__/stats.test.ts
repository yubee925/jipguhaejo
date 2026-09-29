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
      makeRecord({ dong: "화양동", deposit: 1000 }),
      makeRecord({ dong: "화양동", deposit: 3000 }),
      makeRecord({ dong: "구의동", deposit: 5000 }),
      makeRecord({ dong: "화양동", deposit: 2000 }),
    ];
    expect(medianByDong(records, (r) => r.deposit)).toEqual([
      { dong: "구의동", count: 1, median: 5000 },
      { dong: "화양동", count: 3, median: 2000 },
    ]);
  });

  it("빈 입력은 빈 배열", () => {
    expect(medianByDong([], (r) => r.deposit)).toEqual([]);
  });

  it("샘플 데이터: 광진구 7개 동, 동별 28~29건", () => {
    const result = medianByDong(loadRentData(), (r) => r.deposit);
    expect(result.map((d) => d.dong)).toEqual(["광장동", "구의동", "군자동", "능동", "자양동", "중곡동", "화양동"]);
    expect(result.reduce((s, d) => s + d.count, 0)).toBe(200);
    expect(result.every((d) => d.count >= 28 && d.count <= 29 && d.median > 0)).toBe(true);
  });
});
