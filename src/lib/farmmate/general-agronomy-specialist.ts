import type { DecisionFlow, FollowUpQuestion } from "./decision-engine/types";

export type GeneralAgronomyTask =
  | "seedling-hardening"
  | "leggy-seedlings"
  | "intercropping"
  | "seed-germination"
  | "weed-management"
  | "soil-structure"
  | "plant-identification"
  | "nursery-management"
  | "transplant-shock"
  | "crop-rotation"
  | "mulching-compost"
  | "drainage"
  | "pepper-pruning"
  | "pruning-sanitation"
  | "plant-stress"
  | "cover-crops-legumes"
  | "field-preparation-spacing"
  | "unknown-crop"
  | "general-practice";

export type GeneralAgronomyGuidance = {
  task: GeneralAgronomyTask;
  question: string;
  opening: string;
  checks: string[];
  actions: string[];
  sustainabilityNotes: string[];
  nextBestAction: string;
  confidence: "high" | "medium" | "low";
  followUpQuestions?: FollowUpQuestion[];
  nextActionType?: DecisionFlow["recommendation"]["nextBestAction"]["actionType"];
};

export const GENERAL_AGRONOMY_UNKNOWN_CROP_NOTE =
  "I do not have full crop-specific guidance for this crop yet, but I can still help with general farming principles.";

export const generalAgronomyReasoningOrder = [
  "farmer-goal",
  "crop-or-plant-if-known",
  "farm-context",
  "growth-stage-if-relevant",
  "soil-or-water-condition-if-relevant",
  "recommendation",
  "next-best-action"
] as const;

export const generalAgronomyCoverage = [
  "seed germination",
  "nursery management",
  "seedling hardening",
  "leggy seedlings",
  "transplant shock",
  "intercropping",
  "crop rotation",
  "mulching",
  "compost use",
  "soil structure",
  "drainage",
  "weed management",
  "pruning",
  "spacing principles",
  "field preparation",
  "plant stress",
  "cover crops",
  "legumes",
  "unknown plants and crops",
  "plant identification guidance",
  "farm sanitation",
  "general sustainable farming practices"
] as const;

export const generalAgronomyGuidance: GeneralAgronomyGuidance[] = [
  {
    task: "seedling-hardening",
    question: "How do I harden seedlings before transplanting?",
    opening: "Harden seedlings gradually over several days so sudden field sun, wind and moisture changes do not shock them.",
    checks: ["Seedlings are healthy, upright and not overcrowded.", "The field is moist, well drained and ready for transplanting."],
    actions: [
      "Start with morning sun and airflow, then increase exposure slowly over several days; avoid sudden full hot sun.",
      "Reduce watering slightly, but do not let seedlings wilt.",
      "Transplant during cool hours, preferably late afternoon or cloudy weather, then water the root zone gently."
    ],
    sustainabilityNotes: ["Raise only healthy planting material.", "Use water carefully during hardening.", "Replace weak seedlings before they waste field space."],
    nextBestAction: "Start with morning sun and airflow today, then increase exposure gradually before transplanting.",
    confidence: "high"
  },
  {
    task: "leggy-seedlings",
    question: "How do I manage leggy seedlings?",
    opening: "Tall, weak seedlings often need better light, airflow and spacing before they are moved to the field.",
    checks: ["Seedlings are stretching or leaning towards the light.", "The seedbed is overcrowded, constantly wet or poorly ventilated."],
    actions: [
      "Give the seedlings more morning light and airflow gradually, without moving them suddenly into full hot sun.",
      "Thin or space overcrowded seedlings so each one receives light.",
      "Keep the seedbed moist but not waterlogged, and avoid adding more feed until growth is sturdier."
    ],
    sustainabilityNotes: ["Keep only healthy planting material.", "Use nursery water carefully.", "Correct overcrowding before weak seedlings take field space."],
    nextBestAction: "Move the seedlings into better morning light and correct overcrowding today.",
    confidence: "high"
  },
  {
    task: "intercropping",
    question: "Can I intercrop maize with cowpea?",
    opening: "Maize and cowpea can be intercropped, but the row arrangement should match the farmer's main goal.",
    checks: ["Which crop is the main crop.", "Whether both crops can receive enough light and space.", "How weeding and harvest work will move through the field."],
    actions: ["Keep a clear row pattern so maize does not heavily shade cowpea.", "Avoid overcrowding either crop.", "Keep records from a small section before using the pattern across the full field."],
    sustainabilityNotes: ["Cowpea can add legume residue to the field.", "Mixed cover can help reduce bare soil.", "Rotate crops as well as intercropping where practical."],
    nextBestAction: "Choose the main goal before deciding the row pattern.",
    confidence: "medium",
    followUpQuestions: [
      {
        id: "general-agronomy-intercrop-goal",
        question: "What is your main goal?",
        requiredForConfidence: true,
        options: ["Improve soil fertility", "Reduce weeds", "Get two crops from the same field", "I am not sure"]
      }
    ]
  },
  {
    task: "seed-germination",
    question: "How do I improve seed germination?",
    opening: "Good germination starts with clean, undamaged seed, a fine well-drained seedbed, steady moisture and suitable planting depth.",
    checks: ["Use clean, undamaged seed.", "Prepare fine, moist, well-drained soil before sowing."],
    actions: [
      "Test a small sample before planting the whole plot.",
      "Do not plant too deep or leave seed exposed.",
      "Keep moisture steady without flooding, then check for gaps after emergence."
    ],
    sustainabilityNotes: ["Avoid wasting weak seed.", "Use compost or organic matter to support soil structure where appropriate.", "Protect the seedbed from erosion and standing water."],
    nextBestAction: "Test a small sample and check seedbed moisture before sowing the whole plot.",
    confidence: "high",
    followUpQuestions: [
      {
        id: "general-agronomy-germination-crop",
        question: "What crop are you planting?",
        requiredForConfidence: false,
        options: ["Maize", "Tomato", "Pepper", "Okra", "Onion", "Watermelon", "Other crop"]
      }
    ]
  },
  {
    task: "weed-management",
    question: "How do I manage weeds before planting?",
    opening: "Remove established weeds before planting so young crops do not compete immediately for water, light and nutrients.",
    checks: ["Which weeds are spreading or setting seed.", "Whether the soil is dry, moist or waterlogged.", "Whether cultivation could leave the soil bare before heavy rain."],
    actions: ["Clear weeds before they set seed and remove persistent roots where practical.", "Prepare only the area that can be planted soon.", "Use mulch or safe crop residue after planting to slow new weeds."],
    sustainabilityNotes: ["Reduce repeated soil disturbance.", "Keep useful organic material where it is clean and disease free.", "Avoid unnecessary herbicide use."],
    nextBestAction: "Walk the plot and remove weeds that are already flowering or setting seed first.",
    confidence: "high"
  },
  {
    task: "soil-structure",
    question: "How do I improve soil structure?",
    opening: "Improve soil structure by adding organic matter, protecting the surface and avoiding work when soil is waterlogged.",
    checks: ["Whether water enters the soil or runs off.", "Whether the soil forms hard clods or a surface crust.", "Whether roots can move through the topsoil."],
    actions: ["Add well-rotted compost or clean crop residues where available.", "Keep soil covered with mulch or a cover crop.", "Use beds, ridges or drainage channels only where field conditions require them."],
    sustainabilityNotes: ["Build organic matter over several seasons.", "Rotate with legumes where suitable.", "Reduce erosion and unnecessary compaction."],
    nextBestAction: "Check one moist handful of soil for crusting, hard clods and poor drainage before choosing the first improvement.",
    confidence: "high"
  },
  {
    task: "plant-identification",
    question: "What plant is this?",
    opening: "A clear field photo is the safest way to narrow an unknown plant without pretending certainty.",
    checks: ["Show the whole plant and how it grows in the field.", "Include close-up leaves, stems, flowers or fruit if present.", "Keep one common object in view for size where practical."],
    actions: ["Upload a clear photo of the whole plant using Crop Doctor.", "Add close-up photos of leaves and stems.", "Do not eat or apply chemicals to an unknown plant based only on a guess."],
    sustainabilityNotes: ["Identify volunteer crops and weeds before removing them.", "Avoid unnecessary chemical use.", "Protect useful field biodiversity when it is safe to do so."],
    nextBestAction: "Upload a clear photo of the whole plant and close-up leaves using Crop Doctor.",
    confidence: "high",
    nextActionType: "use-crop-doctor"
  },
  {
    task: "nursery-management",
    question: "How should I manage a crop nursery?",
    opening: "A strong nursery needs clean planting material, steady moisture, airflow and enough space for each seedling.",
    checks: ["Seedlings are not overcrowded.", "Water drains freely from the nursery bed.", "Weak or diseased seedlings are separated early."],
    actions: ["Water gently at soil level and avoid waterlogging.", "Thin overcrowded seedlings and keep the nursery clean.", "Harden healthy seedlings before moving them to the field."],
    sustainabilityNotes: ["Use water carefully.", "Reuse clean nursery materials where safe.", "Do not carry diseased planting material into the field."],
    nextBestAction: "Check the nursery today for overcrowding, poor drainage and weak seedlings.",
    confidence: "high"
  },
  {
    task: "transplant-shock",
    question: "How do I reduce transplant shock?",
    opening: "Reduce transplant shock by moving hardened seedlings in cool hours and protecting roots from drying.",
    checks: ["Seedlings were hardened before transplanting.", "Roots remain moist and are not badly damaged.", "The field is moist but not waterlogged."],
    actions: ["Keep roots moist and disturb them as little as possible while moving seedlings.", "Transplant in the cool morning or late afternoon, then water the root zone gently.", "Give temporary light shade only when field heat is severe and remove it gradually."],
    sustainabilityNotes: ["Use healthy seedlings.", "Avoid wasting water through flooding.", "Replace only seedlings that do not recover."],
    nextBestAction: "Check soil moisture and root condition before moving more seedlings.",
    confidence: "high"
  },
  {
    task: "crop-rotation",
    question: "How should I rotate crops?",
    opening: "Rotate crop families and include legumes where they fit the field and farm plan.",
    checks: ["Which crop families grew in the field recently.", "Which pests, diseases or weeds have persisted.", "Which next crop fits the season and available water."],
    actions: ["Avoid repeating the same crop family in the same plot where practical.", "Include a legume or cover crop when it suits the farm plan.", "Keep a simple field record for each season."],
    sustainabilityNotes: ["Protect long-term soil health.", "Break some pest and disease cycles.", "Return clean crop residue or compost where appropriate."],
    nextBestAction: "Write down the last two crops grown in the plot before choosing the next crop family.",
    confidence: "high"
  },
  {
    task: "mulching-compost",
    question: "How should I use mulch or compost?",
    opening: "Use clean mulch and well-rotted compost to protect moisture and build soil without touching tender stems.",
    checks: ["Compost is cool, well rotted and free from obvious contamination.", "Mulch material is free from mature weed seed and serious disease.", "The field drains well before more material is added."],
    actions: ["Spread well-rotted compost into the prepared root zone where appropriate.", "Keep mulch slightly away from crop stems.", "Use a moderate layer that still lets rain or irrigation reach the soil."],
    sustainabilityNotes: ["Recycle clean farm residues.", "Reduce evaporation and erosion.", "Avoid moving pests, diseases or weed seed between fields."],
    nextBestAction: "Check that the compost is well rotted and the mulch is clean before field use.",
    confidence: "high"
  },
  {
    task: "drainage",
    question: "How do I improve field drainage?",
    opening: "Drain excess water away without sending soil or farm chemicals into nearby watercourses.",
    checks: ["Where water enters and collects after rain.", "Whether soil is compacted or naturally slow draining.", "Whether an outlet can move water safely."],
    actions: ["Open shallow field drains only where water has a safe outlet.", "Use raised beds or ridges for sensitive crops where practical.", "Do not cultivate or apply inputs while the soil is waterlogged."],
    sustainabilityNotes: ["Protect topsoil from erosion.", "Reduce nutrient runoff.", "Keep natural waterways clear of soil and chemicals."],
    nextBestAction: "Mark the places where water remains longest after rain before opening any channel.",
    confidence: "high"
  },
  {
    task: "pepper-pruning",
    question: "How should I prune pepper?",
    opening: "Prune pepper lightly to remove damaged or diseased growth without stripping healthy leaves that support flowering and fruiting.",
    checks: ["Pepper plants are established and not badly wilted or water-stressed.", "Tools are clean and the leaves or shoots to remove are clearly damaged, diseased or touching the soil."],
    actions: [
      "Use clean, sharp tools and remove damaged, diseased or soil-touching lower growth first.",
      "Avoid heavy pruning or removing many healthy leaves, flowers or fruiting shoots at once.",
      "Take diseased material away from healthy pepper plants and clean tools before moving along the row."
    ],
    sustainabilityNotes: ["Avoid unnecessary plant injury.", "Reduce disease spread between pepper plants.", "Compost removed material only when it is safe and disease free."],
    nextBestAction: "Clean the pruning tool and start with only damaged or soil-touching lower growth.",
    confidence: "high"
  },
  {
    task: "pruning-sanitation",
    question: "How should I prune and keep the field clean?",
    opening: "Prune only where the crop benefits, and keep tools and removed plant material cleanly managed.",
    checks: ["The crop and growth stage are known.", "Tools are clean and sharp.", "Removed material shows disease or pest signs."],
    actions: ["Remove only damaged, diseased or unnecessary growth appropriate for the crop.", "Clean tools between affected areas.", "Take badly diseased material away from healthy plants and dispose of it safely."],
    sustainabilityNotes: ["Avoid unnecessary plant injury.", "Reduce disease spread.", "Compost only material that is safe to compost."],
    nextBestAction: "Confirm the crop and growth stage before making the first pruning cut.",
    confidence: "high"
  },
  {
    task: "plant-stress",
    question: "How do I check general plant stress?",
    opening: "Plant stress can come from water, roots, soil, heat, damage or competition, so check the pattern before treating.",
    checks: ["Whether many plants or only a few are affected.", "Whether soil is dry, waterlogged or compacted.", "Whether roots, stems and new leaves show the same pattern."],
    actions: ["Correct obvious water or drainage stress first.", "Reduce weed competition and avoid adding more inputs until the pattern is clearer.", "Use Crop Doctor or an extension officer if the problem is spreading."],
    sustainabilityNotes: ["Observe before treating.", "Avoid unnecessary chemical use.", "Protect soil moisture and root health."],
    nextBestAction: "Compare affected plants with healthy plants in another part of the field.",
    confidence: "high"
  },
  {
    task: "cover-crops-legumes",
    question: "How can I use cover crops or legumes?",
    opening: "Choose a cover crop or legume that fits the season, water supply and next crop plan.",
    checks: ["The main goal is soil cover, residue, weed suppression or an extra crop.", "The cover crop will not compete badly with the main crop.", "There is a plan to cut, incorporate or manage it before the next crop."],
    actions: ["Start on a manageable area.", "Keep the soil covered without allowing the cover crop to become a weed.", "Return safe residue to the soil where practical."],
    sustainabilityNotes: ["Reduce bare soil and erosion.", "Support organic matter.", "Use legumes as part of a wider rotation plan."],
    nextBestAction: "Choose the main purpose of the cover crop before selecting planting material.",
    confidence: "high"
  },
  {
    task: "field-preparation-spacing",
    question: "How should I prepare and space a field?",
    opening: "Field preparation and spacing should match crop growth, drainage, weeding access and airflow.",
    checks: ["The crop and planting material are known.", "The field drains and is not badly compacted.", "Rows leave room for weeding, scouting and harvest."],
    actions: ["Clear weeds and prepare only when soil moisture is suitable.", "Use crop-specific extension spacing where available.", "Leave enough room for airflow and field work without wasting land."],
    sustainabilityNotes: ["Avoid unnecessary deep cultivation.", "Protect soil cover and organic matter.", "Plan rows to reduce erosion where the field slopes."],
    nextBestAction: "Confirm the crop and field drainage before marking rows.",
    confidence: "high"
  },
  {
    task: "unknown-crop",
    question: "How do I manage a crop FarmMate does not know yet?",
    opening: GENERAL_AGRONOMY_UNKNOWN_CROP_NOTE,
    checks: ["The farmer's goal for the crop or plant.", "The growth stage and field conditions.", "Any visible stress, pest or disease signs."],
    actions: ["Use general principles for healthy planting material, spacing, moisture and drainage.", "Avoid crop-specific chemicals or dosages until the plant is confirmed.", "Use Crop Doctor or an extension officer when identification affects safety."],
    sustainabilityNotes: ["Observe before treating.", "Protect soil health and water.", "Avoid wasting inputs on an unconfirmed crop or problem."],
    nextBestAction: "Choose what you are trying to do so FarmMate can ask one useful question next.",
    confidence: "medium",
    followUpQuestions: [
      {
        id: "general-agronomy-unknown-goal",
        question: "What are you trying to do?",
        requiredForConfidence: true,
        options: ["Plant it", "Treat a problem", "Improve growth", "Identify the plant", "I am not sure"]
      }
    ]
  },
  {
    task: "general-practice",
    question: "What general farming practice should I improve?",
    opening: "Start with the farmer's goal, the crop if known, and the field condition before choosing an action.",
    checks: ["The main farming goal.", "The crop and growth stage if known.", "Soil moisture, drainage and current field practice."],
    actions: ["Observe the field pattern before changing inputs.", "Protect soil with organic matter, rotation and careful water use where practical.", "Use the simplest safe action that can be checked in the field."],
    sustainabilityNotes: ["Protect long-term soil productivity.", "Reduce waste.", "Avoid unnecessary chemical use."],
    nextBestAction: "Describe the crop or plant, field condition and the result you want.",
    confidence: "high"
  }
];

function normalizeGeneralAgronomyQuestion(question: string) {
  return question.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

export function generalAgronomyTaskFromQuestion(question: string, hasKnownCrop = false): GeneralAgronomyTask {
  const normalized = normalizeGeneralAgronomyQuestion(question);

  if (
    normalized.includes("what plant is this") ||
    normalized.includes("what is this plant") ||
    normalized.includes("identify plant") ||
    normalized.includes("identify this plant") ||
    normalized.includes("identify an unknown plant") ||
    /\bidentify\b.*\bplant\b/.test(normalized) ||
    normalized.includes("plant identification")
  )
    return "plant-identification";
  if (normalized.includes("harden") || normalized.includes("hardening")) return "seedling-hardening";
  if (/\bleggy\b.*\bseedlings?\b/.test(normalized) || /\bseedlings?\b.*\bleggy\b/.test(normalized) || normalized.includes("tall weak seedling")) return "leggy-seedlings";
  if (normalized.includes("intercrop") || normalized.includes("intercropping")) return "intercropping";
  if (normalized.includes("germination") || normalized.includes("germinate")) return "seed-germination";
  if (normalized.includes("weed")) return "weed-management";
  if (normalized.includes("soil structure")) return "soil-structure";
  if (normalized.includes("transplant shock")) return "transplant-shock";
  if (normalized.includes("nursery")) return "nursery-management";
  if (normalized.includes("crop rotation") || normalized.includes("rotate crops") || /\brotate\b/.test(normalized)) return "crop-rotation";
  if (normalized.includes("mulch") || normalized.includes("compost use") || normalized.includes("use compost")) return "mulching-compost";
  if (normalized.includes("drainage") || normalized.includes("poor drainage") || normalized.includes("waterlog") || normalized.includes("standing water")) return "drainage";
  if (normalized.includes("pepper") && (normalized.includes("pruning") || normalized.includes("prune"))) return "pepper-pruning";
  if (normalized.includes("pruning") || normalized.includes("prune") || normalized.includes("farm sanitation") || normalized.includes("field sanitation")) return "pruning-sanitation";
  if (normalized.includes("plant stress") || normalized.includes("stressed plants")) return "plant-stress";
  if (normalized.includes("cover crop") || normalized.includes("legume")) return "cover-crops-legumes";
  if (normalized.includes("field preparation") || normalized.includes("spacing principles")) return "field-preparation-spacing";
  if (!hasKnownCrop && /\b(crop|plant|grow|seedling|planting material)\b/.test(normalized)) return "unknown-crop";

  return "general-practice";
}

export function findGeneralAgronomyGuidance(question: string, hasKnownCrop = false) {
  const task = generalAgronomyTaskFromQuestion(question, hasKnownCrop);
  return generalAgronomyGuidance.find((guidance) => guidance.task === task);
}

export function generalAgronomyOpeningForQuestion(question: string, hasKnownCrop = false) {
  return findGeneralAgronomyGuidance(question, hasKnownCrop)?.opening ?? generalAgronomyGuidance[generalAgronomyGuidance.length - 1].opening;
}

function generalAgronomyFlowFromGuidance(guidance: GeneralAgronomyGuidance): DecisionFlow {
  return {
    id: `general-agronomy-${guidance.task}`,
    question: guidance.question,
    intent: "crop-planning",
    possibleCauses: guidance.checks.slice(0, 2),
    requiredInformation: {
      farmPracticeContext: generalAgronomyReasoningOrder.slice(0, 5)
    },
    followUpQuestions: (guidance.followUpQuestions ?? []).slice(0, 1),
    recommendation: {
      summary: guidance.opening,
      confidence: guidance.confidence,
      reasoning: guidance.checks.slice(0, 2).map((check, index) => ({
        id: `general-agronomy-${guidance.task}-check-${index + 1}`,
        observation: check,
        interpretation: "This field check helps FarmMate keep the recommendation practical and cautious."
      })),
      sustainabilityPriority: ["prevention", "good-farming-practice", "natural-low-cost-solution", "chemical-recommendation-if-appropriate"],
      recommendedAction: guidance.actions[0],
      guidance: guidance.actions.slice(1, 3),
      nextBestAction: {
        id: `general-agronomy-${guidance.task}-next`,
        label: guidance.nextActionType === "use-crop-doctor" ? "Use Crop Doctor" : "Next field action",
        instruction: guidance.nextBestAction,
        actionType: guidance.nextActionType ?? "take-farm-action"
      }
    },
    safetyRules: [
      {
        id: `general-agronomy-${guidance.task}-farmer-scale-language`,
        appliesToIntents: ["crop-planning"],
        trigger: "General agronomy guidance is prepared",
        requiredResponse: "Use field, plot, crop, seedbed, seedling, nursery, affected plants, farm, extension officer, soil moisture, drainage and planting material language. Avoid home gardening and garden hobby language.",
        blocksRecommendation: false
      },
      {
        id: `general-agronomy-${guidance.task}-no-unsupported-claims`,
        appliesToIntents: ["crop-planning"],
        trigger: "Crop-specific facts or input rates are not in the Knowledge Engine",
        requiredResponse: "Do not invent crop-specific facts, market prices, guaranteed yield, or pesticide or fertilizer dosages.",
        blocksRecommendation: false
      }
    ]
  };
}

export const generalAgronomyDecisionFlows = generalAgronomyGuidance.map(generalAgronomyFlowFromGuidance);

export function findGeneralAgronomyDecisionFlow(question: string, hasKnownCrop = false) {
  const task = generalAgronomyTaskFromQuestion(question, hasKnownCrop);
  return generalAgronomyDecisionFlows.find((flow) => flow.id === `general-agronomy-${task}`);
}
