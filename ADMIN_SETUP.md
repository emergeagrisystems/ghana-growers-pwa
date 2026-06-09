# Ghana Growers Admin Authentication Setup

Ghana Growers protects `/admin` and admin API routes with Supabase Auth.

## Required Environment Variables

Set these in Vercel for Production and Preview:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` must only be used on the server.

## Admin Role Requirement

Only Supabase Auth users with an admin role can access `/admin`.

Add one of these values to the user's metadata:

```json
{
  "role": "admin"
}
```

or:

```json
{
  "roles": ["admin"]
}
```

or:

```json
{
  "admin": true
}
```

The app checks both `app_metadata` and `user_metadata`. Prefer `app_metadata` for production admins because users cannot edit it themselves.

## Create An Admin User

1. Open Supabase.
2. Go to **Authentication**.
3. Create or invite an admin user.
4. Open the user record.
5. Add `role: admin` to app metadata.
6. Confirm the user has a password or invite link.

## Login URL

Admins sign in at:

```text
/admin/login
```

The dashboard is available at:

```text
/admin
```

Unauthenticated users and non-admin users are redirected to `/admin/login`.

## Protected Admin Actions

The following actions require a Supabase Auth admin session:

- Access `/admin`
- Create records
- Edit records
- Archive records
- Update verification status
- Upload images

Admin APIs validate the HTTP-only Supabase access cookie server-side. Browser code does not receive or store the service role key.

## Password Reset

The login page includes **Forgot password**. It calls Supabase Auth recovery through:

```text
src/app/api/admin/auth/forgot-password/route.ts
```

Configure email templates and SMTP settings in Supabase if password reset emails are not being delivered.

## API Routes

Auth routes:

```text
src/app/api/admin/auth/login/route.ts
src/app/api/admin/auth/logout/route.ts
src/app/api/admin/auth/forgot-password/route.ts
```

Protected admin routes:

```text
src/app/api/admin/archive/route.ts
src/app/api/admin/farmers/route.ts
src/app/api/admin/suppliers/route.ts
src/app/api/admin/marketplace-listings/route.ts
src/app/api/admin/buyer-requests/route.ts
src/app/api/admin/market-prices/route.ts
src/app/api/admin/learn-articles/route.ts
src/app/api/admin/verifications/route.ts
src/app/api/admin/uploads/route.ts
```

## Security Notes

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- Use admin role metadata only for trusted internal accounts.
- Review Supabase Auth logs regularly.
- Add detailed activity logs before using the dashboard for high-risk production operations.
