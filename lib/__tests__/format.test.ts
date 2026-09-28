import { describe, expect, it } from "vitest";
import { formatManwon } from "../format";

describe("formatManwon", () => {
  it("1억 미만은 만원 단위", () => {
    expect(formatManwon(83.75, 1)).toBe("83.8만원");
    expect(formatManwon(5000)).toBe("5,000만원");
  });

  it("1억 이상은 억 단위로 나눈다", () => {
    expect(formatManwon(10000)).toBe("1억원");
    expect(formatManwon(32500)).toBe("3억 2,500만원");
  });
});
