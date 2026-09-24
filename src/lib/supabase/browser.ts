import { isolatedSupabaseUrl } from "./isolation";
export function getSupabaseBrowserConfig() {
  return {
    url: isolatedSupabaseUrl() ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    isConfigured: Boolean(isolatedSupabaseUrl() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  };
}
