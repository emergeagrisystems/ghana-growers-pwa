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
        eyebrow="LEARN"
        title="Learn Better Farming"
        description="Practical guides, videos, and Ghana-focused farming knowledge to help farmers grow, sell, and improve."
        variant="compact"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a href="#start-here" className="focus-ring rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-700">
            Start Learning
          </a>
          <a href="#watch-videos" className="focus-ring rounded-md border border-leaf-900/15 bg-white px-5 py-3 text-sm font-black text-ink transition hover:bg-leaf-50">
            Watch Videos
          </a>
        </div>
      </PageHero>
      <LearnHub posts={blogPosts} />
    </>
  );
}
