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
        requiredForConfidence: true
      },
      {
        id: "tomato-leaf-spots",
        question: "Do you see brown spots, rings, curling or insects under the leaves?",
        requiredForConfidence: true
      },
      {
        id: "watering-pattern",
        question: "Has the crop received heavy rain or daily watering recently?",
        requiredForConfidence: false
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
    requiredInformation: {
      recentWeather: "Rain, wind and leaf wetness needed",
      farmPracticeContext: ["Spraying decision"]
    },
    followUpQuestions: [
      {
        id: "rain-window",
        question: "Is rain expected in the next 4-6 hours?",
        requiredForConfidence: true
      },
      {
        id: "leaf-wetness",
        question: "Are the leaves dry now?",
        requiredForConfidence: true
      },
      {
        id: "wind-level",
        question: "Is the wind calm enough that spray will not drift?",
        requiredForConfidence: true
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
    requiredInformation: {
      crop: "Pepper",
      growthStage: "Flowering",
      visibleSymptoms: ["Flower drop"]
    },
    followUpQuestions: [
      {
        id: "pepper-heat-water",
        question: "Has the farm been very hot, dry or irregularly watered this week?",
        requiredForConfidence: true
      },
      {
        id: "pepper-insects",
        question: "Do you see thrips, whiteflies or tiny insects in the flowers or under leaves?",
        requiredForConfidence: true
      },
      {
        id: "pepper-fertilizer",
        question: "Was fertilizer applied recently, and did the plants become very leafy?",
        requiredForConfidence: false
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
    id: "maize-not-growing-well",
    question: "Why is my maize not growing well?",
    intent: "fertilizer",
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
        requiredForConfidence: true
      },
      {
        id: "maize-waterlogging",
        question: "Has the plot been dry, flooded or waterlogged recently?",
        requiredForConfidence: true
      },
      {
        id: "maize-pest-damage",
        question: "Do you see holes, frass or damage in the maize whorl?",
        requiredForConfidence: true
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
