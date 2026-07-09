import type { FarmMateLocalResponseCard } from "./ai";

const FALLBACK_MESSAGE = "FarmMate AI is temporarily limited, but you can still use the local guidance.";

const fillerPatterns = [
  /\bI will keep it short and focused\.?\s*/gi,
  /\bHere is the practical next step\.?\s*/gi,
  /^I can help\.?\s*/gim
];

export type AskFarmMateResponseState = {
  isGeneratingNaturalAnswer: boolean;
  naturalAnswer: string;
  localCards: FarmMateLocalResponseCard[];
  aiFallbackMessage: string;
  isLocalOnlyResponse?: boolean;
};

export function cleanFarmMateFinalAnswer(answer: string) {
  return fillerPatterns
    .reduce((cleaned, pattern) => cleaned.replace(pattern, ""), answer)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function farmMateFallbackMessage(message?: string | null) {
  const trimmed = message?.trim();

  if (!trimmed) {
    return FALLBACK_MESSAGE;
  }

  return trimmed.includes("local guidance") ? trimmed : `${FALLBACK_MESSAGE} ${trimmed}`;
}

export function shouldRenderLocalFarmMateGuidance(state: AskFarmMateResponseState) {
  if (state.isGeneratingNaturalAnswer || state.naturalAnswer.trim()) {
    return false;
  }

  if (state.isLocalOnlyResponse) {
    return state.localCards.length > 0;
  }

  return state.localCards.length > 0 && Boolean(state.aiFallbackMessage.trim());
}

export function compactFollowUpSummary(answers: Array<{ answer: string }>) {
  return answers
    .map((answer) => answer.answer.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(" · ");
}
