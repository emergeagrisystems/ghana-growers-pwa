import type { Product } from "../../types";

export const freshProduceSubcategories = [
  "Vegetables",
  "Fruits",
  "Grains",
  "Roots & Tubers",
  "Legumes",
  "Herbs & Spices",
  "Nuts"
] as const;

export const marketplaceCategoryFilterAliases: Record<string, string> = {
  cereals: "fresh-produce",
  cereal: "fresh-produce",
  grains: "fresh-produce",
  grain: "fresh-produce",
  vegetables: "fresh-produce",
  fruits: "fresh-produce",
  tubers: "fresh-produce",
  "roots-tubers": "fresh-produce",
  legumes: "fresh-produce",
  "herbs-spices": "fresh-produce",
  nuts: "fresh-produce"
};

const categoryDisplayAliases: Record<string, string> = {
  cereal: "Grains",
  cereals: "Grains",
  grain: "Grains",
  grains: "Grains",
  tuber: "Roots & Tubers",
  tubers: "Roots & Tubers",
  "roots and tubers": "Roots & Tubers",
  "roots & tubers": "Roots & Tubers",
  herb: "Herbs & Spices",
  herbs: "Herbs & Spices",
  spice: "Herbs & Spices",
  spices: "Herbs & Spices",
  "herbs and spices": "Herbs & Spices",
  "herbs & spices": "Herbs & Spices",
  legume: "Legumes",
  legumes: "Legumes",
  nut: "Nuts",
  nuts: "Nuts"
};

const grainTerms = ["maize", "rice", "sorghum", "millet", "wheat"];
const legumeTerms = ["bean", "beans", "cowpea", "soybean", "soybeans", "groundnut", "groundnuts", "pigeon pea", "pigeon peas"];
const herbSpiceTerms = ["herb", "herbs", "spice", "spices", "pepper", "ginger", "turmeric", "basil", "coriander"];
const nutTerms = ["cashew", "kola", "shea nut", "shea nuts"];
const rootTuberTerms = ["yam", "cassava", "cocoyam", "sweet potato", "tuber", "tubers"];

function normalizeCategoryToken(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function normalizeMarketplaceCategoryFilter(value?: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return marketplaceCategoryFilterAliases[normalized] ?? normalized;
}

export function displayMarketplaceCategory(product: Pick<Product, "name" | "category">) {
  const category = normalizeCategoryToken(product.category);
  const productName = normalizeCategoryToken(product.name);
  const searchable = `${productName} ${category}`;

  if (includesAny(productName, legumeTerms)) {
    return "Legumes";
  }

  if (category === "mixed" && includesAny(productName, grainTerms)) {
    return "Grains";
  }

  if (categoryDisplayAliases[category]) {
    return categoryDisplayAliases[category];
  }

  if (includesAny(searchable, grainTerms)) {
    return "Grains";
  }

  if (includesAny(searchable, rootTuberTerms)) {
    return "Roots & Tubers";
  }

  if (includesAny(searchable, herbSpiceTerms)) {
    return "Herbs & Spices";
  }

  if (includesAny(searchable, nutTerms)) {
    return "Nuts";
  }

  return product.category;
}
