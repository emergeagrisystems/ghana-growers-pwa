export type FarmMateDayPeriod = "morning" | "afternoon" | "evening" | "night";

export type FarmMateSummaryTimeOfDay = FarmMateDayPeriod | "all_day";

export type FarmMateDailySummary = {
  title: string;
  mainRecommendation: string;
  rainOutlookNote: string;
  todaysTip: string;
  warning?: string;
  suitableTimeOfDay: FarmMateSummaryTimeOfDay;
};

export function getFarmMateGreetingForHour(hour: number) {
  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }

  if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

export const farmMateDailySummaries: FarmMateDailySummary[] = [
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Check soil moisture before planting or watering.",
    rainOutlookNote: "If rain is likely later, avoid spraying and protect inputs.",
    todaysTip: "Dig a small finger hole near the roots; water only if the soil below the surface is dry.",
    warning: "Do not work fields that are flooded or sticky.",
    suitableTimeOfDay: "all_day"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Weed young crops while the sun is still gentle.",
    rainOutlookNote: "Check the sky and local forecast before opening large field work.",
    todaysTip: "Pull weeds before they form seed, then leave clean dry weeds as light mulch if they are disease-free.",
    suitableTimeOfDay: "morning"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Inspect maize plants for poor growth and leaf damage.",
    rainOutlookNote: "If heavy rain is likely, delay fertilizer until the soil is moist but not flooded.",
    todaysTip: "Open the whorl on a few weak plants and look for fresh feeding damage or droppings.",
    suitableTimeOfDay: "all_day"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Check tomato leaves before choosing any treatment.",
    rainOutlookNote: "Wet leaves can increase disease pressure, so avoid watering leaves directly.",
    todaysTip: "Remove badly diseased lower leaves from the field if they are dry enough to handle cleanly.",
    suitableTimeOfDay: "morning"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Prepare tools and inputs for tomorrow morning.",
    rainOutlookNote: "If rain is likely overnight, keep seed, fertilizer and produce covered.",
    todaysTip: "Disinfect pruning tools between plants, especially after working on sick crops.",
    suitableTimeOfDay: "evening"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Plan tomorrow's field work before resting.",
    rainOutlookNote: "Check local rain signs before deciding on spraying or fertilizer tomorrow.",
    todaysTip: "Put spray, fertilizer and harvesting tasks in separate groups so risky jobs are easier to delay if rain comes.",
    suitableTimeOfDay: "night"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Keep harvested produce shaded and off bare ground.",
    rainOutlookNote: "If rain is likely, keep bags, crates and drying produce under cover.",
    todaysTip: "Separate damaged produce before transport so one bad item does not spoil the rest.",
    suitableTimeOfDay: "afternoon"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Check drainage channels before the next heavy rain.",
    rainOutlookNote: "If rain is likely, clear blocked drains before water collects.",
    todaysTip: "Open blocked drains gently from the lowest point so water can leave without washing soil away.",
    suitableTimeOfDay: "all_day"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Water young vegetables early when the day is cool.",
    rainOutlookNote: "If rain is likely, check soil moisture before adding more water.",
    todaysTip: "Use a cup, can, or drip line close to the soil instead of splashing leaves.",
    suitableTimeOfDay: "morning"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Avoid fertilizer before heavy rain.",
    rainOutlookNote: "If heavy rain is likely, wait until the soil is moist but not waterlogged.",
    todaysTip: "Keep fertilizer bags covered and raised off the floor so moisture does not spoil them.",
    warning: "Fertilizer can wash away before roots use it.",
    suitableTimeOfDay: "all_day"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Check pest signs under leaves and inside flowers.",
    rainOutlookNote: "After wet weather, scout more often for spots, rot and insects.",
    todaysTip: "Shake a few leaves over white paper to spot tiny insects more easily.",
    suitableTimeOfDay: "morning"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Prepare seedlings for transplanting carefully.",
    rainOutlookNote: "Transplant when soil is moist, but delay if the field is waterlogged.",
    todaysTip: "Water seedlings lightly before moving them so roots hold together during transplanting.",
    suitableTimeOfDay: "afternoon"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Check cassava and plantain for early stress signs.",
    rainOutlookNote: "If the field is wet, watch low areas for waterlogging.",
    todaysTip: "Mark weak plantain mats or cassava stands with a stick so you can inspect them again in two days.",
    suitableTimeOfDay: "all_day"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Review today's harvest and keep good produce protected.",
    rainOutlookNote: "If rain is likely tonight, cover produce and keep it raised.",
    todaysTip: "Use crates, sacks, or clean boards to keep produce off damp floors overnight.",
    suitableTimeOfDay: "evening"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Clean tools and prepare seed trays for the next work session.",
    rainOutlookNote: "If conditions are damp, let tools dry before storage where possible.",
    todaysTip: "Disinfect pruning tools between plants, especially after working on sick crops.",
    suitableTimeOfDay: "night"
  }
];

export function getFarmMateDayPeriod(date = new Date()): FarmMateDayPeriod {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "evening";
  }

  return "night";
}

function localDateIndex(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return Math.floor((startOfDay.getTime() - startOfYear.getTime()) / 86_400_000);
}

function suitableSummariesForPeriod(period: FarmMateDayPeriod) {
  return farmMateDailySummaries.filter((summary) => summary.suitableTimeOfDay === "all_day" || summary.suitableTimeOfDay === period);
}

export function getFarmMateDailySummary(date = new Date()): FarmMateDailySummary {
  const period = getFarmMateDayPeriod(date);
  const pool = suitableSummariesForPeriod(period);
  const index = localDateIndex(date);

  return pool[index % pool.length] ?? farmMateDailySummaries[index % farmMateDailySummaries.length];
}
