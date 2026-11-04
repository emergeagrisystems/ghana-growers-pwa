export type CropCalendarStage = {
  timing: string;
  stage: string;
  observation?: string;
  guidance: string;
};

export type CropCalendarGuide = {
  crop: string;
  seasonNote: string;
  stages: CropCalendarStage[];
};

export const farmMatePilotRegions = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North"
] as const;

export const cropCalendarSeasonOptions = [
  "Major rainy season",
  "Minor rainy season",
  "Dry season with irrigation"
] as const;

export const cropCalendarGuides: CropCalendarGuide[] = [
  {
    crop: "Maize",
    seasonNote: "Plant when steady rains have made the soil moist, or when reliable irrigation is available.",
    stages: [
      { timing: "Week 1", stage: "Plant", guidance: "Sow good seed into moist, well-drained soil." },
      { timing: "Week 2", stage: "Check establishment", observation: "Seedlings are emerging", guidance: "Check germination, fill important gaps and thin crowded seedlings." },
      { timing: "Weeks 3-4", stage: "Weed and feed", guidance: "Control weeds early and apply the first feeding only if appropriate for the field." },
      { timing: "Weeks 5-6", stage: "Scout the crop", observation: "Leaves form a central whorl", guidance: "Check the whorl and leaves for pests, disease and moisture stress." },
      { timing: "Week 8+", stage: "Watch crop development", observation: "Tassels or developing cobs are visible", guidance: "Track flowering, grain filling and harvest readiness based on the variety and crop growth." }
    ]
  },
  {
    crop: "Tomato",
    seasonNote: "Use healthy seedlings and plant when drainage, moisture and disease pressure can be managed.",
    stages: [
      { timing: "Week 1", stage: "Transplant", guidance: "Transplant hardened seedlings in the cool part of the day." },
      { timing: "Week 2", stage: "Check establishment", observation: "Transplants are establishing", guidance: "Replace failed plants and keep moisture steady without flooding roots." },
      { timing: "Weeks 3-4", stage: "Stake and weed", guidance: "Support plants, remove weeds and keep leaves away from wet soil." },
      { timing: "Weeks 5-7", stage: "Scout flowers and leaves", observation: "Flowers are visible", guidance: "Check for spots, curling, insects and flower stress." },
      { timing: "Week 8+", stage: "Monitor fruit and harvest", observation: "Fruit is developing or ripening", guidance: "Pick at the right maturity for use or transport and remove damaged fruit." }
    ]
  },
  {
    crop: "Pepper",
    seasonNote: "Plant strong seedlings where warmth, steady moisture and good drainage are available.",
    stages: [
      { timing: "Week 1", stage: "Transplant", guidance: "Move strong seedlings in the cool part of the day." },
      { timing: "Week 2", stage: "Check establishment", observation: "Transplants are establishing", guidance: "Replace failed plants and check for heat or water stress." },
      { timing: "Weeks 3-4", stage: "Weed and mulch", guidance: "Control weeds and use light mulch where suitable." },
      { timing: "Weeks 5-8", stage: "Scout flowering plants", observation: "Flowers or tiny fruit are visible", guidance: "Check leaves, flowers and young fruit for pests, disease and uneven watering." },
      { timing: "Week 9+", stage: "Harvest regularly", observation: "Fruit is ready for picking", guidance: "Pick suitable fruit regularly and remove damaged fruit from the field." }
    ]
  },
  {
    crop: "Cassava",
    seasonNote: "Plant healthy stem cuttings near reliable rains in soil that is moist but not flooded.",
    stages: [
      { timing: "Week 1", stage: "Plant cuttings", guidance: "Use healthy cuttings and place them correctly in prepared soil." },
      { timing: "Weeks 2-4", stage: "Check sprouting", observation: "Cuttings are sprouting", guidance: "Check establishment and replace important gaps with healthy material." },
      { timing: "Weeks 4-8", stage: "Control weeds", observation: "Young plants are still small", guidance: "Keep young cassava free from strong weed competition." },
      { timing: "Month 3+", stage: "Scout canopy and soil", observation: "Plants have a leafy canopy", guidance: "Watch for leaf symptoms, pests, erosion and poor drainage." },
      { timing: "Month 8+", stage: "Check root maturity", observation: "Roots are developing", guidance: "Assess variety maturity and root size before deciding when to harvest." }
    ]
  },
  {
    crop: "Yam",
    seasonNote: "Prepare loose, well-drained mounds or ridges before planting healthy seed yam or setts.",
    stages: [
      { timing: "Week 1", stage: "Plant setts", guidance: "Plant healthy material in prepared mounds or ridges." },
      { timing: "Weeks 2-4", stage: "Check emergence", observation: "Shoots are emerging", guidance: "Inspect sprouting and replace failed planting material where practical." },
      { timing: "Weeks 4-8", stage: "Stake and weed", observation: "Young vines need support", guidance: "Provide suitable vine support and control weeds around mounds." },
      { timing: "Month 3+", stage: "Manage vines", observation: "Vines cover the supports", guidance: "Check vine health, soil cover, pests and mound drainage." },
      { timing: "Month 7+", stage: "Watch maturity", observation: "Vines are dying back", guidance: "Use vine condition and the variety's normal cycle to judge harvest readiness." }
    ]
  },
  {
    crop: "Plantain",
    seasonNote: "Plant clean, healthy suckers when steady moisture is available and the site drains well.",
    stages: [
      { timing: "Week 1", stage: "Plant suckers", guidance: "Set healthy planting material in prepared holes with organic matter where available." },
      { timing: "Weeks 2-4", stage: "Check establishment", observation: "New leaves are emerging", guidance: "Keep soil moist, replace failed plants and check drainage." },
      { timing: "Months 2-3", stage: "Weed and mulch", guidance: "Control weeds and mulch without covering the plant base." },
      { timing: "Month 4+", stage: "Manage the mat", observation: "Several suckers are growing together", guidance: "Remove weak suckers and scout leaves and stems for damage." },
      { timing: "Month 9+", stage: "Watch bunch development", observation: "A bunch is filling", guidance: "Judge harvest readiness from bunch filling and the variety's growth, not the calendar alone." }
    ]
  },
  {
    crop: "Onion",
    seasonNote: "Use fine, well-drained beds and avoid periods when heavy rain may flood young onions.",
    stages: [
      { timing: "Week 1", stage: "Sow or transplant", guidance: "Place seed or healthy seedlings evenly in prepared beds." },
      { timing: "Week 2", stage: "Check establishment", observation: "Young plants are establishing", guidance: "Check gaps and maintain steady moisture without waterlogging." },
      { timing: "Weeks 3-4", stage: "Weed carefully", guidance: "Remove weeds early without damaging shallow roots." },
      { timing: "Weeks 5-8", stage: "Support bulb growth", observation: "Bulbs are swelling", guidance: "Watch moisture, leaf health and crowding as bulbs develop." },
      { timing: "Week 9+", stage: "Watch maturity", observation: "Tops are falling over", guidance: "Reduce unnecessary water and assess tops and bulb condition before harvest." }
    ]
  },
  {
    crop: "Okra",
    seasonNote: "Sow good seed in warm, moist soil with drainage and enough room for picking.",
    stages: [
      { timing: "Week 1", stage: "Plant", guidance: "Sow into moist soil and avoid waterlogged spots." },
      { timing: "Week 2", stage: "Check germination", observation: "Seedlings are emerging", guidance: "Fill important gaps and thin crowded seedlings." },
      { timing: "Weeks 3-4", stage: "Weed and mulch", guidance: "Control weeds early and conserve moisture where practical." },
      { timing: "Week 5", stage: "Scout flowering plants", observation: "Flowers are visible", guidance: "Check leaves, flowers and stems for pests and stress." },
      { timing: "Week 6+", stage: "Harvest young pods", observation: "Young pods are visible", guidance: "Pick suitable pods regularly so they do not become tough." }
    ]
  },
  {
    crop: "Cucumber",
    seasonNote: "Plant where vines have space, drainage is good and steady water is available.",
    stages: [
      { timing: "Week 1", stage: "Plant", guidance: "Direct-sow or carefully transplant young seedlings into moist beds." },
      { timing: "Week 2", stage: "Check establishment", observation: "Young plants are establishing", guidance: "Replace gaps and protect young plants from water stress." },
      { timing: "Weeks 3-4", stage: "Guide vines and weed", observation: "Vines are spreading", guidance: "Keep vines spaced, remove weeds and check leaf condition." },
      { timing: "Weeks 4-5", stage: "Scout flowers and fruit", observation: "Flowers or tiny fruit are visible", guidance: "Watch for insects, leaf disease and poor pollination." },
      { timing: "Week 6+", stage: "Harvest regularly", observation: "Fruit is growing to picking size", guidance: "Pick fruit at a suitable size and remove damaged fruit." }
    ]
  },
  {
    crop: "Garden eggs",
    seasonNote: "Transplant strong seedlings into warm, well-drained soil with reliable moisture.",
    stages: [
      { timing: "Week 1", stage: "Transplant", guidance: "Move strong seedlings in the cool part of the day." },
      { timing: "Week 2", stage: "Check establishment", observation: "Young plants are establishing", guidance: "Replace failed plants and maintain steady moisture." },
      { timing: "Weeks 3-4", stage: "Weed and mulch", guidance: "Control weeds and keep enough airflow around plants." },
      { timing: "Weeks 5-8", stage: "Scout flowers and leaves", observation: "Flowers are visible", guidance: "Check for insects, leaf damage, disease and flower stress." },
      { timing: "Week 9+", stage: "Harvest suitable fruit", observation: "Fruit is developing or ripening", guidance: "Pick regularly based on fruit size, condition and intended use." }
    ]
  }
];

export function findCropCalendarGuide(cropName?: string | null) {
  if (!cropName) {
    return undefined;
  }

  return cropCalendarGuides.find((guide) => guide.crop.toLowerCase() === cropName.toLowerCase());
}

export function cropCalendarFarmMateQuestion(crop: string, region: string) {
  return `I am following the crop calendar for ${crop} in ${region}. What should I watch for next?`;
}
