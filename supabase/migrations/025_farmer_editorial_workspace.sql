-- Sprint 7D: Persist launch editorial decisions for farmer review.

alter table public.farmers
  add column if not exists launch_status text not null default 'Needs Improvement',
  add column if not exists homepage_candidate boolean not null default false,
  add column if not exists marketplace_featured boolean not null default false,
  add column if not exists story_candidate boolean not null default false,
  add column if not exists editorial_notes text,
  add column if not exists launch_ready boolean not null default false,
  add column if not exists launch_checklist jsonb not null default '{}'::jsonb,
  add column if not exists editorial_updated_at timestamptz,
  add column if not exists editorial_updated_by text;

alter table public.farmers
  drop constraint if exists farmers_launch_status_check;

alter table public.farmers
  add constraint farmers_launch_status_check
  check (launch_status in ('Public Farmer', 'Featured Farmer', 'Founding Farmer 2026', 'Needs Improvement', 'Hold'));

create index if not exists farmers_launch_status_idx
  on public.farmers (launch_status);

create index if not exists farmers_homepage_candidate_idx
  on public.farmers (homepage_candidate)
  where homepage_candidate = true;

create index if not exists farmers_marketplace_featured_idx
  on public.farmers (marketplace_featured)
  where marketplace_featured = true;

create index if not exists farmers_story_candidate_idx
  on public.farmers (story_candidate)
  where story_candidate = true;

create index if not exists farmers_launch_ready_idx
  on public.farmers (launch_ready)
  where launch_ready = true;

comment on column public.farmers.launch_status is
  'Internal Ghana Growers editorial launch status for public farmer curation.';

comment on column public.farmers.homepage_candidate is
  'Internal flag showing whether this farmer is a homepage candidate.';

comment on column public.farmers.marketplace_featured is
  'Internal editorial flag showing whether this farmer should be highlighted in marketplace contexts.';

comment on column public.farmers.story_candidate is
  'Internal flag showing whether this farmer may become a future success story candidate.';

comment on column public.farmers.editorial_notes is
  'Internal editorial notes for launch preparation and content curation.';

comment on column public.farmers.launch_ready is
  'Computed editorial readiness flag saved by the Operations Center.';

comment on column public.farmers.launch_checklist is
  'JSON checklist of farmer launch content requirements.';

comment on column public.farmers.editorial_updated_at is
  'Timestamp of the most recent launch editorial update.';

comment on column public.farmers.editorial_updated_by is
  'Admin email responsible for the most recent launch editorial update.';
