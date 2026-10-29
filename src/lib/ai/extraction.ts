// The fixed format the AI fills in from what the painter said (CLAUDE.md 4.4).
// The AI only writes down what was said: every number it was not told is null. It never calculates.
import { z } from "zod";
import type { JobItem, Job, VatContext } from "@/lib/calc/types";

const num = z.number().nullable();

/** One opening (window or door) in a wall. */
const OpeningSchema = z.object({
  widthM: num.describe("Breedte in meter, alleen als genoemd"),
  heightM: num.describe("Hoogte in meter, alleen als genoemd"),
  count: z.number().int().describe("Aantal van deze openingen (1 als niet genoemd)"),
});

/**
 * Flat item shape (one object for every kind, unused fields null). A flat shape is easier for the
 * model to fill in reliably than a union; `toJob` turns it into the calculation module's types.
 */
const ItemSchema = z.object({
  kind: z.enum(["walls", "ceiling", "doors", "frames", "skirting"]),
  lengthM: num.describe("Lengte van de ruimte/plafond in meter; bij kozijnen of plinten: strekkende meter"),
  widthM: num.describe("Breedte van de ruimte/plafond in meter"),
  heightM: num.describe("Hoogte van de muren in meter"),
  areaM2: num.describe("Oppervlakte in m², alleen als de vakman die zelf noemt"),
  openings: z.array(OpeningSchema).describe("Ramen en deuren in de muren die zijn genoemd"),
  coats: z.number().int().nullable().describe("Aantal lagen, alleen als genoemd"),
  count: z.number().int().nullable().describe("Aantal deuren of kozijnen"),
  sides: z.number().int().nullable().describe("Aantal kanten (1 of 2) bij deuren"),
  cracks: z.boolean().describe("Er zijn scheuren genoemd die gerepareerd moeten worden"),
  crackLengthM: num.describe("Lengte van de scheuren in meter, alleen als genoemd"),
  peeling: z.boolean().describe("Er is bladderende of loszittende verf genoemd"),
});

export const ExtractionSchema = z.object({
  rooms: z.array(
    z.object({
      name: z.string().describe("Naam van de ruimte, bijvoorbeeld 'Woonkamer'. 'Ruimte 1' als er geen naam is genoemd"),
      items: z.array(ItemSchema),
    }),
  ),
  vat: z.object({
    usageType: z.enum(["residential", "mixed", "non_residential"]).nullable(),
    dwellingOlderThanTwoYears: z.boolean().nullable(),
    residentialSharePct: z.number().int().nullable(),
  }),
  client: z.object({
    name: z.string().nullable(),
    address: z.string().nullable(),
  }),
  /** Parts of the description the app cannot calculate (e.g. wallpaper removal); shown to the painter, never dropped silently. */
  notUnderstood: z.array(z.string()),
});

export type Extraction = z.infer<typeof ExtractionSchema>;
type ExtractedItem = Extraction["rooms"][number]["items"][number];

/** Converts the AI's flat format into the calculation module's job. Only copies what was said. */
export function toJob(extraction: Extraction): Job {
  return {
    rooms: extraction.rooms.map((room) => ({
      name: room.name.trim() || "Ruimte",
      items: room.items.map(toItem),
    })),
  };
}

function toItem(i: ExtractedItem): JobItem {
  const condition = { cracks: i.cracks, crackLengthM: i.crackLengthM, peeling: i.peeling };
  switch (i.kind) {
    case "walls":
      return {
        kind: "walls",
        lengthM: i.lengthM,
        widthM: i.widthM,
        heightM: i.heightM,
        areaM2: i.areaM2,
        openings: i.openings.map((o) => ({ widthM: o.widthM, heightM: o.heightM, count: o.count })),
        coats: i.coats,
        condition,
      };
    case "ceiling":
      return { kind: "ceiling", lengthM: i.lengthM, widthM: i.widthM, areaM2: i.areaM2, coats: i.coats, condition };
    case "doors":
      return { kind: "doors", count: i.count, sides: i.sides, condition };
    case "frames":
      return { kind: "frames", count: i.count, lengthM: i.lengthM };
    case "skirting":
      return { kind: "skirting", lengthM: i.lengthM };
  }
}

export function toVatContext(extraction: Extraction): VatContext {
  return { ...extraction.vat };
}
