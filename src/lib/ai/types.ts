// Provider-neutral interfaces, so the AI or speech service can be swapped (CLAUDE.md chapter 6).
import type { Extraction } from "./extraction";

export type AiUsage = {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** Cost in millionths of a US dollar cent (the API bills in USD). */
  costMicrocents: number;
};

export interface JobStructurer {
  /** Turns a spoken or typed job description into the fixed format. Never calculates. */
  structure(text: string): Promise<{ extraction: Extraction; usage: AiUsage }>;
}

export interface JobDescriber {
  /** Writes a short work description per room from the structured facts. */
  describe(facts: string): Promise<{ text: string; usage: AiUsage }>;
}

/** Thrown when the AI cannot produce a usable answer; the message is shown to the painter. */
export class AiError extends Error {}
