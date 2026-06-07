import type { BlogPost } from "@/types";
import learnArticles from "@/data/learnArticles.json";

// Edit learning and blog previews in learnArticles.json. A future CMS/database can replace this JSON file.
export const blogPosts = learnArticles as BlogPost[];
