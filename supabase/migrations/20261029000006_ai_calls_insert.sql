-- The server logs each AI call as the logged-in user (no secret key needed on the server).
-- Users may only add rows for themselves and can never change or delete them,
-- so the daily limit on AI calls cannot be bypassed.
create policy "own rows: insert" on public.ai_calls for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Work descriptions (CLAUDE.md 11.4) are a separate kind of AI call.
alter table public.ai_calls drop constraint ai_calls_purpose_check;
alter table public.ai_calls add constraint ai_calls_purpose_check check (purpose in ('transcribe', 'structure', 'describe', 'photo'));
