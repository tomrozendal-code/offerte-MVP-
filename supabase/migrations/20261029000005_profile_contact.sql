-- Contact details of the painter: shown on quotes, used as reply-to address for reminders.
alter table public.profiles
  add column email text,
  add column phone text;

-- New users start with their login e-mail as contact address.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email) values (new.id, new.email);
  return new;
end;
$$;

-- Fixed order of materials: the first material linked to a work type is used by default.
alter table public.materials add column sort_order integer not null default 1000;
