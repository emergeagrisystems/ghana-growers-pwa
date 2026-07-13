"use client";

import { useMemo, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { marketplaceListingImages } from "@/lib/marketplace/images";
import type { Product } from "@/types";

type MarketplaceImageGalleryProps = {
  product: Pick<Product, "image" | "images">;
  title: string;
  sellerName: string;
};

export function MarketplaceImageGallery({ product, title, sellerName }: MarketplaceImageGalleryProps) {
  const images = useMemo(() => marketplaceListingImages(product), [product]);
  const [activeImage, setActiveImage] = useState(images[0] ?? product.image);
  const resolvedActiveImage = images.includes(activeImage) ? activeImage : images[0] ?? product.image;

  return (
    <div>
      <div className="overflow-hidden rounded-md border border-leaf-900/10 bg-leaf-50 shadow-card">
        <SafeImage
          src={resolvedActiveImage}
          alt={`${title} available from ${sellerName}`}
          width={900}
          height={675}
          fallbackKind="marketplace"
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="aspect-[16/10] w-full object-cover sm:aspect-[4/3]"
          priority
        />
      </div>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Listing image thumbnails">
          {images.map((image, index) => {
            const isActive = image === resolvedActiveImage;

            return (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(image)}
                aria-label={`Show image ${index + 1} for ${title}`}
                aria-pressed={isActive}
                className={`focus-ring h-16 w-20 shrink-0 overflow-hidden rounded-md border bg-white p-0.5 transition sm:h-20 sm:w-24 ${
                  isActive ? "border-leaf-700 ring-2 ring-leaf-700/25" : "border-leaf-900/10 hover:border-earth-500/60"
                }`}
              >
                <SafeImage
                  src={image}
                  alt=""
                  width={120}
                  height={96}
                  fallbackKind="marketplace"
                  sizes="96px"
                  className="h-full w-full rounded-[5px] object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
