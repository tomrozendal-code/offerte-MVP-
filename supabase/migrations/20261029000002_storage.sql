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
