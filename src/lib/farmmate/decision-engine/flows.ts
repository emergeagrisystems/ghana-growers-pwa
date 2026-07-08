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
