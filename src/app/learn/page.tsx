import { LearnHub } from "@/components/LearnHub";
import { PageHero } from "@/components/PageHero";
import { blogPosts } from "@/data/blog";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Learn Hub",
  description: "Practical Ghana Growers education for crops, livestock, home gardening, agribusiness, seasonal farming, and farmer video guides.",
  path: "/learn"
});

export default function LearnPage() {
  return (
    <>
      <PageHero
        eyebrow="Learn Hub"
        title="Practical agricultural education for Ghana"
        description="Browse guides for crop production, livestock, home gardening, agribusiness, seasonal farming, and short farmer training videos."
      />
      <LearnHub posts={blogPosts} />
    </>
  );
}
