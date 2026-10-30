"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type SaveResult, deleteDraftQuote, saveQuoteDraft } from "@/lib/quotes/data";

export async function saveQuote(id: string, draft: unknown): Promise<SaveResult> {
  const result = await saveQuoteDraft(id, draft);
  if (result.ok) revalidatePath(`/offertes/${id}`);
  return result;
}

export async function deleteQuote(formData: FormData) {
  await deleteDraftQuote(String(formData.get("id") ?? ""));
  revalidatePath("/");
  redirect("/");
}
