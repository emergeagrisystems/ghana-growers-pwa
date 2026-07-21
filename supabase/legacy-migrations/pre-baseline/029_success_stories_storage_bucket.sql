-- Success story cover image storage.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('stories', 'stories', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read Ghana Growers story images" on storage.objects;

create policy "Public read Ghana Growers story images"
on storage.objects
for select
to public
using (bucket_id = 'stories');
