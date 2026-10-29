#!/usr/bin/env bash
# Combines all migrations into one file that can be pasted into the Supabase SQL Editor.
set -euo pipefail
cd "$(dirname "$0")/.."
out=supabase/setup-alles.sql
{
  echo "-- GEGENEREERD BESTAND: niet met de hand aanpassen. Maak opnieuw met: npm run db:bundle"
  echo "-- Plak dit in Supabase -> SQL Editor -> New query, en klik op Run. Alleen op een nieuw, leeg project."
  echo
  for f in supabase/migrations/*.sql; do
    echo "-- ===== $(basename "$f") ====="
    cat "$f"
    echo
  done
} > "$out"
echo "Geschreven: $out"
