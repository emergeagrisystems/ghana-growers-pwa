import { NextResponse } from "next/server";
import { generateFarmMateNaturalAnswer, type FarmMateAiInput, type FarmMateAskApiInput } from "@/lib/farmmate/ai";
import { buildFarmMateResponse, type FollowUpQuestion } from "@/lib/farmmate/decision-engine";
import {
  askFarmMateUsageMode,
  isValidFarmMateConsultationContext,
  isValidFarmMateConsultationId,
  type FarmMateConsultationAnswer
} from "@/lib/farmmate/consultation";
import {
  canIssueFarmMateConsultationToken,
  farmMateContinuationClaimId,
  issueFarmMateConsultationToken,
  verifyFarmMateConsultationToken
} from "@/lib/farmmate/consultation-token";
import { routeFarmMateQuestion } from "@/lib/farmmate/router";
import { shouldCompleteWeatherGuidedFlow } from "@/lib/farmmate/conversation-ui";
import type {
  CropDoctorConfidence,
  CropDoctorHandoffContext,
  CropDoctorIssueCategory,
  CropDoctorResultType
} from "@/lib/farmmate/crop-doctor-vision";
import { askFarmMateCreditMessage } from "@/lib/farmmate/usage";
import {
  checkFarmMateCreditsForDevice,
  claimFarmMateConsultationContinuation,
  getAnonymousUserHash,
  getFarmMateCreditsForDevice,
  recordFarmMateUsageForDevice
} from "@/lib/farmmate/usage/server";
import type { WeatherDecisionSummary } from "@/lib/farmmate/weather";

const cropDoctorConfidenceValues = new Set<CropDoctorConfidence>(["high", "medium", "low"]);
const cropDoctorIssueCategoryValues = new Set<CropDoctorIssueCategory>([
  "pest",
  "disease",
  "nutrient",
  "water_stress",
  "unknown"
]);
const cropDoctorResultTypeValues = new Set<CropDoctorResultType>([
  "no_clear_problem",
  "possible_disease",
  "possible_pest",
  "possible_nutrient_issue",
  "possible_water_stress",
  "crop_not_confirmed",
  "photo_unclear",
  "harvest_or_storage_check"
]);
const FARM_MATE_WEATHER_CONTEXT_MAX_AGE_MS = 24 * 60 * 60 * 1_000;
const FARM_MATE_WEATHER_CONTEXT_FUTURE_TOLERANCE_MS = 5 * 60 * 1_000;

function isShortText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNullableShortText(value: unknown, maxLength: number): value is string | null {
  return value === null || isShortText(value, maxLength);
}

function isOptionalNumberInRange(value: unknown, minimum: number, maximum: number) {
  return value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum);
}

function isCropDoctorHandoffContext(value: unknown): value is CropDoctorHandoffContext {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.source === "crop_doctor" &&
    isShortText(value.question, 1_000) &&
    isShortText(value.selectedCrop, 160) &&
    isNullableShortText(value.selectedSymptom, 300) &&
    isNullableShortText(value.crop, 160) &&
    isNullableShortText(value.cropGroup, 160) &&
    isNullableShortText(value.cropFamily, 160) &&
    typeof value.cropConfidence === "string" &&
    cropDoctorConfidenceValues.has(value.cropConfidence as CropDoctorConfidence) &&
    isShortText(value.possibleIssue, 1_000) &&
    typeof value.issueCategory === "string" &&
    cropDoctorIssueCategoryValues.has(value.issueCategory as CropDoctorIssueCategory) &&
    typeof value.resultType === "string" &&
    cropDoctorResultTypeValues.has(value.resultType as CropDoctorResultType) &&
    Array.isArray(value.visibleSigns) &&
    value.visibleSigns.length <= 6 &&
    value.visibleSigns.every((sign) => isShortText(sign, 500)) &&
    isShortText(value.nextBestAction, 1_000) &&
    isNullableShortText(value.familyGuidance, 1_000) &&
    isNullableShortText(value.limitedGuidanceNote, 1_000) &&
    isNullableShortText(value.cashCropCaution, 1_000)
  );
}

function isWeatherDecisionSummary(value: unknown): value is WeatherDecisionSummary {
  if (!isRecord(value)) {
    return false;
  }

  const hasOrderedTemperatureRange =
    typeof value.temperatureMinC !== "number" ||
    typeof value.temperatureMaxC !== "number" ||
    value.temperatureMinC <= value.temperatureMaxC;
  const updatedAt = typeof value.lastUpdatedAt === "string" ? Date.parse(value.lastUpdatedAt) : Number.NaN;
  const weatherContextAgeMs = Date.now() - updatedAt;

  return (
    isShortText(value.locationName, 200) &&
    isShortText(value.sourceLabel, 160) &&
    isShortText(value.lastUpdatedAt, 80) &&
    Number.isFinite(updatedAt) &&
    weatherContextAgeMs >= -FARM_MATE_WEATHER_CONTEXT_FUTURE_TOLERANCE_MS &&
    weatherContextAgeMs <= FARM_MATE_WEATHER_CONTEXT_MAX_AGE_MS &&
    isOptionalNumberInRange(value.rainChancePercent, 0, 100) &&
    isOptionalNumberInRange(value.temperatureMinC, -30, 60) &&
    isOptionalNumberInRange(value.temperatureMaxC, -30, 60) &&
    hasOrderedTemperatureRange &&
    isOptionalNumberInRange(value.windSpeedKph, 0, 300) &&
    Array.isArray(value.farmingNotes) &&
    value.farmingNotes.length <= 8 &&
    value.farmingNotes.every((note) => isShortText(note, 500)) &&
    isShortText(value.summaryNote, 1_000) &&
    typeof value.liveWeatherAvailable === "boolean"
  );
}

function hasValidFarmMateBrainContexts(value: unknown): value is {
  cropDoctorContext?: CropDoctorHandoffContext;
  weatherContext?: WeatherDecisionSummary;
} {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.cropDoctorContext === undefined || isCropDoctorHandoffContext(value.cropDoctorContext)) &&
    (value.weatherContext === undefined || isWeatherDecisionSummary(value.weatherContext))
  );
}

function isFarmMateAiInput(value: unknown): value is FarmMateAiInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Partial<FarmMateAiInput>;

  return (
    isShortText(input.farmerQuestion, 500) &&
    hasValidFarmMateBrainContexts(input.brain) &&
    Array.isArray(input.farmerAnswers) &&
    input.farmerAnswers.length <= 12 &&
    Array.isArray(input.localStructuredResponse) &&
    input.localStructuredResponse.length <= 8 &&
    input.localStructuredResponse.every(
      (card) =>
        isShortText(card?.title, 80) &&
        Array.isArray(card?.body) &&
        card.body.length <= 8 &&
        card.body.every((line) => isShortText(line, 500))
    )
  );
}

function sameAnswer(left: FarmMateConsultationAnswer | undefined, right: FarmMateConsultationAnswer | undefined) {
  return Boolean(
    left &&
      right &&
      left.questionId === right.questionId &&
      left.question === right.question &&
      left.answer === right.answer &&
      left.selectedOption === right.selectedOption &&
      JSON.stringify(left.options) === JSON.stringify(right.options)
  );
}

function isFarmMateAskApiInput(value: unknown): value is FarmMateAskApiInput {
  if (!isFarmMateAiInput(value)) {
    return false;
  }

  const input = value as FarmMateAiInput & Partial<FarmMateAskApiInput>;
  const context = input.consultationContext;

  if (
    !isShortText(input.anonymousDeviceId, 160) ||
    !isValidFarmMateConsultationId(input.consultationId) ||
    !isShortText(input.originalQuestion, 500) ||
    input.originalQuestion.trim() !== input.farmerQuestion.trim() ||
    (input.brain.cropDoctorContext !== undefined &&
      input.brain.cropDoctorContext.question.trim() !== input.originalQuestion.trim()) ||
    typeof input.isFollowUp !== "boolean" ||
    typeof input.deferAnswer !== "boolean" ||
    !isValidFarmMateConsultationContext(context)
  ) {
    return false;
  }

  if (!input.isFollowUp) {
    return context.answerHistory.length === 0 && !input.followUpAnswer && !input.consultationToken;
  }

  const latestAnswer = context.answerHistory[context.answerHistory.length - 1];
  return (
    isShortText(input.consultationToken, 2048) &&
    context.answerHistory.length > 0 &&
    sameAnswer(latestAnswer, input.followUpAnswer)
  );
}

function authoritativeQuestion(input: FarmMateAskApiInput) {
  const original = input.originalQuestion.trim();
  const normalized = original.toLowerCase();
  const selectedCrop = [...input.consultationContext.answerHistory]
    .reverse()
    .find((answer) => answer.questionId.includes("crop-type"))
    ?.selectedOption.toLowerCase();

  if (selectedCrop === "watermelon" && normalized.includes("melon") && !normalized.includes("watermelon")) {
    return "How do I plant watermelon?";
  }

  return original;
}

function canonicalCropDoctorContext(context?: CropDoctorHandoffContext): CropDoctorHandoffContext | undefined {
  if (!context) {
    return undefined;
  }

  return {
    source: "crop_doctor",
    question: context.question,
    selectedCrop: context.selectedCrop,
    selectedSymptom: context.selectedSymptom,
    crop: context.crop,
    cropGroup: context.cropGroup,
    cropFamily: context.cropFamily,
    cropConfidence: context.cropConfidence,
    possibleIssue: context.possibleIssue,
    issueCategory: context.issueCategory,
    resultType: context.resultType,
    visibleSigns: context.visibleSigns,
    nextBestAction: context.nextBestAction,
    familyGuidance: context.familyGuidance,
    limitedGuidanceNote: context.limitedGuidanceNote,
    cashCropCaution: context.cashCropCaution
  };
}

function canonicalWeatherContext(context?: WeatherDecisionSummary): WeatherDecisionSummary | undefined {
  if (!context) {
    return undefined;
  }

  return {
    locationName: context.locationName,
    sourceLabel: context.sourceLabel,
    lastUpdatedAt: context.lastUpdatedAt,
    rainChancePercent: context.rainChancePercent,
    temperatureMinC: context.temperatureMinC,
    temperatureMaxC: context.temperatureMaxC,
    windSpeedKph: context.windSpeedKph,
    farmingNotes: context.farmingNotes,
    summaryNote: context.summaryNote,
    liveWeatherAvailable: context.liveWeatherAvailable
  };
}

function authoritativeBrain(input: FarmMateAskApiInput) {
  const question = authoritativeQuestion(input);
  const cropDoctorContext = canonicalCropDoctorContext(input.brain.cropDoctorContext);
  const weatherContext = canonicalWeatherContext(input.brain.weatherContext);
  const routerResult = routeFarmMateQuestion(question, cropDoctorContext);

  return buildFarmMateResponse(question, routerResult, {
    cropDoctorContext,
    weatherContext
  });
}

function boundConsultationContext(input: FarmMateAskApiInput) {
  return {
    cropDoctorContext: canonicalCropDoctorContext(input.brain.cropDoctorContext) ?? null,
    weatherContext: canonicalWeatherContext(input.brain.weatherContext) ?? null
  };
}

function nextFollowUpQuestion(input: FarmMateAskApiInput, brain: ReturnType<typeof buildFarmMateResponse>): FollowUpQuestion | undefined {
  const flowQuestions = brain.flow?.followUpQuestions ?? [];
  const answeredQuestionIds = new Set(input.consultationContext.answerHistory.map((answer) => answer.questionId));
  const farmerAnswers = input.consultationContext.answerHistory.map(({ question, selectedOption }) => ({
    question,
    answer: selectedOption
  }));

  if (shouldCompleteWeatherGuidedFlow(brain.flow?.id, farmerAnswers)) {
    return undefined;
  }

  return flowQuestions.find((question) => !answeredQuestionIds.has(question.id));
}

function authoritativeStructuredResponse(
  brain: ReturnType<typeof buildFarmMateResponse>,
  answerHistory: FarmMateConsultationAnswer[]
): FarmMateAiInput["localStructuredResponse"] {
  const sectionBody = (title: FarmMateAiInput["brain"]["sections"][number]["title"]) =>
    brain.sections.find((section) => section.title === title)?.body ?? [];
  const learnedContext = answerHistory.map((answer) => answer.selectedOption).filter(Boolean).slice(0, 4);

  return [
    {
      title: "What I think",
      body: [
        ...(learnedContext.length ? [`You told me: ${learnedContext.join("; ")}`] : []),
        ...sectionBody("Direct answer").slice(0, 1),
        ...sectionBody("Why this may happen").slice(0, 1)
      ].slice(0, 3)
    },
    {
      title: "What to do now",
      body: sectionBody("Recommended action").slice(0, 3)
    },
    {
      title: "What to check",
      body: sectionBody("What to check").slice(0, 3)
    },
    {
      title: "Next step",
      body: sectionBody("Next Best Action").slice(0, 1)
    }
  ];
}

function verifiedAiInput(input: FarmMateAskApiInput, brain: ReturnType<typeof buildFarmMateResponse>): FarmMateAiInput {
  return {
    farmerQuestion: input.originalQuestion.trim(),
    brain,
    farmerAnswers: input.consultationContext.answerHistory.map(({ question, selectedOption }) => ({
      question,
      answer: selectedOption
    })),
    localStructuredResponse: authoritativeStructuredResponse(brain, input.consultationContext.answerHistory)
  };
}

async function creditStatus(anonymousDeviceId: string) {
  return getFarmMateCreditsForDevice({ anonymousDeviceId, tool: "ask_farmmate" });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (Number.isFinite(contentLength) && contentLength > 128_000) {
    return NextResponse.json({ ok: false, reason: "request_too_large", fallback: true }, { status: 413 });
  }

  const rawPayload = await request.text();

  if (rawPayload.length > 128_000) {
    return NextResponse.json({ ok: false, reason: "request_too_large", fallback: true }, { status: 413 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawPayload);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json", fallback: true }, { status: 400 });
  }

  if (!isFarmMateAskApiInput(payload)) {
    return NextResponse.json({ ok: false, reason: "invalid_farmmate_context", fallback: true }, { status: 400 });
  }

  const anonymousUserHash = getAnonymousUserHash(payload.anonymousDeviceId);

  if (!anonymousUserHash) {
    return NextResponse.json({ ok: false, reason: "invalid_device_id", fallback: true }, { status: 400 });
  }

  const brain = authoritativeBrain(payload);
  const pendingFollowUp = nextFollowUpQuestion(payload, brain);

  if (!payload.isFollowUp) {
    const mode = askFarmMateUsageMode({ isFollowUp: false, verifiedContinuation: false });

    if (mode !== "record") {
      return NextResponse.json({ ok: false, reason: "invalid_consultation", fallback: true }, { status: 400 });
    }

    if (pendingFollowUp && !canIssueFarmMateConsultationToken()) {
      return NextResponse.json(
        {
          ok: false,
          reason: "consultation_tracking_unavailable",
          fallback: true,
          message: "FarmMate guided follow-ups are temporarily unavailable. Please try again shortly."
        },
        { status: 503 }
      );
    }

    const creditDecision = await checkFarmMateCreditsForDevice({
      anonymousDeviceId: payload.anonymousDeviceId,
      tool: "ask_farmmate"
    });

    if (!creditDecision.allowed) {
      const usageUnavailable = creditDecision.reason === "usage_tracking_unavailable";

      return NextResponse.json(
        {
          ok: false,
          reason: creditDecision.reason,
          fallback: true,
          credits: creditDecision,
          message: askFarmMateCreditMessage(creditDecision)
        },
        { status: usageUnavailable ? 503 : 429 }
      );
    }

    const recordResult = await recordFarmMateUsageForDevice({
      anonymousDeviceId: payload.anonymousDeviceId,
      tool: "ask_farmmate"
    });

    if (!recordResult.recorded || !recordResult.eventId) {
      return NextResponse.json(
        {
          ok: false,
          reason: "usage_tracking_unavailable",
          fallback: true,
          credits: await creditStatus(payload.anonymousDeviceId),
          usageRecorded: false,
          message: "FarmMate AI is temporarily limited, but you can still use the local guidance."
        },
        { status: 503 }
      );
    }

    const credits = await creditStatus(payload.anonymousDeviceId);

    if (pendingFollowUp) {
      const consultationToken = issueFarmMateConsultationToken({
        consultationId: payload.consultationId,
        usageEventId: recordResult.eventId,
        anonymousUserHash,
        originalQuestion: payload.originalQuestion,
        boundContext: boundConsultationContext(payload),
        answerHistory: [],
        pendingFollowUpQuestion: pendingFollowUp
      });

      return NextResponse.json({
        ok: true,
        kind: "follow_up",
        consultationId: payload.consultationId,
        consultationToken,
        followUp: pendingFollowUp,
        credits,
        usageRecorded: true
      });
    }

    const result = await generateFarmMateNaturalAnswer(verifiedAiInput(payload, brain));

    if (!result.ok) {
      return NextResponse.json({
        ...result,
        kind: "final",
        consultationId: payload.consultationId,
        credits,
        usageRecorded: true,
        message: "FarmMate AI is temporarily limited, but you can still use the local guidance."
      });
    }

    return NextResponse.json({
      ...result,
      kind: "final",
      consultationId: payload.consultationId,
      credits,
      usageRecorded: true
    });
  }

  const answerHistory = payload.consultationContext.answerHistory;
  const followUpAnswer = payload.followUpAnswer;
  const previousAnswerHistory = answerHistory.slice(0, -1);
  const verifiedToken = followUpAnswer
    ? verifyFarmMateConsultationToken({
        token: payload.consultationToken,
        consultationId: payload.consultationId,
        anonymousUserHash,
        originalQuestion: payload.originalQuestion,
        boundContext: boundConsultationContext(payload),
        previousAnswerHistory,
        followUpAnswer
      })
    : null;
  const mode = askFarmMateUsageMode({ isFollowUp: true, verifiedContinuation: Boolean(verifiedToken) });

  if (mode !== "continue" || !verifiedToken || !followUpAnswer) {
    return NextResponse.json({ ok: false, reason: "invalid_consultation", fallback: true }, { status: 401 });
  }

  const nextEventId = farmMateContinuationClaimId({
    consultationId: payload.consultationId,
    usageEventId: verifiedToken.usageEventId,
    followUpAnswer
  });
  const claim = await claimFarmMateConsultationContinuation({
    anonymousDeviceId: payload.anonymousDeviceId,
    eventId: verifiedToken.usageEventId,
    nextEventId
  });

  if (!claim.claimed) {
    if (claim.storage === "unavailable") {
      return NextResponse.json(
        {
          ok: false,
          reason: "consultation_tracking_unavailable",
          fallback: true,
          message: "FarmMate could not safely continue this consultation. Please try again shortly."
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: false, reason: "consultation_already_used", fallback: true }, { status: 409 });
  }

  const credits = await creditStatus(payload.anonymousDeviceId);

  if (pendingFollowUp) {
    const consultationToken = issueFarmMateConsultationToken({
      consultationId: payload.consultationId,
      usageEventId: claim.eventId,
      anonymousUserHash,
      originalQuestion: payload.originalQuestion,
      boundContext: boundConsultationContext(payload),
      answerHistory,
      pendingFollowUpQuestion: pendingFollowUp,
      expiresAt: verifiedToken.expiresAt
    });

    return NextResponse.json({
      ok: true,
      kind: "follow_up",
      consultationId: payload.consultationId,
      consultationToken,
      followUp: pendingFollowUp,
      credits,
      usageRecorded: false
    });
  }

  if (claim.replayed) {
    return NextResponse.json({
      ok: false,
      kind: "final",
      fallback: true,
      reason: "consultation_recovered",
      consultationId: payload.consultationId,
      credits,
      usageRecorded: false,
      message: "FarmMate recovered this consultation. Use the guidance below."
    });
  }

  const result = await generateFarmMateNaturalAnswer(verifiedAiInput(payload, brain));

  if (!result.ok) {
    return NextResponse.json({
      ...result,
      kind: "final",
      consultationId: payload.consultationId,
      credits,
      usageRecorded: false,
      message: "FarmMate AI is temporarily limited, but you can still use the local guidance."
    });
  }

  return NextResponse.json({
    ...result,
    kind: "final",
    consultationId: payload.consultationId,
    credits,
    usageRecorded: false
  });
}
