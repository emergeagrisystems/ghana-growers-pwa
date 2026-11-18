# Work 09 — Coming Soon visual correction, 18 November 2026

Founder status: first visual direction REJECTED; functional implementation RETAINED; forest/gold single-screen composition AUTHORISED; founder visual acceptance PENDING. This record supersedes the visual presentation described in prelaunch-campaign-local-validation.md; that earlier evidence is retained.

## Receiving check and scope

The existing branch `codex/p09-prelaunch-countdown-mamag-teaser` was clean at exact starting commit `7b35adff0b0f403ef73acd47c278291c51bc3cdc`. The existing isolated worktree was reused. No new branch, chat, remote write or deployment. The protected Admin branch still points to `f2e4beecff50d4f9751e8f11a030d62f68a6628e`.

The attached founder correction brief is governing. Local React/Next, TypeScript, lint/build, Playwright/Chrome and repository access were verified. The Website UX & Product Design Reviewer criteria and Ghana Growers lens were applied to the visual review; the React best-practices review was applied to the components. No database, Figma, generation or hosted deployment capability is needed for this correction. The full 13-point receiving record is held with local evidence.

## Exact application and test changes

- `src/app/launching-soon/page.tsx`: one compact hero; locked heading and single promise sentence; existing clay map becomes decorative atmospheric art.
- `src/components/prelaunch/Campaign.module.css`: scoped forest/ivory/gold composition, large tabular timer, compact actions, teal/peach teaser, responsive sizing and natural reflow. No permanent/global identity tokens.
- `src/components/prelaunch/Acquisition.tsx`: Get Listed Free and Pre-Order lead; Register Business and List a Product are quieter accessible links. Flag lookups and destinations retained.
- `src/components/prelaunch/MamaGTeaser.tsx`: compact static teaser, existing wordmark, one sample question, no answer or working controls. Smaller mobile composition.
- `src/components/PrelaunchShell.tsx`: compact footer copyright and legal links; no repeated explanatory launch copy. Header styling is compact.
- `src/components/prelaunch/ComingBenefits.tsx`: removed; the What is coming section is no longer rendered.
- `tests/prelaunch.browser.cjs`: retained functional checks; added one-screen geometry, narrow two-row timer, clipping and image-ratio checks, text enlargement, equivalent zoom reflow, complete keyboard traversal and reduced-motion scrolling.
- This evidence document.

Countdown helper and component logic, middleware, intake allowlist, flag registry, internal-preview authentication, post-launch redirect, root layout, FarmMate logic/APIs/quotas and all public image bytes remain unchanged from the starting commit. No schema or migration.

## Visual result and geometry

The full surface uses forest #143A1F; countdown numerals are ivory with gold separators. Gold #DFAE4A marks the primary CTA. The Mama G teaser uses teal #244747 and peach #F3E5DE. The locked artwork is reused at 10% opacity with a soft mask and partial crop. Only this non-interactive decorative layer clips; content remains scrollable.

| Actual local viewport | Page height | Numeral size | Primary action bottom | Mama G teaser bottom |
| --- | ---: | ---: | ---: | ---: |
| 320 x 568 | 805px | 54px | 510.7px | 729.9px |
| 390 x 844 | 844px | 62.4px | 480.3px | 711.5px |
| 768 x 900 | 900px | 61.44px | 625.9px | 669.6px |
| 1440 x 900 | 900px | 112px | 655.3px | 673.2px |

The normal desktop and 390px phone compositions fit one viewport, including footer. At 320 x 568, the timer uses a deliberate 2 x 2 layout; the main actions are visible immediately. The teaser/footer require 237px of natural vertical continuation. No vertical clipping, hidden action, fixed content height or horizontal overflow is used to manufacture the result.

At 200% root-text enlargement, 390px and 320px layouts naturally extend to 1797px and 1891px. At the 360 x 225 CSS viewport equivalent to 400% zoom of 1440 x 900, content extends to 860px. No horizontal overflow or clipped content; all seven links are reachable, visible on focus and in logical order. These are automated local simulations, not physical-device zoom acceptance.

## Fresh validation

| Check | Result |
| --- | --- |
| Repository regressions | PASS: 518, including 451 FarmMate checks |
| RC1 hardening | PASS |
| Countdown, UTC/zero, policy and independent flags | PASS: 6 campaign tests |
| Actual middleware route/auth/isolation matrix | PASS: 98 cases |
| Built application browser checks | PASS: 320, 390, 768, 1440 |
| Canonical time, zero state and timezone independence | PASS, same target in Honolulu and Tokyo; zero changes copy only |
| Non-JavaScript fallback and hydration | PASS, dated fallback and no console/page errors |
| Independent workflow OFF states | PASS: each closed notice, zero forms and API 503; no live submissions |
| Internal preview, public Mama G blocking, post-launch redirect | PASS, existing signed-cookie mechanism and no-store redirect |
| Teaser requests / controls | Zero FarmMate/usage/provider/POST requests; no operational or focusable teaser control |
| HTML/RSC privacy canary | PASS |
| Accessibility | One h1/main; descriptive wordmark alt; decorative art hidden; CTA targets >=44px, primary >=48px; visible 3px focus |
| Contrast | Minimum solid-surface text ratio 6.22:1. Conservative white-art-at-10% bound for gold text is 4.60:1, cream 6.60:1 |
| Reduced motion | PASS: zero animations, no smooth page scroll in reduced-motion mode; visual clock ticks retained without continuous AT announcements |
| TypeScript / lint / release build | PASS; lint has no warnings/errors |

Only fictional local configuration is used. Server fetches to non-loopback hosts are blocked by the test preload; browser requests are local-only. ON-state screenshots show intended acquisition actions but do not change any live flag. Closed API tests run locally; no ON-state form or AI submission is sent.

Test-only findings were resolved without hiding application defects: the narrow timer was corrected from an accidental three-plus-one wrap to two-by-two; default IMG overflow clipping is distinguished from content clipping and its aspect ratio is verified; keyboard checks await the existing non-reduced smooth scroll before measuring focus visibility. Reduced-motion scrolling is disabled only when the campaign is present.

## Review evidence and decision

Local evidence is outside public serving paths in Work's `outputs/prelaunch-visual-correction-2026-11-18/`: four full-page and initial-viewport screenshots; text-enlargement/reflow and zero-state captures; browser JSON; regression/routing/typecheck/lint/build logs; receiving record. Previous evidence remains intact.

Website UX review verdict: ADVANCE to founder visual review, not release. Purpose, architecture, journey, trust, mobile/accessibility, product-state and visual-hierarchy gates pass the bounded local evidence. Implementation-risk gate passes with the next-stage condition of separately authorised Protected Preview. The three-second understanding goal is an editorial design goal, not a measured user-study result.

Not run: hosted Preview, physical Android/daylight/browser zoom, manual assistive-technology session, live intake writes or AI. Founder acceptance remains OPEN. No visual claim substitutes for that acceptance.

## Protected systems and rollback

No push, deployment, Production operation, environment/flag change, database/Auth/Storage mutation, notification or permission change. Admin/main and the normal public website are untouched. Existing Mama G allowances remain 5 Ask questions per 6 hours and 2 Crop Doctor checks per 12 hours.

Rollback: revert only this local visual correction to `7b35adff0b0f403ef73acd47c278291c51bc3cdc`. Do not roll back Production or live flags. Next gate is founder review; a real Protected Preview still requires separate branch-specific staging isolation and deployment authority. Any later consolidation with a changed Production baseline is separate.

COMING SOON VISUAL CORRECTION — READY FOR FOUNDER REVIEW
