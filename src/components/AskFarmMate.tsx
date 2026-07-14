"use client";

import Link from "next/link";
import { Bot, Camera, Loader2, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { buildFarmMateResponse, FarmMateBrainResponse } from "@/lib/farmmate/decision-engine";
import type { CropDoctorHandoffContext } from "@/lib/farmmate/crop-doctor-vision";
import type { FarmMateLocalResponseCard } from "@/lib/farmmate/ai/types";
import { createConversationStateUpdate, manageFarmMateConversation, type ConversationDecision, type ConversationState } from "@/lib/farmmate/conversation-manager";
import {
  cleanFarmMateFinalAnswer,
  compactFollowUpSummary,
  farmMateFallbackMessage,
  harvestPostHarvestGuidedRecommendationCards,
  shouldCompleteWeatherGuidedFlow,
  shouldRenderLocalFarmMateGuidance,
  weatherGuidedRecommendationCards
} from "@/lib/farmmate/conversation-ui";
import { routeFarmMateQuestion, type RouterResult } from "@/lib/farmmate/router";
import { farmMateCreditLine, getFarmMateAnonymousDeviceId } from "@/lib/farmmate/usage/client";
import { FARM_MATE_EXHAUSTED_LEARN_CTA, FARM_MATE_SOIL_HEALTH_CHALLENGE_CTA, type FarmMateCreditStatus } from "@/lib/farmmate/usage";
import { FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY, type WeatherDecisionSummary } from "@/lib/farmmate/weather";

const suggestions = [
  "Can I spray today?",
  "My tomato leaves are yellow",
  "Best fertilizer for maize",
  "Can I plant tomatoes now?",
  "When should I harvest maize?",
  "How do I store cassava?",
  "How do I pack tomatoes for transport?",
  "What should I check from my crop photo?"
];

type FollowUpAnswer = {
  question: string;
  answer: string;
};

function sectionBody(response: FarmMateBrainResponse, title: string) {
  return response.sections.find((section) => section.title === title)?.body ?? [];
}

function conversationalOption(questionId: string, option: string) {
  const optionLabels: Record<string, Record<string, string>> = {
    "rain-window": {
      "Yes, rain is expected": "Rain is expected soon",
      "No rain expected": "No rain expected soon",
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

  return {
    lead: "Let's narrow this down.",
    detail: "I will ask one quick question at a time."
  };
}

function localRecommendationCards(response: FarmMateBrainResponse, answers: FollowUpAnswer[]): FarmMateLocalResponseCard[] {
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

    if (!parsed?.liveWeatherAvailable || !parsed.locationName || !Array.isArray(parsed.farmingNotes)) {
      return undefined;
    }

    return parsed as WeatherDecisionSummary;
  } catch {
    return undefined;
  }
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
  const [conversationState, setConversationState] = useState<ConversationState>({
    waitingForFollowUp: false,
    turns: []
  });
  const [activeCropDoctorHandoff, setActiveCropDoctorHandoff] = useState<CropDoctorHandoffContext | null>(null);

  const canAsk = question.trim().length > 0 && !isThinking;
  const followUpQuestions = response?.flow?.followUpQuestions ?? [];
  const currentFollowUp = followUpQuestions[followUpIndex];

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

  async function requestNaturalAnswer(farmerQuestion: string, farmMateResponse: FarmMateBrainResponse, answers: FollowUpAnswer[]) {
    setNaturalAnswer("");
    setAiFallbackMessage("");
    setCreditMessage("");
    setIsGeneratingNaturalAnswer(true);

    try {
      const apiResponse = await fetch("/api/farmmate/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          anonymousDeviceId: getFarmMateAnonymousDeviceId(),
          farmerQuestion,
          brain: farmMateResponse,
          farmerAnswers: answers,
          localStructuredResponse: localRecommendationCards(farmMateResponse, answers)
        })
      });
      const data = (await apiResponse.json().catch(() => null)) as { ok?: boolean; answer?: string; fallback?: boolean; reason?: string; credits?: FarmMateCreditStatus; message?: string } | null;

      if (data?.credits) {
        setCredits(data.credits);
      }

      if (!apiResponse.ok) {
        setCreditReason(typeof data?.reason === "string" ? data.reason : "");
        if (data?.reason === "usage_tracking_unavailable") {
          setAiFallbackMessage(farmMateFallbackMessage(data?.message));
        } else if (data?.message) {
          setCreditMessage(data.message);
        }
        return;
      }

      if (data?.ok && data.answer?.trim()) {
        setNaturalAnswer(cleanFarmMateFinalAnswer(data.answer));
        return;
      }

      if (data?.fallback) {
        setAiFallbackMessage(farmMateFallbackMessage(data.message));
      }
    } catch {
      setNaturalAnswer("");
      setAiFallbackMessage(farmMateFallbackMessage());
    } finally {
      setIsGeneratingNaturalAnswer(false);
    }
  }

  function askFarmMate(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isThinking) {
      return;
    }

    const handoffContext = activeCropDoctorHandoff?.question === trimmedQuestion ? activeCropDoctorHandoff : null;
    const conversationDecision = manageFarmMateConversation(trimmedQuestion, conversationState, handoffContext ?? undefined);

    if (conversationDecision.action === "continue" && conversationState.waitingForFollowUp && currentFollowUp) {
      logConversationDecision(trimmedQuestion, conversationState, conversationDecision, conversationDecision.specialist);
      answerFollowUp(trimmedQuestion);
      setQuestion("");
      return;
    }

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
    setIsThinking(true);

    const routerResult = routeFarmMateQuestion(trimmedQuestion, handoffContext ?? undefined);
    logConversationDecision(trimmedQuestion, conversationState, conversationDecision, routerResult.selectedSpecialist);
    logRouterResult(routerResult);
    const previousCropName = conversationDecision.shouldKeepContext && !routerResult.detectedCrop ? conversationState.activeCropName : undefined;

    if (conversationDecision.action === "clarify") {
      window.setTimeout(() => {
        setLocalCards(clarificationResponse());
        setShowRecommendation(true);
        setConversationState(createConversationStateUpdate(conversationState, trimmedQuestion, conversationDecision, false));
        setIsThinking(false);
      }, 700);
      return;
    }

    if (conversationDecision.isMarketplaceInfoRequest) {
      window.setTimeout(() => {
        setLocalCards(marketplaceInfoResponse());
        setShowRecommendation(true);
        setConversationState(createConversationStateUpdate(conversationState, trimmedQuestion, conversationDecision, false));
        setIsThinking(false);
      }, 700);
      return;
    }

    window.setTimeout(() => {
      const farmMateResponse = buildFarmMateResponse(trimmedQuestion, routerResult, {
        previousCropName,
        cropDoctorContext: handoffContext ?? undefined,
        weatherContext: routerResult.selectedSpecialist === "weather_decision" ? storedWeatherContextForFarmMate() : undefined
      });
      const shouldShowRecommendation = farmMateResponse.confidence === "high" || !farmMateResponse.flow;

      logBrainContext(trimmedQuestion, farmMateResponse);
      setResponse(farmMateResponse);
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
          !shouldShowRecommendation
        )
      );
      setIsThinking(false);

      if (shouldShowRecommendation) {
        void requestNaturalAnswer(trimmedQuestion, farmMateResponse, []);
      }
      setActiveCropDoctorHandoff(null);
    }, 1200);
  }

  function answerFollowUp(answer: string) {
    if (!currentFollowUp) {
      return;
    }

    const nextAnswers = [...followUpAnswers, { question: currentFollowUp.question, answer }];

    setFollowUpAnswers(nextAnswers);

    const shouldCompleteWeatherFlow = shouldCompleteWeatherGuidedFlow(response?.flow?.id, nextAnswers);

    if (!shouldCompleteWeatherFlow && followUpIndex + 1 < followUpQuestions.length) {
      setFollowUpIndex((index) => index + 1);
      setConversationState((current) => ({ ...current, waitingForFollowUp: true }));
      return;
    }

    setShowRecommendation(true);
    setConversationState((current) => ({ ...current, waitingForFollowUp: false }));

    if (response) {
      void requestNaturalAnswer(askedQuestion, response, nextAnswers);
    }
  }

  const recommendationCards = localCards.length ? localCards : response ? localRecommendationCards(response, followUpAnswers) : [];
  const intro = responseIntro(localCards, showRecommendation, response);
  const shouldShowLocalGuidance = shouldRenderLocalFarmMateGuidance({
    isGeneratingNaturalAnswer,
    naturalAnswer,
    localCards: recommendationCards,
    aiFallbackMessage,
    isLocalOnlyResponse: localCards.length > 0
  });
  const completedAnswerSummary = compactFollowUpSummary(followUpAnswers);
  const shouldShowIntro = Boolean(intro.lead || intro.detail) && (!showRecommendation || localCards.length > 0) && !isGeneratingNaturalAnswer && !naturalAnswer;
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
          <div className="ml-auto max-w-[92%] rounded-md bg-leaf-600 px-4 py-3 text-sm font-bold leading-6 text-white">
            {askedQuestion}
          </div>
        ) : null}

        {isThinking ? (
          <div className="flex max-w-[92%] items-center gap-2 rounded-md bg-leaf-50 px-4 py-3 text-sm font-black text-ink/70">
            <Loader2 className="animate-spin text-leaf-700" size={18} aria-hidden="true" />
            FarmMate is thinking...
          </div>
        ) : null}

        {response || localCards.length ? (
          <div className="max-w-[92%] space-y-3">
            {shouldShowIntro ? (
              <div className="rounded-md border border-leaf-900/10 bg-leaf-50 px-4 py-4 text-sm font-semibold leading-6 text-ink/76">
                {intro.lead ? <p>{intro.lead}</p> : null}
                {intro.detail ? <p className={intro.lead ? "mt-2" : ""}>{intro.detail}</p> : null}
              </div>
            ) : null}

            {!showRecommendation
              ? followUpAnswers.map((answer) => (
                  <div key={`${answer.question}-${answer.answer}`} className="ml-auto max-w-[92%] rounded-md bg-white px-4 py-3 text-sm font-bold leading-6 text-ink/72 ring-1 ring-leaf-900/10">
                    {answer.answer}
                  </div>
                ))
              : null}

            {!showRecommendation && currentFollowUp ? (
              <div className="rounded-md border border-leaf-900/10 bg-white px-4 py-4">
                <p className="text-sm font-black text-ink">{currentFollowUp.question}</p>
                <div className="mt-3 grid gap-2">
                  {(currentFollowUp.options ?? ["I can check this", "I am not sure", "I need help checking"]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => answerFollowUp(conversationalOption(currentFollowUp.id, option))}
                      className="min-h-11 rounded-md border border-leaf-900/15 bg-leaf-50 px-3 py-2 text-left text-sm font-black text-leaf-700 transition hover:border-leaf-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                    >
                      {conversationalOption(currentFollowUp.id, option)}
                    </button>
                  ))}
                </div>
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
                      <p className="rounded-md bg-leaf-50 px-4 py-3 text-xs font-black leading-5 text-ink/60">
                        You told me: {completedAnswerSummary}
                      </p>
                    ) : null}
                    <section className="rounded-md border border-leaf-900/10 bg-white px-4 py-4">
                      <div className="space-y-3">
                        {naturalAnswer.split(/\n{2,}/).map((paragraph) => (
                          <p key={paragraph} className="text-sm font-semibold leading-6 text-ink/72">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </section>
                  </>
                ) : null}

                {aiFallbackMessage ? (
                  <p className="rounded-md border border-earth-500/25 bg-earth-50 px-4 py-3 text-sm font-bold leading-6 text-ink/68">
                    {aiFallbackMessage}
                  </p>
                ) : null}

                {creditMessage ? (
                  <div className="rounded-md border border-earth-500/25 bg-earth-50 px-4 py-3">
                    <p className="text-sm font-bold leading-6 text-ink/68">{creditMessage}</p>
                    {shouldShowCreditActions ? (
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Link
                          href={FARM_MATE_EXHAUSTED_LEARN_CTA.href}
                          className="inline-flex min-h-10 items-center justify-center rounded-md bg-leaf-600 px-4 py-2 text-sm font-black text-white transition hover:bg-leaf-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                        >
                          {FARM_MATE_EXHAUSTED_LEARN_CTA.label}
                        </Link>
                        <Link
                          href={FARM_MATE_SOIL_HEALTH_CHALLENGE_CTA.href}
                          className="inline-flex min-h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                        >
                          {FARM_MATE_SOIL_HEALTH_CHALLENGE_CTA.label}
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
                            <p key={line} className="text-sm font-semibold leading-6 text-ink/72">
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
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

