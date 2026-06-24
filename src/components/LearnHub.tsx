"use client";

import Link from "next/link";
import { BriefcaseBusiness, Home, PlayCircle, Search, Sprout, Wheat, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { BlogCard } from "@/components/BlogCard";
import { SafeImage } from "@/components/SafeImage";
import { learnCategories } from "@/data/blog";
import type { BlogPost } from "@/types";

type LearnHubProps = {
  posts: BlogPost[];
};

const learningPaths = [
  {
    title: "Crop Farming",
    category: "Crops" as const,
    description: "Guides for maize, tomatoes, vegetables, field checks, pests, and harvest planning.",
    image: "/images/products/tomatoes.jpg",
    icon: Wheat
  },
  {
    title: "Livestock",
    category: "Livestock" as const,
    description: "Practical records, feeding, flock care, housing, and sales planning for small producers.",
    image: "/images/products/poultry.jpg",
    icon: Sprout
  },
  {
    title: "Home Gardening",
    category: "Home Gardening" as const,
    description: "Simple backyard gardening guidance for vegetables, soil, watering, and small spaces.",
    image: "/images/products/vegetables.jpg",
    icon: Home
  },
  {
    title: "Agribusiness",
    category: "Agribusiness" as const,
    description: "Selling produce, buyer demand, supplier visibility, verification, and market decisions.",
    image: "/images/marketplace/ghana-market-1.jpg",
    icon: BriefcaseBusiness
  }
];

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

  const startHereGuides = posts.filter((post) =>
    [
      "how-ghana-growers-works",
      "tomato-production-in-southern-ghana",
      "maize-yellow-leaves-field-guide",
      "backyard-vegetable-garden-ghana"
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
      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="gg-eyebrow">Choose What You Do</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Start with the learning path that fits your work</h2>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {learningPaths.map((path) => {
              const Icon = path.icon;
              return (
                <button
                  key={path.title}
                  type="button"
                  onClick={() => setCategory(path.category)}
                  className={`focus-ring group overflow-hidden rounded-md border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-soft ${
                    category === path.category ? "border-leaf-700" : "border-leaf-900/10"
                  }`}
                >
                  <div className="relative">
                    <SafeImage
                      src={path.image}
                      alt={`${path.title} learning path`}
                      width={520}
                      height={340}
                      className="h-40 w-full object-cover"
                      fallbackKind="default"
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    />
                    <span className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-md bg-white text-leaf-700 shadow-soft">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                  </div>
                  <span className="block p-5">
                    <span className="text-xl font-black text-ink group-hover:text-leaf-700">{path.title}</span>
                    <span className="mt-2 block text-sm leading-6 text-ink/64">{path.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#ECE7D1] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="gg-eyebrow">Start Here</p>
              <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Beginner-friendly guides</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/64">
                A short starting point for farmers, gardeners, buyers, and agribusiness users.
              </p>
            </div>
            <a href="#browse-guides" className="text-sm font-black text-leaf-700 hover:text-leaf-800">
              Browse all guides
            </a>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {startHereGuides.map((post) => (
              <Link
                key={post.slug}
                href={`/learn/${post.slug}`}
                className="group rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
              >
                <p className="text-xs font-black uppercase tracking-wide text-earth-700">{post.category}</p>
                <h3 className="mt-3 text-lg font-black leading-snug text-ink group-hover:text-leaf-700">{post.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/64">{post.excerpt}</p>
                <span className="mt-4 inline-flex text-sm font-black text-leaf-700">Read guide</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="watch-videos" className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="gg-eyebrow">Learn By Video</p>
              <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Watch practical farm lessons</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/64">
                Video slots are prepared for Ghana Growers training clips, field demos, and Digital Farm walkthroughs.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-md bg-[#ECE7D1] px-3 py-2 text-sm font-black text-ink">
              <Video size={16} aria-hidden="true" />
              More videos coming
            </span>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {featuredVideoGuides.map((video) => (
              <article key={video.title} className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm">
                <div className="relative">
                  <SafeImage
                    src={video.image}
                    alt={`${video.title} video preview`}
                    width={720}
                    height={430}
                    className="aspect-video w-full object-cover"
                    fallbackKind="default"
                    sizes="(min-width: 1024px) 33vw, 100vw"
                  />
                  <span className="absolute inset-0 bg-ink/10" aria-hidden="true" />
                  <span className="absolute left-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white text-leaf-700 shadow-soft">
                    <PlayCircle size={28} aria-hidden="true" />
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-earth-700">{video.category}</p>
                  <h3 className="mt-2 text-xl font-black text-ink">{video.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-ink/55">{video.duration} video placeholder</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="browse-guides" className="bg-leaf-50 py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[0.7fr_0.3fr] lg:items-end">
              <div>
                <p className="gg-eyebrow">Browse All Guides</p>
                <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">
                  {category === "All" ? "Guide library" : `${category} guides`}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
                  Search practical Ghana-focused guides by topic, category, crop, livestock, garden, season, or market question.
                </p>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-ink">Search guides</span>
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

            <div className="mt-5 flex flex-wrap gap-2">
              {["All", ...learnCategories].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item as "All" | BlogPost["category"])}
                  className={`rounded-md px-3 py-2 text-sm font-black transition ${
                    category === item
                      ? "bg-leaf-700 text-white"
                      : "bg-leaf-50 text-ink/70 ring-1 ring-leaf-900/10 hover:text-leaf-800"
                  }`}
                >
                  {item}
                </button>
              ))}
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-white/10 bg-white/10 p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-500">Farmer Stories</p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">Real learning stories will come later</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/74">
              Ghana Growers will add farmer, buyer, gardener, and supplier stories only when there are real outcomes to share.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
