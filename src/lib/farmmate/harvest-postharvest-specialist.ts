export type HarvestPostHarvestCropGuidance = {
  crop: string;
  harvestIndicators: string[];
  signsNotReady: string[];
  bestHarvestTimeOfDay: string[];
  handlingTips: string[];
  sortingAndGradingBasics: string[];
  shortTermStorageGuidance: string[];
  transportPreparation: string[];
  commonPostHarvestMistakes: string[];
  qualityProtectionTips: string[];
  whenToHarvestBeforeRain: string[];
  whenToDelayHarvest: string[];
  nextBestAction: string;
};

export type HarvestPostHarvestQuestionType =
  | "maize-harvest"
  | "tomato-readiness"
  | "cassava-storage"
  | "loss-reduction"
  | "harvest-before-rain"
  | "vegetable-transport"
  | "general-harvest";

export const harvestPostHarvestReasoningOrder = [
  "crop",
  "growth-or-maturity-signs",
  "weather-or-rain-risk",
  "storage-or-transport-plan",
  "quality-risk",
  "recommendation",
  "next-best-action"
] as const;

export const harvestPostHarvestCrops: HarvestPostHarvestCropGuidance[] = [
  {
    crop: "Maize",
    harvestIndicators: ["Husks are dry.", "Grains are hard.", "Cobs bend downward on many plants."],
    signsNotReady: ["Cobs are still green.", "Grains are soft or milky.", "Husks are still fresh."],
    bestHarvestTimeOfDay: ["Harvest after dew has dried.", "Avoid harvesting when cobs are wet."],
    handlingTips: ["Keep harvested maize off bare ground.", "Dry on a clean raised surface.", "Protect cobs from rain."],
    sortingAndGradingBasics: ["Separate mouldy cobs.", "Remove insect-damaged cobs.", "Keep dry clean cobs together."],
    shortTermStorageGuidance: ["Store only dry maize.", "Keep bags or cobs ventilated.", "Keep maize away from damp floors."],
    transportPreparation: ["Bag dry maize cleanly.", "Keep bags covered during transport.", "Avoid mixing wet and dry maize."],
    commonPostHarvestMistakes: ["Bagging maize while damp.", "Mixing mouldy cobs with clean cobs.", "Drying directly on bare ground."],
    qualityProtectionTips: ["Dry properly before storage.", "Sort damaged cobs early.", "Keep maize covered if rain threatens."],
    whenToHarvestBeforeRain: ["Harvest mature dry cobs first if heavy rain may wet them."],
    whenToDelayHarvest: ["Delay if maize is still green.", "Delay if you cannot keep harvested maize dry."],
    nextBestAction: "Check maize grain hardness and husk dryness before harvesting."
  },
  {
    crop: "Tomato",
    harvestIndicators: ["Fruit has buyer-preferred colour.", "Fruit is firm enough for handling.", "Fruit separates cleanly without pulling hard."],
    signsNotReady: ["Fruit is very small.", "Fruit is hard and fully green when ripe colour is needed.", "Fruit has not reached buyer-preferred stage."],
    bestHarvestTimeOfDay: ["Harvest in the cool morning.", "Avoid hot midday harvesting where possible."],
    handlingTips: ["Handle gently.", "Keep tomatoes shaded.", "Avoid deep overfilled containers."],
    sortingAndGradingBasics: ["Separate cracked or rotten fruit.", "Keep firm-ripe fruit apart from fully ripe fruit.", "Remove badly damaged tomatoes."],
    shortTermStorageGuidance: ["Keep tomatoes cool, shaded and ventilated.", "Do not leave harvested tomatoes in hot sun."],
    transportPreparation: ["Use clean crates where possible.", "Pack firm-ripe tomatoes for longer trips.", "Avoid pressing heavy loads onto ripe fruit."],
    commonPostHarvestMistakes: ["Leaving tomatoes in hot sun.", "Packing wet tomatoes tightly.", "Mixing rotten tomatoes with good fruit."],
    qualityProtectionTips: ["Sort before packing.", "Use shade.", "Avoid rough handling."],
    whenToHarvestBeforeRain: ["Harvest market-ready tomatoes before heavy rain if cracking or spoilage risk is high."],
    whenToDelayHarvest: ["Delay if fruit is too immature for the buyer.", "Delay if fruit is wet and can safely dry first."],
    nextBestAction: "Sort tomatoes by ripeness and damage before packing."
  },
  {
    crop: "Pepper",
    harvestIndicators: ["Fruit has reached market size.", "Fruit colour matches buyer preference.", "Fruit is firm and glossy."],
    signsNotReady: ["Fruit is too small.", "Fruit is soft or shrivelled.", "Fruit colour is not at the needed stage."],
    bestHarvestTimeOfDay: ["Harvest in cool hours.", "Avoid harvesting wet fruit if storage or transport is planned."],
    handlingTips: ["Use clean containers.", "Keep peppers shaded.", "Avoid crushing fruit under heavy loads."],
    sortingAndGradingBasics: ["Separate rotten, soft or pest-damaged peppers.", "Group by size and colour where useful."],
    shortTermStorageGuidance: ["Keep peppers shaded and ventilated.", "Avoid sealed hot bags."],
    transportPreparation: ["Pack in clean ventilated containers.", "Keep wet peppers separate if they cannot dry first."],
    commonPostHarvestMistakes: ["Mixing rotten peppers with sound peppers.", "Leaving fruit in sun.", "Packing wet peppers tightly."],
    qualityProtectionTips: ["Harvest gently.", "Sort before transport.", "Keep air moving around packed fruit."],
    whenToHarvestBeforeRain: ["Harvest mature peppers before rain if wet fruit may spoil during transport."],
    whenToDelayHarvest: ["Delay if fruit is too small.", "Delay if there is no shaded place to hold the harvest."],
    nextBestAction: "Pick mature peppers and remove soft or rotten fruit before packing."
  },
  {
    crop: "Cassava",
    harvestIndicators: ["Roots have reached variety maturity.", "Lower leaves naturally drop.", "Roots meet market size."],
    signsNotReady: ["Plants are still young.", "Roots are small.", "Market size has not been reached."],
    bestHarvestTimeOfDay: ["Harvest when roots can be moved quickly into shade.", "Avoid leaving roots exposed in hot sun."],
    handlingTips: ["Lift roots carefully.", "Avoid deep cuts and bruises.", "Keep harvested roots shaded."],
    sortingAndGradingBasics: ["Separate cut, rotten or badly bruised roots.", "Keep clean firm roots together."],
    shortTermStorageGuidance: ["Use or sell cassava soon after harvest.", "Keep roots shaded and cool for short holding."],
    transportPreparation: ["Pack roots to reduce bruising.", "Keep damaged roots separate.", "Avoid leaving sacks in direct sun."],
    commonPostHarvestMistakes: ["Leaving harvested roots in hot sun.", "Mixing rotten roots with healthy roots.", "Harvesting more than can be sold or used soon."],
    qualityProtectionTips: ["Harvest close to sale or use.", "Separate damaged roots.", "Keep roots shaded."],
    whenToHarvestBeforeRain: ["Harvest mature roots before heavy rain if the field may become hard to access."],
    whenToDelayHarvest: ["Delay if the crop is immature.", "Delay if there is no plan to use, process or sell roots soon."],
    nextBestAction: "Harvest only what you can use, process or move soon."
  },
  {
    crop: "Yam",
    harvestIndicators: ["Vines yellow and dry.", "Tubers have reached variety maturity.", "Skin is firm enough for handling."],
    signsNotReady: ["Vines are still strongly green.", "Tubers are small.", "Skin is easily damaged."],
    bestHarvestTimeOfDay: ["Harvest when tubers can be handled gently and moved to shade.", "Avoid leaving exposed tubers in sun."],
    handlingTips: ["Dig carefully to avoid cuts.", "Keep tubers dry and shaded.", "Do not throw tubers."],
    sortingAndGradingBasics: ["Separate cut, rotten or bruised tubers.", "Keep marketable tubers clean and dry."],
    shortTermStorageGuidance: ["Store in a cool, dry, ventilated place.", "Keep damaged tubers separate."],
    transportPreparation: ["Cushion tubers where possible.", "Avoid piling heavy loads that bruise tubers."],
    commonPostHarvestMistakes: ["Cutting tubers during digging.", "Mixing rotten tubers with sound tubers.", "Storing in damp places."],
    qualityProtectionTips: ["Handle gently.", "Keep ventilation.", "Inspect stored tubers."],
    whenToHarvestBeforeRain: ["Harvest mature yam before prolonged rain if soil access or tuber quality may suffer."],
    whenToDelayHarvest: ["Delay if vines are still green and tubers are immature.", "Delay if tubers cannot be stored dry."],
    nextBestAction: "Check vine drying and dig carefully to avoid tuber cuts."
  },
  {
    crop: "Plantain",
    harvestIndicators: ["Fingers are well filled.", "Fruit angles become less sharp.", "Bunch has reached buyer-preferred maturity."],
    signsNotReady: ["Fingers are thin.", "Fruit angles are still very sharp.", "Bunch has not filled well."],
    bestHarvestTimeOfDay: ["Harvest in cool hours.", "Move bunches to shade quickly."],
    handlingTips: ["Cut carefully.", "Avoid dropping bunches.", "Keep harvested bunches off dirty ground."],
    sortingAndGradingBasics: ["Separate bruised or split fingers.", "Group by maturity and bunch quality."],
    shortTermStorageGuidance: ["Keep in shade with airflow.", "Avoid stacking in hot enclosed places."],
    transportPreparation: ["Pad loads to reduce bruising.", "Keep bunches stable during transport."],
    commonPostHarvestMistakes: ["Dropping bunches.", "Leaving plantain in hot sun.", "Mixing badly damaged fingers with good produce."],
    qualityProtectionTips: ["Handle gently.", "Avoid bruises.", "Keep produce shaded."],
    whenToHarvestBeforeRain: ["Harvest mature bunches before heavy rain if access or bruising risk may worsen."],
    whenToDelayHarvest: ["Delay if fingers are not filled.", "Delay if there is no shaded place to hold the bunches."],
    nextBestAction: "Check finger fullness before cutting plantain."
  },
  {
    crop: "Onion",
    harvestIndicators: ["Tops fall over.", "Necks soften.", "Bulbs reach market size."],
    signsNotReady: ["Tops are still upright and green.", "Bulbs are small.", "Necks are still thick."],
    bestHarvestTimeOfDay: ["Harvest when conditions are dry.", "Avoid harvesting into rain where curing is needed."],
    handlingTips: ["Lift bulbs gently.", "Avoid bruising.", "Keep bulbs dry."],
    sortingAndGradingBasics: ["Separate soft, rotten or damaged bulbs.", "Group dry sound bulbs together."],
    shortTermStorageGuidance: ["Cure and store onions in a dry ventilated place.", "Keep wet bulbs separate."],
    transportPreparation: ["Use ventilated bags or crates.", "Avoid packing wet onions tightly."],
    commonPostHarvestMistakes: ["Harvesting too early.", "Packing wet onions tightly.", "Mixing rotten bulbs with healthy bulbs."],
    qualityProtectionTips: ["Dry properly.", "Keep air moving.", "Remove soft bulbs early."],
    whenToHarvestBeforeRain: ["Harvest mature onions before heavy rain if bulbs are ready and can be dried safely."],
    whenToDelayHarvest: ["Delay if bulbs are immature.", "Delay if rain would prevent drying and safe holding."],
    nextBestAction: "Check neck softness and keep harvested onions dry."
  },
  {
    crop: "Okra",
    harvestIndicators: ["Pods are tender.", "Pods reach market-preferred length.", "Pods snap cleanly."],
    signsNotReady: ["Pods are too small.", "Pods are still soft and underdeveloped.", "Market length is not reached."],
    bestHarvestTimeOfDay: ["Harvest in cool hours.", "Harvest often during peak production."],
    handlingTips: ["Pick gently.", "Keep pods shaded.", "Avoid rough sacks that bruise pods."],
    sortingAndGradingBasics: ["Separate tough, damaged or pest-hit pods.", "Group tender marketable pods."],
    shortTermStorageGuidance: ["Keep okra cool and shaded.", "Avoid sealing wet okra tightly."],
    transportPreparation: ["Use clean ventilated containers.", "Pack lightly to avoid bruising."],
    commonPostHarvestMistakes: ["Leaving pods too long on the plant.", "Leaving harvested pods in sun.", "Mixing tough pods with tender pods."],
    qualityProtectionTips: ["Harvest regularly.", "Sort quickly.", "Keep pods shaded and ventilated."],
    whenToHarvestBeforeRain: ["Harvest tender marketable pods before rain if wet conditions may reduce quality."],
    whenToDelayHarvest: ["Delay only if pods are too small.", "Do not delay tender pods until they become tough."],
    nextBestAction: "Pick tender okra pods and keep them shaded."
  },
  {
    crop: "Cucumber",
    harvestIndicators: ["Fruit reaches market size.", "Skin is still tender.", "Fruit is firm and not yellowing."],
    signsNotReady: ["Fruit is too small.", "Fruit is soft.", "Fruit is misshapen or not marketable yet."],
    bestHarvestTimeOfDay: ["Harvest in cool morning.", "Avoid hot sun after harvest."],
    handlingTips: ["Cut or pick gently.", "Keep cucumbers shaded.", "Avoid piling heavy loads."],
    sortingAndGradingBasics: ["Separate yellow, soft or damaged cucumbers.", "Group by size and quality."],
    shortTermStorageGuidance: ["Keep cool, shaded and ventilated.", "Do not leave fruit in hot sun."],
    transportPreparation: ["Use clean crates.", "Avoid crushing fruit.", "Cover from sun during transport."],
    commonPostHarvestMistakes: ["Harvesting overmature yellow fruit.", "Leaving cucumbers in heat.", "Packing wet fruit tightly."],
    qualityProtectionTips: ["Harvest at market size.", "Sort damaged fruit.", "Keep containers clean."],
    whenToHarvestBeforeRain: ["Harvest market-ready cucumbers before heavy rain if fruit quality may decline."],
    whenToDelayHarvest: ["Delay if fruit is undersized.", "Delay if fruit is wet and can safely dry first."],
    nextBestAction: "Harvest firm market-size cucumbers and keep them cool."
  },
  {
    crop: "Garden eggs",
    harvestIndicators: ["Fruit reaches preferred size.", "Fruit is firm.", "Skin is bright and marketable."],
    signsNotReady: ["Fruit is too small.", "Fruit is dull or damaged.", "Fruit has not reached buyer-preferred size."],
    bestHarvestTimeOfDay: ["Harvest in cool hours.", "Move fruit to shade quickly."],
    handlingTips: ["Handle gently.", "Use clean containers.", "Do not overfill containers."],
    sortingAndGradingBasics: ["Separate bruised, rotten or pest-damaged fruit.", "Group by size and quality."],
    shortTermStorageGuidance: ["Keep shaded and ventilated.", "Avoid hot enclosed storage."],
    transportPreparation: ["Use clean crates where possible.", "Avoid crushing fruit during transport."],
    commonPostHarvestMistakes: ["Leaving fruit in sun.", "Mixing rotten fruit with good fruit.", "Rough handling."],
    qualityProtectionTips: ["Sort early.", "Keep fruit shaded.", "Avoid bruising."],
    whenToHarvestBeforeRain: ["Harvest market-ready fruit before heavy rain if wet fruit may spoil faster."],
    whenToDelayHarvest: ["Delay if fruit is too small.", "Delay if there is no clean shaded holding place."],
    nextBestAction: "Sort garden eggs by size and remove damaged fruit before transport."
  }
];

export function findHarvestPostHarvestGuidance(cropName?: string | null) {
  if (!cropName) {
    return undefined;
  }

  return harvestPostHarvestCrops.find((guidance) => guidance.crop.toLowerCase() === cropName.toLowerCase());
}

export function harvestPostHarvestQuestionType(question: string): HarvestPostHarvestQuestionType {
  const normalized = question.toLowerCase();

  if (normalized.includes("maize") && normalized.includes("harvest")) {
    return "maize-harvest";
  }

  if ((normalized.includes("tomato") || normalized.includes("tomatoes")) && (normalized.includes("ready") || normalized.includes("ripe") || normalized.includes("mature"))) {
    return "tomato-readiness";
  }

  if (normalized.includes("cassava") && (normalized.includes("store") || normalized.includes("storage") || normalized.includes("keep fresh"))) {
    return "cassava-storage";
  }

  if (normalized.includes("pack") || normalized.includes("transport")) {
    return "vegetable-transport";
  }

  if (normalized.includes("before rain") || normalized.includes("rain")) {
    return "harvest-before-rain";
  }

  if (normalized.includes("loss") || normalized.includes("dry produce") || normalized.includes("drying") || normalized.includes("post harvest") || normalized.includes("post-harvest") || normalized.includes("spoil") || normalized.includes("rotten") || normalized.includes("mould")) {
    return "loss-reduction";
  }

  return "general-harvest";
}

export function harvestPostHarvestOpeningForQuestion(question: string) {
  const type = harvestPostHarvestQuestionType(question);

  if (type === "maize-harvest") {
    return "Maize harvest timing depends on cob, husk and grain maturity.";
  }

  if (type === "tomato-readiness") {
    return "Tomato readiness depends on buyer preference, colour, firmness and transport distance.";
  }

  if (type === "cassava-storage") {
    return "Cassava quality drops quickly after harvest, so timing and shade matter.";
  }

  if (type === "vegetable-transport") {
    return "Packing should protect produce from heat, bruising and tight wet loads.";
  }

  if (type === "harvest-before-rain") {
    return "Harvest before rain only when the crop is mature and you can keep produce dry.";
  }

  return "Post-harvest decisions should protect quality, reduce waste and keep buyer trust.";
}
