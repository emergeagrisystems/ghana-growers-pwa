import { detectFarmMateCropFromQuestion } from "../crop-context";
import type { FarmMateSpecialist } from "../router";
import type { ConversationDecision, ConversationManagerContext, ConversationState, ConversationTopic } from "./types";

type TopicRule = {
  topic: ConversationTopic;
  specialist: FarmMateSpecialist;
  keywords: string[];
};

const topicRules: TopicRule[] = [
  {
    topic: "marketplace_info",
    specialist: "general_farming",
    keywords: ["buy", "purchase", "produce", "order", "marketplace", "delivery", "buyer network", "ghana growers"]
  },
  {
    topic: "fertilizer",
    specialist: "fertilizer",
    keywords: ["fertilizer", "fertiliser", "npk", "manure", "compost", "urea", "nitrogen"]
  },
  {
    topic: "weather_decision",
    specialist: "weather_decision",
    keywords: ["spray", "spraying", "rain", "rainfall", "wind", "windy", "weather", "irrigate", "irrigation", "water today", "wet leaves", "dry leaves", "heavy rain", "fertilize before rain", "fertilise before rain", "apply fertilizer before rain", "apply fertiliser before rain"]
  },
  {
    topic: "harvest_postharvest",
    specialist: "harvest_postharvest",
    keywords: ["harvest", "harvesting", "harvest before rain", "ready to harvest", "ready", "mature", "maturity", "store", "storage", "keep fresh", "transport", "pack", "packing", "sort", "sorting", "grade", "grading", "dry maize", "drying", "dry produce", "post harvest", "post-harvest", "spoil", "rotten", "mould", "mold", "shelf life", "losses after harvest", "reduce losses"]
  },
  {
    topic: "general_agronomy",
    specialist: "general_agronomy",
    keywords: [
      "seed germination",
      "germination",
      "nursery management",
      "nursery",
      "seedling hardening",
      "harden seedlings",
      "harden",
      "seedling",
      "transplant shock",
      "intercropping",
      "intercrop",
      "crop rotation",
      "mulching",
      "soil structure",
      "drainage",
      "weed control",
      "manage weeds",
      "weeds",
      "pruning",
      "field preparation",
      "plant stress",
      "cover crop",
      "legumes",
      "identify plant",
      "what plant is this",
      "unknown crop",
      "general farming",
      "farm practice"
    ]
  },
  {
    topic: "planting",
    specialist: "planting",
    keywords: [
      "plant",
      "planting",
      "sow",
      "sowing",
      "transplant",
      "nursery",
      "spacing",
      "seed spacing",
      "planting season",
      "what should i plant",
      "crop to grow",
      "best time to plant",
      "land preparation",
      "melon",
      "watermelon",
      "water melon",
      "grow melon",
      "grow watermelon",
      "grow water melon"
    ]
  },
  {
    topic: "harvest",
    specialist: "harvest_postharvest",
    keywords: ["pick"]
  },
  {
    topic: "crop_doctor",
    specialist: "crop_doctor",
    keywords: ["upload", "photo", "picture", "diagnose", "image", "crop doctor"]
  },
  {
    topic: "plant_health",
    specialist: "crop_health",
    keywords: [
      "leaves",
      "yellow",
      "spots",
      "wilting",
      "wilt",
      "holes",
      "pests",
      "pest",
      "disease",
      "blight",
      "curling",
      "stunted",
      "not growing",
      "flower drop",
      "flower dropping",
      "flowers dropping",
      "flowers are dropping",
      "fruit drop",
      "fruit dropping",
      "fruits dropping",
      "root"
    ]
  }
];

const shortFollowUpAnswers = [
  "yes",
  "no",
  "not sure",
  "bottom leaves",
  "top leaves",
  "everywhere",
  "heavy rain",
  "daily watering",
  "dry",
  "wet",
  "calm",
  "windy",
  "pale yellow",
  "purple",
  "still green",
  "older leaves are pale yellow",
  "older leaves are purple",
  "older leaves are dark green"
];

function normalizeMessage(message: string) {
  return message.toLowerCase().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function detectTopic(message: string) {
  const normalized = normalizeMessage(message);
  const matches = topicRules
    .map((rule) => ({
      rule,
      matchedKeywords: rule.keywords.filter((keyword) => normalized.includes(keyword))
    }))
    .filter((match) => match.matchedKeywords.length > 0)
    .sort((a, b) => b.matchedKeywords.length - a.matchedKeywords.length);

  return matches[0];
}

function isShortFollowUpAnswer(message: string) {
  const normalized = normalizeMessage(message);
  return normalized.length <= 32 && shortFollowUpAnswers.includes(normalized);
}

export function manageFarmMateConversation(message: string, state: ConversationState, context: ConversationManagerContext = {}): ConversationDecision {
  const detectedCrop = context.crop ?? detectFarmMateCropFromQuestion(message)?.name;
  const topicMatch = detectTopic(message);
  const topic = topicMatch?.rule.topic ?? state.activeTopic ?? "general_agronomy";
  const specialist = topicMatch?.rule.specialist ?? state.activeSpecialist ?? "general_agronomy";
  const activeTopic = state.activeTopic;

  if (context.source === "crop_doctor") {
    const hasCropDoctorContext = Boolean(context.crop || context.possibleIssue || context.issueCategory);

    return {
      action: "reset",
      topic: hasCropDoctorContext ? "crop_doctor" : "general_farming",
      resetReason: hasCropDoctorContext ? "crop_doctor_handoff" : "crop_doctor_unknown_crop",
      shouldKeepContext: false,
      cropName: detectedCrop ?? undefined,
      specialist: hasCropDoctorContext ? "crop_doctor" : "general_farming",
      isMarketplaceInfoRequest: false
    };
  }

  if (isShortFollowUpAnswer(message)) {
    if (state.waitingForFollowUp) {
      return {
        action: "continue",
        topic,
        shouldKeepContext: true,
        cropName: state.activeCropName,
        specialist: state.activeSpecialist,
        isMarketplaceInfoRequest: false
      };
    }

    return {
      action: "clarify",
      topic: "general_farming",
      resetReason: "unclear_without_active_follow_up",
      shouldKeepContext: false,
      isMarketplaceInfoRequest: false
    };
  }

  if (!activeTopic) {
    return {
      action: "reset",
      topic,
      resetReason: "no_active_consultation",
      shouldKeepContext: false,
      cropName: detectedCrop,
      specialist,
      isMarketplaceInfoRequest: topic === "marketplace_info"
    };
  }

  if (topic === "marketplace_info") {
    return {
      action: "reset",
      topic,
      resetReason: "marketplace_question",
      shouldKeepContext: false,
      cropName: detectedCrop,
      specialist,
      isMarketplaceInfoRequest: true
    };
  }

  if (detectedCrop && state.activeCropName && detectedCrop !== state.activeCropName) {
    return {
      action: "reset",
      topic,
      resetReason: "new_crop",
      shouldKeepContext: false,
      cropName: detectedCrop,
      specialist,
      isMarketplaceInfoRequest: false
    };
  }

  if (topicMatch && topic !== activeTopic) {
    return {
      action: "reset",
      topic,
      resetReason: "new_intent",
      shouldKeepContext: false,
      cropName: detectedCrop,
      specialist,
      isMarketplaceInfoRequest: false
    };
  }

  if (topic === "crop_doctor" && !detectedCrop && !message.toLowerCase().includes("tomato")) {
    return {
      action: "reset",
      topic,
      resetReason: "crop_doctor_unknown_crop",
      shouldKeepContext: false,
      specialist,
      isMarketplaceInfoRequest: false
    };
  }

  return {
    action: "continue",
    topic,
    shouldKeepContext: true,
    cropName: detectedCrop ?? state.activeCropName,
    specialist,
    isMarketplaceInfoRequest: false
  };
}

export function createConversationStateUpdate(
  state: ConversationState,
  message: string,
  decision: ConversationDecision,
  waitingForFollowUp: boolean
): ConversationState {
  const nextTurn = {
    message,
    topic: decision.topic,
    cropName: decision.cropName,
    specialist: decision.specialist
  };

  return {
    activeTopic: decision.action === "clarify" ? undefined : decision.topic,
    activeCropName: decision.action === "clarify" ? undefined : decision.cropName,
    activeSpecialist: decision.action === "clarify" ? undefined : decision.specialist,
    waitingForFollowUp,
    turns: [...(decision.shouldKeepContext ? state.turns : []), nextTurn].slice(-8)
  };
}
