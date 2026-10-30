import "server-only";
import { anthropicDescriber, anthropicStructurer } from "./anthropic";
import { demoDescriber, demoStructurer } from "./demo";

/** Which AI service to use. The demo only works outside production. */
export function getProviders() {
  const demo = process.env.AI_PROVIDER === "demo" && process.env.NODE_ENV !== "production";
  return demo
    ? { structurer: demoStructurer, describer: demoDescriber, demo: true }
    : { structurer: anthropicStructurer, describer: anthropicDescriber, demo: false };
}

export function isDemoMode() {
  return getProviders().demo;
}
