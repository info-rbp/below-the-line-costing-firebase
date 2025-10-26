import { describe, expect, it } from "vitest";
import { fromCents, round2, safeAdd, safeMul, toCents } from "./money";

describe("money utilities", () => {
  it("safely adds values ignoring nulls", () => {
    expect(safeAdd(1, "2", null, undefined)).toBe(3);
  });

  it("safely multiplies values treating null as zero", () => {
    expect(safeMul(5, "2")).toBe(10);
    expect(safeMul(5, null)).toBe(0);
  });

  it("rounds to two decimal places", () => {
    expect(round2(10.005)).toBe(10.01);
    expect(round2(10.004)).toBe(10);
  });

  it("converts to cents accurately", () => {
    expect(toCents(10.235)).toBe(1024);
    expect(toCents("1.50")).toBe(150);
  });

  it("converts from cents", () => {
    expect(fromCents(1025)).toBe(10.25);
    expect(fromCents(Number.NaN)).toBe(0);
  });
});
