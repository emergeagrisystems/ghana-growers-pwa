import type { MetadataRoute } from "next";
import { blogPosts } from "@/data/blog";
import { absoluteUrl } from "@/lib/seo";

const publicRoutes = [
  "/",
  "/marketplace",
  "/buyer-requests",
  "/farmer-directory",
  "/supplier-directory",
  "/farmer-hub",
  "/learn",
  "/faq",
  "/success-stories",
  "/about",
  "/contact",
  "/partner-with-us",
  "/gg-standard",
  "/verification-process",
  "/verification-requirements",
  "/privacy-policy",
  "/terms-of-use",
  "/services",
  "/services/buy",
  "/join",
  "/join/farmer",
  "/join/buyer",
  "/become-a-supplier",
  "/submit-buyer-request",
  "/submit-produce-listing",
  "/market-intelligence"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const articleRoutes = blogPosts.map((post) => `/learn/${post.slug}`);

  return [...publicRoutes, ...articleRoutes].map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : route.includes("/join") ? 0.8 : 0.7
  }));
}
