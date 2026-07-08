# Crop Health Reports

Ghana Growers lets users save Crop Health Check diagnoses and review them later in Digital Farm under **My Crop Health Reports**.

## Supabase Table

Run this migration in Supabase SQL Editor:

```text
supabase/migrations/005_crop_health_reports.sql
```

Core table:

```sql
create table if not exists public.crop_health_reports (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  image_url text not null,
  diagnosis text not null,
  confidence integer not null default 0,
  severity text,
  symptoms text,
  recommendations text,
  provider text,
  created_at timestamptz not null default now()
);
```

The migration also creates a public Supabase Storage bucket:

```text
crop-health-reports
```

## Data Flow

1. User uploads a crop image in Digital Farm.
2. `/api/crop-health` returns a Crop.health or mock fallback diagnosis.
3. User clicks **Save Diagnosis**.
4. The frontend sends the original image, browser session ID, and diagnosis to:

```text
POST /api/crop-health-reports
```

5. The server uploads the image to Supabase Storage.
6. The server writes the report to `crop_health_reports`.
7. The frontend reloads the user's recent reports with:

```text
GET /api/crop-health-reports?sessionId=...
```

All writes happen server-side using `SUPABASE_SERVICE_ROLE_KEY`.

## Stored Fields

- `id`
- `image_url`
- `diagnosis`
- `confidence`
- `severity`
- `symptoms`
- `recommendations`
- `created_at`

Support fields:

- `session_id`
- `provider`

## Testing

1. Run `supabase/migrations/005_crop_health_reports.sql`.
2. Confirm the `crop_health_reports` table exists.
3. Confirm the `crop-health-reports` Storage bucket exists.
4. Open `/farmer-hub#crop-health`.
5. Upload a valid JPG, PNG, or WEBP image under 5MB.
6. Run the Crop Health Check.
7. Click **Save Diagnosis**.
8. Confirm the report appears under **My Crop Health Reports**.
9. Click **View Details** and confirm symptoms, recommendations, confidence, severity, and date appear.
