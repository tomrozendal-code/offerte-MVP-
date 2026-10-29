"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import type { FormState } from "@/components/ui/Form";
import { requireUser } from "@/lib/auth/user";
import { companySchema, fieldErrors, followUpSchema, materialSchema, parseNorms, ratesSchema, vatSchema } from "@/lib/settings/schemas";
import { STARTER_MATERIALS } from "@/lib/settings/starterMaterials";
import { NORM_LABELS } from "@/lib/calc/norms";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const NOT_CONNECTED: FormState = { status: "error", message: "De database is nog niet gekoppeld, dus er kan niets worden opgeslagen." };
const SAVE_FAILED: FormState = { status: "error", message: "Opslaan is mislukt. Controleer je internetverbinding en probeer het opnieuw." };

/** Form fields as an object; repeated fields (checkbox lists) are joined with commas. */
function formObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string" || key.startsWith("$")) continue;
    out[key] = key in out ? `${out[key]},${value}` : value;
  }
  return out;
}

// Exported actions: run the save, and always send back what was submitted (see FormState).

export async function saveCompany(_prev: FormState, formData: FormData): Promise<FormState> {
  return { ...(await saveCompanyImpl(formData)), values: formObject(formData) };
}

export async function saveRates(_prev: FormState, formData: FormData): Promise<FormState> {
  return { ...(await saveRatesImpl(formData)), values: formObject(formData) };
}

export async function saveVat(_prev: FormState, formData: FormData): Promise<FormState> {
  return { ...(await saveVatImpl(formData)), values: formObject(formData) };
}

export async function saveFollowUp(_prev: FormState, formData: FormData): Promise<FormState> {
  return { ...(await saveFollowUpImpl(formData)), values: formObject(formData) };
}

export async function saveNorms(_prev: FormState, formData: FormData): Promise<FormState> {
  return { ...(await saveNormsImpl(formData)), values: formObject(formData) };
}

export async function saveMaterial(_prev: FormState, formData: FormData): Promise<FormState> {
  return { ...(await saveMaterialImpl(formData)), values: formObject(formData) };
}

/** Validates a form with a zod schema; returns either the data or a form state with errors. */
function validate<S extends z.ZodType>(schema: S, input: unknown): { data: z.output<S> } | { state: FormState } {
  const result = schema.safeParse(input);
  return result.success ? { data: result.data } : { state: { status: "error", errors: fieldErrors(result.error) } };
}

async function updateProfile(values: Record<string, unknown>): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONNECTED;
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").update(values).eq("user_id", user.id);
  if (error) return SAVE_FAILED;
  revalidatePath("/instellingen", "layout");
  return { status: "saved" };
}

async function saveCompanyImpl(formData: FormData): Promise<FormState> {
  const v = validate(companySchema, formObject(formData));
  if ("state" in v) return v.state;
  const d = v.data;
  return updateProfile({
    company_name: d.companyName,
    street: d.street,
    postal_code: d.postalCode,
    city: d.city,
    email: d.email,
    phone: d.phone,
    kvk_number: d.kvkNumber,
    vat_number: d.vatNumber,
    iban: d.iban,
    quote_validity_days: d.quoteValidityDays,
    terms_text: d.termsText,
  });
}

async function saveRatesImpl(formData: FormData): Promise<FormState> {
  const v = validate(ratesSchema, formObject(formData));
  if ("state" in v) return v.state;
  const d = v.data;
  return updateProfile({
    hourly_rate_cents: d.hourlyRate,
    material_markup_bp: d.materialMarkup,
    travel_cost_cents: d.travelCost,
    minimum_amount_cents: d.minimumAmount,
    default_coats: d.defaultCoats,
  });
}

async function saveVatImpl(formData: FormData): Promise<FormState> {
  const v = validate(vatSchema, formObject(formData));
  if ("state" in v) return v.state;
  return updateProfile({ material_vat_mode: v.data.materialVatMode });
}

async function saveFollowUpImpl(formData: FormData): Promise<FormState> {
  const v = validate(followUpSchema, formObject(formData));
  if ("state" in v) return v.state;
  const d = v.data;
  return updateProfile({
    notify_push: d.notifyPush,
    notify_email: d.notifyEmail,
    reminders_enabled: d.remindersEnabled,
    reminder_days: d.secondReminderDay === null ? [d.firstReminderDay] : [d.firstReminderDay, d.secondReminderDay],
    reminder_hour: d.reminderHour,
    reminder_text: d.reminderText,
  });
}

async function saveNormsImpl(formData: FormData): Promise<FormState> {
  const { norms, cleared, errors } = parseNorms(formObject(formData));
  if (Object.keys(errors).length > 0) return { status: "error", errors };
  if (!isSupabaseConfigured()) return NOT_CONNECTED;

  const { supabase, user } = await requireUser();
  if (norms.length > 0) {
    const rows = norms.map((n) => ({ user_id: user.id, work_type: n.workType, unit: n.unit, value: n.value, label: NORM_LABELS[n.workType] }));
    const { error } = await supabase.from("work_norms").upsert(rows, { onConflict: "user_id,work_type" });
    if (error) return SAVE_FAILED;
  }
  if (cleared.length > 0) {
    const { error } = await supabase.from("work_norms").delete().in("work_type", cleared);
    if (error) return SAVE_FAILED;
  }
  revalidatePath("/instellingen", "layout");
  return { status: "saved" };
}

async function saveMaterialImpl(formData: FormData): Promise<FormState> {
  const v = validate(materialSchema, { ...formObject(formData), workTypes: formData.getAll("workTypes") });
  if ("state" in v) return v.state;
  const d = v.data;
  const id = String(formData.get("id") ?? "");
  const originalPrice = Number(formData.get("originalPriceCents") ?? NaN);
  if (!isSupabaseConfigured()) return NOT_CONNECTED;

  const { supabase } = await requireUser();
  const row = {
    name: d.name,
    unit: d.unit,
    package_size: d.packageSize,
    purchase_price_cents: d.purchasePrice,
    coverage_m2_per_unit_per_coat: d.coverage,
    work_types: d.workTypes,
  };
  const { error } = id
    ? // A changed price is the painter's own price, no longer an example.
      await supabase.from("materials").update(d.purchasePrice !== originalPrice ? { ...row, is_example_price: false } : row).eq("id", id)
    : await supabase.from("materials").insert(row);
  if (error) return SAVE_FAILED;

  revalidatePath("/instellingen", "layout");
  redirect("/instellingen/materialen");
}

export async function deleteMaterial(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase } = await requireUser();
  await supabase.from("materials").delete().eq("id", id);
  revalidatePath("/instellingen", "layout");
  redirect("/instellingen/materialen");
}

/** Adds the hand-made example list, skipping products the painter already has (by name). */
export async function addStarterMaterials(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { supabase } = await requireUser();
  const { data: existing } = await supabase.from("materials").select("name");
  const names = new Set((existing ?? []).map((m) => m.name));
  const rows = STARTER_MATERIALS.map((m, index) => ({ m, index }))
    .filter(({ m }) => !names.has(m.name))
    .map(({ m, index }) => ({
      sort_order: index,
      name: m.name,
      unit: m.unit,
      package_size: m.packageSize,
      purchase_price_cents: m.purchasePriceCents,
      coverage_m2_per_unit_per_coat: m.coverageM2PerUnitPerCoat,
      work_types: m.workTypes,
      is_example_price: true,
    }));
  if (rows.length > 0) await supabase.from("materials").insert(rows);
  revalidatePath("/instellingen", "layout");
}
