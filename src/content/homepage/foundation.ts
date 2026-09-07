// P09-0F F01–F07; amended P09-0A handoff §§4,6–9.
// Static review copy only. These labels do not authorise route activation.
export type FoundationState = "success" | "warning" | "error" | "information" | "neutral" | "checked" | "confirmation" | "unavailable";
export type StateExample = Readonly<{ label: string; description: string; tone: FoundationState }>;
export const foundation = {
  sections: ["01 / Heading & actions", "02 / Information states", "03 / Interface feedback", "04 / Typography"],
  lastChecked: "Last checked",
  brand: "Ghana Growers",
  review: "Private foundation review",
  introduction: "A small review of typography, actions and information states. All examples are synthetic.",
  headline: "Find produce. Find farmers. Farm smarter.",
  heroNote: "Action specimens only — these buttons do not open a destination.",
  actions: ["Buy Produce", "List Your Farm"],
  evidenceTitle: "Clear about what we know",
  evidenceIntro: "Example only — no real record. These labels describe information, not a guarantee.",
  source: "Source: synthetic review fixture",
  scope: "Scope: example information only",
  checkedDate: "7 September 2026",
  checkedDateTime: "2026-09-07",
  evidence: [
    {label: "Checked by Ghana Growers", description: "Example check of the stated information and scope; no guarantee is implied.", tone: "checked"},
    {label: "Farmer-reported", description: "Example information supplied by a farmer; not independently checked.", tone: "neutral"},
    {label: "Needs confirmation", description: "Example information awaiting confirmation.", tone: "confirmation"},
    {label: "Unavailable", description: "Example information is not available.", tone: "unavailable"},
    {label: "Information under review", description: "Example information is being reviewed; no conclusion is stated.", tone: "information"}
  ] satisfies readonly StateExample[],
  statesTitle: "Every state has a clear next step",
  statesIntro: "Interface examples only. Nothing is submitted or saved.",
  states: [
    {label: "Success", description: "The example is ready to review.", tone: "success"},
    {label: "Warning", description: "Check the example details before continuing.", tone: "warning"},
    {label: "Error", description: "The example could not be displayed. Try the demonstration again.", tone: "error"},
    {label: "Information", description: "This is a demonstration message.", tone: "information"},
    {label: "Neutral", description: "No action is needed for this example.", tone: "neutral"}
  ] satisfies readonly StateExample[],
  feedbackTitle: "Try the feedback",
  feedbackIntro: "This control changes only this local demonstration.",
  feedbackAction: "Show example feedback",
  feedback: "Example feedback is visible. Nothing was sent or saved.",
  glyphTitle: "Type and character review",
  glyphIntro: "Character specimens only, not translated copy.",
  glyphs: "Ɛ ɛ · Ɔ ɔ · Ƒ ƒ · Ɣ ɣ · Ŋ ŋ · á à ã · ₵ GH₵",
  footer: "Provisional foundation · Founder review required"
} as const;
