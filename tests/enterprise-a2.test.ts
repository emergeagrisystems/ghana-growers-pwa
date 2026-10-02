import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import bank from "../data/farmmate/farmer-question-bank.json";
import { recognizeFarmEnterprise, farmEnterpriseTopics } from "../src/lib/farmmate/enterprise-topics";
import { assessFarmEnterpriseQuestion, bsfKnowledgeCards } from "../src/lib/farmmate/enterprise-knowledge";
import { enterpriseSources, farmMateKnowledgeSource } from "../src/lib/farmmate/enterprise-sources";
import { enterpriseHighRiskAnswer, hasUnsafeEnterpriseOutput } from "../src/lib/farmmate/enterprise-safety";
import { agronomySources, agronomySource, AGRONOMY_REVIEW } from "../src/lib/farmmate/agronomy-sources";
import { routeFarmMateQuestion } from "../src/lib/farmmate/router";
import { buildFarmMateResponse } from "../src/lib/farmmate/decision-engine/response-builder";
import { manageFarmMateConversation } from "../src/lib/farmmate/conversation-manager";
import { buildFarmMateVoiceLayerInput, generateFarmMateNaturalAnswer, isLikelyIncompleteFarmMateAnswer } from "../src/lib/farmmate/ai/service";
import { displayedAnswerSections } from "../src/lib/farmmate/answer-presentation";
import { cleanFarmMateFinalAnswer } from "../src/lib/farmmate/conversation-ui";
import { isFarmEnterpriseAssessment } from "../src/lib/farmmate/enterprise-knowledge";
import { agronomyHighRiskAnswer } from "../src/lib/farmmate/agronomy-safety";
import { explicitChemicalSafetyAnswer } from "../src/lib/farmmate/chemical-safety";
import type { FarmMateAiInput } from "../src/lib/farmmate/ai/types";

function input(question: string): FarmMateAiInput {
  return { farmerQuestion: question, brain: buildFarmMateResponse(question, routeFarmMateQuestion(question)), farmerAnswers: [], localStructuredResponse: [] };
}
function authoredAnswer(question: string) {
  const a = input(question).brain.agronomyEvidence!;
  return `What I think: ${a.finding} ${a.why}\nWhat to do now:\n${a.actions.map((s, i) => `${i + 1}. ${s}`).join("\n")}\nNext step: ${a.next}`;
}

for (const record of bank.records) test(`${record.id}: ${record.origin} — scoped enterprise route and bounded response`, () => {
  const topic = recognizeFarmEnterprise(record.question);
  assert.equal(topic?.id, record.enterprise);
  const data = input(record.question);
  assert.equal(data.brain.routerResult?.selectedSpecialist, "farm_enterprises");
  assert.equal(data.brain.agronomyEvidence?.topic, "Farm Enterprises & Diversification");
  assert.equal(data.brain.shouldShowCropDoctorAction, false);
  const conversation = manageFarmMateConversation(record.question, { waitingForFollowUp: false, turns: [] });
  assert.equal(conversation.isMarketplaceInfoRequest, false);
  assert.equal(conversation.specialist, "farm_enterprises");
  const refusal = enterpriseHighRiskAnswer(record.question);
  if (record.coverage === "deterministic safety boundary") {
    assert.ok(refusal);
    assert.match(refusal, /No Ask credit was used/);
    assert.doesNotMatch(refusal, /\d+(?:\.\d+)?\s*%/);
  } else {
    assert.equal(refusal, null);
    const a = data.brain.agronomyEvidence!;
    assert.ok(a.actions.length <= 3);
    assert.ok(authoredAnswer(record.question).split(/\s+/).length <= 220);
    assert.equal(hasUnsafeEnterpriseOutput(authoredAnswer(record.question)), false);
    assert.ok(a.sourceIds.every(id => enterpriseSources.some(s => s.id === id)));
    assert.equal(a.reviewStatus, AGRONOMY_REVIEW);
    const payload = JSON.parse(buildFarmMateVoiceLayerInput(data));
    assert.equal(payload.crop, null);
    assert.deepEqual(payload.evidence.sourceIds, a.sourceIds);
    assert.match(payload.instruction, /Do not add facts/);
    if (record.enterprise !== "bsf") assert.match(a.finding, /do not yet have a deep Ghana-specific pack/);
  }
});

test("question bank contains exactly one real anonymised question and no identifying fields", () => {
  assert.equal(bank.records.filter(r => r.origin === "REAL FARMER QUESTION — ANONYMISED").length, 1);
  assert.equal(bank.records[0].question, "Please any information about BSF farming in Ghana");
  assert.equal(new Set(bank.records.map(r => r.id)).size, bank.records.length);
  assert.equal(bank.records.slice(1).every(r => r.origin === "SYNTHETIC EVALUATION QUESTION"), true);
  for (const r of bank.records) {
    assert.deepEqual(Object.keys(r).sort(), ["id", "origin", "question", "topic", "enterprise", "intent", "coverage", "coverageQuality", "sourceRequirement", "safetyLevel", "priority", "evaluationStatus"].sort());
  }
});
test("only BSF has a deep pack; all substantive cards resolve provenance", () => {
  assert.deepEqual(farmEnterpriseTopics.filter(t => t.deepPack).map(t => t.id), ["bsf"]);
  assert.equal(bsfKnowledgeCards.length, 11);
  for (const card of bsfKnowledgeCards) {
    assert.ok(card.actions.length <= 3 && card.next && card.detail.length);
    const text = `${card.finding} ${card.why} ${card.actions.join(" ")} ${card.next}`;
    assert.ok(text.split(/\s+/).length <= 220);
    assert.equal(hasUnsafeEnterpriseOutput(text), false, card.id);
    for (const id of card.sourceIds) assert.ok(enterpriseSources.some(s => s.id === id));
  }
  for (const s of enterpriseSources) {
    assert.ok(s.checkedOn && s.date && s.geography && s.evidenceStrength && s.scope && s.exclusions && s.sections);
    assert.match(s.url, /^https:\/\//);
  }
  for (const s of agronomySources) assert.deepEqual(farmMateKnowledgeSource(s.id), agronomySource(s.id));
});
test("BSF aliases route without catching ordinary crop pests or established A1 field tasks", () => {
  for (const q of ["BSF", "BSFL", "black-soldier-fly farming", "black soldier fly larvae", "insect farming for feed", "larvae production", "BSF frass", "Hermetia illucens rearing"]) assert.equal(recognizeFarmEnterprise(q)?.id, "bsf");
  assert.match(assessFarmEnterpriseQuestion("Tell me about larvae production")!.detail.join(" "), /not every insect/);
  for (const q of ["Small white insects are under my leaves", "Larvae are feeding on my maize", "Snails are eating cabbage", "How do I make compost for tomatoes?", "How do I transplant pepper seedlings?", "Should I irrigate maize today?", "How do I stake tomatoes?", "My okra plants are dying"]) assert.equal(recognizeFarmEnterprise(q), undefined, q);
});
test("real enquiry offers purpose once; declared choices adapt within the signed consultation shape", () => {
  const question = bank.records[0].question;
  const initial = assessFarmEnterpriseQuestion(question)!;
  assert.equal(initial.followUp?.id, "a2-bsf-purpose");
  assert.match(initial.displayTitle!, /used in Ghana/);
  assert.match(initial.why, /larvae.*animal-feed.*frass/);
  for (const [selectedOption, card] of [["Feed for my own farm", "feed"], ["Commercial larvae / feed ingredient", "business"], ["Frass / soil input", "frass"], ["Waste-conversion enterprise", "business"]]) {
    const a = assessFarmEnterpriseQuestion(question, [{questionId: "a2-bsf-purpose", selectedOption}])!;
    assert.equal(a.followUp, undefined);
    assert.equal(a.cardId, `enterprise-bsf-${card}`);
    assert.match(a.next, /Which region/);
  }
  assert.equal(assessFarmEnterpriseQuestion(question, [{questionId:"a2-bsf-purpose", selectedOption:"Use sewage without tests"}])!.followUp?.id, "a2-bsf-purpose");
});
test("Kumasi is retained only as farmer-stated context, not invented local advice", () => {
  const a = assessFarmEnterpriseQuestion(bank.records.find(r => r.id === "A2-S09")!.question, [{questionId:"a2-bsf-purpose",selectedOption:"Commercial larvae / feed ingredient"}])!;
  assert.ok(a.observed.includes("Farmer-stated place: Kumasi"));
  assert.doesNotMatch(a.next, /Which region/);
  assert.doesNotMatch(JSON.stringify(a.actions), /Kumasi supplier|Kumasi buyer|guaranteed/);
});
test("supported BSF production topics have distinct source bundles and practical next steps", () => {
  const examples = [
    ["What is the BSF production cycle?", "cycle"], ["What equipment do I need to start BSF?", "setup"],
    ["How do I harvest BSF larvae?", "harvest"], ["How do I process BSF larvae for feed?", "processing"],
    ["Can I use BSF larvae for fish?", "feed"], ["Can I use BSF for pigs?", "feed"],
    ["Where can I learn more about BSF in Ghana?", "training"], ["How much does a BSF farm cost?", "business"]
  ];
  for (const [q, id] of examples) {
    assert.equal(assessFarmEnterpriseQuestion(q)?.cardId, `enterprise-bsf-${id}`);
    assert.equal(enterpriseHighRiskAnswer(q), null);
  }
});
test("Ghana standard is exact, catalogue scope is limited, and no approval is inferred", () => {
  const a = assessFarmEnterpriseQuestion("What standard applies to dried insect feed products?")!;
  assert.match(a.finding, /GS 1382/);
  assert.match(a.why, /does not mean.*automatically approved/);
  assert.match(a.detail.join(" "), /full standard was not reviewed/);
  assert.doesNotMatch(JSON.stringify(a), /GS 1389|GS 2711|GS 1297/);
});
test("unsafe substrates, recipes and certification claims cannot become generated prescriptions", () => {
  for (const q of ["Can I use sewage for BSF?", "Can I feed BSF chicken manure?", "What percentage of BSF goes in pig feed?", "How much BSF frass per hectare?", "Can BSF be nutritionally complete feed?", "How do I sterilize BSF larvae?"]) assert.ok(enterpriseHighRiskAnswer(q), q);
  for (const a of ["Add 15% BSF meal to feed.", "Feed ten percent BSF meal.", "BSF is nutritionally complete.", "Use any waste.", "Feed larvae sewage.", "This guarantees profit.", "Profit is guaranteed.", "It is approved in Ghana.", "No permits required.", "Drying kills all pathogens.", "Do not worry, but feed larvae sewage."]) assert.equal(hasUnsafeEnterpriseOutput(a), true, a);
  for (const a of ["Do not assume a batch is safe to feed.", "No profit is guaranteed.", "GSA lists GS 1382; confirm the current requirements.", "Research results are not feeding prescriptions."]) assert.equal(hasUnsafeEnterpriseOutput(a), false, a);
});
test("new A2 refusals precede quota reservation without touching its implementation", () => {
  const api = readFileSync("src/app/api/farmmate/ask/route.ts", "utf8");
  const body = api.slice(api.indexOf("async function processConsultation"));
  assert.ok(body.indexOf("enterpriseHighRiskAnswer(payload.originalQuestion)") < body.indexOf("reserveFarmMateAsk({"));
  assert.match(body, /answer: chemicalSafetyAnswer, usageRecorded: false/);
  const ui = readFileSync("src/components/AskFarmMate.tsx", "utf8");
  assert.match(ui, /safetyAnswerIsLocal = Boolean\(explicitChemicalSafetyAnswer\(question\) \?\? enterpriseHighRiskAnswer/);
});
test("A1 crop and chemical boundaries still take effect; A2 does not claim old crop questions", () => {
  const q = "How many ml of pesticide should I spray on my maize?";
  assert.ok(explicitChemicalSafetyAnswer(q) ?? agronomyHighRiskAnswer(q));
  assert.equal(enterpriseHighRiskAnswer(q), null);
  assert.ok(agronomyHighRiskAnswer("Is mouldy maize safe to feed?"));
  assert.equal(assessFarmEnterpriseQuestion("My maize leaves are yellow"), undefined);
});
test("enterprise enquiries reset unrelated crop context and preserve explicit Crop Doctor handoffs", () => {
  const q = "How do I produce BSF frass?";
  const d = manageFarmMateConversation(q, {activeTopic:"plant_health",activeCropName:"Okra",activeSpecialist:"crop_health",waitingForFollowUp:true,turns:[]});
  assert.equal(d.shouldKeepContext, false);
  assert.equal(d.cropName, undefined);
  const b = buildFarmMateResponse("Can I use maize waste for BSF?", routeFarmMateQuestion("Can I use maize waste for BSF?"), {previousCropName:"Okra"});
  assert.equal(b.resolvedCrop, undefined);
  assert.equal(b.flow?.requiredInformation.crop, undefined);
  assert.equal(routeFarmMateQuestion(q, {source:"crop_doctor",crop:"Okra",issueCategory:"pest"}).selectedSpecialist, "crop_doctor");
  const fresh = input("Why are my okra plants dying?");
  assert.equal(fresh.brain.agronomyEvidence?.cardId, "decline");
});
test("fallback asks one purpose, then stays useful without claiming a production pack", () => {
  const nonBsfWasteQuestion = "How do I manage manure in a poultry farming business?";
  assert.equal(enterpriseHighRiskAnswer(nonBsfWasteQuestion), null);
  assert.equal(assessFarmEnterpriseQuestion(nonBsfWasteQuestion)?.cardId, "enterprise-poultry-limited");
  for (const q of ["I want information about mushroom farming.", "Tell me about snail farming in Ghana."]) {
    const first = assessFarmEnterpriseQuestion(q)!;
    assert.ok(first.followUp);
    const next = assessFarmEnterpriseQuestion(q, [{questionId:first.followUp!.id, selectedOption:"Business planning"}])!;
    assert.equal(next.followUp, undefined);
    assert.match(next.why, /business planning/);
    assert.match(next.finding, /do not yet have a deep Ghana-specific pack/);
    const forged = assessFarmEnterpriseQuestion(q, [{questionId:first.followUp!.id, selectedOption:"Use unsafe recipes"}])!;
    assert.deepEqual(forged.observed, []);
    assert.ok(forged.followUp);
  }
});
test("A2 output validator keeps concise complete sections; sources remain collapsed in existing UI", () => {
  const q = "What is black soldier fly farming?";
  const a = authoredAnswer(q);
  assert.equal(isLikelyIncompleteFarmMateAnswer(a, input(q)), false);
  assert.ok(displayedAnswerSections(a).actionLines.length <= 3);
  assert.equal(isLikelyIncompleteFarmMateAnswer("Use BSF.", input(q)), true);
  assert.equal(isLikelyIncompleteFarmMateAnswer(`${a}\n${"Extra words ".repeat(140)}.`, input(q)), true);
  assert.equal(isLikelyIncompleteFarmMateAnswer(`${a}\n3. Another action.\n4. A fourth action.`, input(q)), true);
  const ui = readFileSync("src/components/AskFarmMate.tsx", "utf8");
  assert.match(ui, /Sources &amp; limitations/);
  assert.match(ui, /More detail/);
  assert.doesNotMatch(a, /awaiting.*review|Project 00|A2|developer|certification.*gate/);
});
test("A2 meaningful opening survives the legacy filler-cleaning trap without changing A1", () => {
  const q = "I want information about mushroom farming.";
  const answer = authoredAnswer(q).replace("What I think: ", "What I think:\n");
  assert.match(displayedAnswerSections(cleanFarmMateFinalAnswer(answer)).first!.body, /^you frame/);
  const displayed = isFarmEnterpriseAssessment(input(q).brain.agronomyEvidence) ? answer.trim() : cleanFarmMateFinalAnswer(answer);
  assert.match(displayedAnswerSections(displayed).first!.body, /^I can help you frame/);
  const ui = readFileSync("src/components/AskFarmMate.tsx", "utf8");
  assert.match(ui, /isFarmEnterpriseAssessment\(farmMateResponse\.agronomyEvidence\)\s*\? data\.answer\.trim\(\)\s*: cleanFarmMateFinalAnswer\(data\.answer\)/);
  assert.equal(cleanFarmMateFinalAnswer("I can help.\nCrop guidance stays unchanged."), "Crop guidance stays unchanged.");
});
test("controlled provider simulation rejects unsafe A2 output through existing failure recovery result", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only-not-a-credential";
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ status: "completed", output_text: "What I think: BSF is useful.\nWhat to do now:\n1. Feed 25% BSF meal.\nNext step: Start feeding." }), {status:200});
    const failed = await generateFarmMateNaturalAnswer(input("Can BSF be used for poultry?"));
    assert.equal(failed.ok, false);
    if (!failed.ok) assert.equal(failed.reason, "incomplete_response");
    globalThis.fetch = async () => new Response(JSON.stringify({ status: "completed", output_text: authoredAnswer("What is BSF farming?") }), {status:200});
    assert.equal((await generateFarmMateNaturalAnswer(input("What is BSF farming?"))).ok, true);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});
