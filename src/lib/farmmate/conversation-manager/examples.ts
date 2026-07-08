import { manageFarmMateConversation } from "./manager";
import type { ConversationState } from "./types";

const tomatoState: ConversationState = {
  activeTopic: "plant_health",
  activeCropName: "Tomato",
  activeSpecialist: "crop_health",
  waitingForFollowUp: true,
  turns: [{ message: "My tomato leaves are yellow", topic: "plant_health", cropName: "Tomato", specialist: "crop_health" }]
};

const maizeState: ConversationState = {
  activeTopic: "plant_health",
  activeCropName: "Maize",
  activeSpecialist: "crop_health",
  waitingForFollowUp: true,
  turns: [{ message: "My maize is not growing well", topic: "plant_health", cropName: "Maize", specialist: "crop_health" }]
};

const emptyState: ConversationState = {
  waitingForFollowUp: false,
  turns: []
};

export const farmMateConversationManagerExamples = [
  {
    scenario: "tomato to maize resets",
    decision: manageFarmMateConversation("My maize is not growing well", tomatoState),
    expectedAction: "reset",
    expectedReason: "new_crop"
  },
  {
    scenario: "maize to buying produce resets",
    decision: manageFarmMateConversation("How can I buy produce from Ghana Growers?", maizeState),
    expectedAction: "reset",
    expectedReason: "marketplace_question"
  },
  {
    scenario: "tomato follow-up continues",
    decision: manageFarmMateConversation("bottom leaves", tomatoState),
    expectedAction: "continue"
  },
  {
    scenario: "random yes without active follow-up asks for clarification",
    decision: manageFarmMateConversation("yes", emptyState),
    expectedAction: "clarify",
    expectedReason: "unclear_without_active_follow_up"
  },
  {
    scenario: "Crop Doctor unknown crop handoff does not assume tomato",
    decision: manageFarmMateConversation("I uploaded a crop photo. What should I check next?", tomatoState),
    expectedAction: "reset",
    expectedReason: "new_intent"
  }
];

export const farmMateConversationManagerExamplesPass = farmMateConversationManagerExamples.every(
  (example) =>
    example.decision.action === example.expectedAction &&
    (!("expectedReason" in example) || !example.expectedReason || example.decision.resetReason === example.expectedReason)
);
