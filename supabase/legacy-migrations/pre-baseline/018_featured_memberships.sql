-- Featured Membership System
-- Adds visibility-management fields for farmers, suppliers, and marketplace listings.

alter table public.farmers
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_until date,
  add column if not exists featured_note text;

alter table public.suppliers
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_until date,
  add column if not exists featured_note text;

alter table public.marketplace_listings
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_until date,
  add column if not exists featured_note text;

-- Preserve the older marketplace featured flag by copying it into the new field.
update public.marketplace_listings
set is_featured = true
where featured = true
  and is_featured = false;

create index if not exists farmers_featured_idx
  on public.farmers (is_featured, featured_until);

create index if not exists suppliers_featured_idx
  on public.suppliers (is_featured, featured_until);

create index if not exists marketplace_listings_featured_idx
  on public.marketplace_listings (is_featured, featured_until);

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
      and pg_get_constraintdef(con.oid) ilike '%action_type%'
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
      'Marked Featured',
      'Removed Featured',
      'Featured Expired',
      'Featured Note Updated'
    )
  );

comment on column public.farmers.is_featured is
  'Marks a farmer for featured placement while featured_until is not expired.';

comment on column public.suppliers.is_featured is
  'Marks a supplier for featured placement while featured_until is not expired.';

comment on column public.marketplace_listings.is_featured is
  'Marks a listing for featured placement while featured_until is not expired.';

