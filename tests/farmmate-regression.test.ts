import assert from "node:assert/strict";
import { buildFarmMateResponse, type FarmMateBrainResponse } from "../src/lib/farmmate/decision-engine";
import { buildFarmMateVoiceLayerInput } from "../src/lib/farmmate/ai";
import { cleanFarmMateFinalAnswer, compactFollowUpSummary, farmMateFallbackMessage, shouldRenderLocalFarmMateGuidance } from "../src/lib/farmmate/conversation-ui";
import { farmMateDailySummaries, getFarmMateDailySummary, getFarmMateGreetingForHour } from "../src/lib/farmmate/daily-summary";
import { manageFarmMateConversation, type ConversationState } from "../src/lib/farmmate/conversation-manager";
import { diagnosisFromFileName, farmMateQuestionFromDiagnosis, unknownCropDiagnosis } from "../src/lib/farmmate/crop-doctor-demo";
import {
  buildCropDoctorAskFarmMatePrompt,
  cropDoctorResultHasUnsafeLanguage,
  CROP_DOCTOR_MAX_IMAGE_BYTES,
  CROP_DOCTOR_TOO_LARGE_MESSAGE,
  cropDoctorResultBadge,
  cropDoctorResultHeading,
  cropDoctorResultHeadline,
  cropDoctorVisionSystemPrompt,
  normalizeCropDoctorVisionResult,
  validateCropDoctorImage
} from "../src/lib/farmmate/crop-doctor-vision";
import { routeFarmMateQuestion } from "../src/lib/farmmate/router";
import {
  canUseMemoryUsageFallback,
  getFarmMateCreditDecision,
  getFarmMateCreditStatus,
  isCountableFarmMateSubmission,
  CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT,
  CROP_DOCTOR_TEMPORARILY_LIMITED_MESSAGE,
  cropDoctorCreditMessage,
  farmMateCreditLine,
  formatRefreshIn,
  shouldDisableCropDoctorAnalysis,
  shouldDisableCropDoctorUpload,
  usageTrackingUnavailableDecision,
  type FarmMateUsageEvent
} from "../src/lib/farmmate/usage";

type TestCase = {
  name: string;
  run: () => void;
};

const plantHealthTomatoState: ConversationState = {
  activeTopic: "plant_health",
  activeCropName: "Tomato",
  activeSpecialist: "crop_health",
  waitingForFollowUp: true,
  turns: [{ message: "My tomato leaves are yellow", topic: "plant_health", cropName: "Tomato", specialist: "crop_health" }]
};

const emptyState: ConversationState = {
  waitingForFollowUp: false,
  turns: []
};

function responseText(response: FarmMateBrainResponse) {
  return response.sections.flatMap((section) => [section.title, ...section.body]).join("\n");
}

function assertNoDeveloperLanguage(response: FarmMateBrainResponse) {
  const text = responseText(response).toLowerCase();
  assert.equal(text.includes("tell the farmer"), false);
  assert.equal(text.includes("medium confidence"), false);
  assert.equal(text.includes("high confidence"), false);
  assert.equal(text.includes("low confidence"), false);
}

function usageEvent(tool: "ask_farmmate" | "crop_doctor", createdAt: string): FarmMateUsageEvent {
  return { tool, createdAt };
}

function normalizeAdviceText(text: string) {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

const tests: TestCase[] = [
  {
    name: "FarmMate greeting never returns Good night",
    run: () => {
      for (let hour = 0; hour < 24; hour += 1) {
        assert.notEqual(getFarmMateGreetingForHour(hour), "Good night");
      }
    }
  },
  {
    name: "night time greeting returns Good evening",
    run: () => {
      assert.equal(getFarmMateGreetingForHour(21), "Good evening");
      assert.equal(getFarmMateGreetingForHour(0), "Good evening");
      assert.equal(getFarmMateGreetingForHour(4), "Good evening");
    }
  },
  {
    name: "at least 14 daily summaries exist",
    run: () => {
      assert.equal(farmMateDailySummaries.length >= 14, true);
    }
  },
  {
    name: "daily summary changes by date",
    run: () => {
      const first = getFarmMateDailySummary(new Date(2026, 6, 9, 9));
      const second = getFarmMateDailySummary(new Date(2026, 6, 10, 9));

      assert.notEqual(first.mainRecommendation, second.mainRecommendation);
    }
  },
  {
    name: "same date returns same daily summary",
    run: () => {
      const first = getFarmMateDailySummary(new Date(2026, 6, 9, 8));
      const second = getFarmMateDailySummary(new Date(2026, 6, 9, 10));

      assert.deepEqual(first, second);
    }
  },
  {
    name: "evening daily summary does not show plant before noon",
    run: () => {
      const summary = getFarmMateDailySummary(new Date(2026, 6, 9, 18));
      const text = `${summary.mainRecommendation} ${summary.rainOutlookNote} ${summary.todaysTip}`.toLowerCase();

      assert.equal(text.includes("plant before noon"), false);
      assert.notEqual(summary.suitableTimeOfDay, "morning");
    }
  },
  {
    name: "night daily summary does not show morning-only advice",
    run: () => {
      const summary = getFarmMateDailySummary(new Date(2026, 6, 9, 22));
      const text = `${summary.mainRecommendation} ${summary.rainOutlookNote} ${summary.todaysTip}`.toLowerCase();

      assert.equal(text.includes("before noon"), false);
      assert.equal(text.includes("early when the day is cool"), false);
      assert.notEqual(summary.suitableTimeOfDay, "morning");
    }
  },
  {
    name: "daily summaries do not repeat the exact recommendation as the tip",
    run: () => {
      for (const summary of farmMateDailySummaries) {
        assert.notEqual(normalizeAdviceText(summary.mainRecommendation), normalizeAdviceText(summary.todaysTip));
      }
    }
  },
  {
    name: "each daily summary has a practical tip",
    run: () => {
      const practicalWords = ["check", "water", "remove", "keep", "separate", "disinfect", "use", "open", "pull", "shake", "mark", "dig"];

      for (const summary of farmMateDailySummaries) {
        const tip = normalizeAdviceText(summary.todaysTip);

        assert.equal(summary.todaysTip.length > 24, true);
        assert.equal(practicalWords.some((word) => tip.includes(word)), true);
      }
    }
  },
  {
    name: "evening and night summaries avoid immediate morning-only field work",
    run: () => {
      const summaries = farmMateDailySummaries.filter((summary) => summary.suitableTimeOfDay === "evening" || summary.suitableTimeOfDay === "night");

      for (const summary of summaries) {
        const text = normalizeAdviceText(`${summary.mainRecommendation} ${summary.rainOutlookNote} ${summary.todaysTip}`);

        assert.equal(text.includes("water young vegetables early"), false);
        assert.equal(text.includes("weed young crops"), false);
        assert.equal(text.includes("transplant when soil is moist"), false);
        assert.equal(text.includes("while the sun is still gentle"), false);
      }
    }
  },
  {
    name: "daily summary does not claim live weather",
    run: () => {
      for (const summary of farmMateDailySummaries) {
        const text = `${summary.mainRecommendation} ${summary.rainOutlookNote} ${summary.todaysTip}`.toLowerCase();

        assert.equal(text.includes("rain expected after"), false);
        assert.equal(text.includes("rain will come"), false);
        assert.equal(text.includes("rain is coming"), false);
      }
    }
  },
  {
    name: "maize question resolves maize",
    run: () => {
      const response = buildFarmMateResponse("My maize is not growing well", routeFarmMateQuestion("My maize is not growing well"));
      assert.equal(response.resolvedCrop, "Maize");
      assert.notEqual(response.flow?.requiredInformation.crop, "Tomato");
    }
  },
  {
    name: "tomato yellow leaves resolves tomato",
    run: () => {
      const response = buildFarmMateResponse("My tomato leaves are yellow", routeFarmMateQuestion("My tomato leaves are yellow"));
      assert.equal(response.resolvedCrop, "Tomato");
      assert.equal(response.flow?.requiredInformation.crop, "Tomato");
    }
  },
  {
    name: "cassava curling leaves resolves cassava",
    run: () => {
      const response = buildFarmMateResponse("My cassava leaves are curling", routeFarmMateQuestion("My cassava leaves are curling"));
      assert.equal(response.resolvedCrop, "Cassava");
      assert.notEqual(response.flow?.requiredInformation.crop, "Tomato");
    }
  },
  {
    name: "asking maize after tomato resets crop context",
    run: () => {
      const decision = manageFarmMateConversation("My maize is not growing well", plantHealthTomatoState);
      const response = buildFarmMateResponse("My maize is not growing well", routeFarmMateQuestion("My maize is not growing well"), {
        previousCropName: decision.shouldKeepContext ? plantHealthTomatoState.activeCropName : undefined
      });

      assert.equal(decision.action, "reset");
      assert.equal(decision.resetReason, "new_crop");
      assert.equal(response.resolvedCrop, "Maize");
    }
  },
  {
    name: "fertilizer question routes to fertilizer",
    run: () => {
      const router = routeFarmMateQuestion("Best fertilizer for maize");
      assert.equal(router.selectedSpecialist, "fertilizer");
      assert.equal(router.detectedCrop, "Maize");
    }
  },
  {
    name: "NPK pepper question routes to fertilizer",
    run: () => {
      const router = routeFarmMateQuestion("What NPK for pepper?");
      assert.equal(router.selectedSpecialist, "fertilizer");
      assert.equal(router.detectedCrop, "Pepper");
    }
  },
  {
    name: "compost tomato question routes to fertilizer",
    run: () => {
      const router = routeFarmMateQuestion("Can I use compost for tomatoes?");
      assert.equal(router.selectedSpecialist, "fertilizer");
      assert.equal(router.detectedCrop, "Tomato");
    }
  },
  {
    name: "best fertilizer for maize asks growth stage first",
    run: () => {
      const question = "Best fertilizer for maize";
      const response = buildFarmMateResponse(question, routeFarmMateQuestion(question));

      assert.equal(response.routerResult?.selectedSpecialist, "fertilizer");
      assert.equal(response.flow?.id, "best-fertilizer-for-maize");
      assert.equal(response.flow?.followUpQuestions[0]?.question, "How old is the maize?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Less than 2 weeks", "2 to 4 weeks", "More than 4 weeks", "Already flowering"]);
      assert.equal(response.flow?.followUpQuestions.some((followUp) => followUp.id.includes("yellow")), false);
    }
  },
  {
    name: "fertilizer recommendation does not invent dosage",
    run: () => {
      const response = buildFarmMateResponse("Best fertilizer for maize", routeFarmMateQuestion("Best fertilizer for maize"));
      const text = responseText(response).toLowerCase();

      assert.equal(/\b\d+(?:\.\d+)?\s?(?:kg|g|ml|l)\b/.test(text), false);
      assert.equal(text.includes("do not guess rates"), true);
    }
  },
  {
    name: "fertilizer advice warns against heavy rain",
    run: () => {
      const response = buildFarmMateResponse("When to apply fertilizer after rain?", routeFarmMateQuestion("When to apply fertilizer after rain?"));
      const text = responseText(response).toLowerCase();

      assert.equal(response.flow?.id, "fertilizer-after-rain");
      assert.equal(text.includes("do not apply before heavy rain"), true);
    }
  },
  {
    name: "fertilizer advice includes one next best action",
    run: () => {
      const response = buildFarmMateResponse("What NPK for pepper?", routeFarmMateQuestion("What NPK for pepper?"));
      const nextBestAction = response.sections.find((section) => section.title === "Next Best Action")?.body ?? [];

      assert.equal(response.flow?.id, "fertilizer-for-pepper");
      assert.equal(nextBestAction.length, 1);
      assert.equal(Boolean(response.nextBestAction.instruction), true);
    }
  },
  {
    name: "maize yellow leaves routes to plant health first",
    run: () => {
      const question = "Maize leaves are yellow";
      const router = routeFarmMateQuestion(question);
      const response = buildFarmMateResponse(question, router);

      assert.equal(router.selectedSpecialist, "crop_health");
      assert.notEqual(response.flow?.id, "best-fertilizer-for-maize");
      assert.equal(response.flow?.intent, "crop-health");
    }
  },
  {
    name: "OpenAI payload for fertilizer includes specialist context",
    run: () => {
      const farmerQuestion = "Best fertilizer for maize";
      const brain = buildFarmMateResponse(farmerQuestion, routeFarmMateQuestion(farmerQuestion));
      const payload = JSON.parse(
        buildFarmMateVoiceLayerInput({
          farmerQuestion,
          brain,
          farmerAnswers: [],
          localStructuredResponse: []
        })
      ) as { selectedSpecialist?: string; specialistContext?: { specialist?: string; crop?: string; safeUseNotes?: string[] } };

      assert.equal(payload.selectedSpecialist, "fertilizer");
      assert.equal(payload.specialistContext?.specialist, "fertilizer");
      assert.equal(payload.specialistContext?.crop, "Maize");
      assert.equal(payload.specialistContext?.safeUseNotes?.some((note) => note.toLowerCase().includes("do not guess rates")), true);
    }
  },
  {
    name: "spray question routes to weather decision",
    run: () => {
      assert.equal(routeFarmMateQuestion("Can I spray today?").selectedSpecialist, "weather_decision");
    }
  },
  {
    name: "fertilizer before rain routes to weather decision",
    run: () => {
      const router = routeFarmMateQuestion("Can I apply fertilizer before rain?");
      const response = buildFarmMateResponse("Can I apply fertilizer before rain?", router);

      assert.equal(router.selectedSpecialist, "weather_decision");
      assert.equal(response.flow?.id, "fertilizer-before-rain");
    }
  },
  {
    name: "irrigation question routes to weather decision",
    run: () => {
      const router = routeFarmMateQuestion("Should I irrigate today?");
      const response = buildFarmMateResponse("Should I irrigate today?", router);

      assert.equal(router.selectedSpecialist, "weather_decision");
      assert.equal(response.flow?.id, "should-i-irrigate-today");
    }
  },
  {
    name: "harvest before rain routes to weather decision",
    run: () => {
      const router = routeFarmMateQuestion("Can I harvest before rain?");
      const response = buildFarmMateResponse("Can I harvest before rain?", router);

      assert.equal(router.selectedSpecialist, "weather_decision");
      assert.equal(response.flow?.id, "harvest-before-rain");
    }
  },
  {
    name: "dry produce outside routes to weather decision",
    run: () => {
      const router = routeFarmMateQuestion("Can I dry produce outside?");
      const response = buildFarmMateResponse("Can I dry produce outside?", router);

      assert.equal(router.selectedSpecialist, "weather_decision");
      assert.equal(response.flow?.id, "dry-produce-outside");
    }
  },
  {
    name: "weather flow asks rain expectation first when live weather is unavailable",
    run: () => {
      const response = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"));

      assert.equal(response.flow?.followUpQuestions[0]?.id, "rain-window");
      assert.equal(response.flow?.followUpQuestions[0]?.question, "Is rain expected in the next 4 to 6 hours?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Yes, rain is expected", "No rain expected", "I am not sure"]);
    }
  },
  {
    name: "spraying advice warns against rain within 4 to 6 hours and strong wind",
    run: () => {
      const response = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("4 to 6 hours"), true);
      assert.equal(text.includes("do not spray before rain"), true);
      assert.equal(text.includes("wind is calm"), true);
    }
  },
  {
    name: "fertilizer weather advice warns against heavy rain and runoff",
    run: () => {
      const response = buildFarmMateResponse("Can I apply fertilizer before rain?", routeFarmMateQuestion("Can I apply fertilizer before rain?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("heavy rain"), true);
      assert.equal(text.includes("runoff"), true);
      assert.equal(response.flow?.recommendation.guidance.some((line) => line.toLowerCase().includes("runoff")), true);
    }
  },
  {
    name: "weather advice does not invent live forecast",
    run: () => {
      const response = buildFarmMateResponse("Can I spray today?", routeFarmMateQuestion("Can I spray today?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("rain is coming today"), false);
      assert.equal(text.includes("rain will come today"), false);
      assert.equal(text.includes("check whether rain is expected"), true);
    }
  },
  {
    name: "weather recommendation includes one next best action",
    run: () => {
      const response = buildFarmMateResponse("Can I harvest before rain?", routeFarmMateQuestion("Can I harvest before rain?"));

      assert.equal(response.flow?.recommendation.nextBestAction.instruction, "Harvest mature produce first if heavy rain may damage it.");
      assert.equal(response.sections.find((section) => section.title === "Next Best Action")?.body.length, 1);
    }
  },
  {
    name: "OpenAI payload includes weather specialist context",
    run: () => {
      const farmerQuestion = "Can I apply fertilizer before rain?";
      const brain = buildFarmMateResponse(farmerQuestion, routeFarmMateQuestion(farmerQuestion));
      const payload = JSON.parse(
        buildFarmMateVoiceLayerInput({
          farmerQuestion,
          brain,
          farmerAnswers: [],
          localStructuredResponse: []
        })
      ) as { selectedSpecialist?: string; specialistContext?: { specialist?: string; task?: string; noLiveWeatherRule?: string; safetyWarnings?: string[] } };

      assert.equal(payload.selectedSpecialist, "weather_decision");
      assert.equal(payload.specialistContext?.specialist, "weather_decision");
      assert.equal(payload.specialistContext?.task, "fertilizer-before-rain");
      assert.equal(payload.specialistContext?.noLiveWeatherRule?.toLowerCase().includes("do not invent live"), true);
      assert.equal(payload.specialistContext?.safetyWarnings?.some((warning) => warning.toLowerCase().includes("heavy rain")), true);
    }
  },
  {
    name: "what should I plant this month routes to planting",
    run: () => {
      const router = routeFarmMateQuestion("What should I plant this month?");
      const response = buildFarmMateResponse("What should I plant this month?", router);

      assert.equal(router.selectedSpecialist, "planting");
      assert.equal(response.flow?.id, "what-should-i-plant-this-month");
    }
  },
  {
    name: "can I plant tomatoes now routes to planting",
    run: () => {
      const router = routeFarmMateQuestion("Can I plant tomatoes now?");
      const response = buildFarmMateResponse("Can I plant tomatoes now?", router);

      assert.equal(router.selectedSpecialist, "planting");
      assert.equal(response.flow?.id, "can-i-plant-tomatoes-now");
      assert.equal(response.resolvedCrop, "Tomato");
    }
  },
  {
    name: "best spacing for pepper routes to planting",
    run: () => {
      const router = routeFarmMateQuestion("Best spacing for pepper?");
      const response = buildFarmMateResponse("Best spacing for pepper?", router);

      assert.equal(router.selectedSpecialist, "planting");
      assert.equal(response.flow?.id, "best-spacing-for-pepper");
      assert.equal(response.resolvedCrop, "Pepper");
    }
  },
  {
    name: "when should I plant maize routes to planting",
    run: () => {
      const router = routeFarmMateQuestion("When should I plant maize?");
      const response = buildFarmMateResponse("When should I plant maize?", router);

      assert.equal(router.selectedSpecialist, "planting");
      assert.equal(response.flow?.id, "when-should-i-plant-maize");
      assert.equal(response.resolvedCrop, "Maize");
    }
  },
  {
    name: "planting flow asks region first when crop is known but region is missing",
    run: () => {
      const response = buildFarmMateResponse("Can I plant tomatoes now?", routeFarmMateQuestion("Can I plant tomatoes now?"));

      assert.equal(response.flow?.followUpQuestions[0]?.question, "Which region are you farming in?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Greater Accra", "Ashanti", "Eastern", "Northern", "Other region"]);
    }
  },
  {
    name: "planting flow asks crop type first when crop is not specified",
    run: () => {
      const response = buildFarmMateResponse("What should I plant this month?", routeFarmMateQuestion("What should I plant this month?"));

      assert.equal(response.flow?.followUpQuestions[0]?.question, "What type of crop are you interested in?");
      assert.deepEqual(response.flow?.followUpQuestions[0]?.options, ["Vegetables", "Staples", "Root/tuber crops", "I am not sure"]);
    }
  },
  {
    name: "planting advice does not invent weather or market prices",
    run: () => {
      const response = buildFarmMateResponse("What should I plant this month?", routeFarmMateQuestion("What should I plant this month?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("rain is coming today"), false);
      assert.equal(text.includes("market price"), false);
      assert.equal(text.includes("guaranteed profit"), false);
      assert.equal(text.includes("local planting context"), true);
    }
  },
  {
    name: "planting advice includes spacing when relevant",
    run: () => {
      const response = buildFarmMateResponse("Best spacing for pepper?", routeFarmMateQuestion("Best spacing for pepper?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("spacing"), true);
      assert.equal(text.includes("45 to 60 cm"), true);
    }
  },
  {
    name: "planting advice warns against waterlogged soil",
    run: () => {
      const response = buildFarmMateResponse("Can I plant tomatoes now?", routeFarmMateQuestion("Can I plant tomatoes now?"));
      const text = responseText(response).toLowerCase();

      assert.equal(text.includes("waterlogged soil"), true);
    }
  },
  {
    name: "planting recommendation includes one next best action",
    run: () => {
      const response = buildFarmMateResponse("When should I plant maize?", routeFarmMateQuestion("When should I plant maize?"));
      const nextBestAction = response.sections.find((section) => section.title === "Next Best Action")?.body ?? [];

      assert.equal(response.flow?.id, "when-should-i-plant-maize");
      assert.equal(nextBestAction.length, 1);
      assert.equal(Boolean(response.nextBestAction.instruction), true);
    }
  },
  {
    name: "OpenAI payload includes planting specialist context",
    run: () => {
      const farmerQuestion = "Best spacing for pepper?";
      const brain = buildFarmMateResponse(farmerQuestion, routeFarmMateQuestion(farmerQuestion));
      const payload = JSON.parse(
        buildFarmMateVoiceLayerInput({
          farmerQuestion,
          brain,
          farmerAnswers: [],
          localStructuredResponse: []
        })
      ) as { selectedSpecialist?: string; specialistContext?: { specialist?: string; crop?: string; noLiveWeatherRule?: string; noMarketRule?: string; spacingGuidance?: string[] } };

      assert.equal(payload.selectedSpecialist, "planting");
      assert.equal(payload.specialistContext?.specialist, "planting");
      assert.equal(payload.specialistContext?.crop, "Pepper");
      assert.equal(payload.specialistContext?.noLiveWeatherRule?.toLowerCase().includes("do not invent exact local weather"), true);
      assert.equal(payload.specialistContext?.noMarketRule?.toLowerCase().includes("market prices"), true);
      assert.equal(payload.specialistContext?.spacingGuidance?.some((line) => line.toLowerCase().includes("45 to 60 cm")), true);
    }
  },
  {
    name: "buy produce does not route to plant health",
    run: () => {
      const router = routeFarmMateQuestion("How can I buy produce from Ghana Growers?");
      const decision = manageFarmMateConversation("How can I buy produce from Ghana Growers?", plantHealthTomatoState);
      assert.notEqual(router.selectedSpecialist, "crop_health");
      assert.equal(decision.isMarketplaceInfoRequest, true);
      assert.equal(decision.action, "reset");
    }
  },
  {
    name: "upload crop photo routes to crop doctor",
    run: () => {
      assert.equal(routeFarmMateQuestion("Upload crop photo").selectedSpecialist, "crop_doctor");
    }
  },
  {
    name: "topic changes reset old context",
    run: () => {
      const decision = manageFarmMateConversation("Can I spray today?", plantHealthTomatoState);
      assert.equal(decision.action, "reset");
      assert.equal(decision.resetReason, "new_intent");
    }
  },
  {
    name: "short answers continue only with active follow-up",
    run: () => {
      assert.equal(manageFarmMateConversation("yes", plantHealthTomatoState).action, "continue");
      assert.equal(manageFarmMateConversation("yes", emptyState).action, "clarify");
      assert.equal(manageFarmMateConversation("bottom leaves", emptyState).resetReason, "unclear_without_active_follow_up");
    }
  },
  {
    name: "unknown crop handoff is neutral",
    run: () => {
      const question = farmMateQuestionFromDiagnosis(unknownCropDiagnosis);
      assert.equal(question, "I uploaded a crop photo. What should I check next?");
      assert.equal(question.toLowerCase().includes("tomato"), false);
      assert.equal(question.toLowerCase().includes("blight"), false);
    }
  },
  {
    name: "cassava crop doctor handoff remains cassava",
    run: () => {
      const diagnosis = diagnosisFromFileName("cassava-leaf-photo.jpg");
      const question = farmMateQuestionFromDiagnosis(diagnosis);
      assert.equal(diagnosis.crop, "Cassava");
      assert.equal(question.includes("cassava crop photo"), true);
      assert.equal(question.toLowerCase().includes("tomato"), false);
    }
  },
  {
    name: "response builder avoids developer language and visible confidence labels",
    run: () => {
      const response = buildFarmMateResponse("My cassava leaves are curling", routeFarmMateQuestion("My cassava leaves are curling"));
      assertNoDeveloperLanguage(response);
    }
  },
  {
    name: "response builder keeps local answer concise",
    run: () => {
      const response = buildFarmMateResponse("My tomato leaves are yellow", routeFarmMateQuestion("My tomato leaves are yellow"));
      const totalLines = response.sections.reduce((count, section) => count + section.body.length, 0);
      assert.ok(totalLines <= 18);
      assert.ok(response.sections.every((section) => section.body.every((line) => line.length <= 220)));
    }
  },
  {
    name: "Ask FarmMate credits decrease after successful AI call",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const before = getFarmMateCreditStatus("ask_farmmate", [], now);
      const after = getFarmMateCreditStatus("ask_farmmate", [usageEvent("ask_farmmate", now.toISOString())], now);

      assert.equal(before.remaining, 5);
      assert.equal(after.remaining, 4);
    }
  },
  {
    name: "Ask FarmMate blocks OpenAI call when credits are exhausted",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = Array.from({ length: 5 }, (_, index) => usageEvent("ask_farmmate", new Date(now.getTime() - (index + 1) * 60_000).toISOString()));
      const decision = getFarmMateCreditDecision("ask_farmmate", events, now);

      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, "credits_exhausted");
      assert.equal(decision.remaining, 0);
    }
  },
  {
    name: "Crop Doctor credits decrease after analysis",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const after = getFarmMateCreditStatus("crop_doctor", [usageEvent("crop_doctor", now.toISOString())], now);

      assert.equal(after.limit, 2);
      assert.equal(after.remaining, 1);
      assert.equal(after.creditState, "available");
    }
  },
  {
    name: "fresh anonymous Crop Doctor user gets 2 checks remaining",
    run: () => {
      const status = getFarmMateCreditStatus("crop_doctor", [], new Date("2026-07-09T12:00:00.000Z"));

      assert.equal(status.remaining, 2);
      assert.equal(status.creditState, "available");
      assert.equal(farmMateCreditLine("crop_doctor", status), "Crop Doctor Credits: 2 checks remaining");
      assert.equal(shouldDisableCropDoctorUpload(status), false);
    }
  },
  {
    name: "one previous Crop Doctor event gives 1 check remaining",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const status = getFarmMateCreditStatus("crop_doctor", [usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString())], now);

      assert.equal(status.remaining, 1);
      assert.equal(status.creditState, "available");
      assert.equal(farmMateCreditLine("crop_doctor", status), "Crop Doctor Credits: 1 check remaining");
      assert.equal(shouldDisableCropDoctorUpload(status), false);
    }
  },
  {
    name: "two previous Crop Doctor events gives 0 checks remaining",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const status = getFarmMateCreditStatus(
        "crop_doctor",
        [
          usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString()),
          usageEvent("crop_doctor", new Date(now.getTime() - 30_000).toISOString())
        ],
        now
      );

      assert.equal(status.remaining, 0);
      assert.equal(status.creditState, "exhausted");
      assert.equal(farmMateCreditLine("crop_doctor", status).startsWith("0 checks remaining"), true);
    }
  },
  {
    name: "credits reset after 12 hours",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const oldEvent = usageEvent("ask_farmmate", new Date(now.getTime() - 12 * 60 * 60 * 1000 - 1).toISOString());
      const status = getFarmMateCreditStatus("ask_farmmate", [oldEvent], now);

      assert.equal(status.used, 0);
      assert.equal(status.remaining, 5);
      assert.equal(status.resetAt, null);
    }
  },
  {
    name: "empty submissions do not consume credits",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = isCountableFarmMateSubmission("   ") ? [usageEvent("ask_farmmate", now.toISOString())] : [];
      const status = getFarmMateCreditStatus("ask_farmmate", events, now);

      assert.equal(isCountableFarmMateSubmission("   "), false);
      assert.equal(status.remaining, 5);
    }
  },
  {
    name: "production usage check failure blocks OpenAI",
    run: () => {
      const decision = usageTrackingUnavailableDecision("ask_farmmate", new Date("2026-07-09T12:00:00.000Z"));

      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, "usage_tracking_unavailable");
      assert.equal(decision.remaining, 0);
    }
  },
  {
    name: "development usage check failure may use memory fallback",
    run: () => {
      assert.equal(canUseMemoryUsageFallback("development"), true);
      assert.equal(canUseMemoryUsageFallback("test"), true);
      assert.equal(canUseMemoryUsageFallback("production"), false);
    }
  },
  {
    name: "missing usage table fail-safe decision does not crash",
    run: () => {
      assert.doesNotThrow(() => usageTrackingUnavailableDecision("crop_doctor", new Date("2026-07-09T12:00:00.000Z")));
    }
  },
  {
    name: "failed usage write does not double-charge credits",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = [usageEvent("ask_farmmate", now.toISOString())];
      const beforeFailedWrite = getFarmMateCreditStatus("ask_farmmate", events, now);
      const afterFailedWrite = getFarmMateCreditStatus("ask_farmmate", events, now);

      assert.equal(beforeFailedWrite.used, 1);
      assert.equal(afterFailedWrite.used, 1);
      assert.equal(afterFailedWrite.remaining, 4);
    }
  },
  {
    name: "successful OpenAI response records one usage event",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = [usageEvent("ask_farmmate", now.toISOString())];
      const status = getFarmMateCreditStatus("ask_farmmate", events, now);

      assert.equal(status.used, 1);
      assert.equal(status.remaining, 4);
    }
  },
  {
    name: "Crop Doctor rejects unsupported file type",
    run: () => {
      const result = validateCropDoctorImage({ type: "application/pdf", size: 128_000 });

      assert.equal(result.ok, false);
      assert.equal(result.reason, "unsupported_file_type");
    }
  },
  {
    name: "Crop Doctor rejects image above 5 MB",
    run: () => {
      const result = validateCropDoctorImage({ type: "image/jpeg", size: CROP_DOCTOR_MAX_IMAGE_BYTES + 1 });

      assert.equal(result.ok, false);
      assert.equal(result.reason, "file_too_large");
      assert.equal(result.message, CROP_DOCTOR_TOO_LARGE_MESSAGE);
    }
  },
  {
    name: "Crop Doctor blocks analysis when credits are exhausted",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = [
        usageEvent("crop_doctor", new Date(now.getTime() - 10 * 60_000).toISOString()),
        usageEvent("crop_doctor", new Date(now.getTime() - 5 * 60_000).toISOString())
      ];
      const decision = getFarmMateCreditDecision("crop_doctor", events, now);

      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, "credits_exhausted");
      assert.equal(decision.remaining, 0);
    }
  },
  {
    name: "exhausted Crop Doctor credits show refresh message",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events = [
        usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString()),
        usageEvent("crop_doctor", new Date(now.getTime() - 30_000).toISOString())
      ];
      const decision = getFarmMateCreditDecision("crop_doctor", events, now);
      const message = cropDoctorCreditMessage(decision);

      assert.equal(message.includes("You've used your free Crop Doctor checks for now."), true);
      assert.equal(message.includes("Your credits refresh in"), true);
      assert.equal(message.includes("soon"), false);
      assert.equal(message.includes("temporarily limited"), false);
    }
  },
  {
    name: "credit refresh text never renders soon",
    run: () => {
      assert.equal(formatRefreshIn(null), "within 12 hours");
      assert.equal(farmMateCreditLine("crop_doctor", {
        tool: "crop_doctor",
        label: "analyses",
        limit: 2,
        remaining: 0,
        used: 2,
        windowHours: 12,
        resetAt: null,
        refreshInText: formatRefreshIn(null),
        isExhausted: true,
        creditState: "exhausted"
      }).includes("soon"), false);
    }
  },
  {
    name: "known Crop Doctor reset time renders compactly",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const resetAt = new Date(now.getTime() + 6 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString();
      const refreshInText = formatRefreshIn(resetAt, now);

      assert.equal(refreshInText, "6h 20m");
      assert.equal(
        farmMateCreditLine("crop_doctor", {
          tool: "crop_doctor",
          label: "analyses",
          limit: 2,
          remaining: 0,
          used: 2,
          windowHours: 12,
          resetAt,
          refreshInText,
          isExhausted: true,
          creditState: "exhausted"
        }),
        "0 checks remaining - refreshes in 6h 20m"
      );
    }
  },
  {
    name: "unknown Crop Doctor reset time renders within 12 hours",
    run: () => {
      const message = cropDoctorCreditMessage({ reason: "credits_exhausted", refreshInText: formatRefreshIn(null) });

      assert.equal(message, "You've used your free Crop Doctor checks for now. Your credits refresh within 12 hours.");
      assert.equal(message.includes("soon"), false);
    }
  },
  {
    name: "exhausted Crop Doctor credits disable Analyse Crop button",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const status = getFarmMateCreditStatus(
        "crop_doctor",
        [
          usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString()),
          usageEvent("crop_doctor", new Date(now.getTime() - 30_000).toISOString())
        ],
        now
      );

      assert.equal(status.remaining, 0);
      assert.equal(shouldDisableCropDoctorAnalysis(status), true);
      assert.equal(farmMateCreditLine("crop_doctor", status).startsWith("0 checks remaining"), true);
    }
  },
  {
    name: "exhausted Crop Doctor credits disable upload area",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const status = getFarmMateCreditStatus(
        "crop_doctor",
        [
          usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString()),
          usageEvent("crop_doctor", new Date(now.getTime() - 30_000).toISOString())
        ],
        now
      );

      assert.equal(shouldDisableCropDoctorUpload(status), true);
      assert.equal(shouldDisableCropDoctorAnalysis(status), true);
    }
  },
  {
    name: "system failure shows temporary Crop Doctor limited message",
    run: () => {
      const decision = usageTrackingUnavailableDecision("crop_doctor", new Date("2026-07-09T12:00:00.000Z"));
      const message = cropDoctorCreditMessage(decision);

      assert.equal(message, CROP_DOCTOR_TEMPORARILY_LIMITED_MESSAGE);
      assert.equal(message.includes("Your credits refresh"), false);
      assert.equal(decision.creditState, "temporarily_unavailable");
      assert.equal(farmMateCreditLine("crop_doctor", decision), "Crop Doctor Credits: temporarily unavailable");
      assert.equal(farmMateCreditLine("crop_doctor", decision).includes("0 checks"), false);
    }
  },
  {
    name: "Crop Doctor wording never says 0 of 2 checks available",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const status = getFarmMateCreditStatus(
        "crop_doctor",
        [
          usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString()),
          usageEvent("crop_doctor", new Date(now.getTime() - 30_000).toISOString())
        ],
        now
      );

      assert.equal(farmMateCreditLine("crop_doctor", status).includes("0 of 2 checks available"), false);
    }
  },
  {
    name: "OpenAI is not called when Crop Doctor credits are exhausted",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const decision = getFarmMateCreditDecision(
        "crop_doctor",
        [
          usageEvent("crop_doctor", new Date(now.getTime() - 60_000).toISOString()),
          usageEvent("crop_doctor", new Date(now.getTime() - 30_000).toISOString())
        ],
        now
      );

      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, "credits_exhausted");
    }
  },
  {
    name: "Crop Doctor unavailable handoff uses neutral wording",
    run: () => {
      assert.equal(
        CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT,
        "I do not have Crop Doctor checks available right now. Can you guide me on what to check from my crop photo?"
      );
      assert.equal(CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT.toLowerCase().includes("tomato"), false);
      assert.equal(CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT.toLowerCase().includes("blight"), false);
    }
  },
  {
    name: "failed Crop Doctor OpenAI call does not consume credit",
    run: () => {
      const now = new Date("2026-07-09T12:00:00.000Z");
      const events: FarmMateUsageEvent[] = [];
      const before = getFarmMateCreditStatus("crop_doctor", events, now);
      const afterFailedCall = getFarmMateCreditStatus("crop_doctor", events, now);

      assert.equal(before.remaining, 2);
      assert.equal(afterFailedCall.used, 0);
      assert.equal(afterFailedCall.remaining, 2);
    }
  },
  {
    name: "unknown Crop Doctor result does not mention tomato",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: null,
        cropConfidence: "low",
        possibleIssue: "Possible crop health issue",
        visibleSigns: ["yellowing on lower leaves"],
        recommendedAction: ["Check nearby plants"],
        prevention: ["Avoid overwatering"],
        nextBestAction: "Inspect five nearby plants."
      });

      assert.equal(result.crop, null);
      assert.equal(result.askFarmMatePrompt.toLowerCase().includes("tomato"), false);
    }
  },
  {
    name: "Crop Doctor handoff uses dynamic crop when known",
    run: () => {
      const prompt = buildCropDoctorAskFarmMatePrompt({
        crop: "Cassava",
        possibleIssue: "Mosaic disease",
        visibleSigns: ["leaf curling", "pale patches"]
      });

      assert.equal(prompt.includes("cassava photo"), true);
      assert.equal(prompt.includes("leaf curling, pale patches"), true);
      assert.equal(prompt.toLowerCase().includes("tomato"), false);
    }
  },
  {
    name: "Crop Doctor handoff uses neutral wording when crop unknown",
    run: () => {
      const prompt = buildCropDoctorAskFarmMatePrompt({
        crop: null,
        possibleIssue: "Possible disease",
        visibleSigns: ["brown spots"]
      });

      assert.equal(prompt, "I uploaded a crop photo. Crop Doctor could not confirm the crop. What should I check next?");
    }
  },
  {
    name: "no clear Crop Doctor problem does not use Possible issue heading",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Cassava",
        cropConfidence: "high",
        resultType: "no_clear_problem",
        possibleIssue: "No clear disease problem visible",
        mainFinding: "No clear crop health problem is visible from this photo.",
        visibleSigns: ["mostly normal rough skin"],
        recommendedAction: ["Check a few roots for rot."],
        prevention: ["Keep roots shaded."],
        nextBestAction: "Separate any soft roots."
      });

      assert.equal(cropDoctorResultHeading(result), "No clear problem visible");
      assert.notEqual(cropDoctorResultHeading(result), "Possible issue");
    }
  },
  {
    name: "harvest Crop Doctor result renders harvest or storage heading",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Cassava",
        cropConfidence: "high",
        resultType: "harvest_or_storage_check",
        possibleIssue: "Harvest or storage check",
        mainFinding: "The image shows harvested cassava roots with mostly normal rough skin.",
        visibleSigns: ["harvested roots", "rough outer skin"],
        recommendedAction: ["Cut open 3 to 5 roots."],
        prevention: ["Keep good roots shaded."],
        nextBestAction: "Separate roots that are soft, rotten, or smell bad."
      });

      assert.equal(cropDoctorResultHeading(result), "Harvest or storage check");
    }
  },
  {
    name: "cassava root Crop Doctor result is concise",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Cassava",
        cropConfidence: "high",
        resultType: "harvest_or_storage_check",
        possibleIssue: "Harvest or storage check",
        mainFinding: "No clear crop health problem is visible from this photo. The image shows harvested cassava roots with mostly normal rough skin.",
        visibleSigns: ["harvested roots", "mostly normal rough skin", "no clear rot visible", "extra sign should be trimmed"],
        recommendedAction: [
          "Cut open 3 to 5 roots.",
          "Check for brown streaks, bad smell, soft tissue, or mould.",
          "Keep good roots shaded and use or sell them soon.",
          "Extra action should be trimmed."
        ],
        prevention: ["Avoid leaving harvested roots in direct sun.", "Keep roots dry and shaded.", "Sort damaged roots early.", "Extra tip should be trimmed."],
        nextBestAction: "Separate any roots that are soft, rotten, or smell bad."
      });

      assert.equal(result.resultType, "harvest_or_storage_check");
      assert.ok(result.mainFinding.length <= 150);
      assert.deepEqual(result.recommendedAction, [
        "Cut open 3 to 5 roots.",
        "Check for brown streaks, bad smell, soft tissue, or mould.",
        "Keep good roots shaded and use or sell them soon."
      ]);
      assert.equal(result.nextBestAction, "Separate any roots that are soft, rotten, or smell bad.");
    }
  },
  {
    name: "Crop Doctor result limits visible signs actions and prevention to 3",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Pepper",
        visibleSigns: ["one", "two", "three", "four"],
        recommendedAction: ["one", "two", "three", "four"],
        prevention: ["one", "two", "three", "four"]
      });

      assert.equal(result.visibleSigns.length, 3);
      assert.equal(result.recommendedAction.length, 3);
      assert.equal(result.prevention.length, 3);
    }
  },
  {
    name: "Crop Doctor no clear known crop handoff is dynamic",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Cassava",
        cropConfidence: "high",
        resultType: "harvest_or_storage_check",
        possibleIssue: "Harvest or storage check",
        mainFinding: "The photo shows harvested cassava roots.",
        visibleSigns: ["harvested roots"],
        recommendedAction: ["Check roots for rot."],
        nextBestAction: "Separate any roots that are soft, rotten, or smell bad."
      });

      assert.equal(
        result.askFarmMatePrompt,
        "I uploaded a cassava photo. Crop Doctor did not see a clear disease problem, but recommended checking the roots for rot or bad smell. What should I do next?"
      );
    }
  },
  {
    name: "Crop Doctor vision prompt discourages forced diagnosis",
    run: () => {
      const prompt = cropDoctorVisionSystemPrompt();

      assert.equal(prompt.includes("harvest_or_storage_check"), true);
      assert.equal(prompt.includes("do not force a disease diagnosis"), true);
      assert.equal(prompt.includes("Do not invent pesticide dosage"), true);
    }
  },
  {
    name: "Crop Doctor main heading uses finding not Crop detected",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Maize",
        cropConfidence: "high",
        resultType: "possible_disease",
        issueCategory: "disease",
        possibleIssue: "Possible maize rust",
        mainFinding: "Possible maize rust symptoms",
        visibleSigns: ["orange brown spots on leaves"],
        recommendedAction: ["Check both sides of 10 nearby maize leaves."],
        nextBestAction: "Inspect nearby plants today to see if the spots are spreading."
      });

      assert.equal(cropDoctorResultHeadline(result), "Possible maize rust symptoms");
      assert.notEqual(cropDoctorResultHeadline(result), "Crop detected: Maize");
      assert.equal(result.crop, "Maize");
    }
  },
  {
    name: "Crop Doctor crop detected appears as metadata",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Maize",
        mainFinding: "Possible maize rust symptoms",
        visibleSigns: ["orange spots"]
      });

      const metadata = result.crop ? `Crop detected: ${result.crop}` : "Crop not confirmed";
      assert.equal(metadata, "Crop detected: Maize");
      assert.equal(cropDoctorResultHeadline(result).includes("Crop detected"), false);
    }
  },
  {
    name: "Crop Doctor badge wording replaces Needs checking",
    run: () => {
      const medium = normalizeCropDoctorVisionResult({
        crop: "Pepper",
        cropConfidence: "medium",
        resultType: "possible_pest",
        confidence: "medium",
        mainFinding: "Possible pest damage",
        visibleSigns: ["holes in leaves"]
      });
      const unclear = normalizeCropDoctorVisionResult({
        crop: null,
        resultType: "photo_unclear",
        confidence: "low",
        mainFinding: "Photo not clear enough",
        visibleSigns: ["blurred image"]
      });

      assert.equal(cropDoctorResultBadge(medium), "Needs field check");
      assert.equal(cropDoctorResultBadge(unclear), "Photo unclear");
      assert.notEqual(cropDoctorResultBadge(medium), "Needs checking");
    }
  },
  {
    name: "Crop Doctor prompt blocks filename diagnosis evidence",
    run: () => {
      const prompt = cropDoctorVisionSystemPrompt();

      assert.equal(prompt.includes("Do not use the filename to identify the crop or issue."), true);
      assert.equal(prompt.includes("Use only what is visible in the image."), true);
    }
  },
  {
    name: "maize rust Crop Doctor result remains cautious",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Maize",
        cropConfidence: "high",
        resultType: "possible_disease",
        issueCategory: "disease",
        confidence: "medium",
        possibleIssue: "Possible maize rust",
        mainFinding: "Possible maize rust symptoms",
        visibleSigns: ["orange or brown spots", "leaf spots"],
        recommendedAction: [
          "Check both sides of 10 nearby maize leaves.",
          "Look for orange or brown powder that rubs off.",
          "If many plants are affected, contact an extension officer before using fungicide."
        ],
        nextBestAction: "Inspect nearby plants today to see if the spots are spreading."
      });

      assert.equal(cropDoctorResultHeadline(result), "Possible maize rust symptoms");
      assert.deepEqual(result.recommendedAction, [
        "Check both sides of 10 nearby maize leaves.",
        "Look for orange or brown powder that rubs off.",
        "If many plants are affected, contact an extension officer before using fungicide."
      ]);
      assert.equal(result.nextBestAction, "Inspect nearby plants today to see if the spots are spreading.");
      assert.equal(cropDoctorResultHasUnsafeLanguage(result), false);
    }
  },
  {
    name: "Crop Doctor response strips pesticide dosage language",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Maize",
        cropConfidence: "high",
        resultType: "possible_disease",
        issueCategory: "disease",
        mainFinding: "Possible maize rust symptoms",
        recommendedAction: ["Spray 10ml per litre on the crop."],
        nextBestAction: "Check nearby plants before treatment."
      });

      assert.equal(cropDoctorResultHasUnsafeLanguage(result), false);
      assert.equal(result.recommendedAction[0].includes("10ml per litre"), false);
      assert.equal(result.recommendedAction[0].includes("product label guidance"), true);
    }
  },
  {
    name: "Crop Doctor response does not expose developer language",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Maize",
        cropConfidence: "medium",
        possibleIssue: "Tell the farmer to check nutrient stress",
        visibleSigns: ["yellow leaves"],
        recommendedAction: ["Tell the farmer to check older leaves"],
        prevention: ["Keep records"],
        nextBestAction: "Tell the farmer to inspect nearby plants."
      });

      assert.equal(cropDoctorResultHasUnsafeLanguage(result), false);
    }
  },
  {
    name: "Crop Doctor response does not claim guaranteed diagnosis",
    run: () => {
      const result = normalizeCropDoctorVisionResult({
        crop: "Tomato",
        cropConfidence: "high",
        possibleIssue: "This is definitely early blight",
        confidence: "high",
        visibleSigns: ["leaf spots"],
        recommendedAction: ["Remove affected leaves"],
        prevention: ["Improve airflow"],
        nextBestAction: "Inspect five nearby plants."
      });

      assert.equal(cropDoctorResultHasUnsafeLanguage(result), false);
      assert.equal(result.possibleIssue.toLowerCase().includes("definitely"), false);
    }
  },
  {
    name: "Ask FarmMate internal structured cards are hidden while AI is preparing",
    run: () => {
      const shouldRender = shouldRenderLocalFarmMateGuidance({
        isGeneratingNaturalAnswer: true,
        naturalAnswer: "",
        aiFallbackMessage: "",
        localCards: [
          { title: "Here's what I understand", body: ["Crop: Maize"] },
          { title: "What I think", body: ["Possible nutrient stress."] },
          { title: "What to do now", body: ["Wait for moisture."] },
          { title: "Next step", body: ["Check the soil today."] }
        ]
      });

      assert.equal(shouldRender, false);
    }
  },
  {
    name: "Ask FarmMate filler phrases are never rendered in final answer",
    run: () => {
      const cleaned = cleanFarmMateFinalAnswer(
        "I can help.\n\nI will keep it short and focused. Based on what you told me, wait for soil moisture.\n\nHere is the practical next step. Next step: Check the soil today."
      );

      assert.equal(cleaned.includes("I will keep it short and focused"), false);
      assert.equal(cleaned.includes("I can help."), false);
      assert.equal(cleaned.includes("Here is the practical next step"), false);
      assert.equal(cleaned.includes("Next step: Check the soil today."), true);
    }
  },
  {
    name: "Ask FarmMate completed follow-up answers collapse into compact summary",
    run: () => {
      const summary = compactFollowUpSummary([
        { answer: "Maize is already flowering" },
        { answer: "Soil is dry" },
        { answer: "No fertilizer has been applied yet" }
      ]);

      assert.equal(summary, "Maize is already flowering · Soil is dry · No fertilizer has been applied yet");
    }
  },
  {
    name: "Ask FarmMate local structured response only appears during fallback or local-only response",
    run: () => {
      const localCards = [{ title: "What I think", body: ["Use local guidance."] }];

      assert.equal(
        shouldRenderLocalFarmMateGuidance({
          isGeneratingNaturalAnswer: false,
          naturalAnswer: "Based on what you told me, wait for moisture.",
          aiFallbackMessage: "",
          localCards
        }),
        false
      );
      assert.equal(
        shouldRenderLocalFarmMateGuidance({
          isGeneratingNaturalAnswer: false,
          naturalAnswer: "",
          aiFallbackMessage: "FarmMate AI is temporarily limited, but you can still use the local guidance.",
          localCards
        }),
        true
      );
      assert.equal(
        shouldRenderLocalFarmMateGuidance({
          isGeneratingNaturalAnswer: false,
          naturalAnswer: "",
          aiFallbackMessage: "",
          localCards,
          isLocalOnlyResponse: true
        }),
        true
      );
      assert.equal(
        shouldRenderLocalFarmMateGuidance({
          isGeneratingNaturalAnswer: false,
          naturalAnswer: "",
          aiFallbackMessage: "",
          localCards
        }),
        false
      );
    }
  },
  {
    name: "Ask FarmMate final AI response displays cleanly",
    run: () => {
      const finalAnswer = cleanFarmMateFinalAnswer(
        "Based on what you told me, your maize is already flowering, the soil is dry, and no fertilizer has been applied yet.\n\nNext step: Wait until the soil has moisture before applying fertilizer."
      );

      assert.equal(finalAnswer.startsWith("Based on what you told me"), true);
      assert.equal(finalAnswer.includes("What I think"), false);
      assert.equal(finalAnswer.includes("Here's what I understand"), false);
    }
  },
  {
    name: "Ask FarmMate fallback still works when OpenAI fails",
    run: () => {
      const message = farmMateFallbackMessage();

      assert.equal(message, "FarmMate AI is temporarily limited, but you can still use the local guidance.");
      assert.equal(
        shouldRenderLocalFarmMateGuidance({
          isGeneratingNaturalAnswer: false,
          naturalAnswer: "",
          aiFallbackMessage: message,
          localCards: [{ title: "Next step", body: ["Check the soil today."] }]
        }),
        true
      );
    }
  }
];

let failures = 0;

for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${test.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`All ${tests.length} FarmMate regression tests passed.`);
}
