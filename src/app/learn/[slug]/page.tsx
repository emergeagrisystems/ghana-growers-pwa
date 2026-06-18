import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { SafeImage } from "@/components/SafeImage";
import { blogPosts, getBlogPost } from "@/data/blog";

type ArticlePageProps = {
  params: {
    slug: string;
  };
};

const categoryImages = {
  "Crop Production": "/images/marketplace/farm-activity-1.jpg",
  Livestock: "/images/crops/poultry.jpg",
  "Market Access": "/images/marketplace/ghana-market-1.jpg",
  "Farm Business": "/images/marketplace/ghana-market-2.jpg",
  "Supplier Guides": "/images/suppliers/supplier-1.jpg",
  "Buyer Guides": "/images/marketplace/ghana-market-3.jpg",
  "Ghana Growers Guides": "/images/hero/ghana-growers-hero.jpg"
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: ArticlePageProps) {
  const post = getBlogPost(params.slug);

  if (!post) {
    return {
      title: "Resource Not Found | Ghana Growers"
    };
  }

  return {
    title: `${post.title} | Ghana Growers Resources`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [categoryImages[post.category]]
    }
  };
}

export default function LearnArticlePage({ params }: ArticlePageProps) {
  const post = getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="bg-white">
      <section className="bg-gradient-to-br from-leaf-50 via-white to-earth-50 py-10 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">{post.category}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-ink sm:text-5xl">{post.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">{post.excerpt}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold text-ink/55">
              <span>{new Date(post.date).toLocaleDateString("en-GH", { month: "long", day: "numeric", year: "numeric" })}</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={15} aria-hidden="true" />
                {post.readTime}
              </span>
              {post.audience ? <span>{post.audience}</span> : null}
            </div>
          </div>
          <SafeImage
            src={categoryImages[post.category]}
            alt={`${post.title} guide image`}
            width={820}
            height={560}
            className="aspect-[4/3] w-full rounded-md object-cover shadow-soft"
            fallbackKind="default"
            priority
            sizes="(min-width: 1024px) 48vw, 100vw"
          />
        </div>
      </section>

      <section className="py-12 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_0.28fr] lg:px-8">
          <div className="min-w-0">
            {post.sections?.map((section) => (
              <section key={section.heading} className="border-b border-leaf-900/10 py-7 first:pt-0 last:border-b-0">
                <h2 className="text-2xl font-black text-ink">{section.heading}</h2>
                <p className="mt-4 text-base leading-8 text-ink/70">{section.body}</p>
              </section>
            ))}
          </div>

          <aside className="h-fit rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
            <h2 className="text-lg font-black text-ink">Key points</h2>
            <ul className="mt-4 grid gap-3">
              {post.keyPoints?.map((point) => (
                <li key={point} className="rounded-md bg-white p-3 text-sm font-semibold leading-6 text-ink/70 ring-1 ring-leaf-900/10">
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <ButtonLink href="/learn" variant="secondary">Back to Resources</ButtonLink>
            </div>
          </aside>
        </div>
      </section>
    </article>
  );
}
