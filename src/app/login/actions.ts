"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string; email?: string };

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!z.email().safeParse(email).success) {
    return { status: "error", message: "Vul een geldig e-mailadres in.", email };
  }
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "De database is nog niet gekoppeld. Zie de README.", email };
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || (await headers()).get("origin") || "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) {
    // Supabase limits how often a link can be requested.
    const message = error.status === 429 ? "Je hebt net al een link gekregen. Wacht een minuut en probeer het opnieuw." : "Er ging iets mis bij het versturen. Probeer het opnieuw.";
    return { status: "error", message, email };
  }
  return { status: "sent", email };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
