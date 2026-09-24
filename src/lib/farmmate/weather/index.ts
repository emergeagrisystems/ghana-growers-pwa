export type FarmMateWeatherLocation = {
  key: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
};

export type DailyForecast = {
  date: string;
  label: "Today" | "Tomorrow" | "Day after tomorrow";
  temperatureMinC?: number;
  temperatureMaxC?: number;
  rainChancePercent?: number;
  humidityPercent?: number;
  windSpeedKph?: number;
  farmingNote: string;
};

export type WeatherDecisionSummary = {
  locationName: string;
  sourceLabel: string;
  lastUpdatedAt: string;
  rainChancePercent?: number;
  temperatureMinC?: number;
  temperatureMaxC?: number;
  windSpeedKph?: number;
  farmingNotes: string[];
  summaryNote: string;
  liveWeatherAvailable: boolean;
};

export type FarmMateWeatherForecast = {
  location: FarmMateWeatherLocation;
  currentTemperatureC?: number;
  rainChancePercent?: number;
  humidityPercent?: number;
  windSpeedKph?: number;
  today: DailyForecast;
  tomorrow: DailyForecast;
  dayAfterTomorrow: DailyForecast;
  days: DailyForecast[];
  sourceLabel: string;
  lastUpdatedAt: string;
  decisionSummary: WeatherDecisionSummary;
};

export type FarmMateWeatherRequest =
  | {
      locationKey: string;
      latitude?: never;
      longitude?: never;
    }
  | {
      locationKey?: never;
      latitude: number;
      longitude: number;
      label?: string;
    };

export type FarmMateWeatherResult =
  | {
      ok: true;
      forecast: FarmMateWeatherForecast;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

type OpenMeteoForecastResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    time?: string;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
  };
};

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

export const FARM_MATE_WEATHER_LOCATION_STORAGE_KEY = "gg-farmmate-weather-location";
export const FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY = "gg-farmmate-weather-context";
export const FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE =
  "Live weather is temporarily unavailable. FarmMate can still guide you using field conditions.";

export const supportedFarmMateWeatherLocations: FarmMateWeatherLocation[] = [
  { key: "accra", name: "Accra", region: "Greater Accra", latitude: 5.6037, longitude: -0.187 },
  { key: "kumasi", name: "Kumasi", region: "Ashanti", latitude: 6.6885, longitude: -1.6244 },
  { key: "tamale", name: "Tamale", region: "Northern", latitude: 9.4075, longitude: -0.8533 },
  { key: "cape-coast", name: "Cape Coast", region: "Central", latitude: 5.1053, longitude: -1.2466 },
  { key: "takoradi", name: "Takoradi", region: "Western", latitude: 4.8845, longitude: -1.7554 },
  { key: "ho", name: "Ho", region: "Volta", latitude: 6.6113, longitude: 0.4708 },
  { key: "koforidua", name: "Koforidua", region: "Eastern", latitude: 6.0941, longitude: -0.2591 },
  { key: "sunyani", name: "Sunyani", region: "Bono", latitude: 7.3349, longitude: -2.3123 }
];

function roundNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : undefined;
}

function locationLabel(location: Pick<FarmMateWeatherLocation, "name" | "region">) {
  return location.region ? `${location.name} / ${location.region}` : location.name;
}

export function findSupportedWeatherLocation(locationKey?: string | null) {
  return supportedFarmMateWeatherLocations.find((location) => location.key === locationKey);
}

export function validateFarmMateWeatherRequest(input: {
  locationKey?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  label?: unknown;
}):
  | {
      ok: true;
      location: FarmMateWeatherLocation;
    }
  | {
      ok: false;
      status: number;
      message: string;
    } {
  if (typeof input.locationKey === "string" && input.locationKey.trim()) {
    const location = findSupportedWeatherLocation(input.locationKey.trim());

    if (!location) {
      return { ok: false, status: 400, message: "Choose a supported Ghana weather location." };
    }

    return { ok: true, location };
  }

  const latitude = typeof input.latitude === "number" ? input.latitude : Number(input.latitude);
  const longitude = typeof input.longitude === "number" ? input.longitude : Number(input.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false, status: 400, message: "Choose a location or allow browser location for weather guidance." };
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { ok: false, status: 400, message: "The selected coordinates are not valid." };
  }

  const label = typeof input.label === "string" && input.label.trim() ? input.label.trim().slice(0, 80) : "Your current area";

  return {
    ok: true,
    location: {
      key: "browser-location",
      name: label,
      region: "",
      latitude,
      longitude
    }
  };
}

function farmingNoteForWeather({
  rainChancePercent,
  windSpeedKph
}: {
  rainChancePercent?: number;
  windSpeedKph?: number;
}) {
  if (typeof rainChancePercent === "number" && rainChancePercent >= 60) {
    return "Avoid spraying before rain.";
  }

  if (typeof windSpeedKph === "number" && windSpeedKph >= 25) {
    return "Avoid spraying in strong wind.";
  }

  if (
    typeof rainChancePercent === "number" &&
    rainChancePercent <= 25 &&
    (typeof windSpeedKph !== "number" || windSpeedKph <= 18)
  ) {
    return "Good time to inspect crops early.";
  }

  return "Check field conditions before spraying or fertilizer work.";
}

export function weatherDecisionSummaryForForecast(forecast: Pick<FarmMateWeatherForecast, "location" | "sourceLabel" | "lastUpdatedAt" | "today">): WeatherDecisionSummary {
  const notes = [
    farmingNoteForWeather({
      rainChancePercent: forecast.today.rainChancePercent,
      windSpeedKph: forecast.today.windSpeedKph
    })
  ];

  if (typeof forecast.today.rainChancePercent === "number" && forecast.today.rainChancePercent >= 60) {
    notes.push("Check drainage in low areas.");
  }

  if (typeof forecast.today.windSpeedKph === "number" && forecast.today.windSpeedKph >= 25) {
    notes.push("Wait for calmer wind before spraying.");
  }

  return {
    locationName: locationLabel(forecast.location),
    sourceLabel: forecast.sourceLabel,
    lastUpdatedAt: forecast.lastUpdatedAt,
    rainChancePercent: forecast.today.rainChancePercent,
    temperatureMinC: forecast.today.temperatureMinC,
    temperatureMaxC: forecast.today.temperatureMaxC,
    windSpeedKph: forecast.today.windSpeedKph,
    farmingNotes: notes.slice(0, 3),
    summaryNote: notes[0],
    liveWeatherAvailable: true
  };
}

function forecastDayLabel(index: number): DailyForecast["label"] {
  if (index === 0) {
    return "Today";
  }

  if (index === 1) {
    return "Tomorrow";
  }

  return "Day after tomorrow";
}

export function mapOpenMeteoForecast(data: OpenMeteoForecastResponse, location: FarmMateWeatherLocation): FarmMateWeatherForecast | null {
  const dates = data.daily?.time ?? [];
  const days = dates.slice(0, 3).map((date, index) => {
    const rainChancePercent = roundNumber(data.daily?.precipitation_probability_max?.[index]);
    const windSpeedKph = roundNumber(data.daily?.wind_speed_10m_max?.[index]);

    return {
      date,
      label: forecastDayLabel(index),
      temperatureMinC: roundNumber(data.daily?.temperature_2m_min?.[index]),
      temperatureMaxC: roundNumber(data.daily?.temperature_2m_max?.[index]),
      rainChancePercent,
      windSpeedKph,
      farmingNote: farmingNoteForWeather({ rainChancePercent, windSpeedKph })
    };
  });

  if (days.length !== 3) {
    return null;
  }

  const lastUpdatedAt = data.current?.time ? new Date(data.current.time).toISOString() : new Date().toISOString();
  const forecastWithoutSummary = {
    location,
    currentTemperatureC: roundNumber(data.current?.temperature_2m),
    rainChancePercent: days[0].rainChancePercent,
    humidityPercent: roundNumber(data.current?.relative_humidity_2m),
    windSpeedKph: roundNumber(data.current?.wind_speed_10m),
    today: days[0],
    tomorrow: days[1],
    dayAfterTomorrow: days[2],
    days,
    sourceLabel: "Open-Meteo",
    lastUpdatedAt
  };

  return {
    ...forecastWithoutSummary,
    decisionSummary: weatherDecisionSummaryForForecast(forecastWithoutSummary)
  };
}

function openMeteoUrl(location: FarmMateWeatherLocation) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
    timezone: "auto",
    forecast_days: "3"
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export async function getFarmMateWeatherForecast(request: FarmMateWeatherRequest): Promise<FarmMateWeatherResult> {
  const resolved = validateFarmMateWeatherRequest(request);

  if (!resolved.ok) {
    return resolved;
  }

  try {
    const requestInit: NextFetchInit = {
      headers: {
        Accept: "application/json"
      },
      next: {
        revalidate: 900
      }
    };
    const response = await fetch(openMeteoUrl(resolved.location), requestInit);

    if (!response.ok) {
      return { ok: false, status: 503, message: FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE };
    }

    const data = (await response.json()) as OpenMeteoForecastResponse;
    const forecast = mapOpenMeteoForecast(data, resolved.location);

    if (!forecast) {
      return { ok: false, status: 503, message: FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE };
    }

    return { ok: true, forecast };
  } catch {
    return { ok: false, status: 503, message: FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE };
  }
}

export function storedWeatherContextFromForecast(forecast: FarmMateWeatherForecast): WeatherDecisionSummary {
  return forecast.decisionSummary;
}
