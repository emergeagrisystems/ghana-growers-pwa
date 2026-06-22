import type { Metadata } from "next";
import { siteConfig } from "@/data/site";

export const defaultOgImage = "/images/hero/ghana-growers-trade-hero.png";

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, siteConfig.url).toString();
}

function titleWithBrand(title: string) {
  return title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`;
}

export function createPageMetadata({
  title,
  description,
  path,
  image = defaultOgImage,
  noIndex = false
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const brandedTitle = titleWithBrand(title);

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(path)
    },
    openGraph: {
      title: brandedTitle,
      description,
      url: absoluteUrl(path),
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1778,
          height: 885,
          alt: `${siteConfig.name} agricultural platform in Ghana`
        }
      ],
      locale: "en_GH",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
      images: [image]
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false
          }
        }
      : undefined
  };
}

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Accra",
      addressCountry: "GH"
    },
    areaServed: {
      "@type": "Country",
      name: "Ghana"
    },
    sameAs: []
  };
}
