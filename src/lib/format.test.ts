import { describe, expect, it } from "vitest";
import { formatEuro, formatNumber } from "./format";

describe("formatEuro", () => {
  it("formats cents as Dutch euros", () => {
    expect(formatEuro(4500)).toBe("€ 45,00");
    expect(formatEuro(123456)).toBe("€ 1.234,56");
    expect(formatEuro(0)).toBe("€ 0,00");
  });

  it("formats negative amounts", () => {
    expect(formatEuro(-2500)).toBe("€ -25,00");
  });

  it("rejects non-integer cents", () => {
    expect(() => formatEuro(10.5)).toThrow();
  });
});

describe("formatNumber", () => {
  it("uses a decimal comma", () => {
    expect(formatNumber(43.2)).toBe("43,2");
    expect(formatNumber(4.8)).toBe("4,8");
  });
});
