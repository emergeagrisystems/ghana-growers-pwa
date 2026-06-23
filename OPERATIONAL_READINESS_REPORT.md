# Ghana Growers Operational Readiness Report

Date: June 23, 2026  
Scope: Phase 8 operational readiness  
Status: Audit and process documentation only. No live contact values or public records were changed.

## Executive Summary

Ghana Growers is close to being ready for a controlled soft launch, but it is not ready for open public traffic until operational contact details, production data quality, and daily follow-up ownership are confirmed.

The product experience is now much clearer. The remaining risks are operational:

- The public site still has placeholder WhatsApp/phone values in configuration and fallback data.
- Public forms save or route records, but the human follow-up process must be assigned.
- Fallback JSON data contains demo farmers and demo marketplace sellers that should not appear in production if Supabase is unavailable.
- Careers is public and functional, but it still reads like future hiring rather than an active launch priority.

Recommended launch path: **Ready for Closed Test** after contact details are confirmed. **Ready for Soft Launch** after production records and form follow-up ownership are reviewed.

## 1. Contact Readiness Audit

### Contact Methods Found

| Location | Current value | Risk | Recommended replacement |
| --- | --- | --- | --- |
| `src/data/site.ts` `siteConfig.email` | `hello@ghanagrowers.com` | Acceptable if mailbox exists and is monitored | Confirm mailbox exists, receives mail, and is checked daily |
| `src/data/site.ts` `WHATSAPP_NUMBER` | `233000000000` | Placeholder WhatsApp/phone number | Replace with official Ghana Growers WhatsApp in international format, e.g. `233XXXXXXXXX` |
| `src/components/FloatingWhatsAppButton.tsx` | Uses `WHATSAPP_NUMBER`, hidden while placeholder remains | Safe because generic floating WhatsApp is hidden until real number is configured | Keep hidden until real official number is ready |
| `src/app/contact/page.tsx` | Email from `siteConfig.email`; WhatsApp only shown if non-placeholder | Mostly safe | Confirm official email and phone/WhatsApp before launch |
| `src/components/Footer.tsx` | `mailto:${siteConfig.email}` | Acceptable if mailbox works | Confirm email inbox and response ownership |
| `src/data/notificationConfig.ts` | Admin emails use `hello@ghanagrowers.com`; sender defaults use `onboarding@ghanagrowers.com` | Needs email-domain verification if Resend is used | Confirm Resend sender domain and forwarding for `hello@` and `onboarding@` |
| `.env.example` | Registration sender examples use `onboarding@ghanagrowers.com` | Documentation only | Keep if domain is verified; otherwise update before launch |
| `src/data/products.ts` fallback marketplace listings | Ten records use `whatsappNumber: "233000000000"` | Placeholder phone values if fallback data appears | Do not expose fallback product data in production, or replace fallback numbers with safe internal lead flow |
| `src/lib/supabase/publicData.ts` fallback mapping | Missing Supabase `whatsapp_number` can become `233000000000` | Placeholder contact values if Supabase records lack phone data | Require phone/WhatsApp during admin review or hide direct contact when missing |
| Buyer requests fallback data | Uses realistic-looking `23355...` sample numbers | Demo/sample risk if fallback appears | Production should use real reviewed Supabase buyer requests |
| Lead forms and registration forms | Collect user phone/WhatsApp/email | Good operational input | Confirm admin can see submissions and assign follow-up responsibility |

### Contact Readiness Verdict

Not ready for public launch until:

- Official WhatsApp/phone number is configured.
- `hello@ghanagrowers.com` is confirmed working.
- Registration notification delivery is tested.
- Admin team knows who checks each submission queue.

## 2. Form Follow-Up Map

### Farmer Registration

Step 1: Submission received  
Farmer submits farm name, contact details, location, products, harvest details, and notes.

Step 2: Admin review  
Ghana Growers checks name, phone/WhatsApp, region, district, products, farm type, farm size, photo if available, and completeness.

Step 3: Approval or rejection  
Admin marks the application as Under Review, Needs Follow-up, Approved, Rejected, or Converted into a farmer record.

Step 4: Publication or contact  
If ready, farmer can be activated/published and verified where appropriate. If information is missing, admin follows up by phone/WhatsApp before publishing.

Owner: Farmer onboarding/admin team  
Recommended response time: 1-2 business days  
Primary admin location: Applications / Farmers / Farmer Import review

### Buyer Registration

Step 1: Submission received  
Buyer submits buyer type, location, purchase volume, purchase frequency, products of interest, and contact details.

Step 2: Admin review  
Ghana Growers checks demand quality, location, buyer type, products, and whether there are matching farmers, suppliers, or listings.

Step 3: Approval or rejection  
Admin marks the buyer application as Under Review, Approved, Rejected, or Converted.

Step 4: Publication or contact  
Buyer may be followed up for more detail, matched to supply, or encouraged to submit a specific buyer request.

Owner: Sourcing/admin team  
Recommended response time: 1-2 business days; same day for urgent or high-volume demand

### Supplier Registration

Step 1: Submission received  
Supplier submits company/contact person, phone, WhatsApp, region, district, category, products/services, coverage, website, and optional logo/image.

Step 2: Admin review  
Ghana Growers checks service category, service coverage, product/service clarity, image quality, and contact details.

Step 3: Approval or rejection  
Admin marks supplier application as Under Review, Approved, Rejected, or Converted into a supplier profile.

Step 4: Publication or contact  
Complete supplier profiles can be published in the Supplier Directory. Missing details should trigger follow-up.

Owner: Partnerships/admin team  
Recommended response time: 1-2 business days

### Buyer Request

Step 1: Submission received  
Buyer submits product needed, quantity, region, district, preferred delivery, deadline, and notes.

Step 2: Admin review  
Ghana Growers checks whether the request is specific, realistic, and suitable for publication.

Step 3: Approval or rejection  
Admin approves, rejects, or requests more detail.

Step 4: Publication or contact  
Approved requests can become live buyer demand and should be matched with farmers, marketplace listings, or suppliers.

Owner: Demand/admin team  
Recommended response time: Same day for urgent requests; otherwise within 1 business day

### Request Connection

Step 1: Submission received  
Visitor requests a connection from a farmer profile, supplier profile, or marketplace listing.

Step 2: Admin review  
Ghana Growers checks requester name, product interest, quantity, source profile/listing, message, phone, WhatsApp, and location.

Step 3: Approval or rejection  
Admin decides whether the lead is serious, incomplete, or unsuitable.

Step 4: Publication or contact  
Admin contacts the requester, then contacts the farmer/supplier/listing owner if the request is useful.

Owner: Lead response/admin team  
Recommended response time: Same day for strong buyer leads; otherwise 1 business day

### Featured Membership Enquiry

Step 1: Submission received  
Farmer, supplier, or listing owner requests featured visibility.

Step 2: Admin review  
Ghana Growers checks whether the profile/listing is complete, appropriate, and worth featuring.

Step 3: Approval or rejection  
Admin marks Contacted, Approved, Rejected, or Closed.

Step 4: Publication or contact  
If approved, admin can mark the related farmer, supplier, or listing as featured. If not ready, admin gives improvement guidance.

Owner: Commercial/admin team  
Recommended response time: Within 2 business days

## 3. Lead Response Process

### New Lead

Admin should:

- Check requester name, phone, WhatsApp, product/service, quantity, location, and source.
- Reject obvious spam or incomplete records.
- Prioritize high-volume buyer demand, urgent deadlines, and verified source profiles.

### Contacted

Admin should:

- Contact the requester by phone/WhatsApp/email.
- Confirm product, quantity, location, timing, delivery expectations, and seriousness.
- Add a note with the contact outcome.

### Negotiating

Admin should:

- Introduce or route the request to the farmer, supplier, or listing owner if appropriate.
- Track whether parties are discussing price, quantity, pickup/delivery, or quality.
- Keep Ghana Growers visible in the process for learning and accountability.

### Completed

Admin should:

- Mark the lead completed when the connection was successfully made or request was resolved.
- Record what was supplied or what outcome occurred if known.
- Identify whether the lead should become a success story later.

### Lost

Admin should:

- Mark as lost if the requester did not respond, supply was unavailable, terms failed, or the request was invalid.
- Record why it was lost so Ghana Growers can improve matching.

Recommended daily operating rhythm:

- Morning: review new leads, registrations, buyer requests, and featured enquiries.
- Midday: follow up on urgent buyer demand and open negotiations.
- End of day: update statuses and notes.

## 4. Public Data Quality Audit

This audit reviewed local fallback data and code references. Production Supabase data must still be reviewed in the live admin dashboard.

### Farmers

Fallback file: `src/data/farmers.json`

- Count: 10 fallback farmer records.
- Missing key fallback fields: none found for farm name, region, district, products, description, or photos.
- Demo/sample concern: records include `Akumadan Growers Group`, `Nsawam Fruit Farmers`, and `Northern Root Crops Network`.
- Operational risk: these are useful development fallbacks but should not appear publicly in production unless intentionally approved as real records.

### Suppliers

Fallback file: `src/data/suppliers.json`

- Count: 10 fallback supplier records.
- Missing key fallback fields: none found for company name, region, district, services, short description, or photos.
- Demo/sample concern: supplier records appear curated but should be treated as fallback/demo until confirmed as real suppliers.

### Marketplace Listings

Fallback file: `src/data/products.ts`

- Demo seller names detected:
  - Akumadan Growers Group
  - Bawku Onion Aggregators
  - Techiman Grain Cooperative
  - Northern Root Crops Network
  - Savelugu Yam Producers
  - West Akim Plantain Farmers
  - Ada Vegetable Farmers
  - Aveyime Rice Growers
  - Ejisu Poultry Farm
  - Dawhenya Poultry Producers
- Placeholder WhatsApp numbers detected: 10 fallback product records use `233000000000`.
- Operational risk: if Supabase is empty or unavailable, demo marketplace listings could appear.

### Buyer Requests

Fallback file: `src/data/buyerRequests.json`

- Count: 9 fallback buyer requests.
- Records use fields such as `productName`, `quantityNeeded`, `region`, `district`, `deadline`, `buyerType`, `buyerName`, and `notes`.
- Fallback records appear complete for the current app shape.
- Operational risk: sample buyer names and phone numbers should not be treated as real demand unless confirmed.

### Success Stories

Fallback file: `src/data/successStories.json`

- Count: 0.
- Good: no fake success stories are present.
- Public empty state is acceptable if it says success stories are coming as Ghana Growers grows.

## 5. Demo Content Audit

### Demo or Fallback Content Found

| Area | Finding | Risk | Recommendation |
| --- | --- | --- | --- |
| Farmer fallback data | 10 curated farmers including Akumadan/Nsawam/Northern Root examples | Could look like real public farmers if Supabase fallback activates | Production should rely on Supabase active farmers only; consider disabling public fallback before launch |
| Supplier fallback data | 10 curated supplier records | Could look real if fallback activates | Confirm suppliers or keep fallback for development only |
| Marketplace fallback data | 10 demo sellers and placeholder WhatsApp numbers | High trust risk if shown publicly | Must not show in production public launch unless replaced with approved data |
| Buyer request fallback data | 9 sample buyer requests | Could look like real demand | Use Supabase-reviewed buyer requests for launch |
| Success stories | Empty | No fake testimonials | Keep empty until real stories exist |
| Careers page | Lists future opportunities | Can feel premature | Hide until hiring is active |
| WhatsApp Communities route | Returns 404 | Safe | Keep hidden until communities are ready |
| Blog route | Returns 404 | Safe | Keep hidden until content strategy is ready |

## 6. Careers Page Decision

Recommendation: **Hide Careers page until needed.**

Reasoning:

- The page currently lists future opportunities, not active roles.
- During launch, visitors need confidence that Ghana Growers is operational, not unfinished.
- Careers is not needed for farmer, buyer, supplier, or partner conversion.
- The About navigation currently includes "Job listing"; this should be removed or hidden until there are real openings.

If kept public, it should be rewritten as a simple "Interested in working with Ghana Growers?" contact path, not a job listing page.

## 7. Soft Launch Checklist

### Contact and Follow-Up

- [ ] Official email mailbox works.
- [ ] Official WhatsApp/phone is configured.
- [ ] Generic floating WhatsApp remains hidden until real number is ready.
- [ ] Admin team knows who checks registrations.
- [ ] Admin team knows who checks leads.
- [ ] Response expectation is agreed: same day for strong buyer leads, 1-2 business days for registrations.

### Forms

- [ ] Farmer registration tested in production.
- [ ] Buyer registration tested in production.
- [ ] Supplier registration tested in production.
- [ ] Submit Buyer Request tested in production.
- [ ] Request Connection tested in production.
- [ ] Featured Membership Enquiry tested in production.
- [ ] Submissions appear in Admin Dashboard.
- [ ] Activity log records admin actions.

### Data

- [ ] At least 30 active farmers reviewed.
- [ ] At least 10 verified farmers reviewed.
- [ ] At least 5 active suppliers reviewed.
- [ ] At least 10 marketplace listings reviewed.
- [ ] At least 5 buyer requests reviewed.
- [ ] No demo farmers visible publicly.
- [ ] No demo suppliers visible publicly.
- [ ] No demo marketplace listings visible publicly.
- [ ] No placeholder phone numbers visible publicly.

### Core Pages

- [ ] Homepage reviewed on mobile and desktop.
- [ ] Marketplace reviewed with production data.
- [ ] Farmer Directory reviewed with production data.
- [ ] Supplier Directory reviewed with production data.
- [ ] Buyer Demand Board reviewed with production data.
- [ ] Digital Farm tested.
- [ ] Contact page tested.
- [ ] FAQ and Verification pages reviewed.

### Operations

- [ ] Lead statuses are used consistently: New, Contacted, Negotiating, Completed, Lost.
- [ ] Daily admin review time is assigned.
- [ ] One person owns farmer onboarding.
- [ ] One person owns buyer demand follow-up.
- [ ] One person owns supplier and featured enquiries.
- [ ] Launch feedback channel is agreed.

## 8. Final Launch Readiness Report

### Current Readiness Score

**78 / 100**

The platform experience is strong enough for a closed test. The main remaining risks are operational data quality, official contact configuration, and response ownership.

### Remaining Blockers

1. Placeholder WhatsApp/phone number still exists in configuration.
2. Fallback marketplace records contain placeholder WhatsApp numbers.
3. Demo fallback farmers and marketplace listings could appear if Supabase is unavailable or empty.
4. Careers page is public but reads like future hiring.
5. Production Supabase data quality has not been confirmed in this audit.
6. Human ownership of form follow-up must be assigned.
7. Email notification delivery must be tested with real inboxes.

### Must-Fix Items

- Configure official WhatsApp/phone or keep all generic WhatsApp hidden.
- Confirm `hello@ghanagrowers.com` and notification sender domains.
- Hide Careers from navigation until there are real openings.
- Confirm production public data contains only reviewed records.
- Test every public form once in production.
- Confirm daily admin follow-up owner.
- Ensure fallback demo data cannot appear publicly during launch.

### Recommended Launch Path

**Ready For Closed Test**

Use a controlled group of farmers, buyers, suppliers, and internal reviewers. Keep pre-launch mode active for broad public traffic if needed.

**Not Ready For Full Public Launch**

Do not switch to full public launch until official contact details are configured, production data is reviewed, and the daily lead/registration follow-up process is assigned.

### Next Operational Step

Run one live test for each workflow:

1. Submit farmer registration.
2. Submit buyer registration.
3. Submit supplier registration.
4. Submit buyer request.
5. Request connection from a farmer or listing.
6. Submit featured enquiry.
7. Confirm each appears in admin.
8. Assign a team member to respond and update status.
