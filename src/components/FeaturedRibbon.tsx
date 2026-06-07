import { Star } from "lucide-react";

export function FeaturedRibbon({ label = "Featured" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-earth-500 px-3 py-2 text-xs font-black uppercase text-ink shadow-soft">
      <Star size={14} aria-hidden="true" />
      {label}
    </span>
  );
}
