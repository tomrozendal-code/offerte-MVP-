// The editable version of a quote. It is stored as JSON and always recalculated by the code;
// totals sent from the browser are never trusted.
import { z } from "zod";
import { ExtractionSchema, type Extraction, toJob, toVatContext } from "@/lib/ai/extraction";
import type { Adjustments, Job, VatContext } from "@/lib/calc/types";

const text = (max: number) => z.string().max(max);

export const ExtraLineSchema = z.object({
  room: z.string().max(100).nullable(),
  description: z.string().trim().min(1).max(200),
  amountCents: z.number().int().min(-10_000_000).max(10_000_000),
  vatCategory: z.enum(["labor", "material"]),
});

export const QuoteDraftSchema = z.object({
  extraction: ExtractionSchema,
  client: z.object({ name: text(200), email: text(200), phone: text(50) }),
  workAddress: z.object({ street: text(200), postalCode: text(20), city: text(100) }),
  overrides: z.record(z.string().max(300), z.number().int().min(0).max(10_000_000)),
  extraLines: z.array(ExtraLineSchema).max(50),
  description: text(5000),
});

export type QuoteDraft = z.infer<typeof QuoteDraftSchema>;

/** First version of the draft, straight from the AI's proposal. */
export function initialDraft(extraction: Extraction, description: string): QuoteDraft {
  return {
    extraction,
    client: { name: extraction.client.name ?? "", email: "", phone: "" },
    workAddress: { street: extraction.client.address ?? "", postalCode: "", city: "" },
    overrides: {},
    extraLines: [],
    description,
  };
}

export function draftToCalcInput(draft: QuoteDraft): { job: Job; vat: VatContext; adjustments: Adjustments } {
  return { job: toJob(draft.extraction), vat: toVatContext(draft.extraction), adjustments: { overrides: draft.overrides, extraLines: draft.extraLines } };
}

export type Change = { field: string; before: unknown; after: unknown };

/** Every changed value between two versions, with a readable path (e.g. "extraction.rooms.0.items.0.heightM"). */
export function diffDrafts(before: unknown, after: unknown, path = ""): Change[] {
  if (Object.is(before, after)) return [];
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
  if (isObj(before) && isObj(after) && Array.isArray(before) === Array.isArray(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].flatMap((k) => diffDrafts(before[k], after[k], path ? `${path}.${k}` : k));
  }
  return [{ field: path, before: before ?? null, after: after ?? null }];
}
