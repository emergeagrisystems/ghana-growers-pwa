export type FarmMateCropSupport =
  | "crop_doctor"
  | "planting"
  | "plant_health"
  | "fertilizer"
  | "harvest"
  | "general_agronomy";

export type FarmMateCropGroup = "core_food" | "vegetable" | "cash_perennial" | "fruit" | "unknown_other";

export type FarmMateCropGuidanceLevel = "crop_specific" | "crop_family" | "general";

export type FarmMateCropLibraryEntry = {
  cropKey: string;
  displayName: string;
  aliases: string[];
  cropGroup: FarmMateCropGroup;
  cropFamily?: string;
  supportedFor: FarmMateCropSupport[];
  commonSymptoms: string[];
  commonPestDiseasePatterns: string[];
  diagnosticCautions: string[];
  ghanaRelevanceNote?: string;
  guidanceLevel: FarmMateCropGuidanceLevel;
};

export const farmMateCropGroupLabels: Record<FarmMateCropGroup, string> = {
  core_food: "Core food crop",
  vegetable: "Vegetable",
  cash_perennial: "Cash crop / perennial",
  fruit: "Fruit crop",
  unknown_other: "Not sure / other"
};

export const farmMateCropSelectorGroupLabels: Record<FarmMateCropGroup, string> = {
  core_food: "Common food crops",
  vegetable: "Vegetables",
  fruit: "Fruits",
  cash_perennial: "Cash crops",
  unknown_other: "Not sure / other"
};

const cropSelectorGroupOrder: FarmMateCropGroup[] = [
  "core_food",
  "vegetable",
  "fruit",
  "cash_perennial",
  "unknown_other"
];

const allCropSupport: FarmMateCropSupport[] = [
  "crop_doctor",
  "planting",
  "plant_health",
  "fertilizer",
  "harvest",
  "general_agronomy"
];

const diagnosticSupport: FarmMateCropSupport[] = ["crop_doctor", "plant_health", "general_agronomy"];

const symptomSets = {
  general: ["Yellowing", "Leaf spots", "Wilting", "Holes in leaves", "Poor growth", "Stem or base problems"],
  nightshade: [
    "Yellow leaves",
    "Leaf curling",
    "Spots on leaves",
    "Wilting",
    "Fruit rot",
    "Holes in leaves",
    "Flower drop",
    "Stunted growth"
  ],
  cucurbit: ["Yellow leaf spots", "Powdery white patches", "Wilting vines", "Leaf holes", "Fruit deformation", "Poor fruit set"],
  leafy: ["Holes in leaves", "Yellowing", "Leaf spots", "Wilting", "Caterpillar damage", "Aphids"],
  rootTuber: ["Yellowing", "Wilting", "Leaf distortion", "Stem or base rot", "Poor growth", "Tuber or root damage"],
  perennial: ["Leaf spots", "Dieback", "Stem or canker signs", "Pod or fruit problems", "Yellowing", "Pest damage", "Abnormal leaf flush"],
  fruit: ["Leaf spots", "Yellowing", "Wilting", "Fruit problems", "Dieback", "Pest damage"]
} as const;

const patternSets = {
  general: [
    "Compare affected leaves with healthy plants nearby.",
    "Check whether signs are spreading after rain, irrigation, or field stress.",
    "Look for insects, webbing, powder, rot, wounds, or damage on both sides of leaves."
  ],
  nightshade: [
    "Leaf spots, curling, and yellowing can have pest, disease, nutrient, or water causes.",
    "Check young leaves, leaf undersides, stems, flowers, and fruit before narrowing the cause.",
    "Related nightshade crops can show similar-looking symptoms, but the exact cause may differ."
  ],
  cucurbit: [
    "Check vines and leaf undersides for insects, powdery growth, and spreading spots.",
    "Wilting can come from root-zone moisture, stem damage, or a spreading crop-health problem.",
    "Poor fruit set or deformed fruit needs flower, pollination, water, and pest checks."
  ],
  leafy: [
    "Holes and ragged edges often need a close check for caterpillars or other chewing pests.",
    "Yellowing and spots need checks for drainage, leaf wetness, insects, and spread across the bed.",
    "Inspect the growing point and both sides of several leaves before taking action."
  ],
  rootTuber: [
    "Leaf symptoms may not confirm what is happening below the soil.",
    "Check the stem base, drainage, roots, or a small sample of tubers where safe to do so.",
    "Do not force a root or tuber diagnosis from leaf appearance alone."
  ],
  perennial: [
    "Check young and older leaves, shoots, stems, pods or fruit, and nearby plants.",
    "Dieback, canker-like signs, or spreading damage need an experienced field check.",
    "Do not name a crop-specific disease unless the visible evidence and local guidance support it."
  ],
  fruit: [
    "Check leaves, new shoots, stems, flowers, and fruit for the same pattern.",
    "Compare several affected plants or branches with healthy growth nearby.",
    "Fruit and leaf symptoms may have different causes, so avoid deciding from one sign alone."
  ]
} as const;

const cautionSets = {
  general: [
    "A photo can show visible signs but cannot guarantee the exact cause.",
    "Avoid pesticide or fertilizer dosage advice without a confirmed problem and local label or extension guidance."
  ],
  family: [
    "Use related-crop patterns only as a cautious starting point, not as a confirmed diagnosis.",
    "Ask for a clearer photo or extension support when signs are serious, spreading, or unclear."
  ],
  perennial: [
    "For valuable perennial crops, confirm serious or spreading problems with an extension officer or experienced crop advisor.",
    "Do not recommend strong chemicals or exact treatment dosage from a photo alone."
  ]
} as const;

type CropSeed = Pick<
  FarmMateCropLibraryEntry,
  "cropKey" | "displayName" | "aliases" | "cropGroup" | "cropFamily" | "ghanaRelevanceNote" | "guidanceLevel"
> & {
  supportedFor?: FarmMateCropSupport[];
  symptomSet?: keyof typeof symptomSets;
  patternSet?: keyof typeof patternSets;
  extraCautions?: string[];
};

function crop(seed: CropSeed): FarmMateCropLibraryEntry {
  const symptomSet = seed.symptomSet ?? "general";
  const patternSet = seed.patternSet ?? "general";
  const diagnosticCautions = [
    ...cautionSets.general,
    ...(seed.guidanceLevel === "crop_specific" ? [] : cautionSets.family),
    ...(seed.cropGroup === "cash_perennial" ? cautionSets.perennial : []),
    ...(seed.extraCautions ?? [])
  ];

  return {
    cropKey: seed.cropKey,
    displayName: seed.displayName,
    aliases: Array.from(new Set([seed.displayName, seed.cropKey, ...seed.aliases])),
    cropGroup: seed.cropGroup,
    cropFamily: seed.cropFamily,
    supportedFor: seed.supportedFor ?? allCropSupport,
    commonSymptoms: [...symptomSets[symptomSet]],
    commonPestDiseasePatterns: [...patternSets[patternSet]],
    diagnosticCautions,
    ghanaRelevanceNote: seed.ghanaRelevanceNote,
    guidanceLevel: seed.guidanceLevel
  };
}

export const farmMateCropLibrary: FarmMateCropLibraryEntry[] = [
  crop({ cropKey: "maize", displayName: "Maize", aliases: ["corn"], cropGroup: "core_food", cropFamily: "Cereal", guidanceLevel: "crop_specific" }),
  crop({ cropKey: "cassava", displayName: "Cassava", aliases: [], cropGroup: "core_food", cropFamily: "Root / tuber", symptomSet: "rootTuber", patternSet: "rootTuber", guidanceLevel: "crop_specific" }),
  crop({ cropKey: "yam", displayName: "Yam", aliases: ["yams"], cropGroup: "core_food", cropFamily: "Root / tuber", symptomSet: "rootTuber", patternSet: "rootTuber", guidanceLevel: "crop_specific" }),
  crop({ cropKey: "plantain", displayName: "Plantain", aliases: ["plantains"], cropGroup: "core_food", cropFamily: "Banana family / Musaceae", guidanceLevel: "crop_specific" }),
  crop({ cropKey: "rice", displayName: "Rice", aliases: ["paddy rice", "paddy"], cropGroup: "core_food", cropFamily: "Cereal", guidanceLevel: "crop_family" }),
  crop({ cropKey: "cowpea", displayName: "Cowpea", aliases: ["cowpeas", "black eyed pea", "black-eyed pea"], cropGroup: "core_food", cropFamily: "Legume", guidanceLevel: "crop_family" }),
  crop({ cropKey: "groundnut", displayName: "Groundnut", aliases: ["groundnuts", "peanut", "peanuts"], cropGroup: "core_food", cropFamily: "Legume", guidanceLevel: "crop_family" }),
  crop({ cropKey: "cocoyam", displayName: "Cocoyam", aliases: ["taro", "cocoyam root"], cropGroup: "core_food", cropFamily: "Root / tuber", symptomSet: "rootTuber", patternSet: "rootTuber", guidanceLevel: "crop_family" }),

  crop({ cropKey: "tomato", displayName: "Tomato", aliases: ["tomatoes"], cropGroup: "vegetable", cropFamily: "Nightshade / Solanaceae", symptomSet: "nightshade", patternSet: "nightshade", guidanceLevel: "crop_specific" }),
  crop({ cropKey: "pepper", displayName: "Pepper", aliases: ["peppers", "chilli", "chili", "capsicum"], cropGroup: "vegetable", cropFamily: "Nightshade / Solanaceae", symptomSet: "nightshade", patternSet: "nightshade", guidanceLevel: "crop_specific" }),
  crop({ cropKey: "onion", displayName: "Onion", aliases: ["onions"], cropGroup: "vegetable", cropFamily: "Allium", guidanceLevel: "crop_specific" }),
  crop({ cropKey: "okra", displayName: "Okra", aliases: [], cropGroup: "vegetable", cropFamily: "Mallow / Malvaceae", guidanceLevel: "crop_specific" }),
  crop({ cropKey: "garden-eggs", displayName: "Garden eggs", aliases: ["garden egg", "garden-eggs", "african eggplant"], cropGroup: "vegetable", cropFamily: "Nightshade / Solanaceae", symptomSet: "nightshade", patternSet: "nightshade", guidanceLevel: "crop_specific", ghanaRelevanceNote: "Garden eggs are a widely grown and traded Ghanaian vegetable." }),
  crop({ cropKey: "aubergine", displayName: "Aubergine / eggplant", aliases: ["aubergine", "eggplant", "egg plant", "brinjal", "garden egg", "garden eggs"], cropGroup: "vegetable", cropFamily: "Nightshade / Solanaceae", symptomSet: "nightshade", patternSet: "nightshade", guidanceLevel: "crop_family", ghanaRelevanceNote: "Aubergine types may be grown in open fields or protected production in Ghana." }),
  crop({ cropKey: "potato", displayName: "Potato", aliases: ["potatoes", "irish potato", "irish potatoes", "white potato", "white potatoes"], cropGroup: "vegetable", cropFamily: "Nightshade / Solanaceae; root / tuber", symptomSet: "rootTuber", patternSet: "rootTuber", guidanceLevel: "crop_family" }),
  crop({ cropKey: "sweet-potato", displayName: "Sweet potato", aliases: ["sweet potatoes", "sweetpotato", "sweetpotatoes"], cropGroup: "vegetable", cropFamily: "Root / tuber", symptomSet: "rootTuber", patternSet: "rootTuber", guidanceLevel: "crop_family" }),
  crop({ cropKey: "cucumber", displayName: "Cucumber", aliases: ["cucumbers"], cropGroup: "vegetable", cropFamily: "Cucurbit", symptomSet: "cucurbit", patternSet: "cucurbit", guidanceLevel: "crop_specific" }),
  crop({ cropKey: "watermelon", displayName: "Watermelon", aliases: ["watermelons", "water melon", "water melons", "water-melon", "Watermelon / melon"], cropGroup: "vegetable", cropFamily: "Cucurbit", symptomSet: "cucurbit", patternSet: "cucurbit", guidanceLevel: "crop_specific" }),
  crop({ cropKey: "sweet-melon", displayName: "Sweet melon", aliases: ["sweet melons", "melon", "melons", "cantaloupe", "honeydew", "honeydew melon"], cropGroup: "vegetable", cropFamily: "Cucurbit", symptomSet: "cucurbit", patternSet: "cucurbit", guidanceLevel: "crop_family", ghanaRelevanceNote: "Sweet melon may be grown as an irrigated, greenhouse, or commercial field crop." }),
  crop({ cropKey: "zucchini", displayName: "Zucchini", aliases: ["zucchinis", "courgette", "courgettes", "squash"], cropGroup: "vegetable", cropFamily: "Cucurbit", symptomSet: "cucurbit", patternSet: "cucurbit", guidanceLevel: "crop_family", ghanaRelevanceNote: "Zucchini is an emerging commercial and protected-cropping vegetable in Ghana." }),
  crop({ cropKey: "pumpkin", displayName: "Pumpkin", aliases: ["pumpkins"], cropGroup: "vegetable", cropFamily: "Cucurbit", symptomSet: "cucurbit", patternSet: "cucurbit", guidanceLevel: "crop_family" }),
  crop({ cropKey: "lettuce", displayName: "Lettuce", aliases: [], cropGroup: "vegetable", cropFamily: "Leafy vegetable", symptomSet: "leafy", patternSet: "leafy", guidanceLevel: "crop_family", ghanaRelevanceNote: "Lettuce is commonly grown for urban markets and may be produced under irrigation or protection." }),
  crop({ cropKey: "cabbage", displayName: "Cabbage", aliases: ["cabbages"], cropGroup: "vegetable", cropFamily: "Brassica", symptomSet: "leafy", patternSet: "leafy", guidanceLevel: "crop_family" }),
  crop({ cropKey: "kale", displayName: "Kale", aliases: [], cropGroup: "vegetable", cropFamily: "Brassica", symptomSet: "leafy", patternSet: "leafy", guidanceLevel: "crop_family" }),
  crop({ cropKey: "carrot", displayName: "Carrot", aliases: ["carrots"], cropGroup: "vegetable", cropFamily: "Root / tuber", symptomSet: "rootTuber", patternSet: "rootTuber", guidanceLevel: "crop_family" }),
  crop({ cropKey: "beetroot", displayName: "Beetroot", aliases: ["beet", "beets", "beetroots"], cropGroup: "vegetable", cropFamily: "Root / tuber", symptomSet: "rootTuber", patternSet: "rootTuber", guidanceLevel: "crop_family" }),
  crop({ cropKey: "kontomire", displayName: "Kontomire", aliases: ["cocoyam leaves", "cocoyam leaf", "taro leaves", "taro leaf"], cropGroup: "vegetable", cropFamily: "Leafy vegetable / cocoyam", symptomSet: "leafy", patternSet: "leafy", guidanceLevel: "crop_family", ghanaRelevanceNote: "Kontomire is the local name commonly used for cocoyam leaves in Ghana." }),
  crop({ cropKey: "amaranth", displayName: "Amaranth", aliases: ["amaranthus", "aleefu"], cropGroup: "vegetable", cropFamily: "Leafy vegetable", symptomSet: "leafy", patternSet: "leafy", guidanceLevel: "crop_family" }),

  crop({ cropKey: "cocoa", displayName: "Cocoa", aliases: ["cacao"], cropGroup: "cash_perennial", cropFamily: "Perennial cash crop", symptomSet: "perennial", patternSet: "perennial", guidanceLevel: "crop_family", ghanaRelevanceNote: "Cocoa is a high-value perennial crop central to Ghanaian farming and export livelihoods." }),
  crop({ cropKey: "cashew", displayName: "Cashew", aliases: ["cashews", "cashew tree", "cashew trees"], cropGroup: "cash_perennial", cropFamily: "Perennial cash crop", symptomSet: "perennial", patternSet: "perennial", guidanceLevel: "crop_family", ghanaRelevanceNote: "Cashew is an important commercial perennial crop in Ghana's transition and savannah zones." }),
  crop({ cropKey: "oil-palm", displayName: "Oil palm", aliases: ["oil palms", "oilpalm", "palm oil tree"], cropGroup: "cash_perennial", cropFamily: "Perennial cash crop / palm", symptomSet: "perennial", patternSet: "perennial", guidanceLevel: "crop_family", ghanaRelevanceNote: "Oil palm is an important perennial food and cash crop in southern Ghana." }),
  crop({ cropKey: "coconut", displayName: "Coconut", aliases: ["coconuts", "coconut palm", "coconut palms"], cropGroup: "cash_perennial", cropFamily: "Perennial cash crop / palm", symptomSet: "perennial", patternSet: "perennial", guidanceLevel: "crop_family" }),
  crop({ cropKey: "rubber", displayName: "Rubber", aliases: ["rubber tree", "rubber trees"], cropGroup: "cash_perennial", cropFamily: "Perennial cash crop", symptomSet: "perennial", patternSet: "perennial", guidanceLevel: "crop_family", ghanaRelevanceNote: "Rubber is a long-term commercial crop, especially in Ghana's humid forest zones." }),
  crop({ cropKey: "coffee", displayName: "Coffee", aliases: ["coffee tree", "coffee trees"], cropGroup: "cash_perennial", cropFamily: "Perennial cash crop", symptomSet: "perennial", patternSet: "perennial", guidanceLevel: "crop_family" }),

  crop({ cropKey: "mango", displayName: "Mango", aliases: ["mangoes", "mangos", "mango tree"], cropGroup: "fruit", cropFamily: "Tree fruit", symptomSet: "fruit", patternSet: "fruit", guidanceLevel: "crop_family" }),
  crop({ cropKey: "citrus", displayName: "Citrus", aliases: ["orange", "oranges", "lemon", "lemons", "lime", "limes", "tangerine", "tangerines", "mandarin", "mandarins"], cropGroup: "fruit", cropFamily: "Citrus fruit", symptomSet: "fruit", patternSet: "fruit", guidanceLevel: "crop_family" }),
  crop({ cropKey: "pineapple", displayName: "Pineapple", aliases: ["pineapples"], cropGroup: "fruit", cropFamily: "Bromeliad fruit", symptomSet: "fruit", patternSet: "fruit", guidanceLevel: "crop_family", ghanaRelevanceNote: "Pineapple is an important Ghanaian commercial and export fruit crop." }),
  crop({ cropKey: "pawpaw", displayName: "Pawpaw", aliases: ["pawpaws", "papaya", "papayas"], cropGroup: "fruit", cropFamily: "Tropical fruit", symptomSet: "fruit", patternSet: "fruit", guidanceLevel: "crop_family" }),
  crop({ cropKey: "banana", displayName: "Banana", aliases: ["bananas"], cropGroup: "fruit", cropFamily: "Banana family / Musaceae", symptomSet: "fruit", patternSet: "fruit", guidanceLevel: "crop_family" }),
  crop({ cropKey: "avocado", displayName: "Avocado", aliases: ["avocados", "avocado pear", "pear"], cropGroup: "fruit", cropFamily: "Tree fruit", symptomSet: "fruit", patternSet: "fruit", guidanceLevel: "crop_family" }),

  crop({ cropKey: "other-crop", displayName: "Other crop", aliases: ["another crop", "other plant"], cropGroup: "unknown_other", supportedFor: diagnosticSupport, guidanceLevel: "general" }),
  crop({ cropKey: "not-sure", displayName: "Not sure", aliases: ["unknown crop", "unknown plant", "not sure"], cropGroup: "unknown_other", supportedFor: diagnosticSupport, guidanceLevel: "general" })
];

const normalizeCropText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const aliasMatches = farmMateCropLibrary
  .flatMap((entry, entryIndex) =>
    entry.aliases.map((alias) => ({
      entry,
      entryIndex,
      alias: normalizeCropText(alias)
    }))
  )
  .filter((match) => match.alias)
  .sort((a, b) => b.alias.length - a.alias.length || a.entryIndex - b.entryIndex);

const ambiguousQuestionAliases = new Set(["melon", "melons"]);

export function findFarmMateCropLibraryEntry(value: string | null | undefined) {
  if (!value?.trim()) {
    return undefined;
  }

  const normalized = normalizeCropText(value);
  const direct = farmMateCropLibrary.find(
    (entry) => normalizeCropText(entry.cropKey) === normalized || normalizeCropText(entry.displayName) === normalized
  );

  return direct ?? aliasMatches.find((match) => match.alias === normalized)?.entry;
}

export function detectFarmMateCropLibraryEntry(question: string) {
  const normalized = normalizeCropText(question);

  if (!normalized) {
    return undefined;
  }

  return aliasMatches.find(
    (match) =>
      !ambiguousQuestionAliases.has(match.alias) &&
      new RegExp(`(?:^|\\s)${match.alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`).test(normalized)
  )?.entry;
}

export function farmMateCropOptionsByGroup() {
  return cropSelectorGroupOrder.map((group) => ({
    group,
    label: farmMateCropSelectorGroupLabels[group],
    crops: farmMateCropLibrary.filter((entry) => entry.cropGroup === group && entry.supportedFor.includes("crop_doctor"))
  }));
}

export function farmMateCropSymptomsFor(value: string | null | undefined) {
  return findFarmMateCropLibraryEntry(value)?.commonSymptoms ?? [...symptomSets.general];
}

export function farmMateCropGroupLabel(value: string | null | undefined) {
  const entry = findFarmMateCropLibraryEntry(value);
  return entry ? farmMateCropGroupLabels[entry.cropGroup] : undefined;
}

export function farmMateCropFamilyGuidance(value: string | null | undefined) {
  const entry = findFarmMateCropLibraryEntry(value);

  if (!entry || entry.guidanceLevel === "crop_specific" || !entry.cropFamily) {
    return undefined;
  }

  if (entry.cropFamily.includes("Nightshade")) {
    return "This is a nightshade crop, so some tomato or pepper-like leaf problems may look similar, but the exact cause still needs checking.";
  }

  return `FarmMate is using cautious ${entry.cropFamily.toLowerCase()} crop-family guidance. The exact cause still needs checking.`;
}

export function farmMateLimitedCropGuidanceNote(value: string | null | undefined) {
  const entry = findFarmMateCropLibraryEntry(value);

  if (value?.trim() && !entry) {
    return "I do not have full crop-specific guidance for this crop yet, but I can still help using general crop-family guidance.";
  }

  return entry && entry.guidanceLevel !== "crop_specific" && entry.cropGroup !== "unknown_other"
    ? "I do not have full crop-specific guidance for this crop yet, but I can still help using general crop-family guidance."
    : undefined;
}

export function isFarmMateCashPerennialCrop(value: string | null | undefined) {
  return findFarmMateCropLibraryEntry(value)?.cropGroup === "cash_perennial";
}

export const FARM_MATE_CASH_CROP_CAUTION =
  "For valuable perennial crops, confirm serious or spreading problems with an extension officer or experienced crop advisor.";

export function farmMateCropLibraryPromptContext() {
  const groups = (Object.keys(farmMateCropGroupLabels) as FarmMateCropGroup[])
    .filter((group) => group !== "unknown_other")
    .map((group) => {
      const names = farmMateCropLibrary.filter((entry) => entry.cropGroup === group).map((entry) => entry.displayName);
      return `${farmMateCropGroupLabels[group]}: ${names.join(", ")}.`;
    })
    .join("\n");
  const aliases = farmMateCropLibrary
    .filter((entry) => entry.cropGroup !== "unknown_other")
    .map((entry) => `${entry.displayName} = ${entry.aliases.filter((alias) => normalizeCropText(alias) !== normalizeCropText(entry.displayName)).join(", ")}`)
    .filter((line) => !line.endsWith("= "))
    .join("; ");

  return `Expanded Ghana FarmMate crop library:\n${groups}\nCrop aliases: ${aliases}.\nUse crop-family reasoning cautiously. Never turn a related-crop pattern into a confirmed crop-specific diagnosis. If exact guidance is limited, continue with general crop-family guidance instead of refusing. For cocoa, cashew, oil palm, coconut, rubber, and coffee, use the valuable-perennial caution. Never invent disease names, pesticide or fertilizer dosage, yield, profit, market price, or buyer demand.`;
}
