import { FARM_MATE_SYSTEM_PROMPT } from "./system-prompt";
import type { FarmMateAiInput, FarmMateAiResult } from "./types";
import { findFertilizerGuidance } from "../fertilizer-specialist";
import { findPlantingAdvisorGuidance } from "../planting-advisor-specialist";
import { findHarvestPostHarvestGuidance } from "../harvest-postharvest-specialist";
import { findWeatherDecisionGuidance, weatherTaskFromQuestion } from "../weather-decision-specialist";
import {
  findGeneralAgronomyGuidance,
  GENERAL_AGRONOMY_UNKNOWN_CROP_NOTE,
  generalAgronomyCoverage,
  generalAgronomyReasoningOrder
} from "../general-agronomy-specialist";
import {
  FARM_MATE_CASH_CROP_CAUTION,
  farmMateCropFamilyGuidance,
  farmMateCropGroupLabels,
  farmMateLimitedCropGuidanceNote,
  findFarmMateCropLibraryEntry,
  isFarmMateCashPerennialCrop
} from "../crop-library";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.5";

type OpenAIResponsesApiResult = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

function extractOutputText(data: OpenAIResponsesApiResult) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  return (data.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((text): text is string => Boolean(text?.trim()))
    .join("\n")
    .trim();
}

const danglingWeatherEndingPattern = /\b(?:and|or|the|a|an|to|for|with|when|if|that|because|while|before|after|whether)$/i;

export function isLikelyIncompleteFarmMateAnswer(answer: string, input: FarmMateAiInput) {
  const trimmed = answer.trim();

  if (!trimmed) {
    return true;
  }

  const isGeneralAgronomy =
    input.brain.routerResult?.selectedSpecialist === "general_agronomy" || input.brain.flow?.id.startsWith("general-agronomy-");

  if (isGeneralAgronomy) {
    return !["What I think", "What to do now", "Next step"].every((heading) =>
      new RegExp(`(?:^|\\n)\\s*(?:#+\\s*)?${heading}\\s*:`, "i").test(trimmed)
    );
  }

  const isWeatherDecision =
    input.brain.routerResult?.selectedSpecialist === "weather_decision" || input.brain.flow?.intent === "weather-decisions";

  if (!isWeatherDecision) {
    return false;
  }

  const withoutTrailingMarkdown = trimmed.replace(/[\s>*_`#-]+$/g, "").trim();
  const lastLine = withoutTrailingMarkdown.split(/\n+/).pop()?.trim() ?? withoutTrailingMarkdown;

  return danglingWeatherEndingPattern.test(lastLine) || !/[.!?]$/.test(withoutTrailingMarkdown);
}

export function buildFarmMateVoiceLayerInput(input: FarmMateAiInput) {
  const crop = input.brain.resolvedCrop ?? input.brain.intent.cropName ?? null;
  const cropLibraryEntry = findFarmMateCropLibraryEntry(crop);
  const cropLibraryContext = cropLibraryEntry
    ? {
        cropKey: cropLibraryEntry.cropKey,
        displayName: cropLibraryEntry.displayName,
        aliases: cropLibraryEntry.aliases.slice(0, 8),
        cropGroup: farmMateCropGroupLabels[cropLibraryEntry.cropGroup],
        cropFamily: cropLibraryEntry.cropFamily ?? null,
        supportedFor: cropLibraryEntry.supportedFor,
        commonSymptoms: cropLibraryEntry.commonSymptoms.slice(0, 8),
        commonPestDiseasePatterns: cropLibraryEntry.commonPestDiseasePatterns.slice(0, 3),
        diagnosticCautions: cropLibraryEntry.diagnosticCautions.slice(0, 4),
        familyGuidance: farmMateCropFamilyGuidance(cropLibraryEntry.displayName) ?? null,
        limitedGuidanceNote: farmMateLimitedCropGuidanceNote(cropLibraryEntry.displayName) ?? null,
        cashCropCaution: isFarmMateCashPerennialCrop(cropLibraryEntry.displayName) ? FARM_MATE_CASH_CROP_CAUTION : null
      }
    : null;
  const fertilizerContext =
    input.brain.routerResult?.selectedSpecialist === "fertilizer" || input.brain.flow?.intent === "fertilizer"
      ? findFertilizerGuidance(crop ?? input.brain.flow?.requiredInformation.crop)
      : null;
  const weatherGuidance =
    input.brain.routerResult?.selectedSpecialist === "weather_decision" || input.brain.flow?.intent === "weather-decisions"
      ? findWeatherDecisionGuidance(weatherTaskFromQuestion(input.farmerQuestion))
      : null;
  const liveWeatherContext =
    input.brain.routerResult?.selectedSpecialist === "weather_decision" || input.brain.flow?.intent === "weather-decisions"
      ? input.brain.weatherContext ?? null
      : null;
  const plantingContext =
    input.brain.routerResult?.selectedSpecialist === "planting" || input.brain.flow?.intent === "planting"
      ? findPlantingAdvisorGuidance(crop ?? input.brain.flow?.requiredInformation.crop)
      : null;
  const harvestPostHarvestContext =
    input.brain.routerResult?.selectedSpecialist === "harvest_postharvest" || input.brain.flow?.intent === "harvest"
      ? findHarvestPostHarvestGuidance(crop ?? input.brain.flow?.requiredInformation.crop)
      : null;
  const generalAgronomyContext =
    input.brain.routerResult?.selectedSpecialist === "general_agronomy" || input.brain.flow?.id.startsWith("general-agronomy-")
      ? findGeneralAgronomyGuidance(input.farmerQuestion, Boolean(crop))
      : null;
  const payload = {
    instruction: generalAgronomyContext
      ? "Rewrite the local FarmMate Brain response using the exact headings What I think:, What to do now:, optional What to check:, and Next step:. Keep at most three actions, two checks, and one next step. Preserve the approved local guidance and do not add unsupported facts."
      : "Rewrite the local FarmMate Brain response into a short, natural answer. Do not add facts, prices, pesticide dosages, diagnoses, or recommendations that are not present in this context.",
    farmerQuestion: input.farmerQuestion,
    detectedIntent: input.brain.intent,
    crop,
    cropLibraryContext,
    selectedSpecialist: input.brain.routerResult?.selectedSpecialist ?? null,
    specialistContext: fertilizerContext
      ? {
          specialist: "fertilizer",
          crop: fertilizerContext.crop,
          commonNutrientNeeds: fertilizerContext.commonNutrientNeeds,
          checksBeforeApplying: fertilizerContext.checksBeforeApplying,
          safeUseNotes: fertilizerContext.safeUseNotes,
          sustainabilityNotes: fertilizerContext.sustainabilityNotes,
          extensionOfficerTriggers: fertilizerContext.extensionOfficerTriggers
        }
      : weatherGuidance
      ? {
          specialist: "weather_decision",
          task: weatherGuidance.task,
          handles: weatherGuidance.handles,
          checks: weatherGuidance.checks,
          actions: weatherGuidance.actions,
          safetyWarnings: weatherGuidance.safetyWarnings,
          sustainabilityNotes: weatherGuidance.sustainabilityNotes,
          liveWeatherContext,
          noLiveWeatherRule: liveWeatherContext
            ? "Use only the provided live weather context. If it contains a daily rain chance, say it is a daily forecast and tell the farmer to confirm the next few hours before spraying. Do not invent exact rain timing, wind, humidity or forecast details."
            : "Do not invent live rain, wind, temperature or forecast details. Ask the farmer to check conditions when weather data is missing."
        }
      : plantingContext
      ? {
          specialist: "planting",
          crop: plantingContext.crop,
          suitablePlantingConditions: plantingContext.suitablePlantingConditions,
          plantingSeasonNotes: plantingContext.plantingSeasonNotes,
          spacingGuidance: plantingContext.spacingGuidance,
          nurseryTransplantingNotes: plantingContext.nurseryTransplantingNotes,
          soilPreparation: plantingContext.soilPreparation,
          waterRainfallNeeds: plantingContext.waterRainfallNeeds,
          commonPlantingMistakes: plantingContext.commonPlantingMistakes,
          sustainablePlantingPractices: plantingContext.sustainablePlantingPractices,
          whenToDelayPlanting: plantingContext.whenToDelayPlanting,
          nextBestAction: plantingContext.nextBestAction,
          noLiveWeatherRule: "Do not invent exact local weather or forecast details. Use farmer-provided rain, irrigation and soil context only.",
          noMarketRule: "Do not invent seed availability, market prices, guaranteed profit or guaranteed yield."
        }
      : harvestPostHarvestContext
      ? {
          specialist: "harvest_postharvest",
          crop: harvestPostHarvestContext.crop,
          harvestIndicators: harvestPostHarvestContext.harvestIndicators,
          signsNotReady: harvestPostHarvestContext.signsNotReady,
          bestHarvestTimeOfDay: harvestPostHarvestContext.bestHarvestTimeOfDay,
          handlingTips: harvestPostHarvestContext.handlingTips,
          sortingAndGradingBasics: harvestPostHarvestContext.sortingAndGradingBasics,
          shortTermStorageGuidance: harvestPostHarvestContext.shortTermStorageGuidance,
          transportPreparation: harvestPostHarvestContext.transportPreparation,
          commonPostHarvestMistakes: harvestPostHarvestContext.commonPostHarvestMistakes,
          qualityProtectionTips: harvestPostHarvestContext.qualityProtectionTips,
          whenToHarvestBeforeRain: harvestPostHarvestContext.whenToHarvestBeforeRain,
          whenToDelayHarvest: harvestPostHarvestContext.whenToDelayHarvest,
          nextBestAction: harvestPostHarvestContext.nextBestAction,
          noMarketRule: "Do not invent market prices, buyer availability, guaranteed sales or guaranteed shelf life.",
          foodSafetyRule: "Do not make food safety claims beyond the provided context. Recommend extension officer or food safety expert support for serious rot, mould or contamination."
        }
      : generalAgronomyContext
      ? {
          specialist: "general_agronomy",
          task: generalAgronomyContext.task,
          handles: generalAgronomyCoverage,
          reasoningOrder: generalAgronomyReasoningOrder,
          opening: generalAgronomyContext.opening,
          checks: generalAgronomyContext.checks.slice(0, 2),
          actions: generalAgronomyContext.actions.slice(0, 3),
          sustainabilityNotes: generalAgronomyContext.sustainabilityNotes,
          nextBestAction: generalAgronomyContext.nextBestAction,
          unknownCropRule: GENERAL_AGRONOMY_UNKNOWN_CROP_NOTE,
          farmerScaleLanguageRule: "Use field, plot, crop, seedbed, seedling, nursery, affected plants, farm, extension officer, soil moisture, drainage and planting material language. Never use pot, indoor plant, houseplant, decorative plant, balcony or garden hobby language.",
          noUnsupportedClaimsRule: "Do not invent local crop-specific facts, market prices, guaranteed yields, or pesticide or fertilizer dosages. Do not pretend certainty about an unknown plant."
        }
      : null,
    decisionFlow: input.brain.flow ?? null,
    farmerAnswers: input.farmerAnswers,
    recommendedAction: input.brain.flow?.recommendation.recommendedAction ?? null,
    safetyRules: input.brain.flow?.safetyRules ?? [],
    nextBestAction: input.brain.nextBestAction,
    localStructuredResponse: input.localStructuredResponse,
    responseRules: [
      "Keep the answer concise and conversational.",
      "Use the farmer's answers when explaining the recommendation.",
      "Avoid filler phrases such as 'I can help', 'I will keep it short and focused', or 'Here is the practical next step'.",
      "For weather decisions, do not invent live weather or forecast details.",
      "For weather decisions with live daily weather context, do not turn daily rain chance into exact 4 to 6 hour rain timing.",
      "For weather decisions, use complete sentences. Never end mid-phrase.",
      "For high live rain chance, say: \"Do not spray now unless you can personally confirm there will be no rain for the next 4 to 6 hours. Spray only when leaves are dry and wind is calm.\"",
      "For unsure rain answers, say: \"Don't spray yet. First confirm whether rain is expected in the next 4 to 6 hours. Spray only when leaves are dry and wind is calm.\"",
      "For rain expected answers, say: \"Do not spray now. Wait until after the rain and spray only when leaves are dry and wind is calm.\"",
      "For clear spray conditions, say: \"Spraying may be suitable. Follow the product label and avoid spraying during hot midday sun.\"",
      "For planting decisions, do not invent exact local weather, seed availability, market prices, guaranteed profit, or guaranteed yield.",
      "For harvest and post-harvest decisions, do not invent market prices, buyer availability, guaranteed sales, or guaranteed shelf life.",
      "For harvest and post-harvest decisions, protect quality with shade, sorting, ventilation and clean containers where possible.",
      "For general agronomy, use farmer-scale field language and avoid home gardening language.",
      "For general agronomy, do not invent crop-specific facts, market prices, guaranteed yields, or pesticide or fertilizer dosages.",
      "Recognize the selected crop's aliases, group and family from cropLibraryContext when it is available.",
      "Use related-crop and crop-family patterns only as cautious context. Never turn them into a confirmed diagnosis.",
      "If crop-specific guidance is limited, continue with general crop-family guidance instead of refusing.",
      `For serious or spreading problems on valuable perennial crops, say: "${FARM_MATE_CASH_CROP_CAUTION}"`,
      "Do not invent pesticide or fertilizer dosage, yield, profit, market price, buyer demand, or buyer availability.",
      "For general agronomy, use the exact headings What I think:, What to do now:, optional What to check:, and Next step:.",
      "For general agronomy, include no more than three actions, no more than two checks, and exactly one next step.",
      "For general agronomy, give useful general guidance before asking one useful follow-up question.",
      "When general agronomy crop-specific detail is missing, say: \"This depends on the crop, but the general rule is...\" and continue with approved general guidance.",
      "For an unknown plant or crop, say crop-specific guidance is limited, continue with general farming principles, and ask one useful question or suggest Crop Doctor.",
      "For cassava storage, if the farmer says cassava is not harvested yet, do not frame the answer as harvested-root storage. Tell them to leave cassava in the ground until needed, plan shade or transport, and harvest only what can be moved soon.",
      "If information is still missing, ask one clear follow-up question.",
      "If Crop Doctor is the next best action, say that a clear photo will help.",
      "End with exactly one clear next step."
    ]
  };

  if (process.env.NODE_ENV === "development") {
    console.info("FarmMate OpenAI payload crop:", payload.crop ?? "none");
    console.info("FarmMate OpenAI payload intent:", input.brain.intent.intent);
    console.info("FarmMate OpenAI payload specialist:", input.brain.routerResult?.selectedSpecialist ?? "none");
    console.info("FarmMate OpenAI payload flow crop/context:", input.brain.flow?.requiredInformation.crop ?? "none");
    console.info("FarmMate OpenAI payload decision flow:", input.brain.flow?.id ?? "fallback");
  }

  return JSON.stringify(payload, null, 2);
}

export async function generateFarmMateNaturalAnswer(input: FarmMateAiInput): Promise<FarmMateAiResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return { ok: false, reason: "missing_api_key", fallback: true };
  }

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
        instructions: FARM_MATE_SYSTEM_PROMPT,
        input: buildFarmMateVoiceLayerInput(input),
        max_output_tokens: 420
      })
    });

    if (!response.ok) {
      return { ok: false, reason: "openai_request_error", fallback: true };
    }

    const data = (await response.json()) as OpenAIResponsesApiResult;
    const answer = extractOutputText(data);

    if (!answer) {
      return { ok: false, reason: "empty_response", fallback: true };
    }

    if (isLikelyIncompleteFarmMateAnswer(answer, input)) {
      return { ok: false, reason: "incomplete_response", fallback: true };
    }

    return { ok: true, answer };
  } catch {
    return { ok: false, reason: "openai_request_error", fallback: true };
  }
}
