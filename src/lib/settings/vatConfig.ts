import "server-only";
import type { VatConfig } from "@/lib/calc/types";
import { requireUser } from "@/lib/auth/user";

/** VAT rates and rules from the database (tables vat_rates and vat_rules), never hardcoded. */
export async function loadVatConfig(): Promise<VatConfig> {
  const { supabase } = await requireUser();
  const [rates, rules] = await Promise.all([
    supabase.from("vat_rates").select("code, rate_bp, valid_from, valid_to"),
    supabase.from("vat_rules").select("rule, effective_from").eq("rule", "mixed_use_split").single(),
  ]);
  if (rates.error) throw rates.error;
  if (rules.error) throw rules.error;
  return {
    rates: rates.data.map((r) => ({ code: r.code, rateBp: r.rate_bp, validFrom: r.valid_from, validTo: r.valid_to })),
    mixedUseSplitFrom: rules.data.effective_from,
  };
}
