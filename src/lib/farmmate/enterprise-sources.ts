import { agronomySource, type AgronomySource } from "./agronomy-sources";

/** A2 curated provenance, never runtime retrieval or evidence of product approval. */
export type EnterpriseSource = AgronomySource & {
  checkedOn: string;
  evidenceStrength: string;
  sections: string;
};
export const ENTERPRISE_CHECKED_ON = "2026-10-02";
export const enterpriseSources: EnterpriseSource[] = [
  {
    id: "A2-IITA-GH", title: "IITA BBEST: Ghana activities",
    url: "https://iita.org/bbest/bbest-activities/", geography: "Ghana: Kofisah, Adeiso, Somanya and Kumasi",
    date: "Undated project page", applicability: "Ghana", checkedOn: ENTERPRISE_CHECKED_ON,
    scope: "Ghana production facilities; larvae/feed and frass applications; decentralised units and training with BNARI.",
    exclusions: "Project achievements are not a farmer's licence, guaranteed market, certified product or feeding prescription.",
    evidenceStrength: "Primary implementing institution's report, not an independent impact or safety trial.", sections: "GHANA"
  },
  {
    id: "A2-IWMI", title: "IWMI / CGIAR: BSF farming for feed and biofertilizer (2024)",
    url: "https://hdl.handle.net/10568/141837", geography: "Ghana- and Kenya-affiliated authors; general production guide",
    date: "2024-02-28", applicability: "regional", checkedOn: ENTERPRISE_CHECKED_ON,
    scope: "Life stages; contained rearing and workflow; harvesting by separation; frass as mixed residue; traceability and records.",
    exclusions: "Not independently peer-reviewed. Do not import numeric recipes, unrestricted wastes, live-feeding permission, sterilisation, refrigeration/shelf-life or profit claims.",
    evidenceStrength: "Practical training manual; restricted to basic process concepts, cross-checked against safety research.",
    sections: "pp. 2, 8–12, 18, 34–35, 40–41, 46–47; processing/storage pp. 37, 43–44 inspected but precise claims excluded"
  },
  {
    id: "A2-WUR-SAFETY", title: "Wageningen: Safety of BSF larvae reared on waste streams",
    url: "https://research.wur.nl/en/publications/safety-of-black-soldier-fly-hermetia-illucens-larvae-reared-on-wa/",
    geography: "Netherlands / European experimental substrates; hazard evidence, not Ghana permission",
    date: "Online 2023-11-13; journal issue 2024-04-25", applicability: "general", checkedOn: ENTERPRISE_CHECKED_ON,
    scope: "Substrate-dependent chemical and microbiological hazards; need to assess both substrates and larvae.",
    exclusions: "Experimental wastes are not an approved substrate list. No EU rule or study result becomes a Ghana licence or safety clearance.",
    evidenceStrength: "Peer-reviewed small- and large-scale experiments; bounded substrates and conditions.", sections: "Abstract; DOI 10.1163/23524588-20230080"
  },
  {
    id: "A2-EAWAG", title: "Eawag: BSF biowaste processing, second edition",
    url: "https://www.eawag.ch/fileadmin/Domain1/Abteilungen/sandec/schwerpunkte/swm/Practical_knowhow_on_BSF/BSF_Biowaste_Processing_2nd_Edition_LR.pdf",
    geography: "Operational experience in Indonesia; general business-planning principles",
    date: "2021", applicability: "general", checkedOn: ENTERPRISE_CHECKED_ON,
    scope: "Separate processing functions; capital and operating costs, local quotations, output records and cost/revenue planning before scaling.",
    exclusions: "No Indonesian prices, yields, conversion factors or financial returns transferred to Ghana.",
    evidenceStrength: "Research institution's operational guide; local assumptions must be measured.", sections: "Facility workflow; chapter 6, especially p. 87"
  },
  {
    id: "A2-GSA", title: "GSA catalogue: GS 1382, dried insect products for compounded animal feed",
    url: "https://webstore.gsa.gov.gh/result.php?s=2", geography: "Ghana",
    date: "Catalogue listing 2023-04-13", applicability: "Ghana", checkedOn: ENTERPRISE_CHECKED_ON,
    scope: "GS 1382 is listed for dried insect feed ingredients, including requirements, sampling and tests.",
    exclusions: "Only public catalogue scope inspected, not the purchased standard. No invented limits, compulsory status, complete permit checklist or product certification.",
    evidenceStrength: "Primary standards authority catalogue; confirm current edition and applicability directly with GSA.", sections: "Agriculture & Livestock: GS 1382"
  },
  {
    id: "A2-BNARI", title: "GAEC–BNARI: BSF training and technical services",
    url: "https://bnari.gaec.gov.gh/radiation-entomology-and-pest-management-centre/", geography: "Ghana",
    date: "Undated current services page", applicability: "Ghana", checkedOn: ENTERPRISE_CHECKED_ON,
    scope: "Institution advertises entrepreneur/farmer training in BSF feed and fertiliser production and related research.",
    exclusions: "No guaranteed availability, course schedule, fee, starter-stock supply or endorsement of a private trainer.",
    evidenceStrength: "Primary institution's service listing; farmer must confirm current arrangements.", sections: "Services and ongoing projects"
  },
  {
    id: "A2-GAEC-POLICY", title: "GAEC–BNARI: BSF technology policy brief",
    url: "https://gaec.gov.gh/wp-content/uploads/2023/11/BriefPolicy.pdf", geography: "Ghana policy context",
    date: "2023 (publication path)", applicability: "Ghana", checkedOn: ENTERPRISE_CHECKED_ON,
    scope: "Feed, soil-input and waste-management uses have different safety, quality and regulatory considerations.",
    exclusions: "Policy opportunity discussion is not legal permission or proof of nutritional completeness, safety or profit.",
    evidenceStrength: "Institutional policy brief, not an operational approval.", sections: "Regulatory and Safety Considerations, p. 6; acknowledgements, p. 7"
  },
  {
    id: "A2-FORIG", title: "CSIR-CRI / FORIG: Ghana livelihood-enterprise training",
    url: "https://cropsresearch.org/2026/04/a-3-day-training-on-livelihood-enhancement-activities-organised-for-embrace-project-beneficiaries-in-ghana-a-step-towards-sustainable-agriculture/",
    geography: "Ghana: Ashanti, Ahafo and Western North project communities", date: "2026-04-14",
    applicability: "Ghana", checkedOn: ENTERPRISE_CHECKED_ON,
    scope: "Documented training in mushroom production, snail farming and beekeeping supports recognition and a referral for current training.",
    exclusions: "Past event, not an open enrolment offer or a deep production pack.",
    evidenceStrength: "Primary research institute's event report.", sections: "Training held 23–25 March 2026"
  },
  {
    id: "A2-ARI", title: "CSIR Animal Research Institute: training services",
    url: "https://ari.csir.org.gh/comm/training.php", geography: "Ghana", date: "Undated services page",
    applicability: "Ghana", checkedOn: ENTERPRISE_CHECKED_ON,
    scope: "Poultry and BSF training service categories.", exclusions: "No current dates, fees, rations, veterinary treatment or guaranteed access.",
    evidenceStrength: "Primary institution's service listing.", sections: "Training services"
  },
  {
    id: "A2-MOFA-SCOPE", title: "MoFA: agriculture-sector responsibilities",
    url: "https://www.mofa.gov.gh/site/index.php/about-us", geography: "Ghana", date: "Undated institutional page",
    applicability: "Ghana", checkedOn: ENTERPRISE_CHECKED_ON,
    scope: "General crop/livestock support remit; fisheries has a separate ministry. Used only for limited topic fallback, not production advice.",
    exclusions: "No enterprise-specific method, permit, subsidy, technical standard or training availability inferred.",
    evidenceStrength: "Primary institutional remit.", sections: "About MoFA"
  }
];

/** Existing A1 IDs resolve exactly as before; A2 keeps its own register. */
export function farmMateKnowledgeSource(id: string): AgronomySource {
  return enterpriseSources.find(source => source.id === id) ?? agronomySource(id);
}
