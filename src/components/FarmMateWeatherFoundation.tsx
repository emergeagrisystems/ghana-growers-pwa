"use client";

import { ChevronRight, Cloud, CloudFog, CloudLightning, Snowflake, Thermometer, CloudRain, CloudSun, Loader2, LocateFixed, MapPin, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import styles from "./AdviserWorkspace.module.css";
import { FarmMateDecisionStatus, type FarmMateDecisionStatusValue } from "@/components/FarmMateDecisionStatus";
import { todayFarmDecision, type FarmTaskChecks } from "@/lib/farmmate/experience-decisions";
import type { WeatherDecisionTask } from "@/lib/farmmate/weather-decision-specialist";
import type { FarmMateToolHandoff } from "@/lib/farmmate/tool-handoff";
import {
  FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY,
  FARM_MATE_WEATHER_LOCATION_STORAGE_KEY,
  FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE,
  currentWeatherCondition,
  storedWeatherContextFromForecast,
  supportedFarmMateWeatherLocations,
  type FarmMateWeatherForecast
} from "@/lib/farmmate/weather";

type WeatherRequest =
  | {
      type: "location";
      locationKey: string;
    }
  | {
      type: "browser";
      latitude: number;
      longitude: number;
      label: string;
    };

type WeatherApiResponse = {
  ok?: boolean;
  forecast?: FarmMateWeatherForecast;
  message?: string;
};

// A browser can deny storage while still allowing a live area-only forecast.
function weatherPreference(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function saveWeatherPreference(key: string, value?: string) {
  try {
    if (value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch { /* Keep the current forecast in memory for this visit. */ }
}

function temperatureLine(day: FarmMateWeatherForecast["days"][number]) {
  if (typeof day.temperatureMinC === "number" && typeof day.temperatureMaxC === "number") {
    return `${day.temperatureMinC}-${day.temperatureMaxC}\u00b0C`;
  }

  if (typeof day.temperatureMaxC === "number") {
    return `${day.temperatureMaxC}\u00b0C`;
  }

  return "--";
}

function mainTemperatureLine(day: FarmMateWeatherForecast["days"][number], currentTemperatureC?: number) {
  const temperature = currentTemperatureC ?? day.temperatureMaxC ?? day.temperatureMinC;

  return typeof temperature === "number" ? `${temperature}\u00b0C` : "--";
}

function rainLine(day: FarmMateWeatherForecast["days"][number]) {
  return typeof day.rainChancePercent === "number" ? `${day.rainChancePercent}% chance of rain` : "Rain chance unavailable";
}

function updatedLine(forecast: FarmMateWeatherForecast, stale: boolean) {
  const updated = new Date(forecast.lastUpdatedAt);

  if (Number.isNaN(updated.getTime())) {
    return `Forecast for ${forecast.location.name} · update time unavailable`;
  }

  const label = stale ? "Previous forecast" : forecast.observedAt ? "Live weather:" : "Forecast retrieved";
  return `${label} ${forecast.location.name} · ${updated.toLocaleString("en-GH", {
    timeZone: "Africa/Accra", day: "numeric", month: "short",
    hour: "numeric",
    minute: "2-digit"
  })} GMT`;
}

function requestUrl(request: WeatherRequest) {
  const params = new URLSearchParams();

  if (request.type === "location") {
    params.set("locationKey", request.locationKey);
  } else {
    params.set("latitude", String(request.latitude));
    params.set("longitude", String(request.longitude));
    params.set("label", request.label);
  }

  return `/api/farmmate/weather?${params.toString()}`;
}

export function useFarmWeather() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(clock);
  }, []);
  const [request, setRequest] = useState<WeatherRequest>({ type: "location", locationKey: "" });
  const [forecast, setForecast] = useState<FarmMateWeatherForecast | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const selectedLocationKey = request.type === "location" ? request.locationKey : "browser-location";
  const selectedLocationLabel = useMemo(() => {
    if (request.type === "browser") {
      return request.label;
    }

    const location = supportedFarmMateWeatherLocations.find((item) => item.key === request.locationKey);
    return location?.name ?? "Choose your area";
  }, [request]);

  useEffect(() => {
    const savedLocation = weatherPreference(FARM_MATE_WEATHER_LOCATION_STORAGE_KEY);
    const location = supportedFarmMateWeatherLocations.find((item) => item.key === savedLocation);

    if (location) {
      setRequest({ type: "location", locationKey: location.key });
    }
  }, []);

  useEffect(() => {
    if (request.type === "location" && !request.locationKey) return;
    let cancelled = false;

    async function loadForecast() {
      setIsLoading(true);
      setForecast(null);
      saveWeatherPreference(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY);
      setMessage("");

      try {
        const response = await fetch(requestUrl(request));
        const data = (await response.json().catch(() => null)) as WeatherApiResponse | null;

        if (cancelled) {
          return;
        }

        if (response.ok && data?.ok && data.forecast?.location?.name && Array.isArray(data.forecast.days) && data.forecast.days.length === 3) {
          setForecast(data.forecast);
          const summary = storedWeatherContextFromForecast(data.forecast);
          saveWeatherPreference(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY, JSON.stringify(summary));
          return;
        }

        setForecast(null);
        saveWeatherPreference(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY);
        setMessage(data?.message || FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE);
      } catch {
        if (!cancelled) {
          setForecast(null);
          saveWeatherPreference(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY);
          setMessage(FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadForecast();

    return () => {
      cancelled = true;
    };
  }, [request, selectedLocationKey]);

  function selectLocation(locationKey: string) {
    setForecast(null);
    setIsLoading(true);
    saveWeatherPreference(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY);
    saveWeatherPreference(FARM_MATE_WEATHER_LOCATION_STORAGE_KEY, locationKey);
    setRequest({ type: "location", locationKey });
  }

  function requestBrowserLocation() {
    if (!navigator.geolocation) {
      const denial = "Location wasn't shared. Choose the nearest area instead.";
      setMessage(denial);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForecast(null);
        setIsLoading(true);
        saveWeatherPreference(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY);
        saveWeatherPreference(FARM_MATE_WEATHER_LOCATION_STORAGE_KEY);
        setRequest({
          type: "browser",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: "Your current area"
        });
        setIsLocating(false);
      },
      () => {
        const denial = "Location wasn't shared. Choose the nearest area instead.";
        setMessage(denial);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 900000
      }
    );
  }

  const age = forecast ? now - Date.parse(forecast.lastUpdatedAt) : 0;
  const stale = Boolean(forecast && (!Number.isFinite(age) || age > 3 * 60 * 60_000 || age < -10 * 60_000));
  return {request, forecast, message, isLoading, isLocating, selectedLocationKey, selectedLocationLabel, selectLocation, requestBrowserLocation, stale};
}

type WeatherState = ReturnType<typeof useFarmWeather>;

function currentReading(weather: WeatherState) {
  const {forecast, stale} = weather;
  const label = !stale && forecast?.observedAt ? currentWeatherCondition(forecast.currentWeatherCode) : undefined;
  const Icon = label === "Clear" || label === "Mainly clear" ? Sun : label === "Partly cloudy" ? CloudSun :
    label === "Overcast" ? Cloud : label === "Fog" ? CloudFog : label === "Thunderstorm" ? CloudLightning :
    label === "Snow" ? Snowflake : label ? CloudRain : Thermometer;
  const temperature = !stale && forecast?.observedAt && typeof forecast.currentTemperatureC === "number" ? forecast.currentTemperatureC + "°C" : "";
  const text = stale ? "Weather out of date" : weather.isLoading ? "Updating…" : [temperature,label].filter(Boolean).join(" · ") || "Current weather unavailable";
  return {Icon, text};
}

export function WeatherShortcut({weather,onOpen}:{weather: WeatherState; onOpen: () => void}) {
  const {Icon,text} = currentReading(weather);
  return <button type="button" className={styles.weatherShortcut} onClick={onOpen}>
    <Icon size={19} aria-hidden="true" /><strong>{weather.selectedLocationLabel}</strong>
    <span>{weather.selectedLocationKey ? text : "Farm weather"}</span><ChevronRight size={16} aria-hidden="true" />
  </button>;
}

export function FarmMateWeatherFoundation({weather,compact = false}: {weather: WeatherState; compact?: boolean}) {
  const {request,forecast,message,isLoading,isLocating,selectedLocationKey,selectedLocationLabel,selectLocation,requestBrowserLocation,stale} = weather;
  const {text} = currentReading(weather);
  if (compact) {
    const today = forecast?.days[0];
    return <section className={styles.weatherStrip} aria-label="Farm weather">
      <label htmlFor="workspace-weather-area"><CloudSun size={19} aria-hidden="true" /> Farm weather</label>
      <select id="workspace-weather-area" value={selectedLocationKey} onChange={event => selectLocation(event.target.value)}>
        <option disabled value="">Choose your area</option>
        {request.type === "browser" && <option value="browser-location">Your current area</option>}
        {supportedFarmMateWeatherLocations.map(area => <option value={area.key} key={area.key}>{area.name}</option>)}
      </select>
      <div role="status" className={styles.weatherStatus}>
        {isLoading && "Checking live weather…"}
        {message && <p>{message} {request.type === "location" && selectedLocationKey &&
          <button type="button" className="min-h-11 underline" onClick={() => selectLocation(selectedLocationKey)}>Try again</button>}</p>}
        {forecast && today && <>
          <strong>{text}</strong>
          <small>{updatedLine(forecast, stale)}</small>
          <details><summary>{stale ? "Previous forecast" : "3-day forecast"}</summary>
            {forecast.days.map(day => <p key={day.date}>{stale ? day.date : day.label} · {temperatureLine(day)} · {rainLine(day)}</p>)}
          </details>
        </>}
      </div>
    </section>;
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-md border border-leaf-900/10 bg-white/95 p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className="text-leaf-700" size={18} aria-hidden="true" />
            <div>
              <h2 className="gg-eyebrow text-leaf-700">{stale ? "Previous forecast" : "3-day forecast"}</h2>
              {forecast && <p className="text-sm font-bold">{text}</p>}
              <p className="mt-1 text-xs font-bold text-ink/55">
                {forecast ? updatedLine(forecast, stale) : isLoading ? `Checking weather for ${selectedLocationLabel}` : "Weather guidance"}
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:min-w-[16rem]">
            <label className="sr-only" htmlFor="farmmate-weather-location">
              Choose weather location
            </label>
            <select
              id="farmmate-weather-location"
              className="gg-field min-h-10 bg-white px-3 py-2 text-xs font-black"
              value={selectedLocationKey}
              onChange={(event) => selectLocation(event.target.value)}
            >
              <option disabled value="">Choose your area</option>
              {request.type === "browser" ? <option value="browser-location">Your current area</option> : null}
              {supportedFarmMateWeatherLocations.map((location) => (
                <option key={location.key} value={location.key}>
                  {location.name} / {location.region}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={requestBrowserLocation}
              disabled={isLocating}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50 disabled:cursor-wait disabled:text-ink/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
            >
              {isLocating ? <Loader2 className="animate-spin" size={14} aria-hidden="true" /> : <LocateFixed size={14} aria-hidden="true" />}
              Use my location
            </button>
          </div>
        </div>

        {(message || stale) && request.type === "location" && request.locationKey && <button type="button" className="min-h-11 text-sm font-bold text-leaf-700 underline" onClick={() => selectLocation(request.locationKey)}>Refresh forecast</button>}
        {message && forecast ? <p role="status" className="mt-3 rounded-md bg-earth-50 px-3 py-2 text-xs font-bold text-ink">{message}</p> : null}
        {isLoading ? (
          <div className="mt-3 flex min-h-24 items-center justify-center rounded-md bg-white text-sm font-black text-ink/60 shadow-sm ring-1 ring-leaf-900/5 sm:min-h-28">
            <Loader2 className="mr-2 animate-spin text-leaf-700" size={18} aria-hidden="true" />
            Loading live weather...
          </div>
        ) : forecast ? (
          <>
            <div className="mt-3 grid gap-1.5 sm:hidden" aria-label="Compact 3-day weather forecast">
              {forecast.days.map((day, index) => (
                <div key={day.date} className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-md bg-white px-3 py-2.5 shadow-sm ring-1 ring-leaf-900/5">
                  <p className="min-w-0 text-xs font-black leading-4 text-ink/72">{stale ? day.date : day.label}</p>
                  <p className="text-sm font-black text-leaf-900">{mainTemperatureLine(day, index === 0 ? forecast.currentTemperatureC : undefined)}</p>
                  <p className="text-right text-[0.68rem] font-bold leading-4 text-ink/58">{rainLine(day)}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 hidden grid-cols-3 gap-2 sm:grid" aria-label="Detailed 3-day weather forecast">
              {forecast.days.map((day) => (
                <div key={day.date} className="flex min-h-28 flex-col items-center justify-center rounded-md bg-white px-3 py-3 text-center shadow-sm ring-1 ring-leaf-900/5">
                  <div className="flex items-center justify-center gap-1.5 text-ink/70">
                    <Sun size={15} strokeWidth={2.2} className="shrink-0 text-leaf-700" aria-hidden="true" />
                    <p className="text-xs font-bold leading-tight">{stale ? day.date : day.label}</p>
                  </div>
                  <p className="mt-3 text-2xl font-bold leading-none text-leaf-900">{temperatureLine(day)}</p>
                  <p className="mt-3 text-xs font-bold leading-4 text-ink/58">{rainLine(day)}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-3 rounded-md bg-white px-4 py-4 text-sm font-bold leading-6 text-ink/66 shadow-sm ring-1 ring-leaf-900/5">
            <div className="flex gap-2">
              <MapPin className="mt-0.5 shrink-0 text-leaf-700" size={16} aria-hidden="true" />
              <p>{message || (selectedLocationKey ? FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE : "Choose your area to see the forecast.")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const taskChoices: Array<{ task: WeatherDecisionTask; label: string }> = [
  { task: "spraying", label: "Spray" },
  { task: "planting-before-rain", label: "Plant" },
  { task: "fertilizer-before-rain", label: "Apply fertilizer" },
  { task: "irrigation", label: "Water / irrigate" },
  { task: "harvesting-before-rain", label: "Harvest" },
  { task: "drying-produce", label: "Dry produce" }
];

type TaskQuestion = { key: keyof FarmTaskChecks; label: string; choices: Array<{ value: string; label: string }> };
const fieldQuestions: Partial<Record<WeatherDecisionTask, TaskQuestion[]>> = {
  spraying: [
    { key: "rainWindow", label: "Rain in the next 4–6 hours?", choices: [{ value: "unknown", label: "Not sure" }, { value: "rain", label: "Likely" }, { value: "clear", label: "No rain expected" }] },
    { key: "wind", label: "Wind at the field?", choices: [{ value: "unknown", label: "Not sure" }, { value: "strong", label: "Strong" }, { value: "calm", label: "Calm" }] },
    { key: "leaves", label: "Leaves now?", choices: [{ value: "unknown", label: "Not sure" }, { value: "wet", label: "Wet" }, { value: "dry", label: "Dry" }] }
  ],
  "planting-before-rain": [
    { key: "soil", label: "Soil at the field?", choices: [{ value: "unknown", label: "Not sure" }, { value: "moist", label: "Moist" }, { value: "dry", label: "Dry" }, { value: "waterlogged", label: "Waterlogged" }] },
    { key: "drainage", label: "Does the field drain?", choices: [{ value: "unknown", label: "Not sure" }, { value: "good", label: "Yes" }, { value: "poor", label: "Poorly" }] }
  ],
  "fertilizer-before-rain": [
    { key: "soil", label: "Soil at the field?", choices: [{ value: "unknown", label: "Not sure" }, { value: "moist", label: "Moist" }, { value: "dry", label: "Dry" }, { value: "waterlogged", label: "Waterlogged" }] },
    { key: "heavyRainSoon", label: "Heavy rain expected soon?", choices: [{ value: "unknown", label: "Not sure" }, { value: "yes", label: "Yes" }, { value: "no", label: "No" }] }
  ],
  irrigation: [
    { key: "soil", label: "Soil near the roots?", choices: [{ value: "unknown", label: "Not sure" }, { value: "dry", label: "Dry" }, { value: "moist", label: "Moist" }, { value: "waterlogged", label: "Waterlogged" }] },
    { key: "heavyRainSoon", label: "Useful rain expected soon?", choices: [{ value: "unknown", label: "Not sure" }, { value: "yes", label: "Yes" }, { value: "no", label: "No" }] }
  ],
  "harvesting-before-rain": [
    { key: "maturity", label: "Is the crop mature?", choices: [{ value: "unknown", label: "Not sure" }, { value: "ready", label: "Yes" }, { value: "not-ready", label: "Not yet" }] },
    { key: "keepDry", label: "Can you keep the harvest dry?", choices: [{ value: "unknown", label: "Not sure" }, { value: "yes", label: "Yes" }, { value: "no", label: "No" }] }
  ],
  "drying-produce": [
    { key: "coveredArea", label: "Clean covered drying area?", choices: [{ value: "unknown", label: "Not sure" }, { value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
    { key: "heavyRainSoon", label: "Rain expected during drying?", choices: [{ value: "unknown", label: "Not sure" }, { value: "yes", label: "Yes" }, { value: "no", label: "No" }] }
  ]
};

function weatherAskQuestion(task: WeatherDecisionTask | "") {
  const questions: Partial<Record<WeatherDecisionTask, string>> = {
    spraying: "Can I spray today?",
    "planting-before-rain": "Can I plant today?",
    "fertilizer-before-rain": "Can I apply fertilizer before rain?",
    irrigation: "Should I irrigate today?",
    "harvesting-before-rain": "Can I harvest before rain?",
    "drying-produce": "Can I dry produce outside today?"
  };
  return task ? questions[task] ?? "What should I check about today's farm conditions?" : "What should I check about today's farm conditions?";
}

export function CanIFarmTodayExperience({
  weatherState,
  onAskFarmMateAboutThis,
  onOpenPlantingAdvisor
}: {
  onAskFarmMateAboutThis: (handoff: FarmMateToolHandoff) => void;
  onOpenPlantingAdvisor: (checks: FarmTaskChecks) => void;
  weatherState: WeatherState;
}) {
  const weather = weatherState.stale ? null : weatherState.forecast?.decisionSummary ?? null;
  const [selectedTask, setSelectedTask] = useState<WeatherDecisionTask | "">("");
  const [checks, setChecks] = useState<FarmTaskChecks>({});

  const decision = selectedTask ? todayFarmDecision(selectedTask, weather, checks) : null;
  const selectedLabel = taskChoices.find((choice) => choice.task === selectedTask)?.label ?? "this task";
  const rain = weather?.rainChancePercent;
  const RainIcon = currentReading(weatherState).Icon;

  return <article id="can-i-farm-today" className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-soft sm:p-6">
    <h2 className="mb-3 text-lg font-bold">Can I Farm Today?</h2>
    <div className="flex items-center gap-2 rounded-md bg-leaf-50 px-3 py-3 text-sm font-bold text-ink">
      <RainIcon size={20} className={`shrink-0 ${typeof rain === "number" && rain >= 40 ? "text-sky-700" : "text-earth-700"}`} aria-hidden="true" />
      <span>{weather ? `${weather.locationName} · ${typeof rain === "number" ? `${rain}% daily rain chance` : "Rain chance unavailable"}` : "Live weather unavailable"}</span>
    </div>
    <p className="mt-2 text-xs font-semibold text-ink/60">{weather ? `Updated ${new Date(weather.lastUpdatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. Daily probability does not show exact rain timing or your field.` : "Choose the nearest area and check conditions at your field."}</p>

    <h2 className="mt-5 text-base font-black text-ink">What do you want to do today?</h2>
    <div className="mt-3 grid grid-cols-2 gap-2">
      {taskChoices.map(({ task, label }) => <button key={task} type="button" aria-pressed={selectedTask === task} onClick={() => { setSelectedTask(task); setChecks({}); }} className={`min-h-12 rounded-md border px-3 py-2 text-left text-sm font-black ${selectedTask === task ? "border-leaf-700 bg-leaf-50 text-leaf-900" : "border-leaf-900/15 bg-white text-leaf-700"}`}>{label}</button>)}
    </div>
    {selectedTask ? <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {(fieldQuestions[selectedTask] ?? []).map((field) => <label key={field.key} className="grid gap-1 text-sm font-black text-ink">{field.label}
        <select className="gg-field min-h-11" value={checks[field.key] ?? "unknown"} onChange={(event) => setChecks((current) => ({ ...current, [field.key]: event.target.value }))}>{field.choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select>
      </label>)}
    </div> : null}
    {decision ? <section className="mt-5 rounded-md bg-leaf-50 p-4" aria-live="polite">
      <FarmMateDecisionStatus status={decision.status as FarmMateDecisionStatusValue} />
      <p className="mt-3 text-sm font-semibold leading-6 text-ink/75">{decision.why}</p>
      <p className="mt-3 text-sm font-black text-ink">Check first</p><p className="mt-1 text-sm font-semibold leading-6 text-ink/75">{decision.check}</p>
      <p className="mt-3 text-sm font-black text-ink">Next action</p><p className="mt-1 text-sm font-semibold leading-6 text-ink/75">{decision.next}</p>
      <div className="mt-4 grid gap-2">
        {selectedTask === "planting-before-rain" ? <button type="button" onClick={() => onOpenPlantingAdvisor(checks)} className="min-h-11 rounded-md bg-leaf-600 px-3 text-sm font-black text-white">Check planting readiness</button> : null}
        <button type="button" onClick={() => onAskFarmMateAboutThis({ source: "weather", question: weatherAskQuestion(selectedTask), chips: [weather?.locationName ?? "Area unknown", typeof rain === "number" ? `${rain >= 60 ? "High" : rain >= 30 ? "Medium" : "Low"} rain chance` : "Rain chance unknown", selectedLabel], region: weather?.locationName, task: selectedLabel, status: decision.status, fieldNotes: Object.entries(checks).map(([key, value]) => `${key}: ${value}`).slice(0, 6) })} className="min-h-11 rounded-md border border-leaf-700 bg-white px-3 text-sm font-black text-leaf-700">Ask Mama G about {selectedLabel.toLowerCase()}</button>
      </div>
    </section> : null}
  </article>;
}
