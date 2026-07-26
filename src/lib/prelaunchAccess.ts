export const hqApprovalCountsPrelaunchPath = "/api/integrations/hq/approval-counts";

export function isHqApprovalCountsPrelaunchRoute(pathname: string) {
  return pathname === hqApprovalCountsPrelaunchPath;
}
