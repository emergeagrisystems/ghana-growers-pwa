-- Buyer Request Submission & Demand Generation
-- Creates a review queue for public buyer demand before publishing live buyer requests.

create table if not exists public.buyer_request_applications (
  id uuid primary key default gen_random_uuid(),
  buyer_name text not null,
  company_name text,
  phone_number text not null,
  whatsapp_number text not null,
  region text not null,
  district text not null,
  product_needed text not null,
  quantity text not null,
  preferred_delivery text,
  deadline date not null,
  notes text,
  buyer_type text not null default 'Buyer',
  status text not null default 'New' check (status in ('New', 'Under Review', 'Approved', 'Rejected', 'Published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_buyer_request_applications_updated_at on public.buyer_request_applications;
create trigger set_buyer_request_applications_updated_at
before update on public.buyer_request_applications
for each row execute function public.set_updated_at();

alter table public.buyer_request_applications enable row level security;

create index if not exists buyer_request_applications_status_idx
  on public.buyer_request_applications (status, created_at desc);

create index if not exists buyer_request_applications_product_idx
  on public.buyer_request_applications (product_needed);

create index if not exists buyer_request_applications_region_idx
  on public.buyer_request_applications (region);

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
      and (
        pg_get_constraintdef(con.oid) ilike '%entity_type%'
        or pg_get_constraintdef(con.oid) ilike '%action_type%'
      )
  loop
    execute format('alter table public.admin_activity_log drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table public.admin_activity_log
  add constraint admin_activity_log_action_type_check
  check (
    action_type in (
      'Create',
      'Edit',
      'Verify',
      'Archive',
      'Review',
      'Approve',
      'Reject',
      'Convert',
      'View',
      'Contact',
      'Complete',
      'Close',
      'Submit',
      'Publish',
      'Marked Featured',
      'Removed Featured',
      'Featured Expired',
      'Featured Note Updated'
    )
  );

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
      'Buyer Request Application',
      'Match Opportunity',
      'Lead Request',
      'Featured Enquiry'
    )
  );

comment on table public.buyer_request_applications is
  'Public buyer demand applications submitted for Ghana Growers admin review before publishing to the Buyer Demand Board.';
