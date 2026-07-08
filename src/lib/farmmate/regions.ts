import { FarmMateRegion } from "./types";

export const farmMateRegions: FarmMateRegion[] = [
  {
    id: "ashanti",
    name: "Ashanti",
    climateNotes: "Forest-transition conditions with reliable major season rainfall in many districts.",
    commonCrops: ["Maize", "Cassava", "Yam", "Plantain", "Tomato"],
    advisoryNotes: ["Watch for fungal disease after extended humid periods.", "Use mulch on vegetable beds during dry spells."]
  },
  {
    id: "bono",
    name: "Bono",
    climateNotes: "Forest and transition zones suitable for roots, tubers, plantain and cereals.",
    commonCrops: ["Cassava", "Yam", "Plantain", "Maize"],
    advisoryNotes: ["Prepare mounds early for yam.", "Maintain soil cover to reduce erosion."]
  },
  {
    id: "eastern",
    name: "Eastern",
    climateNotes: "Mixed forest and highland pockets with strong vegetable and plantain potential.",
    commonCrops: ["Plantain", "Cassava", "Tomato", "Pepper", "Okra"],
    advisoryNotes: ["Improve drainage for vegetable plots.", "Monitor tomatoes closely during humid weather."]
  },
  {
    id: "greater-accra",
    name: "Greater Accra",
    climateNotes: "Coastal savannah with lower rainfall and stronger irrigation need for vegetables.",
    commonCrops: ["Onion", "Tomato", "Pepper", "Cucumber", "Okra"],
    advisoryNotes: ["Use water efficiently.", "Avoid spraying during windy coastal afternoons."]
  },
  {
    id: "northern",
    name: "Northern",
    climateNotes: "Savannah conditions with a pronounced rainy season and long dry season.",
    commonCrops: ["Maize", "Yam", "Onion", "Pepper"],
    advisoryNotes: ["Time planting with steady rains.", "Protect soil moisture with residue or mulch where available."]
  }
];
