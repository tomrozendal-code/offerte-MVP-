// Converts database rows into the settings the calculation module needs.
import { NORM_KEYS } from "@/lib/calc/norms";
import type { CalcSettings, Material, MaterialVatMode, Norm, NormKey, NormUnit } from "@/lib/calc/types";

export type ProfileRow = {
  company_name: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  kvk_number: string | null;
  vat_number: string | null;
  iban: string | null;
  logo_path: string | null;
  quote_validity_days: number;
  terms_text: string | null;
  hourly_rate_cents: number | null;
  material_markup_bp: number;
  travel_cost_cents: number;
  minimum_amount_cents: number;
  default_coats: number;
  material_vat_mode: MaterialVatMode | null;
  delete_audio_after_processing: boolean;
  notify_push: boolean;
  notify_email: boolean;
  reminders_enabled: boolean;
  reminder_days: number[];
  reminder_hour: number;
  reminder_text: string | null;
};

export type NormRow = { work_type: string; unit: NormUnit; value: number | string };

export type MaterialRow = {
  id: string;
  name: string;
  unit: Material["unit"];
  package_size: number | string;
  purchase_price_cents: number;
  coverage_m2_per_unit_per_coat: number | string | null;
  work_types: string[];
  is_example_price: boolean;
};

const isNormKey = (s: string): s is NormKey => (NORM_KEYS as string[]).includes(s);

// Postgres "numeric" values arrive as strings.
const num = (v: number | string) => (typeof v === "number" ? v : Number(v));

export function toMaterial(row: MaterialRow): Material {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    packageSize: num(row.package_size),
    purchasePriceCents: row.purchase_price_cents,
    coverageM2PerUnitPerCoat: row.coverage_m2_per_unit_per_coat === null ? null : num(row.coverage_m2_per_unit_per_coat),
    workTypes: row.work_types.filter(isNormKey),
  };
}

export function toCalcSettings(profile: ProfileRow, norms: NormRow[], materials: MaterialRow[]): CalcSettings {
  const normMap: Partial<Record<NormKey, Norm>> = {};
  for (const n of norms) {
    if (isNormKey(n.work_type)) normMap[n.work_type] = { unit: n.unit, value: num(n.value) };
  }
  return {
    hourlyRateCents: profile.hourly_rate_cents ?? 0,
    materialMarkupBp: profile.material_markup_bp,
    travelCostCents: profile.travel_cost_cents,
    minimumAmountCents: profile.minimum_amount_cents,
    defaultCoats: profile.default_coats,
    norms: normMap,
    materials: materials.map(toMaterial),
    materialVatMode: profile.material_vat_mode,
  };
}
