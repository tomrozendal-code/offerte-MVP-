import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

/** Supabase client for server components, server actions and route handlers (acts as the logged-in user). */
export async function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured. See README, step 'Supabase koppelen'.");
  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a server component: cookies are refreshed by the proxy instead.
        }
      },
    },
  });
}
