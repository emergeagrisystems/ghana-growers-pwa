export type PlantingAdvisorCropGuidance = {
  crop: string;
  suitablePlantingConditions: string[];
  plantingSeasonNotes: string[];
  spacingGuidance: string[];
  nurseryTransplantingNotes: string[];
  soilPreparation: string[];
  waterRainfallNeeds: string[];
  commonPlantingMistakes: string[];
  sustainablePlantingPractices: string[];
  whenToDelayPlanting: string[];
  nextBestAction: string;
};

export type PlantingAdvisorQuestionType =
  | "crop-choice"
  | "tomato-now"
  | "pepper-spacing"
  | "maize-timing"
  | "tomato-transplant"
  | "general-planting";

export const plantingAdvisorCrops: PlantingAdvisorCropGuidance[] = [
  {
    crop: "Maize",
    suitablePlantingConditions: ["Soil is moist after steady rains.", "The field drains well.", "Good seed is available."],
    plantingSeasonNotes: ["Plant near the start of reliable rains.", "Avoid planting from one light shower if the soil is still dry."],
    spacingGuidance: ["Use local extension spacing where available.", "Keep rows open enough for weeding and airflow.", "Avoid overcrowding maize plants."],
    nurseryTransplantingNotes: ["Maize is usually sown directly in the field."],
    soilPreparation: ["Clear weeds.", "Prepare a fine seedbed.", "Add compost or organic matter where available."],
    waterRainfallNeeds: ["Maize needs steady moisture during germination and early growth.", "Water stress around flowering can reduce yield."],
    commonPlantingMistakes: ["Planting into dry soil.", "Planting into waterlogged soil.", "Using weak or damaged seed."],
    sustainablePlantingPractices: ["Rotate with legumes.", "Keep soil covered where practical.", "Avoid erosion on slopes."],
    whenToDelayPlanting: ["Delay if the soil is waterlogged.", "Delay if heavy rain may wash seed away.", "Delay if seed quality is poor."],
    nextBestAction: "Check soil moisture and drainage before sowing maize."
  },
  {
    crop: "Tomato",
    suitablePlantingConditions: ["Soil is moist but not waterlogged.", "Drainage is good.", "Seedlings are healthy and hardened before transplanting."],
    plantingSeasonNotes: ["Tomato does well when disease pressure and heavy rain are manageable.", "Dry-season tomato needs reliable irrigation."],
    spacingGuidance: ["Give plants enough space for airflow.", "Avoid crowding plants because humidity can increase disease."],
    nurseryTransplantingNotes: ["Raise seedlings in a clean nursery.", "Transplant in the cool morning or late afternoon.", "Harden seedlings before moving them to the field."],
    soilPreparation: ["Prepare raised beds where drainage is weak.", "Add well-rotted compost before transplanting.", "Remove old diseased crop residues."],
    waterRainfallNeeds: ["Keep moisture steady.", "Avoid wetting leaves directly.", "Mulch young plants where available."],
    commonPlantingMistakes: ["Transplanting during extreme heat.", "Planting into waterlogged soil.", "Using weak seedlings."],
    sustainablePlantingPractices: ["Rotate away from tomato-family crops.", "Use clean stakes.", "Maintain airflow and field hygiene."],
    whenToDelayPlanting: ["Delay if heavy rain or flooding is expected.", "Delay if seedlings are weak.", "Delay during extreme heat unless shade and water are available."],
    nextBestAction: "Confirm your region and field moisture before transplanting tomatoes."
  },
  {
    crop: "Pepper",
    suitablePlantingConditions: ["Warm conditions with steady moisture.", "Soil drains well.", "Seedlings are strong before transplanting."],
    plantingSeasonNotes: ["Pepper can be grown in rainy periods with good drainage or dry periods with irrigation."],
    spacingGuidance: ["Use about 45 to 60 cm between pepper plants where local advice allows.", "Keep enough space for airflow and picking."],
    nurseryTransplantingNotes: ["Raise seedlings in a clean nursery.", "Transplant when seedlings are strong.", "Move seedlings in the cool part of the day."],
    soilPreparation: ["Prepare beds with good drainage.", "Add compost or well-rotted manure before planting.", "Remove weeds before transplanting."],
    waterRainfallNeeds: ["Pepper needs steady moisture but dislikes waterlogging.", "Irregular watering can stress flowers and fruit."],
    commonPlantingMistakes: ["Crowding plants.", "Transplanting weak seedlings.", "Planting into very wet soil."],
    sustainablePlantingPractices: ["Mulch lightly.", "Rotate crops.", "Keep spacing for airflow."],
    whenToDelayPlanting: ["Delay if the soil is waterlogged.", "Delay during extreme heat.", "Delay if seedlings are weak."],
    nextBestAction: "Measure spacing and check soil moisture before transplanting pepper."
  },
  {
    crop: "Cassava",
    suitablePlantingConditions: ["Soil is moist but not flooded.", "Healthy stem cuttings are available.", "The field is well drained."],
    plantingSeasonNotes: ["Plant near the start of reliable rains.", "Cassava can tolerate some dry periods after establishment."],
    spacingGuidance: ["Leave enough space for canopy growth and root bulking.", "Use local spacing guidance for your variety and soil."],
    nurseryTransplantingNotes: ["Cassava is planted from healthy stem cuttings, not a nursery."],
    soilPreparation: ["Prepare ridges or mounds where needed.", "Improve poor soil with organic matter.", "Avoid compacted soil."],
    waterRainfallNeeds: ["Moisture helps establishment.", "Flooding can rot cuttings."],
    commonPlantingMistakes: ["Using diseased planting material.", "Planting cuttings into waterlogged soil.", "Planting cuttings too shallow or upside down."],
    sustainablePlantingPractices: ["Use clean planting material.", "Rotate with legumes where possible.", "Control erosion."],
    whenToDelayPlanting: ["Delay if the field is flooded.", "Delay if healthy cuttings are not available.", "Delay if heavy rain may cause waterlogging."],
    nextBestAction: "Select healthy cassava cuttings and check drainage before planting."
  },
  {
    crop: "Yam",
    suitablePlantingConditions: ["Mounds or ridges are ready.", "Soil is loose and drains well.", "Healthy setts are available."],
    plantingSeasonNotes: ["Plant around the early rains when soil moisture is reliable.", "Avoid late planting where the season is short."],
    spacingGuidance: ["Give yam enough space for vines and tuber growth.", "Use local spacing guidance for mound size and variety."],
    nurseryTransplantingNotes: ["Yam is planted from healthy setts or seed yam."],
    soilPreparation: ["Prepare mounds or ridges early.", "Add organic matter where available.", "Avoid compacted or stony soil."],
    waterRainfallNeeds: ["Yam needs moisture for establishment.", "Waterlogged mounds can rot planting material."],
    commonPlantingMistakes: ["Using rotten setts.", "Poor mound preparation.", "Planting into waterlogged soil."],
    sustainablePlantingPractices: ["Mulch mounds.", "Rotate crops.", "Use healthy planting material."],
    whenToDelayPlanting: ["Delay if mounds are not ready.", "Delay if soil is waterlogged.", "Delay if planting material is rotten or weak."],
    nextBestAction: "Prepare well-drained mounds before planting yam."
  },
  {
    crop: "Plantain",
    suitablePlantingConditions: ["Soil is deep and moist.", "Drainage is good.", "Healthy suckers are available."],
    plantingSeasonNotes: ["Plant at the start of steady rains for establishment.", "Irrigation helps dry-season establishment."],
    spacingGuidance: ["Leave enough space between mats for light, airflow and management.", "Avoid overcrowding plantain stands."],
    nurseryTransplantingNotes: ["Use healthy sword suckers or clean planting material."],
    soilPreparation: ["Dig planting holes early.", "Add compost or decomposed organic matter.", "Avoid low flooded areas."],
    waterRainfallNeeds: ["Plantain needs steady moisture.", "Waterlogging can damage roots."],
    commonPlantingMistakes: ["Using weak suckers.", "Planting in poorly drained low spots.", "Crowding plants."],
    sustainablePlantingPractices: ["Mulch around mats.", "Manage suckers well.", "Return organic matter to the soil."],
    whenToDelayPlanting: ["Delay if drainage is poor.", "Delay if planting material is unhealthy.", "Delay during very dry periods without water."],
    nextBestAction: "Choose healthy suckers and check drainage before planting plantain."
  },
  {
    crop: "Onion",
    suitablePlantingConditions: ["Cooler dry conditions with irrigation support.", "Loose soil with good drainage.", "Clean seedlings or seed are available."],
    plantingSeasonNotes: ["Onion often performs better when heavy rain pressure is low.", "Irrigation is important in dry periods."],
    spacingGuidance: ["Keep rows and plants evenly spaced for bulb development.", "Avoid overcrowding because bulbs stay small."],
    nurseryTransplantingNotes: ["Raise seedlings in a clean nursery.", "Transplant healthy seedlings carefully.", "Avoid burying seedlings too deep."],
    soilPreparation: ["Prepare fine beds.", "Use well-rotted compost.", "Avoid fresh manure close to bulbs."],
    waterRainfallNeeds: ["Onion needs steady but not excessive moisture.", "Too much water can increase rot."],
    commonPlantingMistakes: ["Overcrowding.", "Planting too deep.", "Using fresh manure close to bulbs."],
    sustainablePlantingPractices: ["Rotate away from onion-family crops.", "Use clean beds.", "Control weeds early."],
    whenToDelayPlanting: ["Delay if beds are waterlogged.", "Delay if seedlings are weak.", "Delay if heavy rain may flood beds."],
    nextBestAction: "Prepare fine, well-drained onion beds before transplanting."
  },
  {
    crop: "Okra",
    suitablePlantingConditions: ["Warm soil.", "Moist but not waterlogged field.", "Good seed is available."],
    plantingSeasonNotes: ["Okra grows well with warmth and steady moisture.", "Dry periods need watering support."],
    spacingGuidance: ["Space okra enough for branching and picking.", "Avoid overcrowding plants."],
    nurseryTransplantingNotes: ["Okra is usually sown directly; handle seedlings carefully if transplanted."],
    soilPreparation: ["Clear weeds.", "Add compost where available.", "Prepare loose soil for roots."],
    waterRainfallNeeds: ["Okra needs moisture for germination and pod formation.", "Waterlogging can weaken roots."],
    commonPlantingMistakes: ["Planting old seed.", "Crowding plants.", "Ignoring early weeds."],
    sustainablePlantingPractices: ["Mulch where available.", "Rotate crops.", "Keep harvesting regularly."],
    whenToDelayPlanting: ["Delay if soil is waterlogged.", "Delay if seed is poor quality.", "Delay during extreme dryness without water."],
    nextBestAction: "Check seed quality and soil moisture before sowing okra."
  },
  {
    crop: "Cucumber",
    suitablePlantingConditions: ["Warm conditions.", "Reliable moisture.", "Good drainage and airflow."],
    plantingSeasonNotes: ["Cucumber can grow in rainy periods with good drainage or dry periods with irrigation."],
    spacingGuidance: ["Leave space for vines and airflow.", "Avoid crowding because humidity can increase disease."],
    nurseryTransplantingNotes: ["Cucumber may be direct-seeded or transplanted carefully while young."],
    soilPreparation: ["Prepare raised beds where drainage is weak.", "Add compost before planting.", "Remove old diseased vines."],
    waterRainfallNeeds: ["Needs steady moisture during flowering and fruiting.", "Avoid wetting leaves if disease pressure is high."],
    commonPlantingMistakes: ["Overcrowding vines.", "Planting in waterlogged beds.", "Using weak seedlings."],
    sustainablePlantingPractices: ["Use mulch.", "Rotate away from cucurbits.", "Keep fruit off wet soil where practical."],
    whenToDelayPlanting: ["Delay if beds are waterlogged.", "Delay during extreme heat without water.", "Delay if disease pressure is high and drainage is poor."],
    nextBestAction: "Prepare a well-drained bed with enough vine space before planting cucumber."
  },
  {
    crop: "Garden eggs",
    suitablePlantingConditions: ["Warm conditions.", "Steady moisture.", "Well-drained soil."],
    plantingSeasonNotes: ["Garden eggs can grow in rainy periods with drainage or dry periods with irrigation."],
    spacingGuidance: ["Give plants enough space for branching and airflow.", "Avoid crowding plants."],
    nurseryTransplantingNotes: ["Raise seedlings in a clean nursery.", "Transplant strong seedlings in the cool part of the day."],
    soilPreparation: ["Prepare beds with compost where available.", "Remove weeds.", "Avoid old diseased solanaceous crop residues."],
    waterRainfallNeeds: ["Needs steady moisture after transplanting.", "Waterlogging can stress roots."],
    commonPlantingMistakes: ["Transplanting weak seedlings.", "Crowding plants.", "Planting in waterlogged soil."],
    sustainablePlantingPractices: ["Rotate away from tomato-family crops.", "Mulch lightly.", "Keep field hygiene good."],
    whenToDelayPlanting: ["Delay if seedlings are weak.", "Delay if soil is waterlogged.", "Delay during extreme heat without water."],
    nextBestAction: "Check seedling strength and field drainage before transplanting garden eggs."
  }
];

export function findPlantingAdvisorGuidance(cropName?: string | null) {
  if (!cropName) {
    return undefined;
  }

  return plantingAdvisorCrops.find((guidance) => guidance.crop.toLowerCase() === cropName.toLowerCase());
}

export function plantingAdvisorQuestionType(question: string): PlantingAdvisorQuestionType {
  const normalized = question.toLowerCase();

  if (normalized.includes("what should i plant") || normalized.includes("crop to grow")) {
    return "crop-choice";
  }

  if ((normalized.includes("tomato") || normalized.includes("tomatoes")) && normalized.includes("transplant")) {
    return "tomato-transplant";
  }

  if (normalized.includes("pepper") && normalized.includes("spacing")) {
    return "pepper-spacing";
  }

  if (normalized.includes("maize") && (normalized.includes("when") || normalized.includes("plant"))) {
    return "maize-timing";
  }

  if ((normalized.includes("tomato") || normalized.includes("tomatoes")) && normalized.includes("plant")) {
    return "tomato-now";
  }

  return "general-planting";
}

export function plantingAdvisorOpeningForQuestion(question: string) {
  const type = plantingAdvisorQuestionType(question);

  if (type === "crop-choice") {
    return "Let's choose a crop after checking your crop type, region, season, water and land preparation.";
  }

  if (type === "pepper-spacing") {
    return "Pepper spacing should leave enough room for airflow, picking and healthy roots.";
  }

  if (type === "tomato-transplant") {
    return "Tomato transplanting is safer when seedlings are strong and the field is moist but not waterlogged.";
  }

  return "Planting advice depends on crop, region, season, water and land preparation.";
}
