import { Clock } from "lucide-react";
import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";
import type { BlogPost } from "@/types";

const categoryImages: Record<BlogPost["category"], string> = {
  Crops: "/images/products/tomatoes.jpg",
  Livestock: "/images/crops/poultry.jpg",
  "Home Gardening": "/images/products/vegetables.jpg",
  Agribusiness: "/images/marketplace/ghana-market-1.jpg",
  "Seasonal Farming": "/images/marketplace/farm-activity-1.jpg",
  "Video Library": "/images/hero/ghana-growers-trade-hero.png"
};

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md border border-leaf-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <SafeImage
        src={categoryImages[post.category]}
        alt={`${post.category} article image`}
        width={520}
        height={300}
        className="h-40 w-full bg-leaf-50 object-cover"
        fallbackKind="default"
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      />
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-black uppercase tracking-wide text-earth-700">{post.category}</p>
        <h2 className="mt-3 text-xl font-black leading-snug text-ink">{post.title}</h2>
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
