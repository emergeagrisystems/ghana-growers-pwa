import { SoilHealthChallenge } from "@/components/SoilHealthChallenge";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Current Skills Center Challenge",
  description: "A practical Ghana Growers challenge with local progress saved on this phone only.",
  path: "/learn/challenges/soil-health"
});

export default function SoilHealthChallengePage() {
  return <SoilHealthChallenge />;
}
