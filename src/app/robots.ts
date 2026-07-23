import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/admin/*",
        "/api",
        "/api/",
        "/api/*",
        "/brand-lab",
        "/dev-preview",
        "/whatsapp-communities",
        "/about/blog"
      ]
    },
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
