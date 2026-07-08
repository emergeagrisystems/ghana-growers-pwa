import type { RouterRule } from "./types";

export const farmMateRouterRules: RouterRule[] = [
  {
    specialist: "crop_health",
    keywords: ["yellow leaves", "leaves yellow", "wilting", "wilt", "poor growth", "not growing", "stunted", "plant stress", "crop health", "tomato leaves"],
    reason: "The question mentions crop symptoms, plant stress or poor growth.",
    suggestedFallbackSpecialist: "general_farming"
  },
  {
    specialist: "pest_disease",
    keywords: ["whitefly", "whiteflies", "armyworm", "fall armyworm", "blight", "fungus", "fungal", "disease", "pest", "insect", "spots", "lesion", "mildew"],
    reason: "The question mentions pests, diseases or visible infection signs.",
    suggestedFallbackSpecialist: "crop_health"
  },
  {
    specialist: "weather_decision",
    keywords: ["spray today", "can i spray", "rain", "wind", "windy", "weather", "irrigation", "water today", "harvest today", "plant today"],
    reason: "The question depends on weather conditions such as rain, wind, spraying, planting or irrigation timing.",
    suggestedFallbackSpecialist: "general_farming"
  },
  {
    specialist: "planting",
    keywords: ["what should i plant", "planting season", "spacing", "seed", "sow", "germination", "plant maize", "plant tomato", "best time to plant"],
    reason: "The question is about planting choices, timing, spacing or seed establishment.",
    suggestedFallbackSpecialist: "general_farming"
  },
  {
    specialist: "fertilizer",
    keywords: ["npk", "fertilizer", "fertiliser", "compost", "manure", "nutrient", "soil fertility", "urea", "nitrogen", "phosphorus", "potassium"],
    reason: "The question mentions fertilizer, nutrients, compost, manure or soil fertility.",
    suggestedFallbackSpecialist: "crop_health"
  },
  {
    specialist: "crop_doctor",
    keywords: ["upload photo", "crop image", "diagnose picture", "photo", "picture", "image", "camera", "leaf photo", "take photo"],
    reason: "The question is asking for image-based crop support or a Crop Doctor handoff.",
    suggestedFallbackSpecialist: "crop_health"
  },
  {
    specialist: "sustainability",
    keywords: ["mulching", "mulch", "soil health", "crop rotation", "water conservation", "organic", "erosion", "cover crop", "low cost", "sustainable"],
    reason: "The question mentions sustainable practices, prevention, soil health or water conservation.",
    suggestedFallbackSpecialist: "general_farming"
  },
  {
    specialist: "learning",
    keywords: ["how do i learn", "guide", "training", "lesson", "teach me", "tutorial", "learn", "course", "explain"],
    reason: "The question asks for learning, training or educational guidance.",
    suggestedFallbackSpecialist: "general_farming"
  }
];
