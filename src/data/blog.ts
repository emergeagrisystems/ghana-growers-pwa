import type { BlogPost } from "@/types";
import learnArticles from "@/data/learnArticles.json";

export const blogPosts = learnArticles as BlogPost[];

export const learnCategories = [
  "Crop Production",
  "Livestock",
  "Market Access",
  "Farm Business",
  "Supplier Guides",
  "Buyer Guides",
  "Ghana Growers Guides"
] as const;

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
