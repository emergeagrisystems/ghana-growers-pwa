import type { FarmMateSpecialistProfile } from "./types";

export const farmMateSpecialists: FarmMateSpecialistProfile[] = [
  {
    specialist: "crop_health",
    title: "Crop Health",
    description: "Handles crop symptoms, wilting, yellow leaves, poor growth and plant stress."
  },
  {
    specialist: "pest_disease",
    title: "Pest and Disease",
    description: "Handles pest pressure, disease symptoms, armyworm, whiteflies, blight and crop infection risks."
  },
  {
    specialist: "weather_decision",
    title: "Weather Decision",
    description: "Handles spraying, planting and irrigation decisions affected by weather."
  },
  {
    specialist: "harvest_postharvest",
    title: "Harvest and Post-Harvest",
    description: "Handles harvest timing, maturity signs, sorting, storage, transport, drying and produce quality."
  },
  {
    specialist: "planting",
    title: "Planting",
    description: "Handles planting season, crop choice, spacing, seed timing and field preparation questions."
  },
  {
    specialist: "fertilizer",
    title: "Fertilizer",
    description: "Handles fertilizer timing, nutrient problems, compost and soil fertility."
  },
  {
    specialist: "crop_doctor",
    title: "Crop Doctor",
    description: "Handles crop photo, image upload and visual diagnosis handoff questions."
  },
  {
    specialist: "sustainability",
    title: "Sustainability",
    description: "Handles soil health, mulching, crop rotation, water conservation and low-cost preventive practices."
  },
  {
    specialist: "learning",
    title: "Learning",
    description: "Handles guides, lessons, training and farmer education requests."
  },
  {
    specialist: "general_agronomy",
    title: "General Agronomy",
    description: "Handles seed, nursery, seedlings, weeds, soil, drainage, intercropping, rotation, pruning and broad field-practice questions."
  },
  {
    specialist: "general_farming",
    title: "General Farming",
    description: "Handles broad farming questions when no specialist route is clear yet."
  }
];

export function findFarmMateSpecialistProfile(specialist: FarmMateSpecialistProfile["specialist"]) {
  return farmMateSpecialists.find((profile) => profile.specialist === specialist);
}
