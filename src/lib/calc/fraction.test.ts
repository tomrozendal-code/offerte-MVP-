import { describe, expect, it } from "vitest";
import { add, ceil, div, frac, fromDecimal, mul, roundHalfUp, toNumber } from "./fraction";

describe("fraction", () => {
  it("is exact where floating point is not", () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(toNumber(add(fromDecimal(0.1), fromDecimal(0.2)))).toBe(0.3);
  });

  it("multiplies and divides exactly", () => {
    // 43.2 m² × 2 coats ÷ 18 m²/hour = 4.8 hours
    expect(toNumber(div(mul(fromDecimal(43.2), frac(2)), frac(18)))).toBe(4.8);
  });

  it("rounds exact halves away from zero", () => {
    expect(roundHalfUp(frac(5, 2))).toBe(3);
    expect(roundHalfUp(frac(-5, 2))).toBe(-3);
    expect(roundHalfUp(frac(249, 100))).toBe(2);
    expect(roundHalfUp(frac(1, 3))).toBe(0);
    expect(roundHalfUp(frac(2, 3))).toBe(1);
  });

  it("rounds up for whole packages", () => {
    expect(ceil(frac(158, 100))).toBe(2);
    expect(ceil(frac(1))).toBe(1);
    expect(ceil(frac(1001, 1000))).toBe(2);
    expect(ceil(frac(0))).toBe(0);
  });

  it("keeps at most 3 decimals of input", () => {
    expect(toNumber(fromDecimal(2.6))).toBe(2.6);
    expect(toNumber(fromDecimal(1.2345))).toBe(1.235);
  });

  it("rejects division by zero", () => {
    expect(() => div(frac(1), frac(0))).toThrow();
  });
});
