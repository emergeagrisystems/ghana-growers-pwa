import { recognizeFarmEnterprise } from "./enterprise-topics";

/** A2 only. Deterministic refusals use the existing zero-credit safety path. */
export function enterpriseHighRiskAnswer(question: string): string | null {
  const enterprise = recognizeFarmEnterprise(question);
  if (!enterprise) return null;
  if (/\b(dosage|dose|how much|how many|percent\w*|ratio|ration recipe|formulat\w*|inclusion|application rate)\b/i.test(question) && /\b(feed|feeding|ration|chicken\w*|poultry|fish|pig\w*|frass|fertili[sz]er)\b/i.test(question) && !/\b(cost|budget|price)\b/i.test(question)) {
    return "I cannot choose a feed inclusion amount, formulate a ration or give a frass application rate from this question. A study's percentage is not a prescription for your animals or soil. Keep the current professionally formulated feed plan while a qualified animal nutritionist checks the animal, age, ingredient analysis and existing ration; frass needs a crop, soil and product assessment. Next step: gather those details before changing the rate. No Ask credit was used.";
  }
  if (enterprise.id === "bsf" && /\b(anywhere|any waste|all waste|whatever waste|mixed waste|unknown waste|sewage|faeces|feces|sludge|hospital|medical waste|manure|slaughter\w*|mouldy|moldy|pesticide.contaminated|chemical waste)\b/i.test(question)) {
    return "Do not use unknown, contaminated or high-risk waste to produce animal feed. BSF larvae surviving on it does not show that the larvae or frass are safe. Keep suspect inputs and outputs separate from feed and soil-use products. Research use of manure or other wastes is not approval for your farm. Next step: show the exact material, its source and intended output to a competent feed-safety adviser before using it. No Ask credit was used.";
  }
  if (/\b(vaccine\w*|antibiotic\w*|deworm\w*|treat.*(?:sick|infection)|cure|medicin\w*|safe to feed|safe to eat|nutritionally complete|complete feed|sterili[sz]\w*|kill all pathogens)\b/i.test(question)) {
    return "I cannot give veterinary treatment or certify an insect product as safe or nutritionally complete. A product's appearance, drying or insect survival cannot establish that. Keep any suspect batch out of feed use pending assessment. Next step: take the animal or product history to a qualified veterinarian, nutritionist or feed-safety adviser as appropriate. No Ask credit was used.";
  }
  return null;
}

/** Reject new high-risk generated prescriptions; existing durable failure recovery remains responsible for the outcome. */
export function hasUnsafeEnterpriseOutput(answer: string): boolean {
  if (/\b\d+(?:\.\d+)?\s*(?:%|percent|kg|mg|ml|grams?|litres?|liters?|degrees|°c|ppm|ppb)|\b(?:one|two|three|five|ten|twenty|fifty)\s+(?:percent|parts?\b.*\bfeed)/i.test(answer)) return true;
  return answer.split(/[.!?\n;]+|\b(?:but|however)\b/i).some(sentence => {
    // A negated permission requirement is itself an unsupported approval claim.
    if (/\bno permits? (?:needed|required)\b/i.test(sentence)) return true;
    // Exempt explicit rejections, not any sentence that happens to contain "not".
    if (/^\s*(?:\d+[.)]\s*)?(?:do not|don't|never|avoid|I cannot|I can't|this is not|there is no)\b/i.test(sentence)) return false;
    if (/\bdoes not mean\b.*\b(?:automatically approved|safe to (?:feed|eat))\b/i.test(sentence)) return false;
    return /\b(?:guarantee(?:d|s)? (?:profit|return|growth|sales)|(?:profit|return|growth|sales) (?:is|are) guaranteed|will (?:double|triple)|safe to (?:feed|eat)|nutritionally complete|automatically approved|approved (?:for use|in Ghana)|use any waste|feed.*(?:sewage|manure|sludge)|(?:kills?|eliminates?) all (?:pathogens|toxins))\b/i.test(sentence.replace(/\bno (?:profit|return|growth|sales) (?:is|are) guaranteed\b/gi, ""));
  });
}
