# P09-1D — Founder decisions and protected implementation

Baseline: 545534abb66b3bf5aaabd12a027c64a0371621b8. Founder source c45d463b-8762-4d6f-bbfd-f06cdb35f95a, sections 0–38. Retained preflight A1/B15/C3/D1 remains historical evidence; FD-P09-1D-01..06 release the missing composition/interaction authority.

## Decision register
| Decision | Implementation |
|---|---|
| FD-P09-1D-01 | Canonical /dev-preview/suppliers-services; submitted multi-term search; compact categories; secondary Serves region; deterministic name/id order; six per page; 3/2/1 grid; URL and browser restoration. |
| FD-P09-1D-02 | Exact eight categories; Based in distinct from participant-reported Serves; no Veterinary/Finance/Insurance top-level categories. |
| FD-P09-1D-03 | Context placeholder, provider, category, base, service area, two offerings, scoped area state, View profile only. |
| FD-P09-1D-04 | Provider-led top and mediated action; What they offer / Service area / About / What we know; no inferred Marketplace links. |
| FD-P09-1D-05 | Five steps: Provider + contact / What you offer / Location + service area / Supporting information / Review. Provider participation, not item publication or account creation. |
| FD-P09-1D-06 | Ask about this supplier → three-step local enquiry; source provider preserved; Review/Edit and truthful nothing-sent completion. |

## Boundaries and implementation decisions
Eight synthetic provider records cover all eight primary categories, supplier/service/both, multiple base and served regions, unknown and under-review coverage. First four IDs/names/base regions/offerings preserve the accepted homepage fixture relationships. No real businesses, contacts, pictures, credentials or backend data imported. Neutral category placeholders are intentionally replaceable; no new imagery generated.

Taxonomy is not derived from images. Search covers name/category/offerings/base and served location vocabulary; service-region filter matches served regions only. Query length 120; page clamps; unsupported choices normalize; strict directory-return allowlist. Mobile category disclosure exposes full labels without hidden swipe. Native filter dialog stages service region until Apply, restores opener focus and discards changes on Escape/Cancel. At desktop categories are directly visible. Six-per-page is a routine compact pagination choice; no ranking or recommendation logic.

Entry minimum completeness: provider/contact/phone, provider type, at least one approved category, offerings and base region required. Short description, district/community, served regions and supporting information optional. Blank service area means needs confirmation, not all Ghana. No registration, certification, identity documents, years-operating or legal consent invented. Only local validation occurs; final consent/legal treatment remains a release dependency.

Image inputs reuse the metadata-only limit: up to five JPG/PNG/WEBP, 5MB each. No content read, upload, local/session storage, fetch or server action. Component state clears on reload; controls disabled before hydration; final completion revalidates all steps. Enquiry has only authorised need/location/timing/details/name/phone/WhatsApp fields. No unapproved contact channels, automatic marketplace records, bookings, receipts, IDs or notifications.

All new route pages and server-only fixture loader reject Production. Existing signed /dev-preview middleware and auth remain unchanged. Public /services, /supplier-directory, onboarding/APIs/admin/data are untouched. Future public intent is /suppliers-services, not an activated public route.

Minimal wiring only: shared central supplier destination; homepage supplier profile/View All links; gateway supplier entry. Accepted List Produce unchanged. Only four prior test expectations change with authorised wiring: P09-1C gateway checks the exact protected supplier-entry destination; homepage checks the exact supplier-directory destination; P09-1A permits that destination and only the four established supplier-profile links. P09-1B replaces its disabled supplier-navigation assertion with the exact protected directory destination. All other assertions are retained.

Ask Mama G is the founder's current public working name; the controlled transfer is deferred to P09-1F. No naming replacement is included in P09-1D.

## Release dependencies
Real eligible provider records, publication/evidence ownership, real intake/moderation, private enquiry receiving/follow-up, approved contact/privacy/consent/legal wording, final supplier imagery and explicit migration/release decision. No Production release or P09-1E/F authority.

Implementation requires package/browser/access evidence and founder acceptance; this document does not close P09-1D.
