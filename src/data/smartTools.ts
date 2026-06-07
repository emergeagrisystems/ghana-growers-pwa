import { Bot, CloudSun, LineChart, ScanSearch } from "lucide-react";

export const smartTools = [
  {
    title: "Live Weather Updates",
    description: "Check temperature, humidity, wind, rainfall chance, forecast, and farming advice by Ghana region.",
    icon: CloudSun
  },
  {
    title: "Crop Health Check",
    description: "Upload a crop or leaf photo and view an advisory mock diagnosis while API integrations are prepared.",
    icon: ScanSearch
  },
  {
    title: "AI Farmer Assistant",
    description: "Ask sample farming questions about diseases, storage, fertilizer, market access, and buyers.",
    icon: Bot
  },
  {
    title: "Ghana Market Prices",
    description: "Filter indicative crop prices by crop, region, and market using editable local data.",
    icon: LineChart
  }
];

export const assistantSuggestions = [
  "How can I reduce post-harvest losses for tomatoes?",
  "What should I do if maize leaves are yellowing?",
  "How do I find buyers for bulk cassava?",
  "When should I apply fertilizer to pepper?"
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
