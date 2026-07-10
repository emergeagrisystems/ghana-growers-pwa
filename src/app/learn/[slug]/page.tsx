import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Bot, CheckCircle2, Clock, ListChecks, Sprout, Target } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { getLearnIllustrationType, LearnIllustration, type LearnIllustrationType } from "@/components/learn/LearnIllustration";
import { blogPosts, getBlogPost } from "@/data/blog";
import { learnImageForPost } from "@/lib/learnImages";
import { createPageMetadata } from "@/lib/seo";
import type { BlogPost } from "@/types";

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

function sectionBody(post: BlogPost, heading: string) {
  return post.sections?.find((section) => section.heading === heading)?.body ?? "";
}

function splitPracticalText(text: string, limit = 5) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim().replace(/\.$/, ""))
    .filter(Boolean)
    .slice(0, limit);
}

function farmMateHref(prompt: string) {
  return prompt ? `/farmer-hub?tool=ask&question=${encodeURIComponent(prompt)}` : "/farmer-hub?tool=ask";
}

function actionStepIllustrationType(post: BlogPost, step: string, index: number): LearnIllustrationType {
  const text = `${post.title} ${step}`.toLowerCase();

  if (text.includes("spray")) return "spray-check";
  if (text.includes("rain") || text.includes("water") || text.includes("drain")) return "rain-drainage";
  if (text.includes("harvest") || text.includes("sort") || text.includes("pack")) return "harvest-sorting";
  if (text.includes("store") || text.includes("dry") || text.includes("maize") || text.includes("yam")) return "storage";
  if (text.includes("mulch")) return "mulch";
  if (text.includes("manure")) return "manure";
  if (text.includes("rotation")) return "rotation";
  if (text.includes("soil") || text.includes("compost")) return index % 2 === 0 ? "compost" : "soil-cover";
  if (text.includes("farmmate") || text.includes("photo")) return "farmmate";

  return getLearnIllustrationType(post);
}

export default function LearnArticlePage({ params }: ArticlePageProps) {
  const post = getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  const relatedLessons = (post.relatedLessons ?? [])
    .map((slug) => getBlogPost(slug))
    .filter((lesson): lesson is (typeof blogPosts)[number] => Boolean(lesson))
    .slice(0, 3);
  const needText = sectionBody(post, "What to check or what you need");
  const stepsText = sectionBody(post, "Practical steps");
  const mistakeText = sectionBody(post, "Mistakes to avoid");
  const farmMatePrompt = sectionBody(post, "When to ask FarmMate");
  const nextAction = sectionBody(post, "Next action");
  const betterPractice = sectionBody(post, "Better Practice");
  const actionSteps = splitPracticalText(stepsText, 5);
  const needItems = splitPracticalText(needText, 5);
  const doFirst = (post.keyPoints ?? []).slice(0, 4);
  const illustrationType = getLearnIllustrationType(post);
  const metadataChips = [
    post.readTime.replace("read", "lesson"),
    post.level,
    post.cost ? `${post.cost} cost` : null,
    post.audience ? `Best for: ${post.audience.toLowerCase()}` : null
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <article className="bg-white">
      <section className="bg-[#ECE7D1] py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ButtonLink href="/learn" variant="secondary">
            <span className="inline-flex items-center gap-2">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Learn
            </span>
          </ButtonLink>
          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_14rem] lg:items-end">
            <div>
              <p className="gg-eyebrow">{post.category}</p>
              <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-ink sm:text-4xl">{post.title}</h1>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/70">{post.excerpt}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-black text-ink/58">
                {metadataChips.map((chip) => (
                  <span key={chip} className="rounded-md bg-white/75 px-3 py-2 ring-1 ring-leaf-900/10">
                    {chip}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 rounded-md bg-white/75 px-3 py-2 ring-1 ring-leaf-900/10">
                  <Clock size={15} aria-hidden="true" />
                  Updated {new Date(post.date).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
            <LearnIllustration type={illustrationType} className="hidden lg:block" />
          </div>
        </div>
      </section>

      <section className="bg-[#F7F7EA] py-10 sm:py-12">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 lg:px-8">
          <section className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex items-start gap-3">
              <span className="gg-icon gg-icon-standard h-11 w-11 shrink-0">
                <Target size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="gg-eyebrow">Do this first</p>
                <h2 className="mt-2 text-2xl font-black text-ink">Start with these checks</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {doFirst.map((point) => (
                <div key={point} className="flex gap-3 rounded-md bg-leaf-50 p-4 text-sm font-black leading-6 text-ink">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-leaf-700" aria-hidden="true" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm sm:p-6">
            <p className="gg-eyebrow">Action Steps</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Do it in order</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {actionSteps.map((step, index) => (
                <div key={step} className="rounded-md bg-leaf-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10">
                      {index + 1}
                    </span>
                    <LearnIllustration type={actionStepIllustrationType(post, step, index)} size="mini" />
                  </div>
                  <p className="mt-3 text-sm font-black leading-6 text-ink">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[0.58fr_0.42fr]">
            <section className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <span className="gg-icon gg-icon-standard h-10 w-10">
                  <ListChecks size={19} aria-hidden="true" />
                </span>
                <h2 className="text-xl font-black text-ink">What you need or check</h2>
              </div>
              <ul className="mt-5 grid gap-3">
                {needItems.map((item) => (
                  <li key={item} className="flex gap-3 rounded-md bg-leaf-50 p-3 text-sm font-semibold leading-6 text-ink/70">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-leaf-700" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <span className="gg-icon gg-icon-standard h-10 w-10">
                  <Sprout size={19} aria-hidden="true" />
                </span>
                <h2 className="text-xl font-black text-ink">How to do it</h2>
              </div>
              <ol className="mt-5 grid list-decimal gap-2 pl-5">
                {actionSteps.map((step) => (
                  <li key={step} className="text-sm font-semibold leading-6 text-ink/70">
                    {step}.
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-md border border-earth-700/15 bg-earth-50 p-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-earth-700" aria-hidden="true" />
                <h2 className="text-xl font-black text-ink">Common mistake</h2>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-ink/70">{mistakeText}</p>
            </section>

            <section className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-leaf-700" aria-hidden="true" />
                <h2 className="text-xl font-black text-ink">Done when</h2>
              </div>
              <p className="mt-3 text-sm font-black leading-6 text-ink/72">{nextAction}</p>
            </section>
          </div>

          <section className="rounded-md border border-leaf-900/10 bg-leaf-700 p-5 text-white shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-500">Ask FarmMate</p>
                <h2 className="mt-2 text-2xl font-black">Need a next step?</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/76">{farmMatePrompt}</p>
              </div>
              <ButtonLink href={farmMateHref(farmMatePrompt)} variant="secondary">
                <span className="inline-flex items-center gap-2">
                  <Bot size={17} aria-hidden="true" />
                  Ask FarmMate
                </span>
              </ButtonLink>
            </div>
          </section>

          <details className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-lg font-black text-ink">Read more</summary>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <section className="rounded-md bg-leaf-50 p-4">
                <h2 className="text-base font-black text-ink">Why this matters</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink/68">{post.excerpt}</p>
              </section>
              {betterPractice ? (
                <section className="rounded-md bg-earth-50 p-4">
                  <h2 className="text-base font-black text-ink">Extra tip</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-ink/68">{betterPractice}</p>
                </section>
              ) : null}
            </div>
          </details>
        </div>
      </section>

      {relatedLessons.length ? (
        <section className="bg-leaf-50 py-10 sm:py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="gg-eyebrow">RELATED LESSONS</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Keep improving</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {relatedLessons.map((lesson) => (
                <a
                  key={lesson.slug}
                  href={`/learn/${lesson.slug}`}
                  className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <div className="flex flex-wrap gap-2 text-xs font-black text-ink/55">
                    <span className="rounded-md bg-leaf-50 px-2.5 py-1">{lesson.category}</span>
                    <span className="rounded-md bg-leaf-50 px-2.5 py-1">{lesson.readTime}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-black leading-snug text-ink">{lesson.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/64">{lesson.excerpt}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
