alter table public.farmers
  add column if not exists farm_photo_urls text[] not null default '{}',
  add column if not exists produce_photo_urls text[] not null default '{}',
  add column if not exists document_urls text[] not null default '{}',
  add column if not exists tally_file_references jsonb not null default '{}'::jsonb,
  add column if not exists photo_import_status text,
  add column if not exists photo_import_notes text;

create index if not exists farmers_photo_import_status_idx
  on public.farmers(photo_import_status)
  where photo_import_status is not null;
