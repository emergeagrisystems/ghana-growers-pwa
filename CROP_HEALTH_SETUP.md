# Ghana Growers Crop Health API Setup

Ghana Growers uses a secure server-side route to check crop images for possible disease, pest, or nutrient-stress issues.

## Provider

Preferred provider:

- Kindwise Crop.health
- Documentation: `https://crop.kindwise.com/docs`
- API examples: `https://github.com/flowerchecker/crop-health-examples`

Kindwise Crop.health accepts crop images encoded as base64 and authenticates requests with an `Api-Key` header. Ghana Growers sends requests from the server only, so the API key is never exposed in frontend code.

## Required Environment Variable

Add this variable in Vercel for Production and Preview:

```bash
CROP_HEALTH_API_KEY=
```

For local testing, add it to `.env.local`.

## Vercel Setup

1. Open the Ghana Growers project in Vercel.
2. Go to **Settings**.
3. Open **Environment Variables**.
4. Add `CROP_HEALTH_API_KEY`.
5. Select Production and Preview environments.
6. Redeploy the site.

## API Route

The secure route is:

```text
src/app/api/crop-health/route.ts
```

It:

- Accepts a crop image upload from the frontend.
- Allows JPG, PNG, and WEBP only.
- Limits uploads to 5MB.
- Applies a basic daily in-memory usage limit per IP/session.
- Uses `process.env.CROP_HEALTH_API_KEY` only on the server.
- Sends the image to Crop.health.
- Returns simplified advisory results to the frontend.
- Falls back to mock advisory results when the API key is missing.

## Frontend

The Crop Health Check UI is:

```text
src/components/smart-solutions/CropHealthCheck.tsx
```

It supports:

- Image upload
- Image preview
- Loading state
- Invalid image errors
- API failure errors
- Low confidence warnings
- No disease detected messaging
- Save Diagnosis workflow
- My Crop Health Reports saved-report list
- Advisory disclaimer

## Saved Reports

Saved crop health reports use:

```text
supabase/migrations/005_crop_health_reports.sql
src/app/api/crop-health-reports/route.ts
```

The saved report flow stores:

- Uploaded crop image URL
- Diagnosis
- Report date
- Confidence
- Severity
- Symptoms
- Recommendations
- Result provider

Run `supabase/migrations/005_crop_health_reports.sql` in Supabase SQL Editor before using Save Diagnosis in production.

## Testing Steps

1. Add `CROP_HEALTH_API_KEY` to `.env.local`.
2. Start the app locally.
3. Open `/farmer-hub#crop-health`.
4. Upload a clear JPG, PNG, or WEBP crop/leaf image under 5MB.
5. Click **Get Advisory Result**.
6. Confirm that the UI shows:
   - Possible issue
   - Confidence
   - Symptoms
   - Recommended action
   - Severity when available
   - Advisory disclaimer

If `CROP_HEALTH_API_KEY` is not configured, the app returns mock advisory results so development can continue safely.

## Disclaimer

The public tool displays this disclaimer:

> This tool provides advisory guidance only. Please confirm serious crop problems with an agricultural extension officer.
