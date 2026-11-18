export const hqApprovalCountsPrelaunchPath = "/api/integrations/hq/approval-counts";

export function isHqApprovalCountsPrelaunchRoute(pathname: string) {
  return pathname === hqApprovalCountsPrelaunchPath;
}

// Exact acquisition routes only. Their handlers still enforce independent workflow flags.
export const prelaunchIntakeRoutes = [
  "/join/farmer", "/api/farmer-registration",
  "/become-a-supplier", "/api/supplier-registration",
  "/submit-listing", "/api/listing-submissions",
  "/submit-buyer-request", "/api/buyer-request-submissions"
] as const;
export function isPrelaunchIntakeRoute(pathname: string) {
  return prelaunchIntakeRoutes.some(route => route === pathname);
}
export function isPrelaunchLegalRoute(pathname: string) {
  return ["/privacy-policy", "/terms-of-use", "/privacy", "/terms"].includes(pathname);
}
