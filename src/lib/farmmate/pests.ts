import { FarmMatePest } from "./types";

export const farmMatePests: FarmMatePest[] = [
  {
    id: "fall-armyworm",
    name: "Fall armyworm",
    affectedCrops: ["Maize"],
    signs: ["Ragged leaf holes", "Frass in the whorl", "Young plants losing growing points"],
    prevention: ["Scout fields early", "Remove heavily affected whorl debris where practical", "Encourage field hygiene"],
    firstResponse: ["Check 10-20 plants across the field", "Act early if many young plants show fresh damage"]
  },
  {
    id: "whitefly",
    name: "Whitefly",
    affectedCrops: ["Tomato", "Pepper", "Garden eggs", "Cucumber"],
    signs: ["Small white insects under leaves", "Sticky leaves", "Yellowing or curling leaves"],
    prevention: ["Remove weeds around plots", "Avoid overcrowding", "Use clean seedlings"],
    firstResponse: ["Inspect the underside of leaves", "Remove badly infested leaves when pressure is low"]
  },
  {
    id: "fruit-borer",
    name: "Fruit borer",
    affectedCrops: ["Tomato", "Pepper", "Okra", "Garden eggs"],
    signs: ["Small holes in fruits", "Rot near entry points", "Larvae inside fruit"],
    prevention: ["Harvest mature fruits promptly", "Remove damaged fruits", "Rotate crops"],
    firstResponse: ["Collect and destroy affected fruits", "Check nearby plants for fresh damage"]
  },
  {
    id: "nematodes",
    name: "Root-knot nematodes",
    affectedCrops: ["Tomato", "Pepper", "Okra", "Cucumber"],
    signs: ["Knotted roots", "Stunted plants", "Wilting even when soil is moist"],
    prevention: ["Rotate with non-host crops", "Use healthy seedlings", "Improve soil organic matter"],
    firstResponse: ["Inspect roots from one affected plant", "Avoid replanting the same crop family immediately"]
  }
];
