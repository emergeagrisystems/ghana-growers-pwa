import { getLearnChallengeById } from "./learn-challenges";

const soilHealthChallenge = getLearnChallengeById("soil-health");

export type SoilHealthChallengeDay = NonNullable<typeof soilHealthChallenge>["days"][number];

export const soilHealthChallengeDays = soilHealthChallenge?.days ?? [];

export const soilHealthChallengeIntro = {
  title: soilHealthChallenge?.title ?? "7-Day Soil Health Challenge",
  body: soilHealthChallenge?.description ?? "Improve your soil this week using materials already on your farm.",
  farmMateQuestion: soilHealthChallenge?.days[0]?.farmMatePrompt ?? "How can I make compost with materials on my farm?"
};
