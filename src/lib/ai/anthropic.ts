import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ExtractionSchema } from "./extraction";
import { DESCRIPTION_SYSTEM_PROMPT, EXTRACTION_SYSTEM_PROMPT } from "./prompts";
import { AiError, type AiUsage, type JobDescriber, type JobStructurer } from "./types";

export const MODEL = "claude-opus-5-5";

// USD per million tokens (input, output); used to log the cost of every call (CLAUDE.md rule 8).
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-opus-4-8": { input: 5, output: 25 },
};

// On a safety refusal the API retries on a fallback model it picks itself.
const fallback = () => ({ betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const });

function usageOf(response: { model: string; usage: { input_tokens: number; output_tokens: number } }): AiUsage {
  const price = PRICES[response.model] ?? PRICES[MODEL];
  // $ per million tokens = cents per 10,000 tokens = 100 microcents per token per $.
  const costMicrocents = Math.round(response.usage.input_tokens * price.input * 100 + response.usage.output_tokens * price.output * 100);
  return { provider: "anthropic", model: response.model, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens, costMicrocents };
}

function client() {
  if (!process.env.ANTHROPIC_API_KEY) throw new AiError("De AI is nog niet ingesteld (ANTHROPIC_API_KEY ontbreekt).");
  return new Anthropic();
}

export const anthropicStructurer: JobStructurer = {
  async structure(text) {
    const response = await client().beta.messages.parse({
      ...fallback(),
      model: MODEL,
      max_tokens: 16000,
      system: EXTRACTION_SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(ExtractionSchema), effort: "medium" },
      messages: [{ role: "user", content: text }],
    });
    if (response.stop_reason === "refusal") throw new AiError("De AI kon deze omschrijving niet verwerken. Probeer het anders te formuleren.");
    if (response.stop_reason === "max_tokens") throw new AiError("De omschrijving is te lang om in één keer te verwerken. Splits hem op in delen.");
    const parsed = ExtractionSchema.safeParse(response.parsed_output);
    if (!parsed.success) throw new AiError("De AI gaf een onvolledig antwoord. Probeer het opnieuw.");
    return { extraction: parsed.data, usage: usageOf(response) };
  },
};

export const anthropicDescriber: JobDescriber = {
  async describe(facts) {
    const response = await client().beta.messages.create({
      ...fallback(),
      model: MODEL,
      max_tokens: 4000,
      system: DESCRIPTION_SYSTEM_PROMPT,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: facts }],
    });
    if (response.stop_reason === "refusal") throw new AiError("De AI kon geen werkomschrijving maken.");
    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
    return { text, usage: usageOf(response) };
  },
};
