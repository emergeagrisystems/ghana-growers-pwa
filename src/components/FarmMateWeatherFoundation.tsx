"use client";

import { CloudSun, Loader2, LocateFixed, MapPin, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { todayFarmDecision } from "@/lib/farmmate/experience-decisions";
import type { WeatherDecisionTask } from "@/lib/farmmate/weather-decision-specialist";
import {
  FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY,
  FARM_MATE_WEATHER_LOCATION_STORAGE_KEY,
  FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE,
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

function updatedLine(forecast: FarmMateWeatherForecast) {
  const updated = new Date(forecast.lastUpdatedAt);

  if (Number.isNaN(updated.getTime())) {
    return `Live weather: ${forecast.location.name}`;
  }

  return `Live weather: ${forecast.location.name} - Updated ${updated.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  })}`;
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

export function FarmMateWeatherFoundation() {
  const [request, setRequest] = useState<WeatherRequest>({ type: "location", locationKey: "accra" });
  const [forecast, setForecast] = useState<FarmMateWeatherForecast | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WeatherDecisionTask | "">("");
  const [sprayChecks, setSprayChecks] = useState({ rainWindow: "unknown", wind: "unknown", leaves: "unknown" });
  const selectedLocationKey = request.type === "location" ? request.locationKey : "browser-location";
  const decision = selectedTask ? todayFarmDecision(selectedTask, isLoading ? null : forecast?.decisionSummary, sprayChecks) : null;
  const taskChoices: Array<{ task: WeatherDecisionTask; label: string }> = [
    { task: "spraying", label: "Spray" }, { task: "planting-before-rain", label: "Plant" },
    { task: "fertilizer-before-rain", label: "Apply fertilizer" }, { task: "irrigation", label: "Water / irrigate" },
    { task: "harvesting-before-rain", label: "Harvest" }, { task: "drying-produce", label: "Dry produce" }
  ];
  const selectedLocationLabel = useMemo(() => {
    if (request.type === "browser") {
      return request.label;
    }

    const location = supportedFarmMateWeatherLocations.find((item) => item.key === request.locationKey);
    return location ? `${location.name} / ${location.region}` : "Accra / Greater Accra";
  }, [request]);

  useEffect(() => {
    const savedLocation = window.localStorage.getItem(FARM_MATE_WEATHER_LOCATION_STORAGE_KEY);
    const location = supportedFarmMateWeatherLocations.find((item) => item.key === savedLocation);

    if (location) {
      setRequest({ type: "location", locationKey: location.key });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadForecast() {
      setIsLoading(true);
      setForecast(null);
      window.localStorage.removeItem(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY);
      setMessage("");

      try {
        const response = await fetch(requestUrl(request));
        const data = (await response.json().catch(() => null)) as WeatherApiResponse | null;

        if (cancelled) {
          return;
        }

        if (data?.ok && data.forecast) {
          setForecast(data.forecast);
          window.localStorage.setItem(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY, JSON.stringify(storedWeatherContextFromForecast(data.forecast)));
          return;
        }

        setForecast(null);
        window.localStorage.removeItem(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY);
        setMessage(data?.message || FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE);
      } catch {
        if (!cancelled) {
          setForecast(null);
          window.localStorage.removeItem(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY);
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
  }, [request]);

  function selectLocation(locationKey: string) {
    setForecast(null);
    setIsLoading(true);
    window.localStorage.removeItem(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY);
    window.localStorage.setItem(FARM_MATE_WEATHER_LOCATION_STORAGE_KEY, locationKey);
    setRequest({ type: "location", locationKey });
  }

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      setMessage("Browser location is not available. Choose the nearest Ghana location instead.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForecast(null);
        setIsLoading(true);
        window.localStorage.removeItem(FARM_MATE_WEATHER_CONTEXT_STORAGE_KEY);
        window.localStorage.removeItem(FARM_MATE_WEATHER_LOCATION_STORAGE_KEY);
        setRequest({
          type: "browser",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: "Your current area"
        });
        setIsLocating(false);
      },
      () => {
        setMessage("Location permission was not granted. Choose the nearest Ghana location instead.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 900000
      }
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-md border border-leaf-900/10 bg-white/95 p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className="text-leaf-700" size={18} aria-hidden="true" />
            <div>
              <h3 className="gg-eyebrow text-leaf-700">3-day forecast</h3>
              <p className="mt-1 text-xs font-bold text-ink/55">
                {forecast ? updatedLine(forecast) : isLoading ? `Checking weather for ${selectedLocationLabel}` : "Weather guidance"}
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
              {request.type === "browser" ? <option value="browser-location">Your current area</option> : null}
              {supportedFarmMateWeatherLocations.map((location) => (
                <option key={location.key} value={location.key}>
                  {location.name} / {location.region}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={useBrowserLocation}
              disabled={isLocating}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50 disabled:cursor-wait disabled:text-ink/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
            >
              {isLocating ? <Loader2 className="animate-spin" size={14} aria-hidden="true" /> : <LocateFixed size={14} aria-hidden="true" />}
              Use my location
            </button>
          </div>
        </div>

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
                  <p className="min-w-0 text-xs font-black leading-4 text-ink/72">{day.label}</p>
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
                    <p className="text-xs font-bold leading-tight">{day.label}</p>
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
              <p>{message || FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE}</p>
            </div>
          </div>
        )}
      </div>
      <section className="rounded-md border border-leaf-900/10 bg-white p-4 shadow-soft" aria-label="Can I farm today?">
        <h3 className="text-lg font-black text-ink">Can I farm today?</h3>
        <p className="mt-1 text-sm font-semibold text-ink/65">What do you want to do today?</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {taskChoices.map(({ task, label }) => <button key={task} type="button" onClick={() => setSelectedTask(task)} aria-pressed={selectedTask === task} className={`min-h-11 rounded-md border px-3 py-2 text-sm font-black ${selectedTask === task ? "border-leaf-700 bg-leaf-50 text-leaf-900" : "border-leaf-900/15 bg-white text-leaf-700"}`}>{label}</button>)}
        </div>
        {selectedTask === "spraying" ? <div className="mt-4 grid gap-2">
          <label className="grid gap-1 text-xs font-black text-ink">Rain in the next 4–6 hours?
            <select className="gg-field min-h-11" value={sprayChecks.rainWindow} onChange={(event) => setSprayChecks({ ...sprayChecks, rainWindow: event.target.value })}><option value="unknown">Not sure</option><option value="rain">Likely</option><option value="clear">No rain expected</option></select>
          </label>
          <label className="grid gap-1 text-xs font-black text-ink">Wind at the field?
            <select className="gg-field min-h-11" value={sprayChecks.wind} onChange={(event) => setSprayChecks({ ...sprayChecks, wind: event.target.value })}><option value="unknown">Not sure</option><option value="strong">Strong</option><option value="calm">Calm</option></select>
          </label>
          <label className="grid gap-1 text-xs font-black text-ink">Leaves now?
            <select className="gg-field min-h-11" value={sprayChecks.leaves} onChange={(event) => setSprayChecks({ ...sprayChecks, leaves: event.target.value })}><option value="unknown">Not sure</option><option value="wet">Wet</option><option value="dry">Dry</option></select>
          </label>
        </div> : null}
        {decision ? <div className="mt-4 rounded-md bg-leaf-50 p-4" aria-live="polite">
          <h4 className="text-sm font-black text-leaf-900">{decision.status}</h4>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/72">{decision.why}</p>
          <p className="mt-2 text-sm font-black text-ink">What to check</p><p className="text-sm font-semibold leading-6 text-ink/72">{decision.check}</p>
          <p className="mt-2 text-sm font-black text-ink">Next action</p><p className="text-sm font-semibold leading-6 text-ink/72">{decision.next}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {selectedTask === "planting-before-rain" ? <button type="button" className="min-h-11 rounded-md bg-leaf-600 px-3 text-sm font-black text-white" onClick={() => window.dispatchEvent(new CustomEvent("gg-farmmate-open-tool", { detail: "planting" }))}>Check planting readiness</button> : null}
            <button type="button" className="min-h-11 rounded-md border border-leaf-700 px-3 text-sm font-black text-leaf-700" onClick={() => window.dispatchEvent(new CustomEvent("gg-farmmate-open-ask-with-context", { detail: `I am near ${forecast?.location.name ?? selectedLocationLabel}. I want to ${taskChoices.find((choice) => choice.task === selectedTask)?.label.toLowerCase()}. ${forecast ? `Today's forecast shows ${forecast.today.rainChancePercent ?? "unknown"}% rain chance, updated ${forecast.lastUpdatedAt}.` : "Live weather is unavailable."} This tool says ${decision.status.toLowerCase()}: ${decision.why} What should I check before acting?` }))}>Ask Mama G about this</button>
          </div>
        </div> : null}
      </section>
    </div>
  );
}
