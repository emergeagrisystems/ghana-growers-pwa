import type { FarmMateLocalResponseCard } from "./ai";
import type { WeatherDecisionSummary } from "./weather";
import { weatherDecisionRainChanceBand } from "./weather-decision-specialist";

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

  if (answers.length >= 1 && (text.includes("leaves are wet") || text.includes("not sure if leaves are dry"))) {
    return true;
  }

  return answers.length >= 3;
}

function liveWeatherLine(weatherContext: WeatherDecisionSummary) {
  if (typeof weatherContext.rainChancePercent === "number") {
    return `FarmMate is seeing a ${weatherContext.rainChancePercent}% chance of rain today for ${weatherContext.locationName}.`;
  }

  return `FarmMate has live weather for ${weatherContext.locationName}.`;
}

function liveWeatherCards(weatherContext: WeatherDecisionSummary, answers: FarmMateFollowUpAnswer[]): FarmMateLocalResponseCard[] {
  const text = answerText(answers);
  const rainChance = weatherContext.rainChancePercent;
  const rainAnswer =
    answers.find((answer) => answer.question?.toLowerCase().includes("rain"))?.answer.toLowerCase() ?? "";
  const rainBand = weatherDecisionRainChanceBand(rainChance);
  const highRainChance = rainBand === "high";
  const lowRainChance = rainBand === "low";
  const mediumRainChance = rainBand === "medium";
  const rainExpectedSoon = text.includes("rain is expected");
  const rainUnsure = text.includes("not sure about rain") || rainAnswer.includes("i am not sure");
  const windy = text.includes("windy") || text.includes("wind is strong") || (typeof weatherContext.windSpeedKph === "number" && weatherContext.windSpeedKph >= 25);
  const windUnsure = text.includes("not sure about the wind");
  const calmWind = text.includes("wind is calm") || (typeof weatherContext.windSpeedKph === "number" && weatherContext.windSpeedKph < 25);
  const dryLeaves = text.includes("leaves are dry");
  const wetLeaves = text.includes("leaves are wet");
  const leavesUnsure = text.includes("not sure if leaves are dry");
  const dailyCaveat = "Because this is a daily forecast, confirm the next few hours before spraying.";

  if (highRainChance) {
    return [
      {
        title: "What I think",
        body: [
          liveWeatherLine(weatherContext),
          "Do not spray now unless you can personally confirm there will be no rain for the next 4 to 6 hours. Spray only when leaves are dry and wind is calm."
        ]
      },
      {
        title: "What to do now",
        body: ["The forecast shows a high chance of rain today, but daily forecasts do not always show the exact next-hour timing."]
      },
      { title: "Next step", body: ["Check the next 4 to 6 hours before spraying."] }
    ];
  }

  if (rainExpectedSoon) {
    return [
      { title: "What I think", body: [liveWeatherLine(weatherContext), "Do not spray now."] },
      { title: "What to do now", body: ["Wait until after the rain and spray only when leaves are dry and wind is calm."] },
      { title: "Next step", body: ["Check the crop after the rain before spraying."] }
    ];
  }

  if (rainUnsure) {
    return [
      { title: "What I think", body: [liveWeatherLine(weatherContext), "Don't spray yet."] },
      { title: "What to do now", body: ["First confirm whether rain is expected in the next 4 to 6 hours. Spray only when leaves are dry and wind is calm."] },
      { title: "Next step", body: ["Confirm the rain window before spraying."] }
    ];
  }

  if (wetLeaves) {
    return [
      { title: "What I think", body: [liveWeatherLine(weatherContext), "Do not spray while leaves are wet."] },
      { title: "What to do now", body: ["Wait for leaves to dry and make sure wind is calm."] },
      { title: "Next step", body: ["Check leaf dryness again before spraying."] }
    ];
  }

  if (windy) {
    return [
      { title: "What I think", body: [liveWeatherLine(weatherContext), "Do not spray now because wind can carry spray away."] },
      { title: "What to do now", body: ["Wait for calmer wind and dry leaves before spraying."] },
      { title: "Next step", body: ["Check wind again before spraying."] }
    ];
  }

  if (highRainChance) {
    return [
      { title: "What I think", body: [liveWeatherLine(weatherContext), "Do not spray unless you can confirm no rain for the next 4 to 6 hours."] },
      { title: "What to do now", body: [dailyCaveat, "Spray only when leaves are dry and wind is calm."] },
      { title: "Next step", body: ["Confirm the next 4 to 6 hours before spraying."] }
    ];
  }

  if (leavesUnsure || windUnsure) {
    return [
      { title: "What I think", body: [liveWeatherLine(weatherContext), "Don't spray yet until the missing field checks are clear."] },
      { title: "What to do now", body: [dailyCaveat, "Spray only when leaves are dry and wind is calm."] },
      { title: "Next step", body: ["Confirm the missing field condition before spraying."] }
    ];
  }

  if (lowRainChance && dryLeaves && calmWind) {
    return [
      { title: "What I think", body: [liveWeatherLine(weatherContext), "Spraying may be suitable if the next few hours stay clear."] },
      { title: "What to do now", body: ["Follow the product label and avoid spraying during hot midday sun."] },
      { title: "Next step", body: ["Confirm no rain is likely soon before spraying."] }
    ];
  }

  if (mediumRainChance) {
    return [
      { title: "What I think", body: [liveWeatherLine(weatherContext), "Be cautious because the forecast is for the day, not the exact next few hours."] },
      { title: "What to do now", body: [dailyCaveat, "Wait if clouds build or rain looks likely soon."] },
      { title: "Next step", body: ["Confirm the next 4 to 6 hours before spraying."] }
    ];
  }

  return [
    { title: "What I think", body: [liveWeatherLine(weatherContext), "Field checks still matter before spraying."] },
    { title: "What to do now", body: [dailyCaveat, "Spray only when leaves are dry and wind is calm."] },
    { title: "Next step", body: ["Check field conditions before spraying."] }
  ];
}

export function weatherGuidedRecommendationCards(flowId: string | undefined, answers: FarmMateFollowUpAnswer[], weatherContext?: WeatherDecisionSummary): FarmMateLocalResponseCard[] | null {
  if (flowId !== "can-i-spray-today") {
    return null;
  }

  if (weatherContext?.liveWeatherAvailable) {
    return liveWeatherCards(weatherContext, answers);
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
