# P09-1B — Farmer discovery, profiles and farmer entry

Authority: founder brief 964ce8f2-75aa-4482-be89-afbaff488879. P09-1A ab7654117ad4f9b1beb454fc82ca0ab95d063582 remains the approved baseline. This package is Protected Preview only. No merge or Production release is authorized.

## Source and reconciliation

Read-only Figma inspection: Phase 06 PThSYDmMVjbquDHXSe2yza, architecture 9:2, profile 18:2, closure 146:952; mobile directory 116:887, approved mobile package 114:884, responsive source register 116:890 / 101:784 / 102:818 and profile 102:906 / 102:952 / 103:880. Screenshots inspected for 116:887, 124:933 and 103:880. Supporting Phase 04 iiFrbtg8rMymsIcXtEc3Lv 16:16 and 16:17. Later founder restrictions and current Phase 09 palette/shell supersede older navigation or background treatment.

Existing FarmerDirectory.tsx, farmerDirectory.ts, public profile route, FarmerRegistrationForm.tsx and farmerRegistration.ts were reviewed as implementation evidence. Their operational/public routes and APIs remain unchanged. New protected components reconcile the approved behaviour without importing legacy badges, public-data loaders or operational submission handlers. Future public-route replacement requires explicit release gates, not merely this Preview commit.

## Routes

- /dev-preview/farmers: protected directory; query keys q, region, district, product, farmType, page.
- /dev-preview/farmers/[slug]: protected fixture profile; from is restricted to the canonical protected directory and safe card anchors.
- /dev-preview/list-your-farm: local UI/validation demonstration only.
- Existing homepage: minimal View All Farmers, farmer-card and List Your Farm links.
- Shared Find → Farmers enabled. Suppliers & Services, Join, Marketplace and product destinations remain unavailable. Shared availability wording now acknowledges Farmer pages.

Intended later public route mapping: /farmer-directory, /farmer-directory/[slug], /join/farmer. No public root/route, auth, admin, API, Supabase, Figma or Production modification.

## Phase 06 gaps closed in Protected Preview

- Submitted partial/case-insensitive search across fixture name, crops and safe location; no private fields or real-record coverage claim.
- Region/Product primary; dependent District; Farm Type in More filters on larger screens and mobile sheet.
- Mobile All / Vegetables / Cereals / Tubers / Fruits / Livestock rail shares the Product value. Visible horizontal navigation controls supplement keyboard browsing.
- Mobile filter choices are staged: Apply commits once; Close/Escape/backdrop discard. Native modal plus explicit Tab wrap, focus restoration and body-scroll containment.
- Visible removable q/filter chips; Clear search retains filters; Clear filters retains q. Region changes clear District. Invalid URL values normalize rather than leaving invisible filters.
- Deterministic alphabetical ordering, 12 per page, URL page state, explicit/browser Back and Forward, preserved result anchor and focus.
- Compact cards: neutral non-person media, synthetic identity, safe example location, up to three crop labels and known additional count, one View profile action. No blanket Verified/Trusted/featured sorting/logo badge.
- Profile: identity/location/type, review-state boundary, concise synthetic summary, crops, section-level evidence, no-listing state and honest disabled supply actions. No fabricated size, quantity, price, certification, contacts, delivery or history.
- Show all crops, safe unavailable/withdrawn demonstrations, controlled not-found view, explicit contact-unavailable correction destination.

## Fixtures and evidence states

The four homepage farmer IDs/names/regions/products are preserved. Nine synthetic records extend the directory to thirteen, the minimum needed to exercise a second 12-item page. Added fields: synthetic District A–D, Crop/Livestock/Mixed type, category associations and crop labels. One record has seven crops to exercise disclosure. These are vocabulary/layout fixtures, not real personal data or agronomic claims. No new photographs, operational records, contacts, availability, stock or prices.

Fixtures remain in a server-only protected route module with a Production guard. All new routes reject Production runtime; existing /dev-preview middleware remains unchanged. No fixture data is added to public assets or a database.

Normal profiles show Last reviewed: Unavailable because no real profile review has occurred. This is a public-release completeness dependency, not a fabricated review date. Farmer-reported is explicitly a fixture demonstration; Needs confirmation qualifies current supply. Optional ?state=checked demonstrates exact crop-label scope, synthetic source and example date with an explicit no-real-check statement. ?state=under-review withholds optional detail without exposing a dispute. ?state=unavailable and ?state=withdrawn show safe generic states; a missing slug returns 404.

Directory ?fixture=empty and ?fixture=unavailable are distinct from zero matches. Retry preserves q/filters and truthfully leaves the deliberate failure fixture unavailable; it does not pretend to recover a live source.

## Farmer entry

The existing field hierarchy is retained: contact; farm/location; crops/production; optional photos/documents; application statement. Required/optional distinction, phone-or-WhatsApp, email, crop limits, length limits, file type/count/size and agreement validation run locally. Errors are associated with controls; summary receives focus and links to fields. Entries remain after errors and after editing the completion state; reload clears them.

No fetch, upload, storage or operational submit handler. Optional test files are checked by metadata only; file contents are not read. Without hydration the fieldset/submit control are disabled. Completion explicitly says nothing was submitted and creates no receipt/reference/profile. Only fictional inputs/test files are requested. No actual consent or application is recorded.

## Remaining release dependencies

Real farmer eligibility/publication permission, approved identity/location/crops, actual Last reviewed, evidence ownership and lifecycle, mapper parity, real photo rights/consent/provenance where used; operational submission configuration and private review/receipt workflow; correction/contact owner and policy approval; public-route cutover and regression review. Mediated sourcing remains P09-1C. Other product packages remain separate. No operational readiness follows from fixtures.

## Verification and review boundary

Package acceptance covers 320×1000, 390×1000, 768×1000 and 1440×1000; directory/profile/entry rendering, controls, visible labels, no overflow/clipping, search/filter combinations, category synchronization, sheet staging/cancel/apply/focus trap, URL normalization, page-two navigation, explicit/browser return, no-result/empty/unavailable states, profile evidence/disclosure, local entry validation/files/completion, zero application writes and zero page errors. Both prelaunch modes, deployed access, existing regression suites, existing homepage/P09-1A acceptance and build are required before return. Tests update only obsolete disabled-link expectations where P09-1B intentionally enables a destination.

Website UX & Product Design Reviewer and React review apply to rendered evidence. No screen-reader certification or user-study claims. Keep approved homepage structure, C1, Farming Tools, copy and palette unchanged; only wiring and shared availability text changed.
