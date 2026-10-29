import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the logged-in user and a Supabase client acting as that user.
 * Redirects to the login page when nobody is logged in.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Same as requireUser, but returns null while Supabase is not connected yet (local design work). */
export async function getUserOrNull() {
  if (!isSupabaseConfigured()) return null;
  return requireUser();
}
