import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { calculateQuote } from "@/lib/calc";
import { QUOTE_DATE, exampleSettings, vatConfig } from "@/lib/calc/fixtures";
import { initialDraft, draftToCalcInput } from "@/lib/quotes/draft";
import type { ProfileRow } from "@/lib/settings/toCalcSettings";
import { QuotePdf } from "./QuotePdf";

const profile = {
  company_name: "Schildersbedrijf De Kwast",
  street: "Kerkstraat 1",
  postal_code: "3511 AB",
  city: "Utrecht",
  email: "info@dekwast.nl",
  phone: "06 12345678",
  kvk_number: "12345678",
  vat_number: "NL123456789B01",
  iban: "NL91ABNA0417164300",
  terms_text: "Betaling binnen 14 dagen na oplevering.",
} as ProfileRow;

describe("quote PDF", () => {
  it("renders a valid PDF for test case 1", async () => {
    const draft = initialDraft(
      {
        rooms: [
          {
            name: "Woonkamer",
            items: [
              { kind: "walls", lengthM: 4, widthM: 5, heightM: 2.6, areaM2: null, openings: [{ widthM: 1.5, heightM: 1.2, count: 2 }], coats: null, count: null, sides: null, cracks: false, crackLengthM: null, peeling: false },
              { kind: "ceiling", lengthM: 4, widthM: 5, heightM: null, areaM2: null, openings: [], coats: null, count: null, sides: null, cracks: true, crackLengthM: null, peeling: false },
            ],
          },
        ],
        vat: { usageType: "residential", dwellingOlderThanTwoYears: true, residentialSharePct: null },
        client: { name: "Fam. de Vries", address: "Dorpsstraat 12" },
        notUnderstood: [],
      },
      "Woonkamer: wij sauzen de muren en het plafond in twee lagen.",
    );
    const calculation = calculateQuote({ ...draftToCalcInput(draft), settings: exampleSettings, vatConfig, quoteDate: QUOTE_DATE });
    const pdf = await renderToBuffer(QuotePdf({ profile, draft, calculation, quoteNumber: "2026-0001", date: QUOTE_DATE, validUntil: "2026-11-28" }));
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(2000);
    // PDF_OUT=/pad/offerte.pdf npm test -- pdf   writes the file, to look at the layout.
    if (process.env.PDF_OUT) (await import("node:fs")).writeFileSync(process.env.PDF_OUT, pdf);
  }, 20000);
});
