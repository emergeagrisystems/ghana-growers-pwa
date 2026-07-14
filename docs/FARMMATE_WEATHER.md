# FarmMate Weather Foundation

GG FarmMate uses weather to support farming decisions. It is not a weather app.

## V1 Approach

- Farmer Hub requests a compact 3-day forecast from `/api/farmmate/weather`.
- The API route validates either a supported Ghana location key or one-time browser coordinates.
- Weather is fetched server-side through a provider abstraction.
- The current fallback provider is Open-Meteo, which does not require a paid API key.
- The browser receives only the simple FarmMate forecast needed for farming guidance.
- If weather cannot be fetched, Farmer Hub shows a friendly unavailable state and keeps the local daily Farm Summary.

## Supported Locations

- Accra / Greater Accra
- Kumasi / Ashanti
- Tamale / Northern
- Cape Coast / Central
- Takoradi / Western
- Ho / Volta
- Koforidua / Eastern
- Sunyani / Bono

## Privacy

- No login is required.
- A selected location key can be stored in localStorage so the farmer does not need to choose it again.
- Browser geolocation is requested only through the normal browser permission flow.
- Exact browser coordinates are used in memory for the weather request and are not stored permanently by FarmMate V1.
- FarmMate stores only a friendly weather context summary for Ask FarmMate decisions.
- Location is not saved as a farmer profile location in V1.

## Weather Decision Specialist

- If live weather context is available, Ask FarmMate can pass that summary into the Weather Decision Specialist and OpenAI voice layer.
- The specialist must not invent extra rain, wind, temperature or forecast details.
- If weather context is missing or unavailable, the specialist keeps the guided checks:
  - Is rain expected?
  - Is the wind calm?
  - Are the leaves dry?

## Future Plan

- Add personalized farm locations after login exists.
- Add richer provider support if Ghana Growers chooses a paid weather provider.
- Combine live weather, crop calendar and farmer preferences for more personalized daily guidance.
