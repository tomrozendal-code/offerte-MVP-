import "server-only";
// Demo mode for local testing without an API key (AI_PROVIDER=demo, never in production).
// It does NOT read the description: it always returns test case 1 from CLAUDE.md, and the app shows a DEMO banner.
import type { Extraction } from "./extraction";
import type { JobDescriber, JobStructurer } from "./types";

const DEMO_EXTRACTION: Extraction = {
  rooms: [
    {
      name: "Woonkamer",
      items: [
        { kind: "walls", lengthM: 4, widthM: 5, heightM: 2.6, areaM2: null, openings: [{ widthM: 1.5, heightM: 1.2, count: 2 }], coats: null, count: null, sides: null, cracks: false, crackLengthM: null, peeling: false },
        { kind: "ceiling", lengthM: 4, widthM: 5, heightM: null, areaM2: null, openings: [], coats: null, count: null, sides: null, cracks: true, crackLengthM: null, peeling: false },
      ],
    },
    {
      name: "Slaapkamer",
      items: [{ kind: "walls", lengthM: 3, widthM: 4, heightM: null, areaM2: null, openings: [], coats: null, count: null, sides: null, cracks: false, crackLengthM: null, peeling: false }],
    },
  ],
  vat: { usageType: "residential", dwellingOlderThanTwoYears: null, residentialSharePct: null },
  client: { name: "Demo-klant", address: "Voorbeeldstraat 1" },
  notUnderstood: ["oud behang in de gang verwijderen"],
};

const noCost = { provider: "demo", model: "demo", inputTokens: 0, outputTokens: 0, costMicrocents: 0 };

export const demoStructurer: JobStructurer = {
  async structure() {
    return { extraction: structuredClone(DEMO_EXTRACTION), usage: noCost };
  },
};

export const demoDescriber: JobDescriber = {
  async describe() {
    // Returning nothing makes the app use its plain template text.
    return { text: "", usage: noCost };
  },
};
