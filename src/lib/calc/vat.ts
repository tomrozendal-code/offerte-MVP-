import { frac, mul, roundHalfUp } from "./fraction";
import { missing, unsupported } from "./checks";
import type { CalcLine, MaterialVatMode, MissingInfo, MissingSetting, VatConfig, VatContext, VatLine } from "./types";

/** Part of an amount taxed at a rate, e.g. 70% reduced + 30% standard for mixed use. */
export type VatPart = { code: "reduced" | "standard"; pct: number };

type VatResult = { parts: VatPart[] } | { missing: MissingInfo[] };

/**
 * VAT on labor for painting and plastering (CLAUDE.md chapter 5):
 * - reduced rate for homes first used two or more years ago;
 * - mixed use (from config date): only the residential share at the reduced rate;
 * - not a home, or younger than two years: standard rate.
 */
export function laborVatParts(ctx: VatContext, config: VatConfig, quoteDate: string): VatResult {
  if (ctx.usageType === null) {
    return { missing: [question("usageType", "Is het een woning, gemengd gebruik (wonen en werken) of geen woning?")] };
  }
  if (ctx.usageType === "non_residential") return { parts: [{ code: "standard", pct: 100 }] };

  if (ctx.dwellingOlderThanTwoYears === null) {
    return { missing: [question("dwellingOlderThanTwoYears", "Is de woning twee jaar of langer geleden voor het eerst in gebruik genomen?")] };
  }
  if (!ctx.dwellingOlderThanTwoYears) return { parts: [{ code: "standard", pct: 100 }] };

  if (ctx.usageType === "residential") return { parts: [{ code: "reduced", pct: 100 }] };

  // Mixed use.
  if (quoteDate < config.mixedUseSplitFrom) {
    return {
      missing: [unsupported(null, "usageType", `Btw bij gemengd gebruik kan de app pas berekenen vanaf ${config.mixedUseSplitFrom}. Controleer de datum van de offerte.`)],
    };
  }
  const share = ctx.residentialSharePct;
  if (share === null) {
    return { missing: [question("residentialSharePct", "Welk deel van het gebouw is woongedeelte (in procenten)?")] };
  }
  if (!Number.isInteger(share) || share < 0 || share > 100) {
    return { missing: [{ room: null, field: "residentialSharePct", reason: "invalid", question: `Woongedeelte van ${share}% kan niet kloppen. Vul een heel getal van 0 tot 100 in.` }] };
  }
  return {
    parts: [
      { code: "reduced", pct: share },
      { code: "standard", pct: 100 - share },
    ].filter((p) => p.pct > 0) as VatPart[],
  };
}

export function materialVatParts(mode: MaterialVatMode | null, laborParts: VatPart[]): { parts: VatPart[] } | { missing: MissingSetting } {
  if (mode === null) {
    return {
      missing: { key: "materialVatMode", message: "Kies bij Instellingen hoe je btw op materialen rekent. Check dit met je boekhouder." },
    };
  }
  return { parts: mode === "follow_labor" ? laborParts : [{ code: "standard", pct: 100 }] };
}

/** Looks up the rate that is valid on the quote date; null if none is configured. */
export function rateFor(code: VatPart["code"], config: VatConfig, date: string): number | null {
  const rate = config.rates.find((r) => r.code === code && r.validFrom <= date && (r.validTo === null || date <= r.validTo));
  return rate ? rate.rateBp : null;
}

/**
 * VAT specification per rate. Each line is split over its VAT parts (rounded to whole cents, the
 * remainder goes to the last part so the parts always add up to the line). VAT is then calculated
 * once per rate over the total base of that rate.
 */
export function vatBreakdown(
  lines: Pick<CalcLine, "amountCents" | "vatCategory">[],
  partsByCategory: Record<CalcLine["vatCategory"], VatPart[]>,
  config: VatConfig,
  date: string,
): VatLine[] {
  const baseByRate = new Map<number, number>();

  for (const line of lines) {
    const parts = partsByCategory[line.vatCategory];
    let remaining = line.amountCents;
    parts.forEach((part, i) => {
      const base = i === parts.length - 1 ? remaining : roundHalfUp(frac(line.amountCents * part.pct, 100));
      remaining -= base;
      const bp = rateFor(part.code, config, date);
      if (bp === null) throw new Error(`No ${part.code} VAT rate configured for ${date}; check with missingVatRates first`);
      baseByRate.set(bp, (baseByRate.get(bp) ?? 0) + base);
    });
  }

  return [...baseByRate.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rateBp, baseCents]) => ({ rateBp, baseCents, vatCents: roundHalfUp(mul(frac(baseCents), frac(rateBp, 10000))) }));
}

/** VAT rates needed for these parts that are not configured for the date. */
export function missingVatRates(parts: VatPart[], config: VatConfig, date: string): MissingSetting[] {
  const codes = [...new Set(parts.map((p) => p.code))];
  return codes
    .filter((code) => rateFor(code, config, date) === null)
    .map((code) => ({
      key: `vatRate:${code}`,
      message: `Er is geen ${code === "reduced" ? "verlaagd" : "algemeen"} btw-tarief bekend voor ${date}. De btw kan niet worden berekend.`,
    }));
}

function question(field: string, text: string): MissingInfo {
  return missing(null, field, text);
}
