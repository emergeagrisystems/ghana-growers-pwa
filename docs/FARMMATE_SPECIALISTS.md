# FarmMate Specialists

GG FarmMate routes farmer questions to internal specialists before building a recommendation. The specialist decides what kind of reasoning should happen; the Decision Engine then applies local structured guidance.

## Plant Health Specialist

Handles crop symptoms, plant stress and visible field problems.

Example questions:
- My maize leaves are yellow.
- Why are my tomato leaves curling?
- My cassava leaves have spots.
- My pepper flowers are dropping.

Routing rules:
- Symptom wording such as yellow leaves, wilting, curling leaves, black spots, stunted growth and holes in leaves routes here first.
- Plant health may include nutrient stress as one possible cause, but it should not jump straight to fertilizer advice without checking symptoms, crop stage and field conditions.

Safety rules:
- Do not claim a confirmed diagnosis from text alone.
- Recommend Crop Doctor when a photo would improve confidence.
- Recommend an extension officer when problems are widespread, spreading quickly or serious.
- Prevention and good farming practice come before chemicals.

## Crop Doctor Specialist

Handles guided crop photo analysis after the farmer uploads a field image.

Workflow rules:
- Crop Doctor is guided photo analysis, not blind crop detection.
- Farmers should select the crop where possible before analysis.
- Farmers can optionally select the symptom they are seeing.
- The selected crop and symptom are primary context for the photo check.
- If the farmer selects "Not sure", Crop Doctor may identify the crop cautiously but must not sound certain from one image.
- If the selected crop and image appear inconsistent, say the photo match is uncertain and ask for a clearer photo of the affected crop.

Safety rules:
- Crop Doctor does not guarantee diagnosis.
- One image may not be enough to confirm the crop or issue.
- Focus on visible symptoms, affected leaves, nearby plants, field conditions and practical checks.
- Do not invent pesticide dosage.
- Do not recommend chemicals first.
- Avoid home gardening language such as pot, houseplant, indoor plant, garden soil or decorative plant.
- Serious, spreading or high-risk issues should be confirmed with an agricultural extension officer.

Handoff rules:
- Ask FarmMate handoff should include selected crop and selected symptom when known.
- Do not hardcode tomato or early blight in Crop Doctor handoff wording.

## Fertilizer Specialist

Handles fertilizer, fertiliser, NPK, urea, top dressing, basal fertilizer, compost, manure, soil fertility, nutrient and crop feeding questions.

Example questions:
- Best fertilizer for maize.
- What NPK for pepper?
- Can I use compost for tomatoes?
- When should I apply fertilizer after rain?

Routing rules:
- Input questions with fertilizer, fertiliser, NPK, manure, compost, soil fertility, nutrient, urea, top dressing, basal fertilizer, feeding crop or best fertilizer route to Fertilizer.
- Symptom questions such as "Maize leaves are yellow" route to Plant Health first, even when nutrient stress is one possible cause.

Reasoning order:
1. Crop
2. Growth stage
3. Soil moisture or recent rain
4. Fertilizer, compost or manure already applied
5. Recommendation
6. Next best action

Safety rules:
- Do not invent exact fertilizer rates.
- Do not encourage unnecessary input spending.
- Do not recommend fertilizer before heavy rain.
- Do not recommend fertilizer on dry or waterlogged stressed crops without caution.
- Use soil tests or extension officers for exact local rates and serious field problems.
- Consider compost, manure, mulching, crop rotation and organic matter before costly inputs.

## Weather Decision Specialist

Handles farm decisions affected by weather. FarmMate is not a weather app; this specialist translates weather checks into practical actions.

Example questions:
- Can I spray today?
- Can I apply fertilizer before rain?
- Should I irrigate today?

Routing rules:
- Questions with spray, spraying, rain, rainfall, wind, windy, weather, irrigate, irrigation, water today, wet leaves, dry leaves, heavy rain, fertilize before rain, or apply fertilizer before rain route to Weather Decision.
- Fertilizer-before-rain questions route here first because the main decision is rain timing and runoff risk.

Reasoning order:
1. Farmer task
2. Rain expectation
3. Wind condition
4. Leaf or soil wetness
5. Crop sensitivity if known
6. Recommendation
7. Next best action

Safety rules:
- Do not pretend to know live weather in V1.
- Ask the farmer to check rain, wind, leaves and soil when live data is missing.
- Warn against spraying before rain.
- Warn against spraying in strong wind.
- Warn against fertilizer application before heavy rain because of runoff and waste.
- Warn against working waterlogged soil.

V1 limitation:
- FarmMate does not yet connect to live weather data inside the local Brain. It must not say "rain is coming today" unless the farmer or a real Farm Summary context provides that information.

## Harvest & Post-Harvest Specialist

Handles harvest timing, maturity signs, sorting, grading, short-term storage, transport preparation, drying, spoilage risk and produce quality.

Example questions:
- When should I harvest maize?
- How do I know tomatoes are ready?
- How do I store cassava?
- How do I reduce losses after harvest?
- Can I harvest before rain?
- How do I pack vegetables for transport?

Routing rules:
- Questions with harvest, harvesting, ready to harvest, mature, maturity, store, storage, keep fresh, transport, pack, packing, sort, sorting, grade, grading, dry maize, drying, post harvest, post-harvest, spoil, rotten, mould or shelf life route to Harvest & Post-Harvest.
- Rain-related harvest questions route here because the main decision is maturity, handling, storage and quality protection.

Reasoning order:
1. Crop
2. Growth or maturity signs
3. Weather or rain risk if relevant
4. Storage or transport plan
5. Quality risk
6. Recommendation
7. Next best action

Quality and safety rules:
- Encourage sorting damaged produce away from good produce.
- Warn against leaving harvested produce in hot sun.
- Warn against packing wet produce tightly.
- Encourage shade, ventilation, clean crates or clean containers where possible.
- Warn against mixing rotten or mouldy produce with healthy produce.
- Avoid food safety claims beyond available knowledge.
- Recommend an extension officer or food safety expert for serious rot, mould or contamination.

V1 limitation:
- FarmMate does not invent market prices, buyer availability, guaranteed sales or guaranteed shelf life. Advice should focus on reducing post-harvest losses, protecting quality, avoiding waste and preparing produce responsibly for buyers.

## Planting Advisor Specialist

Handles planting timing, crop choice, spacing, sowing, nursery and transplanting, and basic land preparation questions.

Example questions:
- What should I plant this month?
- Can I plant tomatoes now?
- Best spacing for pepper?
- When should I plant maize?
- When should I transplant tomatoes?
- How do I plant watermelon?
- Best spacing for watermelon?

Routing rules:
- Questions with plant, planting, sow, sowing, transplant, nursery, spacing, seed spacing, planting season, what should I plant, crop to grow, best time to plant, land preparation, melon or watermelon route to Planting Advisor.
- When a farmer says only "melon", FarmMate asks whether they mean watermelon or melon grown for seed before giving planting steps. Watermelon is the supported detailed guide in V1.
- Planting questions that mainly depend on live rain, wind or immediate weather can still use Weather Decision first, but the Planting Advisor remains the crop preparation source.

Reasoning order:
1. Crop or crop choice
2. Region
3. Month or season
4. Rain or irrigation availability
5. Land preparation status
6. Recommendation
7. Next best action

Safety rules:
- Do not pretend exact local weather is known in V1.
- Do not invent seed availability, market prices, guaranteed profit or guaranteed yield.
- Watermelon guidance must not claim prices, buyer demand, profit or yield guarantees.
- Ask one useful follow-up question when crop, region, season, water or land preparation is missing.
- Encourage healthy seed or planting material, good drainage, crop rotation, spacing for airflow and compost or organic matter where available.
- Warn against planting into waterlogged soil.
- Warn against transplanting during extreme heat.
- Recommend planting after steady rains where appropriate, not after one uncertain shower.

V1 limitation:
- FarmMate does not yet have live local weather or market demand inside the local Brain. Planting advice must use farmer-provided rain, irrigation, region and field preparation context, and avoid claiming a crop is the guaranteed best, most profitable or highest-yield choice.

## Crop Doctor Follow-up Specialist

Handles structured handoffs from Crop Doctor photo checks.

Example questions:
- I uploaded a crop photo. What should I check next?
- I uploaded a cassava photo. What should I do next?

Routing rules:
- Structured Crop Doctor handoff context takes priority over text-only keyword routing.
- Crop Doctor handoffs should stay inside crop photo, symptom and plant-health guidance.
- If the handoff includes pest signs, ask about leaf undersides, insects, webbing and spread.
- If the handoff includes nutrient or soil stress, only then ask nutrient, compost or soil-moisture questions.

Safety rules:
- Do not guarantee a diagnosis from a photo.
- Do not assume tomato when crop is unknown.
- Do not route a Crop Doctor handoff into fertilizer, planting or compost unless the image result clearly supports that issue category.
- Use neutral wording when the crop is not confirmed.

## Launch QA Stabilization

Current specialist list:
- Plant Health
- Crop Doctor
- Fertilizer
- Weather Decision
- Planting Advisor
- Harvest & Post-Harvest

Routing rules checked for launch:
- Plant symptoms such as yellow leaves, cassava leaf curl and maize leaf holes route to Plant Health.
- Fertilizer, NPK and compost questions route to Fertilizer unless the main decision is rain timing.
- Spraying, fertilizer-before-rain and irrigation questions route to Weather Decision.
- Planting now, crop choice and spacing questions route to Planting Advisor.
- Harvest timing, storage and transport questions route to Harvest & Post-Harvest.
- Crop photo handoffs route to Crop Doctor and preserve the crop/photo context.

Common failure cases to guard:
- Old crop context leaking into a new crop question.
- Old specialist context leaking into a new topic.
- Crop Doctor handoffs falling into fertilizer or planting because of unrelated words.
- Weather flows pretending live weather is known.
- Fertilizer answers inventing exact dosages.
- Harvest answers inventing shelf life, prices or buyer availability.
- Planting answers inventing weather, prices, profit or guaranteed yield.
- Plant Health answers jumping to chemicals before prevention and field checks.

Launch readiness checks:
- Every final response must have exactly one next best action.
- Confidence labels remain internal.
- Answers must be short, practical and farmer-facing.
- Follow-up answers already provided should not be asked again.
- Local FarmMate Brain output remains the source of truth; the OpenAI layer only explains the approved local context.
