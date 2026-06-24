"use client";

import Link from "next/link";
import { PlayCircle, Search, Sprout, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { BlogCard } from "@/components/BlogCard";
import { SafeImage } from "@/components/SafeImage";
import { learnCategories } from "@/data/blog";
import type { BlogPost } from "@/types";

type LearnHubProps = {
  posts: BlogPost[];
};

const categoryMeta: Record<BlogPost["category"], { description: string; image: string }> = {
  Crops: {
    description: "Field checks, crop care, pests, harvest timing, and practical production guides.",
    image: "/images/products/tomatoes.jpg"
  },
  Livestock: {
    description: "Poultry, small ruminants, animal care records, housing, feeding, and sales planning.",
    image: "/images/products/poultry.jpg"
  },
  "Home Gardening": {
    description: "Simple guides for backyard vegetables, small spaces, soil, water, and family food gardens.",
    image: "/images/products/vegetables.jpg"
  },
  Agribusiness: {
    description: "Selling produce, buyer demand, supplier visibility, verification, and market decisions.",
    image: "/images/marketplace/ghana-market-1.jpg"
  },
  "Seasonal Farming": {
    description: "Rainy season, dry season, weather planning, planting windows, and harvest preparation.",
    image: "/images/marketplace/farm-activity-1.jpg"
  },
  "Video Library": {
    description: "Short practical video guides for farmers learning how to use Ghana Growers tools.",
    image: "/images/hero/ghana-growers-trade-hero.png"
  }
};

const featuredVideoGuides = [
  {
    title: "How to use Crop Health Check",
    category: "Digital Farm",
    duration: "3 min",
    image: "/images/marketplace/farm-activity-2.jpg"
  },
  {
    title: "How buyers submit produce demand",
    category: "Market access",
    duration: "4 min",
    image: "/images/marketplace/ghana-market-2.jpg"
  },
  {
    title: "What farmers should prepare before verification",
    category: "Verification",
    duration: "5 min",
    image: "/images/farmers/farmer-4.jpg"
  }
];

export function LearnHub({ posts }: LearnHubProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"All" | BlogPost["category"]>("All");

  const featuredGuides = posts.filter((post) =>
    [
      "tomato-production-in-southern-ghana",
      "maize-yellow-leaves-field-guide",
      "seasonal-farming-rainy-season-checklist",
      "how-to-sell-produce-through-ghana-growers"
    ].includes(post.slug)
  );

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory = category === "All" || post.category === category;
      const matchesSearch =
        !query ||
        [
          post.title,
          post.category,
          post.excerpt,
          post.audience ?? "",
          ...(post.keyPoints ?? []),
          ...(post.sections ?? []).map((section) => `${section.heading} ${section.body}`)
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, posts, search]);

  return (
    <div className="bg-white">
      <section className="border-y border-leaf-900/10 bg-leaf-50 py-10 sm:py-12">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-[0.72fr_0.28fr] lg:px-8">
          <div>
            <p className="gg-eyebrow">Featured Guides</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Start with practical guides farmers can use this week</h2>
          </div>
          <label className="block self-end">
            <span className="mb-2 block text-sm font-black text-ink">Search the Learn Hub</span>
            <span className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search crops, livestock, prices..."
                className="focus-ring w-full rounded-md border border-leaf-900/10 bg-white py-3 pl-10 pr-3 text-sm text-ink shadow-sm"
              />
            </span>
          </label>
        </div>

        <div className="mx-auto mt-7 grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {featuredGuides.map((post) => (
            <Link
              key={post.slug}
              href={`/learn/${post.slug}`}
              className="group rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
            >
              <p className="text-xs font-black uppercase tracking-wide text-earth-700">{post.category}</p>
              <h3 className="mt-3 text-lg font-black leading-snug text-ink group-hover:text-leaf-700">{post.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/64">{post.excerpt}</p>
              <span className="mt-4 inline-flex text-sm font-black text-leaf-700">Read guide</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="gg-eyebrow">Video Library</p>
              <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Short videos for common farm tasks</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/64">
                These video slots are prepared for Ghana Growers training clips, field demos, and Digital Farm walkthroughs.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-md bg-[#ECE7D1] px-3 py-2 text-sm font-black text-ink">
              <Video size={16} aria-hidden="true" />
              More videos coming
            </span>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {featuredVideoGuides.map((video) => (
              <article key={video.title} className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm">
                <div className="relative">
                  <SafeImage
                    src={video.image}
                    alt={`${video.title} video preview`}
                    width={520}
                    height={310}
                    className="h-44 w-full object-cover"
                    fallbackKind="default"
                    sizes="(min-width: 768px) 33vw, 100vw"
                  />
                  <span className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-leaf-700 shadow-soft">
                    <PlayCircle size={25} aria-hidden="true" />
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-earth-700">{video.category}</p>
                  <h3 className="mt-2 text-lg font-black text-ink">{video.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-ink/55">{video.duration} video placeholder</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#ECE7D1] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="gg-eyebrow">Browse Categories</p>
          <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Find learning by the work you are doing</h2>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {learnCategories.map((item) => {
              const meta = categoryMeta[item];
              const count = posts.filter((post) => post.category === item).length;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`focus-ring overflow-hidden rounded-md border text-left shadow-sm transition hover:-translate-y-1 hover:shadow-soft ${
                    category === item ? "border-leaf-700 bg-white" : "border-leaf-900/10 bg-white"
                  }`}
                >
                  <SafeImage
                    src={meta.image}
                    alt={`${item} learning category`}
                    width={520}
                    height={260}
                    className="h-32 w-full object-cover"
                    fallbackKind="default"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                  <span className="block p-4">
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-lg font-black text-ink">{item}</span>
                      <span className="rounded-md bg-leaf-50 px-2.5 py-1 text-xs font-black text-leaf-700">{count} guides</span>
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-ink/62">{meta.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="gg-eyebrow">Guide Library</p>
                <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">
                  {category === "All" ? "All practical learning guides" : `${category} guides`}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
                  Use search and categories to find Ghana-focused guides for farm work, market access, home gardening, and agribusiness decisions.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["All", ...learnCategories].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item as "All" | BlogPost["category"])}
                    className={`rounded-md px-3 py-2 text-sm font-black transition ${
                      category === item
                        ? "bg-leaf-700 text-white"
                        : "bg-white text-ink/70 ring-1 ring-leaf-900/10 hover:text-leaf-800"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="gg-empty-state mt-8">
              <h3 className="gg-card-title">No records available yet</h3>
              <p className="mt-2 text-sm leading-6 text-ink/62">Try another search term or category.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-leaf-700 py-12 text-white sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-[0.72fr_0.28fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-500">Farmer Success Stories</p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">Stories will be added as Ghana Growers grows</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/74">
              This area is reserved for real farmer, buyer, and supplier stories after Ghana Growers has enough reviewed outcomes to share responsibly.
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/10 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-earth-500 text-ink">
                <Sprout size={21} aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-black">Future story area</h3>
                <p className="mt-1 text-sm text-white/70">No fake testimonials. Real stories only.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
