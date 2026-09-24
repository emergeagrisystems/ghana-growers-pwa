import type { FollowUpQuestion } from "./decision-engine";
import type { FarmMateSpecialist } from "./router";

export type FarmMateConsultationAnswer = {
  questionId: string;
  question: string;
  answer: string;
  selectedOption: string;
  options: string[];
};

export type FarmMateConsultationContext = {
  normalizedCrop?: string;
  selectedRegion?: string;
  selectedCrop?: string;
  growthStage?: string;
  selectedSymptom?: string;
  waterStatus?: string;
  pendingFollowUpQuestion?: FollowUpQuestion;
  followUpOptions?: string[];
  answerHistory: FarmMateConsultationAnswer[];
};

export type AskFarmMateConsultationState = FarmMateConsultationContext & {
  consultationId: string;
  consultationToken?: string;
  originalQuestion: string;
  specialist?: FarmMateSpecialist;
  status: "starting" | "awaiting_follow_up" | "submitting_follow_up" | "preparing_answer" | "complete" | "exhausted" | "error";
};

export type FarmMateFollowUpSubmission = {
  consultationId: string;
  originalQuestion: string;
  consultationToken?: string;
  followUpAnswer?: FarmMateConsultationAnswer;
  consultationContext: FarmMateConsultationContext;
  isFollowUp: boolean;
  deferAnswer: boolean;
};

const consultationIdPattern = /^fm-[a-z0-9-]{12,80}$/i;

function cleanConsultationText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function isBoundedConsultationText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

export function createFarmMateConsultationId(randomId?: string) {
  const safeRandomId = cleanConsultationText(randomId, 80).replace(/[^a-z0-9-]/gi, "");

  if (safeRandomId.length >= 12) {
    return `fm-${safeRandomId}`.slice(0, 83);
  }

  return `fm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function isValidFarmMateConsultationId(value: unknown): value is string {
  return typeof value === "string" && consultationIdPattern.test(value);
}

export function createAskFarmMateConsultation({
  consultationId,
  originalQuestion,
  specialist,
  normalizedCrop,
  pendingFollowUpQuestion
}: {
  consultationId: string;
  originalQuestion: string;
  specialist?: FarmMateSpecialist;
  normalizedCrop?: string;
  pendingFollowUpQuestion?: FollowUpQuestion;
}): AskFarmMateConsultationState {
  return {
    consultationId,
    originalQuestion: cleanConsultationText(originalQuestion, 500),
    specialist,
    normalizedCrop: cleanConsultationText(normalizedCrop, 80) || undefined,
    selectedCrop: cleanConsultationText(normalizedCrop, 80) || undefined,
    pendingFollowUpQuestion,
    followUpOptions: pendingFollowUpQuestion?.options,
    answerHistory: [],
    status: pendingFollowUpQuestion ? "starting" : "preparing_answer"
  };
}

function contextFieldForQuestion(questionId: string) {
  const normalizedId = questionId.toLowerCase();

  if (normalizedId.includes("region")) return "selectedRegion" as const;
  if (normalizedId.includes("crop-type") || normalizedId === "crop-context" || normalizedId.includes("crop-choice")) return "selectedCrop" as const;
  if (normalizedId.includes("stage") || normalizedId.includes("age")) return "growthStage" as const;
  if (
    normalizedId.includes("water") ||
    normalizedId.includes("rain") ||
    normalizedId.includes("moisture") ||
    normalizedId.includes("irrigation") ||
    normalizedId.includes("soil-state") ||
    normalizedId.includes("waterlogging")
  ) {
    return "waterStatus" as const;
  }
  if (
    normalizedId.includes("symptom") ||
    normalizedId.includes("sign") ||
    normalizedId.includes("yellow") ||
    normalizedId.includes("leaf") ||
    normalizedId.includes("spot") ||
    normalizedId.includes("pest") ||
    normalizedId.includes("damage")
  ) {
    return "selectedSymptom" as const;
  }

  return null;
}

export function continueAskFarmMateConsultation(
  consultation: AskFarmMateConsultationState,
  currentQuestion: FollowUpQuestion,
  selectedOption: string,
  displayedAnswer: string,
  nextQuestion?: FollowUpQuestion
): AskFarmMateConsultationState {
  const answer: FarmMateConsultationAnswer = {
    questionId: cleanConsultationText(currentQuestion.id, 120),
    question: cleanConsultationText(currentQuestion.question, 300),
    answer: cleanConsultationText(displayedAnswer, 300),
    selectedOption: cleanConsultationText(selectedOption, 200),
    options: (currentQuestion.options ?? ["I can check this", "I am not sure", "I need help checking"])
      .map((option) => cleanConsultationText(option, 200))
      .filter(Boolean)
  };
  const contextField = contextFieldForQuestion(currentQuestion.id);
  const nextState: AskFarmMateConsultationState = {
    ...consultation,
    pendingFollowUpQuestion: nextQuestion,
    followUpOptions: nextQuestion?.options,
    answerHistory: [...consultation.answerHistory, answer].slice(-12),
    status: nextQuestion ? "awaiting_follow_up" : "preparing_answer"
  };

  if (contextField) {
    nextState[contextField] = answer.answer;
  }

  return nextState;
}

export function consultationContextForApi(
  consultation: AskFarmMateConsultationState
): FarmMateConsultationContext {
  return {
    normalizedCrop: consultation.normalizedCrop,
    selectedRegion: consultation.selectedRegion,
    selectedCrop: consultation.selectedCrop,
    growthStage: consultation.growthStage,
    selectedSymptom: consultation.selectedSymptom,
    waterStatus: consultation.waterStatus,
    pendingFollowUpQuestion: consultation.pendingFollowUpQuestion,
    followUpOptions: consultation.followUpOptions,
    answerHistory: consultation.answerHistory
  };
}

export type AskFarmMateUsageMode = "record" | "continue" | "reject";

export function askFarmMateUsageMode({
  isFollowUp,
  verifiedContinuation
}: {
  isFollowUp: boolean;
  verifiedContinuation: boolean;
}): AskFarmMateUsageMode {
  if (!isFollowUp) {
    return "record";
  }

  return verifiedContinuation ? "continue" : "reject";
}

export function isFinalAskFarmMateConsultation(consultation?: AskFarmMateConsultationState | null) {
  return consultation?.status === "complete" && !consultation.pendingFollowUpQuestion;
}

export function shouldShowFarmMateFinalControls({
  consultation,
  finalAnswer,
  isBusy,
  creditReason
}: {
  consultation?: AskFarmMateConsultationState | null;
  finalAnswer: string;
  isBusy: boolean;
  creditReason?: string;
}) {
  return (
    isFinalAskFarmMateConsultation(consultation) &&
    !isBusy &&
    creditReason !== "credits_exhausted" &&
    finalAnswer.trim().length > 0
  );
}

export function isValidFarmMateConsultationContext(value: unknown): value is FarmMateConsultationContext {
  if (!value || typeof value !== "object") {
    return false;
  }

  const context = value as Partial<FarmMateConsultationContext>;

  if (!Array.isArray(context.answerHistory) || context.answerHistory.length > 12) {
    return false;
  }

  const optionalTextFields = [
    context.normalizedCrop,
    context.selectedRegion,
    context.selectedCrop,
    context.growthStage,
    context.selectedSymptom,
    context.waterStatus
  ];

  if (optionalTextFields.some((field) => field !== undefined && !isBoundedConsultationText(field, 300))) {
    return false;
  }

  if (
    context.followUpOptions !== undefined &&
    (!Array.isArray(context.followUpOptions) ||
      context.followUpOptions.length > 12 ||
      context.followUpOptions.some((option) => !isBoundedConsultationText(option, 200)))
  ) {
    return false;
  }

  if (context.pendingFollowUpQuestion) {
    const pending = context.pendingFollowUpQuestion;
    if (
      !isBoundedConsultationText(pending.id, 120) ||
      !isBoundedConsultationText(pending.question, 300) ||
      (pending.options !== undefined &&
        (!Array.isArray(pending.options) ||
          pending.options.length > 12 ||
          pending.options.some((option) => !isBoundedConsultationText(option, 200))))
    ) {
      return false;
    }
  }

  return context.answerHistory.every((answer) => {
    if (!answer || typeof answer !== "object") return false;
    const candidate = answer as Partial<FarmMateConsultationAnswer>;
    return (
      isBoundedConsultationText(candidate.questionId, 120) &&
      isBoundedConsultationText(candidate.question, 300) &&
      isBoundedConsultationText(candidate.answer, 300) &&
      isBoundedConsultationText(candidate.selectedOption, 200) &&
      Array.isArray(candidate.options) &&
      candidate.options.length > 0 &&
      candidate.options.length <= 12 &&
      candidate.options.every((option) => isBoundedConsultationText(option, 200)) &&
      candidate.options.includes(candidate.selectedOption ?? "")
    );
  });
}
