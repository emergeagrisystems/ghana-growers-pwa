import { LearnHub } from "@/components/LearnHub";
import { PageHero } from "@/components/PageHero";
import { blogPosts } from "@/data/blog";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Farmer Improvement Center",
  description: "Practical Ghana Growers lessons for soil health, compost, crop care, water conservation, harvest preparation, and GG FarmMate tools.",
  path: "/learn"
});

export default function LearnPage() {
  return (
    <>
      <PageHero
        eyebrow="LEARN"
        title="Farmer Improvement Center"
        description="Practical guides, short lessons, and sustainable farming skills to help farmers grow healthier crops, protect soil, and prepare better harvests."
        variant="compact"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a href="#soil-compost" className="focus-ring rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-700">
            Start with Soil Health
          </a>
          <a href="#skills-center" className="focus-ring rounded-md border border-leaf-900/15 bg-white px-5 py-3 text-sm font-black text-ink transition hover:bg-leaf-50">
            Browse Skills
          </a>
        </div>
      </PageHero>
      <LearnHub posts={blogPosts} />
    </>
  );
}
