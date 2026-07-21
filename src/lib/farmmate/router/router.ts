import { farmMateRouterRules } from "./rules";
import { detectFarmMateCropFromQuestion } from "../crop-context";
import { findFarmMateCropLibraryEntry } from "../crop-library";
import type { FarmMateRouterContext, RouterConfidence, RouterResult, RouterRule } from "./types";

function normalizeQuestion(question: string) {
  return question.toLowerCase().replace(/\s+/g, " ").trim();
}

function keywordMatches(normalizedQuestion: string, keyword: string) {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(?:^|\\b)${escapedKeyword}(?:\\b|$)`).test(normalizedQuestion);
}

function matchedKeywordsForRule(normalizedQuestion: string, rule: RouterRule) {
  return rule.keywords.filter((keyword) => keywordMatches(normalizedQuestion, keyword));
}

function confidenceFromMatches(matchCount: number): RouterConfidence {
  if (matchCount >= 2) {
    return "high";
  }

  if (matchCount === 1) {
    return "medium";
  }

  return "low";
}

export function routeFarmMateQuestion(question: string, context: FarmMateRouterContext = {}): RouterResult {
  const normalizedQuestion = normalizeQuestion(question);
  const questionCrop = detectFarmMateCropFromQuestion(question);
  const detectedCrop = context.crop ?? questionCrop?.displayName;
  const detectedCropEntry = findFarmMateCropLibraryEntry(detectedCrop);
  const fallbackResult: RouterResult = {
    selectedSpecialist: "general_agronomy",
    confidence: "low",
    matchedKeywords: [],
    reason: "No specialist keyword matched clearly, so FarmMate should start with general farming guidance and ask for more context.",
    suggestedFallbackSpecialist: "general_agronomy",
    detectedCrop
  };

  if (!normalizedQuestion) {
    return fallbackResult;
  }

  if (context.source === "crop_doctor") {
    const hasCropDoctorContext = Boolean(context.crop || context.possibleIssue || context.issueCategory);

    if (!hasCropDoctorContext) {
      return fallbackResult;
    }

    return {
      selectedSpecialist: context.issueCategory === "unknown" ? "crop_doctor" : "crop_doctor",
      confidence: "high",
      matchedKeywords: ["crop_doctor_handoff"],
      reason: "Crop Doctor handed off structured photo context, so FarmMate should stay inside crop photo and plant health guidance.",
      suggestedFallbackSpecialist: "crop_health",
      detectedCrop: detectedCrop ?? undefined
    };
  }

  const matches = farmMateRouterRules
    .map((rule) => ({
      rule,
      matchedKeywords: matchedKeywordsForRule(normalizedQuestion, rule)
    }))
    .filter((match) => match.matchedKeywords.length > 0)
    .sort((a, b) => b.matchedKeywords.length - a.matchedKeywords.length);

  const bestMatch = matches[0];

  if (!bestMatch) {
    return fallbackResult;
  }

  const isCropChoiceQuestion = normalizedQuestion.includes("what should i plant") || normalizedQuestion.includes("crop to grow");
  const isSupportedMelonClarification = normalizedQuestion.includes("melon");

  if (
    bestMatch.rule.specialist === "planting" &&
    (!detectedCrop || !detectedCropEntry?.supportedFor.includes("planting")) &&
    !isCropChoiceQuestion &&
    !isSupportedMelonClarification
  ) {
    return {
      ...fallbackResult,
      confidence: "medium",
      matchedKeywords: bestMatch.matchedKeywords,
      reason: "The crop is not confirmed in the Knowledge Engine, so FarmMate should use general agronomy principles before crop-specific planting guidance."
    };
  }

  return {
    selectedSpecialist: bestMatch.rule.specialist,
    confidence: confidenceFromMatches(bestMatch.matchedKeywords.length),
    matchedKeywords: bestMatch.matchedKeywords,
    reason: bestMatch.rule.reason,
    suggestedFallbackSpecialist: bestMatch.rule.suggestedFallbackSpecialist,
    detectedCrop
  };
}
