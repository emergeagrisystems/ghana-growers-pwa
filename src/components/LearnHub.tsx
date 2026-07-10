"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  BookOpen,
  CalendarDays,
  Camera,
  Leaf,
  PackageCheck,
  PlaySquare,
  Search,
  ShieldCheck,
  Shovel,
  Sprout,
  Wheat
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getCurrentLearnChallenge,
  getLearnChallengeById,
  isChallengeComplete,
  LEARN_CHALLENGE_STORAGE_KEY,
  nextOpenChallengeDay,
  type LearnChallenge,
  type LearnChallengeProgress
} from "@/lib/learn-challenges";
import { getLearnIllustrationType, LearnIllustration } from "@/components/learn/LearnIllustration";
import type { BlogPost } from "@/types";

type LearnHubProps = {
  posts: BlogPost[];
};

type LearnFilter = "All" | BlogPost["category"];
type TopicKey = "soil" | "crop" | "pests" | "harvest" | "farmmate";
type MenuKey = "today" | TopicKey | "videos" | "all";

type TopicPanel = {
  label: string;
  intro: string;
  icon: typeof Leaf;
  category: BlogPost["category"];
  ladder: {
    start: string;
    improve: string;
    further: string;
  };
  featured: string;
  practice: string;
  recommended: string[];
  action: {
    question: string;
    button: string;
    href: string;
  };
};

const menuItems: Array<{ key: MenuKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "soil", label: "Soil & Compost" },
  { key: "crop", label: "Crop Care" },
  { key: "pests", label: "Pests & Diseases" },
  { key: "harvest", label: "Harvest & Storage" },
  { key: "farmmate", label: "FarmMate Guides" },
  { key: "videos", label: "Videos" },
  { key: "all", label: "All Lessons" }
];

const topicPanels: Record<TopicKey, TopicPanel> = {
  soil: {
    label: "Soil & Compost",
    intro: "Build healthier soil with compost, manure, mulching, crop rotation, and soil cover.",
    icon: Shovel,
    category: "Soil & Compost",
    ladder: {
      start: "Make simple compost.",
      improve: "Use mulch and manure safely.",
      further: "Plan crop rotation and soil cover."
    },
    featured: "Make Your Own Compost for Healthy Soil",
    practice: "Start a small compost corner using dry leaves, crop waste, and manure if available.",
    recommended: [
      "Make Your Own Compost for Healthy Soil",
      "How to Mulch Your Farm and Save Water",
      "How to Use Poultry Manure Safely",
      "Crop Rotation: Why Maize Should Not Stand Alone Every Season",
      "How to Save Water with Mulch",
      "How to Keep Soil Covered During Dry Weather"
    ],
    action: {
      question: "What can I use to improve my soil this week?",
      button: "Ask FarmMate",
      href: "/farmer-hub?tool=ask"
    }
  },
  crop: {
    label: "Crop Care",
    intro: "Learn simple field checks that help crops grow stronger before problems become serious.",
    icon: Wheat,
    category: "Crop Care",
    ladder: {
      start: "Check leaves, stems, and soil every week.",
      improve: "Understand yellowing, wilting, spacing, and early stress.",
      further: "Build a regular crop care routine before flowering and harvest."
    },
    featured: "Weekly Crop Field Check",
    practice: "Check the lower leaves, top leaves, stem, soil moisture, and underside of leaves on one crop.",
    recommended: [
      "Weekly Crop Field Check",
      "Maize Leaves Turning Yellow: What to Check First",
      "Tomato Field Checks Before Flowering",
      "Cassava Leaves Curling: What to Check",
      "Best Time of Day to Water Vegetables",
      "Simple Raised Beds for Vegetables",
      "Plant Spacing: Why Crowded Crops Struggle"
    ],
    action: {
      question: "My crop is not growing well. What should I check first?",
      button: "Ask FarmMate",
      href: "/farmer-hub?tool=ask"
    }
  },
  pests: {
    label: "Pests & Diseases",
    intro: "Learn how to check crop problems before spraying.",
    icon: ShieldCheck,
    category: "Pests & Diseases",
    ladder: {
      start: "Look carefully before deciding to spray.",
      improve: "Identify early signs of pests, disease, and crop stress.",
      further: "Use prevention and safer pest management."
    },
    featured: "Before You Spray: 3 Things to Check First",
    practice: "Check the underside of leaves, new growth, old leaves, and nearby plants before spraying.",
    recommended: [
      "Before You Spray: 3 Things to Check First",
      "How to Scout Your Farm Every Week",
      "Common Tomato Leaf Problems",
      "When Not to Spray Because of Weather",
      "Natural Pest Prevention Practices",
      "When to Ask Crop Doctor"
    ],
    action: {
      question: "Can I spray today, or should I check something first?",
      button: "Ask FarmMate",
      href: "/farmer-hub?tool=ask"
    }
  },
  harvest: {
    label: "Harvest & Storage",
    intro: "Reduce losses after harvest and prepare cleaner, better-counted produce before meeting buyers.",
    icon: PackageCheck,
    category: "Harvest & Storage",
    ladder: {
      start: "Sort damaged produce before selling.",
      improve: "Store produce in a way that reduces heat, moisture, and bruising.",
      further: "Prepare buyer-ready produce with clear quantity, packaging, and records."
    },
    featured: "How to Reduce Produce Loss After Harvest",
    practice: "Sort one harvest into good produce, damaged produce, and produce to use quickly.",
    recommended: [
      "How to Prepare Produce Before Selling",
      "How to Sort and Pack Vegetables for Buyers",
      "How to Store Maize After Harvest",
      "How to Store Yam and Root Crops",
      "How to Reduce Tomato Loss After Harvest",
      "How to Estimate Quantity Before Talking to Buyers",
      "Simple Harvest Records for Farmers",
      "How Buyers Source Produce Through Ghana Growers"
    ],
    action: {
      question: "How should I store my maize, yam, or tomatoes before selling?",
      button: "Ask FarmMate",
      href: "/farmer-hub?tool=ask"
    }
  },
  farmmate: {
    label: "FarmMate Guides",
    intro: "Learn how to use GG FarmMate tools to get better answers and practical next steps.",
    icon: Bot,
    category: "FarmMate Guides",
    ladder: {
      start: "Ask clear farm questions.",
      improve: "Upload better crop photos.",
      further: "Use FarmMate advice with field checks and good records."
    },
    featured: "How to Use GG FarmMate",
    practice: "Ask FarmMate one clear question about a crop, soil, weather, or harvest problem.",
    recommended: [
      "How to Use GG FarmMate",
      "How to Ask FarmMate a Good Question",
      "How to Use Crop Doctor",
      "When Not to Spray Because of Weather",
      "How to Use Crop Calendar",
      "How to Use Planting Advisor"
    ],
    action: {
      question: "How can I use FarmMate better on my farm?",
      button: "Open FarmMate",
      href: "/farmer-hub"
    }
  }
};

const categoryFilters: Array<{ label: string; value: LearnFilter }> = [
  { label: "All", value: "All" },
  { label: "Soil & Compost", value: "Soil & Compost" },
  { label: "Crop Care", value: "Crop Care" },
  { label: "Pests & Diseases", value: "Pests & Diseases" },
  { label: "Harvest & Storage", value: "Harvest & Storage" },
  { label: "FarmMate Guides", value: "FarmMate Guides" },
  { label: "Videos", value: "Video Lessons" }
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

function lessonByTitle(posts: BlogPost[], title: string) {
  return posts.find((post) => post.title === title);
}

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
        {post.level ? <span className="rounded-md bg-leaf-50 px-2.5 py-1">{post.level}</span> : null}
        <span className="rounded-md bg-leaf-50 px-2.5 py-1">{post.readTime}</span>
        {post.difficulty ? <span className="rounded-md bg-leaf-50 px-2.5 py-1">{post.difficulty}</span> : null}
      </div>
      <Link href={`/learn/${post.slug}`} className="focus-ring mt-4 inline-flex w-fit rounded-md text-sm font-black text-leaf-700 transition hover:text-leaf-800">
        Read lesson
      </Link>
    </article>
  );
}

function CompactLessonCard({ post }: { post: BlogPost }) {
  return (
    <article className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="flex flex-wrap gap-2 text-xs font-black text-ink/58">
        <span className="rounded-md bg-leaf-50 px-2.5 py-1">{post.category}</span>
        {post.level ? <span className="rounded-md bg-earth-50 px-2.5 py-1 text-earth-800">{post.level}</span> : null}
        <span className="rounded-md bg-leaf-50 px-2.5 py-1">{post.readTime}</span>
      </div>
      <h3 className="mt-3 text-lg font-black leading-snug text-ink">{post.title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink/64">{post.excerpt}</p>
      <Link href={`/learn/${post.slug}`} className="focus-ring mt-4 inline-flex rounded-md text-sm font-black text-leaf-700 transition hover:text-leaf-800">
        Read lesson
      </Link>
    </article>
  );
}

function TopicPanelView({ panel, posts }: { panel: TopicPanel; posts: BlogPost[] }) {
  const Icon = panel.icon;
  const featured = lessonByTitle(posts, panel.featured);
  const recommended = panel.recommended
    .map((title) => lessonByTitle(posts, title))
    .filter((post): post is BlogPost => Boolean(post));

  return (
    <section className="grid gap-5 lg:grid-cols-[0.38fr_0.62fr]">
      <div className="space-y-5">
        <article className="rounded-md border border-leaf-900/10 bg-leaf-50 p-5 shadow-sm">
          <span className="gg-icon gg-icon-standard h-12 w-12">
            <Icon size={22} aria-hidden="true" />
          </span>
          <p className="mt-5 gg-eyebrow">{panel.label}</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-ink">{panel.label}</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink/66">{panel.intro}</p>
        </article>

        <article className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-ink">Skill Path</h3>
          <div className="mt-4 grid gap-3">
            {[
              panel.ladder.start,
              panel.ladder.improve,
              panel.ladder.further
            ].map((text, index) => (
              <div key={text} className="flex gap-3 rounded-md bg-leaf-50 p-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold leading-6 text-ink/70">{text}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="space-y-5">
        {featured ? (
          <article className="grid gap-5 rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft md:grid-cols-[1fr_12rem] md:items-center">
            <div>
              <p className="gg-eyebrow">Featured Skill</p>
              <h3 className="mt-2 text-2xl font-black leading-tight text-ink">{featured.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/65">{featured.excerpt}</p>
              <Link href={`/learn/${featured.slug}`} className="focus-ring mt-5 inline-flex rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-700">
                Read lesson
              </Link>
            </div>
            <LearnIllustration type={getLearnIllustrationType(featured)} className="hidden md:block" />
          </article>
        ) : null}

        <article className="rounded-md border border-leaf-900/10 bg-[#F7F7EA] p-5">
          <p className="gg-eyebrow">This Week&apos;s Practice</p>
          <p className="mt-2 text-base font-black leading-7 text-ink">{panel.practice}</p>
        </article>

        <article className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-ink">Recommended Lessons</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recommended.map((post) => (
              <Link
                key={post.slug}
                href={`/learn/${post.slug}`}
                aria-label={`Read lesson: ${post.title}`}
                className="focus-ring group relative rounded-md border border-leaf-900/10 bg-leaf-50 p-3 pr-10 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
              >
                <p className="text-sm font-black leading-5 text-ink">{post.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink/64">{post.excerpt}</p>
                <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-leaf-700 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function VideosPanel({ posts }: { posts: BlogPost[] }) {
  const videos = posts.filter((post) => post.category === "Video Lessons");

  return (
    <section id="watch-videos" className="scroll-mt-24">
      <div className="max-w-3xl">
        <p className="gg-eyebrow">Videos</p>
        <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Watch Short Farm Lessons</h2>
        <p className="mt-2 text-sm leading-6 text-ink/64">
          Short practical videos for soil health, crop checks, FarmMate tools, harvest handling, and better growing practices.
        </p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {videos.map((video) => (
          <article key={video.slug} className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <span className="gg-icon gg-icon-standard h-11 w-11">
                <PlaySquare size={20} aria-hidden="true" />
              </span>
              <span className="rounded-md bg-leaf-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-leaf-700">
                Coming soon
              </span>
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-wide text-earth-700">{video.category}</p>
            <h3 className="mt-2 text-lg font-black leading-snug text-ink">{video.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/64">{video.excerpt}</p>
            <p className="mt-3 text-sm font-bold text-ink/55">{video.readTime}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function readChallengeProgress(): LearnChallengeProgress | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEARN_CHALLENGE_STORAGE_KEY) ?? "null") as Partial<LearnChallengeProgress> | null;

    if (!parsed?.challengeId || !Array.isArray(parsed.completedDays)) {
      return null;
    }

    const challenge = getLearnChallengeById(parsed.challengeId);

    if (!challenge) {
      return null;
    }

    return {
      challengeId: challenge.id,
      completedDays: parsed.completedDays.filter((day): day is number => typeof day === "number" && challenge.days.some((step) => step.day === day))
    };
  } catch {
    return null;
  }
}

function writeChallengeProgress(progress: LearnChallengeProgress) {
  window.localStorage.setItem(LEARN_CHALLENGE_STORAGE_KEY, JSON.stringify(progress));
}

function CurrentChallengeCard() {
  const [challenge, setChallenge] = useState<LearnChallenge>(() => getCurrentLearnChallenge());
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const saved = readChallengeProgress();

    if (saved) {
      const savedChallenge = getLearnChallengeById(saved.challengeId) ?? getCurrentLearnChallenge();
      setChallenge(savedChallenge);
      setCompletedDays(saved.completedDays);
      setHasStarted(true);
      return;
    }

    setChallenge(getCurrentLearnChallenge());
    setCompletedDays([]);
    setHasStarted(false);
  }, []);

  const isComplete = isChallengeComplete(challenge, completedDays);
  const nextDay = nextOpenChallengeDay(challenge, completedDays);
  const buttonText = !hasStarted ? "Start Day 1" : isComplete ? "Challenge complete" : `Continue Day ${nextDay}`;
  const firstThreeDays = challenge.days.slice(0, 3);

  function startChallenge() {
    if (!hasStarted) {
      writeChallengeProgress({ challengeId: challenge.id, completedDays: [] });
      setHasStarted(true);
    }
  }

  return (
    <article className="rounded-md border border-leaf-900/10 bg-leaf-700 p-5 text-white shadow-soft sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-earth-500">CURRENT CHALLENGE</p>
      <h2 className="mt-2 text-2xl font-black leading-tight">{challenge.title}</h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-white/78">{challenge.description}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-white/72">
        <span className="rounded-md bg-white/10 px-3 py-2">{challenge.durationDays}-day challenge</span>
        <span className="rounded-md bg-white/10 px-3 py-2">{challenge.category}</span>
      </div>

      <div className="mt-5 grid gap-2">
        {firstThreeDays.map((day) => {
          const complete = completedDays.includes(day.day);

          return (
            <div key={day.day} className="flex gap-2 rounded-md bg-white/10 p-3 text-sm font-semibold leading-5 text-white/86">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black text-earth-500">
                {complete ? "OK" : day.day}
              </span>
              <span>
                <span className="font-black">Day {day.day}: </span>
                {day.title}
                {complete ? <span className="ml-2 text-xs uppercase tracking-wide">Completed</span> : null}
              </span>
            </div>
          );
        })}
      </div>

      <Link
        href="/learn/challenges/soil-health"
        onClick={startChallenge}
        aria-disabled={isComplete}
        className="focus-ring mt-5 inline-flex rounded-md bg-white px-5 py-3 text-sm font-black text-leaf-700 transition hover:bg-earth-50"
      >
        {buttonText}
      </Link>
    </article>
  );
}

function AllLessonsPanel({ posts }: { posts: BlogPost[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<LearnFilter>("All");

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory = category === "All" || post.category === category;
      const matchesSearch =
        !query ||
        [
          post.title,
          post.category,
          post.level ?? "",
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

  return (
    <section>
      <div className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[0.7fr_0.3fr] lg:items-end">
          <div>
            <p className="gg-eyebrow">All Lessons</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Browse every Skills Center lesson</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
              Search compact lessons for soil, compost, crop care, rain, pest prevention, harvest readiness, and FarmMate tools.
            </p>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-ink">Search lessons</span>
            <span className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search compost, spraying, storage..."
                className="focus-ring w-full rounded-md border border-leaf-900/10 bg-white py-3 pl-10 pr-3 text-sm text-ink shadow-sm"
              />
            </span>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {categoryFilters.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setCategory(item.value)}
              className={`focus-ring rounded-md px-3 py-2 text-sm font-black transition ${
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
        {filteredPosts.map((post) => (
          <CompactLessonCard key={post.slug} post={post} />
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="gg-empty-state mt-8">
          <h3 className="gg-card-title">No lessons found</h3>
          <p className="mt-2 text-sm leading-6 text-ink/62">Try another search term or category.</p>
        </div>
      ) : null}
    </section>
  );
}

function TodayPanel({ posts }: { posts: BlogPost[] }) {
  const todaySkill = lessonByTitle(posts, "Make Your Own Compost for Healthy Soil") ?? posts[0];
  const starterLessons = [
    "Make Your Own Compost for Healthy Soil",
    "Weekly Crop Field Check",
    "Before You Spray: 3 Things to Check First"
  ]
    .map((title) => lessonByTitle(posts, title))
    .filter((post): post is BlogPost => Boolean(post));

  return (
    <section id="soil-compost" className="scroll-mt-24">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
          <p className="gg-eyebrow">Today&apos;s Farm Skill</p>
          <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Build one useful farm skill today</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink/68">
            Choose one practical lesson, try one small action, then use FarmMate if you need a next step.
          </p>
          <div className="mt-5 grid gap-3">
            {starterLessons.map((post) => (
              <Link key={post.slug} href={`/learn/${post.slug}`} className="focus-ring rounded-md bg-leaf-50 p-3 transition hover:bg-white hover:shadow-sm">
                <p className="text-sm font-black text-ink">{post.title}</p>
                <p className="mt-1 text-sm leading-6 text-ink/64">{post.excerpt}</p>
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={`/learn/${todaySkill.slug}`} className="focus-ring rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-700">
              Read today&apos;s lesson
            </Link>
            <Link href="/farmer-hub?tool=ask" className="focus-ring rounded-md border border-leaf-900/15 bg-white px-5 py-3 text-sm font-black text-ink transition hover:bg-leaf-50">
              Ask FarmMate
            </Link>
          </div>
        </article>

        <CurrentChallengeCard />
      </div>
    </section>
  );
}

function FarmMateToolsPanel({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="space-y-6">
      <TopicPanelView panel={topicPanels.farmmate} posts={posts} />
      <div>
        <p className="gg-eyebrow">Practice with live FarmMate tools</p>
        <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Move from learning into action</h2>
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
  );
}

export function LearnHub({ posts }: LearnHubProps) {
  const [activeMenu, setActiveMenu] = useState<MenuKey>("today");

  function renderPanel() {
    if (activeMenu === "today") {
      return <TodayPanel posts={posts} />;
    }

    if (activeMenu === "videos") {
      return <VideosPanel posts={posts} />;
    }

    if (activeMenu === "all") {
      return <AllLessonsPanel posts={posts} />;
    }

    if (activeMenu === "farmmate") {
      return <FarmMateToolsPanel posts={posts} />;
    }

    return <TopicPanelView panel={topicPanels[activeMenu]} posts={posts} />;
  }

  return (
    <div className="bg-white">
      <nav className="sticky top-0 z-20 border-y border-leaf-900/10 bg-white/95 py-3 backdrop-blur" aria-label="Learning topics">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 lg:overflow-visible lg:px-8 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-full flex-wrap gap-2" role="tablist" aria-label="Skills Center topics">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveMenu(item.key)}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-black transition ${
                  activeMenu === item.key
                    ? "bg-leaf-700 text-white"
                    : "bg-leaf-50 text-ink/70 ring-1 ring-leaf-900/10 hover:text-leaf-800"
                }`}
                aria-selected={activeMenu === item.key}
                role="tab"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main id="skills-center" className="scroll-mt-24 bg-[#F7F7EA] py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" role="tabpanel">
          {renderPanel()}
        </div>
      </main>
    </div>
  );
}

