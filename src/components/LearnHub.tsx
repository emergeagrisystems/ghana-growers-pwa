"use client";

import Link from "next/link";
import {
  Bot,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  CloudRain,
  Droplets,
  Leaf,
  PackageCheck,
  Search,
  ShieldCheck,
  Shovel,
  Sprout,
  UploadCloud,
  Wheat
} from "lucide-react";
import { useMemo, useState } from "react";
import type { BlogPost } from "@/types";

type LearnHubProps = {
  posts: BlogPost[];
};

type LearnFilter = "All" | BlogPost["category"];
type MenuKey =
  | "today"
  | "soil"
  | "crop"
  | "water"
  | "pests"
  | "harvest"
  | "videos"
  | "farmmate";

const menuItems: Array<{ key: MenuKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "soil", label: "Soil & Compost" },
  { key: "crop", label: "Crop Care" },
  { key: "water", label: "Water & Weather" },
  { key: "pests", label: "Pests & Diseases" },
  { key: "harvest", label: "Harvest & Selling" },
  { key: "videos", label: "Videos" },
  { key: "farmmate", label: "FarmMate Guides" }
];

const pathPanels: Record<
  Exclude<MenuKey, "today" | "videos">,
  {
    eyebrow: string;
    title: string;
    body: string;
    icon: typeof Leaf;
    category: BlogPost["category"];
  }
> = {
  soil: {
    eyebrow: "IMPROVE SOIL",
    title: "Compost, manure, mulching, crop rotation, and soil cover.",
    body: "Start with low-cost practices that protect soil and feed crops slowly.",
    icon: Shovel,
    category: "Soil & Compost"
  },
  crop: {
    eyebrow: "GROW HEALTHIER CROPS",
    title: "Field checks, spacing, yellow leaves, pests, and diseases.",
    body: "Use simple routines before assuming disease or reaching for chemicals.",
    icon: Wheat,
    category: "Crop Care"
  },
  water: {
    eyebrow: "SAVE WATER",
    title: "Mulching, watering time, drainage, and dry-season practices.",
    body: "Plan around rain and protect roots from both dry soil and standing water.",
    icon: Droplets,
    category: "Water & Weather"
  },
  pests: {
    eyebrow: "PREVENT PESTS & DISEASES",
    title: "Check the real problem before spraying.",
    body: "Look closely, check the weather, and confirm signs before treatment.",
    icon: ShieldCheck,
    category: "Pests & Diseases"
  },
  harvest: {
    eyebrow: "PREPARE TO SELL",
    title: "Sorting, packaging, quantity estimates, and buyer readiness.",
    body: "Make harvests easier to inspect, count, transport, and sell.",
    icon: PackageCheck,
    category: "Harvest & Selling"
  },
  farmmate: {
    eyebrow: "USE FARMMATE BETTER",
    title: "Crop Doctor, Ask FarmMate, planting advice, and daily farm summary.",
    body: "Move from learning into the live tools when you need a practical next step.",
    icon: Bot,
    category: "FarmMate Guides"
  }
};

const videoLessons = [
  { title: "How to Make Compost at Home", category: "Soil & Compost", duration: "4 min", icon: Shovel },
  { title: "How to Mulch Tomatoes", category: "Soil & Compost", duration: "3 min", icon: Leaf },
  { title: "Before You Spray", category: "Pests & Diseases", duration: "3 min", icon: ShieldCheck },
  { title: "How to Use Crop Doctor", category: "FarmMate Guides", duration: "3 min", icon: UploadCloud },
  { title: "How to Prepare Produce Before Selling", category: "Harvest & Selling", duration: "4 min", icon: PackageCheck }
];

const liveFarmMateTools = [
  {
    title: "Ask FarmMate",
    text: "Ask any farming question and get a practical next step.",
    cta: "Ask FarmMate",
    href: "/farmer-hub?tool=ask",
    icon: Bot
  },
  {
    title: "Crop Doctor",
    text: "Upload a crop photo for guided checks.",
    cta: "Upload Crop Photo",
    href: "/farmer-hub?tool=doctor",
    icon: Camera
  },
  {
    title: "Crop Calendar",
    text: "Plan your season with crop timing support.",
    cta: "View Calendar",
    href: "/farmer-hub?tool=calendar",
    icon: CalendarDays
  },
  {
    title: "Planting Advisor",
    text: "Check the best time to plant based on your crop and conditions.",
    cta: "Start Advisor",
    href: "/farmer-hub?tool=planting",
    icon: Sprout
  }
];

const guideFilters: Array<{ label: string; value: LearnFilter }> = [
  { label: "All", value: "All" },
  { label: "Soil & Compost", value: "Soil & Compost" },
  { label: "Crop Care", value: "Crop Care" },
  { label: "Water & Weather", value: "Water & Weather" },
  { label: "Pests & Diseases", value: "Pests & Diseases" },
  { label: "Harvest & Selling", value: "Harvest & Selling" },
  { label: "FarmMate Guides", value: "FarmMate Guides" },
  { label: "Video Lessons", value: "Video Lessons" }
];

const challengeSteps = [
  "Day 1: Collect dry leaves and crop waste.",
  "Day 2: Choose a compost corner.",
  "Day 3: Build your first pile.",
  "Day 4: Cover the pile.",
  "Day 5: Check moisture.",
  "Day 6: Turn the pile.",
  "Day 7: Ask FarmMate what to improve."
];

function LessonCard({ post }: { post: BlogPost }) {
  return (
    <article className="flex h-full flex-col rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide text-earth-700">{post.category}</p>
        <span className="gg-icon gg-icon-standard h-9 w-9 shrink-0">
          <BookOpen size={17} aria-hidden="true" />
        </span>
      </div>
      <h3 className="mt-3 text-lg font-black leading-snug text-ink">{post.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-ink/65">{post.excerpt}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-ink/58">
        <span className="rounded-md bg-leaf-50 px-2.5 py-1">{post.readTime}</span>
        {post.difficulty ? <span className="rounded-md bg-leaf-50 px-2.5 py-1">{post.difficulty}</span> : null}
        {post.cost ? <span className="rounded-md bg-leaf-50 px-2.5 py-1">{post.cost}</span> : null}
      </div>
      <Link href={`/learn/${post.slug}`} className="mt-4 text-sm font-black text-leaf-700 transition hover:text-leaf-800">
        Read lesson
      </Link>
    </article>
  );
}

export function LearnHub({ posts }: LearnHubProps) {
  const [activeMenu, setActiveMenu] = useState<MenuKey>("today");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<LearnFilter>("All");
  const [showAllGuides, setShowAllGuides] = useState(false);

  const todaySkill = posts.find((post) => post.slug === "make-your-own-compost-for-healthy-soil") ?? posts[0];
  const activePanel = activeMenu === "today" || activeMenu === "videos" ? pathPanels.soil : pathPanels[activeMenu];
  const ActivePanelIcon = activePanel.icon;
  const panelLessons = posts.filter((post) => post.category === activePanel.category).slice(0, 4);

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
          post.difficulty ?? "",
          post.cost ?? "",
          ...(post.keyPoints ?? []),
          ...(post.sections ?? []).map((section) => `${section.heading} ${section.body}`)
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, posts, search]);

  const visibleGuides = showAllGuides ? filteredPosts : filteredPosts.slice(0, 6);

  function chooseMenu(key: MenuKey) {
    setActiveMenu(key);

    if (key !== "today" && key !== "videos") {
      setCategory(pathPanels[key].category);
    }

    if (key === "videos") {
      document.getElementById("watch-videos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="bg-white">
      <nav className="sticky top-0 z-20 border-y border-leaf-900/10 bg-white/95 py-3 backdrop-blur" aria-label="Learning topics">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-max gap-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => chooseMenu(item.key)}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-black transition ${
                  activeMenu === item.key
                    ? "bg-leaf-700 text-white"
                    : "bg-leaf-50 text-ink/70 ring-1 ring-leaf-900/10 hover:text-leaf-800"
                }`}
                aria-pressed={activeMenu === item.key}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <section id="soil-compost" className="scroll-mt-24 bg-[#ECE7D1] py-10 sm:py-12">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <article className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
            <p className="gg-eyebrow">TODAY&apos;S FARM SKILL</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Make Your Own Compost</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-ink/68">
              Turn dry leaves, crop waste, grass, and animal manure into rich soil food for your farm.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-ink/65">
              <span className="rounded-md bg-leaf-50 px-3 py-2">Time: 20 min to start</span>
              <span className="rounded-md bg-leaf-50 px-3 py-2">Cost: Low</span>
              <span className="rounded-md bg-leaf-50 px-3 py-2">Best for: Vegetables, maize, cassava, pepper</span>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={`/learn/${todaySkill.slug}`} className="focus-ring rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-700">
                Read lesson
              </Link>
              <Link href="/farmer-hub?tool=ask" className="focus-ring rounded-md border border-leaf-900/15 bg-white px-5 py-3 text-sm font-black text-ink transition hover:bg-leaf-50">
                Ask FarmMate about soil
              </Link>
            </div>
          </article>

          <article className="rounded-md border border-leaf-900/10 bg-leaf-700 p-5 text-white shadow-soft sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-500">7-DAY SOIL HEALTH CHALLENGE</p>
            <h2 className="mt-2 text-2xl font-black">Start improving your soil this week with small steps.</h2>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {challengeSteps.map((step) => (
                <div key={step} className="flex gap-2 rounded-md bg-white/10 p-3 text-sm font-semibold leading-5 text-white/86">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-earth-500" aria-hidden="true" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <Link href="/learn/make-your-own-compost-for-healthy-soil" className="mt-5 inline-flex rounded-md bg-white px-5 py-3 text-sm font-black text-leaf-700 transition hover:bg-earth-50">
              Start challenge
            </Link>
          </article>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
            <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5">
              <span className="gg-icon gg-icon-standard h-12 w-12">
                <ActivePanelIcon size={22} aria-hidden="true" />
              </span>
              <p className="mt-5 gg-eyebrow">{activePanel.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-ink">{activePanel.title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-ink/64">{activePanel.body}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {panelLessons.map((post) => (
                <LessonCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="watch-videos" className="scroll-mt-24 bg-[#F7F7EA] py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="gg-eyebrow">SHORT VIDEO LESSONS</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Watch Short Farm Lessons</h2>
            <p className="mt-2 text-sm leading-6 text-ink/64">
              Short practical videos for soil health, crop checks, FarmMate tools, and selling preparation.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {videoLessons.map((video) => {
              const Icon = video.icon;

              return (
                <article key={video.title} className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="gg-icon gg-icon-standard h-10 w-10">
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <span className="rounded-md bg-leaf-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-leaf-700">
                      Coming soon
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-wide text-earth-700">{video.category}</p>
                  <h3 className="mt-2 text-lg font-black leading-snug text-ink">{video.title}</h3>
                  <p className="mt-2 text-sm font-bold text-ink/55">{video.duration}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="browse-guides" className="scroll-mt-24 bg-leaf-50 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[0.7fr_0.3fr] lg:items-end">
              <div>
                <p className="gg-eyebrow">GUIDE LIBRARY</p>
                <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Guide Library</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
                  Search compact lessons for soil, compost, crop care, rain, selling readiness, and FarmMate tools.
                </p>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-ink">Search guides</span>
                <span className="relative block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setShowAllGuides(false);
                    }}
                    placeholder="Search compost, mulching, spraying..."
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
                  onClick={() => {
                    setCategory(item.value);
                    setShowAllGuides(false);
                  }}
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

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleGuides.map((post) => (
              <LessonCard key={post.slug} post={post} />
            ))}
          </div>

          {filteredPosts.length > visibleGuides.length ? (
            <div className="mt-7 text-center">
              <button
                type="button"
                onClick={() => setShowAllGuides(true)}
                className="focus-ring rounded-md border border-leaf-900/15 bg-white px-5 py-3 text-sm font-black text-ink transition hover:bg-leaf-50"
              >
                Show more guides
              </button>
            </div>
          ) : null}

          {filteredPosts.length === 0 ? (
            <div className="gg-empty-state mt-8">
              <h3 className="gg-card-title">No guides found</h3>
              <p className="mt-2 text-sm leading-6 text-ink/62">Try another search term or category.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="gg-eyebrow">GG FARMMATE</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Practice with live FarmMate tools</h2>
            <p className="mt-2 text-sm leading-6 text-ink/64">
              Move from learning into the live daily farming companion when you need a practical next step.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {liveFarmMateTools.map((tool) => {
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="group flex h-full flex-col rounded-md border border-leaf-900/10 bg-leaf-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <span className="gg-icon gg-icon-standard h-11 w-11">
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-black leading-snug text-ink group-hover:text-leaf-700">{tool.title}</h3>
                  <p className="mt-2 flex-1 text-sm font-semibold leading-6 text-ink/64">{tool.text}</p>
                  <span className="mt-5 inline-flex text-sm font-black text-leaf-700">{tool.cta}</span>
                </Link>
              );
            })}
          </div>
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
              <Link href="/farmer-hub?tool=ask" className="focus-ring rounded-md bg-white px-5 py-3 text-sm font-black text-leaf-700 transition hover:bg-earth-50">
                Open GG FarmMate
              </Link>
              <Link href="/farmer-hub?tool=doctor" className="focus-ring rounded-md border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
                Upload Crop Photo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
