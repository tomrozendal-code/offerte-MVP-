import { describe, expect, it } from "vitest";
import { CASES } from "./cases";
import { compareExtraction } from "./compare";
import { ExtractionSchema } from "../src/lib/ai/extraction";

describe("eval cases", () => {
  it("has at least ten valid cases", () => {
    expect(CASES.length).toBeGreaterThanOrEqual(10);
    for (const c of CASES) expect(ExtractionSchema.safeParse(c.expected).success, c.id).toBe(true);
  });

  it("a perfect answer has no differences", () => {
    for (const c of CASES) expect(compareExtraction(c.expected, structuredClone(c.expected))).toEqual([]);
  });

  it("flags an invented height", () => {
    const c = CASES.find((x) => x.id === "04-ontbrekende-hoogte")!;
    const actual = structuredClone(c.expected);
    actual.rooms[0].items[0].heightM = 2.6;
    expect(compareExtraction(c.expected, actual)).toEqual(["Slaapkamer/walls.heightM: verwacht null, kreeg 2.6 (verzonnen!)"]);
  });

  it("flags a wrong number, a missing opening and a wrong VAT answer", () => {
    const c = CASES[0];
    const actual = structuredClone(c.expected);
    actual.rooms[0].items[0].heightM = 2.06;
    actual.rooms[0].items[0].openings = [{ widthM: 1.5, heightM: 1.2, count: 1 }];
    actual.vat.dwellingOlderThanTwoYears = null;
    expect(compareExtraction(c.expected, actual)).toHaveLength(3);
  });

  it("accepts openings split differently and items in another order", () => {
    const c = CASES[0];
    const actual = structuredClone(c.expected);
    actual.rooms[0].items.reverse();
    const walls = actual.rooms[0].items.find((i) => i.kind === "walls")!;
    walls.openings = [
      { widthM: 1.5, heightM: 1.2, count: 1 },
      { widthM: 1.5, heightM: 1.2, count: 1 },
    ];
    expect(compareExtraction(c.expected, actual)).toEqual([]);
  });

  it("requires something in 'not understood' when part of the job cannot be processed", () => {
    const c = CASES.find((x) => x.id === "09-niet-te-verwerken")!;
    const actual = structuredClone(c.expected);
    actual.notUnderstood = [];
    expect(compareExtraction(c.expected, actual)).toHaveLength(1);
  });
});
