import type { RouterRule } from "./types";

export const farmMateRouterRules: RouterRule[] = [
  {
    specialist: "crop_health",
    keywords: [
      "yellow leaves",
      "leaves yellow",
      "leaves are yellow",
      "brown leaves",
      "curling leaves",
      "leaves curling",
      "wilting",
      "wilt",
      "flower drop",
      "flowers dropping",
      "fruit drop",
      "stunted",
      "poor growth",
      "not growing",
      "root problem",
      "root rot",
      "plant stress",
      "crop health",
      "tomato leaves"
    ],
    reason: "The question mentions crop symptoms, plant stress or poor growth.",
    suggestedFallbackSpecialist: "general_farming"
  },
  {
    specialist: "pest_disease",
    keywords: ["whitefly", "whiteflies", "armyworm", "fall armyworm", "blight", "fungus", "fungal", "disease", "pest", "insect", "spots", "black spots", "holes in leaves", "leaf holes", "lesion", "mildew"],
    reason: "The question mentions pests, diseases or visible infection signs.",
    suggestedFallbackSpecialist: "crop_health"
  },
  {
    specialist: "weather_decision",
    keywords: [
      "spray",
      "spraying",
      "spray today",
      "can i spray",
      "rain",
      "rainfall",
      "wind",
      "windy",
      "weather",
      "irrigate",
      "irrigation",
      "water today",
      "wet leaves",
      "dry leaves",
      "heavy rain",
      "harvest before rain",
      "harvest today",
      "dry produce",
      "fertilize before rain",
      "fertilise before rain",
      "apply fertilizer before rain",
      "apply fertiliser before rain",
      "plant today"
    ],
    reason: "The question depends on weather conditions such as rain, wind, spraying, planting or irrigation timing.",
    suggestedFallbackSpecialist: "general_farming"
  },
  {
    specialist: "planting",
    keywords: [
      "plant",
      "planting",
      "sow",
      "sowing",
      "transplant",
      "nursery",
      "spacing",
      "seed spacing",
      "planting season",
      "what should i plant",
      "crop to grow",
      "best time to plant",
      "land preparation",
      "germination",
      "plant maize",
      "plant tomato",
      "plant tomatoes"
    ],
    reason: "The question is about planting choices, timing, spacing or seed establishment.",
    suggestedFallbackSpecialist: "general_farming"
  },
  {
    specialist: "fertilizer",
    keywords: [
      "npk",
      "fertilizer",
      "fertiliser",
      "compost",
      "manure",
      "nutrient",
      "soil fertility",
      "urea",
      "nitrogen",
      "phosphorus",
      "potassium",
      "top dressing",
      "top-dressing",
      "basal fertilizer",
      "basal fertiliser",
      "apply fertilizer",
      "apply fertiliser",
      "feeding crop",
      "feed crop",
      "best fertilizer",
      "best fertiliser"
    ],
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
