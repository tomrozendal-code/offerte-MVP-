import { describe, expect, it } from "vitest";
import { calculateQuote } from "@/lib/calc";
import { QUOTE_DATE, exampleSettings, oldHome, vatConfig } from "@/lib/calc/fixtures";
import { checkDescription, factsText, roomFacts, templateDescription } from "./description";
import { type Extraction, ExtractionSchema, toJob, toVatContext } from "./extraction";

const item = (over: Partial<Extraction["rooms"][number]["items"][number]>): Extraction["rooms"][number]["items"][number] => ({
  kind: "walls",
  lengthM: null,
  widthM: null,
  heightM: null,
  areaM2: null,
  openings: [],
  coats: null,
  count: null,
  sides: null,
  cracks: false,
  crackLengthM: null,
  peeling: false,
  ...over,
});

// What the AI should return for test case 1 of CLAUDE.md.
const case1: Extraction = {
  rooms: [
    {
      name: "Woonkamer",
      items: [
        item({ kind: "walls", lengthM: 4, widthM: 5, heightM: 2.6, openings: [{ widthM: 1.5, heightM: 1.2, count: 2 }] }),
        item({ kind: "ceiling", lengthM: 4, widthM: 5, cracks: true }),
      ],
    },
  ],
  vat: { usageType: "residential", dwellingOlderThanTwoYears: true, residentialSharePct: null },
  client: { name: null, address: null },
  notUnderstood: [],
};

describe("toJob", () => {
  it("turns the AI format into the calculation module's job, with the CLAUDE.md result", () => {
    expect(ExtractionSchema.safeParse(case1).success).toBe(true);
    const r = calculateQuote({ job: toJob(case1), settings: exampleSettings, vat: toVatContext(case1), vatConfig, quoteDate: QUOTE_DATE });
    expect(r.lines[0].quantity).toBe(43.2);
    expect(r.subtotalCents).toBe(74620);
    expect(r.complete).toBe(true);
  });

  it("keeps missing values missing, so the app asks instead of guessing", () => {
    const job = toJob({ ...case1, rooms: [{ name: "Slaapkamer", items: [item({ lengthM: 3, widthM: 4 })] }] });
    const r = calculateQuote({ job, settings: exampleSettings, vat: oldHome, vatConfig, quoteDate: QUOTE_DATE });
    expect(r.missingInfo.map((m) => m.field)).toEqual(["heightM"]);
  });

  it("uses a neutral name when the room name is empty", () => {
    expect(toJob({ ...case1, rooms: [{ name: " ", items: [] }] }).rooms[0].name).toBe("Ruimte");
  });
});

describe("work description (test case 10)", () => {
  const job = toJob(case1);
  const calc = calculateQuote({ job, settings: exampleSettings, vat: oldHome, vatConfig, quoteDate: QUOTE_DATE });
  const rooms = roomFacts(job, calc, ["Muurverf"]);

  it("gives the AI only facts, no amounts", () => {
    const text = factsText(rooms);
    expect(text).toContain("muren sauzen (43,2 m²), 2 lagen");
    expect(text).toContain("plafond sauzen (20 m²), 2 lagen");
    expect(text).toContain("scheuren in het plafond repareren");
    expect(text).not.toMatch(/€|\buur\b/);
  });

  it("accepts a text with only the allowed numbers", () => {
    const good =
      "Woonkamer: Wij maken de muren (43,2 m²) en het plafond (20 m²) eerst schoon en schuren ze, repareren de scheuren in het plafond en brengen twee lagen Muurverf aan.";
    expect(checkDescription(good, rooms[0].numbers)).toEqual({ ok: true });
  });

  it("rejects euro amounts, hours and invented quantities", () => {
    expect(checkDescription("Woonkamer: muren sauzen voor € 216.", rooms[0].numbers).ok).toBe(false);
    expect(checkDescription("Woonkamer: dit kost ongeveer 5 uur werk.", rooms[0].numbers).ok).toBe(false);
    expect(checkDescription("Woonkamer: wij sauzen 46,8 m² muur.", rooms[0].numbers).ok).toBe(false);
    expect(checkDescription("Woonkamer: wij gebruiken 16 liter verf.", rooms[0].numbers).ok).toBe(false);
    expect(checkDescription("Woonkamer: klaar binnen 3 dagen, met garantie.", rooms[0].numbers).ok).toBe(false);
  });

  it("has a plain template as fallback that passes its own check", () => {
    const text = templateDescription(rooms);
    expect(text).toMatch(/^Woonkamer: wij gaan muren sauzen \(43,2 m²\), 2 lagen/);
    expect(checkDescription(text, rooms[0].numbers, ["Muurverf"])).toEqual({ ok: true });
  });
});

describe("summary for the painter", () => {
  it("says plainly what was understood and what is missing", async () => {
    const { summarizeItem, summarizeVat } = await import("./summary");
    expect(summarizeItem(case1.rooms[0].items[0])).toBe("Muren sauzen · 4 m × 5 m · 2,6 m hoog · 2 ramen/deuren eraf · lagen: standaard");
    expect(summarizeItem(item({ kind: "walls", lengthM: 3, widthM: 4 }))).toBe("Muren sauzen · 3 m × 4 m · hoogte ontbreekt · lagen: standaard");
    expect(summarizeItem(item({ kind: "doors", count: 4, sides: 2, peeling: true }))).toBe("Deuren lakken · 4 stuks · twee kanten · verf bladdert");
    expect(summarizeVat(case1.vat)).toBe("Woning, 2 jaar of ouder");
    expect(summarizeVat({ usageType: "mixed", dwellingOlderThanTwoYears: true, residentialSharePct: 70 })).toBe("Gemengd gebruik, 70% wonen, 2 jaar of ouder");
    expect(summarizeVat({ usageType: null, dwellingOlderThanTwoYears: null, residentialSharePct: null })).toBe("Niet genoemd");
  });
});
