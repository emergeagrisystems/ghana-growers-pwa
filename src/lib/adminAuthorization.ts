export const adminEmailAllowlistEnvironmentVariable = "ADMIN_EMAIL_ALLOWLIST";

export type AdminAuthorizationUser = {
  id?: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
};

export type AdminAuthorizationDecision =
  | { authorized: true; source: "app_metadata" | "email_allowlist" }
  | { authorized: false; reason: "authorization_unconfigured" | "not_authorized" };

function metadataHasAdminRole(metadata?: Record<string, unknown>) {
  const role = metadata?.role;
  const roles = metadata?.roles;
  const isAdmin = metadata?.admin;

  return role === "admin" || isAdmin === true || (Array.isArray(roles) && roles.includes("admin"));
}

export function normalizeAdminEmail(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

export function adminEmailAllowlist(value?: string) {
  return new Set(
    (value ?? "")
      .split(/[;,\n\r]+/)
      .map(normalizeAdminEmail)
      .filter(Boolean)
  );
}

export function authorizeAdminIdentity(
  user: AdminAuthorizationUser | undefined,
  allowlistValue?: string
): AdminAuthorizationDecision {
  if (!user?.id) {
    return { authorized: false, reason: "not_authorized" };
  }

  if (metadataHasAdminRole(user.app_metadata)) {
    return { authorized: true, source: "app_metadata" };
  }

  const allowlist = adminEmailAllowlist(allowlistValue);
  const email = normalizeAdminEmail(user.email);

  if (email && allowlist.has(email)) {
    return { authorized: true, source: "email_allowlist" };
  }

  return {
    authorized: false,
    reason: allowlist.size === 0 ? "authorization_unconfigured" : "not_authorized"
  };
}
