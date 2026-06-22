"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { faqCategories, type FaqItem } from "@/data/trustCenter";

type FaqExplorerProps = {
  items: FaqItem[];
};

export function FaqExplorer({ items }: FaqExplorerProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch =
        !query ||
        [item.question, item.answer, item.category]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, items, search]);

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-earth-700">FAQ search</p>
              <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Find answers quickly</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
                Search by topic or filter questions for farmers, buyers, suppliers, and trust and safety.
              </p>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-ink">Search FAQ</span>
              <span className="relative block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search joining, verification, buyer requests..."
                  className="focus-ring w-full rounded-md border border-leaf-900/10 bg-white py-3 pl-10 pr-3 text-sm text-ink shadow-sm"
                />
              </span>
            </label>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {["All", ...faqCategories].map((item) => (
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

        <div className="mt-8 grid gap-4">
          {filteredItems.map((item) => (
            <details key={`${item.category}-${item.question}`} className="group rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-lg font-black leading-snug text-ink">{item.question}</h3>
                  <span className="w-fit shrink-0 rounded-md bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-700">
                    {item.category}
                  </span>
                </div>
              </summary>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-ink/68">{item.answer}</p>
            </details>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="gg-empty-state mt-8">
            <h3 className="gg-card-title">No records available yet</h3>
            <p className="mt-2 text-sm leading-6 text-ink/62">Try another keyword or category.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
