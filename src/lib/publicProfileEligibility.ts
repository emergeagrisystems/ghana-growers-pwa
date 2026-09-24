type PublicProfileEligibilityRecord = {
  slug?: string | null;
  status?: string | null;
  verificationStatus?: string | null;
  verification_status?: string | null;
  source?: string | null;
};

export type PublicFarmerEligibilityRecord = PublicProfileEligibilityRecord & {
  launchReady?: boolean | null;
  launch_ready?: boolean | null;
  isFeatured?: boolean | null;
  is_featured?: boolean | null;
  featuredUntil?: string | null;
  featured_until?: string | null;
};

export type PublicSupplierEligibilityRecord = PublicProfileEligibilityRecord;

const validPublicSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const demoOriginPattern = /(^|\b)(demo|seed data|seed record|seed profile|sample|mock|placeholder)(\b|$)/i;

export function isValidPublicProfileSlug(value?: string | null) {
  return Boolean(value && validPublicSlugPattern.test(value.trim()));
}

export function isDemoProfileOrigin(value?: string | null) {
  return Boolean(value && demoOriginPattern.test(value.trim()));
}

function verificationStatus(record: PublicProfileEligibilityRecord) {
  return record.verification_status ?? record.verificationStatus;
}

export function isEligiblePublicFarmer(record: PublicFarmerEligibilityRecord) {
  const launchReady = record.launch_ready ?? record.launchReady;

  return (
    record.status === "Active" &&
    verificationStatus(record) === "Verified" &&
    launchReady === true &&
    isValidPublicProfileSlug(record.slug) &&
    !isDemoProfileOrigin(record.source)
  );
}

export function isEligibleFeaturedFarmer(record: PublicFarmerEligibilityRecord, now = new Date()) {
  const featuredUntil = record.featured_until ?? record.featuredUntil;
  const isCurrent = !featuredUntil || new Date(`${featuredUntil}T23:59:59`).getTime() >= now.getTime();

  return (
    isEligiblePublicFarmer(record) &&
    Boolean(record.is_featured ?? record.isFeatured) &&
    isCurrent
  );
}

export function isEligiblePublicSupplier(record: PublicSupplierEligibilityRecord) {
  return (
    record.status === "Active" &&
    verificationStatus(record) === "Verified" &&
    isValidPublicProfileSlug(record.slug) &&
    !isDemoProfileOrigin(record.source)
  );
}
