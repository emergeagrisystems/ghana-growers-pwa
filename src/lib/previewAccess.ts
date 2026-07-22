export const previewAccessCookie = "ghana_growers_dev_preview";
export const previewAccessSecretEnvironmentVariable = "PREVIEW_ACCESS_SECRET";
export const previewAccessMaxAgeSeconds = 30 * 60;

export type PreviewAuthorizationStatus = "authorized" | "unauthenticated" | "forbidden" | "unavailable";
export type PreviewAccessDecision = "clear" | "login" | "forbidden" | "unavailable" | "grant";

const tokenVersion = "v1";
const tokenPurpose = "ghana-growers-preview";
const minimumSecretLength = 32;

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

async function previewSignature(expiresAt: number, secret: string) {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${tokenPurpose}:${tokenVersion}:${expiresAt}`)
  );

  return bytesToHex(new Uint8Array(signature));
}

export function previewAccessSecretIsConfigured(secret?: string) {
  return Boolean(secret && secret.length >= minimumSecretLength);
}

export async function createPreviewAccessToken(secret: string, now = Date.now()) {
  if (!previewAccessSecretIsConfigured(secret)) {
    return null;
  }

  const expiresAt = Math.floor(now / 1000) + previewAccessMaxAgeSeconds;
  const signature = await previewSignature(expiresAt, secret);

  return `${tokenVersion}.${expiresAt}.${signature}`;
}

export async function verifyPreviewAccessToken(token: string | undefined, secret: string | undefined, now = Date.now()) {
  if (!token || !previewAccessSecretIsConfigured(secret)) {
    return false;
  }

  const [version, rawExpiresAt, signature, ...extraParts] = token.split(".");
  const expiresAt = Number(rawExpiresAt);
  const currentTime = Math.floor(now / 1000);

  if (
    extraParts.length > 0 ||
    version !== tokenVersion ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= currentTime ||
    expiresAt > currentTime + previewAccessMaxAgeSeconds
  ) {
    return false;
  }

  const expectedSignature = await previewSignature(expiresAt, secret as string);
  return constantTimeEqual(signature ?? "", expectedSignature);
}

export function previewAccessDecision({
  exitRequested,
  hasAccessToken,
  authorizationStatus,
  previewSecretConfigured
}: {
  exitRequested: boolean;
  hasAccessToken: boolean;
  authorizationStatus?: PreviewAuthorizationStatus;
  previewSecretConfigured: boolean;
}): PreviewAccessDecision {
  if (exitRequested) {
    return "clear";
  }

  if (!hasAccessToken || authorizationStatus === "unauthenticated") {
    return "login";
  }

  if (authorizationStatus === "forbidden") {
    return "forbidden";
  }

  if (authorizationStatus === "unavailable" || !previewSecretConfigured) {
    return "unavailable";
  }

  return authorizationStatus === "authorized" ? "grant" : "login";
}

export function safeInternalPath(value: string | null | undefined, fallback: string) {
  const candidate = value?.trim();

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "https://preview.ghana-growers.invalid");

    if (parsed.origin !== "https://preview.ghana-growers.invalid") {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function safePreviewDestination(value?: string | null) {
  const destination = safeInternalPath(value, "/");

  if (
    destination === "/dev-preview" ||
    destination.startsWith("/dev-preview?") ||
    destination.startsWith("/api/") ||
    destination === "/admin/login" ||
    destination.startsWith("/admin/login?")
  ) {
    return "/";
  }

  return destination;
}

export function safeAdminReturnPath(value?: string | null) {
  const destination = safeInternalPath(value, "/admin");

  if (
    destination === "/admin" ||
    destination.startsWith("/admin/") ||
    destination === "/dev-preview" ||
    destination.startsWith("/dev-preview?")
  ) {
    return destination;
  }

  return "/admin";
}
