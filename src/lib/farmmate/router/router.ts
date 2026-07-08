import { farmMateRouterRules } from "./rules";
import type { RouterConfidence, RouterResult, RouterRule } from "./types";

const fallbackResult: RouterResult = {
  selectedSpecialist: "general_farming",
  confidence: "low",
  matchedKeywords: [],
  reason: "No specialist keyword matched clearly, so FarmMate should start with general farming guidance and ask for more context.",
  suggestedFallbackSpecialist: "general_farming"
};

function normalizeQuestion(question: string) {
  return question.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchedKeywordsForRule(normalizedQuestion: string, rule: RouterRule) {
  return rule.keywords.filter((keyword) => normalizedQuestion.includes(keyword));
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

export function routeFarmMateQuestion(question: string): RouterResult {
  const normalizedQuestion = normalizeQuestion(question);

  if (!normalizedQuestion) {
    return fallbackResult;
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

  return {
    selectedSpecialist: bestMatch.rule.specialist,
    confidence: confidenceFromMatches(bestMatch.matchedKeywords.length),
    matchedKeywords: bestMatch.matchedKeywords,
    reason: bestMatch.rule.reason,
    suggestedFallbackSpecialist: bestMatch.rule.suggestedFallbackSpecialist
  };
}
