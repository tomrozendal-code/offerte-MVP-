import "server-only";
import { calculateQuote } from "@/lib/calc";
import type { CalcSettings, QuoteCalculation, VatConfig } from "@/lib/calc/types";
import type { Extraction } from "@/lib/ai/extraction";
import { requireUser } from "@/lib/auth/user";
import { loadMaterials, loadNorms, loadProfile } from "@/lib/settings/data";
import { toCalcSettings } from "@/lib/settings/toCalcSettings";
import { loadVatConfig } from "@/lib/settings/vatConfig";
import { type QuoteDraft, QuoteDraftSchema, diffDrafts, draftToCalcInput, initialDraft } from "./draft";
import { z } from "zod";

export type QuoteStatus = "draft" | "sent" | "viewed" | "reminded" | "accepted" | "rejected" | "expired";

export type QuoteRow = {
  id: string;
  quote_number: string;
  status: QuoteStatus;
  draft: QuoteDraft;
  calculation: QuoteCalculation | null;
  subtotal_cents: number | null;
  total_cents: number | null;
  valid_until: string | null;
  created_at: string;
  sent_at: string | null;
  share_token: string | null;
};

export type QuoteListItem = Pick<QuoteRow, "id" | "quote_number" | "status" | "total_cents" | "created_at"> & {
  client_name: string | null;
  work_street: string | null;
  work_city: string | null;
};

/** Today's date in the Netherlands (yyyy-mm-dd): decides which VAT rates apply. */
export function todayInNL(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(now);
}

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Everything the calculation needs from the database, loaded once per request. */
export async function loadCalcContext(): Promise<{ settings: CalcSettings; vatConfig: VatConfig; validityDays: number }> {
  const [profile, norms, materials, vatConfig] = await Promise.all([loadProfile(), loadNorms(), loadMaterials(), loadVatConfig()]);
  return { settings: toCalcSettings(profile, norms, materials), vatConfig, validityDays: profile.quote_validity_days };
}

export function calculateDraft(draft: QuoteDraft, ctx: { settings: CalcSettings; vatConfig: VatConfig }, quoteDate: string): QuoteCalculation {
  return calculateQuote({ ...draftToCalcInput(draft), settings: ctx.settings, vatConfig: ctx.vatConfig, quoteDate });
}

/** Columns derived from the draft and its calculation; written on every save. */
function derivedColumns(draft: QuoteDraft, calculation: QuoteCalculation) {
  const vat = draft.extraction.vat;
  return {
    draft,
    calculation,
    subtotal_cents: calculation.subtotalCents,
    vat_cents: calculation.vatCents,
    total_cents: calculation.totalCents,
    work_description: draft.description,
    client_name: draft.client.name || null,
    client_email: draft.client.email || null,
    client_phone: draft.client.phone || null,
    work_street: draft.workAddress.street || null,
    work_postal_code: draft.workAddress.postalCode || null,
    work_city: draft.workAddress.city || null,
    usage_type: vat.usageType,
    dwelling_older_than_two_years: vat.dwellingOlderThanTwoYears,
    residential_share_pct: vat.residentialSharePct,
  };
}

/** Quote lines as rows. VAT is stored per line for reference; the calculation JSON holds the exact split. */
function lineRows(quoteId: string, userId: string, calculation: QuoteCalculation) {
  const mainRate = (category: "labor" | "material") => {
    const v = calculation.vat;
    if (!v || v.length === 0) return 0;
    return category === "material" && v.length > 1 ? v[v.length - 1].rateBp : v[0].rateBp;
  };
  return calculation.lines.map((l, i) => ({
    quote_id: quoteId,
    user_id: userId,
    room: l.room,
    kind: l.kind,
    description: l.description,
    quantity: l.quantity,
    unit: l.unit,
    amount_cents: l.amountCents,
    vat_rate_bp: mainRate(l.vatCategory),
    explanation: l.explanation.join("\n"),
    source: l.kind === "other" || l.calculatedAmountCents !== undefined ? "manual" : "calculated",
    sort_order: i,
  }));
}

async function nextQuoteNumber(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], year: string) {
  const { count } = await supabase.from("quotes").select("id", { count: "exact", head: true }).like("quote_number", `${year}-%`);
  return `${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

/** Saves the AI's proposal as a new draft quote and returns its id. */
export async function createQuote(input: { inputText: string; extraction: Extraction; description: string; startedAt: Date | null }): Promise<string> {
  const { supabase, user } = await requireUser();
  const ctx = await loadCalcContext();
  const today = todayInNL();
  const draft = initialDraft(input.extraction, input.description);
  const calculation = calculateDraft(draft, ctx, today);

  let id: string | null = null;
  for (let attempt = 0; attempt < 3 && !id; attempt++) {
    const quoteNumber = await nextQuoteNumber(supabase, today.slice(0, 4));
    const { data, error } = await supabase
      .from("quotes")
      .insert({
        user_id: user.id,
        quote_number: quoteNumber,
        status: "draft",
        input_text: input.inputText,
        ai_result: input.extraction,
        valid_until: addDays(today, ctx.validityDays),
        ...derivedColumns(draft, calculation),
      })
      .select("id")
      .single();
    if (!error) id = data.id;
    else if (error.code !== "23505") throw error; // 23505: number taken at the same moment, try the next one
  }
  if (!id) throw new Error("Could not create a quote number");

  await supabase.from("quote_lines").insert(lineRows(id, user.id, calculation));
  await supabase.from("quote_metrics").insert({
    quote_id: id,
    user_id: user.id,
    started_at: (input.startedAt ?? new Date()).toISOString(),
    first_ai_result_at: new Date().toISOString(),
  });
  return id;
}

export async function loadQuote(id: string): Promise<QuoteRow | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, quote_number, status, draft, calculation, subtotal_cents, total_cents, valid_until, created_at, sent_at, share_token")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as QuoteRow | null;
}

export async function listQuotes(): Promise<QuoteListItem[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, quote_number, status, total_cents, created_at, client_name, work_street, work_city")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data as QuoteListItem[];
}

export type SaveResult = { ok: true; calculation: QuoteCalculation } | { ok: false; message: string };

/** Validates the painter's version, recalculates it on the server, saves it and records every change. */
export async function saveQuoteDraft(id: string, input: unknown): Promise<SaveResult> {
  const parsed = QuoteDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Een of meer velden kloppen niet. Controleer je invoer." };
  const draft = parsed.data;

  const quote = await loadQuote(id);
  if (!quote) return { ok: false, message: "Deze offerte bestaat niet (meer)." };
  if (quote.status !== "draft") return { ok: false, message: "Een verstuurde offerte kun je niet meer aanpassen." };

  const { supabase, user } = await requireUser();
  const ctx = await loadCalcContext();
  const calculation = calculateDraft(draft, ctx, todayInNL());
  const changes = diffDrafts(quote.draft, draft);
  if (changes.length === 0) return { ok: true, calculation };

  const { error } = await supabase.from("quotes").update(derivedColumns(draft, calculation)).eq("id", id);
  if (error) return { ok: false, message: "Opslaan is mislukt. Controleer je internetverbinding en probeer het opnieuw." };

  await supabase.from("quote_lines").delete().eq("quote_id", id);
  await supabase.from("quote_lines").insert(lineRows(id, user.id, calculation));
  await supabase.from("quote_edits").insert(
    changes.map((c) => ({ quote_id: id, user_id: user.id, field: c.field, before_value: c.before, after_value: c.after })),
  );
  const { data: metrics } = await supabase.from("quote_metrics").select("edit_count").eq("quote_id", id).maybeSingle();
  if (metrics) await supabase.from("quote_metrics").update({ edit_count: metrics.edit_count + changes.length }).eq("quote_id", id);
  return { ok: true, calculation };
}

export async function deleteDraftQuote(id: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("quotes").delete().eq("id", id).eq("status", "draft");
}
