import { MarketplaceStage2Notice } from "@/components/MarketplaceStage2Notice";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Marketplace | Planned for Stage 2",
  description: "The Ghana Growers Marketplace is preserved for Stage 2 and is not public yet.",
  path: "/marketplace"
});

export default function MarketplacePage() {
  return <MarketplaceStage2Notice />;
}
