export type FeaturedFields = {
  isFeatured?: boolean;
  featuredUntil?: string;
  featuredNote?: string;
};

export function isFeaturedActive(record: FeaturedFields) {
  if (!record.isFeatured) {
    return false;
  }

  if (!record.featuredUntil) {
    return true;
  }

  const expiresAt = new Date(`${record.featuredUntil}T23:59:59`);

  if (Number.isNaN(expiresAt.getTime())) {
    return true;
  }

  return expiresAt.getTime() >= Date.now();
}

export function featuredSort<T extends FeaturedFields>(records: T[]) {
  return [...records].sort((a, b) => Number(isFeaturedActive(b)) - Number(isFeaturedActive(a)));
}

