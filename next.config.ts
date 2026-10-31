import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Project instructions live in CLAUDE.md; don't let the dev server generate an AGENTS.md.
  agentRules: false,
};

export default nextConfig;
