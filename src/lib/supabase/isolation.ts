// Preview must never use the protected Production project, including in browser bundles.
export const RC1_STAGING_REF = "ecluxmyxqofkbzcyurlf";
export function isolatedSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const preview = process.env.VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_RC1_PREVIEW === "true";
  if (!preview) return url;
  try {
    const parsed = new URL(url || "");
    return parsed.protocol === "https:" && parsed.hostname === `${RC1_STAGING_REF}.supabase.co` && !parsed.username && !parsed.password ? parsed.origin : undefined;
  } catch { return undefined; }
}
