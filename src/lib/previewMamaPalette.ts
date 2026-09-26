import "server-only";

export type PreviewMamaPalette = "wine" | "teal";

export function getPreviewMamaPalette(value: string | string[] | undefined): PreviewMamaPalette | null {
  const localDevelopment = process.env.NODE_ENV === "development";
  const protectedRc1Preview =
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "codex/p09-rc1";

  if (!localDevelopment && !protectedRc1Preview) return null;
  if (value === "wine" || value === "teal") return value;
  return null;
}
