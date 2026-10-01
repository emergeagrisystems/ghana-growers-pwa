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
  drainage?: "good" | "poor" | "unknown";
  prepared: "ready" | "partly" | "not-yet" | "unknown";
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
    status: "WAIT", why: "The field is waterlogged. Planting now may damage seed or roots.",
    check: "Check drainage and wait until the soil is moist, not flooded.", next: "Recheck the field after it drains."
  };
  if (field.drainage === "poor") return {
    status: "WAIT", why: "Poor drainage may leave seed or young roots in standing water.",
    check: "Check low areas after rain and improve drainage before planting.", next: "Recheck the soil once water can drain."
  };
  if (field.prepared === "not-yet") return {
    status: "WAIT", why: "The land is not prepared for planting.",
    check: "Check drainage, planting material and soil preparation.", next: "Prepare the field before choosing a planting day."
  };
  if (field.planningNow === "later") return {
    status: "CHECK FIRST", why: "You are planning ahead, so today's conditions do not set a planting date.",
    check: "Check field moisture and a fresh local forecast when you are ready.", next: "Return when you are close to planting."
  };
  if (field.moisture === "dry" && field.irrigation !== "yes") return {
    status: "WAIT", why: "The field is dry and reliable irrigation is not confirmed.",
    check: "Check whether steady rain has moistened the soil or irrigation is available.", next: "Wait for reliable moisture before planting."
  };
  if (field.moisture === "unknown" || field.drainage === "unknown" || field.prepared === "unknown") return {
    status: "NOT ENOUGH INFORMATION", why: "Mama G does not know the field's moisture, drainage and preparation well enough yet.",
    check: "Check soil moisture, standing water and whether the land is ready.", next: "Return with those field checks before planting."
  };
  if (field.prepared === "partly" || (field.moisture === "dry" && field.irrigation === "yes")) return {
    status: "CHECK FIRST", why: "One or more field conditions still need checking.",
    check: "Confirm soil moisture, drainage and land preparation in the field.", next: "Finish those checks before planting."
  };
  const highRain = weather?.liveWeatherAvailable && weatherDecisionRainChanceBand(weather.rainChancePercent) === "high";
  if (!weather?.liveWeatherAvailable) return {
    status: "CHECK FIRST", why: "The field sounds ready, but no matching live forecast is available for this area.",
    check: "Check a fresh local forecast and confirm the soil remains moist and drained.", next: "Choose a planting moment only after those checks."
  };
  return highRain ? {
    status: "CHECK FIRST", why: "The field sounds ready, but today's forecast has a high chance of rain; daily probability cannot tell whether heavy rain will strike this field.",
    check: "Check local rain intensity and whether seed could wash away.", next: "Plant only when the soil remains workable and rain risk is acceptable."
  } : {
    status: "CONDITIONS LOOK SUITABLE", why: "You report moist soil and prepared land. Regional weather does not confirm conditions in your field.",
    check: "Confirm drainage and healthy planting material before sowing.", next: "Check the field and plant only if it remains moist but not flooded."
  };
}

export type FarmTaskChecks = {
  rainWindow?: string;
  wind?: string;
  leaves?: string;
  soil?: string;
  drainage?: string;
  heavyRainSoon?: string;
  maturity?: string;
  keepDry?: string;
  coveredArea?: string;
};

export function todayFarmDecision(task: WeatherDecisionTask, weather?: WeatherDecisionSummary | null, checks: FarmTaskChecks = {}) {
  const guide = findWeatherDecisionGuidance(task);
  const band = weather?.liveWeatherAvailable ? weatherDecisionRainChanceBand(weather.rainChancePercent) : "unknown";
  if (!guide) throw new Error("Unsupported farm task");
  if (task === "spraying") {
    const unsafe = checks.rainWindow === "rain" || checks.wind === "strong" || checks.leaves === "wet";
    const cleared = checks.rainWindow === "clear" && checks.wind === "calm" && checks.leaves === "dry";
    return {
      status: unsafe ? "WAIT" : cleared && band === "low" ? "SUITABLE" : cleared || band !== "unknown" ? "CHECK FIRST" : "NOT ENOUGH INFORMATION",
      why: unsafe ? "Your field check found a spraying risk." : band === "unknown" ? "Live weather is unavailable. Check a local forecast and conditions at the field before spraying." : band === "high" ? "Today's rain chance is high." : "A daily forecast cannot confirm the next 4–6 hours, wind at the crop, or leaf wetness.",
      check: "Confirm no rain for the next 4–6 hours, calm wind and dry leaves at the field.", next: unsafe ? "Wait for safer field conditions; follow the product label before any spraying." : guide.nextBestAction
    };
  }
  if (task === "planting-before-rain") {
    if (checks.soil === "waterlogged" || checks.drainage === "poor") return { status: "WAIT", why: "The field is waterlogged or drains poorly.", check: "Check soil drainage and whether it is workable.", next: "Use Planting Advisor after the field drains." };
    if (checks.soil === "unknown" || checks.drainage === "unknown" || !checks.soil || !checks.drainage) return { status: "NOT ENOUGH INFORMATION", why: "The forecast cannot tell Mama G whether your field is ready.", check: "Check soil moisture and drainage.", next: "Open Planting Advisor with those field conditions." };
    return { status: band === "high" || band === "unknown" ? "CHECK FIRST" : "SUITABLE", why: band === "unknown" ? "The field sounds workable, but live weather is unavailable. Check a local forecast before choosing a planting moment." : band === "high" ? "The field sounds workable, but heavy rain could still wash seed away." : "The field sounds workable; the forecast does not measure this plot.", check: "Confirm local rain intensity and planting material.", next: "Open Planting Advisor before choosing the planting moment." };
  }
  if (task === "fertilizer-before-rain") {
    if (checks.heavyRainSoon === "yes" || checks.soil === "waterlogged") return { status: "WAIT", why: "Heavy rain or waterlogged soil can carry fertilizer away.", check: "Check when rain is expected and whether the soil drains.", next: "Wait until the field is moist but not flooded; follow local soil and label guidance." };
    if (!checks.soil || checks.soil === "unknown" || !checks.heavyRainSoon || checks.heavyRainSoon === "unknown") return { status: "NOT ENOUGH INFORMATION", why: "A daily rain chance does not show the soil or the next few hours.", check: "Check soil moisture and whether heavy rain is expected soon.", next: "Choose the timing only after those checks." };
    return { status: band === "high" || band === "unknown" ? "CHECK FIRST" : "SUITABLE", why: band === "unknown" ? "The soil sounds workable, but live weather is unavailable. Check a local forecast before applying fertilizer." : band === "high" ? "Conditions may be workable, but today's rain risk needs a local check." : "Moist soil and no heavy rain soon may support application.", check: "Confirm the crop needs feeding and follow the product label; no dose is supplied here.", next: "Apply only if the field check and local guidance support it." };
  }
  if (task === "irrigation") {
    if (checks.soil === "moist" || checks.soil === "waterlogged") return { status: "WAIT", why: "The soil is not reported dry.", check: "Check moisture below the surface before adding water.", next: "Do not irrigate now unless the crop and soil check show a need." };
    if (checks.soil !== "dry" || !checks.heavyRainSoon || checks.heavyRainSoon === "unknown") return { status: "NOT ENOUGH INFORMATION", why: "Rain chance alone cannot show whether this field needs water.", check: "Check root-zone moisture and whether useful rain is expected soon.", next: "Recheck the field before irrigating." };
    return { status: checks.heavyRainSoon === "yes" || band === "unknown" ? "CHECK FIRST" : "SUITABLE", why: checks.heavyRainSoon === "yes" ? "The soil is dry, but rain may arrive soon." : band === "unknown" ? "The soil is dry, but live weather is unavailable. Confirm the local rain outlook before irrigating." : "The soil is dry and no useful rain is expected soon.", check: "Check the crop's water need and drainage.", next: checks.heavyRainSoon === "yes" ? "Wait and reassess after rain if the crop can safely wait." : "Irrigate only enough to meet the crop's observed need." };
  }
  if (task === "harvesting-before-rain") {
    if (checks.maturity === "not-ready") return { status: "WAIT", why: "The crop is not reported mature.", check: "Check crop-specific maturity signs.", next: "Do not harvest immature produce only because rain may come." };
    if (checks.maturity !== "ready" || !checks.keepDry || checks.keepDry === "unknown") return { status: "NOT ENOUGH INFORMATION", why: "Harvest timing needs maturity and a way to protect the produce.", check: "Check maturity and where the harvest can be kept dry.", next: "Decide after those checks." };
    return { status: checks.keepDry === "yes" ? "CHECK FIRST" : "WAIT", why: checks.keepDry === "yes" ? "Mature produce can be protected, but rain timing and field access still matter." : "There is no dry place for the harvest.", check: "Check immediate rain and handling conditions.", next: checks.keepDry === "yes" ? "Harvest mature produce first if rain threatens and it can be kept safe." : "Prepare a clean, dry holding place before harvesting." };
  }
  if (checks.coveredArea === "no" && band === "high") return { status: "WAIT", why: "High rain chance and no covered drying area risk wet produce.", check: "Check whether rain is expected during drying.", next: "Wait or find a clean covered area before drying." };
  if (!checks.coveredArea || checks.coveredArea === "unknown" || !checks.heavyRainSoon || checks.heavyRainSoon === "unknown") return { status: "NOT ENOUGH INFORMATION", why: "The forecast alone cannot confirm safe drying conditions.", check: "Check whether a clean raised or covered area is available and whether rain is expected soon.", next: "Choose a protected drying plan before spreading produce." };
  return { status: checks.heavyRainSoon === "yes" && checks.coveredArea === "no" ? "WAIT" : checks.coveredArea === "yes" || band === "unknown" ? "CHECK FIRST" : "SUITABLE", why: band === "unknown" ? "Live weather is unavailable. Check a local forecast and protect produce from unexpected rain." : checks.coveredArea === "yes" ? "A covered area may protect produce, but drying conditions still need checking." : "No rain is expected soon and an outdoor drying area is available.", check: "Keep produce off bare ground and protect it from sudden rain.", next: "Dry only where produce stays clean and can be covered quickly." };
}
