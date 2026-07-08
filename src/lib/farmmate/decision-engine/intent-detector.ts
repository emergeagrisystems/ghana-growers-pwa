import { farmMateCrops } from "../crops";
import { FarmerIntent } from "./types";

export type DetectedFarmMateIntent = {
  intent: FarmerIntent;
  label:
    | "crop_health"
    | "pest_or_disease"
    | "fertilizer"
    | "weather_decision"
    | "planting"
    | "harvest"
    | "crop_planning";
  cropName?: string;
  matchedKeywords: string[];
};

const intentKeywords: Array<{
  intent: FarmerIntent;
  label: DetectedFarmMateIntent["label"];
  keywords: string[];
}> = [
  {
    intent: "weather-decisions",
    label: "weather_decision",
    keywords: ["spray", "rain", "weather", "wind", "today", "wet leaves"]
  },
  {
    intent: "fertilizer",
    label: "fertilizer",
    keywords: ["fertilizer", "fertiliser", "nitrogen", "npk", "not growing", "poor growth", "pale"]
  },
  {
    intent: "planting",
    label: "planting",
    keywords: ["plant", "planting", "sow", "seed", "transplant"]
  },
  {
    intent: "harvest",
    label: "harvest",
    keywords: ["harvest", "pick", "ready", "mature", "ripe"]
  },
  {
    intent: "crop-planning",
    label: "crop_planning",
    keywords: ["plan", "calendar", "season", "best crop", "rotate"]
  },
  {
    intent: "pests",
    label: "pest_or_disease",
    keywords: ["pest", "insect", "worm", "whitefly", "borer", "holes", "spots", "disease", "blight"]
  },
  {
    intent: "crop-health",
    label: "crop_health",
    keywords: ["yellow", "leaves", "wilting", "dropping", "flowers", "sick", "dying", "rot"]
  }
];

export function detectFarmMateIntent(question: string): DetectedFarmMateIntent {
  const normalized = question.trim().toLowerCase();
  const detectedCrop = farmMateCrops.find((crop) => normalized.includes(crop.name.toLowerCase()));
  const matchedIntent = intentKeywords.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)));

  if (matchedIntent) {
    return {
      intent: matchedIntent.intent,
      label: matchedIntent.label,
      cropName: detectedCrop?.name,
      matchedKeywords: matchedIntent.keywords.filter((keyword) => normalized.includes(keyword))
    };
  }

  return {
    intent: "crop-health",
    label: "crop_health",
    cropName: detectedCrop?.name,
    matchedKeywords: []
  };
}

