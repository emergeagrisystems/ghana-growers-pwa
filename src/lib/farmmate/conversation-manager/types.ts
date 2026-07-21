import type { FarmMateSpecialist } from "../router";

export type ConversationTopic =
  | "plant_health"
  | "marketplace_info"
  | "fertilizer"
  | "weather_decision"
  | "harvest_postharvest"
  | "planting"
  | "harvest"
  | "crop_doctor"
  | "general_agronomy"
  | "general_farming";

export type ConversationResetReason =
  | "no_active_consultation"
  | "new_intent"
  | "new_crop"
  | "marketplace_question"
  | "crop_doctor_handoff"
  | "crop_doctor_unknown_crop"
  | "unclear_without_active_follow_up";

export type ConversationTurn = {
  message: string;
  topic: ConversationTopic;
  cropName?: string;
  specialist?: FarmMateSpecialist;
};

export type ConversationManagerContext = {
  source?: "crop_doctor";
  crop?: string | null;
  issueCategory?: "pest" | "disease" | "nutrient" | "water_stress" | "unknown";
  possibleIssue?: string;
};

export type ConversationState = {
  activeTopic?: ConversationTopic;
  activeCropName?: string;
  activeSpecialist?: FarmMateSpecialist;
  waitingForFollowUp: boolean;
  turns: ConversationTurn[];
};

export type ConversationDecision = {
  action: "continue" | "reset" | "clarify";
  topic: ConversationTopic;
  resetReason?: ConversationResetReason;
  shouldKeepContext: boolean;
  cropName?: string;
  specialist?: FarmMateSpecialist;
  isMarketplaceInfoRequest: boolean;
};
