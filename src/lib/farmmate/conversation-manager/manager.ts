import { detectFarmMateCropFromQuestion } from "../crop-context";
import type { FarmMateSpecialist } from "../router";
import type { ConversationDecision, ConversationState, ConversationTopic } from "./types";

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
    keywords: ["spray", "rain", "wind", "weather", "irrigation"]
  },
  {
    topic: "planting",
    specialist: "planting",
    keywords: ["plant", "planting", "spacing", "season", "sow", "transplant"]
  },
  {
    topic: "harvest",
    specialist: "general_farming",
    keywords: ["harvest", "ready", "maturity", "ripe", "pick"]
  },
  {
    topic: "crop_doctor",
    specialist: "crop_doctor",
    keywords: ["upload", "photo", "picture", "diagnose", "image", "crop doctor"]
  },
  {
    topic: "plant_health",
    specialist: "crop_health",
    keywords: ["leaves", "yellow", "spots", "wilting", "wilt", "holes", "pests", "pest", "disease", "blight", "curling", "stunted", "not growing", "flower drop", "fruit drop", "root"]
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

export function manageFarmMateConversation(message: string, state: ConversationState): ConversationDecision {
  const detectedCrop = detectFarmMateCropFromQuestion(message)?.name;
  const topicMatch = detectTopic(message);
  const topic = topicMatch?.rule.topic ?? state.activeTopic ?? "general_farming";
  const specialist = topicMatch?.rule.specialist ?? state.activeSpecialist ?? "general_farming";
  const activeTopic = state.activeTopic;

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
