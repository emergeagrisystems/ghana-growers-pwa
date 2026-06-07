import { BlogCard } from "@/components/BlogCard";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { blogPosts } from "@/data/blog";

export const metadata = {
  title: "Learn | Ghana Agriculture Articles",
  description: "Crop production, livestock, agribusiness, market prices, and success story previews for the Ghana Growers community."
};

const categories = ["Crop Production", "Livestock", "Agribusiness", "Market Prices", "Success Stories"];

export default function LearnPage() {
  return (
    <>
      <PageHero
        eyebrow="Learn"
        title="Practical knowledge for Ghana's agricultural community"
        description="Explore crop production, livestock, agribusiness, market price, and success story previews designed for farmers, buyers, suppliers, and agricultural partners."
      />
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Learning categories"
            title="Guides, market insight, and stories from Ghanaian agriculture"
            description="Use these JSON-backed article records as the starting point for a blog, CMS, newsletter, or knowledge base."
          />
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category} className="rounded-md bg-leaf-50 px-4 py-2 text-sm font-black text-leaf-700">
                {category}
              </span>
            ))}
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => <BlogCard key={post.slug} post={post} />)}
          </div>
        </div>
      </section>
    </>
  );
}
