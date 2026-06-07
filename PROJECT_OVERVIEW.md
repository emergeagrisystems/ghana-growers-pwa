# Ghana Growers Project Overview

## Project Mission

Ghana Growers is a digital agricultural ecosystem connecting farmers, buyers, and agricultural suppliers across Ghana. The platform is designed to make agricultural trade easier, more trusted, and more practical by combining marketplace discovery, community communication, learning resources, and smart farming tools.

The current website is an MVP foundation for a broader AgriTech platform that can grow into verified directories, real-time market intelligence, AI advisory tools, and transaction workflows.

## Target Users

- Farmers who want to register their farms, find buyers, access weather guidance, check crop health, learn practical farming methods, and join community channels.
- Buyers such as market women, restaurants, hotels, caterers, retail shops, exporters, processors, and bulk purchasers looking for reliable farm supply.
- Suppliers offering seeds, fertilizers, agrochemicals, equipment, irrigation systems, packaging, logistics, storage, finance, and consulting services.
- Partners including NGOs, government agencies, investors, agribusinesses, and development organizations interested in agricultural ecosystem support.
- Ghana Growers administrators who will eventually manage listings, registrations, buyer requests, market prices, content, communities, and integrations.

## Website Structure

- Home
- Services
  - For Farmers
  - For Buyers
  - For Suppliers
- Marketplace / Shop
  - Shop Listings
  - Buyer Requests
- Smart Solutions
- WhatsApp Communities
- Learn
- About
  - Careers
  - Partner With Us
  - Blog
- Join
  - Farmer Registration
  - Buyer Registration
  - Supplier Registration

## Current Features

- Mobile-responsive Next.js website using the App Router.
- Shared header, footer, page hero, section header, CTA, and WhatsApp components.
- Marketplace category and listing structure backed by local data files.
- Buyer Requests Board with filtering by product, region, and buyer type.
- Farmer, buyer, and supplier registration forms.
- Server-side registration validation.
- Optional Google Sheets append support for registration submissions.
- Optional Resend email notifications for new registrations.
- WhatsApp contact buttons for marketplace listings and buyer requests.
- WhatsApp Communities hub.
- Learn and Blog sections powered by editable local content data.
- About, Careers, and Partner With Us pages.
- PWA manifest and lightweight service worker.
- SEO metadata through Next.js.

## Smart Solutions Features

- Live Weather Updates using Open-Meteo from the frontend.
- Weather-based farming advice for spraying, drying, irrigation, heat, wind, and rainfall decisions.
- Crop Health Check prototype with image upload preview and mock advisory output.
- OpenAI-powered AI Farmer Assistant with server-side chat API route, suggested questions, loading states, error handling, and agricultural disclaimer.
- Market Prices Dashboard using local market price data with crop, region, and market filters.

The Smart Solutions area is integration-ready. Weather is currently live through Open-Meteo, the AI Farmer Assistant uses OpenAI from a secure server route when `OPENAI_API_KEY` is configured, and the Crop Health Check is a mock/prototype service that should later connect to a secure crop disease provider.

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React icons
- Local JSON/TypeScript data files
- Google Sheets API integration support
- Resend email integration support
- PWA manifest and service worker
- GitHub
- Vercel

## Deployment Workflow

The project is intended to be deployed through Vercel with the GitHub repository connected.

Recommended workflow:

1. Make code or content changes locally.
2. Run build checks before committing.
3. Commit changes to Git.
4. Push to GitHub.
5. Let Vercel build and deploy from the connected repository.
6. Review the deployed site and verify key pages/forms.

Recommended checks:

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
```

## Important Development Rules

- Do not expose API keys or private credentials in frontend code.
- Keep secrets in environment variables.
- Use server-side API routes for provider calls that require credentials.
- Preserve mobile responsiveness.
- Maintain the existing Ghana Growers design system and branding.
- Prefer reusable components over duplicated UI.
- Keep static data files easy for non-technical administrators to update until a backend or CMS is introduced.
- Run build checks before committing.
- Commit and push completed work.
- Avoid adding marketplace payments, user authentication, or provider integrations without a clear backend/security plan.

## API Keys and Environment Variables

API keys must never be committed to the repository or exposed through client components.

Current server-side environment variables include:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_FARMER_SHEET_NAME="Farmer Registrations"
GOOGLE_SHEETS_BUYER_SHEET_NAME="Buyer Registrations"
GOOGLE_SHEETS_SUPPLIER_SHEET_NAME="Supplier Registrations"
RESEND_API_KEY=
FARMER_REGISTRATION_FROM_EMAIL="Ghana Growers <onboarding@ghanagrowers.com>"
BUYER_REGISTRATION_FROM_EMAIL="Ghana Growers <onboarding@ghanagrowers.com>"
SUPPLIER_REGISTRATION_FROM_EMAIL="Ghana Growers <onboarding@ghanagrowers.com>"
OPENAI_API_KEY=
OPENAI_MODEL="gpt-5.4-mini"
```

Future provider credentials should also be server-only, for example:

- Crop disease detection API key.
- Market data provider credentials.
- SMS or WhatsApp automation credentials.

Frontend code may call internal routes such as `/api/farmer-assistant` or `/api/crop-health`, but it must not call credentialed third-party APIs directly when secrets are required.
