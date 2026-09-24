// A narrow release guard for explicit hazardous chemical requests. It does not
// infer a safe product, rate, tank mixture or diagnosis from an incomplete query.
export function explicitChemicalSafetyAnswer(question: string): string | null {
  const chemical = /\b(pesticides?|insecticides?|herbicides?|fungicides?|chemicals?|spray(?:ing|er)?|fertili[sz]ers?|labels?|doses?|dosage)\b/i.test(question);
  const escalation = /\b(double|triple|quadruple|exceed|stronger|extra|more than|above|overdose)\b/i.test(question);
  const mixture = /\b(mix|mixing|mixture|combine|combining)\b/i.test(question);
  if (!chemical || (!escalation && !mixture)) return null;
  return "Do not exceed the product label rate or mix products unless their labels explicitly permit that mixture. I cannot recommend an extra dose or confirm that a mixture is safe. Follow the label, including protective equipment and harvest waiting periods. Ask a qualified local extension officer or the product supplier to check the exact products and crop before applying anything.";
}
