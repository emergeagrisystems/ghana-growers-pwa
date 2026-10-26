import { MarketplaceStage2Notice } from "@/components/MarketplaceStage2Notice";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export function generateMetadata() {
  return createPageMetadata({
    title: "Marketplace | Planned for Stage 2",
    description: "The Ghana Growers Marketplace is preserved for Stage 2 and is not public yet.",
    path: "/marketplace"
  });
}

export default function MarketplaceListingPage() {
  return <MarketplaceStage2Notice />;
}
