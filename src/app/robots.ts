import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_PRELAUNCH !== "false") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/"
      }
    };
  }

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
        "/dev-preview",
        "/whatsapp-communities",
        "/about/blog"
      ]
    },
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
