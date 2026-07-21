"use client";

import Link from "next/link";
import { Bot, Camera, Loader2, Send } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { buildFarmMateResponse, FarmMateBrainResponse } from "@/lib/farmmate/decision-engine";
import type { CropDoctorHandoffContext } from "@/lib/farmmate/crop-doctor-vision";
import type { FarmMateAskApiResponse, FarmMateLocalResponseCard } from "@/lib/farmmate/ai/types";
import {
  consultationContextForApi,
  continueAskFarmMateConsultation,
  createAskFarmMateConsultation,
  createFarmMateConsultationId,
  shouldShowFarmMateFinalControls,
  type AskFarmMateConsultationState,
  type FarmMateConsultationAnswer
} from "@/lib/farmmate/consultation";
import { createConversationStateUpdate, manageFarmMateConversation, type ConversationDecision, type ConversationState } from "@/lib/farmmate/conversation-manager";
import {
  cleanFarmMateFinalAnswer,
  compactFollowUpSummary,
  farmMateFallbackMessage,
  generalAgronomyRecommendationCards,
  harvestPostHarvestGuidedRecommendationCards,
  shouldCompleteWeatherGuidedFlow,
  shouldShowGeneralAgronomyGuidanceBeforeFollowUp,
  shouldRenderLocalFarmMateGuidance,
  weatherGuidedRecommendationCards
} from "@/lib/farmmate/conversation-ui";
import { routeFarmMateQuestion, type RouterResult } from "@/lib/farmmate/router";
import { farmMateCreditLine, getFarmMateAnonymousDeviceId } from "@/lib/farmmate/usage/client";
import { askFarmMateCreditMessage, FARM_MATE_FEEDBACK_CTA, type FarmMateCreditStatus } from "@/lib/farmmate/usage";
import { FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY, type WeatherDecisionSummary } from "@/lib/farmmate/weather";
import { GENERAL_AGRONOMY_UNKNOWN_CROP_NOTE } from "@/lib/farmmate/general-agronomy-specialist";
import { FarmMateAnswerFeedback } from "@/components/FarmMateAnswerFeedback";
import {
  farmMateAnswerSnippet,
  farmMateCleanAnswerForCopy,
  shouldShowFarmMateAnswerFeedback
} from "@/lib/farmmate/answer-feedback";

const suggestions = [
  "Can I spray today?",
  "My tomato leaves are yellow",
  "Best fertilizer for maize",
  "Can I plant tomatoes now?",
  "When should I harvest maize?",
  "How do I store cassava?",
  "How do I pack tomatoes for transport?",
  "How do I improve seed germination?",
  "What should I check from my crop photo?"
];

type FollowUpAnswer = FarmMateConsultationAnswer;

type PendingContinuationRetry = {
  farmMateResponse: FarmMateBrainResponse;
  nextConsultation: AskFarmMateConsultationState;
  followUpAnswer: FarmMateConsultationAnswer;
};

function sectionBody(response: FarmMateBrainResponse, title: string) {
  return response.sections.find((section) => section.title === title)?.body ?? [];
}

function conversationalOption(questionId: string, option: string) {
  const optionLabels: Record<string, Record<string, string>> = {
    "rain-window": {
      "Yes, rain is expected": "Rain is expected soon",
      "Yes, rain is expected soon": "Rain is expected soon",
      "No rain expected": "No rain expected soon",
      "No rain expected soon": "No rain expected soon",
      "I am not sure": "I am not sure about rain"
    },
    "leaf-wetness": {
      "Yes, leaves are dry": "Leaves are dry",
      "No, leaves are wet": "Leaves are wet",
      "I am not sure": "I am not sure if leaves are dry"
    },
    "wind-level": {
      "Yes, wind is calm": "Wind is calm",
      "No, it is windy": "Wind is strong",
      "I am not sure": "I am not sure about the wind"
    },
    "pepper-insects": {
      Yes: "I can see insects",
      No: "I cannot see insects",
      "Not sure": "I am not sure if insects are present"
    },
    "pepper-fertilizer": {
      Yes: "Fertilizer was applied recently",
      No: "No recent fertilizer",
      "Not sure": "I am not sure about fertilizer"
    },
    "maize-leaf-colour": {
      "Pale yellow": "Older leaves are pale yellow",
      Purple: "Older leaves are purple",
      "Still green": "Older leaves are dark green"
    },
    "maize-waterlogging": {
      Dry: "The plot has been dry",
      "Flooded or waterlogged": "The plot was flooded or waterlogged",
      Neither: "No recent dryness or waterlogging"
    },
    "maize-pest-damage": {
      Yes: "I can see whorl damage",
      No: "No whorl damage seen",
      "Not sure": "I am not sure about whorl damage"
    },
    "maize-fertilizer-stage": {
      "Less than 2 weeks": "Maize is less than 2 weeks old",
      "2 to 4 weeks": "Maize is 2 to 4 weeks old",
      "More than 4 weeks": "Maize is more than 4 weeks old",
      "Already flowering": "Maize is already flowering"
    },
    "pepper-fertilizer-stage": {
      Seedling: "Pepper is at seedling stage",
      "Vegetative growth": "Pepper is growing leaves",
      Flowering: "Pepper is flowering",
      Fruiting: "Pepper is fruiting"
    },
    "tomato-compost-stage": {
      "Before planting": "Tomatoes are not planted yet",
      Seedling: "Tomatoes are seedlings",
      Flowering: "Tomatoes are flowering",
      Fruiting: "Tomatoes are fruiting"
    },
    "fertilizer-rain-moisture": {
      "Soil is moist": "Soil is moist",
      "Soil is dry": "Soil is dry",
      "Soil is waterlogged": "Soil is waterlogged",
      "Heavy rain expected soon": "Heavy rain is expected soon"
    },
    "fertilizer-already-applied": {
      "No fertilizer yet": "No fertilizer has been applied yet",
      "Compost or manure applied": "Compost or manure was applied",
      "NPK or urea applied": "NPK or urea was applied",
      "Not sure": "I am not sure what was applied"
    },
    "compost-readiness": {
      "Well-rotted": "The compost is well-rotted",
      "Still hot or fresh": "The compost is still hot or fresh",
      "Not sure": "I am not sure if the compost is ready"
    },
    "after-rain-soil-state": {
      "Moist but not flooded": "Soil is moist but not flooded",
      "Still waterlogged": "Soil is still waterlogged",
      "Dry again": "Soil is dry again",
      "Not sure": "I am not sure about the soil"
    },
    "rain-forecast-fertilizer": {
      Yes: "More heavy rain is expected",
      No: "No more heavy rain expected",
      "Not sure": "I am not sure about rain"
    },
    "fertilizer-crop-stage": {
      "Young crop": "The crop is still young",
      "Vegetative growth": "The crop is growing leaves",
      "Flowering or fruiting": "The crop is flowering or fruiting",
      "Not sure": "I am not sure about the stage"
    },
    "crop-doctor-pest-under-leaves": {
      "Yes, I see tiny insects or webbing": "I see tiny insects or webbing under the leaves",
      "No, I do not see them": "I do not see tiny insects or webbing under the leaves",
      "I am not sure": "I am not sure if there are insects or webbing"
    },
    "crop-doctor-pest-spread": {
      "Yes, many leaves are affected": "Many leaves show the same signs",
      "Only a few leaves are affected": "Only a few leaves show the signs",
      "I am not sure": "I am not sure if the signs are spreading"
    },
    "crop-doctor-leaf-spread": {
      "Yes, nearby plants are affected": "Nearby plants show the same signs",
      "No, only a few leaves": "Only a few leaves show the signs",
      "I am not sure": "I am not sure if nearby plants are affected"
    },
    "crop-doctor-recent-rain": {
      "Yes, after rain or wet leaves": "The problem appeared after rain or wet leaves",
      "No recent rain": "There has not been recent rain",
      "I am not sure": "I am not sure about recent rain"
    }
  };

  return optionLabels[questionId]?.[option] ?? option;
}

function cleanGuidance(line: string) {
  return line
    .replace("Tell FarmMate", "Share")
    .replace("Tell the farmer", "Use this guidance")
    .replace("Do not invent product rates. ", "")
    .replace("refer to product labels or extension officers", "follow the product label or ask an extension officer");
}

function learnedSummary(response: FarmMateBrainResponse, answers: FollowUpAnswer[]) {
  const crop = response.flow?.requiredInformation.crop ?? response.intent.cropName;
  const summary = [
    ...(crop ? [`Crop: ${crop}`] : []),
    ...answers.map((answer) => answer.answer)
  ];

  return summary.length ? summary.slice(0, 4) : ["FarmMate has enough information to give a first recommendation."];
}

function answerInsights(answers: FollowUpAnswer[]) {
  const insightsByAnswer: Record<string, string> = {
    "Bottom leaves": "Since the yellowing starts at the bottom, water stress, nitrogen shortage or early disease are more likely.",
    "Top leaves": "Since the yellowing starts at the top, check the newest growth and soil condition before treating.",
    Everywhere: "Since the yellowing is everywhere, the whole plant may be under stress.",
    "Brown spots or rings": "Since you see spots or rings, early blight is possible.",
    "Curling or insects": "Since you see curling or insects, pest pressure may be involved.",
    "No, just yellow": "Since the leaves are only yellow, nutrient or water stress may be more likely than leaf disease.",
    "Heavy rain": "Since there has been heavy rain, excess moisture or nutrient leaching may be involved.",
    "Daily watering": "Since the crop is watered daily, excess water may be stressing the roots.",
    "Very hot or dry": "Since it has been very hot or dry, flower drop may be stress-related.",
    "Irregular watering": "Since watering has been irregular, pepper flowers may drop from stress.",
    "Rain is expected soon": "Since rain is expected soon, spraying should wait.",
    "No rain expected soon": "Since no rain is expected soon, rain wash-off is less likely.",
    "Leaves are dry": "Since the leaves are dry, leaf wetness is not the main concern.",
    "Leaves are wet": "Since the leaves are wet, wait before spraying.",
    "Wind is calm": "Since the wind is calm, wind drift is less likely.",
    "Wind is strong": "Since the wind is strong, spraying can drift away from the crop.",
    "I can see insects": "Since you can see insects, pest pressure may be involved.",
    "I cannot see insects": "Since you cannot see insects, pests are less likely but still scout nearby plants.",
    "Fertilizer was applied recently": "Since fertilizer was applied recently, avoid adding more until you inspect the crop.",
    "No recent fertilizer": "Since no fertilizer was applied recently, nutrient stress may be possible.",
    "Older leaves are pale yellow": "Since older leaves are pale yellow, nitrogen shortage is more likely.",
    "Older leaves are purple": "Since older leaves are purple, early root or phosphorus stress may be worth checking.",
    "Older leaves are dark green": "Since older leaves are dark green, nutrient shortage is less obvious.",
    "The plot has been dry": "Since the plot has been dry, moisture stress may be part of the problem.",
    "The plot was flooded or waterlogged": "Since the plot was flooded or waterlogged, root stress may be part of the problem.",
    "No recent dryness or waterlogging": "Since there has been no recent dryness or waterlogging, water stress is less likely.",
    "I can see whorl damage": "Since you can see whorl damage, check closely for fall armyworm.",
    "No whorl damage seen": "Since you saw no whorl damage, fall armyworm is less likely.",
    "Maize is less than 2 weeks old": "Since the maize is still very young, focus on establishment and avoid burning the crop with poorly placed fertilizer.",
    "Maize is 2 to 4 weeks old": "Since the maize is actively growing, feeding decisions depend on moisture and what has already been applied.",
    "Maize is more than 4 weeks old": "Since the maize is older, avoid guessing fertilizer needs without checking crop condition.",
    "Maize is already flowering": "Since the maize is already flowering, avoid late unnecessary fertilizer spending.",
    "Soil is moist": "Since the soil is moist, fertilizer is safer than on dry or waterlogged soil.",
    "Soil is dry": "Since the soil is dry, wait for moisture before applying fertilizer.",
    "Soil is waterlogged": "Since the soil is waterlogged, wait before applying fertilizer.",
    "Heavy rain is expected soon": "Since heavy rain is expected soon, do not apply fertilizer now.",
    "No fertilizer has been applied yet": "Since no fertilizer has been applied yet, choose the next feeding step based on crop stage.",
    "Compost or manure was applied": "Since compost or manure was applied, avoid adding more inputs until you check crop response.",
    "NPK or urea was applied": "Since NPK or urea was applied, avoid repeating fertilizer without checking the crop.",
    "The compost is well-rotted": "Since the compost is well-rotted, it is safer to use than fresh organic material.",
    "The compost is still hot or fresh": "Since the compost is fresh or hot, do not place it close to tomato roots."
  };

  return answers
    .map((answer) => insightsByAnswer[answer.answer])
    .filter((insight): insight is string => Boolean(insight))
    .slice(0, 2);
}

function conciseLines(lines: string[], limit: number) {
  return lines.map(cleanGuidance).filter(Boolean).slice(0, limit);
}

function marketplaceInfoResponse(): FarmMateLocalResponseCard[] {
  return [
    {
      title: "What I think",
      body: ["You can buy produce through Ghana Growers by joining the buyer network or contacting Ghana Growers directly."]
    },
    {
      title: "What to do now",
      body: ["Soon, FarmMate will connect buyers to available produce through the marketplace."]
    },
    {
      title: "Next step",
      body: ["Open the buyer network or contact Ghana Growers to request what you need."]
    }
  ];
}

function clarificationResponse(): FarmMateLocalResponseCard[] {
  return [
    {
      title: "What I think",
      body: ["I need a little more context before I can help."]
    },
    {
      title: "What to do now",
      body: ["Ask a full question, or tell me the crop and what you are seeing on the farm."]
    },
    {
      title: "Next step",
      body: ["Send one clear sentence about what you need help with."]
    }
  ];
}

function weatherContextIntro(response?: FarmMateBrainResponse | null) {
  const weatherContext = response?.weatherContext;

  if (!weatherContext?.liveWeatherAvailable || response?.flow?.intent !== "weather-decisions") {
    return null;
  }

  const lead =
    typeof weatherContext.rainChancePercent === "number"
      ? `FarmMate is seeing a ${weatherContext.rainChancePercent}% chance of rain today for ${weatherContext.locationName}.`
      : `FarmMate has live weather for ${weatherContext.locationName}.`;

  return {
    lead,
    detail: "Because this is a daily forecast, confirm the next few hours before spraying."
  };
}

function responseIntro(localCards: FarmMateLocalResponseCard[], showRecommendation: boolean, response?: FarmMateBrainResponse | null) {
  if (localCards.some((card) => card.body.some((line) => line.toLowerCase().includes("buy produce")))) {
    return {
      lead: "Buying through Ghana Growers",
      detail: "This is separate from crop health advice."
    };
  }

  if (localCards.length) {
    return {
      lead: "Send one clear question.",
      detail: "Send one full sentence so I can route it properly."
    };
  }

  if (showRecommendation) {
    return {
      lead: "",
      detail: ""
    };
  }

  const weatherIntro = weatherContextIntro(response);

  if (weatherIntro) {
    return weatherIntro;
  }

  if (!showRecommendation && response?.flow?.id.startsWith("general-agronomy-") && response.flow.followUpQuestions.length > 0) {
    return {
      lead: "",
      detail: ""
    };
  }

  if (response?.flow?.id === "general-agronomy-unknown-crop") {
    return {
      lead: GENERAL_AGRONOMY_UNKNOWN_CROP_NOTE,
      detail: "Choose the closest goal below."
    };
  }

  return {
    lead: "Let's narrow this down.",
    detail: "I will ask one quick question at a time."
  };
}

function localRecommendationCards(response: FarmMateBrainResponse, answers: FollowUpAnswer[]): FarmMateLocalResponseCard[] {
  const generalAgronomyCards = generalAgronomyRecommendationCards(response);

  if (generalAgronomyCards) {
    return generalAgronomyCards.map((card) => ({
      ...card,
      body: conciseLines(card.body, card.title === "What to check" ? 2 : card.title === "Next step" || card.title === "What I think" ? 1 : 3)
    }));
  }

  const weatherCards = weatherGuidedRecommendationCards(response.flow?.id, answers, response.weatherContext);

  if (weatherCards) {
    return weatherCards;
  }

  const harvestPostHarvestCards = harvestPostHarvestGuidedRecommendationCards(response.flow?.id, answers);

  if (harvestPostHarvestCards) {
    return [
      {
        title: "Here's what I understand",
        body: learnedSummary(response, answers)
      },
      ...harvestPostHarvestCards
    ];
  }

  return [
    {
      title: "Here's what I understand",
      body: learnedSummary(response, answers)
    },
    {
      title: "What I think",
      body: conciseLines([...answerInsights(answers), ...sectionBody(response, "Direct answer").slice(0, 1), ...sectionBody(response, "Why this may happen")], 3)
    },
    {
      title: "What to do now",
      body: conciseLines([...sectionBody(response, "Recommended action"), ...sectionBody(response, "Prevention").slice(0, 2)], 3)
    },
    {
      title: "What to check",
      body: conciseLines(sectionBody(response, "What to check"), 2)
    },
    {
      title: "Next step",
      body: conciseLines(sectionBody(response, "Next Best Action"), 1)
    }
  ];
}

function logRouterResult(routerResult: RouterResult) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("FarmMate Router selected:", routerResult.selectedSpecialist);
  console.info("FarmMate Router confidence:", routerResult.confidence);
}

function logBrainContext(question: string, response: FarmMateBrainResponse) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("FarmMate current user question:", question);
  console.info("FarmMate detected crop:", response.resolvedCrop ?? "none");
  console.info("FarmMate selected specialist:", response.routerResult?.selectedSpecialist ?? "none");
  console.info("FarmMate selected decision flow crop/context:", response.flow?.requiredInformation.crop ?? "none");
  console.info("FarmMate weather context:", response.weatherContext?.locationName ?? "none");
}

function logConversationDecision(message: string, state: ConversationState, decision: ConversationDecision, selectedSpecialist?: string) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("FarmMate incoming message:", message);
  console.info("FarmMate active topic:", state.activeTopic ?? "none");
  console.info("FarmMate conversation decision:", decision.action);
  console.info("FarmMate reset reason:", decision.resetReason ?? "none");
  console.info("FarmMate selected specialist:", selectedSpecialist ?? decision.specialist ?? "none");
}

function storedWeatherContextForFarmMate(): WeatherDecisionSummary | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const stored = window.localStorage.getItem(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as Partial<WeatherDecisionSummary>) : null;
    const updatedAt = Date.parse(parsed?.lastUpdatedAt ?? "");
    const weatherContextAgeMs = Date.now() - updatedAt;

    if (
      !parsed?.liveWeatherAvailable ||
      !parsed.locationName ||
      !Array.isArray(parsed.farmingNotes) ||
      !Number.isFinite(updatedAt) ||
      weatherContextAgeMs < -5 * 60 * 1_000 ||
      weatherContextAgeMs > 24 * 60 * 60 * 1_000
    ) {
      return undefined;
    }

    return parsed as WeatherDecisionSummary;
  } catch {
    return undefined;
  }
}

function askCreditFailureMessage(reason?: string, credits?: FarmMateCreditStatus | null) {
  if (reason === "usage_tracking_unavailable") {
    return "FarmMate is temporarily unavailable because your credit could not be checked. Please try again shortly.";
  }

  if (reason === "credits_exhausted" || reason === "rapid_submission") {
    return askFarmMateCreditMessage({
      reason,
      refreshInText: credits?.refreshInText ?? "soon"
    });
  }

  return "FarmMate could not start this consultation. Your question is still here, so you can try again.";
}

export function AskFarmMate({
  prefillQuestion,
  cropDoctorHandoff,
  onOpenCropDoctor
}: {
  prefillQuestion?: string;
  cropDoctorHandoff?: CropDoctorHandoffContext | null;
  onOpenCropDoctor?: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [askedQuestion, setAskedQuestion] = useState("");
  const [response, setResponse] = useState<FarmMateBrainResponse | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [followUpIndex, setFollowUpIndex] = useState(0);
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswer[]>([]);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [naturalAnswer, setNaturalAnswer] = useState("");
  const [isGeneratingNaturalAnswer, setIsGeneratingNaturalAnswer] = useState(false);
  const [localCards, setLocalCards] = useState<FarmMateLocalResponseCard[]>([]);
  const [aiFallbackMessage, setAiFallbackMessage] = useState("");
  const [credits, setCredits] = useState<FarmMateCreditStatus | null>(null);
  const [creditMessage, setCreditMessage] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [consultationError, setConsultationError] = useState("");
  const [consultation, setConsultation] = useState<AskFarmMateConsultationState | null>(null);
  const [pendingContinuationRetry, setPendingContinuationRetry] = useState<PendingContinuationRetry | null>(null);
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const activeRequestKey = useRef("");
  const consultationStartInFlight = useRef(false);
  const followUpRequestInFlight = useRef(false);
  const followUpQuestionRef = useRef<HTMLFieldSetElement | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>({
    waitingForFollowUp: false,
    turns: []
  });
  const [activeCropDoctorHandoff, setActiveCropDoctorHandoff] = useState<CropDoctorHandoffContext | null>(null);

  const canAsk =
    question.trim().length > 0 &&
    !isThinking &&
    !isGeneratingNaturalAnswer &&
    !isSubmittingFollowUp &&
    consultation?.status !== "starting";
  const followUpQuestions = response?.flow?.followUpQuestions ?? [];
  const currentFollowUp = consultation ? consultation.pendingFollowUpQuestion : followUpQuestions[followUpIndex];

  useEffect(() => {
    function handlePrefill(event: Event) {
      const customEvent = event as CustomEvent<string | CropDoctorHandoffContext>;
      if (customEvent.detail) {
        if (typeof customEvent.detail === "string") {
          setQuestion(customEvent.detail);
          setActiveCropDoctorHandoff(null);
          return;
        }

        setQuestion(customEvent.detail.question);
        setActiveCropDoctorHandoff(customEvent.detail);
      }
    }

    window.addEventListener("gg-farmmate-prefill", handlePrefill);
    return () => window.removeEventListener("gg-farmmate-prefill", handlePrefill);
  }, []);

  useEffect(() => {
    if (prefillQuestion) {
      setQuestion(prefillQuestion);
    }
  }, [prefillQuestion]);

  useEffect(() => {
    if (cropDoctorHandoff) {
      setActiveCropDoctorHandoff(cropDoctorHandoff);
      setQuestion(cropDoctorHandoff.question);
    }
  }, [cropDoctorHandoff]);

  useEffect(() => {
    if (consultation?.status === "awaiting_follow_up") {
      followUpQuestionRef.current?.focus();
    }
  }, [consultation?.pendingFollowUpQuestion?.id, consultation?.status]);

  async function refreshCredits() {
    try {
      const apiResponse = await fetch("/api/farmmate/usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          anonymousDeviceId: getFarmMateAnonymousDeviceId(),
          tool: "ask_farmmate",
          action: "status"
        })
      });
      const data = (await apiResponse.json().catch(() => null)) as { credits?: FarmMateCreditStatus } | null;

      if (data?.credits) {
        setCredits(data.credits);
      }
    } catch {
      setCredits(null);
    }
  }

  useEffect(() => {
    void refreshCredits();
  }, []);

  async function requestConsultationStep({
    farmMateResponse,
    nextConsultation,
    followUpAnswer,
    isFollowUp
  }: {
    farmMateResponse: FarmMateBrainResponse;
    nextConsultation: AskFarmMateConsultationState;
    followUpAnswer?: FarmMateConsultationAnswer;
    isFollowUp: boolean;
  }) {
    const awaitingFollowUp = Boolean(nextConsultation.pendingFollowUpQuestion);
    const requestKey = `${nextConsultation.consultationId}-${nextConsultation.answerHistory.length}-${Date.now()}`;
    activeRequestKey.current = requestKey;
    setNaturalAnswer("");
    setAiFallbackMessage("");
    setCreditMessage("");
    setConsultationError("");
    if (isFollowUp) {
      setPendingContinuationRetry(null);
    }
    setIsGeneratingNaturalAnswer(!awaitingFollowUp);
    setIsSubmittingFollowUp(isFollowUp);

    try {
      const apiResponse = await fetch("/api/farmmate/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          anonymousDeviceId: getFarmMateAnonymousDeviceId(),
          consultationId: nextConsultation.consultationId,
          consultationToken: nextConsultation.consultationToken,
          originalQuestion: nextConsultation.originalQuestion,
          followUpAnswer,
          consultationContext: consultationContextForApi(nextConsultation),
          isFollowUp,
          deferAnswer: awaitingFollowUp,
          farmerQuestion: nextConsultation.originalQuestion,
          brain: farmMateResponse,
          farmerAnswers: nextConsultation.answerHistory.map(({ question, answer }) => ({ question, answer })),
          localStructuredResponse: localRecommendationCards(farmMateResponse, nextConsultation.answerHistory)
        })
      });
      const data = (await apiResponse.json().catch(() => null)) as FarmMateAskApiResponse | null;

      if (activeRequestKey.current !== requestKey) {
        return false;
      }

      if (data?.credits) {
        setCredits(data.credits);
      }

      if (!apiResponse.ok) {
        const reason = typeof data?.reason === "string" ? data.reason : "";
        const canRetryContinuation =
          isFollowUp &&
          Boolean(followUpAnswer) &&
          (reason === "usage_tracking_unavailable" || reason === "consultation_tracking_unavailable");
        setCreditReason(reason);
        setConsultationError(
          reason === "usage_tracking_unavailable"
            ? askCreditFailureMessage(reason, data?.credits)
            : data?.message || askCreditFailureMessage(reason, data?.credits)
        );
        if (canRetryContinuation && followUpAnswer) {
          setPendingContinuationRetry({ farmMateResponse, nextConsultation, followUpAnswer });
          setConsultation({ ...nextConsultation, status: "error" });
        } else {
          setConsultation({
            ...nextConsultation,
            pendingFollowUpQuestion: undefined,
            followUpOptions: undefined,
            status: data?.reason === "credits_exhausted" ? "exhausted" : "error"
          });
          setQuestion(nextConsultation.originalQuestion);
        }
        setConversationState((current) => ({ ...current, waitingForFollowUp: false }));
        setShowRecommendation(false);
        return false;
      }

      if (data?.ok && data.kind === "follow_up" && data.followUp && data.consultationToken) {
        const pendingIndex = farmMateResponse.flow?.followUpQuestions.findIndex((item) => item.id === data.followUp?.id) ?? -1;

        if (pendingIndex >= 0) {
          setFollowUpIndex(pendingIndex);
        }
        setConsultation({
          ...nextConsultation,
          consultationToken: data.consultationToken,
          pendingFollowUpQuestion: data.followUp,
          followUpOptions: data.followUp.options,
          status: "awaiting_follow_up"
        });
        setConversationState((current) => ({ ...current, waitingForFollowUp: true }));
        setShowRecommendation(false);
        return true;
      }

      const completedConsultation: AskFarmMateConsultationState = {
        ...nextConsultation,
        consultationToken: undefined,
        pendingFollowUpQuestion: undefined,
        followUpOptions: undefined,
        status: "complete"
      };
      setConsultation(completedConsultation);
      setConversationState((current) => ({ ...current, waitingForFollowUp: false }));
      setShowRecommendation(true);

      if (data?.ok && data.kind === "final" && data.answer?.trim()) {
        setNaturalAnswer(cleanFarmMateFinalAnswer(data.answer));
        return true;
      }

      if (data?.fallback) {
        setAiFallbackMessage(farmMateFallbackMessage(data.message));
      }
      return Boolean(data?.fallback);
    } catch {
      if (activeRequestKey.current !== requestKey) {
        return false;
      }
      setNaturalAnswer("");
      if (isFollowUp && followUpAnswer) {
        setConsultationError("FarmMate could not continue this follow-up. Try it again without using another credit.");
        setPendingContinuationRetry({ farmMateResponse, nextConsultation, followUpAnswer });
        setConsultation({ ...nextConsultation, status: "error" });
      } else {
        setConsultationError("FarmMate could not start this consultation. Your question is still here, so you can try again.");
        setConsultation({
          ...nextConsultation,
          pendingFollowUpQuestion: undefined,
          followUpOptions: undefined,
          status: "error"
        });
        setQuestion(nextConsultation.originalQuestion);
      }
      setConversationState((current) => ({ ...current, waitingForFollowUp: false }));
      setShowRecommendation(false);
      return false;
    } finally {
      if (isFollowUp) {
        followUpRequestInFlight.current = false;
      } else {
        consultationStartInFlight.current = false;
      }
      if (activeRequestKey.current === requestKey) {
        setIsGeneratingNaturalAnswer(false);
        setIsSubmittingFollowUp(false);
      }
    }
  }

  async function completeLocalConsultation({
    originalQuestion,
    specialist,
    cards,
    conversationDecision
  }: {
    originalQuestion: string;
    specialist?: ConversationDecision["specialist"];
    cards: FarmMateLocalResponseCard[];
    conversationDecision: ConversationDecision;
  }) {
    const localConsultation = createAskFarmMateConsultation({
      consultationId: createFarmMateConsultationId(crypto.randomUUID()),
      originalQuestion,
      specialist
    });
    const requestKey = `${localConsultation.consultationId}-local-${Date.now()}`;
    activeRequestKey.current = requestKey;
    setConsultation({ ...localConsultation, status: "starting" });
    setIsThinking(false);

    try {
      const apiResponse = await fetch("/api/farmmate/usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          anonymousDeviceId: getFarmMateAnonymousDeviceId(),
          tool: "ask_farmmate",
          action: "record"
        })
      });
      const data = (await apiResponse.json().catch(() => null)) as {
        ok?: boolean;
        reason?: string;
        credits?: FarmMateCreditStatus;
      } | null;

      if (activeRequestKey.current !== requestKey) {
        return;
      }

      if (data?.credits) {
        setCredits(data.credits);
      }

      if (!apiResponse.ok || !data?.ok) {
        const reason = typeof data?.reason === "string" ? data.reason : "";
        setCreditReason(reason);
        setConsultationError(askCreditFailureMessage(reason, data?.credits));
        setConsultation({
          ...localConsultation,
          status: reason === "credits_exhausted" ? "exhausted" : "error"
        });
        setQuestion(originalQuestion);
        return;
      }

      setLocalCards(cards);
      setConsultation({ ...localConsultation, status: "complete" });
      setShowRecommendation(true);
      setConversationState(createConversationStateUpdate(conversationState, originalQuestion, conversationDecision, false));
    } catch {
      if (activeRequestKey.current !== requestKey) {
        return;
      }

      setConsultationError("FarmMate could not start this consultation. Your question is still here, so you can try again.");
      setConsultation({ ...localConsultation, status: "error" });
      setQuestion(originalQuestion);
    } finally {
      consultationStartInFlight.current = false;
    }
  }

  async function retryPendingFollowUp() {
    if (!pendingContinuationRetry || isSubmittingFollowUp || followUpRequestInFlight.current) {
      return;
    }

    const retry = pendingContinuationRetry;
    followUpRequestInFlight.current = true;
    setResponse(retry.farmMateResponse);
    setConsultation({ ...retry.nextConsultation, status: "submitting_follow_up" });
    setConsultationError("");
    setShowRecommendation(false);

    await requestConsultationStep({
      farmMateResponse: retry.farmMateResponse,
      nextConsultation: retry.nextConsultation,
      followUpAnswer: retry.followUpAnswer,
      isFollowUp: true
    });
  }

  function askFarmMate(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const trimmedQuestion = question.trim();
    if (
      !trimmedQuestion ||
      isThinking ||
      isGeneratingNaturalAnswer ||
      isSubmittingFollowUp ||
      consultationStartInFlight.current
    ) {
      return;
    }

    const handoffContext = activeCropDoctorHandoff?.question === trimmedQuestion ? activeCropDoctorHandoff : null;
    const conversationDecision = manageFarmMateConversation(trimmedQuestion, conversationState, handoffContext ?? undefined);

    if (conversationState.waitingForFollowUp && currentFollowUp) {
      const selectedOption = (currentFollowUp.options ?? []).find(
        (option) =>
          option.toLowerCase() === trimmedQuestion.toLowerCase() ||
          conversationalOption(currentFollowUp.id, option).toLowerCase() === trimmedQuestion.toLowerCase()
      );

      if (selectedOption) {
        logConversationDecision(trimmedQuestion, conversationState, conversationDecision, conversationDecision.specialist);
        void answerFollowUp(selectedOption);
        setQuestion("");
        return;
      }
    }

    consultationStartInFlight.current = true;
    activeRequestKey.current = `reset-${Date.now()}`;
    setAskedQuestion(trimmedQuestion);
    setResponse(null);
    setFollowUpIndex(0);
    setFollowUpAnswers([]);
    setShowRecommendation(false);
    setNaturalAnswer("");
    setIsGeneratingNaturalAnswer(false);
    setLocalCards([]);
    setAiFallbackMessage("");
    setCreditMessage("");
    setCreditReason("");
    setConsultationError("");
    setPendingContinuationRetry(null);
    setConsultation(null);
    setIsThinking(true);
    setQuestion("");
    setActiveCropDoctorHandoff(null);

    const routerResult = routeFarmMateQuestion(trimmedQuestion, handoffContext ?? undefined);
    logConversationDecision(trimmedQuestion, conversationState, conversationDecision, routerResult.selectedSpecialist);
    logRouterResult(routerResult);
    const previousCropName = conversationDecision.shouldKeepContext && !routerResult.detectedCrop ? conversationState.activeCropName : undefined;

    if (conversationDecision.action === "clarify") {
      void completeLocalConsultation({
        originalQuestion: trimmedQuestion,
        specialist: conversationDecision.specialist,
        cards: clarificationResponse(),
        conversationDecision
      });
      return;
    }

    if (conversationDecision.isMarketplaceInfoRequest) {
      void completeLocalConsultation({
        originalQuestion: trimmedQuestion,
        specialist: conversationDecision.specialist,
        cards: marketplaceInfoResponse(),
        conversationDecision
      });
      return;
    }

    const farmMateResponse = buildFarmMateResponse(trimmedQuestion, routerResult, {
      previousCropName,
      cropDoctorContext: handoffContext ?? undefined,
      weatherContext: routerResult.selectedSpecialist === "weather_decision" ? storedWeatherContextForFarmMate() : undefined
    });
    const pendingFollowUpQuestion = farmMateResponse.flow?.followUpQuestions[0];
    const shouldShowRecommendation = !pendingFollowUpQuestion;
    const nextConsultation = createAskFarmMateConsultation({
      consultationId: createFarmMateConsultationId(crypto.randomUUID()),
      originalQuestion: trimmedQuestion,
      specialist: routerResult.selectedSpecialist,
      normalizedCrop: farmMateResponse.resolvedCrop,
      pendingFollowUpQuestion
    });

    logBrainContext(trimmedQuestion, farmMateResponse);
    setResponse(farmMateResponse);
    setConsultation(nextConsultation);
    setShowRecommendation(shouldShowRecommendation);
    setConversationState(
      createConversationStateUpdate(
        conversationState,
        trimmedQuestion,
        {
          ...conversationDecision,
          cropName: farmMateResponse.resolvedCrop ?? conversationDecision.cropName,
          specialist: routerResult.selectedSpecialist
        },
        Boolean(pendingFollowUpQuestion)
      )
    );
    setIsThinking(false);
    void requestConsultationStep({
      farmMateResponse,
      nextConsultation,
      isFollowUp: false
    });
  }

  async function answerFollowUp(selectedOption: string) {
    if (
      !currentFollowUp ||
      !consultation ||
      consultation.status !== "awaiting_follow_up" ||
      !response ||
      isSubmittingFollowUp ||
      followUpRequestInFlight.current
    ) {
      return;
    }

    followUpRequestInFlight.current = true;
    const displayedAnswer = conversationalOption(currentFollowUp.id, selectedOption);
    const provisionalConsultation = continueAskFarmMateConsultation(
      consultation,
      currentFollowUp,
      selectedOption,
      displayedAnswer
    );
    let nextResponse = response;
    let nextFollowUpQuestion = undefined;
    let nextFollowUpIndex = followUpIndex + 1;

    if (response.flow?.id === "plant-melon-clarification" && selectedOption === "Watermelon") {
      const watermelonQuestion = "How do I plant watermelon?";
      const watermelonResponse = buildFarmMateResponse(watermelonQuestion, routeFarmMateQuestion(watermelonQuestion));

      nextResponse = watermelonResponse;
      nextFollowUpIndex = 0;
      nextFollowUpQuestion = watermelonResponse.flow?.followUpQuestions[0];
    } else {
      const shouldCompleteWeatherFlow = shouldCompleteWeatherGuidedFlow(
        response.flow?.id,
        provisionalConsultation.answerHistory
      );

      if (!shouldCompleteWeatherFlow && nextFollowUpIndex < followUpQuestions.length) {
        nextFollowUpQuestion = followUpQuestions[nextFollowUpIndex];
      }
    }

    const nextConsultation = continueAskFarmMateConsultation(
      consultation,
      currentFollowUp,
      selectedOption,
      displayedAnswer,
      nextFollowUpQuestion
    );
    const submittingConsultation: AskFarmMateConsultationState = {
      ...nextConsultation,
      normalizedCrop: nextResponse.resolvedCrop ?? nextConsultation.normalizedCrop,
      selectedCrop: nextResponse.resolvedCrop ?? nextConsultation.selectedCrop,
      status: "submitting_follow_up"
    };
    const currentAnswer = submittingConsultation.answerHistory[submittingConsultation.answerHistory.length - 1];

    setResponse(nextResponse);
    setFollowUpIndex(nextFollowUpIndex);
    setFollowUpAnswers(submittingConsultation.answerHistory);
    setConsultation(submittingConsultation);
    setShowRecommendation(false);
    setConversationState((current) => ({
      ...current,
      activeTopic: nextResponse.flow?.intent === "planting" ? "planting" : current.activeTopic,
      activeCropName: nextResponse.resolvedCrop ?? current.activeCropName,
      activeSpecialist: nextResponse.routerResult?.selectedSpecialist ?? current.activeSpecialist,
      waitingForFollowUp: Boolean(nextFollowUpQuestion)
    }));

    await requestConsultationStep({
      farmMateResponse: nextResponse,
      nextConsultation: submittingConsultation,
      followUpAnswer: currentAnswer,
      isFollowUp: true
    });
  }

  const recommendationCards = localCards.length ? localCards : response ? localRecommendationCards(response, followUpAnswers) : [];
  const intro = responseIntro(localCards, showRecommendation, response);
  const shouldShowGeneralGuidanceBeforeFollowUp = shouldShowGeneralAgronomyGuidanceBeforeFollowUp(response, showRecommendation);
  const shouldShowLocalGuidance = shouldRenderLocalFarmMateGuidance({
    isGeneratingNaturalAnswer,
    naturalAnswer,
    localCards: recommendationCards,
    aiFallbackMessage,
    isLocalOnlyResponse: localCards.length > 0
  });
  const cleanDisplayedAnswer = farmMateCleanAnswerForCopy(
    naturalAnswer,
    shouldShowLocalGuidance ? recommendationCards : []
  );
  const hasConsultationError =
    Boolean(consultationError) && (consultation?.status === "error" || consultation?.status === "exhausted");
  const shouldShowAnswerFeedback =
    shouldShowFarmMateFinalControls({
      consultation,
      finalAnswer: cleanDisplayedAnswer,
      isBusy: isThinking || isGeneratingNaturalAnswer || isSubmittingFollowUp,
      creditReason
    }) &&
    shouldShowFarmMateAnswerFeedback(cleanDisplayedAnswer, isThinking || isGeneratingNaturalAnswer);
  const completedAnswerSummary = compactFollowUpSummary(followUpAnswers);
  const shouldShowIntro =
    !hasConsultationError &&
    consultation?.status !== "starting" &&
    Boolean(intro.lead || intro.detail) &&
    (!showRecommendation || localCards.length > 0) &&
    !isGeneratingNaturalAnswer &&
    !naturalAnswer;
  const shouldShowCreditActions = creditReason === "credits_exhausted";

  return (
    <article id="assistant" className="rounded-md border border-leaf-900/10 bg-white/95 p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-3">
        <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
          <Bot size={24} aria-hidden="true" />
        </span>
        <div>
          <h2 className="gg-card-title">Ask FarmMate</h2>
          <p className="mt-1 text-xs font-bold text-ink/48">{farmMateCreditLine("ask_farmmate", credits)}</p>
        </div>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={askFarmMate}>
        <label className="grid gap-2" htmlFor="ask-farmmate-question">
          <span className="sr-only">What would you like help with today?</span>
          <textarea
            id="ask-farmmate-question"
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
              if (activeCropDoctorHandoff && event.target.value !== activeCropDoctorHandoff.question) {
                setActiveCropDoctorHandoff(null);
              }
            }}
            placeholder="Example: Why are my tomato leaves turning yellow?"
            className="gg-field min-h-36 resize-none bg-leaf-50/70 px-4 py-4 text-base leading-7 focus:bg-white"
          />
        </label>

        <div className="grid gap-2">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-ink/50">Popular questions</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0" aria-label="Suggested questions">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuestion(suggestion)}
                className="min-h-11 shrink-0 rounded-md border border-leaf-900/15 bg-white px-3 py-2 text-left text-sm font-black text-leaf-700 transition hover:border-leaf-700 hover:bg-leaf-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 sm:shrink"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!canAsk}
          className="inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-leaf-900 disabled:cursor-not-allowed disabled:bg-ink/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
        >
          {isThinking ? <Loader2 className="animate-spin" size={20} aria-hidden="true" /> : <Send size={20} aria-hidden="true" />}
          Ask FarmMate
        </button>
      </form>

      <div className="mt-5 space-y-3" aria-live="polite">
        {askedQuestion ? (
          <div className="ml-auto max-w-[92%] break-words rounded-md bg-leaf-600 px-4 py-3 text-sm font-bold leading-6 text-white [overflow-wrap:anywhere]">
            {askedQuestion}
          </div>
        ) : null}

        {isThinking ? (
          <div className="flex max-w-[92%] items-center gap-2 rounded-md bg-leaf-50 px-4 py-3 text-sm font-black text-ink/70">
            <Loader2 className="animate-spin text-leaf-700" size={18} aria-hidden="true" />
            FarmMate is thinking...
          </div>
        ) : null}

        {response || localCards.length || consultation ? (
          <div className="min-w-0 max-w-full space-y-3 sm:max-w-[92%]">
            {consultation?.status === "starting" && !isThinking && !isGeneratingNaturalAnswer ? (
              <div className="flex min-w-0 max-w-full items-center gap-2 rounded-md bg-leaf-50 px-4 py-3 text-sm font-black text-ink/70">
                <Loader2 className="shrink-0 animate-spin text-leaf-700" size={18} aria-hidden="true" />
                FarmMate is starting your consultation...
              </div>
            ) : null}

            {hasConsultationError ? (
              <div className="min-w-0 rounded-md border border-earth-500/25 bg-earth-50 px-4 py-3">
                <p className="break-words text-sm font-bold leading-6 text-ink/68">{consultationError}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-ink/55">
                  {pendingContinuationRetry
                    ? "This stays in the same consultation and will not use another credit."
                    : "Your original question is ready above. Tap Ask FarmMate to try again."}
                </p>
                {pendingContinuationRetry ? (
                  <button
                    type="button"
                    disabled={isSubmittingFollowUp}
                    onClick={() => void retryPendingFollowUp()}
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-leaf-600 px-4 py-2 text-sm font-black text-white transition hover:bg-leaf-900 disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 sm:w-auto"
                  >
                    Try this follow-up again
                  </button>
                ) : shouldShowCreditActions ? (
                  <Link
                    href={FARM_MATE_FEEDBACK_CTA.href}
                    className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-leaf-600 px-4 py-2 text-sm font-black text-white transition hover:bg-leaf-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600 sm:w-auto"
                  >
                    {FARM_MATE_FEEDBACK_CTA.label}
                  </Link>
                ) : null}
              </div>
            ) : null}

            {shouldShowIntro ? (
              <div className="break-words rounded-md border border-leaf-900/10 bg-leaf-50 px-4 py-4 text-sm font-semibold leading-6 text-ink/76 [overflow-wrap:anywhere]">
                {intro.lead ? <p>{intro.lead}</p> : null}
                {intro.detail ? <p className={intro.lead ? "mt-2" : ""}>{intro.detail}</p> : null}
              </div>
            ) : null}

            {shouldShowGeneralGuidanceBeforeFollowUp && !hasConsultationError && consultation?.status !== "starting" ? (
              <div className="space-y-3">
                {recommendationCards.map((card) => (
                  <section key={card.title} className="rounded-md border border-leaf-900/10 bg-white px-4 py-4">
                    <h3 className="text-sm font-black text-ink">{card.title}</h3>
                    <div className="mt-2 space-y-1">
                      {card.body.map((line) => (
                        <p key={line} className="break-words text-sm font-semibold leading-6 text-ink/72 [overflow-wrap:anywhere]">
                          {line}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : null}

            {!showRecommendation
              ? followUpAnswers.map((answer) => (
                  <div key={`${answer.questionId}-${answer.answer}`} className="ml-auto min-w-0 max-w-full break-words rounded-md bg-white px-4 py-3 text-sm font-bold leading-6 text-ink/72 ring-1 ring-leaf-900/10 [overflow-wrap:anywhere] sm:max-w-[92%]">
                    You told me: {answer.answer}
                  </div>
                ))
              : null}

            {!showRecommendation && consultation?.status === "awaiting_follow_up" && currentFollowUp ? (
              <fieldset
                ref={followUpQuestionRef}
                tabIndex={-1}
                aria-labelledby={`farmmate-follow-up-${currentFollowUp.id}`}
                className="min-w-0 max-w-full rounded-md border border-leaf-900/10 bg-white px-4 py-4 focus:outline-none"
              >
                <legend className="sr-only">FarmMate follow-up question</legend>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-leaf-700">One quick question</p>
                <p id={`farmmate-follow-up-${currentFollowUp.id}`} className="mt-1 text-sm font-black text-ink">
                  {currentFollowUp.question}
                </p>
                <div className="mt-3 grid min-w-0 max-w-full gap-2 sm:grid-cols-2">
                  {(currentFollowUp.options ?? ["I can check this", "I am not sure", "I need help checking"]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={isSubmittingFollowUp}
                      onClick={() => void answerFollowUp(option)}
                      className="min-h-11 w-full min-w-0 whitespace-normal break-words rounded-md border border-leaf-900/15 bg-leaf-50 px-3 py-2 text-left text-sm font-black text-leaf-700 transition hover:border-leaf-700 hover:bg-white disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                    >
                      {conversationalOption(currentFollowUp.id, option)}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs font-semibold text-ink/50">No extra credit for this follow-up.</p>
              </fieldset>
            ) : null}

            {consultation?.status === "submitting_follow_up" ? (
              <div className="flex min-w-0 max-w-full items-center gap-2 rounded-md bg-leaf-50 px-4 py-3 text-sm font-black text-ink/70">
                <Loader2 className="animate-spin text-leaf-700" size={18} aria-hidden="true" />
                FarmMate is continuing this consultation...
              </div>
            ) : null}

            {showRecommendation ? (
              <div className="space-y-3">
                {isGeneratingNaturalAnswer ? (
                  <div className="flex max-w-[92%] items-center gap-2 rounded-md bg-leaf-50 px-4 py-3 text-sm font-black text-ink/70">
                    <Loader2 className="animate-spin text-leaf-700" size={18} aria-hidden="true" />
                    FarmMate is preparing your answer...
                  </div>
                ) : naturalAnswer ? (
                  <>
                    {completedAnswerSummary ? (
                      <p className="break-words rounded-md bg-leaf-50 px-4 py-3 text-xs font-black leading-5 text-ink/60 [overflow-wrap:anywhere]">
                        You told me: {completedAnswerSummary}
                      </p>
                    ) : null}
                    <section className="rounded-md border border-leaf-900/10 bg-white px-4 py-4">
                      <div className="space-y-3">
                        {naturalAnswer.split(/\n{2,}/).map((paragraph) => (
                          <p key={paragraph} className="break-words text-sm font-semibold leading-6 text-ink/72 [overflow-wrap:anywhere]">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </section>
                  </>
                ) : null}

                {aiFallbackMessage ? (
                  <p className="break-words rounded-md border border-earth-500/25 bg-earth-50 px-4 py-3 text-sm font-bold leading-6 text-ink/68 [overflow-wrap:anywhere]">
                    {aiFallbackMessage}
                  </p>
                ) : null}

                {creditMessage ? (
                  <div className="rounded-md border border-earth-500/25 bg-earth-50 px-4 py-3">
                    <p className="break-words text-sm font-bold leading-6 text-ink/68 [overflow-wrap:anywhere]">{creditMessage}</p>
                    {shouldShowCreditActions ? (
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Link
                          href={FARM_MATE_FEEDBACK_CTA.href}
                          className="inline-flex min-h-10 items-center justify-center rounded-md bg-leaf-600 px-4 py-2 text-sm font-black text-white transition hover:bg-leaf-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                        >
                          {FARM_MATE_FEEDBACK_CTA.label}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {shouldShowLocalGuidance
                  ? recommendationCards.map((card) => (
                      <section key={card.title} className="rounded-md border border-leaf-900/10 bg-white px-4 py-4">
                        <h3 className="text-sm font-black text-ink">{card.title}</h3>
                        <div className="mt-2 space-y-1">
                          {card.body.map((line) => (
                            <p key={line} className="break-words text-sm font-semibold leading-6 text-ink/72 [overflow-wrap:anywhere]">
                              {line}
                            </p>
                          ))}
                        </div>
                      </section>
                    ))
                  : null}

                {response?.shouldShowCropDoctorAction && onOpenCropDoctor ? (
                  <button
                    type="button"
                    onClick={onOpenCropDoctor}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                  >
                    <Camera size={18} aria-hidden="true" />
                    Upload Crop Photo
                  </button>
                ) : null}

                {shouldShowAnswerFeedback ? (
                  <FarmMateAnswerFeedback
                    key={`${consultation?.consultationId ?? askedQuestion}-${cleanDisplayedAnswer.slice(0, 40)}`}
                    prompt="Was this helpful?"
                    wrongButtonLabel="Wrong answer"
                    copyText={cleanDisplayedAnswer}
                    context={{
                      tool: "ask_farmmate",
                      originalQuestion: consultation?.originalQuestion || askedQuestion || undefined,
                      specialist: consultation?.specialist ?? response?.routerResult?.selectedSpecialist,
                      answerSnippet: farmMateAnswerSnippet(cleanDisplayedAnswer)
                    }}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

