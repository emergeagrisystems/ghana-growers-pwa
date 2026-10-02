import assert from "node:assert/strict";
import { test } from "node:test";
import { assessAgronomyEvidence, type AgronomyAnswer } from "../src/lib/farmmate/agronomy-evidence";
import { diagnosticActionParts, displayedAnswerSections, farmerFacingFinding, UNCOMMON_CROP_SCOPE_NOTE } from "../src/lib/farmmate/answer-presentation";
import { buildFarmMateVoiceLayerInput } from "../src/lib/farmmate/ai/service";
import { readFileSync } from "node:fs";
import { buildFarmMateResponse } from "../src/lib/farmmate/decision-engine/response-builder";
import { routeFarmMateQuestion } from "../src/lib/farmmate/router";
import { cropDoctorVisionSystemPrompt, normalizeCropDoctorVisionResult } from "../src/lib/farmmate/crop-doctor-vision";
const answer = (questionId: string, selectedOption: string): AgronomyAnswer => ({ questionId, selectedOption });

test("A: scattered okra, dry soil and intact base retains useful differential", () => {
  const a = assessAgronomyEvidence("Why are my okra plants dying?", "Okra", [answer("a1-decline-pattern", "Scattered plants, spreading"), answer("a1-decline-base", "Dry soil; base looks intact")])!;
  assert.equal(a.followUp, undefined);
  assert.equal(a.answerKind, "diagnostic");
  assert.match(a.finding, /Moisture\/root stress/);
  assert.match(a.finding, /root-feeding/);
  assert.match(a.actions.join(" "), /Soft, dark|Chewed or missing/);
  assert.match(a.next, /one newly wilting/);
  assert.ok(!a.actions.includes(a.next));
});
test("B: four-week maize retains age and asks pattern, roots and inputs, not weather", () => {
  const q = "My maize is about 4 weeks old and the leaves are becoming yellow. Should I fertilize it?";
  const a = assessAgronomyEvidence(q, "Maize")!;
  assert.equal(a.cardId, "maize-yellow");
  assert.match(a.observed.join(" "), /4 weeks old/);
  assert.equal(a.followUp?.id, "a1-maize-yellow-pattern");
  const completed = assessAgronomyEvidence(q, "Maize", [answer("a1-maize-yellow-pattern", "Older leaves, V from the tip"), answer("a1-maize-root-moisture", "Moist and draining"), answer("a1-maize-inputs", "No fertilizer or manure")])!;
  assert.equal(completed.followUp, undefined);
  assert.match(completed.finding, /possibility/);
  assert.match(completed.actions.join(" "), /whorl damage|Chewing/);
  assert.match(completed.actions.join(" "), /locally applicable maize nutrient plan/);
  assert.doesNotMatch(completed.actions.join(" "), /\d+\s*(kg|ml|litres)/);
});
test("C: beginner staking request teaches support and soft figure-eight without decision status", () => {
  const q = "I have never staked tomatoes before. How do I do it properly?";
  const a = buildFarmMateResponse(q, routeFarmMateQuestion(q)).agronomyEvidence!;
  assert.equal(a.answerKind, "method");
  assert.equal(a.displayTitle, "How to stake tomatoes");
  assert.match(a.actions.join(" "), /root ball|figure-eight|thicken/);
  assert.match(a.detail.join(" "), /Common mistakes|What you need|When:/);
  assert.equal(a.actions.length, 3);
  assert.ok(!a.actions.includes(a.next));
});
test("D: known damp maize and ordinary sacks only asks hazards then grain form", () => {
  const q = "I harvested maize yesterday and it is still damp. I only have ordinary sacks. How should I store or preserve it?";
  const first = assessAgronomyEvidence(q)!;
  assert.equal(first.followUp?.id, "a1-grain-damage");
  const history = [answer("a1-grain-damage", "No suspect signs noticed")];
  assert.equal(assessAgronomyEvidence(q, undefined, history)!.followUp?.id, "a1-grain-form");
  const a = assessAgronomyEvidence(q, undefined, [...history, answer("a1-grain-form", "Shelled grain")])!;
  assert.equal(a.followUp, undefined);
  assert.match(a.actions.join(" "), /thinly|turn|rain or night|raised base/i);
  assert.match(a.detail.join(" "), /Without a meter|warning signs, not tests/);
  assert.doesNotMatch(a.actions.join(" "), /controlled drying|\d+%/);
});
test("storage suspect grain still stops advice even with known sacks", () => {
  const a = assessAgronomyEvidence("My maize is damp; I have ordinary sacks.", undefined, [answer("a1-grain-damage", "Yes, suspect signs are present")])!;
  assert.equal(a.followUp, undefined);
  assert.doesNotMatch(a.actions.join(" "), /seal|thin layer/);
});
test("E: exact uncommon-crop intent is one crop, not several crops", () => {
  const q = "I am growing a crop that is not common in Ghana. Can you still help me diagnose leaf spots?";
  const a = buildFarmMateResponse(q, routeFarmMateQuestion(q)).agronomyEvidence!;
  assert.equal(a.cardId, "limited-crop");
  assert.equal(a.followUp, undefined);
  assert.doesNotMatch([a.finding, a.why, ...a.actions, a.next].join(" "), /Several crop types/);
  assert.doesNotMatch(a.possibilities.join(" "), /several|multiple|many crop|kinds of plant/i);
  assert.match(a.next, /crop name|Crop Doctor/);
  assert.match(a.actions.join(" "), /border or halo|older and younger/);
});
test("R1: a completed no-input maize answer does not ask for an input record again", () => {
  const a = assessAgronomyEvidence("My maize is about 4 weeks old and the leaves are becoming yellow. Should I fertilize it?", "Maize", [answer("a1-maize-yellow-pattern", "Older leaves, V from the tip"), answer("a1-maize-root-moisture", "Moist and draining"), answer("a1-maize-inputs", "No fertilizer or manure")])!;
  assert.match(a.why, /reported no fertilizer or manure/);
  assert.doesNotMatch([...a.actions, ...a.detail].join(" "), /check the previous input record|Record manure\/fertilizer product/i);
  assert.match(a.actions.join(" "), /roots are sound/);
});
test("R1: unrelated uncommon-crop Ask does not inherit completed maize context", () => {
  const maize = "My maize leaves are yellow";
  buildFarmMateResponse(maize, routeFarmMateQuestion(maize));
  const q = "I am growing a crop that is not common in Ghana. Can you still help me diagnose leaf spots?";
  const a = buildFarmMateResponse(q, routeFarmMateQuestion(q)).agronomyEvidence!;
  assert.equal(a.cardId, "limited-crop");
  assert.doesNotMatch(JSON.stringify(a), /Older leaves, V|No fertilizer or manure|nitrogen-related|Several crop types/);
  assert.equal(a.followUp, undefined);
});
test("F: vision instructions require differentiating signs, not removal as the check", () => {
  const p = cropDoctorVisionSystemPrompt();
  assert.match(p, /whatToCheck must discriminate/);
  assert.match(p, /do not repeat these uppercase labels/);
  assert.match(p, /not a whole-plant photo/);
  const r = normalizeCropDoctorVisionResult({ cropFromImage:null, cropConfidence:"low", resultType:"crop_not_confirmed", visibleSigns:["A damaged fruit surface"], nextBestAction:"Photograph the damaged fruit end beside an undamaged fruit." });
  assert.equal(r.nextBestAction, "Photograph the damaged fruit end beside an undamaged fruit.");
});
test("presentation supports single-newline headings, real lists and at most three actions", () => {
  const s = displayedAnswerSections("What I think: Main finding.\nWhat to do now:\n1. First.\n2. Second.\n3. Third.\n4. Fourth.\nNext step: Distinct next.\nWhat to check: Optional details.");
  assert.equal(s.first?.body, "Main finding.");
  assert.equal(s.actionLines.length, 3);
  assert.equal(s.next?.body, "Distinct next.");
  assert.ok(s.details.some(v=>v.body.includes("Fourth.")));
});
test("presentation removes literal duplicated next action without inventing a replacement", () => {
  const s = displayedAnswerSections("What I think: Main.\n\nWhat to do now:\n1. Take a photo.\n2. Compare plants.\n\nNext step: Take a photo.");
  assert.deepEqual(s.actionLines, ["Compare plants."]);
  assert.equal(s.next?.body, "Take a photo.");
});

test("final minor: guided follow-up goes directly to the existing question UI", () => {
  const ui = readFileSync("src/components/AskFarmMate.tsx", "utf8");
  assert.doesNotMatch(ui, /Let's narrow this down|I will ask one quick question at a time/);
  assert.match(ui, />One quick question</);
  assert.match(ui, /mamaGPublicText\(currentFollowUp.question\)/);
  assert.match(ui, /answerFollowUp\(option\)/);
  const q = "Why are my okra plants dying?";
  assert.equal(assessAgronomyEvidence(q, "Okra")?.followUp?.id, "a1-decline-pattern");
});
test("final minor: labelled diagnostic prose preserves meaning and action", () => {
  const body = "Moisture stress is more likely. Water the root zone gently and watch whether the plant recovers.";
  for (const line of [`**Dry soil:** ${body}`, `**Dry soil**: ${body}`, `Dry soil: ${body}`]) {
    assert.deepEqual(diagnosticActionParts(line), { label: "Dry soil", body });
  }
  const parsed = displayedAnswerSections(`What I think: Check roots.\nWhat to do now:\n1. **Dry soil:** ${body}\nNext step: Compare two plants.`);
  assert.deepEqual(diagnosticActionParts(parsed.actionLines[0]), { label: "Dry soil", body });
  assert.equal(parsed.next?.body, "Compare two plants.");
});
test("final minor: legacy arrows render as sign and sentences without changing uncertainty", () => {
  for (const arrow of ["->", "→", "⇒", "-->"]) {
    assert.deepEqual(diagnosticActionParts(`Dry soil ${arrow} moisture shortage possible ${arrow} water gently without flooding`), {
      label: "Dry soil", body: "Moisture shortage possible. Water gently without flooding."
    });
  }
  assert.deepEqual(diagnosticActionParts("Insect nearby → not proof → do not spray from appearance alone"), {
    label: "Insect nearby", body: "Not proof. Do not spray from appearance alone."
  });
  assert.deepEqual(diagnosticActionParts("Use soft ties with room for growth."), { body: "Use soft ties with room for growth." });
});
test("final minor: unknown crop scope remains negative even if provider omits not", () => {
  const q = "I am growing a crop that is not common in Ghana. Can you still help me diagnose leaf spots?";
  const brain = buildFarmMateResponse(q, routeFarmMateQuestion(q));
  const a = brain.agronomyEvidence!;
  assert.equal(a.cardId, "limited-crop");
  assert.equal(a.finding, "I may not have Ghana-specific guidance for this crop, but I can still help assess the visible signs.");
  assert.equal(farmerFacingFinding("I may have Ghana-specific guidance for this crop.", a), `${UNCOMMON_CROP_SCOPE_NOTE} ${a.why}`);
  assert.equal(farmerFacingFinding("Unchanged other answer", {cardId: "maize-yellow", why: "Other evidence"}), "Unchanged other answer");
  const payload = JSON.parse(buildFarmMateVoiceLayerInput({ farmerQuestion:q, brain, farmerAnswers:[], localStructuredResponse:[] }));
  assert.match(payload.instruction, /short bold observation label/);
  assert.match(payload.instruction, /Do not use arrows/);
  assert.match(payload.instruction, /preserve evidence.finding verbatim/);
  assert.match(payload.boundaries.join(" "), /No rates.*pesticides.*food\/feed clearance/);
});
test("final minor: UI uses real bold sign markup and the scoped finding guard", () => {
  const ui = readFileSync("src/components/AskFarmMate.tsx", "utf8");
  assert.match(ui, /<strong className="font-bold text-ink">\{action.label\}:<\/strong>/);
  assert.match(ui, /farmerFacingFinding\(answerSections.first.body, response\?\.agronomyEvidence\)/);
  assert.doesNotMatch(ui, /dangerouslySetInnerHTML/);
});
