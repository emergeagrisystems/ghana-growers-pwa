import { buildFarmMateResponse } from "./decision-engine";
import { manageFarmMateConversation } from "./conversation-manager";
import type { ConversationState } from "./conversation-manager";
import { routeFarmMateQuestion } from "./router";

const emptyConversation: ConversationState = {
  waitingForFollowUp: false,
  turns: []
};

function runQuestion(question: string, state: ConversationState = emptyConversation) {
  const conversation = manageFarmMateConversation(question, state);
  const router = routeFarmMateQuestion(question);
  const response = conversation.isMarketplaceInfoRequest ? undefined : buildFarmMateResponse(question, router);

  return {
    question,
    conversation,
    router,
    response
  };
}

export const farmMateQaExamples = [
  runQuestion("My maize is not growing well"),
  runQuestion("Best fertilizer for maize"),
  runQuestion("My tomato leaves are yellow"),
  runQuestion("My cassava leaves are curling"),
  runQuestion("Can I spray today?"),
  runQuestion("How can I buy produce from Ghana Growers?"),
  runQuestion("I uploaded a crop photo. What should I check next?")
];

export const farmMateQaExamplesPass = farmMateQaExamples.every((example) => {
  if (example.question.includes("maize")) {
    return example.response?.resolvedCrop === "Maize";
  }

  if (example.question.includes("tomato")) {
    return example.response?.resolvedCrop === "Tomato";
  }

  if (example.question.includes("cassava")) {
    return example.response?.resolvedCrop === "Cassava";
  }

  if (example.question.includes("buy produce")) {
    return example.conversation.isMarketplaceInfoRequest && example.response === undefined;
  }

  if (example.question.includes("crop photo")) {
    return example.response?.resolvedCrop !== "Tomato";
  }

  return true;
});
