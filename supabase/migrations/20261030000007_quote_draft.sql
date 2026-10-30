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
