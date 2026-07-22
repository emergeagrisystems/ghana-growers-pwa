import { NextResponse, type NextRequest } from "next/server";
import {
  adminAccessTokenFromRequest,
  getAdminAuthorizationFromAccessToken,
  type AdminSessionResult
} from "@/lib/adminAuth";
import {
  createPreviewAccessToken,
  previewAccessCookie,
  previewAccessDecision,
  previewAccessMaxAgeSeconds,
  previewAccessSecretIsConfigured,
  safePreviewDestination
} from "@/lib/previewAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };

function previewCookieOptions(request: NextRequest) {
  return {
    httpOnly: true,
    maxAge: previewAccessMaxAgeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:"
  };
}

function clearPreviewCookie(response: NextResponse, request: NextRequest) {
  response.cookies.set(previewAccessCookie, "", {
    ...previewCookieOptions(request),
    maxAge: 0
  });
}

function adminLoginResponse(request: NextRequest, destination: string) {
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", `/dev-preview?destination=${encodeURIComponent(destination)}`);
  const response = NextResponse.redirect(loginUrl, { headers: noStoreHeaders });
  clearPreviewCookie(response, request);
  return response;
}

function deniedResponse(request: NextRequest, status: 403 | 503, message: string, code: string) {
  console.warn("[preview-access]", {
    route: "/dev-preview",
    decision: status === 403 ? "forbidden" : "unavailable",
    code
  });
  const response = new NextResponse(message, {
    status,
    headers: { ...noStoreHeaders, "Content-Type": "text/plain; charset=utf-8" }
  });
  clearPreviewCookie(response, request);
  return response;
}

export async function GET(request: NextRequest) {
  const exitRequested = request.nextUrl.searchParams.get("exit") === "1";
  const destination = safePreviewDestination(request.nextUrl.searchParams.get("destination"));

  if (exitRequested) {
    const response = NextResponse.redirect(new URL("/launching-soon", request.url), { headers: noStoreHeaders });
    clearPreviewCookie(response, request);
    return response;
  }

  const accessToken = adminAccessTokenFromRequest(request);

  if (!accessToken) {
    return adminLoginResponse(request, destination);
  }

  const authorization: AdminSessionResult = await getAdminAuthorizationFromAccessToken(accessToken);
  const previewSecret = process.env.PREVIEW_ACCESS_SECRET;
  const decision = previewAccessDecision({
    exitRequested,
    hasAccessToken: true,
    authorizationStatus: authorization.status,
    previewSecretConfigured: previewAccessSecretIsConfigured(previewSecret)
  });

  if (decision === "login") {
    return adminLoginResponse(request, destination);
  }

  if (decision === "forbidden") {
    const code = authorization.status === "forbidden" ? authorization.code : "admin_not_authorized";
    return deniedResponse(request, 403, "Preview access is restricted to authorized Ghana Growers administrators.", code);
  }

  if (decision === "unavailable") {
    const code = authorization.status === "unavailable" ? authorization.code : "preview_access_unconfigured";
    return deniedResponse(request, 503, "Preview access is temporarily unavailable.", code);
  }

  const previewToken = await createPreviewAccessToken(previewSecret as string);

  if (!previewToken) {
    return deniedResponse(request, 503, "Preview access is temporarily unavailable.", "preview_access_unconfigured");
  }

  const response = NextResponse.redirect(new URL(destination, request.url), { headers: noStoreHeaders });
  response.cookies.set(previewAccessCookie, previewToken, previewCookieOptions(request));
  return response;
}
