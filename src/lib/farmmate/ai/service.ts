import { FARM_MATE_SYSTEM_PROMPT } from "./system-prompt";
import type { FarmMateAiInput, FarmMateAiResult } from "./types";
import { findFertilizerGuidance } from "../fertilizer-specialist";
import { findPlantingAdvisorGuidance } from "../planting-advisor-specialist";
import { findHarvestPostHarvestGuidance } from "../harvest-postharvest-specialist";
import { findWeatherDecisionGuidance, weatherTaskFromQuestion } from "../weather-decision-specialist";

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
  const payload = {
    instruction:
      "Rewrite the local FarmMate Brain response into a short, natural answer. Do not add facts, prices, pesticide dosages, diagnoses, or recommendations that are not present in this context.",
    farmerQuestion: input.farmerQuestion,
    detectedIntent: input.brain.intent,
    crop,
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
      "For unsure rain answers, say: \"Don't spray yet. First confirm whether rain is expected in the next 4 to 6 hours. Spray only when leaves are dry and wind is calm.\"",
      "For rain expected answers, say: \"Do not spray now. Wait until after the rain and spray only when leaves are dry and wind is calm.\"",
      "For clear spray conditions, say: \"Spraying may be suitable. Follow the product label and avoid spraying during hot midday sun.\"",
      "For planting decisions, do not invent exact local weather, seed availability, market prices, guaranteed profit, or guaranteed yield.",
      "For harvest and post-harvest decisions, do not invent market prices, buyer availability, guaranteed sales, or guaranteed shelf life.",
      "For harvest and post-harvest decisions, protect quality with shade, sorting, ventilation and clean containers where possible.",
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
