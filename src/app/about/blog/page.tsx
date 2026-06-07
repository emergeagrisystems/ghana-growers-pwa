import { BlogCard } from "@/components/BlogCard";
import { PageHero } from "@/components/PageHero";
import { blogPosts } from "@/data/blog";

export const metadata = {
  title: "Blog",
  description: "Ghana Growers blog posts for farmers, buyers, and suppliers."
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Stories, guides, and updates from Ghana Growers"
        description="Sample blog posts for the Ghana Growers content library. Add, remove, or connect these records to a CMS when ready."
      />
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {blogPosts.map((post) => <BlogCard key={post.slug} post={post} />)}
        </div>
      </section>
    </>
  );
}
