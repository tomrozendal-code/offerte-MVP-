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
