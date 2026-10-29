-- GEGENEREERD BESTAND: niet met de hand aanpassen. Maak opnieuw met: npm run db:bundle
-- Plak dit in Supabase -> SQL Editor -> New query, en klik op Run. Alleen op een nieuw, leeg project.

-- ===== 20261029000001_init.sql =====
-- Initial schema for MVP Offerte.
-- Every table with user data has Row Level Security: a user can only see and change their own rows.
-- Money is stored as integer cents (*_cents), percentages as basis points (*_bp, 100 bp = 1%).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Company profile and rates (one row per user)
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  company_name text,
  street text,
  postal_code text,
  city text,
  kvk_number text,
  vat_number text,
  iban text,
  logo_path text,
  quote_validity_days integer not null default 30 check (quote_validity_days between 1 and 365),
  terms_text text,
  hourly_rate_cents integer check (hourly_rate_cents >= 0),
  material_markup_bp integer not null default 0 check (material_markup_bp >= 0),
  travel_cost_cents integer not null default 0 check (travel_cost_cents >= 0),
  minimum_amount_cents integer not null default 0 check (minimum_amount_cents >= 0),
  -- How the bookkeeper applies VAT to materials. Null until the user chooses (no assumption, CLAUDE.md 4.2).
  material_vat_mode text check (material_vat_mode in ('follow_labor', 'always_standard')),
  delete_audio_after_processing boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create an empty profile as soon as someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Work norms, filled in by the user (e.g. "wall painting: 18 m² per hour per coat")
-- ---------------------------------------------------------------------------

create table public.work_norms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  work_type text not null,
  label text not null,
  unit text not null check (unit in (
    'm2_per_hour_per_coat',
    'minutes_per_m2',
    'hours_per_meter',
    'hours_per_piece',
    'hours_per_piece_per_side'
  )),
  value numeric(10, 3) not null check (value > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, work_type)
);

create trigger work_norms_updated_at before update on public.work_norms
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Materials with the user's own purchase prices
-- ---------------------------------------------------------------------------

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  unit text not null check (unit in ('liter', 'kg', 'stuk', 'rol')),
  package_size numeric(10, 3) not null check (package_size > 0),
  purchase_price_cents integer not null check (purchase_price_cents >= 0),
  -- m² per unit per coat; null for materials that are not used per m² (e.g. tape).
  coverage_m2_per_unit_per_coat numeric(10, 3) check (coverage_m2_per_unit_per_coat > 0),
  work_types text[] not null default '{}',
  -- True for the hand-made starter list: shown as "voorbeeldprijs – pas aan naar jouw inkoopprijs".
  is_example_price boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger materials_updated_at before update on public.materials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- VAT configuration (shared, read-only for users; changed by us when the law changes)
-- ---------------------------------------------------------------------------

create table public.vat_rates (
  code text not null check (code in ('reduced', 'standard')),
  rate_bp integer not null check (rate_bp >= 0),
  valid_from date not null,
  valid_to date,
  primary key (code, valid_from)
);

create table public.vat_rules (
  rule text primary key,
  effective_from date not null,
  description text not null
);

insert into public.vat_rates (code, rate_bp, valid_from) values
  ('reduced', 900, '2001-01-01'),
  ('standard', 2100, '2012-10-01');

insert into public.vat_rules (rule, effective_from, description) values
  ('mixed_use_split', '2025-07-01', 'Bij gemengd gebruik alleen het woongedeelte tegen het verlaagde tarief.'),
  ('dwelling_min_age_years', '2001-01-01', 'Verlaagd tarief alleen voor woningen die 2 jaar of langer in gebruik zijn.');

-- ---------------------------------------------------------------------------
-- Clients and quotes
-- ---------------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  street text,
  postal_code text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  quote_number text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'accepted', 'expired')),
  work_street text,
  work_postal_code text,
  work_city text,
  -- VAT questions (CLAUDE.md 4.3). Null = not answered yet.
  usage_type text check (usage_type in ('residential', 'mixed', 'non_residential')),
  dwelling_older_than_two_years boolean,
  residential_share_pct integer check (residential_share_pct between 0 and 100),
  input_text text,
  ai_result jsonb,
  calculation jsonb,
  subtotal_cents integer,
  vat_cents integer,
  total_cents integer,
  valid_until date,
  -- Secret token for the public share link; generated when the quote is sent.
  share_token text unique,
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  accepted_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mixed_use_needs_share check (usage_type is distinct from 'mixed' or residential_share_pct is not null)
);

create index quotes_user_status_idx on public.quotes (user_id, status);

create trigger quotes_updated_at before update on public.quotes
  for each row execute function public.set_updated_at();

create table public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  room text,
  kind text not null check (kind in ('labor', 'material', 'travel', 'minimum_charge', 'other')),
  description text not null,
  quantity numeric(12, 3),
  unit text,
  unit_price_cents integer,
  amount_cents integer not null,
  vat_rate_bp integer not null,
  -- Human-readable calculation, e.g. "43,2 m² × 2 lagen ÷ 18 m²/uur = 4,8 uur × € 45" (rule 3).
  explanation text not null,
  source text not null default 'calculated' check (source in ('calculated', 'manual')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index quote_lines_quote_idx on public.quote_lines (quote_id, sort_order);

-- Every manual change: proposal vs. final version, to improve norms later (not automatic in the MVP).
create table public.quote_edits (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  field text not null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

-- Files in Supabase Storage (audio, photos, pdf, logo). Only paths are stored here.
create table public.media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  quote_id uuid references public.quotes (id) on delete cascade,
  kind text not null check (kind in ('audio', 'photo', 'pdf', 'logo')),
  storage_path text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- AI and speech usage per call: for cost logging per quote and the per-user rate limit.
-- Only the server (service role) writes here, so users cannot fake their usage.
create table public.ai_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quote_id uuid references public.quotes (id) on delete set null,
  provider text not null,
  model text not null,
  purpose text not null check (purpose in ('transcribe', 'structure', 'photo')),
  input_tokens integer,
  output_tokens integer,
  audio_seconds numeric(8, 2),
  cost_microcents bigint not null default 0,
  created_at timestamptz not null default now()
);

create index ai_calls_user_time_idx on public.ai_calls (user_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.work_norms enable row level security;
alter table public.materials enable row level security;
alter table public.vat_rates enable row level security;
alter table public.vat_rules enable row level security;
alter table public.clients enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_lines enable row level security;
alter table public.quote_edits enable row level security;
alter table public.media enable row level security;
alter table public.ai_calls enable row level security;

-- Profile: read and update your own; the row itself is created by the signup trigger.
create policy "own profile: select" on public.profiles for select to authenticated using (user_id = (select auth.uid()));
create policy "own profile: update" on public.profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Tables fully owned by the user.
create policy "own rows" on public.work_norms for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.materials for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.clients for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.quotes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.media for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Lines and edits: own rows, and the quote they belong to must also be yours.
create policy "own rows" on public.quote_lines for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = (select auth.uid()))
  );
create policy "own rows" on public.quote_edits for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = (select auth.uid()))
  );

-- AI usage: read your own, no writes from the browser.
create policy "own rows: select" on public.ai_calls for select to authenticated using (user_id = (select auth.uid()));

-- VAT configuration: everyone logged in may read it, nobody may change it via the API.
create policy "read" on public.vat_rates for select to authenticated using (true);
create policy "read" on public.vat_rules for select to authenticated using (true);

-- Anonymous visitors (the client opening a share link) get no direct table access.
-- The public quote page will use a dedicated server route with the share token (phase 5).

-- ===== 20261029000002_storage.sql =====
-- Private storage bucket for audio, photos, pdfs and logos.
-- Files live under "<user_id>/..." and are only reachable via short-lived signed URLs.

insert into storage.buckets (id, name, public)
values ('quote-files', 'quote-files', false)
on conflict (id) do nothing;

create policy "own files: select" on storage.objects for select to authenticated
  using (bucket_id = 'quote-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "own files: insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'quote-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "own files: update" on storage.objects for update to authenticated
  using (bucket_id = 'quote-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "own files: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'quote-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ===== 20261029000003_default_coats.sql =====
-- Number of coats used when the painter does not mention it. Set by the painter, shown as "(standaard)".
alter table public.profiles
  add column default_coats integer not null default 2 check (default_coats between 1 and 10);

-- ===== 20261029000004_follow_up.sql =====
-- Follow-up (CLAUDE.md chapter 11): view notifications, reminders, accept/reject and measurements.

-- ---------------------------------------------------------------------------
-- Quote statuses and follow-up fields
-- ---------------------------------------------------------------------------

alter table public.quotes drop constraint quotes_status_check;
alter table public.quotes add constraint quotes_status_check
  check (status in ('draft', 'sent', 'viewed', 'reminded', 'accepted', 'rejected', 'expired'));

alter table public.quotes
  -- Set by the painter: "gewonnen" or "verloren" (e.g. after a phone call). Stops reminders.
  add column outcome text check (outcome in ('won', 'lost')),
  add column rejected_at timestamptz,
  add column rejection_reason text,
  -- Reminders switched off for this quote only.
  add column reminders_disabled boolean not null default false,
  -- Views by the client (never by the painter).
  add column first_viewed_at timestamptz,
  add column last_viewed_at timestamptz,
  add column view_count integer not null default 0;

-- ---------------------------------------------------------------------------
-- Follow-up settings per painter (screen "Opvolging")
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column notify_push boolean not null default true,
  add column notify_email boolean not null default true,
  add column reminders_enabled boolean not null default true,
  add column reminder_days integer[] not null default '{3,7}'
    check (cardinality(reminder_days) between 1 and 2 and 1 <= all (reminder_days) and 60 >= all (reminder_days)),
  -- Hour (Dutch time) at which reminders go out.
  add column reminder_hour integer not null default 9 check (reminder_hour between 7 and 20),
  -- null = use the standard text.
  add column reminder_text text;

-- ---------------------------------------------------------------------------
-- View events: only from our own quote page; no IP address, no cookies, no tracking pixels.
-- Written by the server only.
-- ---------------------------------------------------------------------------

create table public.quote_views (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  -- Whether the painter got a notification for this view (first view, or after 24 hours without views).
  notified boolean not null default false
);

create index quote_views_quote_idx on public.quote_views (quote_id, viewed_at);

-- ---------------------------------------------------------------------------
-- Reminders. The unique constraint makes sending idempotent: the cron job first claims
-- (quote_id, reminder_index) by inserting the row, and only sends if that insert succeeded.
-- ---------------------------------------------------------------------------

create table public.quote_reminders (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reminder_index smallint not null check (reminder_index between 0 and 1),
  channel text check (channel in ('email', 'whatsapp_prompt')),
  status text not null check (status in ('sending', 'sent', 'skipped', 'failed')),
  due_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (quote_id, reminder_index)
);

-- ---------------------------------------------------------------------------
-- Measurements per quote (time saved, edits). No client data in here.
-- ---------------------------------------------------------------------------

create table public.quote_metrics (
  quote_id uuid primary key references public.quotes (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  first_ai_result_at timestamptz,
  -- Active working time until sending; pauses longer than 5 minutes are not counted.
  active_seconds_to_send integer check (active_seconds_to_send >= 0),
  -- Number of changes the painter made to the AI proposal.
  edit_count integer not null default 0 check (edit_count >= 0)
);

-- ---------------------------------------------------------------------------
-- Web push subscriptions (one per device).
-- ---------------------------------------------------------------------------

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.quote_views enable row level security;
alter table public.quote_reminders enable row level security;
alter table public.quote_metrics enable row level security;
alter table public.push_subscriptions enable row level security;

-- Views: the painter may read them, only the server writes them.
create policy "own rows: select" on public.quote_views for select to authenticated using (user_id = (select auth.uid()));

-- Reminders: the painter may read them and may only skip one (status 'skipped'); sending is done by the server.
create policy "own rows: select" on public.quote_reminders for select to authenticated using (user_id = (select auth.uid()));
create policy "own rows: skip" on public.quote_reminders for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'skipped'
    and exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = (select auth.uid()))
  );

create policy "own rows" on public.quote_metrics for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = (select auth.uid()))
  );

create policy "own rows" on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

