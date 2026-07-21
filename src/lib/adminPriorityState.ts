export type AdminPrioritySeverity = "neutral" | "active" | "due" | "overdue";

export function adminPrioritySeverity({
  count,
  hasDue = false,
  hasOverdue = false
}: {
  count: number;
  hasDue?: boolean;
  hasOverdue?: boolean;
}): AdminPrioritySeverity {
  if (count <= 0) {
    return "neutral";
  }

  if (hasOverdue) {
    return "overdue";
  }

  return hasDue ? "due" : "active";
}

export function adminMetricSeverityClass(severity: AdminPrioritySeverity) {
  return `admin-metric-${severity}`;
}

export function adminCountPillClass(severity: AdminPrioritySeverity) {
  return `admin-count-pill admin-count-${severity}`;
}

const severityRank: Record<AdminPrioritySeverity, number> = {
  neutral: 0,
  active: 1,
  due: 2,
  overdue: 3
};

export function adminPriorityActionClasses(
  items: ReadonlyArray<{ count: number; severity: AdminPrioritySeverity }>
) {
  let primaryIndex = -1;
  let primaryRank = -1;

  items.forEach((item, index) => {
    const rank = severityRank[item.severity];

    if (item.count > 0 && rank > primaryRank) {
      primaryIndex = index;
      primaryRank = rank;
    }
  });

  return items.map((item, index) => {
    if (item.count <= 0) {
      return "admin-action-tertiary";
    }

    return index === primaryIndex ? "admin-action-primary" : "admin-action-secondary";
  });
}
