import type { AgronomyAnswer, AgronomyAssessment } from "./agronomy-evidence";
import { UNCOMMON_CROP_SCOPE_NOTE } from "./answer-presentation";

/** Bounded refinements of existing cards, not a new router or knowledge service. */
export function refineAgronomyAssessment(a: AgronomyAssessment, question: string, answers: AgronomyAnswer[]): AgronomyAssessment {
  const has = (value: string) => a.observed.some((line) => line.endsWith(value));
  const text = question.toLowerCase();
  const methodTitles: Record<string, string> = { "tomato-staking": "How to stake tomatoes", "pepper-transplant": "How to transplant pepper", "yam-mounds": "How to prepare yam mounds" };
  a.answerKind = methodTitles[a.cardId] ? "method" : ["decline", "maize-yellow", "tomato-rot", "white-insects", "cassava-growth"].includes(a.cardId) ? "diagnostic" : "decision";
  a.displayTitle = methodTitles[a.cardId] ?? (a.answerKind === "diagnostic" ? "What may be causing it" : undefined);
  a.applicability = a.sourceIds.some(id => id.startsWith("GH-"))
    ? "Includes Ghana guidance. The cause on your farm still depends on the observations you provide."
    : "Uses general or regional guidance, not proof of a Ghana-specific diagnosis. Local crop and field conditions may differ.";

  if (a.cardId === "limited-crop") {
    // ONE unnamed/uncommon crop is not evidence that multiple crops are affected.
    a.answerKind = "guidance";
    a.displayTitle = "Yes — we can assess the visible signs";
    a.finding = UNCOMMON_CROP_SCOPE_NOTE;
    a.why = "Spot shape, affected leaves and the spread help narrow the possibilities without guessing a disease.";
    a.possibilities = ["On this crop, matching insect injury can support a pest-related possibility; an insect nearby alone is not proof.", "Spot appearance and progression can help distinguish tissue injury from a disease-like pattern, but cannot confirm a pathogen."];
    a.actions = ["Note the spots' colour, border or halo, and whether they are dry, wet, flat or sunken.", "Compare older and younger leaves; look for spots merging, matching insect injury and the pattern across plants."];
    a.next = "Tell me the crop name if you know it, or open Crop Doctor with a clear affected-leaf photo.";
    a.detail = ["Include both leaf surfaces and the boundary between healthy and damaged tissue. Note when the spots began and any recent field operation.", "Recent weather can help interpret spread but does not identify a pathogen. Do not assume an insect present caused the spots without matching injury."];
    a.followUp = undefined;
  }

  if (a.cardId === "decline" && has("Dry soil; base looks intact")) {
    a.finding = "Moisture/root stress fits the dry soil. Root disease or root-feeding damage is also possible, especially if new plants keep declining.";
    a.why = has("Scattered plants, spreading") ? "Scattered spread needs a root check; an intact-looking stem base does not show what is happening underground." : "Dry soil is a clue, not proof that lack of water is the only cause.";
    a.possibilities = ["Moisture shortage: firm roots and improvement after appropriate watering support this.", "Root disease: soft, dark or decaying roots and continued spread make this more concerning.", "Root-feeding injury: chewed or missing roots with matching pest signs supports this; an insect nearby is not proof."];
    a.actions = ["If soil beside the roots is dry, water that root zone gently without flooding; watch whether the plant regains firmness.", "Soft, dark or decaying roots point towards a root-health problem, not just thirst; keep suspect soil and planting material in that patch.", "Chewed or missing roots suggest injury; photograph matching damage and any pest rather than spraying from appearance alone."];
    a.next = "Carefully expose the roots of one newly wilting plant beside an unaffected one and photograph the difference.";
    a.detail = ["Moisture stress and root damage can occur together. Continued decline after moisture is corrected needs a closer root assessment.", "Nutrient stress is not the leading conclusion from death and dry soil alone. Check leaf pattern and previous inputs if roots appear sound."];
  }

  if (a.cardId === "maize-yellow") {
    const older = has("Older leaves, V from the tip");
    const dry = has("Dry around the roots");
    const wet = has("Wet or waterlogged") || has("Mainly plants in wet patches");
    const damage = has("Spots, streaks or chewing");
    const young = has("Younger leaves or between the veins");
    const inputs = has("Fertilizer or manure already used");
    const noInputs = has("No fertilizer or manure");
    const age = question.match(/\b(\d{1,2})\s*weeks?\s*old\b/i)?.[0];
    if (age && !a.observed.some(v => v.includes(age))) a.observed.unshift(`Farmer supplied crop age: ${age}`);
    a.finding = wet ? "Root stress is the first lead in wet ground; more fertilizer alone will not repair stressed roots."
      : dry ? "Dry roots may be limiting nutrient uptake; yellowing does not yet prove a fertilizer shortage."
      : damage ? "Matching chewing, spots or streaks need a pest or disease-pattern check before blaming nutrition."
      : older ? "An older-leaf V-shaped yellow pattern supports a nitrogen-related possibility, but it is not a diagnosis."
      : young ? "Younger-leaf or between-vein yellowing does not fit the simple older-leaf nitrogen clue."
      : "Yellow maize can reflect nutrient shortage, root/moisture stress or leaf injury; check the pattern before adding fertilizer.";
    a.why = inputs ? "Previous fertilizer does not rule out poor uptake. Compare root condition and leaf damage before repeating it."
      : noInputs ? "You reported no fertilizer or manure. That makes nutrient supply worth considering, but roots, moisture and leaf damage still matter."
      : "Leaf age and pattern are more useful than yellow colour alone; soil moisture determines whether roots can take nutrients up.";
    a.actions = [
      wet ? "Check drainage and affected roots against greener plants; stop adding water to already waterlogged ground."
        : dry ? "Correct confirmed dry root-zone soil without flooding, then compare the affected plants with greener ones."
        : noInputs ? "Older leaves yellowing from the tip in a V, without matching holes or spots, strengthens the nutrient lead; compare whether greener plants show the same pattern."
        : "Older leaves yellowing from the tip in a V, without matching holes or spots, strengthens the nutrient lead; check the previous input record.",
      damage ? "Inspect the whorl and both leaf surfaces for fresh chewing, insects or distinct lesions; photograph matching signs before treatment."
        : "Chewing holes, whorl damage or distinct spots weaken a simple nutrient explanation; inspect those signs before choosing an input.",
      young ? "For younger or between-vein yellowing, compare new growth and roots; do not automatically choose nitrogen."
        : inputs ? "Check the product, date and placement of the earlier application; do not repeat a dose blindly."
        : "If roots are sound, moisture is adequate and the older-leaf pattern persists, use a locally applicable maize nutrient plan; no rate can be chosen from colour alone."
    ];
    a.next = "Photograph an older and a younger leaf on the same affected plant beside a greener plant for comparison.";
    a.detail = ["Map uniform versus patchy yellowing and any stunting. Wet patches, dry patches or an input strip can explain why only part of a field is affected.", noInputs ? "No previous fertilizer or manure is recorded for this consultation. A soil test can refine a future nutrient plan, but first distinguish injured leaves and impaired roots." : "Record manure/fertilizer product, date and placement. A soil test can refine a nutrient plan, but first distinguish injured leaves and impaired roots.", "A forecast is not a measurement of root-zone moisture. No precise fertilizer rate or named pathogen is inferred from these clues."];
  }

  if (a.cardId === "tomato-staking") {
    a.finding = "Support the stem so fruit stays off the soil and branches do not carry their weight unsupported.";
    a.why = "Start when plants are young, ideally at planting, before roots spread and stems flop.";
    a.actions = ["Set a firm stake beside each plant, clear of the stem and root ball. Use a cage or trellis if better suited to the variety; do not force a stake through roots.", "Loop soft cloth or twine around stake and stem as a loose figure-eight. Secure at the stake, leaving the stem room to thicken.", "Add support higher up as the plant grows. Guide stems gently; never pull a bent stem straight by tightening the tie."];
    a.next = "Gently test the first supported plant: the support should hold without the stem rubbing, pinching or bending sharply.";
    a.detail = ["What you need: a sound stake or stable cage/trellis, soft ties and a tool suited to installing the support.", "When: young plants are easier to support with less root disturbance. For established plants, avoid the main root ball and stop if placement would injure roots.", "Common mistakes: thin cutting wire on stems, tight knots, unstable supports and tying only after a heavy branch bends.", "Afterwards: inspect after wind and new growth; loosen constricting ties and add higher support as needed. Staking does not mean stripping healthy foliage or applying a universal pruning system."];
    a.followUp = undefined;
  }
  if (a.cardId === "pepper-transplant") {
    a.next = "After planting, check that a seedling stands firmly and its root ball has moist contact with the surrounding soil.";
  }
  if (a.cardId === "yam-mounds") {
    a.next = "Inspect a prepared mound after rain: note pooling, erosion or hard compaction before repeating the layout across the field.";
    a.detail = [...a.detail, "Common mistakes: packing the mound hard, making it from saturated clods or ignoring runoff. Dimensions still depend on yam type, planting material and soil."];
  }

  if (a.cardId === "grain-storage" && !/cannot be declared safe/.test(a.finding)) {
    const knownSacks = /\b(ordinary|normal)\s+sacks?\b/i.test(question);
    const storeAnswered = a.observed.some(v => v.startsWith("What storage is available"));
    if (knownSacks && !storeAnswered) {
      a.observed.push("Farmer supplied storage: Ordinary sacks in a covered store (cover condition not confirmed).");
      if (a.followUp?.id === "a1-grain-store") a.followUp = undefined;
    }
    const damp = /\b(damp|wet)\b/i.test(question) && !/\b(not damp|not wet|no longer wet)\b/i.test(question) || has("Damp, no visible mould");
    const form = /\bshelled\b/.test(text) ? "Shelled grain" : /\b(on the cob|on cobs|unshelled)\b/.test(text) ? "Still on the cob" : undefined;
    const formAnswer = answers.find(v => v.questionId === "a1-grain-form" && ["Shelled grain", "Still on the cob", "I am not sure"].includes(v.selectedOption))?.selectedOption;
    const chosenForm = form ?? formAnswer;
    if (damp && !a.followUp && !chosenForm) a.followUp = { id: "a1-grain-form", question: "Is the maize shelled or still on the cob?", options: ["Shelled grain", "Still on the cob", "I am not sure"], requiredForConfidence: true };
    if (chosenForm) a.observed.push(`Grain form: ${chosenForm}`);
    if (damp) {
      a.finding = "Dry this maize before filling sacks for storage; a bag will not dry a damp heap.";
      a.why = "Moisture trapped in a pile encourages heating and mould. Ordinary sacks also let moisture and pests enter.";
      a.actions = [chosenForm === "Still on the cob"
        ? "Open/remove husks and spread cobs on a clean raised drying surface with air between them; turn them for even exposure."
        : "Spread shelled grain thinly on a clean sheet or raised drying surface, off bare soil; turn it regularly for even drying.",
        "Move it under dry, ventilated cover before rain or night moisture. Do not leave damp grain packed in a heap or sealed bag.",
        "Prepare clean dry sacks and a sound roof; use a raised base away from damp walls. Bag only after dryness is checked, then inspect for dampness, heat, pests or mould."
      ];
      if (!chosenForm || chosenForm === "I am not sure") a.actions[0] = "Spread maize off bare soil on a clean drying surface; shelled grain needs a thin layer, while cobs need air between them. Turn regularly.";
      a.next = "Take a sample from different parts of the batch to a nearby mill, buyer or extension service that can check grain moisture before bagging.";
      a.detail = ["Without a meter: softness, clumping, unusual warmth, musty smell or visible mould are warning signs, not tests proving dry or safe grain. Do not bite suspect kernels or use appearance alone as a long-storage clearance.", "If mould, unusual smell or heating appears, keep the suspect batch separate from food, feed and sound grain and obtain a food-safety assessment. Re-drying does not certify it safe.", "Ordinary sacks need a dry, protected store and regular inspection; they are unsuitable for damp grain or a leaking/damp store. Keep space for airflow and inspection, and protect against rodents.", "Intact hermetic bags may be an option once grain is properly dried. Keep seals intact and protect against punctures; never use sealing as a substitute for drying.", "Rain forecasts help plan exposure, not measure grain moisture. No fixed drying time, safe moisture threshold or shelf life is promised."];
    }
  }
  return a;
}
