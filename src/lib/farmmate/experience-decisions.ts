import type { CropCalendarGuide, CropCalendarStage } from "./crop-calendar";
import { supportedFarmMateWeatherLocations, type WeatherDecisionSummary } from "./weather";
import { findWeatherDecisionGuidance, weatherDecisionRainChanceBand, type WeatherDecisionTask } from "./weather-decision-specialist";

function firstWeek(timing: string) {
  const match = timing.match(/(week|month)s?\s+(\d+)/i);
  if (!match) return 1;
  return Number(match[2]) * (match[1].toLowerCase() === "month" ? 4 : 1);
}

function lastWeek(timing: string) {
  const start = firstWeek(timing);
  const end = timing.match(/-\s*(\d+)/);
  if (end) return Number(end[1]) * (/month/i.test(timing) ? 4 : 1);
  return timing.includes("+") ? Infinity : start;
}

export function cropCalendarPosition(guide: CropCalendarGuide, plantedOn: string, today = new Date()) {
  const plantingDate = new Date(`${plantedOn}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(plantedOn) || Number.isNaN(plantingDate.getTime()) || plantingDate.toISOString().slice(0, 10) !== plantedOn) return null;
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (plantingDate.getTime() > todayDay) return null;
  const week = Math.floor((todayDay - plantingDate.getTime()) / 604800000) + 1;
  const matching = guide.stages.findIndex((stage, position) => week >= firstWeek(stage.timing) && (week <= lastWeek(stage.timing) || position === guide.stages.length - 1));
  const index = matching >= 0 ? matching : guide.stages.reduce((latest, stage, position) => firstWeek(stage.timing) <= week ? position : latest, 0);
  return { week, current: guide.stages[index], next: guide.stages[index + 1] as CropCalendarStage | undefined };
}

export type PlantingFieldState = {
  planningNow: "yes" | "later";
  irrigation: "yes" | "no" | "unknown";
  moisture: "moist" | "dry" | "waterlogged" | "unknown";
  prepared: "ready" | "partly" | "not-yet";
};

export function matchingWeatherForRegion(weather: WeatherDecisionSummary | null, region: string) {
  if (!weather?.liveWeatherAvailable) return null;
  const location = supportedFarmMateWeatherLocations.find((item) =>
    weather.locationName === `${item.name} / ${item.region}` || weather.locationName === item.name
  );
  return location?.region === region ? weather : null;
}

export function plantingReadiness(field: PlantingFieldState, weather?: WeatherDecisionSummary | null) {
  if (field.moisture === "waterlogged") return {
    status: "NOT SUITABLE YET", why: "The field is waterlogged. Planting now may damage seed or roots.",
    check: "Check drainage and wait until the soil is moist, not flooded.", next: "Recheck the field after it drains."
  };
  if (field.prepared === "not-yet") return {
    status: "NOT SUITABLE YET", why: "The land is not prepared for planting.",
    check: "Check drainage, planting material and soil preparation.", next: "Prepare the field before choosing a planting day."
  };
  if (field.planningNow === "later") return {
    status: "WAIT AND CHECK", why: "You are planning ahead, so today's conditions do not set a planting date.",
    check: "Check field moisture and a fresh local forecast when you are ready.", next: "Return when you are close to planting."
  };
  if (field.moisture === "dry" && field.irrigation !== "yes") return {
    status: "NOT SUITABLE YET", why: "The field is dry and reliable irrigation is not confirmed.",
    check: "Check whether steady rain has moistened the soil or irrigation is available.", next: "Wait for reliable moisture before planting."
  };
  if (field.moisture === "unknown" || field.prepared === "partly" || (field.moisture === "dry" && field.irrigation === "yes")) return {
    status: "WAIT AND CHECK", why: "One or more field conditions still need checking.",
    check: "Confirm soil moisture, drainage and land preparation in the field.", next: "Finish those checks before planting."
  };
  const highRain = weather?.liveWeatherAvailable && weatherDecisionRainChanceBand(weather.rainChancePercent) === "high";
  return highRain ? {
    status: "WAIT AND CHECK", why: "The field sounds ready, but today's forecast has a high chance of rain; daily probability cannot tell whether heavy rain will strike this field.",
    check: "Check local rain intensity and whether seed could wash away.", next: "Plant only when the soil remains workable and rain risk is acceptable."
  } : {
    status: "CONDITIONS LOOK SUITABLE", why: "You report moist soil and prepared land. Regional weather does not confirm conditions in your field.",
    check: "Confirm drainage and healthy planting material before sowing.", next: "Check the field and plant only if it remains moist but not flooded."
  };
}

export function todayFarmDecision(task: WeatherDecisionTask, weather?: WeatherDecisionSummary | null, sprayChecks?: { rainWindow: string; wind: string; leaves: string }) {
  const guide = findWeatherDecisionGuidance(task);
  const band = weather?.liveWeatherAvailable ? weatherDecisionRainChanceBand(weather.rainChancePercent) : "unknown";
  if (!guide) throw new Error("Unsupported farm task");
  if (task === "spraying") {
    const unsafe = sprayChecks?.rainWindow === "rain" || sprayChecks?.wind === "strong" || sprayChecks?.leaves === "wet";
    const cleared = sprayChecks?.rainWindow === "clear" && sprayChecks?.wind === "calm" && sprayChecks?.leaves === "dry";
    return {
      status: unsafe || band === "high" ? "BETTER TO WAIT" : cleared && band === "low" ? "CONDITIONS MAY BE SUITABLE" : "CHECK FIRST",
      why: unsafe ? "Your field check found a spraying risk." : band === "unknown" ? "Live weather is unavailable. Check a local forecast and conditions at the field before spraying." : band === "high" ? "Today's rain chance is high." : "A daily forecast cannot confirm the next 4–6 hours, wind at the crop, or leaf wetness.",
      check: guide.checks.join(" "), next: guide.nextBestAction
    };
  }
  const rainSensitive = task === "fertilizer-before-rain" || task === "drying-produce";
  return {
    status: band === "unknown" ? "CHECK FIRST" : band === "high" && rainSensitive ? "BETTER TO WAIT" : "CHECK FIRST",
    why: band === "unknown" ? "Live weather is unavailable; check local conditions." : `Today's forecast has ${band} rain chance. It does not show exact rain timing or your field conditions.`,
    check: guide.checks.slice(0, 2).join(" "), next: guide.nextBestAction
  };
}
