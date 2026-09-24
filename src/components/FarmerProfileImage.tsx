"use client";

import { useState, type SyntheticEvent } from "react";
import { SafeImage } from "@/components/SafeImage";
import type { ImageFallbackKind } from "@/lib/imageFallbacks";

type FarmerImageOrientation = "unknown" | "portrait" | "landscape";

type FarmerProfileImageProps = {
  src: string;
  alt: string;
  variant: "profile" | "card";
  sizes: string;
  priority?: boolean;
  unoptimized?: boolean;
  fallbackKind?: ImageFallbackKind;
  landscapePositionClass?: string;
};

export function FarmerProfileImage({
  src,
  alt,
  variant,
  sizes,
  priority = false,
  unoptimized = false,
  fallbackKind = "farmer",
  landscapePositionClass = "object-center"
}: FarmerProfileImageProps) {
  const [orientation, setOrientation] = useState<FarmerImageOrientation>("unknown");
  const isPortrait = orientation === "portrait";
  const frameClass = variant === "card"
    ? "relative aspect-[4/3] w-full overflow-hidden rounded-t-md bg-earth-50"
    : isPortrait
      ? "relative mx-auto aspect-[4/5] w-full max-w-[28rem] overflow-hidden rounded-md bg-earth-50 lg:max-h-[34rem]"
      : "relative h-72 w-full overflow-hidden rounded-md bg-earth-50 sm:h-80 lg:h-[340px]";
  const imageClass = variant === "card"
    ? `object-cover ${landscapePositionClass}`
    : isPortrait
      ? "object-contain object-center"
      : `object-cover ${landscapePositionClass}`;

  function detectOrientation(event: SyntheticEvent<HTMLImageElement>) {
    const { naturalHeight, naturalWidth } = event.currentTarget;
    setOrientation(naturalHeight > naturalWidth ? "portrait" : "landscape");
  }

  return (
    <div className={frameClass} data-farmer-image-orientation={orientation} data-farmer-image-variant={variant}>
      <SafeImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        unoptimized={unoptimized}
        fallbackKind={fallbackKind}
        sizes={sizes}
        onLoad={detectOrientation}
        className={imageClass}
      />
    </div>
  );
}
