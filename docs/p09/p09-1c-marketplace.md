# P09-1C — Marketplace and mediated sourcing

Authority: founder brief 78e4b384-71c3-4f95-89a9-f914cde35256. Accepted P09-1B baseline: 098f1eab3bb13ad6ae8f4a456a92fe13786f70b4. Protected Preview only; no merge, Production release, Figma or backend changes.

## Source reconciliation

Coverage audit dated 8 September 2026: Marketplace browse/detail and manual sourcing are partial; homepage cards do not establish destination completion. Specific gaps: unavailable data confused with empty arrays, legacy blanket seller verification, availability/price inference, source context, state restoration, current shell and populated responsive evidence.

Approved Phase 04 source iiFrbtg8rMymsIcXtEc3Lv 16:16 / 16:17 establishes buyer-led browse → detail → qualified sourcing, separate farmer identity context, claim-level evidence, error/recovery, touch/keyboard and non-guarantee responsibilities. Phase 06 and P09-1B govern farmer relationships and return state. Phase 08 evidence source 9UUMPnNfDxqlwTFM3ltFWd 14:2 and the founder-approved register preserve scoped evidence and provisional identity. P09-0A handoff and later founder amendments govern the current shell/homepage. Existing audit extracts were read without altering Figma.

Existing implementation sources: MarketplaceListings.tsx, marketplace/publicListings.ts, marketplace/taxonomy.ts, Marketplace detail route, SubmitBuyerRequestForm.tsx, RequestConnectionButton.tsx, sell/page.tsx, submit-listing/page.tsx and SubmitProduceListingForm.tsx. These remain operational implementation evidence, not proof of public readiness. No complete approved detailed Marketplace Figma screen set was inferred. The protected implementation reconciles approved responsibilities using the accepted palette, DM Sans, shell and accessible patterns.

## Routes and scope

- /dev-preview/marketplace: category/region and submitted search, stable alphabetical twelve-item pages, URL state, explicit/browser return, empty/no-match/unavailable states.
- /dev-preview/marketplace/[id]: product information, separate synthetic seller/farmer context, bounded evidence states and source-aware Request Produce.
- /dev-preview/request-produce: local edit → review → completion; product/source prefill only from validated fixture IDs.
- /dev-preview/list-a-product: approved two-path gateway; product intake available in Preview, supplier/service path honestly unavailable.
- /dev-preview/list-a-product/entry: local product intake based on existing contact/product/trade/availability/image responsibilities. No live workflow or query-based supplier mode.
- Homepage only enables Buy Produce, View Marketplace and listing-card links. Shared Marketplace and List a Product become links. No other homepage design change.
- Farmer profile receives a separate Return to listing link for valid fixture associations, plus local Request Produce / Ask about supply. Existing directory return remains intact.

All new surfaces are protected by existing middleware and separately reject Production runtime. Existing public Marketplace, Farmer, sell/intake routes and APIs are untouched. No auth/admin/AI/Supabase implementation or configuration changes.

## Discovery and fixture decisions

Use the existing Marketplace top-level taxonomy: Fresh Produce, Farm Inputs, Livestock, Tools & Equipment. Existing homepage Vegetables/Fruits retain their subcategory labels and map to Fresh Produce. No unsupported Verified, stock, price, transport or automatic-match filters. Region is supported by existing Marketplace discovery. Tools & Equipment truthfully has no fixtures; no inventory is invented to fill it.

Reuse all sixteen existing homepage listing identities/titles/seller labels/regions. Add product vocabulary and four explicit synthetic farmer relationships solely for navigation tests. No new real records, commercial figures, contacts, portrait or transaction data. Existing Family A images are illustrative only; unsupported categories use neutral placeholders. Nothing is added to public assets or a database.

Price, stock, quality/certification and payment/delivery terms remain unavailable. Visibility never implies availability. Farmer-reported is explicitly a fixture demonstration. Checked by Ghana Growers is demonstrated only in a separate example state with product-label scope, synthetic source and example date; no real check is claimed. Information under review withholds optional details. Unavailable/withdrawn and invalid-ID states are distinct. Contact correction remains an honestly unavailable protected explanation.

## Local form boundary

Request fields derive from the existing general and source-aware request forms: product, quantity, location, timing, delivery preference, optional notes and contact context. No additional commercial account or payment fields. Local completion explicitly says nothing was sent and creates no reference/order/receipt. Entered details never enter URL state, storage or fetch payloads.

Listing intake preserves grouped seller/contact, product, trade, availability/collection and optional test-image responsibilities. Unknown price/quantity are allowed rather than fabricated. Availability choices are labelled synthetic where a test value resembles a live claim. File contents are not read/uploaded; metadata alone is checked. Agreement is a local demonstration, not recorded consent. Supplier/service onboarding remains outside P09-1C.

Both forms retain values after errors and review/edit, focus errors and review headings, and disable submission before hydration. Reload clears local input. Operational receipt, consent, content eligibility and review decisions remain release dependencies.

## Verification required before return

Build/lint/types; five existing regression suites; homepage/P09-1A/P09-1B acceptance; P09-1C package acceptance; both prelaunch modes; 320/390/768/1440 × 1000 actual renders; keyboard, labels, validation/error focus, overflow, search/category/region, listing/farmer/return, source-aware local requests, local product intake, no-match/empty/unavailable and evidence states. Deployed staging access checks must cover HTML/RSC/prefetch with missing, invalid and expired grants; signed responses remain private/no-store/noindex. Production-runtime guard must reject all new surfaces. No tests may be removed to gain a pass.

Website UX & Product Design Reviewer: inspect all eight gates; distinguish protected demonstration quality from real data, participant research, live submission and operational evidence. Founder acceptance is still required.

## Remaining release dependencies

Eligible real listings and explicit seller/farmer attribution; actual content/availability review and evidence lifecycle ownership; photo rights/provenance; private receiving and manual follow-up ownership; approved contact/consent/retention/receipt and failure recovery; listing publication workflow and public route cutover. No checkout, payment, automated matching/logistics or live inventory is required merely to launch a truthful manual sourcing model. P09-1D is not begun automatically.
