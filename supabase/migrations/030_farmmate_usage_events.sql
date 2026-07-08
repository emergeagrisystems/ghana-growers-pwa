create table if not exists public.farmmate_usage_events (
  id uuid primary key default gen_random_uuid(),
  anonymous_user_hash text not null,
  tool text not null check (tool in ('ask_farmmate', 'crop_doctor')),
  created_at timestamptz not null default now()
);

create index if not exists farmmate_usage_events_anonymous_user_hash_idx
  on public.farmmate_usage_events (anonymous_user_hash);

create index if not exists farmmate_usage_events_tool_idx
  on public.farmmate_usage_events (tool);

create index if not exists farmmate_usage_events_created_at_idx
  on public.farmmate_usage_events (created_at desc);

create index if not exists farmmate_usage_events_lookup_idx
  on public.farmmate_usage_events (anonymous_user_hash, tool, created_at desc);

alter table public.farmmate_usage_events enable row level security;

drop policy if exists "Service role manages FarmMate usage events" on public.farmmate_usage_events;

create policy "Service role manages FarmMate usage events"
  on public.farmmate_usage_events
  for all
  to service_role
  using (true)
  with check (true);
