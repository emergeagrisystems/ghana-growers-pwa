# Work 09 — isolated campaign, 18 November 2026

Status: local implementation and validation complete; founder review next. No push or deployment.

## Authority, baseline and isolation

Governing authority is the founder's isolated Coming Soon + Countdown + Mama G Teaser instruction. This is not the Admin release stream.

- Base: `4f26f4f56fd0f3e80f00386f034c54837bd82d34`.
- Branch: `codex/p09-prelaunch-countdown-mamag-teaser`, separate clean worktree from that base.
- Protected Admin branch remains `f2e4beecff50d4f9751e8f11a030d62f68a6628e`.
- Remote main remains `a008a17f90013ce5fd98dd79058e2aa5c452d906`.
- Read-only Vercel recheck: www.ghana-growers.com still aliases `dpl_E9rFxuwKX1PiaSLJcXT5hHyKkdJ5`, READY, Production SHA `4f26f4f56fd0f3e80f00386f034c54837bd82d34`.
- No database, Auth, Storage, environment, flag, permission or public traffic operation. No live records or paid AI calls.

Receiving checks confirmed local Git access, clean base, filesystem writes, Node 24.22.1, Next 14.2.35, React 18.3.1, TypeScript, lint, installed Playwright 1.62.1 and Chrome. Responsive/security/accessibility work uses the existing architecture; the React best-practices skill review was applied. No database or design-tool access is necessary. The 13-point receiving record is retained with local Work evidence.

The Vercel Git link to this repository is confirmed. Existing Work evidence records automatic Git deployments. The connector's current project summary does not expose the current pause/ignore toggle, so a push must be treated as deployment-capable. The branch remains local. Reconfirm the trigger and isolation before a separately authorised push.

## Implementation contract

`/launching-soon` is dynamic. Only the countdown is a new client component; acquisition, teaser, benefits and the campaign shell render on the server. Existing DM Sans and temporary text-only Ghana Growers branding are reused. Scoped CSS does not restyle the normal Homepage.

The canonical target is `2026-12-04T05:00:00Z`. Initial server and client markup match and show the exact dated fallback. After hydration, tabular digits update once per second with `aria-live="off"`; the interval cleans up and stops at zero. The zero state announces only the approved opening copy. There is no release, request, configuration or routing effect in the timer.

When SITE_PRELAUNCH is false, the old campaign path redirects 307 to `/` with `private, no-store, max-age=0`; the page also has a server redirect. Normal Homepage and Mama G routing resumes. The existing service worker does not add campaign HTML to its cache.

### Exact acquisition allowance

| Audience | Page | API |
| --- | --- | --- |
| Farmer | /join/farmer | /api/farmer-registration |
| Supplier/service | /become-a-supplier | /api/supplier-registration |
| Product | /submit-listing | /api/listing-submissions |
| Buyer request | /submit-buyer-request | /api/buyer-request-submissions |

Three audience blocks replace the old four-card presentation. All four existing server-owned flags remain authoritative. Closed actions say Currently closed, retain their truthful closed destination, show no submission form and reject API submission with 503. Buyer Registration remains closed.

Only existing supplier aliases `/join/supplier` and `/supplier-registration`, four exact legal routes (`/privacy-policy`, `/terms-of-use`, `/privacy`, `/terms`), SEO routes, controlled admin/Auth/internal-preview dependencies and asset directories are retained. Adjacent intake lookalikes are not allowed.

Unauthorised public `/farmer-hub` and feedback requests remain behind the campaign. `/api/farmmate` and every `/api/farmmate/*` request return JSON 503 PRELAUNCH_UNAVAILABLE before product, AI and accounting handlers. The existing signed, expiring internal-preview cookie is preserved; no new bypass exists. Preview Supabase isolation is checked before this policy. Existing quotas and underlying product files are unchanged.

The static teaser contains the two approved questions, status, artwork and illustrative field/microphone. It has no usable controls, links to the product, requests, permissions or product imports. Illustrative controls are hidden from assistive technology. No fabricated answers or claims were added.

## Reused media provenance

No new or edited image bytes. The locked clay-map derivative preserves the full composition and is labelled as an illustration in its alternative text, not actual network coverage. Source package, original hash, generation ID and claim boundary remain in `gate-a-media-provenance.json`. The existing wordmark comes from `nov07-homepage-media.json`.

| Existing file | SHA-256 verified against its register |
| --- | --- |
| public/stage1-media/hero-clay-map-640.webp | 7A29E632BE8D5BB1E4E7170748F0757AB768579A3E122DEF36383E1146C59F53 |
| public/stage1-media/hero-clay-map-1088.webp | 6878F60252A97C67473B43228326DF26527F67430721E8E55779CB3423189C5D |
| public/stage1-media/hero-clay-map-1600.webp | 5C586F41697ED57C0A2815D2DF38EE6D77B1504AFC192B679B5FFD13C55C67DE |
| public/hm1/nov07/mama-g-dark.png | 3DC34F213BC9C6B54817D2AB60A4189F7D0BE76ECFF309FC72F263B1A212533C |

## Measured local validation

All results below are LOCAL, not deployed or physical-device acceptance. The server uses fictional credentials and a non-service loopback database address; a test-only preload blocks external server fetch. Browser requests are constrained to the local origin. No ON-state intake POST or authorised AI request is sent.

| Check | Result |
| --- | --- |
| Existing repository regression command | PASS: 518 tests, including all 451 FarmMate checks |
| RC1 hardening | PASS |
| New countdown/policy/flag/static-teaser tests | PASS: 6 tests |
| Actual middleware request/auth/method/isolation matrix | PASS: 98 cases |
| TypeScript | PASS |
| Lint | PASS, no warnings/errors |
| Release build | PASS |
| Built Next app at 320, 390, 768, 1440 | PASS: no overflow, loaded images, one h1/main, zero console/page errors |
| Contrast | Minimum measured visible text contrast 5.33:1 |
| CTA size / keyboard focus | Minimum 48px height; visible 3px focus outline |
| Countdown | Stable tick dimensions, before/zero/after, same UTC outcome in Honolulu and Tokyo |
| Non-JavaScript / hydration / reduced motion | PASS dated server fallback, no hydration errors, reduced-motion browser checks |
| Each of four workflows independently OFF | PASS correct closed page, zero forms, API 503, other flags remain ON in local fixture |
| ON acquisition pages | PASS forms reachable; no submission made |
| Gated public Mama G APIs | PASS actual built server returns JSON 503 |
| Existing internal preview | PASS local signed-cookie page access; invalid/expired cases rejected in middleware tests |
| Gate OFF | PASS normal Homepage/Mama G render and campaign redirects without a loop |
| HTML/RSC privacy | PASS no fictional private credential canary or Production project origin serialized |
| Teaser browser requests | Zero Ask, Crop Doctor, usage, provider or POST requests |
| Media hashes | PASS all four reused files |

Browser screenshots use a fixed test clock (18 November 2026, 12:00 UTC) and local ON flags for review of approved CTA wording. They do not describe hosted flag changes. Evidence is held outside public serving paths in Work's `outputs/prelaunch-campaign-2026-11-18`: four full-page screenshots, zero-state screenshot, browser JSON, routing/regression/build/lint logs and receiving preflight. No audit data is published by the application.

The initial browser harness exposed two test-only assumptions: HTML plus RSC repeats label text, and NextURL canonicalises 127.0.0.1 to localhost. The harness now counts rendered links and uses the canonical local origin. Final execution passed; the application was not changed to suppress either assertion.

Not run: hosted Protected Preview, physical Android, manual screen-reader session, live intake writes, live AI or database tests. These are not claimed as passed.

## Preview recommendation and rollback

Next gate: founder review and separately authorised exact-commit Protected Preview. Before pushing/deploying, verify the current Git deployment trigger and branch protection, establish explicit branch-only staging bindings and Vercel protection, verify no effective Production credentials, use SITE_PRELAUNCH=true on this branch only and keep four Preview intakes OFF. Recheck all route boundaries and screenshot widths on the actual protected deployment. Any staged ON workflow validation or fixtures need their own existing/explicit authority. Do not alter Admin bindings or use Production configuration.

No Production release or consolidation is authorised. If Admin reaches Production first, separately reconcile against that new final release; do not silently merge streams. No countdown event can launch the site.

Before deployment, rollback means revert/discard only this isolated campaign commit/worktree. Do not change Production or live flags. For a later approved public cutover, first record the then-current Production deployment and configuration, preserve live intake flags and records, and approve the gate/config rollback separately. Reverting code alone does not reverse environment changes. No migration or data rollback is needed for this campaign.

COMING SOON + COUNTDOWN + MAMA G TEASER — READY FOR FOUNDER PREVIEW REVIEW
