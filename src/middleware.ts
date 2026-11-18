import { NextResponse, type NextRequest } from "next/server";
import { isolatedSupabaseUrl } from "@/lib/supabase/isolation";
import { isControlledPrelaunchRoute, isInternalPreviewRoute, isPublicFarmMatePilotRoute } from "@/lib/farmmate/pilot-access";
import { isHqApprovalCountsPrelaunchRoute, isPrelaunchIntakeRoute, isPrelaunchLegalRoute } from "@/lib/prelaunchAccess";
import { previewAccessCookie, verifyPreviewAccessToken } from "@/lib/previewAccess";

function prelaunchEnabled() {
  return process.env.SITE_PRELAUNCH !== "false";
}

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/stage1-media/") ||
    pathname.startsWith("/hm1/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/rc1/") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg"
  );
}

function isPrelaunchSeoRoute(pathname: string) {
  return pathname === "/robots.txt" || pathname === "/sitemap.xml";
}

function isAllowedPrelaunchRoute(pathname: string) {
  return (
    isHqApprovalCountsPrelaunchRoute(pathname) ||
    isPrelaunchSeoRoute(pathname) ||
    isPrelaunchIntakeRoute(pathname) ||
    isPrelaunchLegalRoute(pathname) ||
    isControlledPrelaunchRoute(pathname) ||
    isPublicAsset(pathname)
  );
}

function gatedResponse(request: NextRequest) {
  const response = NextResponse.rewrite(new URL("/launching-soon", request.url));
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // A first automatic branch build may precede environment configuration.
  // Never expose inherited Production credentials or API paths in that interval.
  if (process.env.VERCEL_ENV === "preview" && (!isolatedSupabaseUrl() || process.env.RC1_STAGING_READY !== "true")) {
    return new NextResponse("RC1 Preview is unavailable until staging isolation is configured.", {
      status: 503, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" }
    });
  }

  // Internal previews stay private independently of the public launch mode.
  if (isInternalPreviewRoute(pathname)) {
    let previewAccessGranted = false;
    try {
      previewAccessGranted = await verifyPreviewAccessToken(
        request.cookies.get(previewAccessCookie)?.value,
        process.env.PREVIEW_ACCESS_SECRET
      );
    } catch {
      // A verification/configuration failure must never expose preview content.
    }

    const response = previewAccessGranted
      ? NextResponse.next()
      : prelaunchEnabled()
        ? gatedResponse(request)
        : new NextResponse("Preview access is restricted.", { status: 403 });
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (!prelaunchEnabled()) {
    if (pathname === "/launching-soon") {
      return NextResponse.redirect(new URL("/", request.url), {
        status: 307, headers: { "Cache-Control": "private, no-store, max-age=0" }
      });
    }
    return NextResponse.next();
  }

  let previewAccessGranted = false;
  try {
    previewAccessGranted = await verifyPreviewAccessToken(
      request.cookies.get(previewAccessCookie)?.value,
      process.env.PREVIEW_ACCESS_SECRET
    );
  } catch { /* Fail closed without changing the existing authorisation mechanism. */ }

  if (previewAccessGranted) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  // Deny before product, provider, usage or credit handlers execute. Never API HTML.
  if (pathname === "/api/farmmate" || (isPublicFarmMatePilotRoute(pathname) && pathname.startsWith("/api/"))) {
    return NextResponse.json({ ok: false, code: "PRELAUNCH_UNAVAILABLE", message: "Mama G is available when Ghana Growers launches." }, {
      status: 503, headers: { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" }
    });
  }

  if (pathname === "/") {
    return gatedResponse(request);
  }

  if (pathname === "/join/supplier" || pathname === "/supplier-registration") {
    return NextResponse.redirect(new URL("/become-a-supplier", request.url));
  }

  if (isAllowedPrelaunchRoute(pathname)) {
    const response = NextResponse.next();
    if (!isPublicAsset(pathname)) response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  return gatedResponse(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
