import { AGRONOMY_REVIEW } from "./agronomy-sources";
import type { AgronomyAnswer, AgronomyAssessment } from "./agronomy-evidence";
import { recognizeFarmEnterprise } from "./enterprise-topics";

export const FARM_ENTERPRISE_DOMAIN = "Farm Enterprises & Diversification";
type EnterpriseCard = {
  id: string; title: string; sourceIds: string[]; finding: string; why: string;
  actions: string[]; next: string; detail: string[];
};

/** Authored claim bundles. Research recipes and numeric feed/safety prescriptions are deliberately absent. */
export const bsfKnowledgeCards: EnterpriseCard[] = [
  {
    id: "overview", title: "Yes — BSF farming is being used in Ghana",
    sourceIds: ["A2-IITA-GH", "A2-GAEC-POLICY"],
    finding: "BSF farming means raising black soldier fly larvae to convert selected organic materials into useful products.",
    why: "Ghana's IITA/BBEST work includes larvae for animal-feed ingredients and frass, the leftover rearing material, for soil-input products after appropriate treatment.",
    actions: ["Choose your main goal: own-farm feed, a commercial feed ingredient, frass, or waste conversion.", "Start with a small, traceable trial and technical training before investing in scale."],
    next: "Which region are you in, and what would you mainly want to produce?",
    detail: ["Ghana project sites include Kofisah, Adeiso, Somanya and Kumasi. Their existence does not guarantee access, starter stock or a buyer."]
  },
  {
    id: "setup", title: "Start with the purpose and a small trial",
    sourceIds: ["A2-IWMI", "A2-EAWAG", "A2-BNARI"],
    finding: "Plan the product, regular inputs and handling space before buying equipment.",
    why: "A reliable input supply and an organised workflow matter more than starting large.",
    actions: ["Identify a traceable feedstock supplier and a verified source of BSF starter larvae or eggs.", "Plan contained, ventilated rearing space with water, drainage, pest exclusion and separate waste-receiving and clean product areas.", "Budget for trays, containers, screens, harvesting equipment, cleaning, labour and any processing your product needs."],
    next: "Take your proposed product, site and input list to BNARI or CSIR-ARI for practical setup training.",
    detail: ["Buying verified starter material avoids treating unidentified maggots as BSF. A breeding unit also needs adult cages, egg collection and a separate hatchery; confirm the arrangement with a trainer."]
  },
  {
    id: "cycle", title: "Keep rearing batches and breeding stock separate",
    sourceIds: ["A2-IWMI"],
    finding: "The cycle runs through eggs, feeding larvae, prepupae, pupae and adult flies.",
    why: "Harvesting all the larvae leaves no stock to produce the next generation.",
    actions: ["Collect eggs from a managed adult colony and hatch them in a protected nursery.", "Move established young larvae into labelled grow-out batches with controlled feedstock.", "Harvest the production batch; keep a separate group to pupate, emerge as adults and breed."],
    next: "Decide whether your first trial will buy young larvae or maintain its own breeding colony.",
    detail: ["Development depends on the rearing conditions and substrate. A calendar estimate is not a guaranteed harvest date."]
  },
  {
    id: "substrate", title: "Trace the feedstock before using it",
    sourceIds: ["A2-WUR-SAFETY", "A2-IWMI"],
    finding: "BSF larvae eating a material does not prove the resulting feed or frass is safe.",
    why: "Chemical and microbial hazards can enter through the rearing material.",
    actions: ["Discuss separated fruit/vegetable residues or suitable food-processing by-products from known suppliers with your trainer.", "Keep contaminated, mixed unknown or chemical-treated waste out of the trial; remove foreign material and record each source.", "Confirm the substrate and testing requirements for your intended product before collecting regular supplies."],
    next: "What exact material can you obtain regularly, and where does it come from?",
    detail: ["This is not an unrestricted substrate list. Manure, slaughter waste, sewage, mouldy inputs and unknown mixed waste are not recommended here for feed production. Research on a waste stream does not approve its use."]
  },
  {
    id: "harvest", title: "Separate the larvae and keep batch records",
    sourceIds: ["A2-IWMI"],
    finding: "Harvesting separates the larvae from their rearing residue; it does not establish feed safety.",
    why: "Production larvae, breeding stock and residue need different handling.",
    actions: ["Separate the production larvae with suitable clean sieving equipment.", "Keep the breeding group separate so it can pupate and replenish the colony.", "Label and record the harvested batch and feedstock history; send the larvae and residue to their planned processing paths."],
    next: "Confirm whether your intended output is fresh larvae or a processed ingredient before choosing its handling method.",
    detail: ["Do not use colour, age or appearance alone to declare a harvested batch safe for feeding."]
  },
  {
    id: "processing", title: "Processing needs a verified method",
    sourceIds: ["A2-GSA", "A2-WUR-SAFETY", "A2-GAEC-POLICY"],
    finding: "Cleaning, controlled processing, drying and protected storage are distinct steps; drying alone is not a safety clearance.",
    why: "The substrate history, animal use and final product determine the required checks.",
    actions: ["Keep harvested larvae away from incoming waste and use clean product-handling equipment.", "Obtain a validated processing and quality-check procedure from a competent trainer or feed processor.", "For dried ingredients, check GS 1382 with GSA and keep batch labels and storage records."],
    next: "Will you use the larvae fresh on your farm, or sell a dried ingredient?",
    detail: ["No home sterilisation recipe, processing temperature, drying duration or guaranteed storage life is supplied. Suspect or poorly documented batches need assessment, not a claim that extra drying fixes them."]
  },
  {
    id: "feed", title: "An ingredient, not a complete ration",
    sourceIds: ["A2-IITA-GH", "A2-WUR-SAFETY", "A2-GSA"],
    finding: "BSF products are being explored and used as feed ingredients for poultry, fish and pigs in Ghana's BBEST work.",
    why: "The suitable product and balanced ration depend on the animal, age, processing and ingredient quality.",
    actions: ["Identify the animal and growth stage, and whether the product is fresh larvae or processed meal.", "Keep feedstock and processing records; do not treat live larvae or unknown maggots as automatically suitable.", "Ask a qualified animal nutritionist to assess the product alongside the existing ration before replacing feed."],
    next: "Which animal and age group would receive it, and what are you currently feeding?",
    detail: ["No inclusion percentage, feed formulation, complete-feed claim or growth guarantee is provided. A successful research feeding trial is not a recipe for this farm."]
  },
  {
    id: "frass", title: "Frass needs its own handling plan",
    sourceIds: ["A2-IWMI", "A2-GAEC-POLICY", "A2-WUR-SAFETY"],
    finding: "BSF frass is the mixed rearing residue, including insect droppings, shed material and leftover substrate.",
    why: "Its quality depends on what entered the system and how the residue is treated.",
    actions: ["Separate and label the residue at harvest rather than mixing batches from unknown inputs.", "Arrange appropriate composting or treatment and quality assessment before soil use or sale.", "Match any use to the crop, soil and assessed product; do not assume fresh residue is ready to apply."],
    next: "Is your goal to use frass on your own crop or sell a soil-input product?",
    detail: ["No frass application rate, pathogen-free claim or automatic replacement for a fertiliser plan is supplied. The dried-insect feed standard is not a frass approval."]
  },
  {
    id: "business", title: "Test the business before scaling",
    sourceIds: ["A2-EAWAG", "A2-GSA"],
    finding: "BSF can be an enterprise, but profit is not assured.",
    why: "Saleable output, quality requirements, reliable inputs and local costs determine whether a plan is viable.",
    actions: ["Choose a product and speak to potential customers about their specifications and demand before building capacity.", "Price the setup, collection/transport, labour, water/power, processing, packaging, testing and losses using local quotations.", "Run a small measured trial: record inputs, harvested output, rejected batches, time and actual sales or on-farm savings."],
    next: "Which product would you sell, and who has expressed interest in buying it?",
    detail: ["Possible outputs include larvae, processed ingredients and assessed frass. Waste-conversion fees need a real agreement, not an assumed revenue. No price, buyer, conversion yield or return is promised."]
  },
  {
    id: "standards", title: "Check the product-specific requirements",
    sourceIds: ["A2-GSA", "A2-GAEC-POLICY"],
    finding: "GSA lists GS 1382 for dried insect products used in compounded animal feed.",
    why: "A listed standard does not mean your farm, substrate or product is automatically approved.",
    actions: ["Ask GSA for the current edition and requirements for the dried feed ingredient you intend to make.", "Confirm with the relevant Ghana authorities what applies to your feed, soil-input or waste-conversion activity.", "Arrange the required quality checks before making certification, compliance or safety claims."],
    next: "Are you planning dried feed ingredients, fresh larvae, frass or a waste-conversion service?",
    detail: ["The public GSA catalogue describes requirements, sampling and tests; the full standard was not reviewed. This is not a complete permit checklist or legal clearance. Confirm current requirements directly."]
  },
  {
    id: "training", title: "Use a verifiable Ghana training route",
    sourceIds: ["A2-BNARI", "A2-ARI", "A2-IITA-GH"],
    finding: "GAEC–BNARI and CSIR Animal Research Institute list BSF training or technical services.",
    why: "Hands-on training can help you assess the production workflow and the product's safety requirements before investing.",
    actions: ["Use the institution links under Sources & limitations to enquire directly.", "Ask about current dates, fees, practical content and support for your intended product.", "Take a short plan stating your region, purpose and available input materials."],
    next: "Which region are you in, and do you want own-farm production or a commercial product?",
    detail: ["No course place, price, trainer endorsement or starter-stock availability is guaranteed. Past BBEST facilities are evidence of Ghana activity, not a current enrolment offer."]
  }
];

const purposes = ["Feed for my own farm", "Commercial larvae / feed ingredient", "Frass / soil input", "Waste-conversion enterprise", "I am still exploring"];
const fallbackGoals = ["Setup and materials", "Production process", "A production problem", "Business planning", "Training and support"];
function selected(answers: AgronomyAnswer[], id: string, options: string[]) {
  return answers.find(answer => answer.questionId === id && options.includes(answer.selectedOption))?.selectedOption;
}

export function selectBsfKnowledgeCard(question: string): string {
  if (/\b(how much|how many|percent\w*|ratio|formulat\w*|inclusion|dose|rate)\b/i.test(question) && /\b(feed|ration|chicken\w*|poultry|fish|pig\w*)\b/i.test(question)) return "feed";
  if (/\b(allow\w*|legal|regulat\w*|standard\w*|certif\w*|licen[cs]\w*|permit\w*)\b/i.test(question)) return "standards";
  if (/\b(frass|soil input)\b/i.test(question)) return "frass";
  if (/\b(train\w*|learn more|support|course\w*)\b/i.test(question)) return "training";
  if (/\b(money|cost\w*|budget|profit\w*|business|sell|selling|customers?|commercial)\b/i.test(question)) return "business";
  if (/\b(what.*(?:feed|fed).*(?:larvae|bsf)|feed\w* (?:on|with)|substrate\w*|feedstock\w*|waste from|wastes?|manure|sewage)\b/i.test(question)) return "substrate";
  if (/\b(dry|dried|drying|process\w*|stor\w*|preserv\w*)\b/i.test(question)) return "processing";
  if (/\b(harvest\w*)\b/i.test(question)) return "harvest";
  if (/\b(cycle|lifecycle|breed\w*|eggs?|pupae|hatch\w*)\b/i.test(question)) return "cycle";
  if (/\b(chickens?|poultry|broilers?|layers?|fish|pigs?|piglets?|feed directly|directly.*feed)\b/i.test(question)) return "feed";
  if (/\b(start|begin|setup|set up|need|facilit\w*|equipment)\b/i.test(question)) return "setup";
  return "overview";
}

export function assessFarmEnterpriseQuestion(question: string, answers: AgronomyAnswer[] = []): AgronomyAssessment | undefined {
  const topic = recognizeFarmEnterprise(question);
  if (!topic) return undefined;
  const purpose = selected(answers, "a2-bsf-purpose", purposes);
  const base = {
    reviewStatus: AGRONOMY_REVIEW, possibilities: [] as string[], answerKind: "guidance" as const,
    observed: [] as string[]
  };
  if (!topic.deepPack) {
    const goal = selected(answers, `a2-${topic.id}-goal`, fallbackGoals);
    const alreadySpecific = /\b(setup|materials?|substrate|process|problem|disease|business|training|support)\b/i.test(question);
    return {
      ...base, cardId: `enterprise-${topic.id}-limited`, topic: FARM_ENTERPRISE_DOMAIN, sourceIds: topic.sourceIds,
      observed: goal ? [`Purpose: ${goal}`] : [],
      applicability: "Topic recognition and planning questions only; no deep Ghana-specific production pack for this enterprise.",
      displayTitle: `${topic.name}: choose the next question`,
      finding: `I can help you frame a ${topic.name.toLowerCase()} question, but I do not yet have a deep Ghana-specific pack for its production methods.`,
      why: goal ? `You chose ${goal.toLowerCase()}. I can help organise the information you need without inventing a production method.` : "Tell me the part you want to understand so I can separate useful planning from advice that needs a suitable source.",
      actions: ["Describe your intended product, location and whether you are starting or already producing.", "Use a topic-specific Ghana technical source before choosing production inputs or a treatment."],
      next: goal || alreadySpecific ? `What specifically do you need to know about ${topic.name.toLowerCase()}${goal ? ` and ${goal.toLowerCase()}` : ""}?` : "Are you looking for setup, production, a problem, business planning or training?",
      detail: ["No feed recipe, treatment, food-safety clearance or profit forecast is provided. Source links identify an institution or relevant activity, not a verified production method or available course."],
      followUp: !goal && !alreadySpecific ? { id: `a2-${topic.id}-goal`, question: `What would you like to know about ${topic.name.toLowerCase()}?`, options: fallbackGoals, requiredForConfidence: true } : undefined
    };
  }
  let cardId = selectBsfKnowledgeCard(question);
  const generalEnquiry = cardId === "overview" && /\b(information|info|tell me|learn about)\b/i.test(question);
  const needsPurpose = (generalEnquiry || cardId === "setup") && !purpose;
  if (purpose === purposes[0]) cardId = "feed";
  else if (purpose === purposes[1] || purpose === purposes[3]) cardId = "business";
  else if (purpose === purposes[2]) cardId = "frass";
  const card = bsfKnowledgeCards.find(item => item.id === cardId)!;
  const speciesIsExplicit = /\b(bsf|bsfl|black[ -]soldier[ -]?fl(?:y|ies)|hermetia illucens)\b/i.test(question);
  const knownRegion = /\b(Accra|Greater Accra|Kumasi|Ashanti|Tamale|Northern|Cape Coast|Takoradi|Ho|Koforidua|Sunyani|Bono|Ahafo|Volta|Eastern|Western|Central|Savannah|Oti|Upper East|Upper West|North East)\b/i.exec(question)?.[0];
  return {
    ...base, cardId: `enterprise-bsf-${card.id}`, topic: FARM_ENTERPRISE_DOMAIN, sourceIds: card.sourceIds,
    applicability: "Ghana activity and institutional sources are distinguished from regional/general production evidence. No product, batch or business is certified here.",
    displayTitle: card.title, finding: card.finding, why: card.why, actions: card.actions,
    detail: speciesIsExplicit ? card.detail : ["This pack covers black soldier fly larvae, not every insect. Confirm the species before using BSF-specific production guidance.", ...card.detail],
    next: purpose && !knownRegion ? "Which region are you planning your BSF activity in?" : card.next,
    observed: [...(purpose ? [`Purpose: ${purpose}`] : []), ...(knownRegion ? [`Farmer-stated place: ${knownRegion}`] : [])],
    followUp: needsPurpose ? { id: "a2-bsf-purpose", question: "What is your main purpose for BSF farming?", options: purposes, requiredForConfidence: true } : undefined
  };
}

export function isFarmEnterpriseAssessment(assessment?: AgronomyAssessment): boolean {
  return assessment?.cardId.startsWith("enterprise-") === true;
}
