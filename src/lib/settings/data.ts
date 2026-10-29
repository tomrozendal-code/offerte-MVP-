import "server-only";
import { z } from "zod";
import { getUserOrNull } from "@/lib/auth/user";
import { DEFAULT_QUOTE_VALIDITY_DAYS } from "./defaults";
import type { MaterialRow, NormRow, ProfileRow } from "./toCalcSettings";

export const EMPTY_PROFILE: ProfileRow = {
  company_name: null,
  street: null,
  postal_code: null,
  city: null,
  email: null,
  phone: null,
  kvk_number: null,
  vat_number: null,
  iban: null,
  logo_path: null,
  quote_validity_days: DEFAULT_QUOTE_VALIDITY_DAYS,
  terms_text: null,
  hourly_rate_cents: null,
  material_markup_bp: 0,
  travel_cost_cents: 0,
  minimum_amount_cents: 0,
  default_coats: 2,
  material_vat_mode: null,
  delete_audio_after_processing: true,
  notify_push: true,
  notify_email: true,
  reminders_enabled: true,
  reminder_days: [3, 7],
  reminder_hour: 9,
  reminder_text: null,
};

const PROFILE_COLUMNS = Object.keys(EMPTY_PROFILE).join(", ");

// While Supabase is not connected, the screens show empty settings so the design can be checked.

export async function loadProfile(): Promise<ProfileRow> {
  const auth = await getUserOrNull();
  if (!auth) return EMPTY_PROFILE;
  const { data, error } = await auth.supabase.from("profiles").select(PROFILE_COLUMNS).eq("user_id", auth.user.id).single();
  if (error) throw error;
  return data as unknown as ProfileRow;
}

export async function loadNorms(): Promise<NormRow[]> {
  const auth = await getUserOrNull();
  if (!auth) return [];
  const { data, error } = await auth.supabase.from("work_norms").select("work_type, unit, value");
  if (error) throw error;
  return data as NormRow[];
}

export async function loadMaterials(): Promise<MaterialRow[]> {
  const auth = await getUserOrNull();
  if (!auth) return [];
  const { data, error } = await auth.supabase
    .from("materials")
    .select("id, name, unit, package_size, purchase_price_cents, coverage_m2_per_unit_per_coat, work_types, is_example_price")
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return data as MaterialRow[];
}

export async function loadMaterial(id: string): Promise<MaterialRow | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const auth = await getUserOrNull();
  if (!auth) return null;
  const { data, error } = await auth.supabase
    .from("materials")
    .select("id, name, unit, package_size, purchase_price_cents, coverage_m2_per_unit_per_coat, work_types, is_example_price")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as MaterialRow | null;
}

export async function loadAccountEmail(): Promise<string | null> {
  const auth = await getUserOrNull();
  return auth?.user.email ?? null;
}
