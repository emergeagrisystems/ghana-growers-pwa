import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Market Intelligence",
  description: "Market intelligence is not available yet on Ghana Growers.",
  path: "/market-intelligence",
  noIndex: true
});

export default function MarketIntelligencePage() {
  return (
    <PageHero
      eyebrow="Market Intelligence"
      title="Market intelligence is not available yet."
      description="Ghana Growers is not publishing market prices or demand signals until the data can be maintained accurately."
      variant="compact"
    >
      <ButtonLink href="/marketplace">Browse Marketplace</ButtonLink>
    </PageHero>
  );
}
