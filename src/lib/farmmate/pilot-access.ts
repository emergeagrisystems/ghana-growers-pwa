export const PUBLIC_FARMMATE_PILOT_PAGES = ["/farmer-hub", "/farmer-hub/feedback"] as const;

export const PROTECTED_FARMMATE_PILOT_PAGES = [
  "/",
  "/learn",
  "/learn/challenges/soil-health",
  "/buy",
  "/sell",
  "/directory",
  "/marketplace",
  "/join",
  "/about"
] as const;

export function isPublicFarmMatePilotPage(pathname: string) {
  return PUBLIC_FARMMATE_PILOT_PAGES.some((route) => pathname === route);
}

export function isPublicFarmMatePilotApi(pathname: string) {
  return pathname.startsWith("/api/farmmate/");
}

export function isPublicFarmMatePilotRoute(pathname: string) {
  return isPublicFarmMatePilotPage(pathname) || isPublicFarmMatePilotApi(pathname);
}

export function isProtectedFarmMatePilotPage(pathname: string) {
  return PROTECTED_FARMMATE_PILOT_PAGES.some((route) =>
    route === "/" ? pathname === route : pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isControlledPrelaunchRoute(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/") ||
    pathname === "/launching-soon" ||
    pathname === "/dev-preview" ||
    pathname.startsWith("/dev-preview/")
  );
}
