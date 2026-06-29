alter table public.supplier_applications
  add column if not exists business_name text,
  add column if not exists website_url text,
  add column if not exists registration_number text,
  add column if not exists categories text[] not null default '{}',
  add column if not exists regions_served text[] not null default '{}',
  add column if not exists business_description text,
  add column if not exists years_in_business text,
  add column if not exists logo_url text,
  add column if not exists photo_urls text[] not null default '{}',
  add column if not exists certificate_urls text[] not null default '{}',
  add column if not exists gg_standard_agreement boolean not null default false;

alter table public.supplier_applications
  alter column status set default 'Pending';

alter table public.supplier_applications
  drop constraint if exists supplier_applications_status_check;

alter table public.supplier_applications
  add constraint supplier_applications_status_check
  check (status in ('New', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Converted'));

create index if not exists supplier_applications_categories_idx
  on public.supplier_applications using gin (categories);

create index if not exists supplier_applications_regions_served_idx
  on public.supplier_applications using gin (regions_served);
