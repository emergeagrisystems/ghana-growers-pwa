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

Crop Doctor uses AI image analysis to provide practical crop health guidance. In Version 1, uploaded crop photos are processed in memory for analysis and are not permanently stored by Ghana Growers. Crop Doctor guidance is not a guaranteed diagnosis. Farmers should contact a qualified agricultural extension officer for serious, spreading, or high-risk crop problems.

## Production Usage Storage

Production must apply the Supabase migration in `supabase/migrations/030_farmmate_usage_events.sql` before OpenAI is enabled. The required table is:

```sql
create table if not exists public.farmmate_usage_events (
  id uuid primary key default gen_random_uuid(),
  anonymous_user_hash text not null,
  tool text not null check (tool in ('ask_farmmate', 'crop_doctor')),
  created_at timestamptz not null default now()
);

create index farmmate_usage_events_lookup_idx
  on public.farmmate_usage_events (anonymous_user_hash, tool, created_at desc);
```

The migration also adds individual indexes for `anonymous_user_hash`, `tool`, and `created_at`, and enables RLS so service-role server code manages usage events.

## Fail-Safe Behavior

In production, FarmMate Credits must fail closed. If Supabase is configured but the usage table is missing, a usage check fails, or a usage write fails, the app must not silently grant extra AI usage. Ask FarmMate returns the local FarmMate Brain fallback with: "FarmMate AI is temporarily limited, but you can still use the local guidance."

Crop Doctor must also fail safely. If image analysis fails, FarmMate does not consume a Crop Doctor credit and shows a friendly fallback message encouraging the farmer to describe what they see in Ask FarmMate.

Server logs should warn about missing Supabase config, missing usage table, failed usage checks, and failed usage writes. These details are never shown to farmers.

## Local Development

Local development and tests may use an in-memory FarmMate Credits fallback when Supabase is missing or unavailable. This fallback is not production-safe because it does not persist across deployments, server restarts, or multiple server instances.

## Future Premium Possibility

Future versions may add signed-in accounts, higher limits, paid plans, or partner-sponsored credits. Version 1 does not include login, payments, or premium plans.
