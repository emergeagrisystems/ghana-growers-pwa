import "server-only";
import { staffSupabaseOrigin } from "./staffRuntime";
import { RC1_STAGING_REF } from "./supabase/isolation";

export function trackingStart(): string | undefined {
  const origin = staffSupabaseOrigin();
  if (!origin) return undefined;
  if (process.env.VERCEL_ENV === "production") return process.env.STAFF_REPLY_EVIDENCE_START_UTC;
  if (origin === `https://${RC1_STAGING_REF}.supabase.co`) return "2026-11-08T00:00:00Z";
  return undefined;
}
