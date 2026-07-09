import type { BlogPost } from "@/types";
import learnArticles from "@/data/learnArticles.json";

export const blogPosts = learnArticles as BlogPost[];

export const learnCategories = [
  "Soil & Compost",
  "Crop Care",
  "Water & Weather",
  "Pests & Diseases",
  "Harvest & Selling",
  "FarmMate Guides",
  "Video Lessons"
] as const;

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
