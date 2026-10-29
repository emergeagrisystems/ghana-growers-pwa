import { createClient } from "@supabase/supabase-js";
import { getSupabaseBrowserConfig } from "@/lib/supabase/browser";

const recoveryStorageKey = "ghana-growers-admin-recovery-pkce-v1";

function recoveryClient() {
  const config = getSupabaseBrowserConfig();
  if (!config.isConfigured) return null;

  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: "pkce",
      persistSession: true,
      storageKey: recoveryStorageKey
    }
  });
}

export async function requestAdminPasswordRecovery(email: string, redirectTo: string) {
  const supabase = recoveryClient();
  if (!supabase) return { ok: false as const, error: "Password recovery is unavailable on this Preview." };

  const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (result.error) {
    return { ok: false as const, error: "Could not send reset instructions. Try again shortly." };
  }

  return { ok: true as const };
}

export async function beginAdminPasswordRecovery(code: string) {
  const supabase = recoveryClient();
  if (!supabase) return { ok: false as const, error: "Password recovery is unavailable on this Preview." };

  const session = await supabase.auth.exchangeCodeForSession(code);
  if (session.error || !session.data.user) {
    return { ok: false as const, error: "This recovery link is invalid or has expired. Request one new link." };
  }

  const user = await supabase.auth.getUser();
  if (user.error || user.data.user?.app_metadata?.role !== "admin") {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false as const, error: "This account is not authorised for Ghana Growers administration." };
  }

  return { ok: true as const };
}

export async function updateAdminPasswordFromRecovery(password: string) {
  const supabase = recoveryClient();
  if (!supabase) return { ok: false as const, error: "Password recovery is unavailable on this Preview." };

  const user = await supabase.auth.getUser();
  if (user.error || user.data.user?.app_metadata?.role !== "admin") {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false as const, error: "This recovery session is invalid or has expired. Request one new link." };
  }

  const updated = await supabase.auth.updateUser({ password });
  if (updated.error) {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false as const, error: "The password could not be updated. Request one new recovery link and try again." };
  }

  await supabase.auth.signOut({ scope: "local" });
  return { ok: true as const };
}
