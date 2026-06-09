# Ghana Growers Supabase Storage Setup

Ghana Growers uses Supabase Storage for admin-managed images attached to farmers, suppliers, and marketplace listings.

## Required Buckets

Create these public buckets:

- `farmers`
- `suppliers`
- `marketplace`

Each bucket should allow:

- JPG images
- PNG images
- WEBP images
- Maximum file size: 5MB

## SQL Setup

Run this migration in the Supabase SQL Editor:

```text
supabase/migrations/004_storage_buckets.sql
```

It creates or updates the three buckets and adds a public read policy for uploaded Ghana Growers images.

## Manual Bucket Setup

If creating buckets manually in the Supabase dashboard:

1. Open the Supabase project.
2. Go to **Storage**.
3. Create public buckets named `farmers`, `suppliers`, and `marketplace`.
4. Set file size limit to `5MB`.
5. Allow MIME types:
   - `image/jpeg`
   - `image/png`
   - `image/webp`
6. Add a public read policy for objects in these buckets.

## Upload Flow

Admin image uploads use this protected server route:

```text
src/app/api/admin/uploads/route.ts
```

Flow:

1. Admin selects an image in `/admin`.
2. The browser validates type and size.
3. The image is sent to the protected upload API with the signed admin session header.
4. The server validates the file again.
5. The server uploads to Supabase Storage using `SUPABASE_SERVICE_ROLE_KEY`.
6. The public Storage URL is returned to the admin form.
7. When the admin saves the form, the public URL is saved in Supabase:
   - Farmers: `farmers.profile_image_url`
   - Suppliers: `suppliers.logo_url`
   - Marketplace Listings: `marketplace_listings.image_url`

## Environment Variables

The upload route uses the existing Supabase server environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is still used elsewhere for public/client-safe Supabase configuration where appropriate.

## Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- Uploads happen through a server-side admin API route.
- The route requires the existing Ghana Growers admin session.
- The service role key is used only on the server.
- Public buckets make uploaded images publicly viewable, but not publicly writable.
- Add full admin authentication and audit logging before managing sensitive production media.

## Fallback Images

If no uploaded image URL exists, the public pages continue to use the current local fallback images from `/public/images`.
