# GG FarmMate Launch QA

GG FarmMate is ready for controlled public farmer testing when the routes, tools, credits, and specialist responses below pass without blocking errors.

## Tested Routes

- `/farmer-hub`
- `/farmer-hub/feedback`

Route checks:

- Pages load without server errors.
- Components import cleanly.
- Modal and sheet tools open and close safely.
- Public links point to existing routes.
- Mobile layouts avoid horizontal overflow.

## Core Tools

### Today at a glance

- Uses local date-based daily guidance.
- Greeting never says "Good night".
- Evening and night guidance avoids morning-only actions.
- Renders as a compact support card, not the page hero.
- Does not claim live weather when weather data is unavailable.

### Live Weather

- Supports selected Ghana locations such as Accra, Kumasi, and Tamale.
- Supports browser location when permission is granted.
- Stores selected weather context for Ask FarmMate weather decisions.
- Handles unavailable weather with a friendly fallback.
- Does not show demo forecast wording when live weather is available.

### Ask FarmMate

- Uses the Conversation Manager before routing.
- Uses the Specialist Router before the Decision Engine.
- Resets old crop or specialist context when the farmer changes topic.
- Uses live weather context for weather decisions when available.
- Does not invent prices, buyers, weather timing, fertilizer dosage, yields, or diagnoses.
- Keeps final answers short, practical, and focused on one next step.
- Routes broad seed, nursery, seedling, soil, weed, intercropping, rotation, pruning and plant-identification questions to General Agronomy.
- Continues with cautious general farming principles when a crop is not yet in the Knowledge Engine.
- Uses farmer-scale field language and avoids home gardening language.
- Structures General Agronomy recommendations as `What I think`, `What to do now`, optional `What to check`, and `Next step`.
- Gives useful General Agronomy guidance before asking one useful follow-up question.
- Limits General Agronomy answers to three actions, two useful checks, and one next step.
- Uses practical field language for advanced farmer questions rather than long theory.
- Recognizes expanded crop aliases before routing questions to Plant Health, Planting Advisor, Crop Doctor guidance, or General Agronomy.
- Uses cautious crop-family guidance instead of refusing when full crop-specific guidance is unavailable.
- Ask FarmMate supports same-consultation follow-ups.
- One farmer-started question equals one consultation credit, and follow-up answers requested by FarmMate do not use extra credits.
- Farmers should be guided with buttons where possible, with only one pending follow-up question shown at a time.
- A selected option stays in the same consultation and is acknowledged with `You told me: {answer}`.
- "My cocoa leaves are yellow" asks region first, cocoa growth stage second, and the clearest visible sign next if it is still needed.
- The watermelon planting flow asks region first, rain or irrigation availability second, and then gives a final recommendation.
- Final answers retain `What I think`, `What to do now`, `What to check`, and `Next step`; valuable perennial guidance remains cautious.
- A new unrelated question starts a new consultation and uses a new credit.

### Expanded Crop Library

- Core food crops include maize, cassava, yam, plantain, rice, cowpea, groundnut, and cocoyam.
- Vegetables include tomato, pepper, onion, okra, garden eggs, aubergine or eggplant, potato, sweet potato, cucumber, watermelon, sweet melon, zucchini, pumpkin, lettuce, cabbage, kale, carrot, beetroot, kontomire, and amaranth.
- Cash and perennial crops include cocoa, cashew, oil palm, coconut, rubber, and coffee.
- Fruits include mango, citrus, pineapple, pawpaw, banana, and avocado.
- Crop aliases handle farmer wording such as eggplant, courgette, water melon, Irish potato, cacao, papaya, and cocoyam leaves.
- Specific multi-word aliases take priority so sweet melon, water melon, and Irish potato resolve correctly.
- Crop-family reasoning covers nightshades, cucurbits, brassicas, root or tuber crops, leafy vegetables, fruits, and perennial cash crops.
- Family guidance is a cautious starting point and must not be presented as a confirmed crop-specific diagnosis.
- Other crop and Not sure remain supported paths for cautious general guidance.

### Crop Doctor Vision

- Crop Doctor is guided photo analysis: farmers should select the crop where possible and optionally choose the symptom before analysis.
- The crop selector groups Common food crops, Vegetables, Fruits, Cash crops, and Not sure / other so the expanded list remains usable on mobile.
- Uses image guidance as practical support, not a guaranteed diagnosis.
- One image may not be enough; unclear or mismatched photos should ask for a clearer photo or more field checks.
- Does not assume tomato for unknown crop photos.
- Supports result states such as unclear photo, crop not confirmed, no clear problem, disease, pest, nutrient issue, water stress, and harvest/storage check.
- Results show crop context, crop group, cautious photo confidence, visible signs, what the signs may suggest, checks, actions, and one next step.
- When the crop is unknown, show "Crop not confirmed", describe visible plant features, request a clearer whole-plant and close-up photo, suggest selecting the crop if known, and offer Ask FarmMate without forcing a disease diagnosis.
- If exact crop-specific guidance is limited, continue with general crop-family guidance instead of refusing.
- Cocoa, cashew, oil palm, coconut, rubber, and coffee use the caution: "For valuable perennial crops, confirm serious or spreading problems with an extension officer or experienced crop advisor."
- Does not recommend strong chemicals or invent pesticide or fertilizer dosage, yield, profit, market price, or buyer demand.
- Serious, spreading, or high-risk crop issues should be confirmed with an agricultural extension officer.
- Charges credits only after successful analysis.
- Keeps Crop Doctor to Ask FarmMate handoff inside structured crop/photo context.
- Crop photos are used for the current check and are not stored permanently by GG FarmMate.

### Pilot Answer Feedback

- Pilot farmers can rate completed Ask FarmMate and Crop Doctor answers as helpful, not clear, or wrong.
- Ask FarmMate wrong-answer feedback preserves the original question and tool context, including the specialist when available.
- Crop Doctor feedback preserves available crop, symptom, and result context without exposing internal debug data.
- Feedback controls appear after final answers only and never while an Ask FarmMate follow-up is waiting; they remain usable on small mobile screens.
- Copy Answer is available only after a final Ask FarmMate answer and copies that answer rather than the pending follow-up question.
- Feedback is important during the public pilot because FarmMate is still learning from real farmer use.

### Crop Calendar

- Local static planning support.
- Unlimited usage.

### Planting Advisor

- Local specialist guidance for planting timing, crop choice, spacing, nursery/transplanting, and land preparation.
- Does not pretend to know exact local weather, prices, or profit.
- Supports practical watermelon planting, spacing, soil-preparation, drainage and water guidance.
- Clarifies whether an ambiguous "melon" question means watermelon or melon grown for seed before advising.

## Specialist Test Matrix

| Question | Expected specialist |
| --- | --- |
| My tomato leaves are yellow | Plant Health |
| My cassava leaves are curling | Plant Health |
| My maize has holes in the leaves | Plant Health |
| My cocoa leaves are yellow | Plant Health |
| My cashew leaves are yellow | Plant Health |
| My potato plants are wilting | Plant Health |
| My sweet melon leaves have spots | Crop health |
| What disease is this on oil palm? | Crop health |
| My pineapple leaves are yellow | Plant Health |
| My cabbage has holes | Crop health |
| Best fertilizer for maize | Fertilizer |
| What NPK for pepper? | Fertilizer |
| Can I spray today? | Weather Decision |
| Can I apply fertilizer before rain? | Weather Decision |
| Can I plant tomatoes now? | Planting Advisor |
| How do I plant watermelon? | Planting Advisor |
| How do I plant zucchini? | Planting Advisor |
| Best spacing for watermelon | Planting Advisor |
| How do I harden seedlings before transplanting? | General Agronomy |
| Can I intercrop maize with cowpea? | General Agronomy |
| How do I improve seed germination? | General Agronomy |
| Why are my seedlings leggy? | General Agronomy |
| How do I manage weeds before planting? | General Agronomy |
| How do I improve soil structure? | General Agronomy |
| How do I improve drainage in waterlogged soil? | General Agronomy |
| How should I prune pepper? | General Agronomy |
| What plant is this? | General Agronomy to Crop Doctor handoff |
| Can I grow aubergine in Ghana? | Planting Advisor |
| When should I harvest maize? | Harvest and Post-Harvest |
| How do I store cassava? | Harvest and Post-Harvest |
| How do I pack tomatoes for transport? | Harvest and Post-Harvest |
| I uploaded a crop photo. What should I check next? | Crop Doctor |
| I uploaded a cassava photo. What should I do next? | Crop Doctor |
| How can I buy produce from Ghana Growers? | General marketplace guidance |

## Credit Rules

Ask FarmMate:

- 5 Ask FarmMate consultations/questions every 6 hours.
- One farmer-started question equals one consultation credit.
- Follow-up answers requested by FarmMate inside the same consultation do not use extra credits.
- A new unrelated question starts a new consultation and uses another credit.
- Missing or invalid consultation context must not bypass Ask FarmMate credit checks.
- Empty messages do not consume credits.
- Exhausted state shows a friendly refresh message and a Share feedback action.
- OpenAI is not called when credits are exhausted.

Crop Doctor:

- 2 photo checks every 12 hours.
- Failed analysis does not consume credits.
- Exhausted state disables upload/analysis and offers Ask FarmMate instead.
- Wording never says "refreshes in soon" or "0 of 2 checks available".

## Known Limitations

- No farmer login yet.
- Crop Doctor is AI guidance, not a guaranteed diagnosis.
- Expanded crop coverage does not mean every crop has full crop-specific diagnosis or treatment guidance.
- Crop-family reasoning cannot confirm the exact cause of a problem.
- Unknown or unclear crops may require a clearer whole-plant and close-up photo or farmer-selected crop context.
- Valuable perennial crop problems may require confirmation from an extension officer or experienced crop advisor.
- Crop photos are not stored permanently by GG FarmMate.
- Live weather is location-based but not personalized to saved farms yet.
- Market prices are not included in V1.
- Exact farm records/history are not saved in V1.
- Crop Calendar and Planting Advisor use local static guidance.
- FarmMate does not replace an agricultural extension officer for serious outbreaks.
- Unknown crops receive general agronomy guidance, not invented crop-specific facts.

## Launch Notes

- Keep GG FarmMate as a guided farming companion, not a general chatbot.
- FarmMate Brain remains the source of truth.
- OpenAI is the natural-language voice layer only.
- Keep public responses practical, short, and farmer-friendly.
- Use field, plot, crop, seedling, nursery, affected plants, farm, extension officer, soil moisture, drainage and planting material language.
- Do not use pot, indoor plant, houseplant, decorative plant or balcony garden language.
- Keep development/debug information out of the UI.
