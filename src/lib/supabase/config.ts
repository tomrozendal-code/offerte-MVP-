// Supabase can be connected later. Until the env vars are set, the app runs without a database.
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && publishableKey ? { url, publishableKey } : null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
