# P09-1C founder design decisions — 9 September 2026

Authority: founder package c30ebe99-ea64-42d5-a2fb-b44e97846e5d, sections 1–36, continued by 80a0e0bc-5153-464b-b263-f7d237d32a4c, sections 37–48. These decisions release the design hold for this implementation only; they do not close P09-1C or authorise P09-1D, merge, Production or Figma changes.

- FD-P09-1C-01: prominent search, compact taxonomy, secondary region (staged native mobile dialog), 3/2/1-column results, image/product/location/seller/state/action card hierarchy; general sourcing after results. Existing query, sorting, pagination and return logic retained. No invented additional filters.
- FD-P09-1C-02: two-column product-led detail, compact neutral farmer context, key facts, primary Request Produce, secondary evidence and up to three existing same-category fixtures. Category grouping is not recommendation intelligence.
- FD-P09-1C-03: What you need → Location & delivery → Your details → Review. Quantity/unit/timing required; consent initially unselected, using provisional P05-5 125:16 wording explicitly identified as a local, unrecorded demonstration. Review/edit preserves values.
- FD-P09-1C-04: Seller & location → Product details → Availability & quantity → Photos & supporting information → Review. Farm/business optional; no certification or registration requirement; produce categories only. Images checked by metadata, never read/uploaded; files and fields remain in component memory.
- FD-P09-1C-05: Complete Preview request/listing; nothing sent/saved/submitted/uploaded/published; no receipt/order/ID/notification/account. Reload clears local state. No storage, backend, auth or API changes.
- FD-P09-1C-06: equal gateway choices retained; List a Product or Service remains disabled and deferred. No supplier/service form.

Specific later override: Request Produce is now explicitly the primary listing-detail action (section 15), replacing the earlier unresolved Ask about supply naming/hierarchy question at this surface. P09-1B remains unchanged. Form composition is founder supplied, not claimed to be a complete earlier Figma frame.

Tests retain original model, search/category/pagination, invalid URL, return focus, listing/farmer/back, unavailable states, no-write and protected-access coverage. Selectors adapt to approved new labels. The old uninterrupted form tests become stricter step-level tests for required timing/unit, consent, back/edit preservation, empty optional fields, invalid file metadata and local completion. Error focus now moves to the first unresolved field as required by Phase 05.

Review remains protected and synthetic. Public release requires eligible real records, evidence/currentness owners, legal/privacy approval, operational receipt/recovery/manual follow-up and listing publication authority. No automated matching/payment/logistics is implied or required by this package.
