import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

/** Supabase client for the browser. Only uses the public anon key; RLS protects the data. */
export function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured. See README, step 'Supabase koppelen'.");
  return createBrowserClient(config.url, config.anonKey);
}
