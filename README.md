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
