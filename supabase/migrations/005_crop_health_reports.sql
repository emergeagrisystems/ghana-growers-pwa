-- Ghana Growers crop health reports
-- Stores user-saved crop health diagnoses and uploaded report images.

create extension if not exists pgcrypto;

create table if not exists public.crop_health_reports (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  image_url text not null,
  diagnosis_result jsonb not null,
  possible_issue text,
  confidence integer not null default 0,
  severity text,
  provider text,
  report_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists crop_health_reports_session_id_idx on public.crop_health_reports(session_id);
create index if not exists crop_health_reports_report_date_idx on public.crop_health_reports(report_date desc);

alter table public.crop_health_reports enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('crop-health-reports', 'crop-health-reports', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read crop health report images" on storage.objects;

create policy "Public read crop health report images"
on storage.objects
for select
to public
using (bucket_id = 'crop-health-reports');
