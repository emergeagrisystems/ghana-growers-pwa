import { permanentRedirect } from "next/navigation";

type BuyRedirectPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const supportedMarketplaceParameters = ["search", "category"] as const;

function firstParameterValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function BuyRedirectPage({ searchParams = {} }: BuyRedirectPageProps) {
  const marketplaceParameters = new URLSearchParams();

  supportedMarketplaceParameters.forEach((name) => {
    const value = firstParameterValue(searchParams[name])?.trim();

    if (value) {
      marketplaceParameters.set(name, value);
    }
  });

  const query = marketplaceParameters.toString();
  permanentRedirect(`/marketplace${query ? `?${query}` : ""}`);
}
