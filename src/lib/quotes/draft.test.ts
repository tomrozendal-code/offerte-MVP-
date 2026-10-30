import { describe, expect, it } from "vitest";
import { calculateQuote } from "@/lib/calc";
import { QUOTE_DATE, exampleSettings, vatConfig } from "@/lib/calc/fixtures";
import type { Extraction } from "@/lib/ai/extraction";
import { QuoteDraftSchema, diffDrafts, draftToCalcInput, initialDraft } from "./draft";

const extraction: Extraction = {
  rooms: [
    {
      name: "Slaapkamer",
      items: [{ kind: "walls", lengthM: 3, widthM: 4, heightM: null, areaM2: null, openings: [], coats: null, count: null, sides: null, cracks: false, crackLengthM: null, peeling: false }],
    },
  ],
  vat: { usageType: "residential", dwellingOlderThanTwoYears: true, residentialSharePct: null },
  client: { name: "Mevrouw Jansen", address: "Dorpsstraat 12, Zeist" },
  notUnderstood: [],
};

describe("quote draft", () => {
  it("starts from the AI proposal and is valid", () => {
    const draft = initialDraft(extraction, "Slaapkamer: wij sauzen de muren.");
    expect(QuoteDraftSchema.safeParse(draft).success).toBe(true);
    expect(draft.client.name).toBe("Mevrouw Jansen");
    expect(draft.workAddress.street).toBe("Dorpsstraat 12, Zeist");
  });

  it("asks for the missing height until the painter fills it in", () => {
    const draft = initialDraft(extraction, "");
    const before = calculateQuote({ ...draftToCalcInput(draft), settings: exampleSettings, vatConfig, quoteDate: QUOTE_DATE });
    expect(before.missingInfo.map((m) => m.field)).toEqual(["heightM"]);

    const filled = structuredClone(draft);
    filled.extraction.rooms[0].items[0].heightM = 2.5;
    const after = calculateQuote({ ...draftToCalcInput(filled), settings: exampleSettings, vatConfig, quoteDate: QUOTE_DATE });
    expect(after.complete).toBe(true);
    expect(after.lines[0].quantity).toBe(35); // 2 × (3 + 4) × 2,5
  });

  it("records every change as a separate edit", () => {
    const a = initialDraft(extraction, "Tekst");
    const b = structuredClone(a);
    b.extraction.rooms[0].items[0].heightM = 2.5;
    b.description = "Nieuwe tekst";
    b.overrides["x"] = 1000;
    b.extraLines.push({ room: null, description: "Extra", amountCents: 500, vatCategory: "labor" });
    expect(diffDrafts(a, b)).toEqual([
      { field: "extraction.rooms.0.items.0.heightM", before: null, after: 2.5 },
      { field: "overrides.x", before: null, after: 1000 },
      { field: "extraLines.0", before: null, after: { room: null, description: "Extra", amountCents: 500, vatCategory: "labor" } },
      { field: "description", before: "Tekst", after: "Nieuwe tekst" },
    ]);
    expect(diffDrafts(a, structuredClone(a))).toEqual([]);
  });

  it("rejects impossible values from the browser", () => {
    const draft = initialDraft(extraction, "");
    expect(QuoteDraftSchema.safeParse({ ...draft, overrides: { x: -5 } }).success).toBe(false);
    expect(QuoteDraftSchema.safeParse({ ...draft, overrides: { x: 10.5 } }).success).toBe(false);
  });
});
