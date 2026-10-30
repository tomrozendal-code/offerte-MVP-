"use server";

import { redirect } from "next/navigation";
import { analyzeJob } from "@/lib/ai/service";
import { AiError } from "@/lib/ai/types";
import { createQuote, todayInNL } from "@/lib/quotes/data";

export type AnalyzeState = { status: "idle" | "error"; text?: string; message?: string };

export async function analyze(_prev: AnalyzeState, formData: FormData): Promise<AnalyzeState> {
  const text = String(formData.get("text") ?? "");
  const startedAt = Number(formData.get("startedAt"));
  let id: string;
  try {
    const result = await analyzeJob(text, todayInNL());
    id = await createQuote({
      inputText: text,
      extraction: result.extraction,
      description: result.description,
      startedAt: Number.isFinite(startedAt) && startedAt > 0 ? new Date(startedAt) : null,
    });
  } catch (error) {
    const message = error instanceof AiError ? error.message : "Er ging iets mis bij het verwerken. Probeer het opnieuw.";
    if (!(error instanceof AiError)) console.error("analyze failed", error);
    return { status: "error", text, message };
  }
  redirect(`/offertes/${id}`);
}
