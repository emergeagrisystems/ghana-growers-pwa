import { routeFarmMateQuestion } from "./router";
import type { FarmMateSpecialist } from "./types";

export type FarmMateRouterExample = {
  question: string;
  expectedSpecialist: FarmMateSpecialist;
  result: ReturnType<typeof routeFarmMateQuestion>;
};

const sampleQuestions: Array<Pick<FarmMateRouterExample, "question" | "expectedSpecialist">> = [
  { question: "Tomato leaves yellow", expectedSpecialist: "crop_health" },
  { question: "I see whiteflies and blight on my pepper", expectedSpecialist: "pest_disease" },
  { question: "Can I spray today if rain is coming?", expectedSpecialist: "weather_decision" },
  { question: "What should I plant and what spacing should I use?", expectedSpecialist: "planting" },
  { question: "Should I use NPK fertilizer or compost?", expectedSpecialist: "fertilizer" },
  { question: "I want to upload photo and diagnose picture", expectedSpecialist: "crop_doctor" },
  { question: "How do I improve soil health with mulching?", expectedSpecialist: "sustainability" },
  { question: "Do you have a training guide?", expectedSpecialist: "learning" },
  { question: "How can I farm better this season?", expectedSpecialist: "general_farming" }
];

export const farmMateRouterExamples: FarmMateRouterExample[] = sampleQuestions.map((example) => ({
  ...example,
  result: routeFarmMateQuestion(example.question)
}));

export const farmMateRouterExamplesPass = farmMateRouterExamples.every(
  (example) => example.result.selectedSpecialist === example.expectedSpecialist
);
