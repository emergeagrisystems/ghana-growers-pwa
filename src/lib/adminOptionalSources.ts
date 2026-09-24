export type AdminOptionalSourceAvailability = "available" | "unavailable";

type SupabaseOptionalSourceResult<T extends Record<string, unknown>> = {
  data?: T[];
  error?: string;
  status: number;
};

export type AdminOptionalSourceResult<T extends Record<string, unknown>> =
  | { state: "available"; data: T[] }
  | { state: "unavailable"; data: [] }
  | { state: "error"; status: number; code: "OPTIONAL_SOURCE_READ_FAILED" };

const missingSourcePatterns = [
  /could not find the table .* in the schema cache/i,
  /relation .* does not exist/i,
  /pgrst205/i,
  /42p01/i
];

export function isMissingAdminOptionalSource(error: string | undefined) {
  return Boolean(error && missingSourcePatterns.some((pattern) => pattern.test(error)));
}

export function resolveAdminOptionalSource<T extends Record<string, unknown>>(
  result: SupabaseOptionalSourceResult<T>
): AdminOptionalSourceResult<T> {
  if (!result.error) {
    return { state: "available", data: result.data ?? [] };
  }

  if (isMissingAdminOptionalSource(result.error)) {
    return { state: "unavailable", data: [] };
  }

  return {
    state: "error",
    status: result.status >= 500 ? result.status : 503,
    code: "OPTIONAL_SOURCE_READ_FAILED"
  };
}

export function logAdminOptionalSourceFailure({
  route,
  feature,
  table,
  status,
  code
}: {
  route: string;
  feature: string;
  table: string;
  status: number;
  code: string;
}) {
  console.error("[admin:optional-source] Read failed", {
    route,
    feature,
    table,
    status,
    code
  });
}
