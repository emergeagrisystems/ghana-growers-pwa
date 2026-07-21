-- Imported Farmer Photos
-- Stores public Supabase Storage copies of Tally-submitted farmer photos.

alter table public.farmers
  add column if not exists imported_photo_url text;

create index if not exists farmers_imported_photo_url_idx
  on public.farmers(imported_photo_url)
  where imported_photo_url is not null;
