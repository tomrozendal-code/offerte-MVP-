#!/usr/bin/env bash
# Writes .env.local from environment variables (e.g. set in the cloud environment settings).
# Never prints secret values.
set -euo pipefail
cd "$(dirname "$0")/.."
vars=(NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY ANTHROPIC_API_KEY STT_PROVIDER STT_API_KEY AI_CALLS_PER_USER_PER_DAY NEXT_PUBLIC_APP_URL)
: > .env.local
for v in "${vars[@]}"; do
  if [ -n "${!v:-}" ]; then
    echo "$v=${!v}" >> .env.local
    echo "✓ $v"
  else
    echo "– $v ontbreekt"
  fi
done
