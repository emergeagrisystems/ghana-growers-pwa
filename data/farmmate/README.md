# Controlled Farmer Question Bank

`farmer-question-bank.json` is a repository-controlled evaluation input, not a database, inbox or model-training collection. Its current authority is P09-RC1-A2. Only A2-R01 was supplied as a real Ghana Growers farmer question; all other entries are synthetic tests.

Each record has a stable ID, origin, anonymised question, topic, enterprise, intent, current coverage and quality, source requirement, safety level, priority and evaluation status. New real records require an actual supplied question and removal of names, phone numbers, private identifiers and unrelated conversation. Do not infer or fabricate farmer demand from synthetic cases. Do not import WhatsApp chat exports.

`evaluationStatus: registered` means the case is enrolled in the reproducible test matrix; it is not a live-pass claim. `tests/enterprise-a2.test.ts` runs each record, while the dated founder validation register records the tested commit, automated result and whether a live check ran. Keep immutable case IDs when wording is corrected; explain material changes in the commit.

Future workflow: anonymise and label origin → classify intent/coverage/risk → identify the missing source → propose priority → obtain founder authority for a new pack → add claim-level provenance and safety/evaluation cases → verify in Protected Preview. A question-bank entry alone does not authorise a pack, a migration or release.

BSF is the only A2 substantive enterprise pack. Other entries must stay labelled limited fallback until a later authorised, source-backed implementation actually exists. No database schema or personal data is needed for this structure.
