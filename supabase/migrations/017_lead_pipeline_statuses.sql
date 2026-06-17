-- Ghana Growers lead pipeline statuses
-- Replaces the old Closed terminal status with Completed and adds Lost.

update public.lead_requests
set status = 'Completed'
where status = 'Closed';

alter table public.lead_requests
  drop constraint if exists lead_requests_status_check;

alter table public.lead_requests
  add constraint lead_requests_status_check
  check (status in ('New', 'Contacted', 'Negotiating', 'Completed', 'Lost'));

alter table if exists public.admin_activity_log
  drop constraint if exists admin_activity_log_action_type_check;

alter table if exists public.admin_activity_log
  add constraint admin_activity_log_action_type_check
  check (action_type in ('Create', 'Edit', 'Verify', 'Archive', 'Review', 'Approve', 'Reject', 'Convert', 'View', 'Contact', 'Complete', 'Close', 'Submit'));

alter table if exists public.admin_activity_log
  drop constraint if exists admin_activity_log_entity_type_check;

alter table if exists public.admin_activity_log
  add constraint admin_activity_log_entity_type_check
  check (entity_type in (
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
    'Lead Request'
  ));
