import { describe, expect, it } from "vitest";
import { calculateQuote, type CalculateQuoteInput } from "./calculateQuote";
import { QUOTE_DATE, exampleSettings, oldHome, vatConfig } from "./fixtures";
import type { CalcSettings, Job, VatContext } from "./types";

// "Woonkamer, muren en plafond sauzen, vier bij vijf meter, twee meter zestig hoog, twee ramen van
//  anderhalf bij één twintig, plafond heeft scheuren, eerst repareren." — as structured by the AI.
const livingRoom: Job = {
  rooms: [
    {
      name: "Woonkamer",
      items: [
        { kind: "walls", lengthM: 4, widthM: 5, heightM: 2.6, openings: [{ widthM: 1.5, heightM: 1.2, count: 2 }] },
        { kind: "ceiling", lengthM: 4, widthM: 5, condition: { cracks: true } },
      ],
    },
  ],
};

function calc(job: Job, overrides: { vat?: VatContext; settings?: Partial<CalcSettings>; quoteDate?: string } = {}) {
  const input: CalculateQuoteInput = {
    job,
    settings: { ...exampleSettings, ...overrides.settings },
    vat: overrides.vat ?? oldHome,
    vatConfig,
    quoteDate: overrides.quoteDate ?? QUOTE_DATE,
  };
  return calculateQuote(input);
}

const amounts = (r: ReturnType<typeof calc>) => Object.fromEntries(r.lines.map((l) => [`${l.room ?? "-"} | ${l.description}`, l.amountCents]));

describe("test case 1: living room, residential, home from 1985", () => {
  const r = calc(livingRoom);

  it("calculates every line from the painter's own settings", () => {
    expect(amounts(r)).toEqual({
      "Woonkamer | Muren sauzen, 2 lagen (standaard)": 21600, // 43,2 m² × 2 ÷ 18 = 4,8 h × € 45
      "Woonkamer | Voorbereiding muren": 9720, // 43,2 m² × 3 min = 2,16 h
      "Woonkamer | Plafond sauzen, 2 lagen (standaard)": 14985, // 20 m² × 2 ÷ 12 = 3,33 h
      "Woonkamer | Voorbereiding plafond": 4500, // 20 m² × 3 min = 1 h
      "Woonkamer | Scheuren repareren plafond": 7515, // 20 m² × 5 min = 1,67 h
      "- | Muurverf": 13800, // 126,4 m² ÷ 8 = 15,8 l → 2 buckets × € 60 × 1,15
      "- | Voorrijkosten": 2500,
    });
  });

  it("explains the wall area exactly as in CLAUDE.md", () => {
    const walls = r.lines[0];
    expect(walls.quantity).toBe(43.2);
    expect(walls.explanation[0]).toBe(
      "Muren: omtrek 2 × (4 + 5) = 18 m × 2,6 m hoog = 46,8 m² − openingen (2 × 1,5 × 1,2 m) 3,6 m² = 43,2 m²",
    );
    expect(walls.explanation[1]).toBe("43,2 m² × 2 lagen (standaard) ÷ 18 m²/uur = 4,8 uur × € 45,00 = € 216,00");
  });

  it("marks rounded hours with ≈", () => {
    const ceiling = r.lines.find((l) => l.description.startsWith("Plafond sauzen"))!;
    expect(ceiling.explanation[1]).toBe("20 m² × 2 lagen (standaard) ÷ 12 m²/uur = ≈ 3,33 uur × € 45,00 = € 149,85");
  });

  it("explains the material calculation", () => {
    const paint = r.lines.find((l) => l.kind === "material")!;
    expect(paint.quantity).toBe(2);
    expect(paint.explanation).toEqual([
      "Woonkamer muren 43,2 m² × 2 lagen + Woonkamer plafond 20 m² × 2 lagen = 126,4 m²",
      "126,4 m² ÷ 8 m² per liter = 15,8 liter → 2 verpakkingen van 10 liter (naar boven afgerond)",
      "2 × € 60,00 + 15% opslag = € 138,00",
    ]);
  });

  it("applies 9% VAT to everything (materials follow labor in these settings)", () => {
    expect(r.subtotalCents).toBe(74620);
    expect(r.vat).toEqual([{ rateBp: 900, baseCents: 74620, vatCents: 6716 }]);
    expect(r.totalCents).toBe(81336);
    expect(r.complete).toBe(true);
  });

  it("can tax materials at 21% if the painter chose that", () => {
    const r2 = calc(livingRoom, { settings: { materialVatMode: "always_standard" } });
    expect(r2.vat).toEqual([
      { rateBp: 900, baseCents: 60820, vatCents: 5474 },
      { rateBp: 2100, baseCents: 13800, vatCents: 2898 },
    ]);
  });
});

describe("test case 2: mixed use, 70% residential", () => {
  it("splits VAT 70% at 9% and 30% at 21%", () => {
    const r = calc(livingRoom, { vat: { usageType: "mixed", dwellingOlderThanTwoYears: true, residentialSharePct: 70 } });
    expect(r.vat).toEqual([
      { rateBp: 900, baseCents: 52235, vatCents: 4701 },
      { rateBp: 2100, baseCents: 22385, vatCents: 4701 },
    ]);
    expect(r.vat!.reduce((s, v) => s + v.baseCents, 0)).toBe(r.subtotalCents);
    expect(r.totalCents).toBe(74620 + 9402);
  });

  it("asks for the residential share if it is missing", () => {
    const r = calc(livingRoom, { vat: { usageType: "mixed", dwellingOlderThanTwoYears: true, residentialSharePct: null } });
    expect(r.vat).toBeNull();
    expect(r.complete).toBe(false);
    expect(r.missingInfo).toEqual([expect.objectContaining({ field: "residentialSharePct", reason: "missing" })]);
  });

  it("does not calculate mixed use before the rule applied", () => {
    const r = calc(livingRoom, { vat: { usageType: "mixed", dwellingOlderThanTwoYears: true, residentialSharePct: 70 }, quoteDate: "2025-06-30" });
    expect(r.vat).toBeNull();
    expect(r.missingInfo).toEqual([expect.objectContaining({ reason: "unsupported" })]);
  });
});

describe("test case 3: new build, in use for eight months", () => {
  it("applies 21%", () => {
    const r = calc(livingRoom, { vat: { usageType: "residential", dwellingOlderThanTwoYears: false, residentialSharePct: null } });
    expect(r.vat).toEqual([{ rateBp: 2100, baseCents: 74620, vatCents: 15670 }]);
  });

  it("applies 21% for a building that is not a home", () => {
    const r = calc(livingRoom, { vat: { usageType: "non_residential", dwellingOlderThanTwoYears: null, residentialSharePct: null } });
    expect(r.vat).toEqual([{ rateBp: 2100, baseCents: 74620, vatCents: 15670 }]);
  });
});

describe("test case 4: missing measurement", () => {
  // "Slaapkamer muren sauzen, drie bij vier."
  const r = calc({ rooms: [{ name: "Slaapkamer", items: [{ kind: "walls", lengthM: 3, widthM: 4, heightM: null }] }] });

  it("asks for the height and does not guess", () => {
    expect(r.missingInfo).toEqual([{ room: "Slaapkamer", field: "heightM", question: "Slaapkamer: hoe hoog zijn de muren?", reason: "missing" }]);
    expect(r.lines.some((l) => l.description.includes("Muren"))).toBe(false);
    expect(r.lines.some((l) => l.kind === "material")).toBe(false);
    expect(r.complete).toBe(false);
  });
});

describe("test case 5: doors", () => {
  // "Vier binnendeuren aan twee kanten aflakken, verf bladdert."
  const r = calc({ rooms: [{ name: "Hal", items: [{ kind: "doors", count: 4, sides: 2, condition: { peeling: true } }] }] });

  it("calculates per piece, with extra preparation", () => {
    expect(amounts(r)).toEqual({
      "Hal | Deuren lakken, 2 kanten": 27000, // 4 × 2 × 0,75 h = 6 h × € 45
      "Hal | Extra voorbereiding deuren (bladderende verf)": 9000, // 4 × 2 × 0,25 h = 2 h
      "- | Voorrijkosten": 2500,
    });
    expect(r.lines[0].explanation).toEqual(["4 deuren × 2 kanten × 0,75 uur = 6 uur × € 45,00 = € 270,00"]);
  });

  it("warns that door material is not calculated", () => {
    expect(r.warnings).toHaveLength(1);
  });

  it("asks how many sides if not mentioned", () => {
    const r2 = calc({ rooms: [{ name: "Hal", items: [{ kind: "doors", count: 4, sides: null }] }] });
    expect(r2.missingInfo).toEqual([expect.objectContaining({ field: "sides", reason: "missing" })]);
  });
});

describe("never guessing: missing or impossible input", () => {
  it("rejects impossible measurements with a clear question", () => {
    const r = calc({ rooms: [{ name: "Keuken", items: [{ kind: "walls", lengthM: 3, widthM: 4, heightM: 0 }] }] });
    expect(r.missingInfo).toEqual([
      { room: "Keuken", field: "heightM", reason: "invalid", question: "Keuken: een hoogte van 0 m kan niet kloppen. Wat is de juiste maat?" },
    ]);
    expect(r.lines.filter((l) => l.kind !== "travel")).toHaveLength(0);
  });

  it("rejects half a door and a third side", () => {
    expect(calc({ rooms: [{ name: "Hal", items: [{ kind: "doors", count: 2.5, sides: 2 }] }] }).missingInfo[0].reason).toBe("invalid");
    expect(calc({ rooms: [{ name: "Hal", items: [{ kind: "doors", count: 2, sides: 3 }] }] }).missingInfo[0].reason).toBe("invalid");
  });

  it("rejects openings larger than the walls", () => {
    const r = calc({ rooms: [{ name: "Serre", items: [{ kind: "walls", lengthM: 2, widthM: 2, heightM: 2, openings: [{ widthM: 4, heightM: 2, count: 3 }] }] }] });
    expect(r.missingInfo[0]).toMatchObject({ field: "openings", reason: "invalid" });
  });

  it("asks for the size of an opening without measurements", () => {
    const r = calc({ rooms: [{ name: "Woonkamer", items: [{ kind: "walls", lengthM: 4, widthM: 5, heightM: 2.6, openings: [{ widthM: null, heightM: null }] }] }] });
    expect(r.missingInfo[0]).toMatchObject({ field: "openings.0", reason: "missing" });
  });

  it("reports missing norms as a setting to fill in, without calculating that line", () => {
    const r = calc(livingRoom, { settings: { norms: { ...exampleSettings.norms, crack_repair: undefined } } });
    expect(r.missingSettings).toEqual([{ key: "norm:crack_repair", message: "Vul bij Normen in: Scheuren repareren." }]);
    expect(r.lines.some((l) => l.description.startsWith("Scheuren"))).toBe(false);
    expect(r.complete).toBe(false);
  });

  it("reports a norm with the wrong unit instead of using it", () => {
    const r = calc(livingRoom, { settings: { norms: { ...exampleSettings.norms, wall_paint: { unit: "minutes_per_m2", value: 3 } } } });
    expect(r.missingSettings[0].key).toBe("norm:wall_paint");
    expect(r.lines.some((l) => l.description.startsWith("Muren sauzen"))).toBe(false);
  });

  it("asks for the crack length when the repair norm is per metre", () => {
    const r = calc(livingRoom, { settings: { norms: { ...exampleSettings.norms, crack_repair: { unit: "hours_per_meter", value: 0.2 } } } });
    expect(r.missingInfo).toEqual([expect.objectContaining({ field: "crackLengthM", reason: "missing" })]);
  });

  it("does not calculate VAT on materials until the painter chooses how", () => {
    const r = calc(livingRoom, { settings: { materialVatMode: null } });
    expect(r.vat).toBeNull();
    expect(r.totalCents).toBeNull();
    expect(r.missingSettings.map((s) => s.key)).toEqual(["materialVatMode"]);
  });

  it("asks the VAT questions when they are not answered", () => {
    const r = calc(livingRoom, { vat: { usageType: null, dwellingOlderThanTwoYears: null, residentialSharePct: null } });
    expect(r.missingInfo.map((m) => m.field)).toEqual(["usageType"]);
    const r2 = calc(livingRoom, { vat: { usageType: "residential", dwellingOlderThanTwoYears: null, residentialSharePct: null } });
    expect(r2.missingInfo.map((m) => m.field)).toEqual(["dwellingOlderThanTwoYears"]);
  });

  it("reports a missing material instead of leaving it out silently", () => {
    const r = calc(livingRoom, { settings: { materials: [] } });
    expect(r.missingSettings.map((s) => s.key)).toEqual(["material:wall_paint", "material:ceiling_paint"]);
  });

  it("reports a missing hourly rate", () => {
    const r = calc(livingRoom, { settings: { hourlyRateCents: 0 } });
    expect(r.missingSettings[0].key).toBe("hourlyRate");
    expect(r.lines.some((l) => l.kind === "labor")).toBe(false);
  });

  it("uses the coats that were mentioned instead of the default", () => {
    const r = calc({ rooms: [{ name: "Hal", items: [{ kind: "ceiling", areaM2: 12, coats: 1 }] }] });
    expect(r.lines[0].description).toBe("Plafond sauzen, 1 laag");
    expect(r.lines[0].amountCents).toBe(4500); // 12 m² × 1 ÷ 12 = 1 h
  });
});

describe("materials and rounding", () => {
  const ceilingOf = (areaM2: number): Job => ({ rooms: [{ name: "Hal", items: [{ kind: "ceiling", areaM2, coats: 1 }] }] });
  const paintLine = (job: Job) => calc(job).lines.find((l) => l.kind === "material")!;

  it("rounds up to whole packages", () => {
    expect(paintLine(ceilingOf(80)).quantity).toBe(1); // exactly 10 liter
    expect(paintLine(ceilingOf(80.08)).quantity).toBe(2); // 10.01 liter
  });

  it("rounds amounts to whole cents, halves up", () => {
    // 1 bucket × € 0,10 × 1,15 = € 0,115 → € 0,12
    const r = calc(ceilingOf(8), {
      settings: { materials: [{ ...exampleSettings.materials[0], purchasePriceCents: 10 }] },
    });
    expect(r.lines.find((l) => l.kind === "material")!.amountCents).toBe(12);
  });
});

describe("minimum amount", () => {
  it("adds a separate line up to the minimum", () => {
    const r = calc({ rooms: [{ name: "Hal", items: [{ kind: "ceiling", areaM2: 12, coats: 1 }] }] }, { settings: { minimumAmountCents: 25000 } });
    const min = r.lines.find((l) => l.kind === "minimum_charge")!;
    expect(min.amountCents).toBe(25000 - r.lines.filter((l) => l !== min).reduce((s, l) => s + l.amountCents, 0));
    expect(r.subtotalCents).toBe(25000);
    expect(min.explanation[0]).toMatch(/^Minimumbedrag € 250,00 − subtotaal/);
  });

  it("adds nothing when the quote is above the minimum", () => {
    const r = calc(livingRoom, { settings: { minimumAmountCents: 25000 } });
    expect(r.lines.some((l) => l.kind === "minimum_charge")).toBe(false);
  });
});

describe("VAT rates come from configuration", () => {
  it("uses the rate valid on the quote date", () => {
    const r = calc(livingRoom, {
      settings: { materialVatMode: "follow_labor" },
      quoteDate: "2027-02-01",
    });
    expect(r.vat![0].rateBp).toBe(900);

    const changed = calculateQuote({
      job: livingRoom,
      settings: exampleSettings,
      vat: oldHome,
      quoteDate: "2027-02-01",
      vatConfig: {
        ...vatConfig,
        rates: [
          { code: "reduced", rateBp: 900, validFrom: "2001-01-01", validTo: "2026-12-31" },
          { code: "reduced", rateBp: 1000, validFrom: "2027-01-01", validTo: null },
          vatConfig.rates[1],
        ],
      },
    });
    expect(changed.vat).toEqual([{ rateBp: 1000, baseCents: 74620, vatCents: 7462 }]);
  });

  it("reports a missing rate instead of crashing", () => {
    const r = calculateQuote({ job: livingRoom, settings: exampleSettings, vat: oldHome, quoteDate: QUOTE_DATE, vatConfig: { ...vatConfig, rates: [] } });
    expect(r.vat).toBeNull();
    expect(r.missingSettings.map((s) => s.key)).toEqual(["vatRate:reduced"]);
  });
});

describe("the painter's own changes", () => {
  const base = calc(livingRoom);
  const wallsKey = "Woonkamer|labor|Muren sauzen, 2 lagen (standaard)";

  it("overrides an amount and keeps it traceable", async () => {
    const { lineKey } = await import("./calculateQuote");
    expect(lineKey(base.lines[0])).toBe(wallsKey);
    const r = calculateQuote({ job: livingRoom, settings: exampleSettings, vat: oldHome, vatConfig, quoteDate: QUOTE_DATE, adjustments: { overrides: { [wallsKey]: 20000 } } });
    expect(r.lines[0].amountCents).toBe(20000);
    expect(r.lines[0].calculatedAmountCents).toBe(21600);
    expect(r.lines[0].explanation.at(-1)).toBe("Handmatig aangepast naar € 200,00 (berekend: € 216,00)");
    expect(r.subtotalCents).toBe(74620 - 1600);
    expect(r.vat).toEqual([{ rateBp: 900, baseCents: 73020, vatCents: 6572 }]);
  });

  it("adds extra lines with their own VAT category", () => {
    const r = calculateQuote({
      job: livingRoom,
      settings: { ...exampleSettings, materialVatMode: "always_standard" },
      vat: oldHome,
      vatConfig,
      quoteDate: QUOTE_DATE,
      adjustments: { extraLines: [{ room: "Gang", description: "Behang verwijderen", amountCents: 15000, vatCategory: "labor" }, { room: null, description: "Afdekmateriaal", amountCents: 2000, vatCategory: "material" }] },
    });
    const extra = r.lines.filter((l) => l.kind === "other");
    expect(extra.map((l) => l.explanation[0])).toEqual(["Zelf toegevoegd: € 150,00", "Zelf toegevoegd: € 20,00"]);
    expect(r.subtotalCents).toBe(74620 + 17000);
    expect(r.vat).toEqual([
      { rateBp: 900, baseCents: 60820 + 15000, vatCents: 6824 },
      { rateBp: 2100, baseCents: 13800 + 2000, vatCents: 3318 },
    ]);
  });

  it("ignores an override that equals the calculated amount", () => {
    const r = calculateQuote({ job: livingRoom, settings: exampleSettings, vat: oldHome, vatConfig, quoteDate: QUOTE_DATE, adjustments: { overrides: { [wallsKey]: 21600 } } });
    expect(r.lines[0].calculatedAmountCents).toBeUndefined();
  });

  it("applies the minimum amount after the changes", () => {
    const r = calculateQuote({ job: livingRoom, settings: { ...exampleSettings, minimumAmountCents: 80000 }, vat: oldHome, vatConfig, quoteDate: QUOTE_DATE, adjustments: { overrides: { [wallsKey]: 0 } } });
    expect(r.lines.find((l) => l.kind === "minimum_charge")?.amountCents).toBe(80000 - (74620 - 21600));
  });
});
