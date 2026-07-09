import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { blogPosts, getBlogPost } from "@/data/blog";
import { learnImageForPost } from "@/lib/learnImages";
import { createPageMetadata } from "@/lib/seo";

type ArticlePageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: ArticlePageProps) {
  const post = getBlogPost(params.slug);

  if (!post) {
    return createPageMetadata({
      title: "Resource Not Found",
      description: "This Ghana Growers resource could not be found.",
      path: `/learn/${params.slug}`,
      noIndex: true
    });
  }

  return createPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/learn/${params.slug}`,
    image: learnImageForPost(post)
  });
}

export default function LearnArticlePage({ params }: ArticlePageProps) {
  const post = getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="bg-white">
      <section className="bg-[#ECE7D1] py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ButtonLink href="/learn" variant="secondary">
            <span className="inline-flex items-center gap-2">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Learn
            </span>
          </ButtonLink>
          <div className="mt-7">
            <p className="gg-eyebrow">{post.category}</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-ink sm:text-5xl">{post.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">{post.excerpt}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold text-ink/55">
              <span>Updated {new Date(post.date).toLocaleDateString("en-GH", { month: "long", day: "numeric", year: "numeric" })}</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={15} aria-hidden="true" />
                {post.readTime}
              </span>
              {post.audience ? <span>{post.audience}</span> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_0.28fr] lg:px-8">
          <div className="min-w-0 rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm sm:p-7">
            {post.sections?.map((section) => (
              <section key={section.heading} className="border-b border-leaf-900/10 py-7 first:pt-0 last:border-b-0 last:pb-0">
                <h2 className="text-xl font-black text-ink sm:text-2xl">{section.heading}</h2>
                <p className="mt-4 text-base leading-8 text-ink/70">{section.body}</p>
              </section>
            ))}
          </div>

          <aside className="h-fit rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
            <h2 className="text-lg font-black text-ink">Key points</h2>
            <ul className="mt-4 grid gap-3">
              {post.keyPoints?.map((point) => (
                <li key={point} className="flex gap-2 rounded-md bg-white p-3 text-sm font-semibold leading-6 text-ink/70 ring-1 ring-leaf-900/10">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-leaf-700" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <ButtonLink href="/farmer-hub" variant="primary">Open GG FarmMate</ButtonLink>
            </div>
          </aside>
        </div>
      </section>
    </article>
  );
}
