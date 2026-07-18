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

### Crop Doctor Vision

- Crop Doctor is guided photo analysis: farmers should select the crop where possible and optionally choose the symptom before analysis.
- Uses image guidance as practical support, not a guaranteed diagnosis.
- One image may not be enough; unclear or mismatched photos should ask for a clearer photo or more field checks.
- Does not assume tomato for unknown crop photos.
- Supports result states such as unclear photo, crop not confirmed, no clear problem, disease, pest, nutrient issue, water stress, and harvest/storage check.
- Serious, spreading, or high-risk crop issues should be confirmed with an agricultural extension officer.
- Charges credits only after successful analysis.
- Keeps Crop Doctor to Ask FarmMate handoff inside structured crop/photo context.

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
| Best fertilizer for maize | Fertilizer |
| What NPK for pepper? | Fertilizer |
| Can I spray today? | Weather Decision |
| Can I apply fertilizer before rain? | Weather Decision |
| Can I plant tomatoes now? | Planting Advisor |
| How do I plant watermelon? | Planting Advisor |
| Best spacing for watermelon | Planting Advisor |
| When should I harvest maize? | Harvest and Post-Harvest |
| How do I store cassava? | Harvest and Post-Harvest |
| How do I pack tomatoes for transport? | Harvest and Post-Harvest |
| I uploaded a crop photo. What should I check next? | Crop Doctor |
| I uploaded a cassava photo. What should I do next? | Crop Doctor |
| How can I buy produce from Ghana Growers? | General marketplace guidance |

## Credit Rules

Ask FarmMate:

- 5 AI-assisted questions every 6 hours.
- Empty messages do not consume credits.
- Exhausted state shows a friendly refresh message and Learn actions.
- OpenAI is not called when credits are exhausted.

Crop Doctor:

- 2 photo checks every 12 hours.
- Failed analysis does not consume credits.
- Exhausted state disables upload/analysis and offers Ask FarmMate instead.
- Wording never says "refreshes in soon" or "0 of 2 checks available".

## Known Limitations

- No farmer login yet.
- Crop Doctor is AI guidance, not a guaranteed diagnosis.
- Live weather is location-based but not personalized to saved farms yet.
- Market prices are not included in V1.
- Exact farm records/history are not saved in V1.
- Crop Calendar and Planting Advisor use local static guidance.
- FarmMate does not replace an agricultural extension officer for serious outbreaks.

## Launch Notes

- Keep GG FarmMate as a guided farming companion, not a general chatbot.
- FarmMate Brain remains the source of truth.
- OpenAI is the natural-language voice layer only.
- Keep public responses practical, short, and farmer-friendly.
- Keep development/debug information out of the UI.
