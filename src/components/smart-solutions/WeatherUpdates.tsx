"use client";

import { CloudRain, Droplets, ThermometerSun, Wind } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { weatherLocations } from "@/data/weatherLocations";

type WeatherState = {
  temperature: number;
  humidity: number;
  wind: number;
  rainfallChance: number;
  forecast: string;
};

function farmingAdvice(weather?: WeatherState) {
  if (!weather) {
    return "Select your nearest city to see weather-based farming advice.";
  }

  if (weather.rainfallChance >= 60) {
    return "Rain expected, delay spraying and keep harvested produce covered.";
  }

  if (weather.temperature >= 34) {
    return "High heat, irrigate early morning and provide shade for sensitive crops.";
  }

  if (weather.rainfallChance <= 20 && weather.humidity <= 65) {
    return "Good day for drying maize, cassava chips, and other produce.";
  }

    return "Good fieldwork window, but check local clouds before spraying or drying.";
}

export function WeatherUpdates() {
  const [selected, setSelected] = useState(weatherLocations[0].name);
  const [weather, setWeather] = useState<WeatherState | undefined>();
  const [status, setStatus] = useState("Loading weather...");

  const location = useMemo(
    () => weatherLocations.find((item) => item.name === selected) ?? weatherLocations[0],
    [selected]
  );

  useEffect(() => {
    let active = true;
    setStatus("Loading weather...");

    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: "temperature_2m,relative_humidity_2m,wind_speed_10m",
      hourly: "precipitation_probability",
      daily: "weather_code,temperature_2m_max,temperature_2m_min",
      timezone: "Africa/Accra",
      forecast_days: "3"
    });

    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Weather request failed");
        }
        return response.json();
      })
      .then((data) => {
        if (!active) {
          return;
        }

        const rainfallChance = Number(data.hourly?.precipitation_probability?.[0] ?? 0);
        setWeather({
          temperature: Math.round(Number(data.current?.temperature_2m ?? 0)),
          humidity: Math.round(Number(data.current?.relative_humidity_2m ?? 0)),
          wind: Math.round(Number(data.current?.wind_speed_10m ?? 0)),
          rainfallChance,
          forecast: `${Math.round(Number(data.daily?.temperature_2m_min?.[0] ?? 0))}C to ${Math.round(
            Number(data.daily?.temperature_2m_max?.[0] ?? 0)
          )}C today`
        });
        setStatus("Live weather loaded from Open-Meteo.");
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setWeather(undefined);
        setStatus("Weather is temporarily unavailable. Try again when internet access is available.");
      });

    return () => {
      active = false;
    };
  }, [location]);

  const metrics = [
    { label: "Temperature", value: weather ? `${weather.temperature}C` : "--", icon: ThermometerSun },
    { label: "Rainfall chance", value: weather ? `${weather.rainfallChance}%` : "--", icon: CloudRain },
    { label: "Humidity", value: weather ? `${weather.humidity}%` : "--", icon: Droplets },
    { label: "Wind", value: weather ? `${weather.wind} km/h` : "--", icon: Wind }
  ];

  return (
    <section id="weather" className="scroll-mt-28 rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-earth-700">Live Weather Updates</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Check Weather</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
            Choose the nearest farming area before spraying, drying maize, irrigating, or moving produce to market.
          </p>
          <p className="mt-2 text-xs font-bold text-ink/55">{status}</p>
        </div>
        <label className="grid gap-2 text-sm font-bold text-ink/75 sm:min-w-64">
          Nearest city or region
          <select
            className="focus-ring w-full rounded-md border border-leaf-900/15 bg-white px-3 py-3 font-normal"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            {weatherLocations.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name} - {item.region}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-md bg-leaf-50 p-4">
              <Icon className="text-leaf-600" size={22} aria-hidden="true" />
              <p className="mt-3 text-xs font-black uppercase text-ink/55">{metric.label}</p>
              <p className="mt-1 text-2xl font-black text-ink">{metric.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-md bg-earth-50 p-4">
          <p className="text-sm font-black text-ink">Today&apos;s forecast</p>
          <p className="mt-2 text-sm leading-6 text-ink/70">{weather?.forecast ?? "Forecast loading..."}</p>
        </div>
        <div className="rounded-md bg-leaf-600 p-4 text-white">
          <p className="text-sm font-black">What this means on the farm</p>
          <p className="mt-2 text-sm leading-6 text-white/85">{farmingAdvice(weather)}</p>
        </div>
      </div>
    </section>
  );
}
