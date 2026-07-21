export const FARM_MATE_ANSWER_FEEDBACK_STORAGE_KEY = "gg_farmmate_answer_feedback_v1";
export const FARM_MATE_ANSWER_FEEDBACK_PATH = "/farmer-hub/feedback?source=answer_feedback";

export const FARM_MATE_PILOT_TRUST_NOTE =
  "FarmMate is a pilot advisor. For serious or spreading crop problems, confirm with an extension officer.";

export const farmMateAnswerFeedbackOptions = [
  { value: "helpful", label: "Helpful" },
  { value: "not_clear", label: "Not clear" },
  { value: "wrong_answer", label: "Wrong answer" }
] as const;

export const farmMateWrongAnswerReasons = [
  { value: "wrong_crop", label: "Wrong crop" },
  { value: "wrong_problem", label: "Wrong problem" },
  { value: "not_enough_detail", label: "Not enough detail" },
  { value: "advice_not_practical", label: "Advice not practical" },
  { value: "other", label: "Other" }
] as const;

export type FarmMateAnswerFeedbackType = (typeof farmMateAnswerFeedbackOptions)[number]["value"];
export type FarmMateWrongAnswerReason = (typeof farmMateWrongAnswerReasons)[number]["value"];
export type FarmMateFeedbackTool = "ask_farmmate" | "crop_doctor";

export type FarmMatePreparedAnswerFeedback = {
  version: 1;
  tool: FarmMateFeedbackTool;
  timestamp: string;
  feedbackType?: FarmMateAnswerFeedbackType;
  originalQuestion?: string;
  specialist?: string;
  answerSnippet?: string;
  wrongReason?: FarmMateWrongAnswerReason;
  optionalText?: string;
  selectedCrop?: string;
  detectedCrop?: string;
  selectedSymptom?: string;
  resultType?: string;
  visibleSignsSnippet?: string;
};

export type FarmMateAnswerFeedbackInput = Omit<FarmMatePreparedAnswerFeedback, "version">;

export type FarmMateAnswerFeedbackFormPrefill = {
  testedFeature: string;
  helpfulness?: "yes" | "partly" | "not_yet";
  mainCrop?: string;
  confusion?: string;
  improvement?: string;
};

type AnswerCard = {
  title: string;
  body: string[];
};

const feedbackTypes = new Set<FarmMateAnswerFeedbackType>(farmMateAnswerFeedbackOptions.map((option) => option.value));
const wrongReasons = new Set<FarmMateWrongAnswerReason>(farmMateWrongAnswerReasons.map((option) => option.value));
const tools = new Set<FarmMateFeedbackTool>(["ask_farmmate", "crop_doctor"]);

function cleanInlineText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function setIfPresent<K extends keyof FarmMatePreparedAnswerFeedback>(
  target: FarmMatePreparedAnswerFeedback,
  key: K,
  value: FarmMatePreparedAnswerFeedback[K]
) {
  if (value) {
    target[key] = value;
  }
}

export function sanitizeFarmMatePreparedAnswerFeedback(input: unknown): FarmMatePreparedAnswerFeedback | null {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const tool = typeof source.tool === "string" && tools.has(source.tool as FarmMateFeedbackTool)
    ? (source.tool as FarmMateFeedbackTool)
    : null;
  const timestamp = cleanInlineText(source.timestamp, 40);

  if (!tool || !timestamp || Number.isNaN(Date.parse(timestamp))) {
    return null;
  }

  const prepared: FarmMatePreparedAnswerFeedback = {
    version: 1,
    tool,
    timestamp: new Date(timestamp).toISOString()
  };
  const feedbackType = typeof source.feedbackType === "string" && feedbackTypes.has(source.feedbackType as FarmMateAnswerFeedbackType)
    ? (source.feedbackType as FarmMateAnswerFeedbackType)
    : undefined;
  const wrongReason = typeof source.wrongReason === "string" && wrongReasons.has(source.wrongReason as FarmMateWrongAnswerReason)
    ? (source.wrongReason as FarmMateWrongAnswerReason)
    : undefined;

  setIfPresent(prepared, "feedbackType", feedbackType);
  setIfPresent(prepared, "wrongReason", wrongReason);
  setIfPresent(prepared, "originalQuestion", cleanInlineText(source.originalQuestion, 220));
  setIfPresent(prepared, "specialist", cleanInlineText(source.specialist, 80));
  setIfPresent(prepared, "answerSnippet", cleanInlineText(source.answerSnippet, 240));
  setIfPresent(prepared, "optionalText", cleanInlineText(source.optionalText, 400));
  setIfPresent(prepared, "selectedCrop", cleanInlineText(source.selectedCrop, 80));
  setIfPresent(prepared, "detectedCrop", cleanInlineText(source.detectedCrop, 80));
  setIfPresent(prepared, "selectedSymptom", cleanInlineText(source.selectedSymptom, 120));
  setIfPresent(prepared, "resultType", cleanInlineText(source.resultType, 80));
  setIfPresent(prepared, "visibleSignsSnippet", cleanInlineText(source.visibleSignsSnippet, 240));

  return prepared;
}

export function storeFarmMatePreparedAnswerFeedback(
  storage: Pick<Storage, "setItem">,
  input: FarmMateAnswerFeedbackInput | FarmMatePreparedAnswerFeedback
) {
  const prepared = sanitizeFarmMatePreparedAnswerFeedback(input);

  if (!prepared) {
    return false;
  }

  try {
    storage.setItem(FARM_MATE_ANSWER_FEEDBACK_STORAGE_KEY, JSON.stringify(prepared));
    return true;
  } catch {
    return false;
  }
}

export function readFarmMatePreparedAnswerFeedback(storage: Pick<Storage, "getItem">) {
  try {
    const stored = storage.getItem(FARM_MATE_ANSWER_FEEDBACK_STORAGE_KEY);
    return stored ? sanitizeFarmMatePreparedAnswerFeedback(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

function feedbackTypeLabel(type: FarmMateAnswerFeedbackType | undefined, tool: FarmMateFeedbackTool) {
  if (type === "wrong_answer" && tool === "crop_doctor") {
    return "Wrong crop/problem";
  }

  return farmMateAnswerFeedbackOptions.find((option) => option.value === type)?.label;
}

function wrongReasonLabel(reason?: FarmMateWrongAnswerReason) {
  return farmMateWrongAnswerReasons.find((option) => option.value === reason)?.label;
}

export function farmMateAnswerFeedbackFormPrefill(
  feedback: FarmMatePreparedAnswerFeedback
): FarmMateAnswerFeedbackFormPrefill {
  const toolLabel = feedback.tool === "ask_farmmate" ? "Ask FarmMate" : "Crop Doctor";
  const ratingLabel = feedbackTypeLabel(feedback.feedbackType, feedback.tool);
  const askFarmMateContext = feedback.tool === "ask_farmmate"
    ? [
        feedback.originalQuestion ? `Question: ${feedback.originalQuestion}` : "",
        feedback.specialist ? `Specialist: ${feedback.specialist}` : ""
      ]
    : [];
  const cropDoctorContext = feedback.tool === "crop_doctor"
    ? [
        feedback.selectedCrop ? `Selected crop: ${feedback.selectedCrop.slice(0, 40)}` : "",
        feedback.detectedCrop ? `Detected crop: ${feedback.detectedCrop.slice(0, 40)}` : "",
        feedback.selectedSymptom ? `Selected symptom: ${feedback.selectedSymptom.slice(0, 60)}` : "",
        feedback.resultType ? `Result type: ${feedback.resultType.slice(0, 40)}` : ""
      ]
    : [];
  const testedFeature = [
    `Tool: ${toolLabel}`,
    ratingLabel ? `Rating: ${ratingLabel}` : "",
    `Feedback time: ${feedback.timestamp}`,
    ...askFarmMateContext,
    ...cropDoctorContext,
    feedback.answerSnippet ? `Answer: ${feedback.answerSnippet.slice(0, 80)}` : ""
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 500);
  const confusion = [
    wrongReasonLabel(feedback.wrongReason) ? `What was wrong: ${wrongReasonLabel(feedback.wrongReason)}` : "",
    feedback.visibleSignsSnippet ? `Visible signs: ${feedback.visibleSignsSnippet}` : ""
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 800);

  return {
    testedFeature,
    helpfulness:
      feedback.feedbackType === "helpful"
        ? "yes"
        : feedback.feedbackType === "not_clear"
          ? "partly"
          : feedback.feedbackType === "wrong_answer"
            ? "not_yet"
            : undefined,
    mainCrop: feedback.selectedCrop ?? feedback.detectedCrop,
    confusion: confusion || undefined,
    improvement: feedback.optionalText
  };
}

function cleanAnswerLines(value: string) {
  return value
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(
      (line) =>
        line &&
        !/^(?:farmmate router|farmmate current user question|farmmate detected crop|farmmate selected specialist|matched keywords|confidence|flow id)\b/i.test(line)
    );
}

export function farmMateCleanAnswerForCopy(naturalAnswer: string, cards: AnswerCard[]) {
  const naturalLines = cleanAnswerLines(naturalAnswer);

  if (naturalLines.length) {
    return naturalLines.join("\n").slice(0, 5000);
  }

  return cards
    .filter((card) => card.title.trim().toLowerCase() !== "here's what i understand")
    .map((card) => {
      const title = cleanInlineText(card.title, 80);
      const body = cleanAnswerLines(card.body.join("\n"));
      return title && body.length ? `${title}:\n${body.join("\n")}` : "";
    })
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 5000);
}

export function farmMateAnswerSnippet(answer: string) {
  return cleanInlineText(answer, 240);
}

export function shouldShowFarmMateAnswerFeedback(answerText: string, isBusy: boolean) {
  return !isBusy && farmMateAnswerSnippet(answerText).length > 0;
}
