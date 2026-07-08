import { FarmMateSustainablePractice } from "./types";

export const farmMateSustainablePractices: FarmMateSustainablePractice[] = [
  {
    id: "mulching",
    title: "Mulching",
    appliesTo: ["Tomato", "Pepper", "Okra", "Cucumber", "Garden eggs", "Plantain"],
    benefit: "Helps retain soil moisture, reduce weeds and protect soil from heat.",
    steps: ["Use dry grass or crop residue", "Keep mulch away from the stem", "Replace mulch as it breaks down"]
  },
  {
    id: "crop-rotation",
    title: "Crop rotation",
    appliesTo: ["Maize", "Tomato", "Pepper", "Onion", "Okra", "Cucumber", "Garden eggs"],
    benefit: "Reduces pest and disease build-up and supports soil health.",
    steps: ["Avoid repeating the same crop family on the same bed", "Rotate vegetables with cereals or legumes", "Remove old crop residues"]
  },
  {
    id: "soil-level-watering",
    title: "Soil-level watering",
    appliesTo: ["Tomato", "Pepper", "Onion", "Cucumber", "Okra", "Garden eggs"],
    benefit: "Reduces leaf wetness and lowers fungal disease pressure.",
    steps: ["Water early in the day", "Aim water at the soil", "Avoid splashing soil onto leaves"]
  }
];
