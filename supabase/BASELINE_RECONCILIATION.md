# Production Baseline Reconciliation Plan

Baseline version: `20260721190621`

This plan is intentionally not executed by the preparation work.

1. Take a fresh production schema backup and relevant data backup.
2. Run `supabase/review/precheck_production_baseline.sql` and retain its output.
3. Compare production with the reviewed baseline and disposable test output.
4. From a linked, authenticated Supabase CLI session, mark only the baseline:

   ```powershell
   npx --yes supabase@latest migration repair 20260721190621 --status applied --linked
   ```

5. Confirm local and remote history align:

   ```powershell
   npx --yes supabase@latest migration list --linked
   ```

6. Confirm there is no historical backlog and no SQL would run:

   ```powershell
   npx --yes supabase@latest db push --dry-run --linked
   ```

7. Run `supabase/review/verify_production_baseline.sql` and compare its row
   counts with the precheck output.
8. Convert the reviewed FarmMate feedback privilege proposal into a new,
   uniquely timestamped active migration after the baseline.
9. Test that new hardening migration in a disposable or staging database.
10. Deploy the hardening migration through the normal migration workflow.

Never mark archived migrations 001-035 individually once this baseline
strategy is adopted. A history repair changes migration records only; it does
not apply or roll back schema SQL. If the baseline history entry is recorded
incorrectly, stop all pushes, verify the database is unchanged, and repair only
that baseline version back to `reverted` after review.
