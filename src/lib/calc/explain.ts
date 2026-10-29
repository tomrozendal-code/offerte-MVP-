// Formatting of numbers inside calculation explanations, e.g. "43,2 m² × 2 lagen ÷ 18 m²/uur".
import { formatEuro, formatNumber } from "@/lib/format";
import { type Fraction, roundHalfUp, frac, mul, toNumber } from "./fraction";

/** Formats a fraction with at most `decimals` decimals; prefixes "≈" if that is not exact. */
export function fmt(f: Fraction, decimals = 2): string {
  const scale = 10 ** decimals;
  const rounded = roundHalfUp(mul(f, frac(scale))) / scale;
  const exact = rounded === toNumber(f);
  return `${exact ? "" : "≈ "}${formatNumber(rounded, decimals)}`;
}

export const euro = formatEuro;

export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
