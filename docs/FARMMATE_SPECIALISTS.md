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
- Can I harvest before rain?
- Can I dry produce outside?

Routing rules:
- Questions with spray, spraying, rain, rainfall, wind, windy, weather, irrigate, irrigation, water today, wet leaves, dry leaves, heavy rain, harvest before rain, dry produce, fertilize before rain, or apply fertilizer before rain route to Weather Decision.
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
- Recommend harvesting mature produce before rain when rain may damage quality.
- Recommend drying produce outside only when rain risk is low and the produce can be protected quickly.

V1 limitation:
- FarmMate does not yet connect to live weather data inside the local Brain. It must not say "rain is coming today" unless the farmer or a real Farm Summary context provides that information.

## Planting Advisor Specialist

Handles planting timing, crop choice, spacing, sowing, nursery and transplanting, and basic land preparation questions.

Example questions:
- What should I plant this month?
- Can I plant tomatoes now?
- Best spacing for pepper?
- When should I plant maize?
- When should I transplant tomatoes?

Routing rules:
- Questions with plant, planting, sow, sowing, transplant, nursery, spacing, seed spacing, planting season, what should I plant, crop to grow, best time to plant or land preparation route to Planting Advisor.
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
- Ask one useful follow-up question when crop, region, season, water or land preparation is missing.
- Encourage healthy seed or planting material, good drainage, crop rotation, spacing for airflow and compost or organic matter where available.
- Warn against planting into waterlogged soil.
- Warn against transplanting during extreme heat.
- Recommend planting after steady rains where appropriate, not after one uncertain shower.

V1 limitation:
- FarmMate does not yet have live local weather or market demand inside the local Brain. Planting advice must use farmer-provided rain, irrigation, region and field preparation context, and avoid claiming a crop is the guaranteed best, most profitable or highest-yield choice.
