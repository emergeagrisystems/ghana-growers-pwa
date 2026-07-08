import type { ConfidenceLevel, FollowUpQuestion, NextBestAction } from "./decision-engine/types";

export type PlantHealthSymptomId =
  | "yellow-leaves"
  | "brown-leaves"
  | "black-spots"
  | "curling-leaves"
  | "wilting"
  | "holes-in-leaves"
  | "flower-drop"
  | "fruit-drop"
  | "stunted-growth"
  | "root-problems";

export type PlantHealthSupportedCrop = "Tomato" | "Maize" | "Cassava" | "Pepper" | "Plantain" | "Yam";

export type PlantHealthCause = {
  cause: string;
  cropNotes?: Partial<Record<PlantHealthSupportedCrop, string>>;
};

export type PlantHealthSymptomGroup = {
  id: PlantHealthSymptomId;
  name: string;
  aliases: string[];
  possibleCauses: PlantHealthCause[];
  questionsToAsk: FollowUpQuestion[];
  checks: string[];
  recommendedActions: string[];
  prevention: string[];
  recommendCropDoctorWhen: string[];
  recommendExtensionOfficerWhen: string[];
};

export type PlantHealthAssessment = {
  symptom: PlantHealthSymptomGroup;
  crop?: PlantHealthSupportedCrop;
  growthStage: string;
  likelyCauses: string[];
  checks: string[];
  actions: string[];
  prevention: string[];
  followUpQuestions: FollowUpQuestion[];
  confidence: ConfidenceLevel;
  nextBestAction: NextBestAction;
  recommendCropDoctor: boolean;
  recommendExtensionOfficer: boolean;
};

export const plantHealthSupportedCrops: PlantHealthSupportedCrop[] = ["Tomato", "Maize", "Cassava", "Pepper", "Plantain", "Yam"];

export const plantHealthSymptomGroups: PlantHealthSymptomGroup[] = [
  {
    id: "yellow-leaves",
    name: "Yellow leaves",
    aliases: ["yellow leaves", "leaves yellow", "yellowing", "pale leaves", "chlorosis"],
    possibleCauses: [
      { cause: "Nutrient shortage, especially nitrogen" },
      { cause: "Too much or too little water around the roots" },
      { cause: "Early pest or disease pressure", cropNotes: { Cassava: "Cassava mosaic can show yellow-green patches.", Tomato: "Tomato lower leaves may yellow with early blight pressure." } }
    ],
    questionsToAsk: [
      { id: "plant-health-yellow-position", question: "Where did the yellowing start?", requiredForConfidence: true, options: ["Older lower leaves", "New top leaves", "Whole plant"] },
      { id: "plant-health-yellow-water", question: "Has the soil been dry, flooded or wet for long?", requiredForConfidence: true, options: ["Dry", "Wet or waterlogged", "Normal moisture"] },
      { id: "plant-health-yellow-pattern", question: "Do you see spots, insects or leaf distortion with the yellowing?", requiredForConfidence: true, options: ["Spots", "Insects or curling", "No other sign"] }
    ],
    checks: ["Compare older leaves with new leaves.", "Check soil moisture around the roots.", "Inspect leaf undersides and nearby plants."],
    recommendedActions: ["Correct water stress first.", "Remove badly diseased leaves only when disease signs are clear.", "Use Crop Doctor before choosing treatment if symptoms are visible."],
    prevention: ["Improve drainage and avoid watering leaves.", "Mulch lightly to keep moisture steady.", "Rotate crops where disease builds up."],
    recommendCropDoctorWhen: ["Yellowing appears with spots, curling, distortion or fast spread."],
    recommendExtensionOfficerWhen: ["A large part of the field is yellowing or plants are dying quickly."]
  },
  {
    id: "brown-leaves",
    name: "Brown leaves",
    aliases: ["brown leaves", "dry leaves", "burnt leaves", "scorched leaves", "leaf scorch"],
    possibleCauses: [
      { cause: "Heat or drought stress" },
      { cause: "Fertilizer burn or chemical injury" },
      { cause: "Leaf disease after wet weather" }
    ],
    questionsToAsk: [
      { id: "plant-health-brown-edge", question: "Where is the browning most visible?", requiredForConfidence: true, options: ["Leaf edges", "Spots on leaf", "Whole leaf drying"] },
      { id: "plant-health-brown-input", question: "Was fertilizer, herbicide or pesticide applied recently?", requiredForConfidence: true, options: ["Yes, recently", "No", "Not sure"] },
      { id: "plant-health-brown-weather", question: "Has the farm been very hot, dry or windy?", requiredForConfidence: false, options: ["Hot and dry", "Wet and humid", "Normal"] }
    ],
    checks: ["Check whether browning starts at leaf edges.", "Look for recent input contact on leaves.", "Compare exposed plants with shaded plants."],
    recommendedActions: ["Water at soil level if the field is dry.", "Avoid adding more fertilizer until the crop is inspected.", "Remove only dead leaf material that is clearly diseased."],
    prevention: ["Apply fertilizer correctly away from tender leaves.", "Water early and keep soil moisture steady.", "Improve spacing for airflow."],
    recommendCropDoctorWhen: ["Brown areas include rings, spreading spots or uncertain chemical injury."],
    recommendExtensionOfficerWhen: ["Chemical injury is suspected across many plants."]
  },
  {
    id: "black-spots",
    name: "Black spots",
    aliases: ["black spots", "dark spots", "black lesions", "leaf spots", "spots on leaves"],
    possibleCauses: [
      { cause: "Fungal or bacterial leaf spot" },
      { cause: "High humidity and splash from rain or overhead watering" },
      { cause: "Infected plant debris or crop-family carryover" }
    ],
    questionsToAsk: [
      { id: "plant-health-spots-rings", question: "Do the spots have rings, yellow edges or wet-looking centres?", requiredForConfidence: true, options: ["Rings", "Yellow edges", "Wet-looking centres"] },
      { id: "plant-health-spots-spread", question: "Are the spots spreading after rain or humid weather?", requiredForConfidence: true, options: ["Yes, after rain", "No", "Not sure"] },
      { id: "plant-health-spots-location", question: "Where are the spots mostly found?", requiredForConfidence: false, options: ["Lower leaves", "New leaves", "Fruit or stems"] }
    ],
    checks: ["Check lower leaves first.", "Look for splash marks from soil.", "Inspect whether nearby plants show the same spots."],
    recommendedActions: ["Remove badly affected leaves where safe and keep tools clean.", "Improve airflow and avoid wetting leaves.", "Upload a clear photo before any fungicide decision."],
    prevention: ["Stake or space crops to reduce leaf wetness.", "Water at soil level.", "Rotate away from related crops where possible."],
    recommendCropDoctorWhen: ["Spots are visible and diagnosis is uncertain."],
    recommendExtensionOfficerWhen: ["Spots are spreading quickly across the field or reaching fruit/stems."]
  },
  {
    id: "curling-leaves",
    name: "Curling leaves",
    aliases: ["curling leaves", "leaves curling", "curled leaves", "leaf curl", "twisted leaves"],
    possibleCauses: [
      { cause: "Sucking insects such as whiteflies, aphids or mites" },
      { cause: "Virus pressure in susceptible crops" },
      { cause: "Heat, drought or herbicide drift" }
    ],
    questionsToAsk: [
      { id: "plant-health-curl-insects", question: "Do you see tiny insects under the curled leaves?", requiredForConfidence: true, options: ["White insects", "Aphids or mites", "No insects seen"] },
      { id: "plant-health-curl-pattern", question: "Are new leaves curled, distorted or mottled?", requiredForConfidence: true, options: ["New leaves curled", "Mottled leaves", "Older leaves only"] },
      { id: "plant-health-curl-neighbour", question: "Are nearby plants showing the same curling?", requiredForConfidence: false, options: ["Yes", "No", "Not sure"] }
    ],
    checks: ["Inspect leaf undersides.", "Check new growth for distortion.", "Look for similar symptoms on neighbouring plants."],
    recommendedActions: ["Reduce insect spread by removing heavily affected volunteer plants.", "Use Crop Doctor for photo confirmation.", "Avoid broad chemical action until the pest or virus risk is clearer."],
    prevention: ["Scout weekly for insects.", "Remove crop residues and weeds that host pests.", "Use healthy planting material."],
    recommendCropDoctorWhen: ["Leaves are curled with insects, mottling or distorted new growth."],
    recommendExtensionOfficerWhen: ["Virus-like curling spreads across many plants."]
  },
  {
    id: "wilting",
    name: "Wilting",
    aliases: ["wilting", "wilt", "drooping", "plants falling", "plants collapsing"],
    possibleCauses: [
      { cause: "Dry soil or heat stress" },
      { cause: "Waterlogging and weak roots" },
      { cause: "Root or stem disease" }
    ],
    questionsToAsk: [
      { id: "plant-health-wilt-time", question: "When is wilting worst?", requiredForConfidence: true, options: ["Hot afternoon", "All day", "After rain"] },
      { id: "plant-health-wilt-soil", question: "What is the soil moisture like near the roots?", requiredForConfidence: true, options: ["Dry", "Wet", "Normal"] },
      { id: "plant-health-wilt-stem", question: "Do stems or roots look brown, rotten or damaged?", requiredForConfidence: true, options: ["Brown stem/root", "Rotten smell", "No visible damage"] }
    ],
    checks: ["Check soil moisture before watering.", "Inspect the stem base and roots.", "Compare wilting plants with healthy nearby plants."],
    recommendedActions: ["Fix drainage or water stress first.", "Remove collapsed plants only if rot is clear.", "Seek field advice if wilting keeps spreading."],
    prevention: ["Plant on well-drained beds where needed.", "Avoid overwatering.", "Rotate crops to reduce soil disease pressure."],
    recommendCropDoctorWhen: ["Wilting includes stem/root discoloration or uncertain root symptoms."],
    recommendExtensionOfficerWhen: ["Many plants wilt suddenly or collapse despite normal moisture."]
  },
  {
    id: "holes-in-leaves",
    name: "Holes in leaves",
    aliases: ["holes in leaves", "leaf holes", "chewed leaves", "eaten leaves", "armyworm damage", "insect holes"],
    possibleCauses: [
      { cause: "Chewing insects or caterpillars", cropNotes: { Maize: "Check the maize whorl for fall armyworm frass.", Plantain: "Look for leaf rollers or chewing damage on young leaves." } },
      { cause: "Beetles or grasshoppers" },
      { cause: "Old damage after pests have moved on" }
    ],
    questionsToAsk: [
      { id: "plant-health-holes-pest", question: "Can you see caterpillars, insects or droppings near the holes?", requiredForConfidence: true, options: ["Caterpillars", "Droppings/frass", "No pest seen"] },
      { id: "plant-health-holes-age", question: "Are the holes fresh and increasing?", requiredForConfidence: true, options: ["Fresh and increasing", "Old damage", "Not sure"] },
      { id: "plant-health-holes-area", question: "How many plants are affected?", requiredForConfidence: false, options: ["Few plants", "Many plants", "Whole field"] }
    ],
    checks: ["Look under leaves and inside maize whorls.", "Check early morning or evening when pests are active.", "Count affected plants before treating."],
    recommendedActions: ["Hand-pick pests where practical on small plots.", "Remove weeds that shelter pests.", "Ask extension advice before pesticide use if many plants are affected."],
    prevention: ["Scout twice weekly in early growth.", "Keep field borders clean.", "Encourage good plant vigour with balanced soil care."],
    recommendCropDoctorWhen: ["Damage pattern is unclear or no pest is visible."],
    recommendExtensionOfficerWhen: ["Many plants are affected or fall armyworm is suspected in maize."]
  },
  {
    id: "flower-drop",
    name: "Flower drop",
    aliases: ["flower drop", "flowers dropping", "flowers falling", "blossom drop"],
    possibleCauses: [
      { cause: "Heat, drought or irregular watering" },
      { cause: "Poor pollination" },
      { cause: "Insect pressure or nutrient imbalance" }
    ],
    questionsToAsk: [
      { id: "plant-health-flower-weather", question: "Has it been very hot, dry or irregularly watered?", requiredForConfidence: true, options: ["Very hot/dry", "Irregular watering", "Normal"] },
      { id: "plant-health-flower-insects", question: "Do you see insects in the flowers or under leaves?", requiredForConfidence: true, options: ["Thrips/whiteflies", "Other insects", "No insects seen"] },
      { id: "plant-health-flower-growth", question: "Is the plant very leafy but setting few fruits?", requiredForConfidence: false, options: ["Very leafy", "Normal leaves", "Weak plant"] }
    ],
    checks: ["Check flowers for tiny insects.", "Review watering regularity.", "Look at whether plants are too leafy with few fruits."],
    recommendedActions: ["Stabilize watering.", "Mulch to reduce heat stress.", "Inspect flowers before choosing pest control."],
    prevention: ["Keep moisture steady during flowering.", "Avoid excess nitrogen during flowering.", "Maintain pollinator-friendly field edges where practical."],
    recommendCropDoctorWhen: ["Flowers drop with visible insect or disease symptoms."],
    recommendExtensionOfficerWhen: ["Flower drop continues across the plot after water stress is corrected."]
  },
  {
    id: "fruit-drop",
    name: "Fruit drop",
    aliases: ["fruit drop", "fruits dropping", "young fruits falling", "fruit falling"],
    possibleCauses: [
      { cause: "Water stress during fruit set" },
      { cause: "Nutrient imbalance, especially potassium or calcium stress" },
      { cause: "Pest or disease damage on fruit/stems" }
    ],
    questionsToAsk: [
      { id: "plant-health-fruit-size", question: "Are fruits dropping when small or near maturity?", requiredForConfidence: true, options: ["Small fruits", "Near maturity", "Both"] },
      { id: "plant-health-fruit-damage", question: "Do dropped fruits have holes, rot or dark marks?", requiredForConfidence: true, options: ["Holes", "Rot/dark marks", "No marks"] },
      { id: "plant-health-fruit-water", question: "Has watering been irregular recently?", requiredForConfidence: false, options: ["Yes", "No", "Not sure"] }
    ],
    checks: ["Inspect fallen fruits for holes or rot.", "Check soil moisture consistency.", "Inspect stems and fruit clusters."],
    recommendedActions: ["Keep watering steady.", "Remove rotten fallen fruit from the field.", "Use Crop Doctor if fruit damage is visible."],
    prevention: ["Mulch and avoid moisture swings.", "Support balanced nutrition before fruiting.", "Remove crop residues that host pests or disease."],
    recommendCropDoctorWhen: ["Dropped fruit has holes, rot or dark marks."],
    recommendExtensionOfficerWhen: ["Fruit drop is severe across many plants or bunches."]
  },
  {
    id: "stunted-growth",
    name: "Stunted growth",
    aliases: ["stunted growth", "not growing", "poor growth", "small plants", "slow growth", "not doing well"],
    possibleCauses: [
      { cause: "Low soil fertility or nutrient leaching" },
      { cause: "Root stress from drought, waterlogging or compaction" },
      { cause: "Pest, disease or poor planting material" }
    ],
    questionsToAsk: [
      { id: "plant-health-stunted-stage", question: "At what growth stage did the crop slow down?", requiredForConfidence: true, options: ["Seedling/early stage", "Vegetative stage", "Flowering/fruiting"] },
      { id: "plant-health-stunted-colour", question: "What colour are the older leaves?", requiredForConfidence: true, options: ["Pale yellow", "Purple/red", "Normal green"] },
      { id: "plant-health-stunted-roots", question: "Are roots weak, damaged or growing in hard/wet soil?", requiredForConfidence: true, options: ["Weak roots", "Hard/wet soil", "Roots look normal"] }
    ],
    checks: ["Compare plant size across the field.", "Check older leaf colour.", "Inspect roots and soil condition."],
    recommendedActions: ["Correct drainage, compaction or drought stress first.", "Use good farming practice before adding more inputs.", "Ask extension advice for fertilizer timing if many plants are affected."],
    prevention: ["Use healthy planting material.", "Prepare soil well before planting.", "Apply organic matter where available."],
    recommendCropDoctorWhen: ["Stunting appears with leaf distortion, spots or unknown symptoms."],
    recommendExtensionOfficerWhen: ["Whole-field stunting suggests soil, input or planting-material problems."]
  },
  {
    id: "root-problems",
    name: "Root problems",
    aliases: ["root problem", "root problems", "rotten roots", "root rot", "bad roots", "root damage"],
    possibleCauses: [
      { cause: "Waterlogging and root rot" },
      { cause: "Nematodes or soil pests" },
      { cause: "Poor soil structure or planting material" }
    ],
    questionsToAsk: [
      { id: "plant-health-root-look", question: "What do the roots look or smell like?", requiredForConfidence: true, options: ["Brown/black roots", "Rotten smell", "Swollen or knotted roots"] },
      { id: "plant-health-root-soil", question: "Is the soil wet, compacted or poorly drained?", requiredForConfidence: true, options: ["Wet", "Compacted", "Well drained"] },
      { id: "plant-health-root-spread", question: "Are root symptoms on one plant or many plants?", requiredForConfidence: false, options: ["One/few plants", "Many plants", "Whole field"] }
    ],
    checks: ["Lift one weak plant carefully and inspect roots.", "Check drainage and soil smell.", "Look for swollen or knotted roots."],
    recommendedActions: ["Improve drainage and avoid overwatering.", "Remove severely rotten plants from the field.", "Contact an extension officer for widespread root problems."],
    prevention: ["Use clean planting material.", "Rotate crops where possible.", "Avoid planting susceptible crops in waterlogged spots."],
    recommendCropDoctorWhen: ["Root symptoms are visible but the cause is unclear."],
    recommendExtensionOfficerWhen: ["Roots are rotting, swollen or many plants are collapsing."]
  }
];

export function findPlantHealthSymptom(question: string) {
  const normalized = question.toLowerCase().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();

  return plantHealthSymptomGroups.find((symptom) => symptom.aliases.some((alias) => normalized.includes(alias)));
}

export function isPlantHealthSupportedCrop(cropName?: string): cropName is PlantHealthSupportedCrop {
  return Boolean(cropName && plantHealthSupportedCrops.includes(cropName as PlantHealthSupportedCrop));
}

export function assessPlantHealthQuestion(question: string, cropName?: string): PlantHealthAssessment | undefined {
  const symptom = findPlantHealthSymptom(question);

  if (!symptom) {
    return undefined;
  }

  const crop = isPlantHealthSupportedCrop(cropName) ? cropName : undefined;
  const likelyCauses = symptom.possibleCauses
    .map((cause) => {
      const note = crop ? cause.cropNotes?.[crop] : undefined;
      return note ? `${cause.cause}: ${note}` : cause.cause;
    })
    .slice(0, 3);
  const recommendCropDoctor = symptom.recommendCropDoctorWhen.length > 0;
  const recommendExtensionOfficer = symptom.recommendExtensionOfficerWhen.some((rule) => /many|large|whole|quickly|severe|collapsing|dying/i.test(rule));

  return {
    symptom,
    crop,
    growthStage: "Unknown",
    likelyCauses,
    checks: symptom.checks.slice(0, 3),
    actions: symptom.recommendedActions.slice(0, 3),
    prevention: symptom.prevention.slice(0, 3),
    followUpQuestions: symptom.questionsToAsk.slice(0, 3),
    confidence: crop ? "medium" : "low",
    recommendCropDoctor,
    recommendExtensionOfficer,
    nextBestAction: recommendCropDoctor
      ? {
          id: `plant-health-${symptom.id}-photo`,
          label: "Use Crop Doctor",
          instruction: `Upload a clear photo of the ${symptom.name.toLowerCase()} so FarmMate can avoid guessing.`,
          actionType: "use-crop-doctor"
        }
      : {
          id: `plant-health-${symptom.id}-inspect`,
          label: "Inspect plants",
          instruction: `Check up to 10 plants for ${symptom.checks[0].toLowerCase()} before taking treatment decisions.`,
          actionType: "take-farm-action"
        }
  };
}
