export type DirectorySearchParams = { q?: string | string[]; scope?: string | string[]; from?: string | string[] };
export type DirectoryScope = "all" | "farms" | "suppliers";

export function directoryFilters(params?: DirectorySearchParams) {
  const raw = Array.isArray(params?.scope) ? params.scope[0] : params?.scope;
  const scope: DirectoryScope = raw === "farms" || raw === "suppliers" ? raw : "all";
  const query = Array.isArray(params?.q) ? params.q[0] : params?.q;
  return { scope, q: (query ?? "").trim().slice(0, 180) };
}

export function directoryQuery(scope: DirectoryScope, q: string, fromDirectory = false) {
  const params = new URLSearchParams();
  if (fromDirectory) params.set("from", "directory");
  if (scope !== "all") params.set("scope", scope);
  if (q) params.set("q", q);
  return params.size ? "?" + params.toString() : "";
}

export function directoryReturn(params?: DirectorySearchParams) {
  if (params?.from !== "directory") return undefined;
  const { scope, q } = directoryFilters(params);
  return "/directory" + directoryQuery(scope, q);
}
