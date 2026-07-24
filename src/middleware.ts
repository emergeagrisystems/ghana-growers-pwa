import { NextResponse, type NextRequest } from "next/server";
import { isControlledPrelaunchRoute, isPublicFarmMatePilotRoute } from "@/lib/farmmate/pilot-access";
import { previewAccessCookie, verifyPreviewAccessToken } from "@/lib/previewAccess";

function prelaunchEnabled() {
  return process.env.SITE_PRELAUNCH !== "false";
}

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico"
  );
}

function isAllowedPrelaunchRoute(pathname: string) {
  return (
    pathname === "/logo-lab" ||
    isPublicFarmMatePilotRoute(pathname) ||
    isControlledPrelaunchRoute(pathname) ||
    isPublicAsset(pathname)
  );
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
    return NextResponse.rewrite(new URL("/launching-soon", request.url));
  }

  if (pathname === "/join/supplier" || pathname === "/supplier-registration") {
    return NextResponse.redirect(new URL("/become-a-supplier", request.url));
  }

  if (isAllowedPrelaunchRoute(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL("/launching-soon", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
