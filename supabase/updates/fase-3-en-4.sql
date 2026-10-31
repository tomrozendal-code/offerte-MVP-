-- Database-aanpassingen voor fase 3 en 4 (migraties 0006 en 0007) in één keer.
-- Plak dit in Supabase -> SQL Editor -> New query en klik op Run. Eén keer uitvoeren.

-- The server logs each AI call as the logged-in user (no secret key needed on the server).
-- Users may only add rows for themselves and can never change or delete them,
-- so the daily limit on AI calls cannot be bypassed.
create policy "own rows: insert" on public.ai_calls for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Work descriptions (CLAUDE.md 11.4) are a separate kind of AI call.
alter table public.ai_calls drop constraint ai_calls_purpose_check;
alter table public.ai_calls add constraint ai_calls_purpose_check check (purpose in ('transcribe', 'structure', 'describe', 'photo'));

-- Editable state of a quote (phase 4). ai_result keeps the AI's original proposal unchanged;
-- draft holds the painter's current version, so the difference can be used to improve norms later.
alter table public.quotes
  add column draft jsonb,
  add column work_description text,
  add column client_name text,
  add column client_email text,
  add column client_phone text;

-- Quote numbers are unique per painter, e.g. 2026-0001.
alter table public.quotes add constraint quotes_user_number_unique unique (user_id, quote_number);

-- Controle: deze regel geeft 'klaar' terug als alles gelukt is.
select 'klaar' as resultaat from information_schema.columns where table_name = 'quotes' and column_name = 'draft';
