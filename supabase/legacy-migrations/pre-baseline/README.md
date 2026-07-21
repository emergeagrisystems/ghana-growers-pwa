# Pre-Baseline Migration Archive

These 37 SQL files, covering version prefixes 001-035, describe Ghana Growers
development before the production baseline introduced by
`20260721190621_production_baseline.sql`.

They are retained byte-for-byte for audit history. They are not safe to replay
against the current production database because production only partially
represents migrations 001-030, migrations 031-035 were applied manually, and
the official Supabase migration-history table was absent when the baseline was
prepared.

Two historical version prefixes are duplicated:

- `024_farmer_onboarding_fields.sql`
- `024_supplier_editorial_workspace.sql`
- `025_farmer_editorial_workspace.sql`
- `025_marketplace_listing_description.sql`

Do not move these files back into `supabase/migrations`, run them against
production, or mark them individually as applied. The active migration history
now starts from the timestamped production baseline.

The archived SQL remains intentionally unchanged, including obsolete or
partially deployed objects. Any future schema change must use a new unique
timestamped migration after the baseline.
