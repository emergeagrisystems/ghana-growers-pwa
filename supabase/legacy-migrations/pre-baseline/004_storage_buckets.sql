-- Ghana Growers Supabase Storage buckets
-- Run this after the core table migrations to support admin image uploads.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('farmers', 'farmers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('suppliers', 'suppliers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('marketplace', 'marketplace', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read Ghana Growers images" on storage.objects;

create policy "Public read Ghana Growers images"
on storage.objects
for select
to public
using (bucket_id in ('farmers', 'suppliers', 'marketplace'));
