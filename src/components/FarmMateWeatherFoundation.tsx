"use client";

import { ChevronRight, Cloud, CloudFog, CloudLightning, Snowflake, Thermometer, CloudRain, CloudSun, Droplets, Leaf, LocateFixed, Shovel, SprayCan, Sprout, Sun, type LucideIcon } from "lucide-react";
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
  const {text, Icon} = currentReading(weather);
  const [choosingArea, setChoosingArea] = useState(false);
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

  return <section className={styles.todayWeather} aria-label="Area weather">
    <div className={styles.weatherHeader}>
      {selectedLocationKey && <h2>{selectedLocationLabel}</h2>}
      <button type="button" className={styles.textAction} aria-expanded={choosingArea} aria-controls="today-area-picker" onClick={() => setChoosingArea(!choosingArea)}>
        {selectedLocationKey ? "Change area" : "Choose your area"}
      </button>
    </div>
    <div id="today-area-picker" hidden={!choosingArea} className={styles.areaPicker}>
      <label htmlFor="farmmate-weather-location">Nearest area</label>
      <select id="farmmate-weather-location" className="gg-field" value={selectedLocationKey} onChange={event => {selectLocation(event.target.value); setChoosingArea(false);}}>
        <option disabled value="">Choose your area</option>
        {request.type === "browser" && <option value="browser-location">Your current area</option>}
        {supportedFarmMateWeatherLocations.map(area => <option key={area.key} value={area.key}>{area.name} / {area.region}</option>)}
      </select>
      <button type="button" className={styles.textAction} disabled={isLocating} onClick={requestBrowserLocation}><LocateFixed size={16} aria-hidden="true" />{isLocating ? "Finding area…" : "Use my location"}</button>
    </div>
    <div role="status">
      {isLoading && <p>Loading live weather...</p>}
      {message && <p>{message}</p>}
      {forecast && <p className={styles.observation}><Icon size={26} aria-hidden="true"/><span><small>Current conditions</small><strong>{text}</strong></span></p>}
      {!selectedLocationKey && !message && <p>Choose the nearest area to see its forecast.</p>}
    </div>
    {forecast && <>
      <table className={styles.forecast}><caption>{stale ? "Previous forecast" : "3-day forecast"}</caption>
        <thead><tr><th scope="col">Day</th><th scope="col">High</th><th scope="col">Low</th><th scope="col">Rain chance</th></tr></thead>
        <tbody>{forecast.days.map((day,index) => <tr key={day.date}>
          <th scope="row">{stale ? day.date : index < 2 ? day.label : new Intl.DateTimeFormat("en-GH",{weekday:"short",timeZone:"Africa/Accra"}).format(new Date(day.date+"T12:00:00Z"))}</th>
          <td>{day.temperatureMaxC != null ? day.temperatureMaxC+"°C" : "—"}</td>
          <td>{day.temperatureMinC != null ? day.temperatureMinC+"°C" : "—"}</td>
          <td>{day.rainChancePercent != null ? day.rainChancePercent+"%" : "—"}</td>
        </tr>)}</tbody>
      </table>
      <p className={styles.updated}>{updatedLine(forecast,stale)}</p>
    </>}
    {(message || stale) && selectedLocationKey && <button type="button" className={styles.textAction} onClick={() => request.type === "location" ? selectLocation(request.locationKey) : requestBrowserLocation()}>Refresh forecast</button>}
  </section>;
}

const taskChoices: Array<{ task: WeatherDecisionTask; label: string; icon: LucideIcon }> = [
  { task: "planting-before-rain", label: "Plant", icon: Sprout },
  { task: "spraying", label: "Spray", icon: SprayCan },
  { task: "irrigation", label: "Water", icon: Droplets },
  { task: "harvesting-before-rain", label: "Harvest", icon: Shovel },
  { task: "fertilizer-before-rain", label: "Apply fertiliser", icon: Leaf },
  { task: "drying-produce", label: "Dry produce", icon: Sun }
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
  const SelectedIcon = taskChoices.find(choice => choice.task === selectedTask)?.icon ?? Sprout;

  return <article id="can-i-farm-today" className={styles.todayTasks}>
    <h2>Can I Farm Today?</h2>
    {selectedTask ? <div className={styles.taskSelection}>
      <strong><SelectedIcon size={21} aria-hidden="true" />{selectedLabel}</strong>
      <button type="button" className={styles.textAction} onClick={() => {setSelectedTask(""); setChecks({});}}>Change task</button>
    </div> : <>
      <p>What are you planning to do?</p>
      <div className={styles.taskTiles}>
        {taskChoices.map(({ task, label, icon: Icon }) => <button key={task} type="button" onClick={() => setSelectedTask(task)}>
          <Icon size={21} aria-hidden="true" />{label}
        </button>)}
      </div>
    </>}
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
