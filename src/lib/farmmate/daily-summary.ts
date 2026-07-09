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

export const farmMateDailySummaries: FarmMateDailySummary[] = [
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Check soil moisture before planting or watering.",
    rainOutlookNote: "If rain is likely later, avoid spraying and protect inputs.",
    todaysTip: "Moist soil should hold together lightly without feeling waterlogged.",
    warning: "Do not work fields that are flooded or sticky.",
    suitableTimeOfDay: "all_day"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Weed young crops while the sun is still gentle.",
    rainOutlookNote: "Check the sky and local forecast before opening large field work.",
    todaysTip: "Small weeds are easier to remove before they compete with maize or vegetables.",
    suitableTimeOfDay: "morning"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Inspect maize plants for poor growth and leaf damage.",
    rainOutlookNote: "If heavy rain is likely, delay fertilizer until the soil is moist but not flooded.",
    todaysTip: "Check the whorl and older leaves on at least 20 maize plants.",
    suitableTimeOfDay: "all_day"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Check tomato leaves before choosing any treatment.",
    rainOutlookNote: "Wet leaves can increase disease pressure, so avoid watering leaves directly.",
    todaysTip: "Look first at the lower leaves for yellowing, spots or early disease signs.",
    suitableTimeOfDay: "morning"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Prepare tools and inputs for tomorrow morning.",
    rainOutlookNote: "If rain is likely overnight, keep seed, fertilizer and produce covered.",
    todaysTip: "Clean hand tools after use to reduce disease spread between plants.",
    suitableTimeOfDay: "evening"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Plan tomorrow's field work before resting.",
    rainOutlookNote: "Check local rain signs before deciding on spraying or fertilizer tomorrow.",
    todaysTip: "List the first farm task for the morning so work starts quickly.",
    suitableTimeOfDay: "night"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Keep harvested produce shaded and off bare ground.",
    rainOutlookNote: "If rain is likely, keep bags, crates and drying produce under cover.",
    todaysTip: "Shade helps reduce heat damage before pickup or market.",
    suitableTimeOfDay: "afternoon"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Check drainage channels before the next heavy rain.",
    rainOutlookNote: "If rain is likely, clear blocked drains before water collects.",
    todaysTip: "Good drainage protects roots and reduces fertilizer waste.",
    suitableTimeOfDay: "all_day"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Water young vegetables early when the day is cool.",
    rainOutlookNote: "If rain is likely, check soil moisture before adding more water.",
    todaysTip: "Water at soil level to reduce leaf disease risk.",
    suitableTimeOfDay: "morning"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Avoid fertilizer before heavy rain.",
    rainOutlookNote: "If heavy rain is likely, wait until the soil is moist but not waterlogged.",
    todaysTip: "Compost and mulch can help soil hold nutrients and moisture.",
    warning: "Fertilizer can wash away before roots use it.",
    suitableTimeOfDay: "all_day"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Check pest signs under leaves and inside flowers.",
    rainOutlookNote: "After wet weather, scout more often for spots, rot and insects.",
    todaysTip: "Look under leaves for whiteflies, eggs, holes or sticky marks.",
    suitableTimeOfDay: "morning"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Prepare seedlings for transplanting carefully.",
    rainOutlookNote: "Transplant when soil is moist, but delay if the field is waterlogged.",
    todaysTip: "Move seedlings in the cool morning or late afternoon to reduce stress.",
    suitableTimeOfDay: "afternoon"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Check cassava and plantain for early stress signs.",
    rainOutlookNote: "If the field is wet, watch low areas for waterlogging.",
    todaysTip: "Remove badly diseased planting material and use healthy suckers or cuttings.",
    suitableTimeOfDay: "all_day"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Review today's harvest and keep good produce protected.",
    rainOutlookNote: "If rain is likely tonight, cover produce and keep it raised.",
    todaysTip: "Separate damaged or soft produce from good produce before storage.",
    suitableTimeOfDay: "evening"
  },
  {
    title: "Today's Farm Summary",
    mainRecommendation: "Clean tools and prepare seed trays for the next work session.",
    rainOutlookNote: "If conditions are damp, let tools dry before storage where possible.",
    todaysTip: "Clean tools help reduce disease spread in nurseries and vegetable beds.",
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
