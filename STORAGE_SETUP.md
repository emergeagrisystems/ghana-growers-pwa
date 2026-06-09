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

The migration creates:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('farmers', 'farmers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('suppliers', 'suppliers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('marketplace', 'marketplace', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read Ghana Growers images" on storage.objects;

create policy "Public read Ghana Growers images"
on storage.objects
for select
to public
using (bucket_id in ('farmers', 'suppliers', 'marketplace'));
```

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

Admin forms support:

- Upload Image when no image is attached.
- Image preview before saving the record.
- Replace Image when an image already exists.
- Remove Image to clear the image field before saving.

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

Fallback display locations:

- Farmer images: Farmer Directory and Farmer Profile.
- Supplier images: Supplier Directory and Supplier Profile.
- Marketplace listing images: Marketplace cards and listing detail views.

## Testing Steps

1. Confirm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_ACCESS_KEY` are configured in Vercel.
2. Run `supabase/migrations/004_storage_buckets.sql` in the Supabase SQL Editor.
3. Open `/admin` and unlock the dashboard with the admin key.
4. Open Add Farmer, Add Supplier, or Add Marketplace Listing.
5. Upload a JPG, PNG, or WEBP file smaller than 5MB.
6. Confirm the image preview appears and the form shows an uploaded public URL.
7. Save the form and confirm the public page displays the uploaded image.
8. Test Replace Image and Remove Image before saving another record.
