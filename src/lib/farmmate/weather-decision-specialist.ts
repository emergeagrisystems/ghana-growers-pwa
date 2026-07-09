export type WeatherDecisionTask =
  | "spraying"
  | "fertilizer-before-rain"
  | "planting-before-rain"
  | "irrigation"
  | "harvesting-before-rain"
  | "drying-produce"
  | "heavy-rain-warning"
  | "windy-conditions"
  | "wet-leaves"
  | "waterlogged-soil";

export type WeatherDecisionGuidance = {
  task: WeatherDecisionTask;
  handles: string;
  opening: string;
  checks: string[];
  actions: string[];
  safetyWarnings: string[];
  sustainabilityNotes: string[];
  nextBestAction: string;
};

export const weatherDecisionGuidance: WeatherDecisionGuidance[] = [
  {
    task: "spraying",
    handles: "Spraying decisions affected by rain, wind, leaf wetness and spray drift.",
    opening: "Let's check if conditions are safe for spraying.",
    checks: ["Check whether rain is expected in the next 4 to 6 hours.", "Check that wind is calm.", "Check that leaves are dry."],
    actions: ["Wait if rain is likely soon.", "Wait if wind is strong.", "Spray only when leaves are dry and conditions are calm."],
    safetyWarnings: ["Do not spray before rain.", "Do not spray in strong wind.", "Follow the product label and local extension advice."],
    sustainabilityNotes: ["Avoid pesticide drift.", "Avoid wasting spray when rain may wash it off.", "Protect nearby people, animals and crops."],
    nextBestAction: "Confirm no rain is expected for 4 to 6 hours and wind is calm before spraying."
  },
  {
    task: "fertilizer-before-rain",
    handles: "Fertilizer timing when rain or heavy rain may wash nutrients away.",
    opening: "Rain timing matters before applying fertilizer.",
    checks: ["Check whether heavy rain is expected soon.", "Check whether the soil is dry, moist or waterlogged.", "Check the crop stage before spending on fertilizer."],
    actions: ["Do not apply fertilizer before heavy rain.", "Wait until soil is moist but not waterlogged.", "Use compost or mulch where available to reduce nutrient loss."],
    safetyWarnings: ["Heavy rain can wash fertilizer away.", "Waterlogged soil can stress roots.", "Do not guess exact rates."],
    sustainabilityNotes: ["Avoid fertilizer runoff.", "Reduce waste.", "Protect soil and nearby water."],
    nextBestAction: "Wait if heavy rain is expected soon; apply only when soil is moist and rain risk is low."
  },
  {
    task: "planting-before-rain",
    handles: "Planting decisions around rain, soil moisture and waterlogging risk.",
    opening: "Let's check whether the rain will help planting or damage the seed.",
    checks: ["Check if rain will be light or heavy.", "Check if the soil drains well.", "Check whether the field is already waterlogged."],
    actions: ["Plant when soil is moist but not flooded.", "Delay planting if heavy rain may wash seed away.", "Avoid working very wet soil."],
    safetyWarnings: ["Heavy rain can wash seed away.", "Waterlogged soil can rot seed.", "Working wet soil can damage soil structure."],
    sustainabilityNotes: ["Protect soil structure.", "Avoid seed waste.", "Use rain to support germination when it is not excessive."],
    nextBestAction: "Check soil moisture and drainage before planting."
  },
  {
    task: "irrigation",
    handles: "Watering and irrigation decisions when rain, heat or soil moisture is uncertain.",
    opening: "Let's check whether the crop needs water today.",
    checks: ["Check if the top soil is dry.", "Check if rain is expected soon.", "Check whether the crop is wilting in the cool part of the day."],
    actions: ["Water at soil level if the soil is dry and rain is not expected soon.", "Wait if rain is expected soon.", "Avoid overwatering waterlogged soil."],
    safetyWarnings: ["Too much water can stress roots.", "Wet leaves can increase disease risk.", "Waterlogged soil should not be irrigated."],
    sustainabilityNotes: ["Save water.", "Reduce leaf disease risk.", "Protect roots from water stress."],
    nextBestAction: "Check soil moisture before watering."
  },
  {
    task: "harvesting-before-rain",
    handles: "Harvest timing when rain may damage produce or make harvest difficult.",
    opening: "Let's reduce harvest loss from rain.",
    checks: ["Check whether rain is expected soon.", "Check if the crop is mature enough.", "Check whether harvested produce can be kept dry."],
    actions: ["Harvest mature produce before heavy rain if rain may damage quality.", "Keep harvested produce shaded and dry.", "Avoid harvesting immature produce only because rain may come."],
    safetyWarnings: ["Rain can damage quality for some produce.", "Wet produce can spoil faster.", "Do not harvest too early unless loss risk is high."],
    sustainabilityNotes: ["Prevent post-harvest losses.", "Avoid wasting marketable produce.", "Protect quality after harvest."],
    nextBestAction: "Harvest mature produce first if heavy rain may damage it."
  },
  {
    task: "drying-produce",
    handles: "Drying maize, cassava, pepper or other produce outside when rain risk is uncertain.",
    opening: "Let's protect the produce while it dries.",
    checks: ["Check if rain is likely today.", "Check if the drying area is clean and raised.", "Check if you can cover or move produce quickly."],
    actions: ["Dry produce outside only when rain risk is low.", "Use a clean raised surface.", "Keep a cover ready if clouds build up."],
    safetyWarnings: ["Rain can spoil drying produce.", "Drying on bare ground can contaminate produce.", "Damp produce can mould."],
    sustainabilityNotes: ["Prevent post-harvest losses.", "Protect food quality.", "Avoid re-drying losses."],
    nextBestAction: "Dry outside only if rain risk is low and you can cover the produce quickly."
  },
  {
    task: "heavy-rain-warning",
    handles: "Farm decisions when heavy rain may cause runoff, erosion, waterlogging or crop damage.",
    opening: "Heavy rain can change the safest farm action.",
    checks: ["Check drainage channels.", "Check low areas for waterlogging.", "Check if inputs or harvested produce are exposed."],
    actions: ["Delay fertilizer and spraying before heavy rain.", "Move harvested produce and inputs under cover.", "Avoid working waterlogged soil."],
    safetyWarnings: ["Heavy rain can cause runoff.", "Waterlogged soil can damage roots.", "Wet fields can be unsafe to work."],
    sustainabilityNotes: ["Reduce runoff.", "Protect soil structure.", "Prevent crop and produce losses."],
    nextBestAction: "Secure produce and inputs before heavy rain."
  },
  {
    task: "windy-conditions",
    handles: "Spraying, harvesting and field work affected by strong wind.",
    opening: "Wind can make some farm work risky.",
    checks: ["Check whether leaves and branches are moving strongly.", "Check if spray would drift away.", "Check nearby people, animals and crops."],
    actions: ["Do not spray in strong wind.", "Wait for calmer conditions.", "Secure light materials before wind increases."],
    safetyWarnings: ["Strong wind can cause pesticide drift.", "Wind can spread spray to people or other crops.", "Some field work is unsafe in strong wind."],
    sustainabilityNotes: ["Reduce pesticide drift.", "Avoid wasting inputs.", "Protect nearby farms."],
    nextBestAction: "Wait for calmer wind before spraying."
  },
  {
    task: "wet-leaves",
    handles: "Spraying or disease-risk decisions when crop leaves are wet.",
    opening: "Wet leaves change the spraying decision.",
    checks: ["Check if leaves are wet from rain or dew.", "Check whether rain is still likely.", "Check if the crop has disease symptoms."],
    actions: ["Wait for leaves to dry before spraying.", "Avoid watering leaves directly.", "Use Crop Doctor if spots or disease signs are visible."],
    safetyWarnings: ["Spray may not work well on wet leaves.", "Wet leaves can increase disease risk.", "Do not rush chemical treatment without checking symptoms."],
    sustainabilityNotes: ["Avoid wasted spray.", "Reduce disease pressure.", "Use observation before treatment."],
    nextBestAction: "Wait until leaves are dry before spraying."
  },
  {
    task: "waterlogged-soil",
    handles: "Decisions when soil is flooded, saturated or too wet to work.",
    opening: "Waterlogged soil can stress roots and damage soil structure.",
    checks: ["Check whether water is standing in the field.", "Check if soil sticks heavily to tools or boots.", "Check if roots or lower leaves look stressed."],
    actions: ["Do not work waterlogged soil.", "Wait for drainage before applying fertilizer.", "Open drainage carefully where practical."],
    safetyWarnings: ["Working waterlogged soil can damage structure.", "Fertilizer can be wasted in flooded soil.", "Roots may be short of air."],
    sustainabilityNotes: ["Protect soil structure.", "Reduce fertilizer loss.", "Protect crop roots."],
    nextBestAction: "Wait until the soil drains before applying fertilizer or working the field."
  }
];

export function findWeatherDecisionGuidance(task: WeatherDecisionTask) {
  return weatherDecisionGuidance.find((guidance) => guidance.task === task);
}

export function weatherTaskFromQuestion(question: string): WeatherDecisionTask {
  const normalized = question.toLowerCase();

  if (normalized.includes("spray") || normalized.includes("wet leaves") || normalized.includes("dry leaves")) {
    return normalized.includes("wet leaves") || normalized.includes("dry leaves") ? "wet-leaves" : "spraying";
  }

  if (normalized.includes("fertil") || normalized.includes("npk") || normalized.includes("urea")) {
    return "fertilizer-before-rain";
  }

  if (normalized.includes("irrigat") || normalized.includes("water today")) {
    return "irrigation";
  }

  if (normalized.includes("harvest")) {
    return "harvesting-before-rain";
  }

  if (normalized.includes("dry produce") || normalized.includes("drying") || normalized.includes("dry outside")) {
    return "drying-produce";
  }

  if (normalized.includes("plant")) {
    return "planting-before-rain";
  }

  if (normalized.includes("wind")) {
    return "windy-conditions";
  }

  if (normalized.includes("waterlogged") || normalized.includes("flood")) {
    return "waterlogged-soil";
  }

  if (normalized.includes("heavy rain")) {
    return "heavy-rain-warning";
  }

  return "heavy-rain-warning";
}

export function weatherOpeningForQuestion(question: string) {
  return findWeatherDecisionGuidance(weatherTaskFromQuestion(question))?.opening ?? "Check the weather conditions before acting.";
}
