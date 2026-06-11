-- Ghana Growers Buyer Request Matching activity support
-- Run this after the existing admin_activity_log migration if your table has CHECK constraints.

alter table if exists public.admin_activity_log
  drop constraint if exists admin_activity_log_action_type_check;

alter table if exists public.admin_activity_log
  add constraint admin_activity_log_action_type_check
  check (action_type in ('Create', 'Edit', 'Verify', 'Archive', 'Review', 'Approve', 'Reject', 'Convert', 'View', 'Contact', 'Close'));

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
    'Match Opportunity'
  ));
