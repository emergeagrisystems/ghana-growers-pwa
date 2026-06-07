import Link from "next/link";
import { Clock } from "lucide-react";
import type { BlogPost } from "@/types";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
      <p className="text-xs font-black uppercase text-earth-700">{post.category}</p>
      <h2 className="mt-3 text-xl font-black leading-snug text-ink">{post.title}</h2>
      <p className="mt-3 text-sm leading-6 text-ink/65">{post.excerpt}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-ink/55">
        <span>{new Date(post.date).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" })}</span>
        <span className="inline-flex items-center gap-1"><Clock size={14} aria-hidden="true" /> {post.readTime}</span>
      </div>
      <Link href="/about/blog" className="mt-5 inline-flex font-black text-leaf-700 hover:text-earth-700">
        Read preview
      </Link>
    </article>
  );
}
