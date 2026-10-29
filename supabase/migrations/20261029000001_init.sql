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
