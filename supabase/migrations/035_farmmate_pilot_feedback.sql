begin;

create table if not exists public.farmmate_pilot_feedback (
  id uuid primary key default gen_random_uuid(),
  name_or_nickname text,
  region text,
  main_crop text,
  tested_feature text not null,
  helpfulness text not null check (helpfulness in ('yes', 'partly', 'not_yet')),
  confusion text,
  improvement text,
  would_use_again text not null check (would_use_again in ('yes', 'maybe', 'no')),
  created_at timestamptz not null default now()
);

comment on table public.farmmate_pilot_feedback is
  'Controlled GG FarmMate pilot feedback. Feedback is submitted server-side only; public clients should not read this table directly.';

comment on column public.farmmate_pilot_feedback.name_or_nickname is
  'Optional tester name or nickname. Do not require login, phone number or exact location for pilot feedback.';

create index if not exists farmmate_pilot_feedback_created_idx
on public.farmmate_pilot_feedback (created_at desc);

alter table public.farmmate_pilot_feedback enable row level security;

revoke all on table public.farmmate_pilot_feedback from anon;
revoke all on table public.farmmate_pilot_feedback from authenticated;
grant all on table public.farmmate_pilot_feedback to service_role;

commit;
