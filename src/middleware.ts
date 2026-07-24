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
  return isPublicFarmMatePilotRoute(pathname) || isControlledPrelaunchRoute(pathname) || isPublicAsset(pathname);
}

function requestHeaders(request: NextRequest, isBrandLab = false) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-ghana-growers-brand-lab");

  if (isBrandLab) {
    requestHeaders.set("x-ghana-growers-brand-lab", "1");
  }

  return requestHeaders;
}

function nextResponse(request: NextRequest, isBrandLab = false) {
  return NextResponse.next({
    request: {
      headers: requestHeaders(request, isBrandLab)
    }
  });
}

function rewriteResponse(request: NextRequest, destination: URL) {
  return NextResponse.rewrite(destination, {
    request: {
      headers: requestHeaders(request)
    }
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The page performs its own preview-deployment or authorized-admin check.
  if (pathname === "/brand-lab") {
    return nextResponse(request, true);
  }

  if (!prelaunchEnabled()) {
    return nextResponse(request);
  }

  const previewAccessGranted = await verifyPreviewAccessToken(
    request.cookies.get(previewAccessCookie)?.value,
    process.env.PREVIEW_ACCESS_SECRET
  );

  if (previewAccessGranted) {
    return nextResponse(request);
  }

  if (pathname === "/") {
    return rewriteResponse(request, new URL("/launching-soon", request.url));
  }

  if (pathname === "/join/supplier" || pathname === "/supplier-registration") {
    return NextResponse.redirect(new URL("/become-a-supplier", request.url));
  }

  if (isAllowedPrelaunchRoute(pathname)) {
    return nextResponse(request);
  }

  return rewriteResponse(request, new URL("/launching-soon", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
