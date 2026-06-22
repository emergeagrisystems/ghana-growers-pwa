"use client";

import { CloudRain, ThermometerSun } from "lucide-react";
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

  if (weather.wind >= 25) {
    return "Strong wind, avoid spraying today and secure young plants, shade nets, and loose packaging.";
  }

  if (weather.temperature >= 34) {
    return "High heat, irrigate early morning and provide shade for sensitive crops.";
  }

  if (weather.humidity >= 85 && weather.rainfallChance >= 35) {
    return "High humidity may increase fungal disease risk, improve spacing and monitor leaves closely.";
  }

  if (weather.rainfallChance <= 20 && weather.humidity <= 65 && weather.wind <= 18) {
    return "Good day for drying maize, cassava chips, and other produce.";
  }

    return "Good fieldwork window, but check local clouds before spraying or drying.";
}

export function WeatherUpdates() {
  const [selected, setSelected] = useState(weatherLocations[0].name);
  const [weather, setWeather] = useState<WeatherState | undefined>();
  const [showFullWeather, setShowFullWeather] = useState(false);

  const location = useMemo(
    () => weatherLocations.find((item) => item.name === selected) ?? weatherLocations[0],
    [selected]
  );

  useEffect(() => {
    let active = true;

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
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setWeather(undefined);
      });

    return () => {
      active = false;
    };
  }, [location]);

  return (
    <section id="weather" className="scroll-mt-28 rounded-md border border-leaf-900/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-black text-ink">Live Weather Updates</h2>
        </div>
        <label className="grid gap-2 text-sm font-bold text-ink/75 lg:min-w-72">
          Nearest city or region
          <select
            className="gg-field w-full"
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

      <div className="mt-5 grid gap-3 md:grid-cols-[0.8fr_0.8fr_1.4fr_auto] md:items-stretch">
        <div className="rounded-md bg-leaf-50 p-4">
          <ThermometerSun className="text-leaf-600" size={22} aria-hidden="true" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.08em] text-ink/50">Current Temperature</p>
          <p className="mt-1 text-3xl font-black text-ink">{weather ? `${weather.temperature}C` : "--"}</p>
        </div>
        <div className="rounded-md bg-leaf-50 p-4">
          <CloudRain className="text-leaf-600" size={22} aria-hidden="true" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.08em] text-ink/50">Rain Chance</p>
          <p className="mt-1 text-3xl font-black text-ink">{weather ? `${weather.rainfallChance}%` : "--"}</p>
        </div>
        <div className="rounded-md bg-earth-50 p-4">
          <p className="text-sm font-black text-ink">Farm advice</p>
          <p className="mt-2 text-sm leading-6 text-ink/70">{farmingAdvice(weather)}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowFullWeather((value) => !value)}
          className="gg-text-link h-full"
        >
          {showFullWeather ? "Hide Full Forecast" : "View Full Forecast"}
        </button>
      </div>

      {showFullWeather ? (
        <div className="mt-4 grid gap-3 rounded-md bg-leaf-50 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="font-black text-ink">Humidity</p>
            <p className="mt-1 text-ink/65">{weather ? `${weather.humidity}%` : "--"}</p>
          </div>
          <div>
            <p className="font-black text-ink">Wind</p>
            <p className="mt-1 text-ink/65">{weather ? `${weather.wind} km/h` : "--"}</p>
          </div>
          <div>
            <p className="font-black text-ink">Forecast</p>
            <p className="mt-1 text-ink/65">{weather?.forecast ?? "Forecast loading..."}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
