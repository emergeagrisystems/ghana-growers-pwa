export type FarmEnterpriseTopic = { id: string; name: string; sourceIds: string[]; deepPack: boolean };

export const farmEnterpriseTopics: FarmEnterpriseTopic[] = [
  { id: "bsf", name: "Black Soldier Fly farming", sourceIds: ["A2-IITA-GH", "A2-BNARI"], deepPack: true },
  { id: "mushroom", name: "Mushroom production", sourceIds: ["A2-FORIG"], deepPack: false },
  { id: "beekeeping", name: "Beekeeping", sourceIds: ["A2-FORIG"], deepPack: false },
  { id: "snail", name: "Snail farming", sourceIds: ["A2-FORIG"], deepPack: false },
  { id: "compost", name: "Composting enterprise", sourceIds: ["A2-MOFA-SCOPE"], deepPack: false },
  { id: "nursery", name: "Nursery and seedling enterprise", sourceIds: ["A2-MOFA-SCOPE"], deepPack: false },
  { id: "poultry", name: "Poultry production", sourceIds: ["A2-ARI"], deepPack: false },
  { id: "aquaculture", name: "Fish farming / aquaculture", sourceIds: ["A2-MOFA-SCOPE"], deepPack: false },
  { id: "irrigation", name: "Irrigation enterprise planning", sourceIds: ["A2-MOFA-SCOPE"], deepPack: false },
  { id: "protected", name: "Protected cultivation", sourceIds: ["A2-MOFA-SCOPE"], deepPack: false }
];

/** Explicit enterprise language only. Ordinary pests, compost use and field irrigation stay in A1. */
export function recognizeFarmEnterprise(question: string): FarmEnterpriseTopic | undefined {
  const q = question.toLowerCase().replace(/[–—-]/g, " ").replace(/\s+/g, " ");
  let id: string | undefined;
  if (/\b(bsf|bsfl|black soldier ?fl(?:y|ies)|hermetia illucens)\b|\binsect (?:farming|rearing|production)\b.*\bfeed\b|\blarvae (?:production|farming|rearing)\b|\bdried insect (?:feed|products?)\b/.test(q)) id = "bsf";
  else if (/\bmushroom (?:farm\w*|produc\w*|cultivat\w*|business|substrate|setup)\b|\b(?:grow|growing|produce|cultivate) mushrooms\b/.test(q)) id = "mushroom";
  else if (/\b(bee ?keeping|apiculture|bee farming|honey production)\b/.test(q)) id = "beekeeping";
  else if (/\bsnail (?:farm\w*|produc\w*|rear\w*|business)\b|\b(?:rear|raise|breed|raising) snails\b/.test(q)) id = "snail";
  else if (/\b(compost\w*|farm waste|organic waste)\b.*\b(business|enterprise|commercial|sell|conversion)\b/.test(q)) id = "compost";
  else if (/\b(nursery|seedling\w*)\b.*\b(business|enterprise|commercial|sell)\b/.test(q)) id = "nursery";
  else if (/\b(poultry (?:farm\w*|production|business)|chicken farming|broiler production|layer production)\b/.test(q)) id = "poultry";
  else if (/\b(aquaculture|fish farming|fish farm|tilapia farming|catfish farming)\b/.test(q)) id = "aquaculture";
  else if (/\birrigation\b.*\b(business|enterprise|system setup|investment)\b/.test(q)) id = "irrigation";
  else if (/\b(greenhouse|shade net|protected cultivation)\b.*\b(start|setup|set up|business|enterprise|basics|production|farming)\b|\b(start|setup|build|set up)\b.*\b(greenhouse|shade net)\b/.test(q)) id = "protected";
  return farmEnterpriseTopics.find(topic => topic.id === id);
}
