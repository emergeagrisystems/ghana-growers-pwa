import { NextResponse, type NextRequest } from "next/server";

const PREVIEW_COOKIE = "ghana_growers_dev_preview";

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
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

function isAllowedPrelaunchRoute(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api") ||
    pathname === "/launching-soon" ||
    pathname === "/dev-preview" ||
    pathname === "/preview" ||
    pathname === "/supplier-registration" ||
    pathname === "/join/supplier" ||
    pathname === "/join/farmer" ||
    pathname === "/join/buyer" ||
    pathname === "/waitlist" ||
    isPublicAsset(pathname)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!prelaunchEnabled()) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.rewrite(new URL("/launching-soon", request.url));
  }

  if (isAllowedPrelaunchRoute(pathname)) {
    return NextResponse.next();
  }

  if (request.cookies.get(PREVIEW_COOKIE)?.value === "enabled") {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL("/launching-soon", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
