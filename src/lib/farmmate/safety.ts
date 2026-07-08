import { FarmMateSafetyRule } from "./types";

export const farmMateSafetyRules: FarmMateSafetyRule[] = [
  {
    id: "uncertain-diagnosis",
    trigger: "Symptoms are unclear, conflicting or based on a short text description only.",
    action: "handle-uncertainty",
    responseGuidance: "Explain the likely possibilities, avoid certainty, and ask for one or two observations that would narrow the issue."
  },
  {
    id: "photo-needed",
    trigger: "The user describes visible crop symptoms such as spots, yellowing, wilting, holes or rot.",
    action: "recommend-crop-doctor",
    responseGuidance: "Recommend uploading a clear crop photo to Crop Doctor before giving a firm diagnosis."
  },
  {
    id: "serious-loss-risk",
    trigger: "The issue may affect many plants, spread quickly or threaten harvest.",
    action: "recommend-extension-officer",
    responseGuidance: "Advise the farmer to contact a local extension officer or trusted agronomist.",
    escalationMessage: "If many plants are affected or the problem is spreading quickly, speak with an extension officer as soon as possible."
  },
  {
    id: "chemical-safety",
    trigger: "The user asks for pesticide, herbicide or chemical dosage advice.",
    action: "avoid-unsafe-chemical-advice",
    responseGuidance: "Do not invent chemical rates. Tell the farmer to follow the product label and local extension guidance."
  },
  {
    id: "needs-context",
    trigger: "Important context such as crop, region, weather or growth stage is missing.",
    action: "ask-follow-up-question",
    responseGuidance: "Ask the most useful follow-up question before giving detailed advice."
  }
];
