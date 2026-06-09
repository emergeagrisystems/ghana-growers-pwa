-- Ghana Growers verification workflow
-- Adds operational verification fields for farmers, suppliers, and buyers.

alter table public.farmers
  add column if not exists verification_date date,
  add column if not exists verified_by text,
  add column if not exists verification_notes text;

alter table public.suppliers
  add column if not exists verification_date date,
  add column if not exists verified_by text,
  add column if not exists verification_notes text;

alter table public.buyer_requests
  add column if not exists verification_date date,
  add column if not exists verified_by text,
  add column if not exists verification_notes text;

update public.farmers
set verification_status = 'Pending'
where verification_status is null
   or verification_status in ('Pending Verification', 'Active Seller');

update public.suppliers
set verification_status = 'Pending'
where verification_status is null
   or verification_status in ('Pending Verification');

update public.buyer_requests
set verification_status = 'Pending'
where verification_status is null
   or verification_status in ('Pending Verification');

create index if not exists farmers_verification_status_idx on public.farmers(verification_status);
create index if not exists suppliers_verification_status_idx on public.suppliers(verification_status);
create index if not exists buyer_requests_verification_status_idx on public.buyer_requests(verification_status);
