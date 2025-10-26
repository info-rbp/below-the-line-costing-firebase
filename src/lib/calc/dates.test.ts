import { describe, expect, it } from "vitest";
import { clampToMonthStartEnd, monthKey, monthRangeInclusive } from "./dates";

describe("date helpers", () => {
  it("computes month key", () => {
    expect(monthKey("2024-05-15")).toBe("2024-05");
  });

  it("builds inclusive ranges", () => {
    expect(monthRangeInclusive("2024-01-01", "2024-03-20")).toEqual(["2024-01", "2024-02", "2024-03"]);
  });

  it("clamps missing dates", () => {
    const { start, end } = clampToMonthStartEnd("2024-02-10", "2024-02-25");
    expect(start.getUTCDate()).toBe(1);
    expect(end.getUTCDate()).toBe(29);
  });
});
