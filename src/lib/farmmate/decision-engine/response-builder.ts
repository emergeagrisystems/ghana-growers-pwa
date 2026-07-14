import { findFarmMateCrop } from "../crops";
import { resolveFarmMateCropForQuestion } from "../crop-context";
import { farmMateDiseases } from "../diseases";
import { farmMateNutrientDeficiencies } from "../nutrient-deficiencies";
import { farmMatePests } from "../pests";
import { assessPlantHealthQuestion, PlantHealthAssessment } from "../plant-health-specialist";
import { fertilizerOpeningForQuestion, findFertilizerGuidance } from "../fertilizer-specialist";
import { findPlantingAdvisorGuidance, plantingAdvisorOpeningForQuestion, plantingAdvisorQuestionType } from "../planting-advisor-specialist";
import { findHarvestPostHarvestGuidance, harvestPostHarvestOpeningForQuestion, harvestPostHarvestQuestionType } from "../harvest-postharvest-specialist";
import { findWeatherDecisionGuidance, weatherOpeningForQuestion, weatherTaskFromQuestion } from "../weather-decision-specialist";
import type { WeatherDecisionSummary } from "../weather";
import { farmMateSafetyRules } from "../safety";
import { farmMateSustainablePractices } from "../sustainability";
import type { CropDoctorHandoffContext } from "../crop-doctor-vision";
import type { FarmMateSpecialist, RouterResult } from "../router";
import { detectFarmMateIntent, DetectedFarmMateIntent } from "./intent-detector";
import { farmMateDecisionFlows } from "./flows";
import { DecisionFlow, FarmerIntent, FollowUpQuestion } from "./types";

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
  cropDoctorContext?: CropDoctorHandoffContext;
  weatherContext?: WeatherDecisionSummary;
};

export type FarmMateBrainOptions = {
  previousCropName?: string;
  cropDoctorContext?: CropDoctorHandoffContext;
  weatherContext?: WeatherDecisionSummary;
};

const specialistIntentMap: Partial<Record<FarmMateSpecialist, FarmerIntent>> = {
  crop_health: "crop-health",
  pest_disease: "diseases",
  weather_decision: "weather-decisions",
  harvest_postharvest: "harvest",
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

  if (selectedSpecialist === "fertilizer") {
    if (normalized.includes("maize") && (normalized.includes("best fertilizer") || normalized.includes("best fertiliser") || normalized.includes("fertilizer") || normalized.includes("fertiliser") || normalized.includes("npk") || normalized.includes("urea"))) {
      return farmMateDecisionFlows.find((flow) => flow.id === "best-fertilizer-for-maize");
    }

    if (normalized.includes("pepper") && (normalized.includes("fertilizer") || normalized.includes("fertiliser") || normalized.includes("npk") || normalized.includes("urea"))) {
      return farmMateDecisionFlows.find((flow) => flow.id === "fertilizer-for-pepper");
    }

    if ((normalized.includes("tomato") || normalized.includes("tomatoes")) && (normalized.includes("compost") || normalized.includes("manure"))) {
      return farmMateDecisionFlows.find((flow) => flow.id === "compost-for-tomatoes");
    }

    if (normalized.includes("after rain") || normalized.includes("after the rain") || normalized.includes("before rain") || normalized.includes("heavy rain")) {
      return farmMateDecisionFlows.find((flow) => flow.id === "fertilizer-after-rain");
    }
  }

  if (selectedSpecialist === "weather_decision") {
    const weatherTask = weatherTaskFromQuestion(question);

    if (weatherTask === "spraying") {
      return farmMateDecisionFlows.find((flow) => flow.id === "can-i-spray-today");
    }

    if (weatherTask === "fertilizer-before-rain") {
      return farmMateDecisionFlows.find((flow) => flow.id === "fertilizer-before-rain");
    }

    if (weatherTask === "irrigation") {
      return farmMateDecisionFlows.find((flow) => flow.id === "should-i-irrigate-today");
    }

    if (weatherTask === "harvesting-before-rain") {
      return farmMateDecisionFlows.find((flow) => flow.id === "harvest-before-rain");
    }

    if (weatherTask === "drying-produce") {
      return farmMateDecisionFlows.find((flow) => flow.id === "dry-produce-outside");
    }

    if (weatherTask === "planting-before-rain") {
      return farmMateDecisionFlows.find((flow) => flow.id === "planting-before-rain");
    }
  }

  if (selectedSpecialist === "harvest_postharvest") {
    const harvestQuestionType = harvestPostHarvestQuestionType(question);

    if (harvestQuestionType === "maize-harvest") {
      return farmMateDecisionFlows.find((flow) => flow.id === "when-should-i-harvest-maize");
    }

    if (harvestQuestionType === "tomato-readiness") {
      return farmMateDecisionFlows.find((flow) => flow.id === "tomatoes-ready-for-harvest");
    }

    if (harvestQuestionType === "cassava-storage") {
      return farmMateDecisionFlows.find((flow) => flow.id === "store-cassava-after-harvest");
    }

    if (harvestQuestionType === "vegetable-transport") {
      return farmMateDecisionFlows.find((flow) => flow.id === "pack-vegetables-for-transport");
    }

    if (harvestQuestionType === "harvest-before-rain") {
      return farmMateDecisionFlows.find((flow) => flow.id === "harvest-before-rain");
    }

    return farmMateDecisionFlows.find((flow) => flow.id === "reduce-post-harvest-losses");
  }

  if (selectedSpecialist === "planting") {
    const plantingQuestionType = plantingAdvisorQuestionType(question);

    if (plantingQuestionType === "crop-choice") {
      return farmMateDecisionFlows.find((flow) => flow.id === "what-should-i-plant-this-month");
    }

    if (plantingQuestionType === "tomato-transplant") {
      return farmMateDecisionFlows.find((flow) => flow.id === "when-to-transplant-tomatoes");
    }

    if (plantingQuestionType === "pepper-spacing") {
      return farmMateDecisionFlows.find((flow) => flow.id === "best-spacing-for-pepper");
    }

    if (plantingQuestionType === "maize-timing") {
      return farmMateDecisionFlows.find((flow) => flow.id === "when-should-i-plant-maize");
    }

    if (plantingQuestionType === "tomato-now") {
      return farmMateDecisionFlows.find((flow) => flow.id === "can-i-plant-tomatoes-now");
    }
  }

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

function cropDoctorFollowUpQuestions(context: CropDoctorHandoffContext) {
  if (context.issueCategory === "pest" || context.resultType === "possible_pest") {
    return [
      {
        id: "crop-doctor-pest-under-leaves",
        question: "Do you see tiny insects or webbing under the leaves?",
        requiredForConfidence: true,
        options: ["Yes, I see tiny insects or webbing", "No, I do not see them", "I am not sure"]
      },
      {
        id: "crop-doctor-pest-spread",
        question: "Are more leaves showing the same speckling or pest signs?",
        requiredForConfidence: true,
        options: ["Yes, many leaves are affected", "Only a few leaves are affected", "I am not sure"]
      }
    ];
  }

  if (context.issueCategory === "nutrient") {
    return [
      {
        id: "crop-doctor-nutrient-leaf-position",
        question: "Where are the strongest leaf colour changes?",
        requiredForConfidence: true,
        options: ["Older lower leaves", "New top leaves", "Across the whole plant"]
      },
      {
        id: "crop-doctor-nutrient-soil-moisture",
        question: "What is the soil moisture like around the affected plants?",
        requiredForConfidence: true,
        options: ["Soil is moist", "Soil is dry", "Soil is waterlogged"]
      }
    ];
  }

  if (context.issueCategory === "water_stress") {
    return [
      {
        id: "crop-doctor-water-stress",
        question: "Has the field been very dry or waterlogged recently?",
        requiredForConfidence: true,
        options: ["Very dry", "Waterlogged", "I am not sure"]
      },
      {
        id: "crop-doctor-nearby-plants",
        question: "Are nearby plants showing the same stress signs?",
        requiredForConfidence: true,
        options: ["Yes, nearby plants are affected", "No, only this plant", "I am not sure"]
      }
    ];
  }

  return [
    {
      id: "crop-doctor-leaf-spread",
      question: "Are nearby plants showing the same signs?",
      requiredForConfidence: true,
      options: ["Yes, nearby plants are affected", "No, only a few leaves", "I am not sure"]
    },
    {
      id: "crop-doctor-recent-rain",
      question: "Did the problem appear after recent rain or wet leaves?",
      requiredForConfidence: false,
      options: ["Yes, after rain or wet leaves", "No recent rain", "I am not sure"]
    }
  ];
}

function cropDoctorContextToDecisionFlow(context: CropDoctorHandoffContext, intent: DetectedFarmMateIntent): DecisionFlow {
  const cropLabel = context.crop ?? "the crop";
  const signs = context.visibleSigns.length ? context.visibleSigns : ["visible crop signs from the photo"];
  const possibleIssue = context.possibleIssue.replace(/\bpossible\s+possible\b/gi, "possible");

  return {
    id: `crop-doctor-handoff-${context.issueCategory}-${context.resultType}`,
    question: context.question,
    intent: context.issueCategory === "pest" ? "pests" : context.issueCategory === "disease" ? "diseases" : intent.intent === "fertilizer" || intent.intent === "planting" ? "crop-health" : intent.intent,
    possibleCauses: [
      possibleIssue,
      ...(context.issueCategory === "pest" ? ["Tiny sucking pests such as mites or whiteflies", "Leaf stress that needs underside checks"] : []),
      ...(context.issueCategory === "disease" ? ["Leaf disease pressure after wet conditions", "Spreading infection that needs field checks"] : []),
      ...(context.issueCategory === "nutrient" ? ["Nutrient stress", "Soil moisture affecting nutrient uptake"] : []),
      ...(context.issueCategory === "water_stress" ? ["Water stress", "Root stress from dry or waterlogged soil"] : [])
    ].slice(0, 3),
    requiredInformation: {
      crop: context.crop ?? undefined,
      visibleSymptoms: signs,
      growthStage: "Unknown"
    },
    followUpQuestions: cropDoctorFollowUpQuestions(context),
    recommendation: {
      summary: `Crop Doctor saw ${signs.slice(0, 2).join(", ")} on ${cropLabel.toLowerCase()} and flagged ${possibleIssue.toLowerCase()}.`,
      confidence: "medium",
      reasoning: signs.slice(0, 3).map((sign, index) => ({
        id: `crop-doctor-sign-${index + 1}`,
        observation: sign,
        interpretation: "This photo sign needs a quick field check before treatment."
      })),
      sustainabilityPriority: ["prevention", "good-farming-practice", "natural-low-cost-solution", "chemical-recommendation-if-appropriate"],
      recommendedAction: "Check the affected leaves, nearby plants and leaf undersides before choosing treatment.",
      guidance: [
        "Check both sides of affected leaves.",
        "Compare affected plants with nearby healthy plants.",
        "Avoid spraying until the pest or disease sign is clearer."
      ],
      nextBestAction: {
        id: "crop-doctor-field-check",
        label: "Field check",
        instruction: context.nextBestAction,
        actionType: "take-farm-action"
      }
    },
    safetyRules: []
  };
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

function farmerSafeLine(line: string) {
  return line
    .replace("Do not invent chemical rates. Tell the farmer to ", "Avoid exact chemical rates unless they are on the product label. ")
    .replace("Tell the farmer to ", "")
    .replace("Tell FarmMate", "Share");
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
    causes: [...(flow?.possibleCauses ?? []), ...deficiencies, ...diseases, ...pests].slice(0, 3),
    prevention: [
      ...practices.map((practice) => `${practice}.`),
      ...(crop.sustainablePractices.length ? [] : crop.soil.preparation.slice(0, 2))
    ].slice(0, 2)
  };
}

function fertilizerContextLines(flow: DecisionFlow | undefined, resolvedCrop?: string) {
  if (!flow || (flow.intent !== "fertilizer" && flow.id !== "yellow-maize-nutrient-stress")) {
    return [];
  }

  const guidance = findFertilizerGuidance(resolvedCrop ?? flow.requiredInformation.crop);

  if (!guidance) {
    return [
      "Fertilizer advice needs crop stage, soil moisture and what has already been applied.",
      "Do not guess rates; use a soil test or local extension advice for exact product rates."
    ];
  }

  return [
    `Nutrient needs: ${guidance.commonNutrientNeeds.slice(0, 2).join("; ")}.`,
    `Before applying: ${guidance.checksBeforeApplying.slice(0, 3).join("; ")}.`,
    `Safe use: ${guidance.safeUseNotes.slice(0, 2).join("; ")}.`
  ];
}

function weatherContextLines(question: string, flow: DecisionFlow | undefined, weatherContext?: WeatherDecisionSummary) {
  if (!flow || flow.intent !== "weather-decisions") {
    return [];
  }

  const guidance = findWeatherDecisionGuidance(weatherTaskFromQuestion(question));

  if (weatherContext?.liveWeatherAvailable) {
    return [
      `Selected weather context: ${weatherContext.locationName}.`,
      `Weather guidance: ${weatherContext.summaryNote}`,
      "This is a daily forecast, so confirm the next few hours and field conditions before spraying."
    ].slice(0, 3);
  }

  return [
    "FarmMate does not have live weather in this local decision flow, so it must ask the farmer to check rain, wind and leaf or soil wetness.",
    ...(guidance ? [`Farmer task: ${guidance.handles}`, ...guidance.checks.slice(0, 1)] : [])
  ].slice(0, 3);
}

function weatherRainContextLine(weatherContext: WeatherDecisionSummary) {
  if (typeof weatherContext.rainChancePercent === "number") {
    return `FarmMate is seeing a ${weatherContext.rainChancePercent}% chance of rain today for ${weatherContext.locationName}.`;
  }

  return `FarmMate has live weather context for ${weatherContext.locationName}.`;
}

function weatherTemperatureContextLine(weatherContext: WeatherDecisionSummary) {
  if (typeof weatherContext.temperatureMinC === "number" && typeof weatherContext.temperatureMaxC === "number") {
    return `Today's temperature range is ${weatherContext.temperatureMinC}-${weatherContext.temperatureMaxC}°C.`;
  }

  if (typeof weatherContext.temperatureMaxC === "number") {
    return `Today's high temperature is about ${weatherContext.temperatureMaxC}°C.`;
  }

  return "";
}

function weatherSprayFollowUps(flow: DecisionFlow, weatherContext: WeatherDecisionSummary): FollowUpQuestion[] {
  const leafQuestion = flow.followUpQuestions.find((followUp) => followUp.id === "leaf-wetness");
  const windQuestion = flow.followUpQuestions.find((followUp) => followUp.id === "wind-level");
  const followUps: FollowUpQuestion[] = [];

  if (leafQuestion) {
    followUps.push({
      ...leafQuestion,
      question: "Are the leaves dry now?"
    });
  }

  if (typeof weatherContext.windSpeedKph !== "number" && windQuestion) {
    followUps.push({
      ...windQuestion,
      question: "Is the wind calm where you are?"
    });
  }

  return followUps;
}

function weatherContextRecommendation(weatherContext: WeatherDecisionSummary) {
  const rainChance = weatherContext.rainChancePercent;
  const rainLine = weatherRainContextLine(weatherContext);
  const temperatureLine = weatherTemperatureContextLine(weatherContext);
  const contextLines = [rainLine, temperatureLine].filter(Boolean);
  const hasHighRainChance = typeof rainChance === "number" && rainChance >= 60;
  const hasLowRainChance = typeof rainChance === "number" && rainChance <= 25;
  const hasMediumRainChance = typeof rainChance === "number" && !hasHighRainChance && !hasLowRainChance;

  if (hasHighRainChance) {
    return {
      summary: `${rainLine} Do not spray unless you can confirm no rain for the next 4 to 6 hours.`,
      recommendedAction: "Delay spraying for now unless you can confirm no rain for the next 4 to 6 hours, leaves are dry and wind is calm.",
      guidance: [
        "Because this is a daily forecast, confirm the next few hours before spraying.",
        "Spray only when leaves are dry and wind is calm.",
        "Follow the product label for any crop protection product."
      ],
      reasoning: contextLines
    };
  }

  if (hasMediumRainChance) {
    return {
      summary: `${rainLine} Be cautious because this is a daily forecast, not an exact next-hour forecast.`,
      recommendedAction: "Confirm the next 4 to 6 hours before spraying, then check that leaves are dry and wind is calm.",
      guidance: [
        "Use the daily forecast as a warning sign, not as exact timing.",
        "Wait if clouds build or rain looks likely soon.",
        "Follow the product label for any crop protection product."
      ],
      reasoning: contextLines
    };
  }

  return {
    summary: hasLowRainChance
      ? `${rainLine} Spraying may be possible only if field conditions are also suitable.`
      : `${rainLine} Field checks are still needed before spraying.`,
    recommendedAction: "Check leaf dryness and wind before spraying; do not rely on the daily forecast alone.",
    guidance: [
      "Because this is a daily forecast, confirm the next few hours before spraying.",
      "Spray only when leaves are dry and wind is calm.",
      "Avoid spraying during hot midday sun."
    ],
    reasoning: contextLines
  };
}

function applyWeatherContextToFlow(question: string, flow: DecisionFlow, weatherContext?: WeatherDecisionSummary): DecisionFlow {
  if (!weatherContext?.liveWeatherAvailable || flow.intent !== "weather-decisions") {
    return flow;
  }

  if (weatherTaskFromQuestion(question) !== "spraying" || flow.id !== "can-i-spray-today") {
    return flow;
  }

  const contextRecommendation = weatherContextRecommendation(weatherContext);

  return {
    ...flow,
    requiredInformation: {
      ...flow.requiredInformation,
      recentWeather: `Live daily forecast context available for ${weatherContext.locationName}`
    },
    followUpQuestions: weatherSprayFollowUps(flow, weatherContext),
    recommendation: {
      ...flow.recommendation,
      summary: contextRecommendation.summary,
      reasoning: contextRecommendation.reasoning.map((line, index) => ({
        id: `live-weather-context-${index + 1}`,
        observation: line,
        interpretation: "This live weather context supports the decision, but exact field checks still matter."
      })),
      recommendedAction: contextRecommendation.recommendedAction,
      guidance: contextRecommendation.guidance,
      nextBestAction: {
        id: "confirm-field-conditions",
        label: "Confirm field conditions",
        instruction: "Confirm the next few hours, leaf dryness and wind before spraying.",
        actionType: "take-farm-action"
      }
    }
  };
}

function plantingContextLines(flow: DecisionFlow | undefined, resolvedCrop?: string) {
  if (!flow || flow.intent !== "planting") {
    return [];
  }

  const guidance = findPlantingAdvisorGuidance(resolvedCrop ?? flow.requiredInformation.crop);

  if (!guidance) {
    return [
      "Planting advice needs crop type, region, month or season, water availability and land preparation.",
      "FarmMate should not claim one crop is best without local planting context."
    ];
  }

  return [
    `Planting conditions: ${guidance.suitablePlantingConditions.slice(0, 2).join("; ")}.`,
    `Spacing: ${guidance.spacingGuidance.slice(0, 2).join("; ")}.`,
    `Delay planting: ${guidance.whenToDelayPlanting.slice(0, 2).join("; ")}.`
  ];
}

function harvestPostHarvestContextLines(flow: DecisionFlow | undefined, resolvedCrop?: string) {
  if (!flow || flow.intent !== "harvest") {
    return [];
  }

  const guidance = findHarvestPostHarvestGuidance(resolvedCrop ?? flow.requiredInformation.crop);

  if (!guidance) {
    return [
      "Harvest and post-harvest advice needs crop, maturity signs, weather risk, storage or transport plan and quality risk.",
      "Share the crop and handling plan so FarmMate can protect quality without guessing."
    ];
  }

  return [
    `Harvest indicators: ${guidance.harvestIndicators.slice(0, 2).join("; ")}.`,
    `Handling: ${guidance.handlingTips.slice(0, 2).join("; ")}.`,
    `Quality protection: ${guidance.qualityProtectionTips.slice(0, 2).join("; ")}.`
  ];
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
        instruction: "Share the crop, region, growth stage and what you can see on the plant.",
        actionType: "ask-follow-up"
      }
    },
    safetyRules: []
  };
}

export function buildFarmMateResponse(question: string, routerResult?: RouterResult, options: FarmMateBrainOptions = {}): FarmMateBrainResponse {
  const resolvedCrop = options.cropDoctorContext?.crop ?? resolveFarmMateCropForQuestion(question, options.previousCropName)?.name;
  const intent = {
    ...detectFarmMateIntent(question),
    cropName: resolvedCrop
  };
  const matchedFlow = options.cropDoctorContext
    ? cropDoctorContextToDecisionFlow(options.cropDoctorContext, intent)
    : findBestDecisionFlow(question, intent, routerResult, resolvedCrop);
  const flow = matchedFlow ? applyWeatherContextToFlow(question, matchedFlow, options.weatherContext) : fallbackFlow(intent);
  const knowledge = knowledgeLines(flow, intent, resolvedCrop);
  const isLowerConfidence = flow.recommendation.confidence !== "high";
  const shouldShowCropDoctorAction = flow.recommendation.nextBestAction.actionType === "use-crop-doctor";
  const shouldRecommendExtension = flow.recommendation.nextBestAction.actionType === "contact-extension-officer";
  const photoWouldHelp = flow.safetyRules.some((rule) => rule.id.includes("photo")) || shouldShowCropDoctorAction;
  const chemicalGuardrail = farmMateSafetyRules.find((rule) => rule.action === "avoid-unsafe-chemical-advice");
  const isFertilizerFlow = flow.intent === "fertilizer";
  const isWeatherFlow = flow.intent === "weather-decisions";
  const isPlantingFlow = flow.intent === "planting";
  const isHarvestFlow = flow.intent === "harvest";
  const fertilizerContext = fertilizerContextLines(flow, resolvedCrop);
  const weatherContext = weatherContextLines(question, flow, options.weatherContext);
  const plantingContext = plantingContextLines(flow, resolvedCrop);
  const harvestPostHarvestContext = harvestPostHarvestContextLines(flow, resolvedCrop);

  return {
    intent,
    routerResult,
    resolvedCrop,
    flow: matchedFlow ? flow : undefined,
    confidence: flow.recommendation.confidence,
    shouldShowCropDoctorAction,
    nextBestAction: flow.recommendation.nextBestAction,
    cropDoctorContext: options.cropDoctorContext,
    weatherContext: options.weatherContext,
    sections: [
      {
        title: "Direct answer",
        body: [
          ...(isFertilizerFlow ? [fertilizerOpeningForQuestion(question)] : []),
          ...(isWeatherFlow ? [weatherOpeningForQuestion(question)] : []),
          ...(isPlantingFlow ? [plantingAdvisorOpeningForQuestion(question)] : []),
          ...(isHarvestFlow ? [harvestPostHarvestOpeningForQuestion(question)] : []),
          flow.recommendation.summary,
          isLowerConfidence
            ? isPlantingFlow
              ? "I need a little more planting context before giving firm timing advice."
              : isHarvestFlow
              ? "I need a little more harvest or handling context before giving firm timing advice."
              : "I am not fully certain yet, so I will ask a few checks before suggesting treatment."
            : isWeatherFlow
            ? "Use the farmer's own rain, wind and field checks before acting."
            : "This is a strong local demo match from the FarmMate Decision Engine."
        ].slice(0, 3)
      },
      {
        title: "Why this may happen",
        body: (weatherContext.length ? weatherContext : fertilizerContext.length ? fertilizerContext : plantingContext.length ? plantingContext : harvestPostHarvestContext.length ? harvestPostHarvestContext : knowledge.causes.length ? knowledge.causes : flow.possibleCauses).slice(0, 3).map(farmerSafeLine)
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
          ...(isWeatherFlow ? flow.recommendation.guidance.slice(0, 2) : []),
          ...(isFertilizerFlow ? flow.recommendation.guidance.slice(0, 2) : []),
          ...(isPlantingFlow ? flow.recommendation.guidance.slice(0, 2) : []),
          ...(isHarvestFlow ? flow.recommendation.guidance.slice(0, 2) : []),
          ...(shouldRecommendExtension ? ["If the problem is spreading quickly, speak with a local extension officer for field-specific help."] : []),
          ...(photoWouldHelp ? ["A clear crop photo will help FarmMate avoid guessing."] : []),
          ...(chemicalGuardrail ? [chemicalGuardrail.responseGuidance] : [])
        ].slice(0, 3).map(farmerSafeLine)
      },
      {
        title: "Prevention",
        body: (isHarvestFlow
          ? [
              "Quality protection: reduce post-harvest losses with shade, sorting and gentle handling.",
              "Good handling: keep clean containers ready and separate damaged produce early.",
              "Food safety: contact an extension officer or food safety expert for serious rot, mould or contamination."
            ]
          : [
              "Prevention: reduce avoidable stress before the problem spreads.",
              "Good farming practice: keep spacing, watering and field hygiene steady.",
              ...(knowledge.prevention.length ? knowledge.prevention.slice(0, 1) : ["Natural or low-cost option: mulch, scout regularly and remove badly affected plant material where appropriate."]),
              "Chemical solution: only consider this when appropriate, and follow the label or extension guidance."
            ]).map(farmerSafeLine)
      },
      {
        title: "Next Best Action",
        body: [farmerSafeLine(`${flow.recommendation.nextBestAction.label}: ${flow.recommendation.nextBestAction.instruction}`)]
      }
    ]
  };
}
