-- Number of coats used when the painter does not mention it. Set by the painter, shown as "(standaard)".
alter table public.profiles
  add column default_coats integer not null default 2 check (default_coats between 1 and 10);
