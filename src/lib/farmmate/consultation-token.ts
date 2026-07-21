import crypto from "node:crypto";
import type { FarmMateConsultationAnswer } from "./consultation";
import type { FollowUpQuestion } from "./decision-engine";

const FARM_MATE_CONSULTATION_TOKEN_TTL_MS = 90 * 60 * 1000;

type FarmMateConsultationTokenClaims = {
  version: 1;
  consultationId: string;
  usageEventId: string;
  anonymousUserHash: string;
  originalQuestionDigest: string;
  boundContextDigest: string;
  answerHistoryDigest: string;
  pendingFollowUpDigest: string;
  step: number;
  issuedAt: number;
  expiresAt: number;
};

function consultationTokenSecret() {
  const configuredSecret = [
    process.env.FARM_MATE_CONSULTATION_SECRET?.trim(),
    process.env.FARMMATE_USAGE_HASH_SALT?.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  ].find((candidate): candidate is string => Boolean(candidate && candidate.length >= 24));

  if (configuredSecret) {
    return configuredSecret;
  }

  return process.env.NODE_ENV === "production" ? "" : "ghana-growers-local-consultation-token";
}

function digest(value: string) {
  return crypto.createHash("sha256").update(value).digest("base64url");
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value ?? null);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }

  const source = value as Record<string, unknown>;
  return `{${Object.keys(source)
    .filter((key) => source[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(source[key])}`)
    .join(",")}}`;
}

function answerHistoryDigest(answers: FarmMateConsultationAnswer[]) {
  return digest(
    JSON.stringify(
      answers.map((answer) => ({
        questionId: answer.questionId,
        question: answer.question,
        answer: answer.answer,
        selectedOption: answer.selectedOption,
        options: answer.options
      }))
    )
  );
}

function pendingFollowUpDigest(question?: FollowUpQuestion) {
  return digest(
    question
      ? JSON.stringify({ id: question.id, question: question.question, options: question.options ?? [] })
      : "none"
  );
}

function sign(encodedClaims: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(encodedClaims).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseClaims(encodedClaims: string): FarmMateConsultationTokenClaims | null {
  try {
    const parsed = JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8")) as Partial<FarmMateConsultationTokenClaims>;

    if (
      parsed.version !== 1 ||
      typeof parsed.consultationId !== "string" ||
      typeof parsed.usageEventId !== "string" ||
      typeof parsed.anonymousUserHash !== "string" ||
      typeof parsed.originalQuestionDigest !== "string" ||
      typeof parsed.boundContextDigest !== "string" ||
      typeof parsed.answerHistoryDigest !== "string" ||
      typeof parsed.pendingFollowUpDigest !== "string" ||
      typeof parsed.step !== "number" ||
      !Number.isInteger(parsed.step) ||
      parsed.step < 0 ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    return parsed as FarmMateConsultationTokenClaims;
  } catch {
    return null;
  }
}

export function canIssueFarmMateConsultationToken() {
  return consultationTokenSecret().length >= 24;
}

export function farmMateContinuationClaimId({
  consultationId,
  usageEventId,
  followUpAnswer
}: {
  consultationId: string;
  usageEventId: string;
  followUpAnswer: FarmMateConsultationAnswer;
}) {
  const secret = consultationTokenSecret();

  if (secret.length < 24) {
    return "";
  }

  const hex = crypto
    .createHmac("sha256", secret)
    .update(
      stableJson({
        consultationId,
        usageEventId,
        questionId: followUpAnswer.questionId,
        selectedOption: followUpAnswer.selectedOption
      })
    )
    .digest("hex")
    .slice(0, 32)
    .split("");

  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);

  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex
    .slice(16, 20)
    .join("")}-${hex.slice(20).join("")}`;
}

export function issueFarmMateConsultationToken({
  consultationId,
  usageEventId,
  anonymousUserHash,
  originalQuestion,
  boundContext,
  answerHistory,
  pendingFollowUpQuestion,
  now = new Date(),
  expiresAt
}: {
  consultationId: string;
  usageEventId: string;
  anonymousUserHash: string;
  originalQuestion: string;
  boundContext: unknown;
  answerHistory: FarmMateConsultationAnswer[];
  pendingFollowUpQuestion?: FollowUpQuestion;
  now?: Date;
  expiresAt?: number;
}) {
  const secret = consultationTokenSecret();

  if (secret.length < 24) {
    return "";
  }

  const claims: FarmMateConsultationTokenClaims = {
    version: 1,
    consultationId,
    usageEventId,
    anonymousUserHash,
    originalQuestionDigest: digest(originalQuestion.trim()),
    boundContextDigest: digest(stableJson(boundContext)),
    answerHistoryDigest: answerHistoryDigest(answerHistory),
    pendingFollowUpDigest: pendingFollowUpDigest(pendingFollowUpQuestion),
    step: answerHistory.length,
    issuedAt: now.getTime(),
    expiresAt: expiresAt ?? now.getTime() + FARM_MATE_CONSULTATION_TOKEN_TTL_MS
  };
  const encodedClaims = Buffer.from(JSON.stringify(claims)).toString("base64url");

  return `${encodedClaims}.${sign(encodedClaims, secret)}`;
}

export function verifyFarmMateConsultationToken({
  token,
  consultationId,
  anonymousUserHash,
  originalQuestion,
  boundContext,
  previousAnswerHistory,
  followUpAnswer,
  now = new Date()
}: {
  token: unknown;
  consultationId: string;
  anonymousUserHash: string;
  originalQuestion: string;
  boundContext: unknown;
  previousAnswerHistory: FarmMateConsultationAnswer[];
  followUpAnswer: FarmMateConsultationAnswer;
  now?: Date;
}) {
  const secret = consultationTokenSecret();

  if (secret.length < 24 || typeof token !== "string" || token.length > 2048) {
    return null;
  }

  const [encodedClaims, suppliedSignature, ...extra] = token.split(".");

  if (!encodedClaims || !suppliedSignature || extra.length || !safeEqual(sign(encodedClaims, secret), suppliedSignature)) {
    return null;
  }

  const claims = parseClaims(encodedClaims);

  if (
    !claims ||
    claims.consultationId !== consultationId ||
    claims.anonymousUserHash !== anonymousUserHash ||
    claims.originalQuestionDigest !== digest(originalQuestion.trim()) ||
    claims.boundContextDigest !== digest(stableJson(boundContext)) ||
    claims.answerHistoryDigest !== answerHistoryDigest(previousAnswerHistory) ||
    claims.pendingFollowUpDigest !==
      pendingFollowUpDigest({
        id: followUpAnswer.questionId,
        question: followUpAnswer.question,
        requiredForConfidence: true,
        options: followUpAnswer.options
      }) ||
    !followUpAnswer.options.includes(followUpAnswer.selectedOption) ||
    claims.step !== previousAnswerHistory.length ||
    claims.expiresAt <= now.getTime() ||
    claims.issuedAt > now.getTime() + 60_000
  ) {
    return null;
  }

  return claims;
}
