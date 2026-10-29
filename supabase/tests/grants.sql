-- Supabase grants these table privileges by default; RLS then limits which rows are visible.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
