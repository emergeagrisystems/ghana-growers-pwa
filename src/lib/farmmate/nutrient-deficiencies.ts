import { FarmMateNutrientDeficiency } from "./types";

export const farmMateNutrientDeficiencies: FarmMateNutrientDeficiency[] = [
  {
    id: "nitrogen-deficiency",
    nutrient: "Nitrogen",
    commonSigns: ["Older leaves turn pale green or yellow", "Slow growth", "Thin stems"],
    likelyCrops: ["Maize", "Tomato", "Pepper", "Okra", "Cucumber"],
    nextChecks: ["Check whether yellowing starts on older leaves", "Check if soil has been heavily leached by rain"],
    generalAction: "Apply a suitable nitrogen source according to local extension guidance and avoid placing fertilizer directly on stems."
  },
  {
    id: "potassium-deficiency",
    nutrient: "Potassium",
    commonSigns: ["Leaf edge scorching", "Weak stems", "Poor fruit filling"],
    likelyCrops: ["Plantain", "Tomato", "Pepper", "Cucumber"],
    nextChecks: ["Check leaf margins", "Check fruit size and firmness"],
    generalAction: "Improve soil fertility with balanced fertilizer and organic matter where available."
  },
  {
    id: "phosphorus-deficiency",
    nutrient: "Phosphorus",
    commonSigns: ["Slow early growth", "Dark green or purplish leaves", "Weak root development"],
    likelyCrops: ["Maize", "Onion", "Tomato"],
    nextChecks: ["Check young plants after cool or wet conditions", "Check root development"],
    generalAction: "Use appropriate starter fertilizer in moist soil and follow local application rates."
  }
];
