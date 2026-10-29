"use server";

import { type AnalyzeResult, analyzeJob } from "@/lib/ai/service";
import { AiError } from "@/lib/ai/types";

export type AnalyzeState = { status: "idle" | "done" | "error"; text?: string; message?: string; result?: AnalyzeResult };

/** Today's date in the Netherlands (yyyy-mm-dd): decides which VAT rates apply. */
function todayInNL() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());
}

export async function analyze(_prev: AnalyzeState, formData: FormData): Promise<AnalyzeState> {
  const text = String(formData.get("text") ?? "");
  try {
    const result = await analyzeJob(text, todayInNL());
    return { status: "done", text, result };
  } catch (error) {
    const message = error instanceof AiError ? error.message : "Er ging iets mis bij het verwerken. Probeer het opnieuw.";
    if (!(error instanceof AiError)) console.error("analyzeJob failed", error);
    return { status: "error", text, message };
  }
}
