alter table public.supplier_applications
  add column if not exists launch_status text,
  add column if not exists homepage_candidate boolean not null default false,
  add column if not exists marketplace_featured boolean not null default false,
  add column if not exists story_candidate boolean not null default false,
  add column if not exists editorial_notes text,
  add column if not exists launch_ready boolean not null default false,
  add column if not exists launch_checklist jsonb not null default '{}'::jsonb,
  add column if not exists editorial_updated_at timestamptz,
  add column if not exists editorial_updated_by text;

create index if not exists supplier_applications_launch_status_idx
  on public.supplier_applications (launch_status);

create index if not exists supplier_applications_homepage_candidate_idx
  on public.supplier_applications (homepage_candidate);

create index if not exists supplier_applications_marketplace_featured_idx
  on public.supplier_applications (marketplace_featured);

create index if not exists supplier_applications_story_candidate_idx
  on public.supplier_applications (story_candidate);

create index if not exists supplier_applications_launch_ready_idx
  on public.supplier_applications (launch_ready);
