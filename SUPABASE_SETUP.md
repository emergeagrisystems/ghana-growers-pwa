# Ghana Growers Supabase Setup

This document covers the Phase 1 Supabase setup for persisting admin-created records.

## Required Environment Variables

Set these in Vercel for Production and Preview:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

For local testing, add the same values to `.env.local`.

## Important Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` must only be used on the server.
- Never import the server admin Supabase helper into a client component.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` through `NEXT_PUBLIC_` variables.
- The current `/admin` area still uses `ADMIN_ACCESS_KEY` as a lightweight Phase 1 access gate.
- Before managing sensitive production data, add full admin authentication, roles, audit logs, and stricter server-side authorization.

## SQL Schema

The Phase 1 SQL migration is located at:

```text
supabase/migrations/001_phase_1_core_records.sql
```

Admin Learn Article persistence uses this follow-up migration:

```text
supabase/migrations/002_learn_articles.sql
```

The operational verification workflow uses this migration:

```text
supabase/migrations/003_verification_workflow.sql
```

It creates these tables:

- `farmers`
- `suppliers`
- `marketplace_listings`
- `buyer_requests`
- `market_prices`
- `learn_articles` when the follow-up migration is run

The verification workflow migration adds:

- `verification_status`
- `verification_date`
- `verified_by`
- `verification_notes`

for farmers, suppliers, and buyer requests where appropriate.

Each table includes an `id`, timestamps, status fields, and Ghana Growers operational fields such as region, district, verification status, contact details, and listing/request metadata.

## How To Run The SQL

1. Open the Supabase project dashboard.
2. Go to **SQL Editor**.
3. Open `supabase/migrations/001_phase_1_core_records.sql` in this repository.
4. Copy the full SQL contents.
5. Paste into Supabase SQL Editor.
6. Run the query.
7. Repeat for `supabase/migrations/002_learn_articles.sql` if Learn Article persistence is needed.
8. Repeat for `supabase/migrations/003_verification_workflow.sql` to enable the verification queue workflow.
9. Confirm the tables appear under **Table Editor**.

## Current App Behavior

The app keeps all current local JSON/data files as fallback. Public pages continue working even if Supabase is empty.

Phase 1 admin add forms now attempt to create records in Supabase for:

- Farmers
- Suppliers
- Marketplace Listings
- Buyer Requests
- Market Prices
- Learn Articles

Edit forms remain client-side workflow previews until update/archive API routes are added.

## API Routes

The server-side create routes are:

```text
src/app/api/admin/farmers/route.ts
src/app/api/admin/suppliers/route.ts
src/app/api/admin/marketplace-listings/route.ts
src/app/api/admin/buyer-requests/route.ts
src/app/api/admin/market-prices/route.ts
src/app/api/admin/learn-articles/route.ts
src/app/api/admin/verifications/route.ts
```

These routes:

- Require the existing admin access flow.
- Use a signed HTTP-only admin session cookie.
- Accept the same signed admin session token in the `x-ghana-growers-admin-session` request header.
- Use `SUPABASE_SERVICE_ROLE_KEY` only on the server.
- Validate required fields before inserting.
- Return friendly errors if Supabase is not configured or the insert fails.

## Recommended Migration Path

1. Run the Phase 1 SQL migration in Supabase.
2. Keep the local JSON files as the public-site fallback.
3. Test each admin add form from `/admin`.
4. Add seed scripts to import existing JSON records into Supabase.
5. Update public pages to read from Supabase first and local JSON second.
6. Add update/archive API routes for edit actions.
7. Add proper admin authentication and activity logs.
8. Move uploaded images to Supabase Storage when media management is needed.
