import { farmMateCrops, findFarmMateCrop } from "./crops";

const cropAliases: Record<string, string[]> = {
  maize: ["maize", "corn"],
  tomato: ["tomato", "tomatoes"],
  pepper: ["pepper", "peppers", "chilli", "chili"],
  cassava: ["cassava"],
  yam: ["yam", "yams"],
  plantain: ["plantain", "plantains"],
  onion: ["onion", "onions"],
  okra: ["okra"],
  cucumber: ["cucumber", "cucumbers"],
  "garden-eggs": ["garden eggs", "garden egg", "garden-eggs", "eggplant", "aubergine"]
};

function normalizeCropQuestion(question: string) {
  return question.toLowerCase().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
}

export function detectFarmMateCropFromQuestion(question: string) {
  const normalized = normalizeCropQuestion(question);

  for (const crop of farmMateCrops) {
    const aliases = cropAliases[crop.id] ?? [crop.name.toLowerCase()];
    const matchedAlias = aliases.find((alias) => new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(normalized));

    if (matchedAlias) {
      return crop;
    }
  }

  return undefined;
}

export function resolveFarmMateCropForQuestion(question: string, previousCropName?: string) {
  return detectFarmMateCropFromQuestion(question) ?? (previousCropName ? findFarmMateCrop(previousCropName) : undefined);
}
