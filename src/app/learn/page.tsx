import { LearnHub } from "@/components/LearnHub";
import { PageHero } from "@/components/PageHero";
import { blogPosts, learnCategories } from "@/data/blog";

export const metadata = {
  title: "Learn & Resources | Ghana Growers",
  description: "Practical Ghana Growers guides for farmers, buyers, suppliers, market access, verification, and agricultural business decisions."
};

export default function LearnPage() {
  return (
    <>
      <PageHero
        eyebrow="Learn / Resources Hub"
        title="Guides for farmers, buyers, and suppliers"
        description="Find clear Ghana Growers resources about joining the network, selling produce, sourcing supply, supplier visibility, verification, and market information."
      />
      <section className="bg-earth-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {learnCategories.map((category) => (
              <span key={category} className="rounded-md bg-white px-4 py-2 text-sm font-black text-leaf-700 shadow-sm ring-1 ring-leaf-900/10">
                {category}
              </span>
            ))}
          </div>
        </div>
      </section>
      <LearnHub posts={blogPosts} />
    </>
  );
}
