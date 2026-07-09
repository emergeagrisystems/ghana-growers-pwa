import type { BlogPost } from "@/types";
import { learnLessons } from "@/data/learnLessons";

export const blogPosts = learnLessons satisfies BlogPost[];

export const learnCategories = [
  "Soil & Compost",
  "Crop Care",
  "Pests & Diseases",
  "Harvest & Storage",
  "FarmMate Guides",
  "Video Lessons"
] as const;

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

