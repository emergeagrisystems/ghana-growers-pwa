create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action_type text not null check (action_type in ('Create', 'Edit', 'Verify', 'Archive')),
  entity_type text not null check (entity_type in ('Farmer', 'Supplier', 'Marketplace Listing', 'Buyer Request')),
  entity_id text,
  entity_name text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_activity_log enable row level security;

create index if not exists admin_activity_log_created_at_idx
  on public.admin_activity_log (created_at desc);

create index if not exists admin_activity_log_entity_idx
  on public.admin_activity_log (entity_type, entity_id);

comment on table public.admin_activity_log is
  'Internal Ghana Growers audit trail for admin create, edit, verify, and archive actions.';
