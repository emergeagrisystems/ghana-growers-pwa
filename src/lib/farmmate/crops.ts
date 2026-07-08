import { FarmMateCrop } from "./types";

export const farmMateCrops: FarmMateCrop[] = [
  {
    id: "maize",
    name: "Maize",
    suitableRegions: ["ashanti", "bono", "eastern", "northern", "upper-east", "upper-west"],
    plantingSeasons: ["Major season after steady rains", "Minor season where rainfall is reliable"],
    spacing: "About 75 cm between rows and 25-40 cm between plants, depending on variety and local practice.",
    soil: {
      type: "Well-drained loam or sandy loam with good organic matter.",
      ph: "5.5-7.0",
      preparation: ["Clear weeds early", "Prepare a fine seedbed", "Avoid waterlogged plots"]
    },
    water: {
      needs: "Moderate, with steady moisture during germination, tasseling and grain filling.",
      guidance: ["Plant into moist soil", "Avoid moisture stress during flowering", "Use mulch or residue where practical"]
    },
    growthStages: [
      { name: "Germination", timing: "0-7 days", keyCare: ["Protect seed from drying", "Check for gaps"] },
      { name: "Vegetative growth", timing: "2-6 weeks", keyCare: ["Weed early", "Scout for fall armyworm"] },
      { name: "Tasseling and grain fill", timing: "7-12 weeks", keyCare: ["Avoid water stress", "Watch for nutrient shortage"] }
    ],
    commonPests: ["fall-armyworm"],
    commonDiseases: [],
    nutrientDeficiencies: ["nitrogen-deficiency", "phosphorus-deficiency"],
    harvestIndicators: ["Husks turn dry", "Kernels harden", "Cobs bend downward on many plants"],
    sustainablePractices: ["crop-rotation"],
    notes: ["Use locally recommended varieties for the season and region."]
  },
  {
    id: "cassava",
    name: "Cassava",
    suitableRegions: ["ashanti", "bono", "central", "eastern", "volta", "western"],
    plantingSeasons: ["Start of rains", "Where moisture is reliable after land preparation"],
    spacing: "About 1 m by 1 m for many varieties, adjusted for soil fertility and variety.",
    soil: {
      type: "Loose, well-drained soil that allows root expansion.",
      ph: "5.5-7.5",
      preparation: ["Use healthy stem cuttings", "Avoid poorly drained heavy soil", "Plant on ridges where drainage is poor"]
    },
    water: {
      needs: "Moderate once established, but needs moisture for early rooting.",
      guidance: ["Plant when rains are steady", "Avoid prolonged waterlogging", "Control weeds during early growth"]
    },
    growthStages: [
      { name: "Establishment", timing: "0-8 weeks", keyCare: ["Use clean cuttings", "Replace failed stands"] },
      { name: "Canopy growth", timing: "2-5 months", keyCare: ["Weed early", "Check for mosaic symptoms"] },
      { name: "Root bulking", timing: "6-12 months", keyCare: ["Protect soil", "Harvest according to variety"] }
    ],
    commonPests: ["whitefly"],
    commonDiseases: ["cassava-mosaic"],
    nutrientDeficiencies: [],
    harvestIndicators: ["Variety reaches maturity window", "Lower leaves naturally drop", "Roots reach market size"],
    sustainablePractices: ["crop-rotation"],
    notes: ["Avoid using cuttings from diseased plants."]
  },
  {
    id: "yam",
    name: "Yam",
    suitableRegions: ["ashanti", "bono", "eastern", "northern", "upper-west"],
    plantingSeasons: ["Late dry season to early rains", "After mound preparation"],
    spacing: "About 1 m by 1 m on mounds, adjusted by variety and seed size.",
    soil: {
      type: "Deep, loose and fertile soil with good drainage.",
      preparation: ["Prepare mounds early", "Use healthy seed yam", "Avoid compacted soil"]
    },
    water: {
      needs: "Needs moisture after sprouting but does not tolerate waterlogging.",
      guidance: ["Plant before reliable rains where local practice supports it", "Maintain soil cover", "Support vines with stakes"]
    },
    growthStages: [
      { name: "Sprouting", timing: "0-8 weeks", keyCare: ["Protect mounds", "Replace missing stands where practical"] },
      { name: "Vine growth", timing: "2-5 months", keyCare: ["Stake vines", "Watch for leaf spots"] },
      { name: "Tuber bulking", timing: "5-9 months", keyCare: ["Avoid disturbing mounds", "Manage weeds carefully"] }
    ],
    commonPests: [],
    commonDiseases: ["yam-anthracnose"],
    nutrientDeficiencies: [],
    harvestIndicators: ["Vines yellow and dry", "Tubers reach variety maturity", "Skin is firm enough for handling"],
    sustainablePractices: ["mulching", "crop-rotation"]
  },
  {
    id: "plantain",
    name: "Plantain",
    suitableRegions: ["ashanti", "bono", "central", "eastern", "volta", "western"],
    plantingSeasons: ["Start of rainy season", "Irrigated or moist periods for establishment"],
    spacing: "About 3 m by 3 m, adjusted for variety and management system.",
    soil: {
      type: "Deep, fertile, well-drained soil rich in organic matter.",
      preparation: ["Use healthy suckers", "Add organic matter where available", "Avoid flood-prone areas"]
    },
    water: {
      needs: "Regular moisture, especially during establishment and bunch filling.",
      guidance: ["Mulch around plants", "Avoid standing water", "Protect young plants in dry spells"]
    },
    growthStages: [
      { name: "Establishment", timing: "0-3 months", keyCare: ["Mulch", "Remove weeds around mats"] },
      { name: "Vegetative growth", timing: "3-8 months", keyCare: ["Maintain soil moisture", "Desucker properly"] },
      { name: "Bunch development", timing: "9-14 months", keyCare: ["Support heavy bunches", "Protect from drought stress"] }
    ],
    commonPests: ["nematodes"],
    commonDiseases: [],
    nutrientDeficiencies: ["potassium-deficiency"],
    harvestIndicators: ["Fingers are well filled", "Angles on fruits become less sharp", "Market-preferred maturity is reached"],
    sustainablePractices: ["mulching"]
  },
  {
    id: "tomato",
    name: "Tomato",
    suitableRegions: ["ashanti", "eastern", "greater-accra", "northern", "volta"],
    plantingSeasons: ["Dry season with irrigation", "Minor season where disease pressure is manageable"],
    spacing: "About 60 cm by 45-60 cm, adjusted by variety and staking system.",
    soil: {
      type: "Well-drained fertile loam with good organic matter.",
      ph: "6.0-7.0",
      preparation: ["Raise healthy seedlings", "Improve drainage", "Avoid fields with recent tomato-family crops"]
    },
    water: {
      needs: "Consistent moisture without waterlogging.",
      guidance: ["Water at soil level", "Avoid wetting leaves", "Mulch to reduce moisture swings"]
    },
    growthStages: [
      { name: "Nursery", timing: "3-5 weeks", keyCare: ["Avoid overcrowding", "Prevent damping-off"] },
      { name: "Vegetative growth", timing: "2-5 weeks after transplanting", keyCare: ["Stake early", "Scout leaves"] },
      { name: "Flowering and fruiting", timing: "5-10 weeks after transplanting", keyCare: ["Keep water steady", "Remove diseased leaves"] }
    ],
    commonPests: ["whitefly", "fruit-borer", "nematodes"],
    commonDiseases: ["early-blight", "damping-off"],
    nutrientDeficiencies: ["nitrogen-deficiency", "potassium-deficiency"],
    harvestIndicators: ["Fruit reaches buyer-preferred color", "Fruit is firm", "Damaged fruit is sorted out"],
    sustainablePractices: ["mulching", "crop-rotation", "soil-level-watering"]
  },
  {
    id: "pepper",
    name: "Pepper",
    suitableRegions: ["ashanti", "eastern", "greater-accra", "northern", "volta"],
    plantingSeasons: ["Dry season with irrigation", "Rainy season with good drainage"],
    spacing: "About 45-60 cm between plants and 60-75 cm between rows.",
    soil: {
      type: "Fertile, well-drained loam.",
      ph: "6.0-7.0",
      preparation: ["Use strong seedlings", "Avoid waterlogged beds", "Rotate away from tomato-family crops"]
    },
    water: {
      needs: "Moderate and regular moisture.",
      guidance: ["Avoid irregular watering during flowering", "Water at soil level", "Mulch during dry spells"]
    },
    growthStages: [
      { name: "Nursery", timing: "4-6 weeks", keyCare: ["Use clean nursery media", "Avoid overwatering"] },
      { name: "Establishment", timing: "2-4 weeks after transplanting", keyCare: ["Replace weak plants", "Weed carefully"] },
      { name: "Flowering and harvest", timing: "6+ weeks after transplanting", keyCare: ["Harvest carefully", "Scout for fruit borer"] }
    ],
    commonPests: ["whitefly", "fruit-borer", "nematodes"],
    commonDiseases: ["early-blight", "damping-off"],
    nutrientDeficiencies: ["nitrogen-deficiency", "potassium-deficiency"],
    harvestIndicators: ["Fruit has required size or color", "Fruit is firm and glossy", "Harvest in cool hours"],
    sustainablePractices: ["mulching", "crop-rotation", "soil-level-watering"]
  },
  {
    id: "onion",
    name: "Onion",
    suitableRegions: ["greater-accra", "northern", "upper-east", "upper-west"],
    plantingSeasons: ["Cool dry season with irrigation", "Periods with lower disease pressure"],
    spacing: "About 10-15 cm between plants and 20-30 cm between rows.",
    soil: {
      type: "Loose, fertile, well-drained sandy loam.",
      ph: "6.0-7.0",
      preparation: ["Prepare fine beds", "Avoid compacted soil", "Use clean seedlings or sets"]
    },
    water: {
      needs: "Regular shallow moisture, reduced as bulbs mature.",
      guidance: ["Avoid water stress during bulb formation", "Reduce watering before harvest", "Avoid standing water"]
    },
    growthStages: [
      { name: "Seedling", timing: "0-6 weeks", keyCare: ["Keep beds moist", "Control weeds early"] },
      { name: "Bulb formation", timing: "6-12 weeks", keyCare: ["Maintain steady water", "Avoid heavy weed pressure"] },
      { name: "Maturity", timing: "12+ weeks", keyCare: ["Reduce water", "Cure bulbs properly"] }
    ],
    commonPests: [],
    commonDiseases: ["damping-off"],
    nutrientDeficiencies: ["phosphorus-deficiency"],
    harvestIndicators: ["Tops fall over", "Necks soften", "Bulbs reach market size"],
    sustainablePractices: ["crop-rotation", "soil-level-watering"]
  },
  {
    id: "okra",
    name: "Okra",
    suitableRegions: ["ashanti", "eastern", "greater-accra", "northern", "volta"],
    plantingSeasons: ["Start of rains", "Dry season with irrigation"],
    spacing: "About 60 cm by 45 cm, adjusted by variety.",
    soil: {
      type: "Well-drained fertile soil.",
      preparation: ["Prepare raised beds where drainage is poor", "Use clean seed", "Add organic matter where available"]
    },
    water: {
      needs: "Moderate moisture, especially during flowering and pod formation.",
      guidance: ["Water during dry spells", "Avoid waterlogging", "Mulch to conserve moisture"]
    },
    growthStages: [
      { name: "Establishment", timing: "0-3 weeks", keyCare: ["Thin weak plants", "Control weeds"] },
      { name: "Flowering", timing: "4-6 weeks", keyCare: ["Maintain moisture", "Scout for fruit borer"] },
      { name: "Harvest", timing: "6+ weeks", keyCare: ["Pick regularly", "Remove old pods"] }
    ],
    commonPests: ["fruit-borer", "nematodes"],
    commonDiseases: ["damping-off"],
    nutrientDeficiencies: ["nitrogen-deficiency"],
    harvestIndicators: ["Pods are tender", "Pods are market-preferred length", "Harvest every 1-2 days during peak production"],
    sustainablePractices: ["mulching", "crop-rotation", "soil-level-watering"]
  },
  {
    id: "cucumber",
    name: "Cucumber",
    suitableRegions: ["ashanti", "eastern", "greater-accra", "volta"],
    plantingSeasons: ["Dry season with irrigation", "Rainy season with strong drainage"],
    spacing: "About 90 cm between rows and 45-60 cm between plants, adjusted by trellising.",
    soil: {
      type: "Fertile, well-drained soil with organic matter.",
      preparation: ["Prepare raised beds", "Avoid waterlogging", "Use trellis where practical"]
    },
    water: {
      needs: "Regular moisture, especially during flowering and fruiting.",
      guidance: ["Keep moisture steady", "Water at soil level", "Avoid wetting leaves where possible"]
    },
    growthStages: [
      { name: "Vine establishment", timing: "0-3 weeks", keyCare: ["Protect seedlings", "Control weeds"] },
      { name: "Flowering", timing: "3-5 weeks", keyCare: ["Maintain water", "Support vines"] },
      { name: "Harvest", timing: "5+ weeks", keyCare: ["Pick frequently", "Avoid oversized fruits"] }
    ],
    commonPests: ["whitefly", "nematodes"],
    commonDiseases: ["damping-off"],
    nutrientDeficiencies: ["nitrogen-deficiency", "potassium-deficiency"],
    harvestIndicators: ["Fruit is firm", "Fruit reaches market size", "Skin is still tender and not yellowing"],
    sustainablePractices: ["mulching", "crop-rotation", "soil-level-watering"]
  },
  {
    id: "garden-eggs",
    name: "Garden eggs",
    suitableRegions: ["ashanti", "eastern", "greater-accra", "volta", "western"],
    plantingSeasons: ["Dry season with irrigation", "Rainy season with good drainage"],
    spacing: "About 60 cm by 60 cm, adjusted by variety.",
    soil: {
      type: "Well-drained fertile loam.",
      preparation: ["Raise healthy seedlings", "Rotate away from tomato-family crops", "Improve drainage"]
    },
    water: {
      needs: "Moderate and steady moisture.",
      guidance: ["Avoid wetting leaves", "Mulch in dry periods", "Avoid waterlogging"]
    },
    growthStages: [
      { name: "Nursery", timing: "4-6 weeks", keyCare: ["Avoid overcrowding", "Prevent damping-off"] },
      { name: "Vegetative growth", timing: "2-5 weeks after transplanting", keyCare: ["Weed carefully", "Scout leaves"] },
      { name: "Fruit harvest", timing: "6+ weeks after transplanting", keyCare: ["Harvest at market size", "Remove damaged fruits"] }
    ],
    commonPests: ["whitefly", "fruit-borer", "nematodes"],
    commonDiseases: ["early-blight", "damping-off"],
    nutrientDeficiencies: ["nitrogen-deficiency", "potassium-deficiency"],
    harvestIndicators: ["Fruit reaches preferred size", "Fruit is firm", "Skin is bright and marketable"],
    sustainablePractices: ["mulching", "crop-rotation", "soil-level-watering"]
  }
];

export function findFarmMateCrop(cropIdOrName: string) {
  const normalized = cropIdOrName.trim().toLowerCase();

  return farmMateCrops.find((crop) => crop.id === normalized || crop.name.toLowerCase() === normalized);
}
