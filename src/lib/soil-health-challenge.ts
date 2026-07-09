export type SoilHealthChallengeDay = {
  day: number;
  title: string;
  shortLabel: string;
  whatYouNeed: string[];
  whyItMatters: string;
  nextStep: string;
};

export const soilHealthChallengeDays: SoilHealthChallengeDay[] = [
  {
    day: 1,
    title: "Collect dry leaves and crop waste",
    shortLabel: "Collect dry leaves and crop waste.",
    whatYouNeed: ["Dry leaves", "Dry grass", "Crop waste", "Vegetable scraps", "Small amount of manure if available"],
    whyItMatters: "Compost needs both dry and green materials to break down well.",
    nextStep: "Put the materials in one shaded place so you can build your compost pile."
  },
  {
    day: 2,
    title: "Choose a compost corner",
    shortLabel: "Choose a compost corner.",
    whatYouNeed: ["A shaded corner", "Space away from standing water", "Easy access to water", "Room to turn the pile"],
    whyItMatters: "A good compost place stays moist, drains well, and is easy to manage.",
    nextStep: "Choose one shaded, well-drained place where your compost can stay for several weeks."
  },
  {
    day: 3,
    title: "Build your first pile",
    shortLabel: "Build your first pile.",
    whatYouNeed: ["Dry materials", "Green crop waste", "A little manure if available", "Water", "A stick or fork"],
    whyItMatters: "Layering dry and green materials helps the pile heat and break down evenly.",
    nextStep: "Build a small pile with dry material first, then green waste, then a little manure if available."
  },
  {
    day: 4,
    title: "Cover the pile",
    shortLabel: "Cover the pile.",
    whatYouNeed: ["Banana leaves", "Old sack", "Palm fronds", "Dry grass", "Any breathable cover"],
    whyItMatters: "Covering keeps the pile moist and protects it from heavy rain and too much sun.",
    nextStep: "Cover the compost pile while leaving a little airflow around the sides."
  },
  {
    day: 5,
    title: "Check moisture",
    shortLabel: "Check moisture.",
    whatYouNeed: ["Your hand", "Small amount of water", "Dry leaves if the pile is too wet"],
    whyItMatters: "Compost should feel damp like a squeezed cloth, not dry and not soaked.",
    nextStep: "Add a little water if it is dry, or add dry leaves if it smells bad or feels too wet."
  },
  {
    day: 6,
    title: "Turn the pile",
    shortLabel: "Turn the pile.",
    whatYouNeed: ["Hoe, fork, or stick", "Gloves if available", "A little water if dry"],
    whyItMatters: "Turning brings air into the pile so materials break down faster and smell less.",
    nextStep: "Turn the outside materials into the middle and cover the pile again."
  },
  {
    day: 7,
    title: "Ask FarmMate what to improve",
    shortLabel: "Ask FarmMate what to improve.",
    whatYouNeed: ["Your compost pile", "A quick check of smell", "A quick check of moisture", "Any question you have"],
    whyItMatters: "A short review helps you fix problems early and make better compost next time.",
    nextStep: "Ask FarmMate how to improve your compost pile based on what you noticed."
  }
];

export const soilHealthChallengeIntro = {
  title: "7-Day Soil Health Challenge",
  body: "Improve your soil this week using materials already on your farm.",
  farmMateQuestion: "How can I make compost with materials on my farm?"
};
