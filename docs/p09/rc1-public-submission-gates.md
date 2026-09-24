# RC1 public submission availability

No public intake workflow has both an identified receiver and tested receipt/failure evidence. RC1 therefore closes intake at the UI and at each public write endpoint. Browsing and product lifecycle implementations remain available; the active forms and their local draft/file-selection effects are not mounted.

| Public workflow | UI gate | API gate |
| --- | --- | --- |
| Farmer registration | FarmerRegistrationForm | POST /api/farmer-registration |
| Supplier registration | SupplierOnboardingForm and SupplierRegistrationForm | POST /api/supplier-registration |
| Buyer registration | BuyerRegistrationForm | POST /api/buyer-registration |
| Produce listing | SubmitProduceListingForm | POST /api/listing-submissions |
| Buyer request | SubmitBuyerRequestForm | POST /api/buyer-request-submissions |
| Connection/enquiry | RequestConnectionButton | POST /api/lead-requests |
| Contact and partnership enquiries | ContactEnquiryForm, including ContactForm callers | POST /api/contact-enquiries |
| Featured placement | FeaturedPlacementCTA | POST /api/featured-enquiries |
| Waitlist | PrelaunchWaitlistForm | POST /api/waitlist |
| Pilot feedback | FarmMatePilotFeedbackForm; answer feedback controls unavailable, Copy answer preserved | POST /api/farmmate/feedback |
| WhatsApp contact and lead tracking | WhatsAppButton, FloatingWhatsAppButton, trackWhatsAppLead | POST /api/whatsapp-leads |
| Legacy network-interest demonstration | RegistrationForm | No endpoint; former local completion is inaccessible |
| Careers CV enquiries | Unavailable text replaces mail link | No endpoint |

Contact page copy now states that enquiries are unavailable; direct email/WhatsApp calls to action are inactive. The stored email address remains informational. No new receiver or response promise is invented.

The API returns HTTP 503, no-store and PUBLIC_SUBMISSION_UNAVAILABLE before reading the request body or running upload, storage, rate-limit, integration or receipt logic. Admin/auth routes and Mama G Ask/Crop Doctor/usage routes are not gated by this change. Existing protected fixture forms remain protected demonstrations and are not promoted by this change.

The shared gate is deliberately closed in source and cannot be reopened by a browser/deployment variable. A future scoped release must record the actual receiver and receipt/failure evidence for the particular workflow before changing availability. Removing the gate without that evidence is not an approved configuration shortcut.

Validation: `node tests/rc1-submission-gates.cjs` uses isolated route imports with throwing lifecycle mocks and a request that throws on body/header access. It also renders the shared UI with a throwing child to prove that the active form never mounts. No live write tests, emails, external messages, images or database calls occur.

Separate ownership: legacy `/api/crop-health-reports` diagnosis saving and legacy `/api/farmer-assistant` / `/api/crop-health` handling are managed by the Mama G hardening workstream. The modern Ask/Crop Doctor endpoints are explicitly excluded from this intake gate.
