import { Star } from "lucide-react";

export function FeaturedRibbon({ label = "Featured" }: { label?: string }) {
  return (
    <span className="gg-badge gg-badge-featured uppercase">
      <Star size={14} aria-hidden="true" />
      {label}
    </span>
  );
}
