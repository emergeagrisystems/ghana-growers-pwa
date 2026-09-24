import type { ProfileApplicationKind } from "./profileApplicationContracts";

export type ConversionApplicationState = {
  id: string;
  status: string;
  linkedProfileId?: string | null;
};

export type ConversionStore = {
  loadApplication: (kind: ProfileApplicationKind, applicationId: string) => Promise<{
    data?: ConversionApplicationState;
    status: number;
    error?: string;
  }>;
  findProfileBySource: (kind: ProfileApplicationKind, applicationId: string) => Promise<{
    profileId?: string;
    status: number;
    error?: string;
  }>;
  createProfile: (kind: ProfileApplicationKind, profile: Record<string, unknown>) => Promise<{
    profileId?: string;
    status: number;
    error?: string;
  }>;
  linkApplication: (kind: ProfileApplicationKind, applicationId: string, profileId: string) => Promise<{
    status: number;
    error?: string;
  }>;
};

export async function convertApprovedApplication({
  kind,
  applicationId,
  profile,
  store
}: {
  kind: ProfileApplicationKind;
  applicationId: string;
  profile: Record<string, unknown>;
  store: ConversionStore;
}) {
  const applicationResult = await store.loadApplication(kind, applicationId);
  const application = applicationResult.data;

  if (applicationResult.error || !application) {
    return { status: applicationResult.status, error: applicationResult.error ?? "Application not found." };
  }

  if (application.linkedProfileId) {
    return { status: 200, profileId: application.linkedProfileId, reused: true };
  }

  if (application.status !== "Approved") {
    return { status: 409, error: "Only an approved application can be converted." };
  }

  const existing = await store.findProfileBySource(kind, applicationId);
  let profileId = existing.profileId;
  let reused = Boolean(profileId);

  if (!profileId) {
    const created = await store.createProfile(kind, profile);
    profileId = created.profileId;

    if (!profileId) {
      const raced = await store.findProfileBySource(kind, applicationId);
      profileId = raced.profileId;
      reused = Boolean(profileId);

      if (!profileId) {
        return { status: created.status, error: created.error ?? "Profile could not be created." };
      }
    }
  }

  const linked = await store.linkApplication(kind, applicationId, profileId);
  if (linked.error) {
    return { status: linked.status, error: linked.error };
  }

  return { status: 200, profileId, reused };
}
