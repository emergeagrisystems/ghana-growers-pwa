export type CropHealthResult = {
  possibleIssue: string;
  confidence: number;
  symptoms?: string;
  recommendedAction: string;
  severity?: string;
  disclaimer: string;
  provider?: "crop.health" | "mock";
  noDiseaseDetected?: boolean;
  lowConfidence?: boolean;
};

export const cropHealthDisclaimer =
  "This tool provides advisory guidance only. Please confirm serious crop problems with an agricultural extension officer.";

export async function mockAnalyzeCropImage(fileName: string): Promise<CropHealthResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const lowerName = fileName.toLowerCase();
  const possibleIssue = lowerName.includes("maize") || lowerName.includes("corn")
    ? "Possible maize leaf stress or early fungal spotting"
    : "Possible early leaf spot or nutrient stress signs";

  return {
    possibleIssue,
    confidence: 72,
    symptoms: "Visible leaf discoloration, spots, wilting, or growth stress may be present in the uploaded photo.",
    recommendedAction:
      "Remove badly affected leaves, avoid overhead watering, take another photo in two days, and ask an extension officer before applying chemicals.",
    severity: "Advisory review needed",
    disclaimer: cropHealthDisclaimer,
    provider: "mock"
  };
}
