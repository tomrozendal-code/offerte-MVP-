// Validation of the settings forms (zod). Input is what the painter typed, as text;
// output is clean data for the database. All messages are in plain Dutch.
import { z } from "zod";
import { NORM_KEYS, NORM_UNITS } from "@/lib/calc/norms";
import type { NormKey, NormUnit } from "@/lib/calc/types";
import {
  isValidDutchVatNumber,
  isValidIban,
  isValidKvk,
  normalizeIban,
  normalizePostalCode,
  parseDutchNumber,
  parseEuroToCents,
  parsePercentToBp,
} from "./parse";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximaal ${max} tekens.`)
    .transform((s) => (s === "" ? null : s));

const requiredText = (max: number, message: string) => z.string().trim().min(1, message).max(max, `Maximaal ${max} tekens.`);

/** Optional text field that must pass a check when filled in. */
const checkedText = (check: (s: string) => boolean, message: string, normalize: (s: string) => string = (s) => s) =>
  z
    .string()
    .trim()
    .refine((s) => s === "" || check(s), message)
    .transform((s) => (s === "" ? null : normalize(s)));

const euro = (opts: { min?: number; required: boolean; label: string }) =>
  z.string().transform((s, ctx) => {
    if (s.trim() === "") {
      if (opts.required) ctx.addIssue({ code: "custom", message: `Vul ${opts.label} in.` });
      return opts.required ? z.NEVER : 0;
    }
    const cents = parseEuroToCents(s);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Vul een bedrag in, bijvoorbeeld 45,50." });
      return z.NEVER;
    }
    if (cents < (opts.min ?? 0)) {
      ctx.addIssue({ code: "custom", message: opts.min ? `Moet meer dan € 0 zijn.` : "Mag niet negatief zijn." });
      return z.NEVER;
    }
    return cents;
  });

const integer = (min: number, max: number, message: string) =>
  z.string().transform((s, ctx) => {
    const n = parseDutchNumber(s, 0);
    if (n === null || !Number.isInteger(n) || n < min || n > max) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return n;
  });

const positiveDecimal = (message: string) =>
  z.string().transform((s, ctx) => {
    const n = parseDutchNumber(s, 3);
    if (n === null || !(n > 0)) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return n;
  });

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");

export const companySchema = z.object({
  companyName: requiredText(200, "Vul je bedrijfsnaam in."),
  street: text(200),
  postalCode: z
    .string()
    .trim()
    .refine((s) => s === "" || normalizePostalCode(s) !== null, "Vul een postcode in zoals 1234 AB.")
    .transform((s) => (s === "" ? null : normalizePostalCode(s))),
  city: text(100),
  email: checkedText((s) => z.email().safeParse(s).success, "Vul een geldig e-mailadres in."),
  phone: checkedText((s) => /^\+?[\d\s-]{8,20}$/.test(s), "Vul een geldig telefoonnummer in."),
  kvkNumber: checkedText(isValidKvk, "Een KVK-nummer heeft 8 cijfers.", (s) => s.replace(/\s/g, "")),
  vatNumber: checkedText(isValidDutchVatNumber, "Vul je btw-id in zoals NL123456789B01.", (s) => s.replace(/[\s.]/g, "").toUpperCase()),
  iban: checkedText(isValidIban, "Dit IBAN klopt niet. Controleer de cijfers.", normalizeIban),
  quoteValidityDays: integer(1, 365, "Vul een aantal dagen in tussen 1 en 365."),
  termsText: text(5000),
});

export const ratesSchema = z.object({
  hourlyRate: euro({ min: 1, required: true, label: "je uurtarief" }),
  materialMarkup: z.string().transform((s, ctx) => {
    if (s.trim() === "") return 0;
    const bp = parsePercentToBp(s);
    if (bp === null || bp < 0 || bp > 10000) {
      ctx.addIssue({ code: "custom", message: "Vul een percentage in tussen 0 en 100." });
      return z.NEVER;
    }
    return bp;
  }),
  travelCost: euro({ required: false, label: "voorrijkosten" }),
  minimumAmount: euro({ required: false, label: "een minimumbedrag" }),
  defaultCoats: integer(1, 10, "Vul een aantal lagen in tussen 1 en 10."),
});

export type NormInput = { workType: NormKey; unit: NormUnit; value: number };

/** Norms form: per work type a value (empty = not set) and a unit. */
export function parseNorms(form: Record<string, string>): { norms: NormInput[]; cleared: NormKey[]; errors: Record<string, string> } {
  const norms: NormInput[] = [];
  const cleared: NormKey[] = [];
  const errors: Record<string, string> = {};
  for (const key of NORM_KEYS) {
    const raw = (form[`${key}.value`] ?? "").trim();
    const unit = (form[`${key}.unit`] ?? NORM_UNITS[key][0]) as NormUnit;
    if (raw === "") {
      cleared.push(key);
      continue;
    }
    const value = parseDutchNumber(raw, 3);
    if (value === null || !(value > 0)) {
      errors[`${key}.value`] = "Vul een getal groter dan 0 in, bijvoorbeeld 0,75.";
      continue;
    }
    if (!NORM_UNITS[key].includes(unit)) {
      errors[`${key}.value`] = "Kies een geldige eenheid.";
      continue;
    }
    norms.push({ workType: key, unit, value });
  }
  return { norms, cleared, errors };
}

export const materialSchema = z.object({
  name: requiredText(200, "Vul een naam in."),
  unit: z.enum(["liter", "kg", "stuk", "rol"], { message: "Kies een eenheid." }),
  packageSize: positiveDecimal("Vul de inhoud van een verpakking in, bijvoorbeeld 10."),
  purchasePrice: euro({ required: true, label: "de inkoopprijs" }),
  coverage: z.string().transform((s, ctx) => {
    if (s.trim() === "") return null;
    const n = parseDutchNumber(s, 3);
    if (n === null || !(n > 0)) {
      ctx.addIssue({ code: "custom", message: "Vul het verbruik in als getal, bijvoorbeeld 8." });
      return z.NEVER;
    }
    return n;
  }),
  workTypes: z.array(z.enum(NORM_KEYS as [NormKey, ...NormKey[]])),
});

export const vatSchema = z.object({
  materialVatMode: z.enum(["follow_labor", "always_standard"], { message: "Kies een van de twee mogelijkheden." }),
});

export const followUpSchema = z
  .object({
    notifyPush: checkbox,
    notifyEmail: checkbox,
    remindersEnabled: checkbox,
    firstReminderDay: integer(1, 60, "Vul een aantal dagen in tussen 1 en 60."),
    secondReminderDay: z.string().transform((s, ctx) => {
      if (s.trim() === "") return null;
      const n = parseDutchNumber(s, 0);
      if (n === null || !Number.isInteger(n) || n < 1 || n > 60) {
        ctx.addIssue({ code: "custom", message: "Vul een aantal dagen in tussen 1 en 60, of laat leeg." });
        return z.NEVER;
      }
      return n;
    }),
    reminderHour: integer(7, 20, "Kies een tijd tussen 7:00 en 20:00."),
    reminderText: text(2000),
  })
  .refine((v) => v.secondReminderDay === null || v.secondReminderDay > v.firstReminderDay, {
    message: "De tweede herinnering moet later zijn dan de eerste.",
    path: ["secondReminderDay"],
  });

/** Turns zod issues into { field: message } for the form. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}
