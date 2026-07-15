# GG FarmMate Pilot Testing

## Goal

Use a small controlled pilot to learn whether GG FarmMate gives farmers clear, practical next steps before wider public launch.

## Suggested Tester Group

Start with 5-10 farmers from different crop and region contexts. Include farmers who can test text questions, weather decisions, Crop Doctor guidance and learning support.

## What Testers Should Try

- Ask a plant health question, such as yellow leaves or curling leaves.
- Ask a fertilizer question for maize, tomato, pepper or another familiar crop.
- Ask a weather decision question, such as whether to spray today.
- Upload a crop photo to Crop Doctor.
- Try planting, harvest and storage questions.
- Use the Crop Calendar, Planting Advisor and learning links.

## Feedback Questions

The pilot feedback form asks:

- Name or nickname, optional
- Region, optional
- Main crop, optional
- What did you test?
- Was FarmMate helpful?
- What confused you?
- What should we improve?
- Would you use FarmMate again?

## Known Limitations To Explain

- There is no farmer login yet.
- Crop Doctor gives guidance, not a guaranteed diagnosis.
- Weather is location-based, not saved-farm personalized.
- Market Prices are not included in V1.
- Farm history is not saved yet.

## Reviewing Feedback In Supabase

Feedback is stored in `public.farmmate_pilot_feedback` when Supabase is configured and the table exists. Review newest feedback first:

```sql
select
  created_at,
  name_or_nickname,
  region,
  main_crop,
  tested_feature,
  helpfulness,
  confusion,
  improvement,
  would_use_again
from public.farmmate_pilot_feedback
order by created_at desc;
```

Do not ask testers to submit phone numbers, exact farm locations or private farmer records through this pilot feedback form.
