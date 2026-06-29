alter table public.farmer_applications
  add column if not exists farmer_name text,
  add column if not exists farm_name text,
  add column if not exists farm_size text,
  add column if not exists main_crops text,
  add column if not exists other_produce text,
  add column if not exists current_availability text,
  add column if not exists harvest_season text,
  add column if not exists farm_description text,
  add column if not exists has_available_produce text,
  add column if not exists farmer_photo_url text,
  add column if not exists farm_photo_urls text[] not null default '{}',
  add column if not exists produce_photo_urls text[] not null default '{}',
  add column if not exists agreement boolean not null default false;

alter table public.farmer_applications
  alter column status set default 'Pending';

alter table public.farmer_applications
  drop constraint if exists farmer_applications_status_check;

alter table public.farmer_applications
  add constraint farmer_applications_status_check
  check (status in ('New', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Converted'));

create index if not exists farmer_applications_main_crops_idx
  on public.farmer_applications (main_crops);

create index if not exists farmer_applications_region_status_idx
  on public.farmer_applications (region, status, created_at desc);
