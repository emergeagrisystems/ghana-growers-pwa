// Preview must never use the protected Production project, including in browser bundles.
export const RC1_STAGING_REF = "ecluxmyxqofkbzcyurlf";
export const PRODUCTION_SUPABASE_REF = "bfasogvmesswweribsji";
export function canonicalSupabaseOrigin(value?: string) {
  try {
    const url = new URL(value || "");
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    return !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash
      && (url.protocol === "https:" && !url.port || loopback && url.protocol === "http:") ? url.origin : undefined;
  } catch { return undefined; }
}
export function isolatedSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (process.env.VERCEL_ENV === "production") {
    return process.env.NEXT_PUBLIC_RC1_PREVIEW !== "true"
      && canonicalSupabaseOrigin(url) === `https://${PRODUCTION_SUPABASE_REF}.supabase.co`
      ? `https://${PRODUCTION_SUPABASE_REF}.supabase.co` : undefined;
  }
  const preview = process.env.VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_RC1_PREVIEW === "true";
  if (!preview) return url;
  return canonicalSupabaseOrigin(url) === `https://${RC1_STAGING_REF}.supabase.co`
    ? `https://${RC1_STAGING_REF}.supabase.co` : undefined;
}
