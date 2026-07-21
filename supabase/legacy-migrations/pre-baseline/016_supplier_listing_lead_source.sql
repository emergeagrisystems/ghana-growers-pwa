-- Supplier-owned listing lead capture support
-- Allows public Request Connection forms on supplier-owned marketplace listings
-- to be tracked separately from general marketplace listing leads.

alter table public.lead_requests
  drop constraint if exists lead_requests_source_type_check;

alter table public.lead_requests
  add constraint lead_requests_source_type_check
  check (source_type in ('Farmer', 'Supplier', 'Marketplace Listing', 'Supplier Listing'));
