import { Star } from "lucide-react";

export function FeaturedRibbon({ label = "Featured" }: { label?: string }) {
  return (
    <span className="gg-badge gg-badge-featured text-[11px] font-bold uppercase tracking-[0.08em]">
      <Star size={14} aria-hidden="true" />
      {label}
    </span>
  );
}
