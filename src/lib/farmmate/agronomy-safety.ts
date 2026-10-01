/** Release boundary, not an agronomic determination. Runs before usage reservation. */
export function agronomyHighRiskAnswer(question: string): string | null {
  if (/\b(aflatoxin|mycotoxin|cyanide|cassava.*(?:detox|toxic|poison)|ferment\w*.*(?:safe|recipe)|safe.*ferment\w*|preservative.*(?:mix|recipe)|(?:safe|okay|ok).*(?:eat|feed)|(?:eat|feed).*mould|(?:eat|feed).*mold)\b/i.test(question)) {
    return "I cannot establish food or feed safety, toxin levels or a safe processing recipe from this description or a photo. Keep suspect produce separate and do not use mixing, drying or fermentation as proof that it is safe. A qualified local post-harvest or food-safety adviser needs the crop, batch condition and handling history. Next step: arrange that assessment before using the suspect batch.";
  }
  if (/\b(pesticides?|insecticides?|fungicides?|herbicides?|fertili[sz]ers?|urea|npk)\b/i.test(question) && /\b(dosages?|doses?|rates?|how much|how many|kg|grams?|ml|litres?|liters?)\b/i.test(question)) {
    return "I cannot choose a safe rate from this question. The crop, stage, exact product and locally applicable recommendation or label must be checked first; fertilizer also needs soil and previous-input information. Do not guess a dose or exceed the label. Next step: take the product label and field details to a qualified local extension officer.";
  }
  return null;
}

// Defence in depth for new generated guidance. Rejection uses existing failed-answer recovery.
export function hasUnsafeAgronomyOutput(text: string): boolean {
  if (/\b\d+(?:\.\d+)?\s*(?:kg|mg|ml|grams?|litres?|liters?|°c|degrees|ppm|ppb)\b/i.test(text)) return true;
  return text.split(/[.!?\n]+/).some((sentence) => {
    if (/\b(no|not|never|cannot|can't|unconfirmed|avoid|without)\b/i.test(sentence)) return false;
    return /\b(definitely|confirmed diagnosis|guaranteed (?:yield|shelf life|profit)|safe (?:to eat|to feed|for (?:food|feed|consumption))|(?:remove|destroy) all (?:plants|crops))\b/i.test(sentence);
  });
}
