# FarmMate Daily Summary

Today's Farm Summary is currently powered by local static FarmMate data.

## Current behavior

- The summary rotates by the user's local calendar date.
- The same day returns the same summary.
- The next day can return a different summary.
- The summary uses the browser's local time to avoid showing morning-only advice in the evening or at night.
- The local time windows are:
  - Morning: 5:00 AM to 11:59 AM
  - Afternoon: 12:00 PM to 4:59 PM
  - Evening: 5:00 PM to 8:59 PM
  - Night: 9:00 PM to 4:59 AM

## V1 limitations

- No AI is used to generate the summary.
- No live weather API is used for the summary.
- Rain wording must stay conditional, for example "If rain is likely..." or "Check if rain is expected...".
- FarmMate must not invent live timestamps, live locations, forecasts or personalized farm conditions.

## Future plan

Future versions can make the summary weather-aware and more personalized when real location, weather and farmer preference data are available.
