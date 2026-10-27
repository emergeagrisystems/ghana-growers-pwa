# P09 Gate B validation record

Date: 2026-10-27  
Branch: `codex/p09-stage1-gate-a`  
Gate A base: `8b5a7de79ad6efcb1d379d7a70c768002e540bbe`  
Rollback baseline: `68b234655d8204c4029f3df6b859b456c17238f9`

## Bounded change

The exact founder-approved generated-media disclosure is shown once with the Hero image, once for the five category images as a group, and once with the registration image:

> Illustrative AI-generated imagery. It does not depict actual Ghana Growers members, farms or transactions.

Each visual relationship is programmatically connected with `aria-describedby`. The Hero and registration disclosures use a dark translucent backing; the category disclosure uses the existing muted text token. No image, crop, layout section, workflow, data loader, or business rule changed.

## Staging restoration and preservation

Only Supabase project `ecluxmyxqofkbzcyurlf` (Ghana Growers — Staging) was restored. It returned `ACTIVE_HEALTHY`. Read-only checks confirmed:

- 2 Auth users;
- all 9 repository migrations recorded through `20260925182739_rc1_farmmate_failed_attempt_recovery`;
- expected public application tables, including `farmmate_usage_events`;
- 77 existing FarmMate usage events;
- 7 storage buckets;
- RLS enabled on the application tables inspected;
- 3 public policies, 3 storage policies and 12 public functions.

No reset, relink, migration, schema, policy, bucket, Auth, storage-object or business-record write was performed. Production Supabase `bfasogvmesswweribsji` remained `INACTIVE` and was not targeted.

## Local verification

- TypeScript: PASS.
- ESLint: PASS, no warnings.
- Production build: PASS (115 routes generated).
- Automated tests: PASS, 504/504.
- Responsive checks at 320, 390, 768 and 1440 pixels: all three disclosures visible; no horizontal document overflow.
- Computed disclosure contrast: Hero/registration text at least 11.45:1 against the darkest guaranteed overlay composite; category text 6.15:1 against white.
- Public Stage 2 Market navigation remains absent and legacy routes remain truthfully contained.
- Farmer, supplier and buyer workflows remain independently disabled.
- Public DTO privacy and notification-adapter duplicate/failure tests remain passing.
- Original media files remain outside public serving paths; Gate B did not alter the Gate A derivative/provenance register.

## Protected systems

`main`, Production deployment, Production Supabase, staging schema/Auth/data, Mama G behavior and accounting, Directory/Profile business logic, deferred Marketplace logic, and production email configuration are unchanged. No external notification was sent and no public workflow was submitted.

## Deployment boundary

The candidate may be deployed only as a Vercel Protected Preview. It must not receive a Production target or a custom/Production domain alias. Record the deployment identity and post-deployment checks outside this source record after Vercel confirms the immutable deployment.
