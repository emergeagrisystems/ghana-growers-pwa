-- Featured Membership Enquiry Flow
-- Collects public interest in paid/priority visibility before payments are introduced.

create table if not exists public.featured_membership_enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  whatsapp text not null,
  email text,
  role text not null check (role in ('Farmer', 'Supplier', 'Listing Owner')),
  profile_or_listing_name text not null,
  feature_request text not null,
  message text,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Approved', 'Rejected', 'Closed'))
);

alter table public.featured_membership_enquiries enable row level security;

create index if not exists featured_membership_enquiries_status_idx
  on public.featured_membership_enquiries (status);

create index if not exists featured_membership_enquiries_created_at_idx
  on public.featured_membership_enquiries (created_at desc);

comment on table public.featured_membership_enquiries is
  'Public enquiries from farmers, suppliers, and listing owners interested in featured placement on Ghana Growers.';

-- Older installs may have narrow activity log CHECK constraints.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'admin_activity_log'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%entity_type%'
  loop
    execute format('alter table public.admin_activity_log drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table public.admin_activity_log
  add constraint admin_activity_log_entity_type_check
  check (
    entity_type in (
      'Farmer',
      'Supplier',
      'Marketplace Listing',
      'Buyer Request',
      'Farmer Application',
      'Buyer Application',
      'Supplier Application',
      'Listing Submission',
      'Buyer Request Submission',
      'Match Opportunity',
      'Lead Request',
      'Featured Enquiry'
    )
  );

