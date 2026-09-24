# RC1 public assistant naming

Confirmed display name: Ask Mama G. Grammatical references use Mama G. This change updates public presentation only.

Changed paths:

- `src/data/farmmatePublicTools.ts`, `src/data/site.ts`
- `src/data/learnLessons.ts`, `src/lib/learn-challenges.ts`, `src/lib/learnDisplay.ts`
- `src/components/LearnHub.tsx`, `src/components/BlogCard.tsx`, `src/components/SoilHealthChallenge.tsx`
- `src/app/learn/page.tsx`, `src/app/learn/[slug]/page.tsx`
- `src/components/FarmTools.tsx`, `src/components/FarmMateHeroActions.tsx`
- `src/app/farmer-hub/page.tsx`, `src/app/farmer-hub/feedback/page.tsx`
- `src/components/FarmMatePilotFeedbackForm.tsx`, `src/components/FarmMateAnswerFeedback.tsx`, `src/components/FarmerRegistrationForm.tsx`
- `src/components/smart-solutions/DigitalFarmToolbox.tsx`, `src/components/smart-solutions/FarmerAssistant.tsx`
- `src/app/terms-of-use/page.tsx`, `src/app/about/partner-with-us/page.tsx`

Stored category `FarmMate Guides` remains unchanged. Public cards, article headings, tabs and filters display `Mama G Guides`. The internal `When to ask FarmMate` section lookup remains intact and is not rendered as a visible heading. Lesson slugs, related-lesson slugs, query parameters, internal component/API names, storage keys, category values and farming content remain unchanged. Featured/recommended lesson title selectors were updated with their corresponding display titles so the renamed lessons remain discoverable. Existing illustration selectors retain their old values and also recognise Mama G text.

The web manifest contains only Ghana Growers naming and needed no assistant-name edit. Shared shell/Homepage and live Ask/Crop Doctor presentation are owned by the other RC1 workstreams; this file does not claim their validation.

Validation: `node tests/rc1-public-name.cjs` renders the Learn hub, all five guide cards and all five guide articles. It verifies visible Mama G naming, working stored category filters and nonempty internal prompt-section lookups. The first render exposed an old name in the Day 7 learning challenge, which was corrected; the repeated render passed. No browser/API/model/network call was made by that test.
