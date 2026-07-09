export type FertilizerCropGuidance = {
  crop: string;
  commonNutrientNeeds: string[];
  growthStages: string[];
  fertilizerTimingPrinciples: string[];
  organicMatterGuidance: string[];
  checksBeforeApplying: string[];
  nutrientStressSigns: string[];
  safeUseNotes: string[];
  sustainabilityNotes: string[];
  soilTestTriggers: string[];
  extensionOfficerTriggers: string[];
};

export const fertilizerSpecialistCrops: FertilizerCropGuidance[] = [
  {
    crop: "Maize",
    commonNutrientNeeds: ["Nitrogen for leaf growth", "Phosphorus for early roots", "Potassium for plant strength"],
    growthStages: ["Less than 2 weeks", "2 to 4 weeks", "More than 4 weeks", "Already flowering"],
    fertilizerTimingPrinciples: ["Use basal feeding early where locally recommended.", "Top dressing is usually more useful during active vegetative growth.", "Avoid applying fertilizer before heavy rain."],
    organicMatterGuidance: ["Compost or well-rotted manure helps soil hold nutrients and moisture.", "Apply organic matter before planting or between rows without touching stems."],
    checksBeforeApplying: ["Check maize age.", "Check soil moisture and recent rain.", "Check whether fertilizer or manure was already applied."],
    nutrientStressSigns: ["Older leaves turning pale yellow", "Purple older leaves in young maize", "Slow growth despite enough moisture"],
    safeUseNotes: ["Do not guess rates.", "Keep fertilizer away from the stem.", "Do not apply to dry or waterlogged stressed maize."],
    sustainabilityNotes: ["Use compost where available.", "Mulch to protect soil moisture.", "Avoid runoff before rain."],
    soilTestTriggers: ["Repeated poor growth on the same plot", "High input cost decisions", "Unclear nutrient symptoms"],
    extensionOfficerTriggers: ["Many plants are affected", "Fertilizer burned the crop", "The farmer needs local product rates"]
  },
  {
    crop: "Tomato",
    commonNutrientNeeds: ["Nitrogen for early growth", "Phosphorus for roots", "Potassium and calcium support fruiting"],
    growthStages: ["Seedling", "Vegetative growth", "Flowering", "Fruiting"],
    fertilizerTimingPrinciples: ["Feed lightly and consistently rather than dumping fertilizer at once.", "Avoid excess nitrogen during flowering.", "Do not fertilize before heavy rain."],
    organicMatterGuidance: ["Use compost to improve soil structure before planting.", "Well-rotted manure is safer than fresh manure around vegetables."],
    checksBeforeApplying: ["Check plant stage.", "Check soil moisture.", "Check whether leaves are too lush or yellowing."],
    nutrientStressSigns: ["Yellow older leaves", "Poor fruit set", "Blossom-end rot risk when calcium and water are uneven"],
    safeUseNotes: ["Avoid fertilizer touching roots or stems.", "Do not use fresh manure close to harvest.", "Follow local product labels."],
    sustainabilityNotes: ["Mulch tomatoes to reduce moisture swings.", "Rotate away from tomato family crops.", "Add organic matter before the season."],
    soilTestTriggers: ["Repeated tomato yield problems", "Blossom-end rot over several beds", "Planning commercial fertilizer spend"],
    extensionOfficerTriggers: ["Widespread yellowing or burn", "Disease and nutrient symptoms overlap", "Unclear fertilizer choice"]
  },
  {
    crop: "Pepper",
    commonNutrientNeeds: ["Balanced early feeding", "Potassium during flowering and fruiting", "Avoid excess nitrogen"],
    growthStages: ["Seedling", "Vegetative growth", "Flowering", "Fruiting"],
    fertilizerTimingPrinciples: ["Avoid heavy nitrogen during flowering.", "Feed when soil has moisture but is not waterlogged.", "Wait if heavy rain is expected."],
    organicMatterGuidance: ["Compost improves pepper root zone moisture.", "Use well-rotted manure before planting where available."],
    checksBeforeApplying: ["Check flower stage.", "Check soil moisture.", "Check whether fertilizer was recently applied."],
    nutrientStressSigns: ["Yellow lower leaves", "Flower drop with very leafy plants", "Slow growth"],
    safeUseNotes: ["Do not apply fertilizer to wilted pepper.", "Keep fertilizer off leaves.", "Use local label guidance for any product."],
    sustainabilityNotes: ["Mulch lightly.", "Keep watering steady.", "Use organic matter before planting."],
    soilTestTriggers: ["Repeated flower drop", "High input cost decisions", "Poor response after feeding"],
    extensionOfficerTriggers: ["Plants burn after fertilizer", "Many plants drop flowers", "The farmer needs local rate guidance"]
  },
  {
    crop: "Cassava",
    commonNutrientNeeds: ["Potassium supports root bulking", "Phosphorus supports early roots", "Organic matter supports poor soils"],
    growthStages: ["Establishment", "Canopy growth", "Root bulking", "Near harvest"],
    fertilizerTimingPrinciples: ["Focus on soil preparation and early establishment.", "Avoid late heavy nitrogen.", "Do not apply before heavy rain."],
    organicMatterGuidance: ["Compost or manure can improve poor cassava soils before planting.", "Use crop residues and mulch where practical."],
    checksBeforeApplying: ["Check soil fertility history.", "Check crop age.", "Check moisture and erosion risk."],
    nutrientStressSigns: ["Slow canopy growth", "Pale leaves", "Poor root bulking"],
    safeUseNotes: ["Do not guess fertilizer rates.", "Avoid wasting fertilizer close to harvest.", "Ask for local guidance on poor soils."],
    sustainabilityNotes: ["Rotate cassava with legumes where possible.", "Return organic matter to the soil.", "Control erosion."],
    soilTestTriggers: ["Poor root yield over repeated seasons", "New land with unknown fertility", "Commercial production decisions"],
    extensionOfficerTriggers: ["Severe poor growth across the field", "Unclear nutrient versus disease symptoms", "Need for local product rates"]
  },
  {
    crop: "Yam",
    commonNutrientNeeds: ["Organic matter for soil structure", "Potassium for tuber development", "Balanced fertility early"],
    growthStages: ["Sett establishment", "Vine growth", "Tuber bulking", "Near harvest"],
    fertilizerTimingPrinciples: ["Improve the mound or ridge before planting.", "Avoid late heavy nitrogen.", "Do not fertilize before heavy rain."],
    organicMatterGuidance: ["Compost improves mounds and moisture holding.", "Use well-rotted manure before planting, not fresh manure against setts."],
    checksBeforeApplying: ["Check mound condition.", "Check crop stage.", "Check moisture."],
    nutrientStressSigns: ["Weak vine growth", "Pale leaves", "Poor tuber bulking"],
    safeUseNotes: ["Avoid fertilizer touching planting material.", "Do not guess rates.", "Avoid fertilizer on dry stressed plants."],
    sustainabilityNotes: ["Use mulch to protect mounds.", "Rotate crops.", "Maintain organic matter."],
    soilTestTriggers: ["Repeated poor tuber size", "High-cost fertilizer decisions", "Unknown field fertility"],
    extensionOfficerTriggers: ["Widespread weak growth", "Fertilizer burn", "Need for local rate advice"]
  },
  {
    crop: "Plantain",
    commonNutrientNeeds: ["Potassium for bunch development", "Nitrogen for leaf growth", "Organic matter for moisture"],
    growthStages: ["New sucker", "Vegetative growth", "Bunch formation", "After harvest sucker management"],
    fertilizerTimingPrinciples: ["Feed around active growth when soil is moist.", "Avoid fertilizer too close to the pseudostem.", "Do not apply before heavy rain."],
    organicMatterGuidance: ["Mulch and compost around plantain mats help soil moisture.", "Use decomposed organic matter around, not against, the stem."],
    checksBeforeApplying: ["Check mat age.", "Check soil moisture.", "Check yellowing or weak leaves."],
    nutrientStressSigns: ["Yellowing older leaves", "Weak bunch development", "Poor sucker growth"],
    safeUseNotes: ["Keep fertilizer away from the stem.", "Do not fertilize waterlogged mats.", "Avoid guessing rates."],
    sustainabilityNotes: ["Mulch with plant residues.", "Maintain clean mats.", "Reduce erosion around stands."],
    soilTestTriggers: ["Repeated poor bunch size", "Commercial plantain production", "Unclear nutrient symptoms"],
    extensionOfficerTriggers: ["Widespread decline", "Storm or waterlogging damage", "Need for product rates"]
  },
  {
    crop: "Onion",
    commonNutrientNeeds: ["Balanced early feeding", "Nitrogen early only", "Potassium supports bulb development"],
    growthStages: ["Seedling", "Leaf growth", "Bulb formation", "Near harvest"],
    fertilizerTimingPrinciples: ["Avoid late nitrogen near harvest.", "Feed when soil moisture is steady.", "Do not fertilize before heavy rain."],
    organicMatterGuidance: ["Use well-rotted compost before planting.", "Avoid fresh manure near bulbs."],
    checksBeforeApplying: ["Check growth stage.", "Check soil moisture.", "Check leaf colour."],
    nutrientStressSigns: ["Pale leaves", "Weak leaf growth", "Small bulbs"],
    safeUseNotes: ["Avoid fertilizer burn on shallow roots.", "Do not use fresh manure close to harvest.", "Follow local label guidance."],
    sustainabilityNotes: ["Use compost before the crop.", "Avoid runoff.", "Rotate away from onion family crops."],
    soilTestTriggers: ["Small bulbs across seasons", "Salty or poor soil concern", "Commercial input decisions"],
    extensionOfficerTriggers: ["Burned leaves after feeding", "Widespread yellowing", "Need for local rate guidance"]
  },
  {
    crop: "Okra",
    commonNutrientNeeds: ["Balanced early feeding", "Organic matter for steady growth", "Avoid excess nitrogen"],
    growthStages: ["Seedling", "Vegetative growth", "Flowering", "Harvesting"],
    fertilizerTimingPrinciples: ["Feed lightly during active growth.", "Avoid too much nitrogen if plants are leafy but not fruiting.", "Do not apply before heavy rain."],
    organicMatterGuidance: ["Compost supports steady okra growth.", "Well-rotted manure can be worked into soil before planting."],
    checksBeforeApplying: ["Check growth stage.", "Check soil moisture.", "Check whether plants are flowering and fruiting."],
    nutrientStressSigns: ["Pale leaves", "Slow growth", "Leafy growth with poor pod set"],
    safeUseNotes: ["Do not fertilize wilted plants.", "Keep fertilizer off leaves.", "Avoid guessing rates."],
    sustainabilityNotes: ["Mulch to steady moisture.", "Use compost before planting.", "Rotate crops."],
    soilTestTriggers: ["Repeated poor growth", "Unclear leaf symptoms", "Commercial fertilizer planning"],
    extensionOfficerTriggers: ["Fertilizer burn", "Many plants failing", "Need for local rates"]
  }
];

export function findFertilizerGuidance(cropName?: string | null) {
  if (!cropName) {
    return undefined;
  }

  return fertilizerSpecialistCrops.find((guidance) => guidance.crop.toLowerCase() === cropName.toLowerCase());
}

export function fertilizerOpeningForQuestion(question: string) {
  const normalized = question.toLowerCase();

  if (normalized.includes("compost") || normalized.includes("manure")) {
    return "Compost can help, but timing matters.";
  }

  if (normalized.includes("yellow") || normalized.includes("nutrient")) {
    return "Let's check whether this looks like a nutrient issue.";
  }

  return "Let's choose the right feeding step.";
}
