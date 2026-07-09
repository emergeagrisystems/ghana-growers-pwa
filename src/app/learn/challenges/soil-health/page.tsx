import { SoilHealthChallenge } from "@/components/SoilHealthChallenge";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "7-Day Soil Health Challenge",
  description: "Improve your soil this week using materials already on your farm.",
  path: "/learn/challenges/soil-health"
});

export default function SoilHealthChallengePage() {
  return <SoilHealthChallenge />;
}
