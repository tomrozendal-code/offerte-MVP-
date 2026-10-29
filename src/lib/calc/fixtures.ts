// Fictional example settings from CLAUDE.md chapter 8. Only for tests.
import type { CalcSettings, VatConfig, VatContext } from "./types";

export const exampleSettings: CalcSettings = {
  hourlyRateCents: 4500,
  materialMarkupBp: 1500,
  travelCostCents: 2500,
  minimumAmountCents: 0,
  defaultCoats: 2,
  norms: {
    wall_paint: { unit: "m2_per_hour_per_coat", value: 18 },
    ceiling_paint: { unit: "m2_per_hour_per_coat", value: 12 },
    preparation: { unit: "minutes_per_m2", value: 3 },
    // Not given in CLAUDE.md; fictional test values.
    crack_repair: { unit: "minutes_per_m2", value: 5 },
    door_paint: { unit: "hours_per_piece_per_side", value: 0.75 },
    door_peeling_prep: { unit: "hours_per_piece_per_side", value: 0.25 },
  },
  materials: [
    {
      id: "muurverf",
      name: "Muurverf",
      unit: "liter",
      packageSize: 10,
      purchasePriceCents: 6000,
      coverageM2PerUnitPerCoat: 8,
      workTypes: ["wall_paint", "ceiling_paint"],
    },
  ],
  materialVatMode: "follow_labor",
};

export const vatConfig: VatConfig = {
  rates: [
    { code: "reduced", rateBp: 900, validFrom: "2001-01-01", validTo: null },
    { code: "standard", rateBp: 2100, validFrom: "2012-10-01", validTo: null },
  ],
  mixedUseSplitFrom: "2025-07-01",
};

export const oldHome: VatContext = { usageType: "residential", dwellingOlderThanTwoYears: true, residentialSharePct: null };

export const QUOTE_DATE = "2026-10-29";
