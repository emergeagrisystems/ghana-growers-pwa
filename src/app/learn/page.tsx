import { BlogCard } from "@/components/BlogCard";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { blogPosts } from "@/data/blog";

export const metadata = {
  title: "Learn",
  description: "Educational articles, farming tips, buyer guides, and supplier resources from Ghana Growers."
};

export default function LearnPage() {
  return (
    <>
      <PageHero
        eyebrow="Learn"
        title="Practical knowledge for better agricultural trade"
        description="Explore farming tips, buyer guides, supplier resources, and learning content designed for the Ghana Growers community."
      />
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Featured learning cards" description="Use these article records as the starting point for a blog, CMS, newsletter, or knowledge base." />
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => <BlogCard key={post.slug} post={post} />)}
          </div>
        </div>
      </section>
    </>
  );
}
