import type { BlogPost } from "@/types";
import learnArticles from "@/data/learnArticles.json";

export const blogPosts = learnArticles as BlogPost[];

export const learnCategories = [
  "Crops",
  "Livestock",
  "Home Gardening",
  "Agribusiness",
  "Seasonal Farming",
  "Video Library"
] as const;

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
