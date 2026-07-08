# FarmMate Business Rules

GG FarmMate Version 1 is a public farming support tool. Farmers do not need accounts yet, so usage is managed with anonymous device-based FarmMate Credits.

## Free Public Usage Limits

- Ask FarmMate: 5 AI-assisted questions per 12 hours.
- Crop Doctor: 2 analyses per 12 hours.
- Crop Calendar: unlimited.
- Planting Advisor: unlimited.
- Learning: unlimited.

## Refresh Rule

FarmMate Credits renew every 12 hours. The refresh time is calculated from the oldest counted event still inside the current 12-hour window.

## Why Limits Exist

These limits protect Ghana Growers from unnecessary AI costs and API abuse while keeping FarmMate useful for farmers. When credits are finished, farmers can still use local FarmMate tools, Crop Calendar, Planting Advisor, and Learning Tips.

## Privacy

FarmMate does not store farmer names, phone numbers, emails, crop photos, or farm data for credit tracking. The browser stores a generated anonymous device ID in localStorage. The server hashes that anonymous ID before storing usage events.

Suggested production table:

```sql
create table farmmate_usage_events (
  id uuid primary key default gen_random_uuid(),
  anonymous_user_hash text not null,
  tool text not null check (tool in ('ask_farmmate', 'crop_doctor')),
  created_at timestamptz not null default now()
);

create index farmmate_usage_events_lookup_idx
  on farmmate_usage_events (anonymous_user_hash, tool, created_at desc);
```

If Supabase is not configured or the table is not available, the app falls back to an in-memory limiter for local development only. Production should use Supabase or equivalent server-side storage so limits work across deployments and server instances.

## Future Premium Possibility

Future versions may add signed-in accounts, higher limits, paid plans, or partner-sponsored credits. Version 1 does not include login, payments, or premium plans.
