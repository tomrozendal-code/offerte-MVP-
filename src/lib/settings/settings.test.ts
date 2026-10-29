import { describe, expect, it } from "vitest";
import { calculateQuote } from "@/lib/calc";
import { QUOTE_DATE, oldHome, vatConfig } from "@/lib/calc/fixtures";
import { NORM_KEYS, NORM_UNITS } from "@/lib/calc/norms";
import { companySchema, fieldErrors, followUpSchema, materialSchema, parseNorms, ratesSchema } from "./schemas";
import { STARTER_MATERIALS } from "./starterMaterials";
import { type ProfileRow, toCalcSettings } from "./toCalcSettings";

const company = {
  companyName: "Schildersbedrijf De Kwast",
  street: "Kerkstraat 1",
  postalCode: "3511ab",
  city: "Utrecht",
  email: "info@dekwast.nl",
  phone: "06 12345678",
  kvkNumber: "12345678",
  vatNumber: "nl123456789b01",
  iban: "nl91 abna 0417 1643 00",
  quoteValidityDays: "30",
  termsText: "",
};

describe("company form", () => {
  it("cleans up valid input", () => {
    const r = companySchema.parse(company);
    expect(r.postalCode).toBe("3511 AB");
    expect(r.vatNumber).toBe("NL123456789B01");
    expect(r.iban).toBe("NL91ABNA0417164300");
    expect(r.termsText).toBeNull();
    expect(r.quoteValidityDays).toBe(30);
  });

  it("gives a Dutch message per wrong field", () => {
    const r = companySchema.safeParse({ ...company, companyName: " ", iban: "NL00 ABNA 0000 0000 00", kvkNumber: "123" });
    expect(r.success).toBe(false);
    expect(fieldErrors(r.error!)).toEqual({
      companyName: "Vul je bedrijfsnaam in.",
      iban: "Dit IBAN klopt niet. Controleer de cijfers.",
      kvkNumber: "Een KVK-nummer heeft 8 cijfers.",
    });
  });

  it("allows optional fields to be empty", () => {
    const r = companySchema.parse({ ...company, kvkNumber: "", vatNumber: "", iban: "", email: "", phone: "", postalCode: "" });
    expect(r.kvkNumber).toBeNull();
    expect(r.postalCode).toBeNull();
  });
});

describe("rates form", () => {
  it("converts to cents and basis points", () => {
    expect(ratesSchema.parse({ hourlyRate: "45", materialMarkup: "15", travelCost: "25", minimumAmount: "", defaultCoats: "2" })).toEqual({
      hourlyRate: 4500,
      materialMarkup: 1500,
      travelCost: 2500,
      minimumAmount: 0,
      defaultCoats: 2,
    });
  });

  it("requires an hourly rate", () => {
    const r = ratesSchema.safeParse({ hourlyRate: "", materialMarkup: "", travelCost: "", minimumAmount: "", defaultCoats: "2" });
    expect(fieldErrors(r.error!)).toEqual({ hourlyRate: "Vul je uurtarief in." });
  });

  it("rejects text where a number is needed", () => {
    const r = ratesSchema.safeParse({ hourlyRate: "veertig", materialMarkup: "200", travelCost: "-5", minimumAmount: "", defaultCoats: "0" });
    expect(Object.keys(fieldErrors(r.error!)).sort()).toEqual(["defaultCoats", "hourlyRate", "materialMarkup", "travelCost"]);
  });
});

describe("norms form", () => {
  it("reads values and units, and treats empty as not set", () => {
    const r = parseNorms({ "wall_paint.value": "18", "wall_paint.unit": "m2_per_hour_per_coat", "door_paint.value": "0,75", "door_paint.unit": "hours_per_piece_per_side" });
    expect(r.errors).toEqual({});
    expect(r.norms).toEqual([
      { workType: "wall_paint", unit: "m2_per_hour_per_coat", value: 18 },
      { workType: "door_paint", unit: "hours_per_piece_per_side", value: 0.75 },
    ]);
    expect(r.cleared).toHaveLength(NORM_KEYS.length - 2);
  });

  it("rejects zero and impossible units", () => {
    const r = parseNorms({ "wall_paint.value": "0", "door_paint.value": "1", "door_paint.unit": "minutes_per_m2" });
    expect(Object.keys(r.errors)).toEqual(["wall_paint.value", "door_paint.value"]);
  });
});

describe("material form", () => {
  it("parses a material", () => {
    expect(
      materialSchema.parse({ name: "Muurverf", unit: "liter", packageSize: "10", purchasePrice: "60", coverage: "8", workTypes: ["wall_paint"] }),
    ).toEqual({ name: "Muurverf", unit: "liter", packageSize: 10, purchasePrice: 6000, coverage: 8, workTypes: ["wall_paint"] });
  });

  it("allows materials without coverage (tape, kit)", () => {
    expect(materialSchema.parse({ name: "Tape", unit: "rol", packageSize: "1", purchasePrice: "4,50", coverage: "", workTypes: [] }).coverage).toBeNull();
  });
});

describe("follow-up form", () => {
  const base = { notifyPush: "on", remindersEnabled: "on", firstReminderDay: "3", secondReminderDay: "7", reminderHour: "9", reminderText: "" };

  it("parses checkboxes and days", () => {
    expect(followUpSchema.parse(base)).toEqual({
      notifyPush: true,
      notifyEmail: false,
      remindersEnabled: true,
      firstReminderDay: 3,
      secondReminderDay: 7,
      reminderHour: 9,
      reminderText: null,
    });
  });

  it("requires the second reminder to be later than the first", () => {
    const r = followUpSchema.safeParse({ ...base, secondReminderDay: "2" });
    expect(fieldErrors(r.error!)).toEqual({ secondReminderDay: "De tweede herinnering moet later zijn dan de eerste." });
  });

  it("allows a single reminder", () => {
    expect(followUpSchema.parse({ ...base, secondReminderDay: "" }).secondReminderDay).toBeNull();
  });
});

describe("starter materials", () => {
  it("has 30–50 products, all with valid values", () => {
    expect(STARTER_MATERIALS.length).toBeGreaterThanOrEqual(30);
    expect(STARTER_MATERIALS.length).toBeLessThanOrEqual(50);
    for (const m of STARTER_MATERIALS) {
      expect(m.packageSize).toBeGreaterThan(0);
      expect(m.purchasePriceCents).toBeGreaterThan(0);
      expect(Number.isInteger(m.purchasePriceCents)).toBe(true);
    }
    expect(new Set(STARTER_MATERIALS.map((m) => m.name)).size).toBe(STARTER_MATERIALS.length);
  });
});

describe("toCalcSettings", () => {
  const profile: ProfileRow = {
    company_name: "De Kwast",
    street: null,
    postal_code: null,
    city: null,
    email: null,
    phone: null,
    kvk_number: null,
    vat_number: null,
    iban: null,
    logo_path: null,
    quote_validity_days: 30,
    terms_text: null,
    hourly_rate_cents: 4500,
    material_markup_bp: 1500,
    travel_cost_cents: 2500,
    minimum_amount_cents: 0,
    default_coats: 2,
    material_vat_mode: "follow_labor",
    delete_audio_after_processing: true,
    notify_push: true,
    notify_email: true,
    reminders_enabled: true,
    reminder_days: [3, 7],
    reminder_hour: 9,
    reminder_text: null,
  };

  it("feeds the calculation module with the same result as the CLAUDE.md example", () => {
    // Numeric columns come back from Postgres as strings.
    const settings = toCalcSettings(
      profile,
      [
        { work_type: "wall_paint", unit: "m2_per_hour_per_coat", value: "18.000" },
        { work_type: "ceiling_paint", unit: "m2_per_hour_per_coat", value: "12.000" },
        { work_type: "preparation", unit: "minutes_per_m2", value: "3.000" },
        { work_type: "crack_repair", unit: "minutes_per_m2", value: "5.000" },
      ],
      [
        {
          id: "m1",
          name: "Muurverf",
          unit: "liter",
          package_size: "10.000",
          purchase_price_cents: 6000,
          coverage_m2_per_unit_per_coat: "8.000",
          work_types: ["wall_paint", "ceiling_paint"],
          is_example_price: false,
        },
      ],
    );
    const r = calculateQuote({
      job: {
        rooms: [
          {
            name: "Woonkamer",
            items: [
              { kind: "walls", lengthM: 4, widthM: 5, heightM: 2.6, openings: [{ widthM: 1.5, heightM: 1.2, count: 2 }] },
              { kind: "ceiling", lengthM: 4, widthM: 5, condition: { cracks: true } },
            ],
          },
        ],
      },
      settings,
      vat: oldHome,
      vatConfig,
      quoteDate: QUOTE_DATE,
    });
    expect(r.subtotalCents).toBe(74620);
    expect(r.complete).toBe(true);
  });

  it("uses 0 for a missing hourly rate, so the calculation asks for it", () => {
    expect(toCalcSettings({ ...profile, hourly_rate_cents: null }, [], []).hourlyRateCents).toBe(0);
  });

  it("covers every norm unit in the settings screen", () => {
    for (const key of NORM_KEYS) expect(NORM_UNITS[key].length).toBeGreaterThan(0);
  });
});
