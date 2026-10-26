import { MarketplaceStage2Notice } from "@/components/MarketplaceStage2Notice";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Produce sourcing | Planned for Stage 2",
  description: "This Marketplace pathway is preserved for Stage 2 and is not public yet.",
  path: "/marketplace"
});

export default function Page() {
  return <MarketplaceStage2Notice />;
}
