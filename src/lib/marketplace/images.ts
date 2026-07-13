import type { Product } from "../../types";

function isPublicListingImage(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  return !/(unapproved|pending-review|private|draft)/i.test(normalized);
}

export function marketplaceListingImages(product: Pick<Product, "image" | "images">) {
  const images = product.images?.length ? product.images : [product.image];
  return Array.from(new Set(images.filter((image): image is string => typeof image === "string" && isPublicListingImage(image))));
}
