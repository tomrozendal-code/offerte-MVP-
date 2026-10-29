-- RLS test: two users must never see or change each other's data.
\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'anna@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bram@example.test');

-- The signup trigger created a profile for each user.
do $$ begin
  assert (select count(*) from public.profiles) = 2, 'signup trigger should create profiles';
end $$;

-- Anna creates data.
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.clients (name) values ('Klant van Anna');
insert into public.quotes (id, status) values ('aaaaaaaa-0000-0000-0000-000000000001', 'draft');
insert into public.quote_lines (quote_id, kind, description, amount_cents, vat_rate_bp, explanation)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'labor', 'Muren sauzen', 21600, 900, '4,8 uur × € 45');
insert into public.materials (name, unit, package_size, purchase_price_cents) values ('Muurverf', 'liter', 10, 6000);
update public.profiles set company_name = 'Schildersbedrijf Anna';
insert into public.quote_metrics (quote_id) values ('aaaaaaaa-0000-0000-0000-000000000001');
insert into public.push_subscriptions (endpoint, p256dh, auth) values ('https://push.example/anna', 'k', 'a');
insert into public.quote_reminders (quote_id, reminder_index, status) values ('aaaaaaaa-0000-0000-0000-000000000001', 1, 'skipped');

-- Anna may skip a reminder, but not mark one as sent (only the server sends).
do $$ begin
  begin
    insert into public.quote_reminders (quote_id, reminder_index, status) values ('aaaaaaaa-0000-0000-0000-000000000001', 0, 'sent');
    raise exception 'users must not mark reminders as sent';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.quote_views (quote_id, user_id) values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111');
    raise exception 'users must not write view events';
  exception when insufficient_privilege then null;
  end;
end $$;

-- The server records a client view.
reset role;
insert into public.quote_views (quote_id, user_id, notified) values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', true);
set role authenticated;

-- Bram sees nothing of Anna.
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$ begin
  assert (select count(*) from public.clients) = 0, 'Bram must not see Anna''s clients';
  assert (select count(*) from public.quotes) = 0, 'Bram must not see Anna''s quotes';
  assert (select count(*) from public.quote_lines) = 0, 'Bram must not see Anna''s quote lines';
  assert (select count(*) from public.materials) = 0, 'Bram must not see Anna''s materials';
  assert (select count(*) from public.profiles) = 1, 'Bram only sees his own profile';
  assert (select count(*) from public.vat_rates) = 2, 'VAT rates are readable';
  assert (select count(*) from public.quote_views) = 0, 'Bram must not see Anna''s views';
  assert (select count(*) from public.quote_reminders) = 0, 'Bram must not see Anna''s reminders';
  assert (select count(*) from public.quote_metrics) = 0, 'Bram must not see Anna''s metrics';
  assert (select count(*) from public.push_subscriptions) = 0, 'Bram must not see Anna''s push subscriptions';
end $$;

-- Bram cannot change Anna's data (updates silently affect 0 rows).
update public.quotes set status = 'accepted';
update public.profiles set company_name = 'Gehackt' where user_id = '11111111-1111-1111-1111-111111111111';

-- Bram cannot add a line to Anna's quote, or create rows in Anna's name.
do $$ begin
  begin
    insert into public.quote_lines (quote_id, kind, description, amount_cents, vat_rate_bp, explanation)
      values ('aaaaaaaa-0000-0000-0000-000000000001', 'labor', 'x', 1, 900, 'x');
    raise exception 'insert into foreign quote should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.clients (user_id, name) values ('11111111-1111-1111-1111-111111111111', 'Nep');
    raise exception 'insert as other user should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.quote_reminders (quote_id, user_id, reminder_index, status)
      values ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 0, 'skipped');
    raise exception 'skipping a reminder of someone else''s quote should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.ai_calls (user_id, provider, model, purpose) values ('22222222-2222-2222-2222-222222222222', 'x', 'x', 'structure');
    raise exception 'users must not write ai_calls';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.vat_rates set rate_bp = 0;
    if (select rate_bp from public.vat_rates where code = 'reduced') = 0 then
      raise exception 'users must not change VAT rates';
    end if;
  end;
end $$;

-- Anonymous visitors see nothing.
set role anon;
reset request.jwt.claim.sub;
do $$ begin
  assert (select count(*) from public.quotes) = 0, 'anon must not see quotes';
  assert (select count(*) from public.profiles) = 0, 'anon must not see profiles';
end $$;

-- Anna's data is unchanged.
reset role;
do $$ begin
  assert (select status from public.quotes) = 'draft', 'Anna''s quote must be unchanged';
  assert (select count(*) from public.quote_views) = 1, 'Anna''s view must be unchanged';
  assert (select company_name from public.profiles where user_id = '11111111-1111-1111-1111-111111111111') = 'Schildersbedrijf Anna', 'Anna''s profile must be unchanged';
  assert (select rate_bp from public.vat_rates where code = 'reduced') = 900, 'VAT rate must be unchanged';
end $$;

\echo 'RLS-test geslaagd: gebruikers kunnen elkaars gegevens niet zien of wijzigen.'
