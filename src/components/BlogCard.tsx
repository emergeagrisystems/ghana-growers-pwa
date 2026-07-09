import { BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import type { BlogPost } from "@/types";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="flex h-full flex-col rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-wide text-earth-700">{post.category}</p>
        <span className="gg-icon gg-icon-standard h-9 w-9 shrink-0">
          <BookOpen size={17} aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-1 flex-col">
        <h2 className="mt-4 text-xl font-black leading-snug text-ink">{post.title}</h2>
        <p className="mt-3 flex-1 text-sm leading-6 text-ink/65">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-ink/55">
          <span>{new Date(post.date).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" })}</span>
          <span className="inline-flex items-center gap-1"><Clock size={14} aria-hidden="true" /> {post.readTime}</span>
        </div>
        <Link href={`/learn/${post.slug}`} className="mt-5 text-sm font-black text-leaf-700 transition hover:text-leaf-800">
          Read guide
        </Link>
      </div>
    </article>
  );
}
