"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { BlogCard } from "@/components/BlogCard";
import { learnCategories } from "@/data/blog";
import type { BlogPost } from "@/types";

type LearnHubProps = {
  posts: BlogPost[];
};

export function LearnHub({ posts }: LearnHubProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

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
    <section className="bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-earth-700">Resource search</p>
              <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Find practical Ghana Growers guides</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
                Search guides about joining the network, selling produce, buyer demand, supplier visibility, verification, and market information.
              </p>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-ink">Search resources</span>
              <span className="relative block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search guides, topics, or questions..."
                  className="focus-ring w-full rounded-md border border-leaf-900/10 bg-white py-3 pl-10 pr-3 text-sm text-ink shadow-sm"
                />
              </span>
            </label>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {["All", ...learnCategories].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-md px-4 py-2 text-sm font-black transition ${
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

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="mt-8 rounded-md border border-dashed border-leaf-900/20 bg-leaf-50 p-8 text-center">
            <h3 className="text-xl font-black text-ink">No resources found.</h3>
            <p className="mt-2 text-sm leading-6 text-ink/62">Try another search term or category.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
