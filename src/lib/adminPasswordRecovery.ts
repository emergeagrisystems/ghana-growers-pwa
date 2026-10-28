import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import { getSupabaseBrowserConfig } from "@/lib/supabase/browser";

export type RecoveryCredentials = {
  accessToken: string;
  refreshToken: string;
};

export function recoveryCredentialsFromHash(hash: string): RecoveryCredentials | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.get("type") !== "recovery") return null;

  const accessToken = params.get("access_token")?.trim();
  const refreshToken = params.get("refresh_token")?.trim();
  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}

export function recoveryLinkErrorFromHash(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.has("error") || params.has("error_code");
}

function memoryStorage(): SupportedStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key)
  };
}

export async function updateAdminPasswordFromRecovery({
  credentials,
  password
}: {
  credentials: RecoveryCredentials;
  password: string;
}) {
  const config = getSupabaseBrowserConfig();
  if (!config.isConfigured) return { ok: false as const, error: "Password recovery is unavailable on this Preview." };

  const supabase = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: true,
      storage: memoryStorage()
    }
  });

  const session = await supabase.auth.setSession({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken
  });
  if (session.error || !session.data.user) {
    return { ok: false as const, error: "This recovery link is invalid or has expired. Request one new link." };
  }

  const user = await supabase.auth.getUser();
  if (user.error || user.data.user?.app_metadata?.role !== "admin") {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false as const, error: "This account is not authorised for Ghana Growers administration." };
  }

  const updated = await supabase.auth.updateUser({ password });
  if (updated.error) {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false as const, error: "The password could not be updated. Request one new recovery link and try again." };
  }

  await supabase.auth.signOut({ scope: "local" });
  return { ok: true as const };
}
