import type { BuyerRequest } from "@/data/buyerRequests";
import type { FarmerProfile, Product } from "@/types";

const productNoiseWords = new Set([
  "fresh",
  "red",
  "yellow",
  "mature",
  "local",
  "quality",
  "organic",
  "ghana",
  "farm",
  "produce",
  "supply",
  "needed",
  "available"
]);

export function normalizeMatchText(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchTokens(value?: string | null) {
  return normalizeMatchText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !productNoiseWords.has(token));
}

export function productMatchScore(primary?: string | null, candidate?: string | null) {
  const primaryText = normalizeMatchText(primary);
  const candidateText = normalizeMatchText(candidate);

  if (!primaryText || !candidateText) {
    return 0;
  }

  if (primaryText === candidateText) {
    return 8;
  }

  if (primaryText.includes(candidateText) || candidateText.includes(primaryText)) {
    return 6;
  }

  const primaryTokens = new Set(matchTokens(primaryText));
  const candidateTokens = new Set(matchTokens(candidateText));
  const sharedTokens = Array.from(primaryTokens).filter((token) => candidateTokens.has(token));

  return sharedTokens.length * 3;
}

export function locationMatchScore(
  request: Pick<BuyerRequest, "region" | "district">,
  candidate: { region?: string | null; district?: string | null; location?: string | null }
) {
  let score = 0;
  const requestRegion = normalizeMatchText(request.region);
  const requestDistrict = normalizeMatchText(request.district);
  const candidateRegion = normalizeMatchText(candidate.region);
  const candidateDistrict = normalizeMatchText(candidate.district ?? candidate.location);

  if (requestRegion && candidateRegion && requestRegion === candidateRegion) {
    score += 3;
  }

  if (requestDistrict && candidateDistrict && (requestDistrict === candidateDistrict || candidateDistrict.includes(requestDistrict) || requestDistrict.includes(candidateDistrict))) {
    score += 2;
  }

  return score;
}

export function findMatchingFarmersForRequest(request: BuyerRequest, farmers: FarmerProfile[], limit = 4) {
  return farmers
    .map((farmer) => {
      const productScore = Math.max(...farmer.products.map((product) => productMatchScore(request.productName, product)), 0);
      const score = productScore + locationMatchScore(request, farmer);

      return { farmer, score };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.farmer.farmName.localeCompare(b.farmer.farmName))
    .slice(0, limit)
    .map((match) => match.farmer);
}

export function findMatchingListingsForRequest(request: BuyerRequest, products: Product[], limit = 4) {
  return products
    .map((product) => {
      const productScore = Math.max(productMatchScore(request.productName, product.name), productMatchScore(request.productName, product.category));
      const score = productScore + locationMatchScore(request, {
        region: product.region,
        location: product.location
      });

      return { product, score };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, limit)
    .map((match) => match.product);
}

export function findBuyerRequestsForFarmer(farmer: FarmerProfile, requests: BuyerRequest[], limit = 4) {
  return requests
    .map((request) => {
      const productScore = Math.max(...farmer.products.map((product) => productMatchScore(request.productName, product)), 0);
      const score = productScore + locationMatchScore(request, farmer);

      return { request, score };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.request.productName.localeCompare(b.request.productName))
    .slice(0, limit)
    .map((match) => match.request);
}

export function findBuyerRequestsForListing(product: Product, requests: BuyerRequest[], limit = 4) {
  return requests
    .map((request) => {
      const productScore = Math.max(productMatchScore(request.productName, product.name), productMatchScore(request.productName, product.category));
      const score = productScore + locationMatchScore(request, {
        region: product.region,
        location: product.location
      });

      return { request, score };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.request.productName.localeCompare(b.request.productName))
    .slice(0, limit)
    .map((match) => match.request);
}

export function buildBuyerRequestMatches(requests: BuyerRequest[], farmers: FarmerProfile[], products: Product[], limitPerRequest = 3) {
  return requests
    .map((request) => ({
      request,
      farmers: findMatchingFarmersForRequest(request, farmers, limitPerRequest),
      listings: findMatchingListingsForRequest(request, products, limitPerRequest)
    }))
    .filter((match) => match.farmers.length > 0 || match.listings.length > 0);
}
