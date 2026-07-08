import { FarmMateDisease } from "./types";

export const farmMateDiseases: FarmMateDisease[] = [
  {
    id: "early-blight",
    name: "Early blight",
    affectedCrops: ["Tomato", "Pepper", "Garden eggs"],
    symptoms: ["Yellowing lower leaves", "Brown spots with ring patterns", "Leaves drying from the bottom upward"],
    likelyConditions: ["High humidity", "Rain splash", "Poor airflow", "Old crop debris"],
    firstResponse: ["Remove badly affected lower leaves", "Avoid wetting leaves", "Improve spacing and airflow"],
    recommendCropDoctor: true
  },
  {
    id: "cassava-mosaic",
    name: "Cassava mosaic disease",
    affectedCrops: ["Cassava"],
    symptoms: ["Mottled yellow-green leaves", "Distorted leaves", "Stunted plants"],
    likelyConditions: ["Infected planting material", "Whitefly spread"],
    firstResponse: ["Do not reuse cuttings from affected plants", "Remove severely affected young plants"],
    recommendCropDoctor: true
  },
  {
    id: "yam-anthracnose",
    name: "Yam anthracnose",
    affectedCrops: ["Yam"],
    symptoms: ["Dark leaf spots", "Vine dieback", "Reduced canopy growth"],
    likelyConditions: ["Humid weather", "Dense canopy", "Infected seed yam"],
    firstResponse: ["Improve staking and airflow", "Avoid moving infected planting material"],
    recommendCropDoctor: true
  },
  {
    id: "damping-off",
    name: "Damping-off",
    affectedCrops: ["Tomato", "Pepper", "Onion", "Cucumber", "Okra", "Garden eggs"],
    symptoms: ["Seedlings collapse at soil line", "Thin weak stems", "Patchy nursery loss"],
    likelyConditions: ["Overwatering", "Poor drainage", "Crowded nursery beds"],
    firstResponse: ["Reduce watering frequency", "Improve drainage", "Thin crowded seedlings"],
    recommendCropDoctor: false
  }
];
