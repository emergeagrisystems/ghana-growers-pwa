# Work 09 · Admin implementation checkpoint

**Repository work is ready for founder review. Shared CRM and supplier media remain at the database/storage approval gate.**

Released parent: `4f26f4f56fd0f3e80f00386f034c54837bd82d34`. Local branch: `codex/p09-admin-crm-implementation`. Production deployment verified at intake: `dpl_E9rFxuwKX1PiaSLJcXT5hHyKkdJ5`. Existing Production rollback: `dpl_FRQoSrM8euRDvAB76u9XfE3C4JrD`. The repository rollback for this branch is its released parent. No branch push, Preview deployment, migration, Storage operation or change to Auth or staff permissions was part of this checkpoint.

## Available locally

- The existing authenticated `/admin` opens on Today’s work. It shows the four intake queues, oldest waiting records, quick-read summaries and explicit unavailable states for shared follow-ups and actual first replies. Counts use the records that could be read. A failed queue is never silently counted as empty.
- Find a record accepts the actual buyer reference, private name or phone. Opening and returning from a case retains its search and filters. Buyer delivery date and staff follow-up date have separate meanings. Verified contact actions use only the intended buyer or linked seller. Opening WhatsApp, calling and copying do not record contact. The history panel makes no identity inference. Draft handovers exist only in the open tab.
- All admin tools retains the released destinations, including their existing aliases. Profiles combines farms, suppliers and services, using existing supplier records and publication rules. The existing staff editor remains the route for editing, private preview, review and publication; eligible profiles also link to their public page. Approved registrations with an existing linked profile lead directly to that profile.
- Farmer galleries keep the selected order across new and existing images. A verified public copy belongs to one Save attempt and cannot overwrite another copy. Saving compares the loaded profile version. On a definite conflict only the losing attempt's own public copy is removed. On an uncertain acknowledgement both copies are retained, and staff can compare the stored version in another tab without discarding their draft. Existing private registration originals are preserved.
- Supplier selection creates a temporary browser preview only. The staff member can replace, remove or reset it. Save is unavailable while a supplier photo is pending. Text-only saves keep working under the version check. The old public upload and early supplier promotion paths are closed. Historical audit insertion now checks whether the database actually acknowledged the record.

## Local verification

| Check | Result |
|---|---|
| FarmMate regression | 451/451 |
| Other existing automated tests | Farmer registration 11, farmer application admin 5, contact enquiries 9, approval counts 19, queue notifications 4, Gate A 9, Gate B 2, Stage 1 public intake 8. All pass. |
| New staff rules and media | Business-day boundaries, missing calendar, recipient verification, handover date in GMT, mixed gallery ordering, competing saves, winning-image preservation, uncertain acknowledgement, stale supplier version and unavailable attribution. All pass using local fixtures. |
| RC1 hardening | Passed separately. No provider calls. |
| TypeScript, lint, release build | Passed locally. The build had no hosted Supabase configuration. Public-profile loaders reported configuration unavailable during static generation. |
| Chrome 1440 × 900 and 390 × 844 | Authenticated local app with fictional HTTP responses. Covers protected-route denial, mobile keyboard focus and Menu/Escape, search → buyer case → same results, contact confirmation, disabled CRM writes, private history, visible profiles and tools, supplier file selection and Reset, quiet day and failed queue. No writes were sent to the fixture service. |
| Hosted or two-person acceptance | Pending separate authority and a second verified staging staff account. Local fixture roles are not a two-person acceptance result. |

## Changed files

| Area | Repository-relative paths |
|---|---|
| Admin entry and display | `src/app/admin/page.tsx`, `src/components/admin/StaffShell.tsx`, `Today.tsx`, `Tools.tsx`, `Records.tsx`, `CaseDetail.tsx`, `staff.module.css` (the last five in `src/components/admin/`); `src/components/AdminDashboard.tsx` |
| Admin-only public-shell visibility | `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/FloatingWhatsAppButton.tsx` |
| Staff reads, navigation and CRM | `src/lib/adminReadModel.ts`, `src/lib/adminDestinations.ts`, `src/lib/adminQueueLabels.ts`, `src/lib/adminCrm.ts`, `src/lib/adminHandover.ts`, `src/lib/adminActivity.ts`, `src/app/api/admin/case-seller/route.ts` |
| Profiles and media | `src/app/admin/profiles/[kind]/[recordKey]/page.tsx`, `src/components/AdminProfileEditor.tsx`, `src/lib/adminProfileEditor.ts`, `src/lib/profileApplications.ts`, `src/lib/farmerProfileMedia.ts`, `src/lib/profileGalleryOrder.ts`, `src/lib/supabase/admin.ts`, `src/app/api/admin/profile-editor/route.ts`, `src/app/api/admin/profile-applications/media/route.ts`, `src/app/api/admin/uploads/route.ts` |
| Tests | `package.json`, `tests/farmmate-regression.test.ts`, `tests/admin-crm.test.ts`, `tests/admin-profile-media.local.cjs`, `tests/admin-workspace.browser.cjs` |
| Decision records | This checkpoint and [Persistence approval](./Persistence-approval.md), both under `docs/admin-crm/` |

## Decision and remaining limits

The [unapplied proposal](./Persistence-approval.md) sets out five private tables, restoration of the missing legacy audit table, exact RPCs and grants, the supplier promotion sequence, acceptance and rollback. Existing farmer photo management needs no new bucket or table. The supplier proposal reuses existing buckets with new object-key prefixes and requires a successful profile Save before public copying.

Until staging approval, staff cannot share an owner, note or follow-up; record a first reply, seller contact, status outcome or confirmed buyer link; or publish a newly selected supplier image. A reviewed holiday calendar and a historical evidence cutoff are also required before operational overdue reporting. The next decision is whether to authorise the proposed changes **on staging only**. A protected Preview, real two-person acceptance and any Production release remain later gates.
