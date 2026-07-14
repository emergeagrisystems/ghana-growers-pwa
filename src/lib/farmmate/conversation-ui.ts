import type { FarmMateLocalResponseCard } from "./ai";

const FALLBACK_MESSAGE = "FarmMate AI is temporarily limited, but you can still use the local guidance.";
const SUMMARY_SEPARATOR = " · ";

const fillerPatterns = [
  /\bI will keep it short and focused\.?\s*/gi,
  /\bHere is the practical next step\.?\s*/gi,
  /^I can help\.?\s*/gim
];

export type AskFarmMateResponseState = {
  isGeneratingNaturalAnswer: boolean;
  naturalAnswer: string;
  localCards: FarmMateLocalResponseCard[];
  aiFallbackMessage: string;
  isLocalOnlyResponse?: boolean;
};

export type FarmMateFollowUpAnswer = {
  question?: string;
  answer: string;
};

export function cleanFarmMateFinalAnswer(answer: string) {
  return fillerPatterns
    .reduce((cleaned, pattern) => cleaned.replace(pattern, ""), answer)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function farmMateFallbackMessage(message?: string | null) {
  const trimmed = message?.trim();

  if (!trimmed) {
    return FALLBACK_MESSAGE;
  }

  return trimmed.includes("local guidance") ? trimmed : `${FALLBACK_MESSAGE} ${trimmed}`;
}

export function shouldRenderLocalFarmMateGuidance(state: AskFarmMateResponseState) {
  if (state.isGeneratingNaturalAnswer || state.naturalAnswer.trim()) {
    return false;
  }

  if (state.isLocalOnlyResponse) {
    return state.localCards.length > 0;
  }

  return state.localCards.length > 0 && Boolean(state.aiFallbackMessage.trim());
}

export function compactFollowUpSummary(answers: Array<{ answer: string }>) {
  return answers
    .map((answer) => answer.answer.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(SUMMARY_SEPARATOR);
}

function answerText(answers: FarmMateFollowUpAnswer[]) {
  return answers.map((answer) => answer.answer.toLowerCase()).join(" ");
}

export function shouldCompleteWeatherGuidedFlow(flowId: string | undefined, answers: FarmMateFollowUpAnswer[]) {
  if (flowId !== "can-i-spray-today") {
    return false;
  }

  const text = answerText(answers);
  const rainAnswer = answers[0]?.answer.toLowerCase() ?? "";
  const windAnswer = answers[1]?.answer.toLowerCase() ?? "";

  if (answers.length >= 1 && (text.includes("rain is expected") || rainAnswer.includes("i am not sure") || text.includes("not sure about rain"))) {
    return true;
  }

  if (answers.length >= 2 && (text.includes("windy") || text.includes("wind is strong") || windAnswer.includes("i am not sure") || text.includes("not sure about the wind"))) {
    return true;
  }

  return answers.length >= 3;
}

export function weatherGuidedRecommendationCards(flowId: string | undefined, answers: FarmMateFollowUpAnswer[]): FarmMateLocalResponseCard[] | null {
  if (flowId !== "can-i-spray-today") {
    return null;
  }

  const text = answerText(answers);
  const rainExpected = text.includes("rain is expected");
  const rainUnsure = text.includes("not sure about rain") || (answers[0]?.answer.toLowerCase() ?? "").includes("i am not sure");
  const noRain = text.includes("no rain expected");
  const calmWind = text.includes("wind is calm");
  const windy = text.includes("windy") || text.includes("wind is strong");
  const windUnsure = text.includes("not sure about the wind") || (answers[1]?.answer.toLowerCase() ?? "").includes("i am not sure");
  const dryLeaves = text.includes("leaves are dry");
  const wetLeaves = text.includes("leaves are wet");
  const leavesUnsure = text.includes("not sure if leaves are dry") || (answers[2]?.answer.toLowerCase() ?? "").includes("i am not sure");

  if (rainExpected) {
    return [
      { title: "What I think", body: ["Do not spray now."] },
      { title: "What to do now", body: ["Wait until after the rain and spray only when leaves are dry and wind is calm."] },
      { title: "Next step", body: ["Check the crop after the rain before spraying."] }
    ];
  }

  if (rainUnsure || windUnsure || leavesUnsure) {
    return [
      { title: "What I think", body: ["Don't spray yet."] },
      { title: "What to do now", body: ["First confirm whether rain is expected in the next 4 to 6 hours. Spray only when leaves are dry and wind is calm."] },
      { title: "Next step", body: ["Confirm the rain window before spraying."] }
    ];
  }

  if (windy) {
    return [
      { title: "What I think", body: ["Do not spray now. Wind can carry spray away from the crop."] },
      { title: "What to do now", body: ["Wait for calm wind and dry leaves before spraying."] },
      { title: "Next step", body: ["Check wind again later today before spraying."] }
    ];
  }

  if (wetLeaves) {
    return [
      { title: "What I think", body: ["Do not spray while leaves are wet. Spray may not stay on the crop well."] },
      { title: "What to do now", body: ["Wait for leaves to dry and make sure wind is calm."] },
      { title: "Next step", body: ["Check leaf dryness before spraying."] }
    ];
  }

  if (noRain && calmWind && dryLeaves) {
    return [
      { title: "What I think", body: ["Spraying may be suitable."] },
      { title: "What to do now", body: ["Follow the product label and avoid spraying during hot midday sun."] },
      { title: "Next step", body: ["Spray only if the product label and field conditions are suitable."] }
    ];
  }

  return [
    { title: "What I think", body: ["Do not spray until the weather checks are clear."] },
    { title: "What to do now", body: ["Confirm rain, wind and leaf dryness before acting."] },
    { title: "Next step", body: ["Check the weather window before spraying."] }
  ];
}

export function harvestPostHarvestGuidedRecommendationCards(flowId: string | undefined, answers: FarmMateFollowUpAnswer[]): FarmMateLocalResponseCard[] | null {
  if (flowId !== "store-cassava-after-harvest") {
    return null;
  }

  const text = answerText(answers);
  const notHarvested = text.includes("not harvested yet");

  if (!notHarvested) {
    return null;
  }

  return [
    {
      title: "What I think",
      body: ["Since the cassava is not harvested yet, avoid lifting more roots than you can use, process, sell or move soon."]
    },
    {
      title: "What to do now",
      body: [
        "Leave the rest in the ground until needed.",
        "Prepare shade and transport before harvesting.",
        "Harvest carefully to avoid cuts and bruises."
      ]
    },
    {
      title: "Next step",
      body: ["Harvest only the quantity you can move soon."]
    }
  ];
}
