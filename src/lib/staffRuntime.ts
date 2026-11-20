import { canonicalSupabaseOrigin, PRODUCTION_SUPABASE_REF, RC1_STAGING_REF } from "./supabase/isolation";

type Runtime = Record<string, string | undefined>;

// No host-header inference, credential fallback or cross-project substitution.
export function staffSupabaseOrigin(env: Runtime = process.env): string | undefined {
  const origin = canonicalSupabaseOrigin(env.NEXT_PUBLIC_SUPABASE_URL);
  if (!origin) return undefined;
  if (env.VERCEL_ENV === "production") {
    return origin === `https://${PRODUCTION_SUPABASE_REF}.supabase.co`
      && (!env.NEXT_PUBLIC_RC1_PREVIEW || env.NEXT_PUBLIC_RC1_PREVIEW === "false")
      && env.RC1_STAGING_READY !== "true" ? origin : undefined;
  }
  if (env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development") {
    if (origin === `https://${RC1_STAGING_REF}.supabase.co`
      && env.NEXT_PUBLIC_RC1_PREVIEW === "true" && env.RC1_STAGING_READY === "true") return origin;
    // Fictional local tests must explicitly identify themselves. Never enabled on Vercel.
    if (env.VERCEL_ENV === "development" && env.NODE_ENV === "test"
      && env.NEXT_PUBLIC_RC1_PREVIEW !== "true") {
      const url = new URL(origin);
      if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return origin;
    }
  }
  return undefined;
}

export function adminRecoveryRedirect(env: Runtime = process.env): string | undefined {
  if (env.VERCEL_ENV === "production") {
    return staffSupabaseOrigin(env) ? "https://www.ghana-growers.com/admin/reset-password" : undefined;
  }
  if (env.VERCEL_ENV === "preview") {
    if (!staffSupabaseOrigin(env)) return undefined;
    const host = env.VERCEL_BRANCH_URL?.trim();
    if (host && /^[a-z0-9-]+\.vercel\.app$/i.test(host)) return `https://${host}/admin/reset-password`;
    return undefined;
  }
  if (env.VERCEL_ENV === "development" || (!env.VERCEL_ENV && env.NODE_ENV !== "production")) {
    return "http://localhost:3000/admin/reset-password";
  }
  return undefined;
}
