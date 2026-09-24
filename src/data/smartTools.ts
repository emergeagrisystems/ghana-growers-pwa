import { Bot, CloudSun, LineChart, ScanSearch } from "lucide-react";
import { publicFeatureAvailability } from "../lib/publicFeatureAvailability";

const allSmartTools = [
  {
    title: "Live Weather Updates",
    description: "Plan spraying, drying, irrigation, and harvesting with weather guidance for key Ghana regions.",
    cta: "Check Weather",
    href: "#weather",
    icon: CloudSun
  },
  {
    title: "Crop Doctor",
    description: "Use a crop or leaf photo to preview how disease and nutrient-stress advice will work.",
    cta: "Upload Crop Photo",
    href: "#crop-health",
    icon: ScanSearch
  },
  {
    title: "Farm Help Assistant",
    description: "Ask practical questions about crop care, storage, fertilizer, buyers, and market access.",
    cta: "Ask Farm Question",
    href: "#assistant",
    icon: Bot
  },
  {
    title: "Ghana Market Prices",
    description: "Compare indicative prices by crop, region, and market before starting trade conversations.",
    cta: "View Market Prices",
    href: "#market-prices",
    icon: LineChart,
    isPubliclyAvailable: publicFeatureAvailability.marketPriceCheck
  }
];

export const smartTools = allSmartTools.filter((tool) => tool.isPubliclyAvailable !== false);

export const assistantSuggestions = [
  "How do I improve tomato yield?",
  "Why are my maize leaves yellow?",
  "How do I store onions?",
  "How can I find buyers?",
  "When should I plant cassava in Ashanti Region?",
  "What should I check before buying fertilizer?"
];

export function getSampleAssistantResponse(question: string) {
  const text = question.toLowerCase();

  if (text.includes("buyer") || text.includes("market") || text.includes("sell")) {
    return "Start by listing crop, volume, location, harvest date, and preferred unit. Ghana Growers can help structure buyer inquiries through WhatsApp and marketplace listings.";
  }

  if (text.includes("disease") || text.includes("yellow") || text.includes("leaf")) {
    return "Check whether the issue appears on old leaves, new leaves, or spots across the plant. Isolate affected samples, avoid overwatering, and confirm with an extension officer before spraying.";
  }

  if (text.includes("fertilizer") || text.includes("pepper")) {
    return "Use soil condition, crop stage, and rainfall timing to guide fertilizer use. Apply early in the day, avoid heavy rain periods, and follow local agronomist guidance.";
  }

  if (text.includes("storage") || text.includes("loss")) {
    return "Sort damaged produce quickly, keep crates off bare ground, improve shade and airflow, and avoid mixing wet produce with dry produce during transport.";
  }

  return "Thanks for the question. Share your crop, location, crop stage, and the exact problem so Ghana Growers can prepare a more useful advisory response.";
}
