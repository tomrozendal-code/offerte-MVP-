#!/usr/bin/env bash
# Runs the database migrations and the RLS test against a throwaway local Postgres.
# Needs PostgreSQL 15+ installed locally (initdb/pg_ctl). No Supabase account required.
set -euo pipefail

cd "$(dirname "$0")/../.."
PG_BIN="${PG_BIN:-$(dirname "$(command -v initdb || ls /usr/lib/postgresql/*/bin/initdb | tail -1)")}"
DATA_DIR="$(mktemp -d)"
PORT="${PGTEST_PORT:-54329}"
RUN_AS=()
# Postgres refuses to run as root; use the postgres user in that case.
if [ "$(id -u)" = "0" ]; then
  chown postgres "$DATA_DIR"
  RUN_AS=(runuser -u postgres --)
fi

cleanup() {
  "${RUN_AS[@]}" "$PG_BIN/pg_ctl" -D "$DATA_DIR" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$DATA_DIR"
}
trap cleanup EXIT

"${RUN_AS[@]}" "$PG_BIN/initdb" -D "$DATA_DIR" -U postgres >/dev/null
"${RUN_AS[@]}" "$PG_BIN/pg_ctl" -D "$DATA_DIR" -o "-p $PORT -k /tmp -c listen_addresses=''" -w start >/dev/null

PSQL=(psql -h /tmp -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f supabase/tests/supabase-stub.sql
# Storage migrations need Supabase Storage itself and are skipped here.
for f in supabase/migrations/*.sql; do
  case "$f" in *storage*) continue ;; esac
  "${PSQL[@]}" -f "$f"
done
"${PSQL[@]}" -f supabase/tests/grants.sql
"${PSQL[@]}" -f supabase/tests/rls.test.sql
