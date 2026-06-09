export const adminAccessCookie = "ghana_growers_admin_access_token";
export const adminRefreshCookie = "ghana_growers_admin_refresh_token";

export type AdminUser = {
  id: string;
  email: string;
  role: string;
};

type SupabaseAuthUser = {
  id?: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type SupabasePasswordResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: SupabaseAuthUser;
  error?: string;
  error_description?: string;
  msg?: string;
};

type SupabaseUserResponse = SupabaseAuthUser & {
  error?: string;
  error_description?: string;
  msg?: string;
};

function supabaseAuthConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, ""),
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
}

function metadataHasAdminRole(metadata?: Record<string, unknown>) {
  const role = metadata?.role;
  const roles = metadata?.roles;
  const isAdmin = metadata?.admin;

  return (
    role === "admin" ||
    isAdmin === true ||
    (Array.isArray(roles) && roles.includes("admin"))
  );
}

function adminRole(user?: SupabaseAuthUser) {
  if (metadataHasAdminRole(user?.app_metadata)) {
    return "admin";
  }

  if (metadataHasAdminRole(user?.user_metadata)) {
    return "admin";
  }

  return "";
}

export function isSupabaseAdminUser(user?: SupabaseAuthUser) {
  return adminRole(user) === "admin";
}

function adminUserFromSupabase(user: SupabaseAuthUser): AdminUser {
  return {
    id: user.id ?? "",
    email: user.email ?? "Admin user",
    role: adminRole(user) || "admin"
  };
}

export function adminAuthCookieHeaders({
  accessToken,
  refreshToken,
  maxAge = 3600
}: {
  accessToken: string;
  refreshToken?: string;
  maxAge?: number;
}) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const access = `${adminAccessCookie}=${encodeURIComponent(accessToken)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.max(60, maxAge)}${secure}`;
  const refresh = refreshToken
    ? `${adminRefreshCookie}=${encodeURIComponent(refreshToken)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}${secure}`
    : "";

  return [access, refresh].filter(Boolean);
}

export function clearAdminAuthCookieHeaders() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return [
    `${adminAccessCookie}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
    `${adminRefreshCookie}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`
  ];
}

function parseCookies(cookieHeader: string | null) {
  return Object.fromEntries(
    (cookieHeader ?? "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separator = cookie.indexOf("=");
        return separator === -1 ? [cookie, ""] : [cookie.slice(0, separator), decodeURIComponent(cookie.slice(separator + 1))];
      })
  );
}

export function adminAccessTokenFromRequest(request: Request) {
  return parseCookies(request.headers.get("cookie"))[adminAccessCookie];
}

export async function signInAdminWithPassword(email: string, password: string) {
  const { url, anonKey } = supabaseAuthConfig();

  if (!url || !anonKey) {
    return { error: "Supabase Auth is not configured." };
  }

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
  const result = (await response.json().catch(() => null)) as SupabasePasswordResponse | null;

  if (!response.ok || !result?.access_token || !result.user) {
    return { error: result?.error_description || result?.msg || "Invalid email or password." };
  }

  if (!isSupabaseAdminUser(result.user)) {
    return { error: "This account is not authorized for Ghana Growers admin access.", status: 403 };
  }

  return {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
    expiresIn: result.expires_in ?? 3600,
    user: adminUserFromSupabase(result.user)
  };
}

export async function requestAdminPasswordReset(email: string, redirectTo?: string) {
  const { url, anonKey } = supabaseAuthConfig();

  if (!url || !anonKey) {
    return { error: "Supabase Auth is not configured." };
  }

  const response = await fetch(`${url}/auth/v1/recover`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, redirect_to: redirectTo })
  });
  const result = (await response.json().catch(() => null)) as { msg?: string; error_description?: string } | null;

  if (!response.ok) {
    return { error: result?.error_description || result?.msg || "Could not send password reset email." };
  }

  return { ok: true };
}

export async function getAdminUserFromAccessToken(accessToken?: string): Promise<AdminUser | null> {
  const { url, anonKey } = supabaseAuthConfig();

  if (!url || !anonKey || !accessToken) {
    return null;
  }

  const response = await fetch(`${url}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });
  const user = (await response.json().catch(() => null)) as SupabaseUserResponse | null;

  if (!response.ok || !user || !isSupabaseAdminUser(user)) {
    return null;
  }

  return adminUserFromSupabase(user);
}

export async function getAdminUserFromRequest(request: Request) {
  return getAdminUserFromAccessToken(adminAccessTokenFromRequest(request));
}

export async function requireAdminUser(request: Request) {
  return getAdminUserFromRequest(request);
}
