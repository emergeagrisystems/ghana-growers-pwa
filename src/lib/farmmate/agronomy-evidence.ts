import { AGRONOMY_REVIEW, agronomyCoverageFor, agronomySource } from "./agronomy-sources";
import type { DecisionFlow, FollowUpQuestion } from "./decision-engine/types";

export type AgronomyAnswer = { questionId: string; selectedOption: string };
type Choice = { label: string; finding: string; action: string; next?: string };
type EvidenceQuestion = { id: string; question: string; choices: Choice[] };
export type AgronomyCard = {
  id: string; topic: string; sources: string[]; finding: string; why: string;
  possibilities: string[]; actions: string[]; next: string; detail: string[];
  questions: EvidenceQuestion[];
};
const unsure: Choice = { label: "I am not sure", finding: "The cause remains unconfirmed.", action: "Compare an affected plant or batch with an unaffected one before choosing treatment." };
const q = (id: string, question: string, choices: Choice[]): EvidenceQuestion => ({ id: `a1-${id}`, question, choices: [...choices, unsure] });
const choice = (label: string, finding: string, action: string, next?: string): Choice => ({ label, finding, action, next });

/** Authored, bounded decision content. Source IDs cover claims, not local prevalence. */
export const agronomyCards: AgronomyCard[] = [
  {
    id: "limited-crop", topic: "Crop outside verified Ghana topic coverage", sources: ["PSU-PATTERN"],
    finding: "I do not yet have verified Ghana-specific guidance for this crop and topic, but I can help you collect evidence.",
    why: "Pattern, onset and comparison with healthy tissue help decide the next check without inventing a crop-specific cause.",
    possibilities: ["Damage across several kinds of plant or along a field-work strip suggests checking shared exposure.", "Progressive damage in scattered plants suggests comparing damaged tissue and signs of pests or disease."],
    actions: ["Record when the change started and what happened in the field beforehand.", "Compare an affected part with the same part of a healthy plant.", "Collect a focused photo and the crop name for local identification before treatment."],
    next: "Take a close-up that includes the boundary between affected and healthy tissue.",
    detail: ["General diagnostic process only. No Ghana crop calendar, named disease or crop-specific input is inferred."],
    questions: [q("limited-pattern", "How is the problem distributed?", [choice("Several crop types at once", "Shared exposure deserves checking; this is not proof of a chemical or weather cause.", "Compare field operations and damage timing across the different crops."), choice("Spreading on scattered plants", "A plant-health problem is possible, but the cause remains open.", "Compare affected and healthy tissue and inspect for matching pest signs.")])]
  },
  {
    id: "waterlogged", topic: "Waterlogged field", sources: ["GH-MAIZE", "IITA-CASSAVA", "PSU-DISORDERS"],
    finding: "Standing water needs a crop and root-zone check, not an automatic fertilizer response.", why: "Water management differs by crop and production system; a forecast cannot show drainage on this plot.",
    possibilities: ["Persistent wet patches may restrict roots or coexist with root disease.", "A blocked outlet and soil that drains slowly require different field work."],
    actions: ["Locate where water enters, collects and could leave without eroding soil or polluting neighbouring water.", "Avoid additional irrigation into standing water and inspect affected roots against healthier plants.", "Do not cultivate saturated soil or assume fertilizer will correct the damage."],
    next: "Confirm the crop and whether standing water is intended in this production system.", detail: ["Do not apply upland drainage advice automatically to managed flooded rice. Drainage work and raised beds need local soil and slope assessment."],
    questions: [q("waterlogged-system", "Which field situation applies?", [choice("Upland crop; flooding is unintended", "Unintended persistent water is a root-zone stress concern.", "Check for a safe outlet and compare roots before planning drainage or more inputs."), choice("Managed flooded rice", "Standing water is not by itself proof of damage in a managed rice system.", "Check crop stage and water management with a rice adviser; do not drain automatically.")])]
  },
  {
    id: "decline", topic: "Wilting, dying plants and poor growth", sources: ["PSU-PATTERN", "PSU-DISORDERS"],
    finding: "Dying plants do not identify a single disease. Start with where the damage occurs.",
    why: "A wet low patch, a spreading cluster and an application strip point to different checks; causes can overlap.",
    possibilities: ["Root-zone stress: compare soil moisture and roots in damaged and healthy areas.", "Root/stem injury or disease: look for a damaged base and progressive spread.", "Input or physical injury: compare the timing and boundary with recent field work."],
    actions: ["Map whether damage follows low ground, scattered plants or a field-work strip.", "Photograph an affected stem base and nearby healthy plant before removing anything.", "Avoid treating the whole plot until the pattern and root condition are clearer."],
    next: "Check the soil and stem base of one recently affected plant.", detail: ["An insect nearby is not proof it caused the damage. Look for matching injury.", "A field pattern narrows investigation; it cannot confirm a pathogen."],
    questions: [q("decline-pattern", "Where are the affected plants?", [
      choice("Mostly in wet low areas", "Root-zone stress is plausible because damage follows wet ground; root disease can coexist.", "Compare roots and stem bases in wet and better-drained areas; avoid more irrigation in standing water."),
      choice("Scattered plants, spreading", "A root/stem or plant-health problem needs investigation; spread alone does not identify the cause.", "Compare the base and roots of newly affected and healthy plants; record whether the damaged area expands."),
      choice("Along a sprayed or worked strip", "The field-work pattern raises input or physical injury as a possibility, not a confirmed cause.", "Record the product or operation and timing; pause the suspected operation while a local adviser checks the pattern."),
      choice("Mostly in dry areas", "Moisture stress or impaired roots are plausible; dry-looking leaves alone cannot distinguish them.", "Check moisture below the surface beside roots before adding water; compare with an unaffected area.")
    ]), q("decline-base", "What do you see at the affected stem base or roots?", [
      choice("Soft, dark or damaged base", "Base damage makes a root/stem problem more concerning; the organism remains unconfirmed.", "Use a close-up and field pattern for prompt local plant-health assessment; avoid moving affected soil or planting material.", "Bring the base photo and the location of the damaged patch to a local plant-health adviser."),
      choice("Dry soil; base looks intact", "Dryness may contribute, but intact-looking tissue does not rule out hidden root damage.", "If moisture is deficient, water the root zone carefully and compare recovery with nearby plants.", "Record whether the affected plants recover after moisture is corrected; continued decline needs a root assessment."),
      choice("Base looks intact; soil is moist", "The base check has not explained the decline.", "Inspect leaf undersides, recent inputs and the progression of damage with a local extension officer.", "Collect an underside-leaf photo to check for matching pest signs.")
    ])]
  },
  {
    id: "maize-yellow", topic: "Maize yellowing differential", sources: ["UMN-YELLOW", "GH-MAIZE", "PSU-DISORDERS"],
    finding: "Yellow maize needs a pattern check before fertilizer is chosen.", why: "Nutrient shortage, impaired roots and other damage can look similar.",
    possibilities: ["A V-shaped yellow area from an older leaf tip can support a nitrogen-related possibility, not a diagnosis.", "Yellowing in wet patches raises root stress and nutrient uptake concerns.", "Spots, streaks or matching insect injury require a plant-health check."],
    actions: ["Compare old and new leaves on affected and healthy plants.", "Check roots and field moisture, then review previous inputs.", "Use stage and soil-test information to discuss an input plan; do not choose a rate from colour alone."],
    next: "Photograph an older and a younger leaf from the same affected maize plant.", detail: ["The nutrient visual clue is general evidence from Minnesota, not a Ghana diagnosis or fertilizer recommendation."],
    questions: [q("maize-yellow-pattern", "Which pattern best matches the yellowing?", [
      choice("Older leaves, V from the tip", "A nitrogen-related issue is plausible, but root stress and field history still matter.", "Review prior manure/fertilizer and root moisture before seeking a soil-informed nutrient recommendation."),
      choice("Mainly plants in wet patches", "Root stress is a stronger lead than assuming a simple nutrient shortage.", "Check drainage and roots first; more fertilizer cannot by itself repair damaged roots."),
      choice("Spots, streaks or chewing", "A plant-health cause needs checking alongside nutrition.", "Photograph the pattern and inspect both leaf surfaces for matching pest signs.")
    ]), q("maize-inputs", "What inputs have these maize plants received?", [
      choice("No fertilizer or manure", "No prior inputs makes nutrient supply worth assessing; it does not establish a deficiency.", "Take the crop stage and a soil test if available to a local adviser before selecting product and rate."),
      choice("Fertilizer or manure already used", "Prior inputs do not rule out root stress, poor uptake or an unsuitable nutrient balance.", "Record the product, amount and date for the adviser; do not repeat an application blindly.")
    ])]
  },
  {
    id: "tomato-rot", topic: "Tomato fruit damage differential", sources: ["CABI-TOMATO", "FAO-HANDLING", "PSU-DISORDERS"],
    finding: "The position and texture of tomato damage help separate a fruit disorder from decay or injury.", why: "A dry sunken blossom-end patch differs from soft spreading rot or damage around a wound.",
    possibilities: ["A sunken patch opposite the stalk can fit blossom-end rot associated with water/calcium movement.", "Soft spreading tissue or visible growth may involve decay; a photo cannot establish the organism.", "Damage beginning at cracks or bruises may start with physical injury."],
    actions: ["Look at where the damage starts, not only its colour.", "Compare watering consistency and signs on undamaged fruit.", "Keep decaying fruit separate so it does not contaminate sound produce; this does not establish food safety."],
    next: "Photograph the damaged end and the whole fruit together.", detail: ["The blossom-end comparison comes from a Kenya factsheet. Do not assume the soil needs calcium or prescribe a spray without assessment."],
    questions: [q("tomato-rot-place", "Where does the damage start?", [
      choice("Dry sunken patch opposite the stalk", "Blossom-end rot is a possibility; uneven moisture can interfere with calcium reaching fruit.", "Keep root-zone moisture more consistent without flooding; check soil and input history before any calcium treatment."),
      choice("Soft spreading rot or fuzzy growth", "Decay is a concern, but the pathogen and food safety remain unconfirmed.", "Separate affected fruit and obtain local assessment before using it for food or feed."),
      choice("At a crack, bruise or insect hole", "Injury may have provided an entry point for decay.", "Reduce rough handling and inspect for matching insect damage; do not infer a disease from the wound alone.")
    ])]
  },
  {
    id: "white-insects", topic: "White insects beneath leaves", sources: ["UC-WHITEFLY"],
    finding: "Small white insects may be sap feeders; check their behaviour and young stages before naming them.", why: "Flying adults, fixed immature stages and sticky residue give different evidence than white colour alone.",
    possibilities: ["Adults rising when disturbed with small flat stages beneath leaves support a whitefly possibility.", "White material without matching insects may need a clearer close-up; it is not a virus diagnosis."],
    actions: ["Turn a leaf gently and look at adults and immature stages with a hand lens if available.", "Check sticky residue and associated leaf damage on several plants.", "Avoid broad spraying on appearance alone; preserve beneficial insects and seek identification if damage spreads."],
    next: "Take a close-up of the underside showing insects and leaf damage.", detail: ["The identification cues are general UC IPM evidence; species and Ghana treatment choices remain unconfirmed."],
    questions: [q("white-insect-behaviour", "What happens when you gently disturb the leaf?", [
      choice("White adults fly; small flat stages remain", "This supports a whitefly-like sap-feeder possibility, not a species or virus diagnosis.", "Check several leaves for feeding damage and immature stages before choosing management."),
      choice("White patches do not move", "The photo or description does not yet establish that these are insects.", "Use a close-up or hand lens to distinguish bodies from residue or surface growth.")
    ])]
  },
  {
    id: "fertilizer", topic: "Maize nutrient decision", sources: ["GH-MAIZE", "GH-NUTRIENTS", "PSU-DISORDERS"],
    finding: "Check crop stage, roots and prior inputs before deciding whether fertilizer is the next action.", why: "Weather describes exposure; it does not measure field moisture or establish a nutrient deficiency.",
    possibilities: ["Nutrient supply is one possibility where growth and input history support it.", "Water stress, damaged roots or disease may prevent a response even when nutrients are present."],
    actions: ["Record crop stage and previous fertilizer/manure use.", "Check field moisture and roots; compare healthy and poor patches.", "Match any product and rate to soil information and qualified local advice rather than guessing."],
    next: "Bring the crop stage, input history and any soil-test result together before purchasing fertilizer.", detail: ["Ghana recommendations vary by crop and agroecology. This feature deliberately does not provide rates, formulations or timing thresholds."],
    questions: [q("nutrient-stage", "What stage is the maize at?", [
      choice("Growing leaves, before tassels", "The maize is in vegetative growth; nutrient planning must still consider soil and prior inputs.", "Review previous inputs and root condition before selecting the next application."),
      choice("Tasselling or silking", "The crop is at a moisture-sensitive reproductive stage; yellowing is not a rate calculation.", "Check root-zone moisture and consult a local nutrient plan before another input."),
      choice("Cobs filling or mature", "Later crop stage changes the value and purpose of another application.", "Do not use an early-season blanket recommendation; review the crop and intended harvest with an adviser.")
    ]), q("nutrient-field", "What is the field like at the roots?", [
      choice("Waterlogged or damaged roots", "Check first: root stress may explain poor uptake.", "Address the root/field problem before more fertilizer; compare recovery with a healthier area."),
      choice("Moist, draining; roots look intact", "The field check allows nutrient planning, but does not prove a deficiency.", "Use previous inputs, intended product and soil-test information for a qualified local recommendation."),
      choice("Dry around the roots", "Check first: water limitation may be restricting growth.", "Assess available irrigation or reliable moisture before deciding on a fertilizer application.")
    ]), q("nutrient-history", "What nutrient information do you have?", [
      choice("Previous input record and soil test", "Use the existing records rather than a generic rate.", "Ask a qualified local adviser to match the intended product to the test and crop stage."),
      choice("Previous inputs, no soil test", "Previous use is known but soil nutrient supply remains uncertain.", "Keep the product and application record and seek a locally appropriate soil/input assessment."),
      choice("No inputs or records yet", "There is not enough information for a rate or formulation.", "Record the crop stage and field observations and arrange local nutrient advice.")
    ])]
  },
  {
    id: "pepper-transplant", topic: "Transplanting pepper", sources: ["FAO-PEPPER"],
    finding: "Move healthy, hardened pepper seedlings into a prepared moist field without damaging their roots.", why: "A prepared field and root contact reduce avoidable transplant stress.", possibilities: [],
    actions: ["Prepare the field and water the seedling containers before lifting; choose healthy seedlings.", "Move each root ball gently and keep the previous nursery soil depth; firm lightly around it.", "Water after planting and check for wilt or poor contact before moving more seedlings."],
    next: "Check that the seedlings are hardened and the receiving soil is moist but draining.",
    detail: ["When: after gradual hardening, with the field ready. You need healthy seedlings, water and a planting tool.", "Common mistakes: exposing roots, planting damaged seedlings, changing depth or letting newly planted roots dry.", "This method is adapted cautiously from a Bahamas FAO guide; Ghana timing, variety and spacing need local advice."], questions: []
  },
  {
    id: "yam-mounds", topic: "Yam mound preparation", sources: ["IITA-YAM", "IITA-CASSAVA"],
    finding: "A yam mound should provide loose rooting soil; one mound size does not fit every field.", why: "Soil depth, drainage and yam type affect the preparation needed.", possibilities: [],
    actions: ["Check soil depth and where water collects before marking the planting area.", "Gather loosened topsoil into stable mounds without packing it hard; leave access for field work.", "Check that rain can leave safely without eroding the mound or pooling around it."],
    next: "Confirm mound dimensions and planting arrangement with a local yam adviser for this soil and planting material.",
    detail: ["You need a hoe or suitable tillage equipment and known planting material. Do not work saturated soil into hard clods.", "The loose-soil purpose is regional IITA evidence; the field-check sequence is a cautious synthesis, not a tested local specification."], questions: []
  },
  {
    id: "tomato-staking", topic: "Tomato support", sources: ["UMN-STAKE"],
    finding: "Support tomato growth without constricting stems; the support system depends on whether the variety keeps climbing or stays bushy.", why: "A support that suits the growth habit reduces unsupported bending and handling damage.", possibilities: [],
    actions: ["Choose firm stakes or a suitable cage/trellis for the variety and install without damaging the plant.", "Use gentle ties with room for the stem to thicken; support rather than pull the stem tightly.", "Check ties and stability as growth increases; do not remove healthy growth indiscriminately."],
    next: "Check the variety's growth habit and loosen any tie pressing into a stem.",
    detail: ["You need stable supports and soft ties. Inspect again after wind or new growth.", "This is general support guidance, not a Ghana-specific pruning system."], questions: []
  },
  {
    id: "cassava-growth", topic: "Cassava establishment and poor growth", sources: ["IITA-CASSAVA", "PSU-PATTERN"],
    finding: "Compare planting material, rooting conditions and new growth before choosing a cassava treatment.", why: "Weak establishment and drainage problems require different responses from spreading leaf or stem damage.",
    possibilities: ["Poor sprouting or weak cuttings: check gaps and the original stem material.", "Restricted or wet rooting soil: compare the poorly growing patch with healthy plants.", "Distorted or damaged new growth: collect leaf and stem evidence before naming a pest or disease."],
    actions: ["Check whether poor growth began at emergence or appeared later.", "Compare stem bases, soil and new leaves in healthy and poor patches.", "Use healthy planting material for any replacement; do not move suspect stems to another plot."],
    next: "Check a weak plant's stem base and take a clear new-leaf photo.", detail: ["IITA guidance includes Ghana in its regional programme; it does not establish the cause on this farm."],
    questions: [q("cassava-start", "When did the poor growth begin?", [
      choice("Many cuttings never sprouted well", "Establishment or planting-material quality deserves priority.", "Inspect weak cuttings and moisture at their base, and compare the planting-material source with healthy rows."),
      choice("After establishment in wet ground", "Root-zone stress is plausible; root disease remains possible.", "Compare roots and drainage in affected and healthy areas before adding inputs."),
      choice("New leaves became distorted or damaged", "A leaf or shoot problem needs identification, not a fertilizer guess.", "Photograph young leaves, both leaf surfaces and the stem; obtain local assessment if it spreads.")
    ])]
  },
  {
    id: "maize-harvest", topic: "Maize harvest maturity", sources: ["GH-MAIZE", "FAO-DRY"],
    finding: "Separate readiness to harvest from readiness to store maize.", why: "Physiological maturity does not mean grain is dry enough for sealed storage.", possibilities: [],
    actions: ["Check whether the goal is green-cob sale or dry grain before using maturity signs.", "For dry grain, examine representative cobs; a black layer at the kernel base indicates completed grain filling.", "Plan drying and check actual grain moisture rather than relying only on the calendar."],
    next: "Check representative cobs and arrange a reliable moisture assessment for dry-grain storage.", detail: ["Variety and conditions change timing. No exact harvest date or storage threshold is supplied."],
    questions: [q("harvest-purpose", "What will you harvest the maize for?", [
      choice("Green cobs", "Green-cob harvest uses a different maturity target from dry grain.", "Check kernel condition and the buyer's intended use; do not wait for dry-grain signs automatically."),
      choice("Dry grain", "Use grain maturity signs and a separate drying plan.", "Examine several cobs and arrange a moisture assessment before sealed storage.")
    ])]
  },
  {
    id: "grain-storage", topic: "Grain and legume storage", sources: ["FAO-GRAIN", "FAO-DRY"],
    finding: "Choose storage from the grain's condition, not from the bag alone.", why: "Sealing damp grain does not make it dry; a broken hermetic seal also loses protection.", possibilities: [],
    actions: ["Keep damp grain out of sealed storage and spread it for controlled drying with air movement, protected from re-wetting.", "Separate suspect grain and check moisture reliably before bagging; touch alone is not a safety test.", "Use clean intact storage, raised away from damp floors and protected from pests; inspect without repeatedly breaking a hermetic seal."],
    next: "Check whether this batch is dry, damp or showing mould before choosing the container.", detail: ["Crop, intended duration and available storage matter. No shelf life or safe moisture number is promised.", "A live forecast can help plan drying exposure, but cannot measure grain moisture."],
    questions: [q("grain-condition", "What is the grain's condition now?", [
      choice("Damp, no visible mould", "Drying comes before sealed storage.", "Arrange thin-layer drying with air movement and protection from rain; verify moisture before bagging."),
      choice("Dryness checked, no visible mould", "Storage can be planned, but a visual check alone does not certify food safety.", "Use an intact appropriate container and protect the store against re-wetting, insects and rodents."),
      choice("Mould, unusual smell or heating", "Do not treat this as an ordinary drying problem or declare the grain safe.", "Keep the batch separate from food, feed and sound grain; seek qualified post-harvest/food-safety assessment.")
    ]), q("grain-store", "What storage is available for the intended period?", [
      choice("Intact hermetic bags for longer storage", "Hermetic storage requires properly dried grain and intact seals.", "Check bag integrity and crop-appropriate moisture before sealing; protect bags from punctures and rodents."),
      choice("Ordinary sacks in a covered store", "The sacks do not prevent moisture or insect entry by themselves.", "Use a dry raised base, keep the roof sound and inspect for pests and dampness."),
      choice("No protected drying or storage", "There is not enough protection for a storage plan yet.", "Arrange a covered drying service or qualified local handling support; do not seal wet grain to save space.")
    ])]
  },
  {
    id: "fresh-surplus", topic: "Fresh produce loss reduction", sources: ["FAO-HANDLING"],
    finding: "Protect quality and separate saleable produce from suspect produce before choosing a surplus plan.", why: "Bruising, repeated handling and poor containers can increase losses while waiting for a buyer.", possibilities: [],
    actions: ["Handle gently and keep produce out of direct sun while sorting by condition and maturity.", "Use clean supportive ventilated containers without crushing the bottom layer.", "Match smaller sound batches to a realistic buyer or qualified processor; Marketplace may help find demand but does not guarantee a sale."],
    next: "Identify the sound batch that needs moving first and the handling or buyer option actually available.",
    detail: ["Ask for commodity-specific cooling or processing guidance; this is not a preservation recipe or a shelf-life guarantee.", "Do not sell suspect produce as safe or mix decaying produce into a sound batch."],
    questions: [q("fresh-condition", "What condition is the harvested produce in?", [
      choice("Sound but ripening quickly", "Prioritise gentle handling and prompt movement of the ripest sound batch.", "Keep it shaded and protected from crushing while arranging a real buyer or processor."),
      choice("Bruised, leaking or rotting", "Damage and decay need separation before any sale or processing decision.", "Separate suspect produce and get qualified advice on usability; processing is not proof of safety."),
      choice("Not harvested yet", "Prepare the handling route before picking more.", "Confirm intended maturity and a place to handle the next batch before harvest.")
    ])]
  },
  {
    id: "root-storage", topic: "Root and tuber handling", sources: ["FAO-ROOTS", "FAO-CURING"],
    finding: "Root crops need different storage plans; do not use one curing method for all of them.", why: "Harvest injury and crop identity affect deterioration; cassava is particularly perishable.", possibilities: [],
    actions: ["Lift and handle roots gently; separate damaged or rotting material from sound roots.", "Plan prompt handling for cassava rather than assuming it stores like yam.", "For yam or sweet potato, ask for a crop-specific curing and storage plan; keep storage protected and inspect for rot."],
    next: "Confirm the crop, harvest state and damage before choosing storage or processing.", detail: ["Curing may heal minor wounds, but cannot restore extensive damage. No temperature, duration or toxicity-processing recipe is supplied."],
    questions: [q("roots-state", "What is the harvest state?", [
      choice("Still in the field", "Plan handling and intended use before lifting the roots.", "Prepare a protected handling route and confirm crop-specific harvest readiness."),
      choice("Harvested and apparently sound", "Gentle handling and a crop-specific storage plan come first.", "Avoid further injury and get local guidance on suitable ventilation and any curing required."),
      choice("Harvested, damaged or rotting", "Injury or rot limits storage options; safety cannot be established here.", "Keep damaged roots separate and seek qualified advice before processing or feeding them.")
    ])]
  }
];

export type AgronomyAssessment = {
  cardId: string; topic: string; sourceIds: string[]; reviewStatus: string;
  applicability: string; finding: string; why: string; possibilities: string[];
  actions: string[]; next: string; detail: string[]; followUp?: FollowUpQuestion;
  observed: string[];
};

export function selectAgronomyCard(question: string, crop?: string | null): AgronomyCard | undefined {
  const text = question.toLowerCase();
  const isCrop = (pattern: RegExp) => pattern.test(`${crop ?? ""} ${text}`);
  const storage = /\b(stor\w*|harvested|damp|mould|mold|drying|surplus|preserv\w*)\b/.test(text);
  let id: string | undefined;
  if (/\bwhite\b.*\b(insects?|flies|bugs)\b/.test(text)) id = "white-insects";
  else if (isCrop(/\b(tomato|tomatoes)\b/i) && /\b(rot\w*|sunken|blossom.end)\b/.test(text)) id = "tomato-rot";
  else if (isCrop(/\b(maize|corn)\b/i) && /\byellow\w*\b/.test(text)) id = "maize-yellow";
  else if (isCrop(/\b(maize|corn)\b/i) && /\b(fertili[sz]\w*|nutrient\w*|urea|npk)\b/.test(text)) id = "fertilizer";
  else if (isCrop(/\b(pepper|chilli|chili)\b/i) && /\btransplant\w*\b/.test(text)) id = "pepper-transplant";
  else if (isCrop(/\byams?\b/i) && /\b(mounds?|ridges?)\b/.test(text)) id = "yam-mounds";
  else if (isCrop(/\b(tomato|tomatoes)\b/i) && /\b(stak\w*|trellis\w*|support)\b/.test(text)) id = "tomato-staking";
  else if (isCrop(/\b(maize|corn)\b/i) && /\b(when|ready)\b.*\bharvest\b/.test(text) && !/\bharvested\b/.test(text)) id = "maize-harvest";
  else if (storage && isCrop(/\b(maize|corn|rice|sorghum|millet|cowpea|groundnut|soybean|bambara|grain|legume)s?\b/i)) id = "grain-storage";
  else if (storage && isCrop(/\b(cassava|yam|cocoyam|sweet potato)s?\b/i)) id = "root-storage";
  else if (isCrop(/\b(maize|corn)\b/i) && /\bharvest\b/.test(text)) id = "maize-harvest";
  else if (isCrop(/\bcassava\b/i) && /poor|not growing|weak|stunt/.test(text)) id = "cassava-growth";
  else if (/\b(waterlogged|waterlogging|drainage|standing water)\b/.test(text) && !/\b(dying|wilting)\b/.test(text)) id = "waterlogged";
  else if (/\b(dying|die|wilting|wilt|poor growth|not growing)\b/.test(text)) id = "decline";
  else if ((storage || /too many|no.*buyer/.test(text)) && isCrop(/\b(tomato|tomatoes|pepper|okra|garden egg|cabbage|lettuce|carrot|cucumber|fruit|vegetable|plantain|banana|pineapple|mango|citrus|papaya|watermelon|avocado)s?\b/i)) id = "fresh-surplus";
  else if (!agronomyCoverageFor(crop) && /\b(leaves?|plant|crop|fruit)\b.*\b(yellow|brown|spots?|sick|damaged|curl\w*)\b/.test(text)) id = "limited-crop";
  return agronomyCards.find((card) => card.id === id);
}

export function assessAgronomyEvidence(question: string, crop?: string | null, answers: AgronomyAnswer[] = [], context?: { stage?: string }): AgronomyAssessment | undefined {
  const card = selectAgronomyCard(question, crop);
  if (!card) return undefined;
  // Only declared question/option pairs affect advice. The API still verifies signed history.
  const selected = card.questions.flatMap((item) => {
    const supplied = answers.find((answer) => answer.questionId === item.id);
    const selectedChoice = item.choices.find((option) => option.label === supplied?.selectedOption);
    return selectedChoice ? [{ item, selectedChoice }] : [];
  });
  let pending = card.questions.find((item) => !(item.id === "a1-nutrient-stage" && context?.stage) && !selected.some((answer) => answer.item.id === item.id));
  const knownDamp = card.id === "grain-storage" && /\b(damp|wet)\b/i.test(question) && !/\b(not wet|not damp|no longer wet)\b/i.test(question);
  if (knownDamp && pending?.id === "a1-grain-condition") {
    const damage = q("grain-damage", "You said the grain is damp. Do you also see mould, unusual smell or heating?", [
      choice("Yes, suspect signs are present", "The batch needs a food-safety assessment.", "Keep the batch separate from food, feed and sound grain."),
      choice("No suspect signs noticed", "Drying is still needed before storage; no visible mould is not a safety clearance.", "Arrange controlled drying and a reliable moisture check before bagging.")
    ]);
    const answer = answers.find((item) => item.questionId === damage.id);
    const selectedChoice = damage.choices.find((item) => item.label === answer?.selectedOption);
    if (selectedChoice) { selected.push({ item: damage, selectedChoice }); pending = card.questions[1]; }
    else pending = damage;
    if (answers.some((item) => item.questionId === card.questions[1].id && card.questions[1].choices.some((option) => option.label === item.selectedOption))) pending = undefined;
  }
  const decisive = selected.filter(({ selectedChoice }) => selectedChoice.label !== unsure.label);
  const sources = card.sources.map(agronomySource);
  const suspectStoredFood = card.id === "grain-storage" && (/\b(mould|mold|musty|heating)\b/i.test(question) && !/\b(no|without) (visible )?(mould|mold|musty|heating)\b/i.test(question) || selected.some(({ selectedChoice }) => ["Mould, unusual smell or heating", "Yes, suspect signs are present"].includes(selectedChoice.label)));
  const declineNeedsEvidence = card.id === "decline" && selected.some(({ selectedChoice }) => selectedChoice.label === "I am not sure");
  const applicability = sources.some((source) => source.applicability === "Ghana")
    ? "Includes Ghana sources; individual findings remain provisional."
    : "General or regional evidence, not Ghana-specific diagnosis or treatment authority.";
  const cashCrop = agronomyCoverageFor(crop)?.level === "evidence collection and referral only";
  const completedNext = selected.length && !pending
    ? card.id === "grain-storage" ? "Arrange a reliable crop-appropriate moisture check and inspect the intended storage container."
      : card.id === "root-storage" ? "Take the crop and condition details to a local post-harvest adviser before choosing a curing or storage method."
      : card.id === "fertilizer" ? "Use the crop stage, prior inputs and soil information to confirm the intended product with a qualified local adviser."
      : card.next
    : card.next;
  return {
    cardId: card.id, topic: card.topic, sourceIds: card.sources, reviewStatus: AGRONOMY_REVIEW, applicability,
    finding: suspectStoredFood ? "Mould or heating is a safety concern, not an ordinary storage decision. The batch cannot be declared safe here." : decisive.length ? decisive.map(({ selectedChoice }) => selectedChoice.finding).slice(-2).join(" ") : card.finding,
    why: card.why, possibilities: card.possibilities.slice(0, 3),
    actions: suspectStoredFood ? ["Keep the suspect batch separate from sound grain, food and feed.", "Do not blend, re-dry or process it as a way to declare it safe.", "Arrange qualified post-harvest or food-safety assessment."] : decisive.length ? Array.from(new Set(decisive.map(({ selectedChoice }) => selectedChoice.action))).slice(0, 3) : card.actions.slice(0, 3),
    next: suspectStoredFood ? "Contact a qualified post-harvest adviser with the crop, batch condition and storage history." : cashCrop ? "Take the photos and field pattern to a qualified local crop specialist before treating this perennial crop." : decisive.find(({ selectedChoice }) => selectedChoice.next)?.selectedChoice.next ?? completedNext,
    detail: card.detail,
    followUp: pending && !suspectStoredFood && !declineNeedsEvidence ? { id: pending.id, question: pending.question, options: pending.choices.map((option) => option.label), requiredForConfidence: true } : undefined,
    observed: [...(context?.stage ? [`Farmer/tool-supplied stage: ${context.stage}`] : []), ...selected.map(({ item, selectedChoice }) => `${item.question} ${selectedChoice.label}`)]
  };
}

export function agronomyAssessmentFlow(assessment: AgronomyAssessment, crop?: string): DecisionFlow {
  const intent = ["maize-yellow", "decline", "tomato-rot", "white-insects", "cassava-growth"].includes(assessment.cardId) ? "crop-health" : assessment.cardId === "fertilizer" ? "fertilizer" : ["grain-storage", "maize-harvest", "fresh-surplus", "root-storage"].includes(assessment.cardId) ? "harvest" : "crop-planning";
  return {
    id: `agronomy-evidence-${assessment.cardId}`, question: assessment.topic, intent,
    possibleCauses: assessment.possibilities, requiredInformation: { crop },
    followUpQuestions: assessment.followUp ? [assessment.followUp] : [],
    recommendation: { summary: assessment.finding, confidence: "low", reasoning: assessment.possibilities.map((item, index) => ({ id: `a1-check-${index}`, observation: item, interpretation: "Conditional possibility, not a confirmed finding." })),
      sustainabilityPriority: ["prevention", "good-farming-practice"], recommendedAction: assessment.actions[0], guidance: assessment.actions.slice(1),
      nextBestAction: { id: "a1-next", label: "Next step", instruction: assessment.next, actionType: "take-farm-action" } },
    safetyRules: [{ id: "a1-evidence-boundary", appliesToIntents: ["crop-planning"], trigger: "Source-backed candidate guidance", requiredResponse: "No confirmed diagnosis, guessed rates, food/feed safety clearance, invented weather or local prevalence. Qualified Ghana review remains required.", blocksRecommendation: false }]
  };
}

export function agronomyScopeNote(crop?: string | null) {
  const coverage = agronomyCoverageFor(crop);
  return coverage && coverage.sources.some((id) => agronomySource(id).applicability === "Ghana")
    ? "Ghana guidance is available for selected topics, not every crop problem."
    : "I do not yet have verified Ghana-specific guidance for this crop and topic. I can help assess the evidence using general principles.";
}
