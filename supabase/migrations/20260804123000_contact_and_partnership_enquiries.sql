create table public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  submission_key text not null unique,
  payload_fingerprint text not null,
  enquiry_type text not null,
  name text not null,
  email text not null,
  phone_whatsapp text,
  organisation text,
  subject_interest text,
  website text,
  message text not null,
  status text not null default 'New',
  source_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_enquiries_type_check check (enquiry_type in ('Contact', 'Partnership')),
  constraint contact_enquiries_status_check check (status in ('New', 'Contacted', 'Closed')),
  constraint contact_enquiries_submission_key_check check (submission_key ~ '^[0-9a-f]{64}$'),
  constraint contact_enquiries_payload_fingerprint_check check (payload_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint contact_enquiries_source_path_check check (source_path in ('/contact', '/partner-with-us')),
  constraint contact_enquiries_name_length_check check (char_length(name) between 1 and 120),
  constraint contact_enquiries_email_length_check check (char_length(email) between 3 and 254),
  constraint contact_enquiries_message_length_check check (char_length(message) between 1 and 3000)
);

comment on table public.contact_enquiries is
  'Private Contact and Partnership enquiries submitted through Ghana Growers public forms.';
comment on column public.contact_enquiries.public_reference is
  'Safe reference shown to the submitter and Admin. It is not the internal UUID.';
comment on column public.contact_enquiries.submission_key is
  'HMAC-derived idempotency key. Never return it in public or Admin payloads.';
comment on column public.contact_enquiries.payload_fingerprint is
  'HMAC-derived payload fingerprint used only for exact-retry conflict detection.';

create index contact_enquiries_created_at_idx
  on public.contact_enquiries (created_at desc);
create index contact_enquiries_type_status_created_idx
  on public.contact_enquiries (enquiry_type, status, created_at desc);

create or replace function public.set_contact_enquiries_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger contact_enquiries_updated_at
before update on public.contact_enquiries
for each row execute function public.set_contact_enquiries_updated_at();

alter table public.contact_enquiries enable row level security;
alter table public.contact_enquiries force row level security;

revoke all on table public.contact_enquiries from public, anon, authenticated;
grant select, insert, update, delete on table public.contact_enquiries to service_role;

revoke all on function public.set_contact_enquiries_updated_at() from public, anon, authenticated;
grant execute on function public.set_contact_enquiries_updated_at() to service_role;
