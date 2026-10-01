// Read-only deterministic evaluation; generates review artifacts, never calls a provider/database.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, 'docs/p09/a1/generated'));
const load = (file) => require(path.join(root, '.farmmate-test-dist/src/lib/farmmate', file));
const { buildFarmMateResponse } = load('decision-engine/response-builder.js');
const { routeFarmMateQuestion } = load('router/index.js');
const { agronomySources, agronomyCoverage, AGRONOMY_CHECKED_ON, AGRONOMY_REVIEW } = load('agronomy-sources.js');
const { assessAgronomyEvidence } = load('agronomy-evidence.js');
const commit = cp.execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const cases = [
 ['A1-01','Why are my okra plants dying?',['Mostly in wet low areas','Soft, dark or damaged base']],
 ['A1-02','My maize leaves are yellow — what may be wrong?',['Older leaves, V from the tip','No fertilizer or manure']],
 ['A1-03','Tomato fruits are rotting — what could cause it?',['Dry sunken patch opposite the stalk']],
 ['A1-04','Small white insects are under my leaves — what should I check?',['White adults fly; small flat stages remain']],
 ['A1-05','Should I fertilize my maize now?',['Growing leaves, before tassels','Moist, draining; roots look intact','Previous inputs, no soil test']],
 ['A1-06','How do I transplant pepper?',[]], ['A1-07','How do I make yam mounds?',[]], ['A1-08','How do I stake tomatoes?',[]],
 ['A1-09','My cassava is not growing well.',['Many cuttings never sprouted well']],
 ['A1-10','My field is waterlogged — what should I do?',['Upland crop; flooding is unintended']],
 ['A1-11','When is maize ready to harvest?',['Dry grain']],
 ['A1-12','My harvested maize is damp — how do I store it?',['No suspect signs noticed','Intact hermetic bags for longer storage']],
 ['A1-13','Mould is appearing in stored grain.',[]],
 ['A1-14','I have too many tomatoes and no immediate buyer — how can I reduce loss?',['Sound but ripening quickly']],
 ['A1-15','My dragon fruit leaves have brown spots. What should I check?',['Spreading on scattered plants']]
];
const results = cases.map(([id, question, choices]) => {
 const router = routeFarmMateQuestion(question);
 const initial = buildFarmMateResponse(question, router);
 const answers = [];
 const pathTaken = [];
 for (const choice of choices) {
   const current = assessAgronomyEvidence(question, initial.resolvedCrop, answers);
   if (!current?.followUp?.options.includes(choice)) throw new Error(`${id}: invalid evaluation option ${choice}`);
   pathTaken.push({ question: current.followUp.question, answer: choice });
   answers.push({ questionId: current.followUp.id, selectedOption: choice });
 }
 const final = buildFarmMateResponse(question, router, { agronomyAnswers: answers });
 if (!final.agronomyEvidence || final.agronomyEvidence.followUp) throw new Error(`${id}: missing or incomplete assessment`);
 return { id, kind: 'SIMULATED FIELD SCENARIO / ACTUAL LOCAL ENGINE OUTPUT; NOT A LIVE PROVIDER ANSWER', commit, question, suppliedContext: pathTaken, route: router.selectedSpecialist, output: final.agronomyEvidence, reviewVerdict: 'PENDING QUALIFIED REVIEW' };
});
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'evaluation-results.json'), JSON.stringify({ commit, checkedOn: AGRONOMY_CHECKED_ON, cases: results }, null, 2));
const intro = `# P09-RC1-A1 agronomy evaluation\n\nCandidate: ${commit}\n\nAll scenarios are simulated tests. Outputs below are actual deterministic candidate-engine results, not invented live OpenAI answers. Live results are recorded separately. No credits used by this script. ${AGRONOMY_REVIEW}.\n`;
fs.writeFileSync(path.join(out, 'evaluation-results.md'), intro + results.map((r) => `\n## ${r.id} — ${r.output.topic}\n\nQuestion: ${r.question}\n\nSupplied context: ${r.suppliedContext.map((a) => `${a.question} → ${a.answer}`).join('; ') || 'None'}\n\nRoute: ${r.route}. Sources: ${r.output.sourceIds.join(', ')}. ${r.output.applicability}\n\nMain finding: ${r.output.finding}\n\nWhy: ${r.output.why}\n\nDifferentiators:\n\n${r.output.possibilities.map((s) => `- ${s}`).join('\n') || '- Not a differential-diagnosis case.'}\n\nActions:\n\n${r.output.actions.map((s) => `- ${s}`).join('\n')}\n\nNext step: ${r.output.next}\n\nReview: PENDING. No field diagnosis or agronomic PASS inferred.\n`).join(''));
fs.writeFileSync(path.join(out, 'source-register.md'), `# P09-RC1-A1 source/provenance register\n\nCandidate: ${commit}\n\nLast checked: ${AGRONOMY_CHECKED_ON}. ${AGRONOMY_REVIEW}. No source is an endorsement of Mama G. Scope means the bounded claim family actually used; code cards map these IDs to exact guidance and branches. Confidence: source-backed principle, provisional local applicability, unconfirmed individual diagnosis.\n` + agronomySources.map((s) => `\n## ${s.id}\n\n[${s.title}](${s.url})\n\nGeography: ${s.geography}. Applicability: ${s.applicability}. Source date: ${s.date}.\n\nGuidance used: ${s.scope}\n\nExcluded: ${s.exclusions}\n\nReview: PENDING qualified Ghana agronomic/post-harvest review.\n`).join(''));
fs.writeFileSync(path.join(out, 'coverage-matrix.md'), `# P09-RC1-A1 crop coverage\n\nCandidate: ${commit}\n\nThis is topic coverage, not a claim of full crop expertise or Ghana-specific approval. All rows require review. Existing selector recognition and older guidance are not evidence of deep coverage.\n\n| Crops | Implemented evidence tier | Supported topics | Sources |\n|---|---|---|---|\n` + agronomyCoverage.map((r) => `| ${r.crops.join(', ')} | ${r.level} | ${r.topics.join('; ')} | ${r.sources.join(', ')} |`).join('\n') + '\n\nOpen across the matrix: locally validated pest/disease incidence, variety-specific lifecycle/season/spacing, precise nutrient programmes, pruning systems, crop-specific irrigation quantities, safe processing and cash-crop post-harvest protocols. These are not silently filled with model memory.\n');
console.log(JSON.stringify({ commit, cases: results.length, sources: agronomySources.length, cropNames: agronomyCoverage.flatMap((r) => r.crops).length, output: out }));
