"use client";

import { Bot, Camera, Loader2, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { buildFarmMateResponse, FarmMateBrainResponse } from "@/lib/farmmate/decision-engine";
import type { FarmMateLocalResponseCard } from "@/lib/farmmate/ai/types";
import { createConversationStateUpdate, manageFarmMateConversation, type ConversationDecision, type ConversationState } from "@/lib/farmmate/conversation-manager";
import { routeFarmMateQuestion, type RouterResult } from "@/lib/farmmate/router";
import { farmMateCreditLine, getFarmMateAnonymousDeviceId } from "@/lib/farmmate/usage/client";
import type { FarmMateCreditStatus } from "@/lib/farmmate/usage";

const suggestions = [
  "Can I spray today?",
  "Tomato leaves turning yellow",
  "Best fertilizer for maize"
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
      Yes: "Rain is expected soon",
      No: "No rain expected soon",
      "Not sure": "I am not sure about rain"
    },
    "leaf-wetness": {
      Dry: "Leaves are dry",
      Wet: "Leaves are wet",
      "Not sure": "I am not sure if leaves are dry"
    },
    "wind-level": {
      Calm: "Wind is calm",
      Windy: "Wind is strong",
      "Not sure": "I am not sure about the wind"
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
    "No whorl damage seen": "Since you saw no whorl damage, fall armyworm is less likely."
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

function responseIntro(localCards: FarmMateLocalResponseCard[], showRecommendation: boolean) {
  if (localCards.some((card) => card.body.some((line) => line.toLowerCase().includes("buy produce")))) {
    return {
      lead: "Here is the buying guidance.",
      detail: "This is separate from crop health advice."
    };
  }

  if (localCards.length) {
    return {
      lead: "I need a clearer question.",
      detail: "Send one full sentence so I can route it properly."
    };
  }

  if (showRecommendation) {
    return {
      lead: "Here is the practical next step.",
      detail: "I will keep it short and focused."
    };
  }

  return {
    lead: "Let’s narrow it down first.",
    detail: "I’ll ask one quick question at a time."
  };
}

function localRecommendationCards(response: FarmMateBrainResponse, answers: FollowUpAnswer[]): FarmMateLocalResponseCard[] {
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

export function AskFarmMate({
  prefillQuestion,
  onOpenCropDoctor
}: {
  prefillQuestion?: string;
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
  const [credits, setCredits] = useState<FarmMateCreditStatus | null>(null);
  const [creditMessage, setCreditMessage] = useState("");
  const [conversationState, setConversationState] = useState<ConversationState>({
    waitingForFollowUp: false,
    turns: []
  });

  const canAsk = question.trim().length > 0 && !isThinking;
  const followUpQuestions = response?.flow?.followUpQuestions ?? [];
  const currentFollowUp = followUpQuestions[followUpIndex];

  useEffect(() => {
    function handlePrefill(event: Event) {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail) {
        setQuestion(customEvent.detail);
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
      const data = (await apiResponse.json().catch(() => null)) as { ok?: boolean; answer?: string; credits?: FarmMateCreditStatus; message?: string } | null;

      if (data?.credits) {
        setCredits(data.credits);
      }

      if (!apiResponse.ok) {
        if (data?.message) {
          setCreditMessage(data.message);
        }
        return;
      }

      if (data?.ok && data.answer?.trim()) {
        setNaturalAnswer(data.answer.trim());
      }
    } catch {
      setNaturalAnswer("");
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

    const conversationDecision = manageFarmMateConversation(trimmedQuestion, conversationState);

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
    setCreditMessage("");
    setIsThinking(true);

    const routerResult = routeFarmMateQuestion(trimmedQuestion);
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
      const farmMateResponse = buildFarmMateResponse(trimmedQuestion, routerResult, { previousCropName });
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
    }, 1200);
  }

  function answerFollowUp(answer: string) {
    if (!currentFollowUp) {
      return;
    }

    const nextAnswers = [...followUpAnswers, { question: currentFollowUp.question, answer }];

    setFollowUpAnswers(nextAnswers);

    if (followUpIndex + 1 < followUpQuestions.length) {
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
  const intro = responseIntro(localCards, showRecommendation);

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
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: Why are my tomato leaves turning yellow?"
            className="gg-field min-h-36 resize-none bg-leaf-50/70 px-4 py-4 text-base leading-7 focus:bg-white"
          />
        </label>

        <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuestion(suggestion)}
              className="min-h-11 rounded-md border border-leaf-900/15 bg-white px-3 py-2 text-left text-sm font-black text-leaf-700 transition hover:border-leaf-700 hover:bg-leaf-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
            >
              {suggestion}
            </button>
          ))}
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
            <div className="rounded-md border border-leaf-900/10 bg-leaf-50 px-4 py-4 text-sm font-semibold leading-6 text-ink/76">
              <p>{intro.lead}</p>
              <p className="mt-2">{intro.detail}</p>
            </div>

            {followUpAnswers.map((answer) => (
              <div key={`${answer.question}-${answer.answer}`} className="ml-auto max-w-[92%] rounded-md bg-white px-4 py-3 text-sm font-bold leading-6 text-ink/72 ring-1 ring-leaf-900/10">
                {answer.answer}
              </div>
            ))}

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
                  <section className="rounded-md border border-leaf-900/10 bg-white px-4 py-4">
                    <div className="space-y-3">
                      {naturalAnswer.split(/\n{2,}/).map((paragraph) => (
                        <p key={paragraph} className="text-sm font-semibold leading-6 text-ink/72">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                ) : null}

                {creditMessage ? (
                  <p className="rounded-md border border-earth-500/25 bg-earth-50 px-4 py-3 text-sm font-bold leading-6 text-ink/68">
                    {creditMessage}
                  </p>
                ) : null}

                {!naturalAnswer
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

