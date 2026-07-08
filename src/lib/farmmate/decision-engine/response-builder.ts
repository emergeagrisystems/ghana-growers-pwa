import { findFarmMateCrop } from "../crops";
import { resolveFarmMateCropForQuestion } from "../crop-context";
import { farmMateDiseases } from "../diseases";
import { farmMateNutrientDeficiencies } from "../nutrient-deficiencies";
import { farmMatePests } from "../pests";
import { assessPlantHealthQuestion, PlantHealthAssessment } from "../plant-health-specialist";
import { farmMateSafetyRules } from "../safety";
import { farmMateSustainablePractices } from "../sustainability";
import type { FarmMateSpecialist, RouterResult } from "../router";
import { detectFarmMateIntent, DetectedFarmMateIntent } from "./intent-detector";
import { farmMateDecisionFlows } from "./flows";
import { DecisionFlow, FarmerIntent } from "./types";

export type FarmMateResponseSection =
  | "Direct answer"
  | "Why this may happen"
  | "What to check"
  | "Recommended action"
  | "Prevention"
  | "Next Best Action";

export type FarmMateBrainResponse = {
  intent: DetectedFarmMateIntent;
  routerResult?: RouterResult;
  resolvedCrop?: string;
  flow?: DecisionFlow;
  confidence: "high" | "medium" | "low";
  sections: Array<{
    title: FarmMateResponseSection;
    body: string[];
  }>;
  nextBestAction: DecisionFlow["recommendation"]["nextBestAction"];
  shouldShowCropDoctorAction: boolean;
};

export type FarmMateBrainOptions = {
  previousCropName?: string;
};

const specialistIntentMap: Partial<Record<FarmMateSpecialist, FarmerIntent>> = {
  crop_health: "crop-health",
  pest_disease: "diseases",
  weather_decision: "weather-decisions",
  planting: "planting",
  fertilizer: "fertilizer",
  sustainability: "crop-planning",
  general_farming: "crop-planning"
};

function selectedSpecialistFromRouter(routerResult?: RouterResult) {
  if (!routerResult || routerResult.confidence === "low") {
    return "general_farming";
  }

  return routerResult.selectedSpecialist;
}

function flowMatchesCrop(flow: DecisionFlow, resolvedCrop?: string) {
  if (!flow.requiredInformation.crop) {
    return true;
  }

  if (!resolvedCrop) {
    return false;
  }

  return flow.requiredInformation.crop.toLowerCase() === resolvedCrop.toLowerCase();
}

function findBestDecisionFlow(question: string, intent: DetectedFarmMateIntent, routerResult?: RouterResult, resolvedCrop?: string) {
  const normalized = question.toLowerCase();
  const normalizedPlain = normalized.replace(/[’']/g, "").replace(/\s+/g, " ");
  const selectedSpecialist = selectedSpecialistFromRouter(routerResult);
  const plantHealthAssessment = assessPlantHealthQuestion(question, resolvedCrop);

  if (plantHealthAssessment && ["crop_health", "pest_disease", "general_farming"].includes(selectedSpecialist)) {
    return plantHealthAssessmentToDecisionFlow(plantHealthAssessment, intent);
  }

  if (normalized.includes("yellow") && normalized.includes("tomato")) {
    return farmMateDecisionFlows.find((flow) => flow.id === "yellow-tomato-leaves");
  }

  if (normalized.includes("spray")) {
    return farmMateDecisionFlows.find((flow) => flow.id === "can-i-spray-today");
  }

  if (normalized.includes("pepper") && (normalized.includes("flower") || normalized.includes("dropping"))) {
    return farmMateDecisionFlows.find((flow) => flow.id === "pepper-flowers-dropping");
  }

  if (
    normalized.includes("maize") &&
    (normalized.includes("fertilizer") ||
      normalized.includes("not growing") ||
      normalized.includes("poor growth") ||
      normalizedPlain.includes("isnt growing") ||
      normalized.includes("growing well") ||
      normalized.includes("not doing well"))
  ) {
    return farmMateDecisionFlows.find((flow) => flow.id === "maize-not-growing-well");
  }

  const routedIntent = specialistIntentMap[selectedSpecialist];

  if (routedIntent) {
    const routedFlow = farmMateDecisionFlows.find((flow) => flow.intent === routedIntent && flowMatchesCrop(flow, resolvedCrop));

    if (routedFlow) {
      return routedFlow;
    }
  }

  return farmMateDecisionFlows.find((flow) => flow.intent === intent.intent && flowMatchesCrop(flow, resolvedCrop));
}

function plantHealthAssessmentToDecisionFlow(assessment: PlantHealthAssessment, intent: DetectedFarmMateIntent): DecisionFlow {
  const useExtensionNextAction = assessment.recommendExtensionOfficer && !assessment.recommendCropDoctor;

  return {
    id: `plant-health-${assessment.crop?.toLowerCase() ?? "general"}-${assessment.symptom.id}`,
    question: `${assessment.crop ? `${assessment.crop} ` : ""}${assessment.symptom.name}`,
    intent: intent.intent === "pests" || intent.intent === "diseases" ? intent.intent : "crop-health",
    possibleCauses: assessment.likelyCauses.slice(0, 3),
    requiredInformation: {
      crop: assessment.crop,
      growthStage: assessment.growthStage,
      visibleSymptoms: [assessment.symptom.name]
    },
    followUpQuestions: assessment.followUpQuestions.slice(0, 3),
    recommendation: {
      summary: assessment.crop
        ? `${assessment.symptom.name} on ${assessment.crop.toLowerCase()} can come from a few causes, so FarmMate checks the symptom, crop, growth stage and field condition before treatment.`
        : `${assessment.symptom.name} can come from a few causes, so FarmMate needs the crop and field condition before treatment.`,
      confidence: assessment.confidence,
      reasoning: assessment.checks.slice(0, 3).map((check, index) => ({
        id: `${assessment.symptom.id}-check-${index + 1}`,
        observation: check,
        interpretation: "This check helps separate nutrient, water, pest and disease causes before recommending treatment."
      })),
      sustainabilityPriority: ["prevention", "good-farming-practice", "natural-low-cost-solution", "chemical-recommendation-if-appropriate"],
      recommendedAction: assessment.actions.slice(0, 3).join(" "),
      guidance: assessment.actions.slice(0, 3),
      nextBestAction: useExtensionNextAction
        ? {
            id: `plant-health-${assessment.symptom.id}-extension`,
            label: "Contact extension officer",
            instruction: `Speak with a local extension officer if ${assessment.symptom.name.toLowerCase()} is affecting many plants or spreading quickly.`,
            actionType: "contact-extension-officer"
          }
        : assessment.nextBestAction
    },
    safetyRules: []
  };
}

function cropFromResolvedContext(flow: DecisionFlow | undefined, intent: DetectedFarmMateIntent, resolvedCrop?: string) {
  return (
    (resolvedCrop ? findFarmMateCrop(resolvedCrop) : undefined) ??
    (intent.cropName ? findFarmMateCrop(intent.cropName) : undefined) ??
    (flow?.requiredInformation.crop ? findFarmMateCrop(flow.requiredInformation.crop) : undefined)
  );
}

function readableReferences(ids: string[], source: Array<{ id: string; name?: string; nutrient?: string; title?: string }>) {
  return ids
    .map((id) => source.find((item) => item.id === id))
    .filter(Boolean)
    .map((item) => item?.name ?? item?.nutrient ?? item?.title)
    .filter((label): label is string => Boolean(label));
}

function knowledgeLines(flow: DecisionFlow | undefined, intent: DetectedFarmMateIntent, resolvedCrop?: string) {
  const crop = cropFromResolvedContext(flow, intent, resolvedCrop);

  if (!crop) {
    return {
      crop,
      causes: flow?.possibleCauses ?? ["The question needs more crop and field context before FarmMate can narrow the cause."],
      prevention: ["Share the crop, region, growth stage and recent weather so FarmMate can reason more clearly."]
    };
  }

  const diseases = readableReferences(crop.commonDiseases, farmMateDiseases);
  const pests = readableReferences(crop.commonPests, farmMatePests);
  const deficiencies = readableReferences(crop.nutrientDeficiencies, farmMateNutrientDeficiencies);
  const practices = readableReferences(crop.sustainablePractices, farmMateSustainablePractices);

  return {
    crop,
    causes: [...(flow?.possibleCauses ?? []), ...deficiencies, ...diseases, ...pests].slice(0, 6),
    prevention: [
      ...practices.map((practice) => `${practice}.`),
      ...(crop.sustainablePractices.length ? [] : crop.soil.preparation.slice(0, 2))
    ].slice(0, 4)
  };
}

function fallbackFlow(intent: DetectedFarmMateIntent): DecisionFlow {
  return {
    id: "local-fallback",
    question: "General FarmMate question",
    intent: intent.intent,
    possibleCauses: ["FarmMate needs more field context to narrow the answer."],
    requiredInformation: {
      crop: intent.cropName,
      region: "Unknown",
      growthStage: "Unknown"
    },
    followUpQuestions: [
      {
        id: "crop-context",
        question: "Which crop, region and growth stage are you asking about?",
        requiredForConfidence: true
      },
      {
        id: "recent-weather-context",
        question: "What has the weather been like on the farm this week?",
        requiredForConfidence: false
      }
    ],
    recommendation: {
      summary: "FarmMate can help, but it needs a little more information before giving a specific recommendation.",
      confidence: "low",
      reasoning: [
        {
          id: "limited-context",
          observation: "The question does not match a prepared decision flow closely.",
          interpretation: "The safest response is to ask follow-up questions and avoid fake certainty."
        }
      ],
      sustainabilityPriority: ["prevention", "good-farming-practice", "natural-low-cost-solution", "chemical-recommendation-if-appropriate"],
      recommendedAction: "Share the crop, symptoms, growth stage and recent weather.",
      guidance: ["Start with observation before treatment.", "Use Crop Doctor if there are visible crop symptoms."],
      nextBestAction: {
        id: "answer-follow-up",
        label: "Answer follow-up question",
        instruction: "Tell FarmMate the crop, region, growth stage and what you can see on the plant.",
        actionType: "ask-follow-up"
      }
    },
    safetyRules: []
  };
}

export function buildFarmMateResponse(question: string, routerResult?: RouterResult, options: FarmMateBrainOptions = {}): FarmMateBrainResponse {
  const resolvedCrop = resolveFarmMateCropForQuestion(question, options.previousCropName)?.name;
  const intent = {
    ...detectFarmMateIntent(question),
    cropName: resolvedCrop
  };
  const matchedFlow = findBestDecisionFlow(question, intent, routerResult, resolvedCrop);
  const flow = matchedFlow ?? fallbackFlow(intent);
  const knowledge = knowledgeLines(flow, intent, resolvedCrop);
  const isLowerConfidence = flow.recommendation.confidence !== "high";
  const shouldShowCropDoctorAction = flow.recommendation.nextBestAction.actionType === "use-crop-doctor";
  const shouldRecommendExtension = flow.recommendation.nextBestAction.actionType === "contact-extension-officer";
  const photoWouldHelp = flow.safetyRules.some((rule) => rule.id.includes("photo")) || shouldShowCropDoctorAction;
  const chemicalGuardrail = farmMateSafetyRules.find((rule) => rule.action === "avoid-unsafe-chemical-advice");

  return {
    intent,
    routerResult,
    resolvedCrop,
    flow: matchedFlow,
    confidence: flow.recommendation.confidence,
    shouldShowCropDoctorAction,
    nextBestAction: flow.recommendation.nextBestAction,
    sections: [
      {
        title: "Direct answer",
        body: [
          flow.recommendation.summary,
          isLowerConfidence ? "I am not fully certain yet, so I will ask a few checks before suggesting treatment." : "This is a strong local demo match from the FarmMate Decision Engine."
        ]
      },
      {
        title: "Why this may happen",
        body: knowledge.causes.length ? knowledge.causes : flow.possibleCauses
      },
      {
        title: "What to check",
        body: isLowerConfidence
          ? flow.followUpQuestions.map((followUp) => followUp.question)
          : flow.recommendation.reasoning.map((step) => step.observation)
      },
      {
        title: "Recommended action",
        body: [
          flow.recommendation.recommendedAction,
          ...(shouldRecommendExtension ? ["If the problem is spreading quickly, speak with a local extension officer for field-specific help."] : []),
          ...(photoWouldHelp ? ["A clear crop photo will help FarmMate avoid guessing."] : []),
          ...(chemicalGuardrail ? [chemicalGuardrail.responseGuidance] : [])
        ]
      },
      {
        title: "Prevention",
        body: [
          "Prevention: reduce avoidable stress before the problem spreads.",
          "Good farming practice: keep spacing, watering and field hygiene steady.",
          ...(knowledge.prevention.length ? knowledge.prevention : ["Natural or low-cost option: mulch, scout regularly and remove badly affected plant material where appropriate."]),
          "Chemical solution: only consider this when appropriate, and follow the label or extension guidance."
        ]
      },
      {
        title: "Next Best Action",
        body: [`${flow.recommendation.nextBestAction.label}: ${flow.recommendation.nextBestAction.instruction}`]
      }
    ]
  };
}
