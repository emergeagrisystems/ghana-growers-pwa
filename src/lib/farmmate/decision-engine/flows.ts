import { decisionEngineSafetyRules } from "./safety-rules";
import { DecisionFlow, SustainabilityPriority } from "./types";

export const sustainabilityPriorityOrder: SustainabilityPriority[] = [
  "prevention",
  "good-farming-practice",
  "natural-low-cost-solution",
  "chemical-recommendation-if-appropriate"
];

export const farmMateDecisionFlows: DecisionFlow[] = [
  {
    id: "yellow-tomato-leaves",
    question: "Why are my tomato leaves turning yellow?",
    intent: "crop-health",
    possibleCauses: ["Excess water", "Nitrogen deficiency", "Early blight or another leaf disease", "Root stress"],
    requiredInformation: {
      crop: "Tomato",
      visibleSymptoms: ["Yellow leaves"],
      recentWeather: "Unknown",
      growthStage: "Unknown"
    },
    followUpQuestions: [
      {
        id: "yellowing-location",
        question: "Is the yellowing starting on the lower older leaves or the newer top leaves?",
        requiredForConfidence: true,
        options: ["Bottom leaves", "Top leaves", "Everywhere"]
      },
      {
        id: "tomato-leaf-spots",
        question: "Do you see brown spots, rings, curling or insects under the leaves?",
        requiredForConfidence: true,
        options: ["Brown spots or rings", "Curling or insects", "No, just yellow"]
      },
      {
        id: "watering-pattern",
        question: "Has the crop received heavy rain or daily watering recently?",
        requiredForConfidence: false,
        options: ["Heavy rain", "Daily watering", "No"]
      }
    ],
    recommendation: {
      summary: "Yellow tomato leaves may come from excess water, nitrogen deficiency or early disease pressure.",
      confidence: "medium",
      reasoning: [
        {
          id: "multiple-common-causes",
          observation: "Yellow leaves are a shared symptom across water stress, nutrient stress and disease.",
          interpretation: "FarmMate should avoid one-cause certainty until leaf position and spotting are known."
        },
        {
          id: "tomato-disease-risk",
          observation: "Tomatoes commonly show lower-leaf yellowing when humidity and splash spread fungal disease.",
          interpretation: "A crop photo can improve confidence before recommending treatment."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Inspect lower leaves and use Crop Doctor for a photo check before choosing treatment.",
      guidance: [
        "Check the lower leaves first.",
        "Avoid watering the leaves directly.",
        "Remove badly affected lower leaves only if disease signs are clear and tools are clean."
      ],
      nextBestAction: {
        id: "upload-tomato-photo",
        label: "Use Crop Doctor",
        instruction: "Upload a clear photo of the yellow tomato leaves before taking treatment decisions.",
        actionType: "use-crop-doctor"
      }
    },
    safetyRules: [decisionEngineSafetyRules[0], decisionEngineSafetyRules[1], decisionEngineSafetyRules[2]]
  },
  {
    id: "can-i-spray-today",
    question: "Can I spray today?",
    intent: "weather-decisions",
    possibleCauses: ["Rain wash-off risk", "Wind drift risk", "Wet leaves", "Heat stress risk"],
    requiredInformation: {
      recentWeather: "Rain, wind and leaf wetness needed",
      farmPracticeContext: ["Spraying decision"]
    },
    followUpQuestions: [
      {
        id: "rain-window",
        question: "Is rain expected in the next 4-6 hours?",
        requiredForConfidence: true,
        options: ["Yes", "No", "Not sure"]
      },
      {
        id: "leaf-wetness",
        question: "Are the leaves dry now?",
        requiredForConfidence: true,
        options: ["Dry", "Wet", "Not sure"]
      },
      {
        id: "wind-level",
        question: "Is the wind calm enough that spray will not drift?",
        requiredForConfidence: true,
        options: ["Calm", "Windy", "Not sure"]
      }
    ],
    recommendation: {
      summary: "Spraying is only advisable when leaves are dry, wind is low and rain is not expected soon.",
      confidence: "high",
      reasoning: [
        {
          id: "rain-washoff",
          observation: "Rain soon after spraying can wash products off leaves.",
          interpretation: "The farmer may waste money and get poor control if rain is likely."
        },
        {
          id: "wind-drift",
          observation: "Wind can move spray away from the target crop.",
          interpretation: "Spraying should wait when drift risk is high."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Spray only if leaves are dry, wind is calm and rain is not expected for 4-6 hours.",
      guidance: [
        "Prefer early morning when leaves are dry and wind is calm.",
        "Do not spray before rain.",
        "Follow the product label and local extension advice for any chemical."
      ],
      nextBestAction: {
        id: "check-rain-wind",
        label: "Check weather window",
        instruction: "Confirm no rain is expected for 4-6 hours and that wind is calm before spraying.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "pepper-flowers-dropping",
    question: "Why are my pepper flowers dropping?",
    intent: "crop-health",
    possibleCauses: ["Heat stress", "Irregular watering", "Poor pollination", "Insect pressure", "Nutrient imbalance"],
    requiredInformation: {
      crop: "Pepper",
      growthStage: "Flowering",
      visibleSymptoms: ["Flower drop"]
    },
    followUpQuestions: [
      {
        id: "pepper-heat-water",
        question: "Has the farm been very hot, dry or irregularly watered this week?",
        requiredForConfidence: true,
        options: ["Very hot or dry", "Irregular watering", "No"]
      },
      {
        id: "pepper-insects",
        question: "Do you see thrips, whiteflies or tiny insects in the flowers or under leaves?",
        requiredForConfidence: true,
        options: ["Yes", "No", "Not sure"]
      },
      {
        id: "pepper-fertilizer",
        question: "Was fertilizer applied recently, and did the plants become very leafy?",
        requiredForConfidence: false,
        options: ["Yes", "No", "Not sure"]
      }
    ],
    recommendation: {
      summary: "Pepper flower drop is often linked to heat or water stress, poor pollination, insect pressure or nutrient imbalance.",
      confidence: "medium",
      reasoning: [
        {
          id: "flowering-sensitive-stage",
          observation: "Pepper is sensitive during flowering.",
          interpretation: "Stress at this stage can reduce fruit set even when leaves look healthy."
        },
        {
          id: "insect-check-needed",
          observation: "Small insects can disturb flowers and young fruit.",
          interpretation: "The next decision needs a quick flower and leaf inspection."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Stabilize watering and inspect flowers for insects before applying any treatment.",
      guidance: [
        "Keep watering regular but avoid waterlogging.",
        "Mulch to reduce heat and moisture stress.",
        "Inspect flowers and leaf undersides before choosing any treatment."
      ],
      nextBestAction: {
        id: "inspect-pepper-flowers",
        label: "Inspect flowers",
        instruction: "Check 10 pepper plants for insects inside flowers and under leaves, then decide whether Crop Doctor or extension advice is needed.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[0], decisionEngineSafetyRules[1], decisionEngineSafetyRules[2]]
  },
  {
    id: "best-fertilizer-for-maize",
    question: "Best fertilizer for maize",
    intent: "fertilizer",
    possibleCauses: ["Maize growth stage is unknown", "Soil moisture may affect fertilizer safety", "Previous fertilizer or manure may already be enough for now"],
    requiredInformation: {
      crop: "Maize",
      growthStage: "Unknown",
      recentWeather: "Soil moisture and rain window needed",
      farmPracticeContext: ["Fertilizer choice", "Crop feeding"]
    },
    followUpQuestions: [
      {
        id: "maize-fertilizer-stage",
        question: "How old is the maize?",
        requiredForConfidence: true,
        options: ["Less than 2 weeks", "2 to 4 weeks", "More than 4 weeks", "Already flowering"]
      },
      {
        id: "fertilizer-rain-moisture",
        question: "Is the soil moist, dry, waterlogged, or is heavy rain expected soon?",
        requiredForConfidence: true,
        options: ["Soil is moist", "Soil is dry", "Soil is waterlogged", "Heavy rain expected soon"]
      },
      {
        id: "fertilizer-already-applied",
        question: "Have you already applied fertilizer, compost, or manure this season?",
        requiredForConfidence: true,
        options: ["No fertilizer yet", "Compost or manure applied", "NPK or urea applied", "Not sure"]
      }
    ],
    recommendation: {
      summary: "For maize, the right feeding step depends first on crop age, soil moisture and what has already been applied.",
      confidence: "medium",
      reasoning: [
        {
          id: "maize-stage-before-fertilizer",
          observation: "Maize nutrient needs change quickly from establishment to vegetative growth.",
          interpretation: "FarmMate should ask crop age before suggesting fertilizer type or timing."
        },
        {
          id: "maize-moisture-safety",
          observation: "Dry soil, waterlogging or heavy rain can waste fertilizer or stress the crop.",
          interpretation: "Moisture and rain timing must be checked before applying inputs."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Check maize age, soil moisture and previous feeding before choosing NPK, urea, compost or manure.",
      guidance: [
        "Do not apply fertilizer before heavy rain.",
        "Use compost or well-rotted manure to support soil organic matter where available.",
        "Ask an extension officer or soil test service for local rates before spending on fertilizer."
      ],
      nextBestAction: {
        id: "answer-maize-age",
        label: "Answer growth stage",
        instruction: "Share how old the maize is before choosing the feeding step.",
        actionType: "ask-follow-up"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2], decisionEngineSafetyRules[3]]
  },
  {
    id: "fertilizer-for-pepper",
    question: "What fertilizer for pepper?",
    intent: "fertilizer",
    possibleCauses: ["Pepper stage is unknown", "Excess nitrogen can affect flowering", "Moisture stress can make fertilizer unsafe"],
    requiredInformation: {
      crop: "Pepper",
      growthStage: "Unknown",
      recentWeather: "Soil moisture and rain window needed",
      farmPracticeContext: ["Fertilizer choice", "Pepper feeding"]
    },
    followUpQuestions: [
      {
        id: "pepper-fertilizer-stage",
        question: "What stage are the pepper plants in?",
        requiredForConfidence: true,
        options: ["Seedling", "Vegetative growth", "Flowering", "Fruiting"]
      },
      {
        id: "fertilizer-rain-moisture",
        question: "Is the soil moist, dry, waterlogged, or is heavy rain expected soon?",
        requiredForConfidence: true,
        options: ["Soil is moist", "Soil is dry", "Soil is waterlogged", "Heavy rain expected soon"]
      },
      {
        id: "fertilizer-already-applied",
        question: "Have you already applied fertilizer, compost, or manure this season?",
        requiredForConfidence: true,
        options: ["No fertilizer yet", "Compost or manure applied", "NPK or urea applied", "Not sure"]
      }
    ],
    recommendation: {
      summary: "For pepper, fertilizer advice depends on whether the crop is growing leaves, flowering or fruiting.",
      confidence: "medium",
      reasoning: [
        {
          id: "pepper-stage-sensitive",
          observation: "Pepper is sensitive during flowering and fruiting.",
          interpretation: "Too much nitrogen at the wrong time can push leaves instead of fruit."
        },
        {
          id: "pepper-moisture-check",
          observation: "Fertilizer on dry or waterlogged pepper can increase stress.",
          interpretation: "Soil moisture should be checked before feeding."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Check pepper stage and soil moisture before choosing a balanced fertilizer, compost or manure plan.",
      guidance: [
        "Do not apply before heavy rain.",
        "Avoid pushing too much nitrogen during flowering.",
        "Use compost to improve soil moisture and fertility where available."
      ],
      nextBestAction: {
        id: "answer-pepper-stage",
        label: "Answer growth stage",
        instruction: "Share the pepper growth stage before choosing the feeding step.",
        actionType: "ask-follow-up"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2], decisionEngineSafetyRules[3]]
  },
  {
    id: "compost-for-tomatoes",
    question: "Can I use compost for tomatoes?",
    intent: "fertilizer",
    possibleCauses: ["Compost maturity is unknown", "Tomato growth stage is unknown", "Fresh manure near vegetables can be unsafe"],
    requiredInformation: {
      crop: "Tomato",
      growthStage: "Unknown",
      farmPracticeContext: ["Compost", "Organic matter"]
    },
    followUpQuestions: [
      {
        id: "tomato-compost-stage",
        question: "What stage are the tomato plants in?",
        requiredForConfidence: true,
        options: ["Before planting", "Seedling", "Flowering", "Fruiting"]
      },
      {
        id: "compost-readiness",
        question: "Is the compost well-rotted, still hot/fresh, or are you not sure?",
        requiredForConfidence: true,
        options: ["Well-rotted", "Still hot or fresh", "Not sure"]
      },
      {
        id: "fertilizer-rain-moisture",
        question: "Is the soil moist, dry, waterlogged, or is heavy rain expected soon?",
        requiredForConfidence: false,
        options: ["Soil is moist", "Soil is dry", "Soil is waterlogged", "Heavy rain expected soon"]
      }
    ],
    recommendation: {
      summary: "Compost can help tomatoes, especially before planting, but it should be well-rotted and used with timing in mind.",
      confidence: "medium",
      reasoning: [
        {
          id: "tomato-compost-soil",
          observation: "Compost improves soil structure and moisture holding.",
          interpretation: "It supports tomato roots but does not replace all crop feeding decisions."
        },
        {
          id: "fresh-manure-risk",
          observation: "Fresh organic material can heat, burn roots or create food safety concerns.",
          interpretation: "FarmMate should ask whether compost is well-rotted."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Use only well-rotted compost, preferably before planting or as a careful soil amendment away from stems.",
      guidance: [
        "Do not use fresh manure close to harvest.",
        "Keep compost away from direct stem contact.",
        "Mulch and steady watering help tomatoes use nutrients better."
      ],
      nextBestAction: {
        id: "check-compost-readiness",
        label: "Check compost",
        instruction: "Confirm whether the compost is well-rotted before using it around tomatoes.",
        actionType: "ask-follow-up"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2], decisionEngineSafetyRules[3]]
  },
  {
    id: "fertilizer-after-rain",
    question: "When to apply fertilizer after rain?",
    intent: "fertilizer",
    possibleCauses: ["Soil may be too wet", "More heavy rain may be coming", "Crop stage and fertilizer type are unknown"],
    requiredInformation: {
      recentWeather: "Rain timing and soil moisture needed",
      farmPracticeContext: ["Fertilizer timing after rain"]
    },
    followUpQuestions: [
      {
        id: "after-rain-soil-state",
        question: "What is the soil like now after the rain?",
        requiredForConfidence: true,
        options: ["Moist but not flooded", "Still waterlogged", "Dry again", "Not sure"]
      },
      {
        id: "rain-forecast-fertilizer",
        question: "Is more heavy rain expected soon?",
        requiredForConfidence: true,
        options: ["Yes", "No", "Not sure"]
      },
      {
        id: "fertilizer-crop-stage",
        question: "What crop and growth stage are you feeding?",
        requiredForConfidence: false,
        options: ["Young crop", "Vegetative growth", "Flowering or fruiting", "Not sure"]
      }
    ],
    recommendation: {
      summary: "After rain, fertilizer is safer when the soil is moist but not waterlogged and more heavy rain is not expected soon.",
      confidence: "medium",
      reasoning: [
        {
          id: "rain-runoff-leaching",
          observation: "Heavy rain can wash fertilizer away or move nutrients below roots.",
          interpretation: "Applying before another storm can waste money and increase runoff."
        },
        {
          id: "moisture-needed",
          observation: "Some soil moisture helps fertilizer become available to roots.",
          interpretation: "Moist but not flooded soil is usually safer than dry or waterlogged soil."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Wait until the soil is moist but not waterlogged, and avoid applying fertilizer before more heavy rain.",
      guidance: [
        "Do not apply before heavy rain.",
        "Avoid applying on dry stressed crops.",
        "Use compost and mulch to reduce nutrient loss over time."
      ],
      nextBestAction: {
        id: "check-soil-after-rain",
        label: "Check soil",
        instruction: "Check whether the soil is moist but not waterlogged before applying fertilizer.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2], decisionEngineSafetyRules[3]]
  },
  {
    id: "yellow-maize-nutrient-stress",
    question: "Yellow maize leaves nutrient stress",
    intent: "crop-health",
    possibleCauses: ["Nitrogen shortage", "Waterlogging and root stress", "Nutrient leaching after rain", "Pest or disease stress"],
    requiredInformation: {
      crop: "Maize",
      visibleSymptoms: ["Yellow leaves"],
      growthStage: "Unknown",
      recentWeather: "Unknown"
    },
    followUpQuestions: [
      {
        id: "maize-yellow-location",
        question: "Where is the yellowing strongest on the maize?",
        requiredForConfidence: true,
        options: ["Older lower leaves", "New top leaves", "Whole plant"]
      },
      {
        id: "maize-yellow-rain",
        question: "Has there been heavy rain, dry soil, or waterlogging recently?",
        requiredForConfidence: true,
        options: ["Heavy rain", "Dry soil", "Waterlogging", "No"]
      },
      {
        id: "fertilizer-already-applied",
        question: "Have you already applied fertilizer, compost, or manure this season?",
        requiredForConfidence: false,
        options: ["No fertilizer yet", "Compost or manure applied", "NPK or urea applied", "Not sure"]
      }
    ],
    recommendation: {
      summary: "Yellow maize leaves may be nutrient stress, but water stress, waterlogging or pests can look similar.",
      confidence: "medium",
      reasoning: [
        {
          id: "yellow-maize-overlap",
          observation: "Yellow leaves can come from nutrient shortage or root stress.",
          interpretation: "FarmMate should not confirm deficiency without leaf position and field moisture."
        },
        {
          id: "rain-leaching",
          observation: "Heavy rain can leach nutrients and waterlog roots.",
          interpretation: "Rain history affects whether fertilizer is helpful or wasteful."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Check yellowing position, soil moisture and any previous fertilizer before deciding on feeding.",
      guidance: [
        "Do not apply fertilizer before heavy rain.",
        "Do not feed dry or waterlogged stressed maize without caution.",
        "Confirm with a soil test or extension officer if many plants are affected."
      ],
      nextBestAction: {
        id: "inspect-yellow-maize",
        label: "Inspect maize",
        instruction: "Check 20 maize plants for yellowing position, soil moisture and whorl damage before applying fertilizer.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[0], decisionEngineSafetyRules[2], decisionEngineSafetyRules[3]]
  },
  {
    id: "maize-not-growing-well",
    question: "Why is my maize not growing well?",
    intent: "fertilizer",
    possibleCauses: ["Low nitrogen", "Poor early root growth", "Water stress", "Waterlogging", "Fall armyworm damage"],
    requiredInformation: {
      crop: "Maize",
      growthStage: "Vegetative growth",
      visibleSymptoms: ["Slow growth"],
      recentWeather: "Unknown"
    },
    followUpQuestions: [
      {
        id: "maize-leaf-colour",
        question: "Are the older leaves pale yellow, purple, or still green?",
        requiredForConfidence: true,
        options: ["Pale yellow", "Purple", "Still green"]
      },
      {
        id: "maize-waterlogging",
        question: "Has the plot been dry, flooded or waterlogged recently?",
        requiredForConfidence: true,
        options: ["Dry", "Flooded or waterlogged", "Neither"]
      },
      {
        id: "maize-pest-damage",
        question: "Do you see holes, frass or damage in the maize whorl?",
        requiredForConfidence: true,
        options: ["Yes", "No", "Not sure"]
      }
    ],
    recommendation: {
      summary: "Poor maize growth may be caused by low soil fertility, water stress, waterlogging or early pest damage.",
      confidence: "medium",
      reasoning: [
        {
          id: "maize-growth-overlap",
          observation: "Slow maize growth can come from nutrient, water or pest problems.",
          interpretation: "Leaf colour, soil moisture and whorl damage help separate the causes."
        },
        {
          id: "fertility-common",
          observation: "Maize often shows poor growth when nitrogen is low or leached after rain.",
          interpretation: "Fertilizer guidance should stay general until growth stage and past application are known."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Check leaf colour, soil moisture and whorl damage before deciding on fertilizer or pest control.",
      guidance: [
        "Check soil moisture and drainage first.",
        "Inspect the whorl for fall armyworm damage.",
        "If leaves are pale from the bottom upward, ask an extension officer about suitable nitrogen timing and rates."
      ],
      nextBestAction: {
        id: "check-maize-whorl-and-leaves",
        label: "Check plants",
        instruction: "Inspect 20 maize plants for leaf colour, whorl damage and soil moisture before applying fertilizer or pest control.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[0], decisionEngineSafetyRules[2], decisionEngineSafetyRules[3]]
  }
];

export function findDecisionFlow(flowId: string) {
  return farmMateDecisionFlows.find((flow) => flow.id === flowId);
}
