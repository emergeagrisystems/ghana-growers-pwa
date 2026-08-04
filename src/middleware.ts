import { NextResponse, type NextRequest } from "next/server";
import { isControlledPrelaunchRoute, isPublicFarmMatePilotRoute } from "@/lib/farmmate/pilot-access";
import { isHqApprovalCountsPrelaunchRoute } from "@/lib/prelaunchAccess";
import { previewAccessCookie, verifyPreviewAccessToken } from "@/lib/previewAccess";

function prelaunchEnabled() {
  return process.env.SITE_PRELAUNCH !== "false";
}

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
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
    isPublicFarmMatePilotRoute(pathname) ||
    isControlledPrelaunchRoute(pathname) ||
    isPublicAsset(pathname)
  );
}

function gatedResponse(request: NextRequest) {
  const response = NextResponse.rewrite(new URL("/launching-soon", request.url));
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!prelaunchEnabled()) {
    return NextResponse.next();
  }

  const previewAccessGranted = await verifyPreviewAccessToken(
    request.cookies.get(previewAccessCookie)?.value,
    process.env.PREVIEW_ACCESS_SECRET
  );

  if (previewAccessGranted) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return gatedResponse(request);
  }

  if (pathname === "/join/supplier" || pathname === "/supplier-registration") {
    return NextResponse.redirect(new URL("/become-a-supplier", request.url));
  }

  if (isAllowedPrelaunchRoute(pathname)) {
    return NextResponse.next();
  }

  return gatedResponse(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
