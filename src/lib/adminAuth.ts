import { createHmac, timingSafeEqual } from "crypto";

export const adminSessionCookie = "ghana_growers_admin_session";
export const adminSessionHeader = "x-ghana-growers-admin-session";

const sessionValue = "granted";

function sign(value: string) {
  const adminKey = process.env.ADMIN_ACCESS_KEY;

  if (!adminKey) {
    return "";
  }

  return createHmac("sha256", adminKey).update(value).digest("hex");
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

export function createAdminSessionCookie() {
  const signature = createAdminSessionToken();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${adminSessionCookie}=${signature}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${secure}`;
}

export function createAdminSessionToken() {
  const signature = sign(sessionValue);
  return `${sessionValue}.${signature}`;
}

function isValidSessionToken(token?: string) {
  const expectedSignature = sign(sessionValue);

  if (!expectedSignature || !token) {
    return false;
  }

  const [value, signature] = token.split(".");

  if (value !== sessionValue || !signature) {
    return false;
  }

  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signature);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function hasValidAdminSession(request: Request) {
  const headerToken = request.headers.get(adminSessionHeader) ?? undefined;

  if (isValidSessionToken(headerToken)) {
    return true;
  }

  const cookieToken = parseCookies(request.headers.get("cookie"))[adminSessionCookie];

  return isValidSessionToken(cookieToken);
}
