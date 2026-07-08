# GG FarmMate QA Checklist

Use this checklist before public launch after changes to Ask FarmMate, Crop Doctor, the Specialist Router, the Conversation Manager, or the OpenAI voice layer.

## Core Flow Checks

- [ ] Open `/farmer-hub` and confirm the page loads without requiring login.
- [ ] Open Ask FarmMate and confirm the input, suggestion chips, and Ask FarmMate button work.
- [ ] Confirm local fallback responses appear when OpenAI is unavailable or `OPENAI_API_KEY` is missing.
- [ ] Confirm no debug information appears in the production UI.

## Manual Test Cases

| Test | Steps | Expected result |
| --- | --- | --- |
| Maize plant health | Ask: `My maize is not growing well` | FarmMate detects maize, does not mention tomato, and asks maize-relevant follow-up questions or gives maize-relevant next steps. |
| Maize fertilizer | Ask: `Best fertilizer for maize` | Specialist routing selects fertilizer context. FarmMate does not ask tomato/yellow-leaf questions. |
| Tomato yellow leaves | Ask: `My tomato leaves are yellow` | FarmMate detects tomato and asks relevant leaf-position/spotting/watering follow-up questions. |
| Cassava leaf curl | Ask: `My cassava leaves are curling` | FarmMate detects cassava and uses plant-health/curling-leaf reasoning without tomato context. |
| Spraying/weather | Ask: `Can I spray today?` | FarmMate routes to weather decision support and asks about rain, leaf wetness, or wind. |
| Buying produce | Ask: `How can I buy produce from Ghana Growers?` | FarmMate gives the buyer-network/marketplace guidance and does not ask crop-health questions. |
| Crop Doctor unknown crop handoff | Upload a file without a crop name, analyse, then click `Ask FarmMate about this` | Ask FarmMate receives neutral crop-photo wording, does not assume tomato, and uses fallback/photo-check guidance. |
| Crop Doctor cassava handoff | Upload a file with `cassava` in the filename, analyse, then click `Ask FarmMate about this` | Ask FarmMate receives cassava context and does not switch to tomato. |
| Topic change after plant health | Ask tomato/cassava/maize health question, then ask `How can I buy produce from Ghana Growers?` | Conversation Manager resets context and shows marketplace guidance. |
| Random short answer | Open a fresh Ask FarmMate session and ask `yes` | FarmMate asks for a clearer question instead of continuing an old consultation. |

## Debug Log Checks

In development only, confirm console logs include:

- incoming message
- active topic
- conversation decision: continue, reset, or clarify
- reset reason when applicable
- detected crop
- selected specialist
- selected decision flow crop/context
- OpenAI payload crop/context

## Safety Checks

- [ ] OpenAI receives only the structured FarmMate Brain payload.
- [ ] OpenAI does not receive stale crop context after a reset.
- [ ] OpenAI does not invent crop, disease, price, dosage, or diagnosis.
- [ ] If the local brain is uncertain, the answer says so or asks for more information.
- [ ] Crop Doctor copy clearly states demo diagnosis cannot confirm yet.
