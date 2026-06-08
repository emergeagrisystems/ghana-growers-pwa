# Ghana Growers Website/PWA

A mobile-first Next.js + Tailwind CSS website for Ghana Growers, connecting farmers, buyers, and agricultural suppliers in Ghana.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Project Structure

```text
src/app/                 App Router pages and SEO metadata
src/components/          Reusable UI components
src/data/                Easy-to-edit content files
public/manifest.json     PWA manifest
public/sw.js             Lightweight service worker
public/images/           Placeholder visual assets
```

## Common Edits

- WhatsApp number: edit `WHATSAPP_NUMBER` in `src/data/site.ts`.
- Products and marketplace categories: edit `src/data/products.ts`.
- Blog posts and learning content: edit `src/data/blog.ts`.
- Service page content: edit `src/data/services.ts`.
- Farmer directory placeholders: edit `src/data/farmers.ts`.
- Farmer Tools market prices: edit `src/data/marketPrices.json`.
- Farmer Tools locations: edit `src/data/weatherLocations.ts`.
- Buyer requests board: edit `src/data/buyerRequests.json`.
- WhatsApp community invite links: edit `src/data/whatsappCommunities.ts`.
- Farmer registration notification recipients: edit `src/data/notificationConfig.ts`.
- Buyer registration notification recipients: edit `src/data/notificationConfig.ts`.
- Supplier registration notification recipients: edit `src/data/notificationConfig.ts`.

## Farmer Tools Integrations

- Weather uses the free Open-Meteo API directly from the frontend.
- Farm Help Assistant uses `src/app/api/farmer-assistant/route.ts` and calls OpenAI from the server using `OPENAI_API_KEY`.
- Crop Health Check uses `src/app/api/crop-health/route.ts`, ready for Plant.id, Crop.health, Plantix, or a similar provider.
- Keep API keys in environment variables on the server. Do not expose provider keys in frontend components.

### Farm Help Assistant Setup

The chat UI lives in `src/components/smart-solutions/FarmerAssistant.tsx` and is displayed on `/smart-solutions`.

The chat API route is located at:

```text
src/app/api/farmer-assistant/route.ts
```

The server-side OpenAI integration lives at:

```text
src/lib/farmerAssistant.ts
```

Set these environment variables locally and in production:

```bash
OPENAI_API_KEY=
OPENAI_MODEL="gpt-5.4-mini"
```

`OPENAI_MODEL` is optional. If it is not set, the app uses `gpt-5.4-mini`.

To add `OPENAI_API_KEY` in Vercel:

1. Open the Ghana Growers project in Vercel.
2. Go to Settings, then Environment Variables.
3. Add `OPENAI_API_KEY` with the OpenAI API key value.
4. Optionally add `OPENAI_MODEL` if you want to override the default model.
5. Select the Production, Preview, and Development environments needed.
6. Save the variables and redeploy the site.

To test locally:

1. Create a local `.env.local` file.
2. Add `OPENAI_API_KEY=your_api_key_here`.
3. Optionally add `OPENAI_MODEL="gpt-5.4-mini"`.
4. Run the app.
5. Open `/smart-solutions` and ask a question in the Farm Help Assistant section.

Example local test:

```bash
pnpm run dev
```

Then visit:

```text
http://localhost:3000/smart-solutions
```

The frontend must never contain or expose the OpenAI API key. Browser code should only call the internal `/api/farmer-assistant` route.

The assistant includes basic usage protection in `src/lib/assistantUsageProtection.ts`:

- 800-character message limit.
- 6 requests per minute per IP/session.
- 30 requests per day per IP/session.
- Friendly limit messages returned from `/api/farmer-assistant`.

This is intentionally lightweight and in-memory for the MVP. For stronger production control across Vercel serverless instances, move rate-limit counters to a shared store such as Vercel KV, Redis, or a database.

## Farmer Registration Integrations

The complete farmer registration form lives at `/join/farmer`.

Server route: `src/app/api/farmer-registration/route.ts`

Set these environment variables in production:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_FARMER_SHEET_NAME="Farmer Registrations"
RESEND_API_KEY=
FARMER_REGISTRATION_FROM_EMAIL="Ghana Growers <onboarding@ghanagrowers.com>"
```

Google Sheets columns are appended in this order: submitted date, full name, farm name, phone number, WhatsApp number, email, region, district, farm size, farm type, products, harvest period, and notes.

## Buyer Registration Integrations

The complete buyer registration form lives at `/join/buyer`.

Server route: `src/app/api/buyer-registration/route.ts`

Set these environment variables in production:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_BUYER_SHEET_NAME="Buyer Registrations"
RESEND_API_KEY=
BUYER_REGISTRATION_FROM_EMAIL="Ghana Growers <onboarding@ghanagrowers.com>"
```

Buyer registration supports market women, restaurants, hotels, caterers, retail shops, exporters, and food processors.

## Supplier Registration Integrations

The complete supplier registration form lives at `/join/supplier`.

Server route: `src/app/api/supplier-registration/route.ts`

Set these environment variables in production:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_SUPPLIER_SHEET_NAME="Supplier Registrations"
RESEND_API_KEY=
SUPPLIER_REGISTRATION_FROM_EMAIL="Ghana Growers <onboarding@ghanagrowers.com>"
```

Supplier registration supports seeds, fertilizers, agrochemicals, farm equipment, irrigation systems, packaging, logistics, storage, financial services, and agricultural consulting.

## Buyer Requests Board

The buyer requests board lives at `/buyer-requests`.

Admin-editable data file: `src/data/buyerRequests.json`

Each request includes product name, quantity needed, region, district, deadline, buyer type, contact method, and date posted. Farmers use WhatsApp buttons to contact Ghana Growers about requests they can supply.

## Featured Listings

Featured listings are controlled by:

```text
src/data/featuredListings.json
```

Use farmer slugs, supplier slugs, and buyer request IDs from the existing data files to choose featured farmers, suppliers, and buyer requests. Featured listings appear on the homepage, marketplace, farmer directory, supplier directory, and buyer requests page, with highlighted cards and a featured ribbon.

## Verification and Trust System

Reusable badge and trust-score components live in:

```text
src/components/TrustIndicators.tsx
```

Admin-editable verification fields are stored in the local JSON records for farmers, suppliers, and buyer requests:

```text
src/data/farmers.json
src/data/suppliers.json
src/data/buyerRequests.json
```

Each profile/request can include:

```json
{
  "verificationStatus": "Verified",
  "trust": {
    "status": "Verified",
    "requirements": {
      "phoneVerified": true,
      "whatsappVerified": true,
      "identitySubmitted": true,
      "businessRegistration": false
    },
    "score": {
      "profileCompleteness": 86,
      "verificationLevel": 78,
      "activityLevel": 72
    }
  }
}
```

Supported profile statuses are `Pending Verification`, `Verified`, and `Premium Member`. Verified profiles display a `Verified Farmer`, `Verified Buyer`, or `Verified Supplier` badge depending on profile type.

## What Is Included

- Responsive navigation with dropdown menus and mobile menu
- Home, Services, Marketplace, Learn, About, Careers, Partner, and Blog pages
- WhatsApp Communities hub and floating WhatsApp contact button
- PWA manifest and service worker registration
- Local data files ready to swap for a database/API later
- WhatsApp contact buttons instead of checkout
- Registration call-to-action forms
- SEO metadata through Next.js App Router

## Not Included Yet

- Payment checkout
- Full e-commerce backend
- Complex user accounts
- Delivery tracking
- Real farmer verification system

## Build

```bash
npm run build
npm run start
```
