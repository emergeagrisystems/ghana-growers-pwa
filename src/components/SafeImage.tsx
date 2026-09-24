"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { fallbackForImage, type ImageFallbackKind } from "@/lib/imageFallbacks";

type SafeImageProps = ImageProps & {
  fallbackSrc?: string;
  fallbackKind?: ImageFallbackKind;
};

export function SafeImage({ fallbackSrc, fallbackKind = "default", src, alt, onError, ...props }: SafeImageProps) {
  const resolvedFallback = fallbackSrc ?? fallbackForImage(fallbackKind);
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={(event) => {
        if (currentSrc !== resolvedFallback) {
          setCurrentSrc(resolvedFallback);
        }

        onError?.(event);
      }}
    />
  );
}
