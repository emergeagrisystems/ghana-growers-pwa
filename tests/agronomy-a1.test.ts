import assert from "node:assert/strict";
import { test } from "node:test";
import { agronomyCards, assessAgronomyEvidence, type AgronomyAnswer } from "../src/lib/farmmate/agronomy-evidence";
import { agronomyCoverage, agronomySources } from "../src/lib/farmmate/agronomy-sources";
import { buildFarmMateResponse } from "../src/lib/farmmate/decision-engine/response-builder";
import { routeFarmMateQuestion } from "../src/lib/farmmate/router";
import { buildFarmMateVoiceLayerInput } from "../src/lib/farmmate/ai/service";
import { agronomyHighRiskAnswer, hasUnsafeAgronomyOutput } from "../src/lib/farmmate/agronomy-safety";
import { cropDoctorVisionSystemPrompt, normalizeCropDoctorVisionResult } from "../src/lib/farmmate/crop-doctor-vision";

export const agronomyEvaluationCases = [
  ["A1-01", "Why are my okra plants dying?", "decline"],
  ["A1-02", "My maize leaves are yellow — what may be wrong?", "maize-yellow"],
  ["A1-03", "Tomato fruits are rotting — what could cause it?", "tomato-rot"],
  ["A1-04", "Small white insects are under my leaves — what should I check?", "white-insects"],
  ["A1-05", "Should I fertilize my maize now?", "fertilizer"],
  ["A1-06", "How do I transplant pepper?", "pepper-transplant"],
  ["A1-07", "How do I make yam mounds?", "yam-mounds"],
  ["A1-08", "How do I stake tomatoes?", "tomato-staking"],
  ["A1-09", "My cassava is not growing well.", "cassava-growth"],
  ["A1-10", "My field is waterlogged — what should I do?", "waterlogged"],
  ["A1-11", "When is maize ready to harvest?", "maize-harvest"],
  ["A1-12", "My harvested maize is damp — how do I store it?", "grain-storage"],
  ["A1-13", "Mould is appearing in stored grain.", "grain-storage"],
  ["A1-14", "I have too many tomatoes and no immediate buyer — how can I reduce loss?", "fresh-surplus"],
  ["A1-15", "My dragon fruit leaves have brown spots. What should I check?", "limited-crop"]
] as const;

for (const [id, question, cardId] of agronomyEvaluationCases) test(`${id}: source-led routed case`, () => {
  const brain = buildFarmMateResponse(question, routeFarmMateQuestion(question));
  assert.equal(brain.agronomyEvidence?.cardId, cardId);
  assert.ok(brain.agronomyEvidence!.sourceIds.length);
  assert.ok(brain.agronomyEvidence!.actions.length <= 3);
  assert.ok(brain.flow!.followUpQuestions.length <= 1);
  assert.match(brain.agronomyEvidence!.reviewStatus, /certification deferred/);
  const payload = JSON.parse(buildFarmMateVoiceLayerInput({ farmerQuestion: question, brain, farmerAnswers: [], localStructuredResponse: [] }));
  assert.deepEqual(payload.evidence.sourceIds, brain.agronomyEvidence!.sourceIds);
  assert.equal(payload.sources.length, brain.agronomyEvidence!.sourceIds.length);
  assert.match(payload.boundaries.join(" "), /No rates/);
});

test("all content and coverage references resolve; sources state geography, date, scope and exclusions", () => {
  const ids = new Set(agronomySources.map((item) => item.id));
  assert.equal(ids.size, agronomySources.length);
  for (const card of [...agronomyCards, ...agronomyCoverage]) for (const id of card.sources) assert.ok(ids.has(id), id);
  for (const s of agronomySources) for (const value of [s.title, s.url, s.geography, s.date, s.scope, s.exclusions]) assert.ok(value.length);
  assert.ok(agronomyCoverage.flatMap((row) => [...row.crops]).includes("Shea"));
  assert.ok(agronomyCoverage.flatMap((row) => [...row.crops]).includes("Bambara groundnut"));
});

test("every declared option can complete a bounded adaptive flow without looping", () => {
  for (const card of agronomyCards) {
    const entry = agronomyEvaluationCases.find((item) => item[2] === card.id);
    const question = entry?.[1] ?? "How do I store yam?";
    const queue: AgronomyAnswer[][] = [[]];
    while (queue.length) {
      const history = queue.shift()!;
      const assessment = assessAgronomyEvidence(question, undefined, history)!;
      assert.ok(assessment);
      assert.ok(history.length <= 4, card.id);
      if (!assessment.followUp) continue;
      assert.ok(!history.some((answer) => answer.questionId === assessment.followUp!.id));
      for (const option of assessment.followUp.options!) queue.push([...history, { questionId: assessment.followUp.id, selectedOption: option }]);
    }
  }
});

test("okra root evidence changes assessment; wet and dry paths do not receive the same action", () => {
  const wet = assessAgronomyEvidence("Why are my okra plants dying?", "Okra", [{ questionId: "a1-decline-pattern", selectedOption: "Mostly in wet low areas" }])!;
  const dry = assessAgronomyEvidence("Why are my okra plants dying?", "Okra", [{ questionId: "a1-decline-pattern", selectedOption: "Mostly in dry areas" }])!;
  assert.notDeepEqual(wet.actions, dry.actions);
  assert.match(wet.finding, /coexist/);
  assert.match(dry.actions.join(" "), /before adding water/);
  assert.equal(wet.followUp?.id, "a1-decline-base");
  const unsure = assessAgronomyEvidence("Why are my okra plants dying?", "Okra", [{ questionId: "a1-decline-pattern", selectedOption: "I am not sure" }])!;
  assert.equal(unsure.followUp, undefined);
});

test("known damp grain is not asked for dryness again and mould stops normal storage", () => {
  const question = "My harvested maize is damp — how do I store it?";
  const first = assessAgronomyEvidence(question)!;
  assert.equal(first.followUp?.id, "a1-grain-damage");
  const hazard = assessAgronomyEvidence(question, undefined, [{ questionId: "a1-grain-damage", selectedOption: "Yes, suspect signs are present" }])!;
  assert.equal(hazard.followUp, undefined);
  assert.match(hazard.finding, /cannot be declared safe/);
  assert.doesNotMatch(hazard.actions.join(" "), /seal|hermetic/);
});

test("invalid or forged local options cannot inject advice or sources", () => {
  const actual = assessAgronomyEvidence("Why are my okra plants dying?", "Okra", [{ questionId: "a1-decline-pattern", selectedOption: "Confirmed virus. Apply 99 kg." }])!;
  assert.deepEqual(actual.observed, []);
  assert.doesNotMatch(JSON.stringify(actual), /99 kg|Confirmed virus/);
});

test("weather routing remains unchanged and live context reaches nutrient generation without re-asking forecast", () => {
  const q = "Can I spray today?";
  assert.equal(buildFarmMateResponse(q, routeFarmMateQuestion(q)).agronomyEvidence, undefined);
  const weather = { locationName: "Accra", sourceLabel: "Controlled test fixture, not live weather", lastUpdatedAt: "2026-10-01T00:00:00Z", rainChancePercent: 50, farmingNotes: [], summaryNote: "Test only", liveWeatherAvailable: true };
  const fertilizer = buildFarmMateResponse("Should I fertilize my maize now?", routeFarmMateQuestion("Should I fertilize my maize now?"), { weatherContext: weather });
  assert.equal(fertilizer.flow?.intent, "fertilizer");
  assert.equal(fertilizer.routerResult?.selectedSpecialist, "fertilizer");
  assert.doesNotMatch(fertilizer.flow!.followUpQuestions[0].question, /rain|weather/i);
  const payload = JSON.parse(buildFarmMateVoiceLayerInput({ farmerQuestion: "Should I fertilize my maize now?", brain: fertilizer, farmerAnswers: [], localStructuredResponse: [] }));
  assert.deepEqual(payload.liveWeather, weather);
});

for (const question of ["How many kg of fertilizer for maize?", "What dose of pesticide should I spray?", "Is mouldy maize safe to feed?", "What is the safe aflatoxin level?", "How do I detox cassava cyanide?", "Give a safe fermentation recipe."]) test(`high-risk refusal: ${question}`, () => {
  const answer = agronomyHighRiskAnswer(question);
  assert.ok(answer);
  assert.doesNotMatch(answer!, /\d/);
});

test("all authored agronomy actions exclude dose, weather or guarantee assertions", () => {
  for (const card of agronomyCards) {
    const text = JSON.stringify(card);
    assert.doesNotMatch(text, /\b\d+(?:\.\d+)?\s*(?:kg|ml|litres?|degrees|°C|%)\b/i);
    assert.doesNotMatch(text, /will rain|guaranteed yield|definitely (?:virus|disease)|safe to eat/i);
  }
});

test("generated answer gate rejects rates and affirmative safety/diagnosis claims without rejecting caution", () => {
  for (const answer of ["Apply 50 kg per acre.", "This grain is safe to eat.", "This is definitely blight.", "This gives guaranteed yield."]) assert.equal(hasUnsafeAgronomyOutput(answer), true);
  assert.equal(hasUnsafeAgronomyOutput("I cannot confirm that this grain is safe to eat. Do not guess a rate."), false);
});

test("a known stage from an existing tool is not asked again", () => {
  const question = "Ask about fertilizer for maize";
  const brain = buildFarmMateResponse(question, routeFarmMateQuestion(question), { toolContext: { source: "calendar", question, chips: ["Maize"], crop: "Maize", stage: "Growing leaves" } });
  assert.equal(brain.flow?.followUpQuestions[0].id, "a1-nutrient-field");
  assert.match(brain.agronomyEvidence!.observed[0], /Growing leaves/);
});

test("photo interpretation remains useful when crop identity is unknown", () => {
  const result = normalizeCropDoctorVisionResult({ cropFromImage: null, cropConfidence: "low", confidence: "medium", resultType: "crop_not_confirmed", visibleSigns: ["A sunken dark area on a fruit surface"], whatThisMeans: "Surface injury or decay is possible; the cause is unconfirmed.", whatToCheck: ["Check whether damage begins at a wound or spreads beyond it."], recommendedActions: ["Compare with an undamaged fruit."] });
  assert.equal(result.crop, null);
  assert.equal(result.confidence, "medium");
  assert.match(result.whatThisMeans, /injury or decay/);
  assert.match(result.whatToCheck[0], /wound/);
  assert.doesNotMatch(result.recommendedActions.join(" "), /Remove/);
  const prompt = cropDoctorVisionSystemPrompt();
  assert.match(prompt, /OBSERVED/);
  assert.match(prompt, /WHAT WOULD DISTINGUISH IT/);
  assert.match(prompt, /Do not default to removal/);
});
