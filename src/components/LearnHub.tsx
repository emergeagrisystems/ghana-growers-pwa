"use client";

import Link from "next/link";
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  CloudRain,
  Home,
  Leaf,
  PlayCircle,
  Search,
  ShieldCheck,
  Sprout,
  Tractor,
  UploadCloud,
  Wheat
} from "lucide-react";
import { useMemo, useState } from "react";
import type { BlogPost } from "@/types";

type LearnHubProps = {
  posts: BlogPost[];
};

type LearnFilter = "All" | BlogPost["category"];

const learningPaths = [
  {
    title: "Crop Farming",
    category: "Crops" as const,
    description: "Field checks, pests, diseases, harvest planning, and crop care.",
    icon: Wheat
  },
  {
    title: "Livestock",
    category: "Livestock" as const,
    description: "Feeding, housing, records, flock care, and sales planning.",
    icon: Sprout
  },
  {
    title: "Agribusiness",
    category: "Agribusiness" as const,
    description: "Pricing, buyer demand, packaging, verification, and selling through Ghana Growers.",
    icon: BriefcaseBusiness
  },
  {
    title: "Home Gardening",
    category: "Home Gardening" as const,
    description: "Simple vegetable gardening for homes and small spaces.",
    icon: Home
  }
];

const checklistCards = [
  {
    title: "Rainy Season Farm Checklist",
    slug: "seasonal-farming-rainy-season-checklist",
    icon: CloudRain,
    items: ["Clear drainage paths.", "Check seed and tools early.", "Avoid planting in waterlogged soil."]
  },
  {
    title: "Before You Spray",
    slug: "before-you-spray-three-checks",
    icon: ShieldCheck,
    items: ["Check if rain is expected.", "Avoid strong wind.", "Confirm the pest or disease first."]
  },
  {
    title: "Before You Sell Your Harvest",
    slug: "how-to-prepare-harvest-before-selling",
    icon: ClipboardCheck,
    items: ["Sort damaged produce.", "Estimate quantity clearly.", "Prepare collection or delivery details."]
  },
  {
    title: "Weekly Crop Field Check",
    slug: "maize-yellow-leaves-field-guide",
    icon: Leaf,
    items: ["Check lower leaves.", "Look for pests under leaves.", "Note yellowing, wilting, or spots."]
  }
];

const videoLessons = [
  {
    title: "How to Use Crop Doctor",
    category: "GG FarmMate",
    duration: "3 min",
    slug: "video-how-to-use-crop-doctor",
    icon: UploadCloud
  },
  {
    title: "How to Ask FarmMate a Good Question",
    category: "GG FarmMate",
    duration: "3 min",
    slug: "how-to-use-gg-farmmate",
    icon: BookOpen
  },
  {
    title: "What Farmers Should Prepare Before Verification",
    category: "Verification",
    duration: "5 min",
    slug: "how-ghana-growers-works",
    icon: ShieldCheck
  },
  {
    title: "How to Prepare Produce Before Selling",
    category: "Agribusiness",
    duration: "4 min",
    slug: "how-to-prepare-harvest-before-selling",
    icon: Tractor
  }
];

const startHereGuideSlugs = [
  "how-ghana-growers-works",
  "how-to-use-gg-farmmate",
  "how-to-use-crop-doctor",
  "how-to-prepare-harvest-before-selling"
];

const guideFilters: Array<{ label: string; value: LearnFilter }> = [
  { label: "All", value: "All" },
  { label: "Crops", value: "Crops" },
  { label: "Livestock", value: "Livestock" },
  { label: "Home Gardening", value: "Home Gardening" },
  { label: "Agribusiness", value: "Agribusiness" },
  { label: "Seasonal Farming", value: "Seasonal Farming" },
  { label: "GG FarmMate", value: "GG FarmMate" },
  { label: "Video Lessons", value: "Video Lessons" }
];

function GuideCard({ post, compact = false }: { post: BlogPost; compact?: boolean }) {
  return (
    <article className="flex h-full flex-col rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-wide text-earth-700">{post.category}</p>
        <span className="gg-icon gg-icon-standard h-9 w-9 shrink-0">
          <BookOpen size={17} aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-1 flex-col">
        <h3 className={`${compact ? "text-lg" : "text-xl"} mt-4 font-black leading-snug text-ink`}>{post.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-ink/65">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-ink/55">
          <span>{new Date(post.date).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" })}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarCheck size={14} aria-hidden="true" />
            {post.readTime}
          </span>
        </div>
        <Link href={`/learn/${post.slug}`} className="mt-5 text-sm font-black text-leaf-700 transition hover:text-leaf-800">
          Read guide
        </Link>
      </div>
    </article>
  );
}

export function LearnHub({ posts }: LearnHubProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<LearnFilter>("All");

  const startHereGuides = startHereGuideSlugs
    .map((slug) => posts.find((post) => post.slug === slug))
    .filter((post): post is BlogPost => Boolean(post));

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

  function choosePath(nextCategory: BlogPost["category"]) {
    setCategory(nextCategory);
    document.getElementById("browse-guides")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="bg-white">
      <section id="start-here" className="scroll-mt-24 bg-[#ECE7D1] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="gg-eyebrow">START HERE</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Beginner-friendly guides</h2>
            <p className="mt-2 text-sm leading-6 text-ink/64">
              Simple starting points for farmers, gardeners, buyers, and agribusiness users.
            </p>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {startHereGuides.map((post) => (
              <GuideCard key={post.slug} post={post} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="gg-eyebrow">CHOOSE YOUR PATH</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Start with the learning path that fits your work</h2>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {learningPaths.map((path) => {
              const Icon = path.icon;
              return (
                <button
                  key={path.title}
                  type="button"
                  onClick={() => choosePath(path.category)}
                  className={`focus-ring group flex h-full flex-col rounded-md border bg-leaf-50 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-soft ${
                    category === path.category ? "border-leaf-700" : "border-leaf-900/10"
                  }`}
                >
                  <span className="gg-icon gg-icon-standard h-12 w-12">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <span className="mt-5 text-xl font-black text-ink group-hover:text-leaf-700">{path.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-ink/64">{path.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#F7F7EA] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="gg-eyebrow">PRACTICAL CHECKLISTS</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Improve your farm step by step</h2>
            <p className="mt-2 text-sm leading-6 text-ink/64">
              Short checklists for common farm decisions before planting, spraying, harvesting, or selling.
            </p>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {checklistCards.map((checklist) => {
              const Icon = checklist.icon;
              return (
                <Link
                  key={checklist.title}
                  href={`/learn/${checklist.slug}`}
                  className="group flex h-full flex-col rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
                  aria-label={`View checklist: ${checklist.title}`}
                >
                  <span className="gg-icon gg-icon-standard h-10 w-10">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-black leading-snug text-ink group-hover:text-leaf-700">{checklist.title}</h3>
                  <ul className="mt-4 grid gap-2">
                    {checklist.items.map((item) => (
                      <li key={item} className="flex gap-2 text-sm font-semibold leading-6 text-ink/66">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-leaf-700" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="mt-5 inline-flex text-sm font-black text-leaf-700">View checklist</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="watch-videos" className="scroll-mt-24 bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="gg-eyebrow">VIDEO LESSONS</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Watch practical farm lessons</h2>
            <p className="mt-2 text-sm leading-6 text-ink/64">
              Short videos for field checks, GG FarmMate walkthroughs, verification, and selling produce.
            </p>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {videoLessons.map((video) => {
              const Icon = video.icon;
              return (
                <article key={video.title} className="flex h-full flex-col rounded-md border border-leaf-900/10 bg-leaf-50 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="gg-icon gg-icon-standard h-12 w-12">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className="rounded-md bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-leaf-700 shadow-sm">
                      Coming soon
                    </span>
                  </div>
                  <p className="mt-5 text-xs font-black uppercase tracking-wide text-earth-700">{video.category}</p>
                  <h3 className="mt-2 text-xl font-black leading-snug text-ink">{video.title}</h3>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55">
                    <PlayCircle size={15} aria-hidden="true" />
                    {video.duration} lesson
                  </p>
                  <Link href={`/learn/${video.slug}`} className="mt-5 text-sm font-black text-leaf-700 transition hover:text-leaf-800">
                    Read guide
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="browse-guides" className="scroll-mt-24 bg-leaf-50 py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[0.7fr_0.3fr] lg:items-end">
              <div>
                <p className="gg-eyebrow">BROWSE ALL GUIDES</p>
                <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">
                  {category === "All" ? "Guide Library" : `${category} guides`}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
                  Search practical Ghana-focused guides by crop, livestock, garden, season, market access, or FarmMate tool.
                </p>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-ink">Search guides</span>
                <span className="relative block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search maize, spraying, Crop Doctor..."
                    className="focus-ring w-full rounded-md border border-leaf-900/10 bg-white py-3 pl-10 pr-3 text-sm text-ink shadow-sm"
                  />
                </span>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {guideFilters.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  className={`rounded-md px-3 py-2 text-sm font-black transition ${
                    category === item.value
                      ? "bg-leaf-700 text-white"
                      : "bg-leaf-50 text-ink/70 ring-1 ring-leaf-900/10 hover:text-leaf-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <GuideCard key={post.slug} post={post} />
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="gg-empty-state mt-8">
              <h3 className="gg-card-title">No guides found</h3>
              <p className="mt-2 text-sm leading-6 text-ink/62">Try another search term or category.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-leaf-700 py-12 text-white sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-white/10 bg-white/10 p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-500">GG FarmMate</p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">Need help with a farm question today?</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/74">
              Use GG FarmMate to ask a question, upload a crop photo, or get one practical next step.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/farmer-hub" className="focus-ring rounded-md bg-white px-5 py-3 text-sm font-black text-leaf-700 transition hover:bg-earth-50">
                Open GG FarmMate
              </Link>
              <Link href="/farmer-hub" className="focus-ring rounded-md border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
                Upload Crop Photo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
