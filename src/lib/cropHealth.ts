export type CropHealthResult = {
  possibleIssue: string;
  confidence: number;
  recommendedAction: string;
  disclaimer: string;
};

export async function mockAnalyzeCropImage(fileName: string): Promise<CropHealthResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const lowerName = fileName.toLowerCase();
  const possibleIssue = lowerName.includes("maize") || lowerName.includes("corn")
    ? "Possible maize leaf stress or early fungal spotting"
    : "Possible early leaf spot or nutrient stress signs";

  return {
    possibleIssue,
    confidence: 72,
    recommendedAction:
      "Remove badly affected leaves, avoid overhead watering, take another photo in two days, and ask an extension officer before applying chemicals.",
    disclaimer: "This is advisory only. Please confirm with an agricultural extension officer."
  };
}
