import "server-only";
import { calculateQuote } from "@/lib/calc";
import type { QuoteCalculation } from "@/lib/calc/types";
import { requireUser } from "@/lib/auth/user";
import { loadMaterials, loadNorms, loadProfile } from "@/lib/settings/data";
import { toCalcSettings } from "@/lib/settings/toCalcSettings";
import { loadVatConfig } from "@/lib/settings/vatConfig";
import { anthropicDescriber, anthropicStructurer } from "./anthropic";
import { checkDescription, factsText, roomFacts, templateDescription } from "./description";
import { type Extraction, toJob, toVatContext } from "./extraction";
import { AiError, type AiUsage } from "./types";

export type AnalyzeResult = {
  extraction: Extraction;
  calculation: QuoteCalculation;
  description: string;
  /** "template" when the AI text did not pass the checks (amounts or invented numbers). */
  descriptionSource: "ai" | "template";
};

const MAX_INPUT_LENGTH = 4000;

function dailyLimit() {
  const n = Number(process.env.AI_CALLS_PER_USER_PER_DAY ?? 50);
  return Number.isFinite(n) && n > 0 ? n : 50;
}

/** Turns a job description into a calculated proposal. The AI structures and writes; the code calculates. */
export async function analyzeJob(text: string, quoteDate: string): Promise<AnalyzeResult> {
  const input = text.trim();
  if (input.length < 5) throw new AiError("Beschrijf de klus in een paar woorden.");
  if (input.length > MAX_INPUT_LENGTH) throw new AiError(`De omschrijving is te lang (maximaal ${MAX_INPUT_LENGTH} tekens).`);

  const { supabase, user } = await requireUser();

  // Rate limit (CLAUDE.md rule 6): count this user's AI calls in the last 24 hours.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase.from("ai_calls").select("id", { count: "exact", head: true }).gte("created_at", since);
  if (countError) throw countError;
  if ((count ?? 0) >= dailyLimit()) {
    throw new AiError("Je hebt het maximale aantal AI-verwerkingen voor vandaag bereikt. Probeer het morgen opnieuw.");
  }

  // Log the cost of every call (CLAUDE.md rule 8). Quote id follows once quotes are saved (phase 4).
  const log = async (purpose: "structure" | "describe", usage: AiUsage) => {
    await supabase.from("ai_calls").insert({
      user_id: user.id,
      provider: usage.provider,
      model: usage.model,
      purpose,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      cost_microcents: usage.costMicrocents,
    });
  };

  const { extraction, usage } = await anthropicStructurer.structure(input);
  await log("structure", usage);

  const [profile, norms, materials, vatConfig] = await Promise.all([loadProfile(), loadNorms(), loadMaterials(), loadVatConfig()]);
  const settings = toCalcSettings(profile, norms, materials);
  const job = toJob(extraction);
  const calculation = calculateQuote({ job, settings, vat: toVatContext(extraction), vatConfig, quoteDate });

  // Work description: AI text only if it passes the checks, otherwise a plain template.
  const materialNames = calculation.lines.filter((l) => l.kind === "material").map((l) => l.description);
  const rooms = roomFacts(job, calculation, materialNames);
  const allowed = rooms.flatMap((r) => r.numbers);
  let description = templateDescription(rooms);
  let descriptionSource: AnalyzeResult["descriptionSource"] = "template";
  if (rooms.length > 0) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await anthropicDescriber.describe(factsText(rooms));
        await log("describe", result.usage);
        if (checkDescription(result.text, allowed, materialNames).ok) {
          description = result.text;
          descriptionSource = "ai";
          break;
        }
      } catch {
        break; // the template is good enough; the calculation is what matters
      }
    }
  }

  return { extraction, calculation, description, descriptionSource };
}
