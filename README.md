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
- Smart Solutions market prices: edit `src/data/marketPrices.json`.
- Smart Solutions locations: edit `src/data/weatherLocations.ts`.
- Farmer registration notification recipients: edit `src/data/notificationConfig.ts`.
- Buyer registration notification recipients: edit `src/data/notificationConfig.ts`.
- Supplier registration notification recipients: edit `src/data/notificationConfig.ts`.

## Smart Solutions Integrations

- Weather uses the free Open-Meteo API directly from the frontend.
- AI Farmer Assistant uses `src/app/api/farmer-assistant/route.ts`, ready for server-side OpenAI integration.
- Crop Health Check uses `src/app/api/crop-health/route.ts`, ready for Plant.id, Crop.health, Plantix, or a similar provider.
- Keep API keys in environment variables on the server. Do not expose provider keys in frontend components.

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

## What Is Included

- Responsive navigation with dropdown menus and mobile menu
- Home, Services, Marketplace, Learn, About, Careers, Partner, and Blog pages
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
