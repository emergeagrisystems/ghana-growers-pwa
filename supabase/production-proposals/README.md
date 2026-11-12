# Production admin portability — UNAPPLIED

Founder authority: preparation and isolated rehearsal only, 12 November 2026.
Production database/Auth/environment/deployment and main remain locked.

These files are deliberately outside `supabase/migrations`. They are not an automatic CLI push queue.
The Supabase CLI generated the new versions. The original installed staging SQL is unchanged.
`.gitattributes` preserves exact SQL bytes across Windows/Git checkouts.

## Exact proposed order

1. `20261112132130_staff_crm_supplier_media_production.sql`
   SHA-256 `f99b510a96db8bdcc76f328b8e25e9eb7fd256e5d9e5c9040f38e4f355200f82`.
2. `20261112132131_staff_rpc_conflict_translation_production.sql`
   SHA-256 `2b54f4e0e8606c83b51a7405f349793c3f3c89419f1550182f96987f4f6bb66f`.

First is the staging-proven 20261110085057 statement with only Production cluster identity
`7642734024280108049`, supplier media origin `https://bfasogvmesswweribsji.supabase.co`,
and target-description corrections. Second changes only its cluster guard and predecessor
version/hash/description. Keep the first entire SQL text as one migration-history statement;
the second verifies its exact SHA-256. No historical backfill or relabelling.

Affected objects remain the five private staff_crm tables, nonlogin gg_staff_api role,
private helpers/bodies and six service-only public wrappers, compatibility admin_activity_log,
scoped supplier/lead grants and RLS, and restrictive supplier editor-prefix discovery policy.
No bucket creation, no farmer-media change, no public profile eligibility change.

## Local rehearsal scope

PostgreSQL 17.11, bound to localhost, repository schema only and fictional fixtures.
The unmodified Production artifact rejects the local cluster. Separate disposable test
projections retain strict identity checks but pin them to the measured local cluster and
its exact predecessor hash. The governed Production files are never weakened or changed
for testing. SQL runs atomically through the supported Supabase CLI; no hosted database.

Verified: installation postconditions, ownership/grants/RLS/wrappers, private/public read
boundaries, claims/version conflicts/replay/notes/follow-ups/first reply/link integrity,
multiple seller contacts, supplier Save/lease/Finish and Production media URL,
PT409 translation, exact wrapper reversion/reinstallation and containment rollback.
Managed Auth/Storage HTTP services are not emulated by this SQL scaffold; actual staging
and application browser/media regressions are separate evidence. This is not a fresh
Production-data restore or a successful restore of the historical recovery archive.

## Future execution gate — not authorised here

1. Fresh encrypted recovery after all protected submissions; checksum/readback and usable restore plan.
2. Recheck Production drift, exact SQL hashes, intended public intake enablement and current app rollback.
3. Attest service credential privately, or approve replacement from authoritative Production source;
   current write-only metadata is not sufficient proof.
4. Approve Auth Site URL `https://www.ghana-growers.com` and allowed recovery redirect
   `https://www.ghana-growers.com/admin/reset-password`. No `/admin/login` redirect is required
   by this flow: the application signs out locally and routes to login itself.
5. Use the existing confirmed, unbanned founder Production trusted-admin identity verified in the private release checkpoint. No new account.
6. Apply first exact counterpart transaction and history entry, inspect; stop on any discrepancy.
7. Apply second exact counterpart transaction/history, verify all six wrappers/grants/RLS and media origin.
8. Stage exact tested descendant using existing Production configuration, explicitly preserving
   `SITE_PRELAUNCH=false`, four enabled Production intakes, dedicated Production FarmMate values.
   Do not assign domains. Verify founder Auth, CRM, public privacy/pages and intake availability.
9. Promote that verified build without rebuilding only under final founder release authority.

## Recovery and rollback

App rollback is current Production `dpl_E9rFxuwKX1PiaSLJcXT5hHyKkdJ5` / `4f26f4f56fd0f3e80f00386f034c54837bd82d34`.
Do not revert to a historical build with closed intakes. Roll back app traffic first if needed,
drain CRM writers/media workers, and apply separately authorised containment, retaining all
cases/events/jobs/audit records and restrictive Storage policy. Never DROP the CRM schema
after staff use. The supplied wrapper-reversion SQL restores only the precise PT409 wrapper
change; it is not a schema removal. No schema downgrade is needed for the prior public app.

Retain media objects referenced by profiles, active jobs, previous URLs or uncertain outcomes.
Cleanup must prove a disposable unreferenced object and no live lease; no bulk prefix deletion.
Fresh recovery and final execution authority remain outstanding. Samuel remains deferred.
