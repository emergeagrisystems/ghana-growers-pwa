export function supabaseServerAuthHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: apiKey };

  // Supabase secret keys are opaque API keys, not JWTs. Legacy service-role
  // keys still require the bearer header until the migration is complete.
  if (!apiKey.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}
