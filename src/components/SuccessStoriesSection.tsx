import Link from "next/link";
import { CalendarDays, MapPin, Quote } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import type { SuccessStory } from "@/types";

type SuccessStoriesSectionProps = {
  stories: SuccessStory[];
  preview?: boolean;
};

export function SuccessStoriesSection({ stories, preview = false }: SuccessStoriesSectionProps) {
  const visibleStories = preview ? stories.slice(0, 3) : stories;

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-earth-700">Success Stories</p>
            <h2 className="mt-2 text-2xl font-black text-ink sm:text-4xl">Stories from the Ghana Growers network</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/65">
              Real stories will be published here as Ghana Growers grows and members begin sharing outcomes from the network.
            </p>
          </div>
          {preview && stories.length > 0 ? (
            <Link href="/success-stories" className="font-black text-leaf-700 transition hover:text-leaf-800">
              View all stories
            </Link>
          ) : null}
        </div>

        {visibleStories.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleStories.map((story) => (
              <article key={story.id} className="overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm">
                {story.image ? (
                  <SafeImage
                    src={story.image}
                    alt={`${story.personBusinessName} success story`}
                    width={520}
                    height={300}
                    className="h-44 w-full bg-leaf-50 object-cover"
                    fallbackKind="default"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                ) : null}
                <div className="p-5">
                  <span className="inline-flex rounded-md bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-700">
                    {story.category}
                  </span>
                  <h3 className="mt-4 text-xl font-black leading-snug text-ink">{story.title}</h3>
                  <p className="mt-2 font-black text-ink/72">{story.personBusinessName}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-ink/50">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} aria-hidden="true" />
                      {story.region}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={14} aria-hidden="true" />
                      {new Date(story.date).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-ink/65">{story.summary}</p>
                  <div className="mt-4 rounded-md bg-earth-50 p-4">
                    <Quote className="text-earth-700" size={18} aria-hidden="true" />
                    <p className="mt-2 text-sm font-bold leading-6 text-ink/72">{story.outcome}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-md border border-dashed border-leaf-900/20 bg-leaf-50 p-8 text-center">
            <h3 className="text-xl font-black text-ink">Success stories coming soon as Ghana Growers grows.</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-ink/62">
              Ghana Growers will publish real farmer, buyer, and supplier stories after verified outcomes are available.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
