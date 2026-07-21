import { decisionEngineSafetyRules } from "./safety-rules";
import { generalAgronomyDecisionFlows } from "../general-agronomy-specialist";
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
        question: "Is rain expected in the next 4 to 6 hours?",
        requiredForConfidence: true,
        options: ["Yes, rain is expected", "No rain expected", "I am not sure"]
      },
      {
        id: "wind-level",
        question: "Is the wind calm?",
        requiredForConfidence: true,
        options: ["Yes, wind is calm", "No, it is windy", "I am not sure"]
      },
      {
        id: "leaf-wetness",
        question: "Are the leaves dry?",
        requiredForConfidence: true,
        options: ["Yes, leaves are dry", "No, leaves are wet", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "Before spraying, check whether rain is expected in the next 4 to 6 hours, wind is calm and leaves are dry.",
      confidence: "medium",
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
      recommendedAction: "Spray only if leaves are dry, wind is calm and rain is not expected for 4 to 6 hours.",
      guidance: [
        "Prefer early morning when leaves are dry and wind is calm.",
        "Do not spray before rain.",
        "Follow the product label and local extension advice for any chemical."
      ],
      nextBestAction: {
        id: "check-rain-wind",
        label: "Check weather window",
        instruction: "Confirm no rain is expected for 4 to 6 hours and that wind is calm before spraying.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "fertilizer-before-rain",
    question: "Can I apply fertilizer before rain?",
    intent: "weather-decisions",
    possibleCauses: ["Heavy rain runoff risk", "Nutrient leaching risk", "Waterlogged soil", "Dry soil before rain"],
    requiredInformation: {
      recentWeather: "Rain expectation and soil wetness needed",
      farmPracticeContext: ["Fertilizer before rain", "Runoff prevention"]
    },
    followUpQuestions: [
      {
        id: "weather-rain-expectation",
        question: "Is heavy rain expected soon?",
        requiredForConfidence: true,
        options: ["Yes, heavy rain is expected", "No heavy rain expected", "I am not sure"]
      },
      {
        id: "weather-soil-wetness",
        question: "Is the soil dry, moist, or already waterlogged?",
        requiredForConfidence: true,
        options: ["Soil is dry", "Soil is moist", "Soil is waterlogged", "I am not sure"]
      },
      {
        id: "weather-fertilizer-timing",
        question: "Is the fertilizer for a young crop, an actively growing crop, or a crop near harvest?",
        requiredForConfidence: false,
        options: ["Young crop", "Actively growing crop", "Near harvest", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "Rain timing matters before applying fertilizer because heavy rain can wash nutrients away.",
      confidence: "medium",
      reasoning: [
        {
          id: "fertilizer-runoff-risk",
          observation: "Heavy rain can move fertilizer away from crop roots.",
          interpretation: "FarmMate should warn about runoff and avoid recommending fertilizer before heavy rain."
        },
        {
          id: "soil-water-state",
          observation: "Dry or waterlogged soil can make fertilizer less useful or more risky.",
          interpretation: "Soil wetness should be checked before applying fertilizer."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Do not apply fertilizer before heavy rain; wait until soil is moist but not waterlogged and rain risk is lower.",
      guidance: [
        "Avoid fertilizer runoff before heavy rain.",
        "Do not work waterlogged soil.",
        "Use compost or mulch where available to reduce nutrient loss."
      ],
      nextBestAction: {
        id: "check-rain-before-fertilizer",
        label: "Check rain first",
        instruction: "Confirm whether heavy rain is expected before applying fertilizer.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2], decisionEngineSafetyRules[3]]
  },
  {
    id: "should-i-irrigate-today",
    question: "Should I irrigate today?",
    intent: "weather-decisions",
    possibleCauses: ["Dry soil", "Rain may be expected soon", "Waterlogged soil", "Crop wilting from heat"],
    requiredInformation: {
      recentWeather: "Rain expectation and soil moisture needed",
      farmPracticeContext: ["Irrigation decision"]
    },
    followUpQuestions: [
      {
        id: "weather-rain-expectation",
        question: "Is rain expected today or tonight?",
        requiredForConfidence: true,
        options: ["Yes, rain is expected", "No rain expected", "I am not sure"]
      },
      {
        id: "weather-soil-wetness",
        question: "Is the soil dry, moist, or waterlogged?",
        requiredForConfidence: true,
        options: ["Soil is dry", "Soil is moist", "Soil is waterlogged", "I am not sure"]
      },
      {
        id: "weather-crop-wilting",
        question: "Is the crop still wilting in the morning or evening?",
        requiredForConfidence: false,
        options: ["Wilting in cool hours", "Only wilting in hot afternoon", "Not wilting", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "Irrigation depends on soil moisture and whether rain is expected soon.",
      confidence: "medium",
      reasoning: [
        {
          id: "avoid-overwatering",
          observation: "Watering before rain or on waterlogged soil can stress roots.",
          interpretation: "FarmMate should check soil wetness before recommending irrigation."
        },
        {
          id: "dry-soil-water-need",
          observation: "Dry soil and wilting in cool hours can show real water stress.",
          interpretation: "Watering at soil level may help when rain is not expected soon."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Water only if the soil is dry and rain is not expected soon; avoid irrigating waterlogged soil.",
      guidance: [
        "Check soil moisture before watering.",
        "Water at soil level instead of wetting leaves.",
        "Mulch where available to save water."
      ],
      nextBestAction: {
        id: "check-soil-before-irrigation",
        label: "Check soil moisture",
        instruction: "Check whether the soil is dry before irrigating.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "when-should-i-harvest-maize",
    question: "When should I harvest maize?",
    intent: "harvest",
    possibleCauses: ["Maize maturity is not confirmed", "Rain may affect drying", "Storage or drying plan is unknown"],
    requiredInformation: {
      crop: "Maize",
      growthStage: "Maturity unknown",
      recentWeather: "Rain risk if harvest is close",
      farmPracticeContext: ["Harvest timing", "Drying", "Storage preparation"]
    },
    followUpQuestions: [
      {
        id: "maize-harvest-stage",
        question: "What stage is the maize at?",
        requiredForConfidence: true,
        options: ["Cobs are still green", "Husks are drying", "Grains are hard", "I am not sure"]
      },
      {
        id: "maize-rain-risk",
        question: "Is rain likely before you can dry or store the maize?",
        requiredForConfidence: false,
        options: ["Yes, rain is likely", "No rain expected", "I am not sure"]
      },
      {
        id: "maize-drying-plan",
        question: "Do you have a clean dry place for the harvested maize?",
        requiredForConfidence: true,
        options: ["Yes, clean dry place", "No dry place ready", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "Maize is safer to harvest when husks are dry and grains are hard, then dried properly before storage.",
      confidence: "medium",
      reasoning: [
        {
          id: "maize-hard-grain",
          observation: "Hard grains and drying husks show harvest readiness.",
          interpretation: "Soft or green maize may not store well."
        },
        {
          id: "maize-storage-risk",
          observation: "Damp maize can mould in storage.",
          interpretation: "Drying and clean storage matter before bagging."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Harvest maize when grains are hard and husks are dry; keep it off bare ground and dry it well before storage.",
      guidance: [
        "Check grain hardness before harvesting.",
        "Do not bag damp maize.",
        "Separate mouldy or insect-damaged cobs."
      ],
      nextBestAction: {
        id: "check-maize-harvest-stage",
        label: "Check maize stage",
        instruction: "Check whether maize grains are hard and husks are drying before harvesting.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "tomatoes-ready-for-harvest",
    question: "How do I know tomatoes are ready?",
    intent: "harvest",
    possibleCauses: ["Buyer ripeness preference is unknown", "Transport distance affects harvest stage", "Fruit firmness and colour need checking"],
    requiredInformation: {
      crop: "Tomato",
      growthStage: "Harvest readiness",
      farmPracticeContext: ["Maturity signs", "Sorting", "Transport quality"]
    },
    followUpQuestions: [
      {
        id: "tomato-ripeness-stage",
        question: "What colour and firmness are the tomatoes?",
        requiredForConfidence: true,
        options: ["Firm-ripe", "Fully ripe", "Mostly green", "Mixed ripeness"]
      },
      {
        id: "tomato-transport-distance",
        question: "Will the tomatoes travel far before sale or use?",
        requiredForConfidence: false,
        options: ["Yes, long distance", "No, nearby", "I am not sure"]
      },
      {
        id: "tomato-damage-check",
        question: "Are any tomatoes cracked, soft or rotten?",
        requiredForConfidence: true,
        options: ["Many damaged", "Only a few damaged", "No clear damage"]
      }
    ],
    recommendation: {
      summary: "Tomatoes are ready when colour and firmness match the buyer need, but damaged fruit should be sorted out before packing.",
      confidence: "medium",
      reasoning: [
        {
          id: "tomato-ripeness-purpose",
          observation: "Fully ripe tomatoes bruise more easily during transport.",
          interpretation: "Firm-ripe tomatoes are often safer for longer trips."
        },
        {
          id: "tomato-damage-spread",
          observation: "Rotten tomatoes can spoil good fruit nearby.",
          interpretation: "Sorting protects quality and buyer trust."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Harvest tomatoes at the buyer-preferred ripeness, keep them shaded, and separate cracked, soft or rotten fruit.",
      guidance: [
        "Do not leave harvested tomatoes in hot sun.",
        "Sort damaged fruit away from good fruit.",
        "Use clean crates or shallow containers where possible."
      ],
      nextBestAction: {
        id: "sort-tomato-ripeness",
        label: "Sort tomatoes",
        instruction: "Sort tomatoes by ripeness and remove damaged fruit before packing.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "store-cassava-after-harvest",
    question: "How do I store cassava?",
    intent: "harvest",
    possibleCauses: ["Cassava may already be harvested", "Roots can deteriorate quickly", "Rot or damage may spread in a pile"],
    requiredInformation: {
      crop: "Cassava",
      farmPracticeContext: ["Short-term storage", "Sorting", "Quality protection"]
    },
    followUpQuestions: [
      {
        id: "cassava-harvest-status",
        question: "Has the cassava already been harvested?",
        requiredForConfidence: true,
        options: ["Yes, harvested today", "Yes, harvested yesterday or earlier", "Not harvested yet", "I am not sure"]
      },
      {
        id: "cassava-damage-check",
        question: "Do any roots look cut, soft, rotten or mouldy?",
        requiredForConfidence: true,
        options: ["Yes, damaged roots", "No clear damage", "I am not sure"]
      },
      {
        id: "cassava-use-plan",
        question: "Can the roots be used, processed or moved soon?",
        requiredForConfidence: false,
        options: ["Yes, soon", "No plan yet", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "Cassava is best used, processed or sold soon after harvest, with damaged roots separated early.",
      confidence: "medium",
      reasoning: [
        {
          id: "cassava-short-storage",
          observation: "Cassava roots lose quality quickly after harvest.",
          interpretation: "FarmMate should avoid promising long shelf life."
        },
        {
          id: "cassava-rot-separation",
          observation: "Soft or rotten roots can affect nearby good roots.",
          interpretation: "Sorting protects the rest of the harvest."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Keep cassava roots shaded, use or move them soon, and separate any soft, rotten or mouldy roots from healthy roots.",
      guidance: [
        "Do not leave harvested roots in hot sun.",
        "Do not mix rotten or mouldy roots with healthy roots.",
        "Contact an extension officer or food safety expert if serious rot or contamination is visible."
      ],
      nextBestAction: {
        id: "sort-cassava-roots",
        label: "Sort cassava roots",
        instruction: "Separate damaged cassava roots and keep good roots shaded for quick use or movement.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "reduce-post-harvest-losses",
    question: "How do I reduce losses after harvest?",
    intent: "harvest",
    possibleCauses: ["Heat exposure", "Rough handling", "Damaged produce mixed with good produce", "Poor ventilation"],
    requiredInformation: {
      farmPracticeContext: ["Loss reduction", "Sorting", "Storage and transport"]
    },
    followUpQuestions: [
      {
        id: "loss-reduction-produce",
        question: "Which produce are you handling?",
        requiredForConfidence: true,
        options: ["Vegetables", "Roots or tubers", "Grains", "I am not sure"]
      },
      {
        id: "loss-reduction-damage",
        question: "Do you see rotten, mouldy, bruised or broken produce?",
        requiredForConfidence: true,
        options: ["Yes, many", "Only a few", "No clear damage"]
      },
      {
        id: "loss-reduction-storage",
        question: "Will the produce be stored, transported or sold soon?",
        requiredForConfidence: false,
        options: ["Stored", "Transported", "Sold soon", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "Most post-harvest loss reduction starts with shade, gentle handling, sorting and clean ventilated containers.",
      confidence: "medium",
      reasoning: [
        {
          id: "heat-loss-risk",
          observation: "Hot sun can reduce freshness after harvest.",
          interpretation: "Shade protects produce quality."
        },
        {
          id: "damage-loss-risk",
          observation: "Damaged or rotten produce can reduce the quality of the whole lot.",
          interpretation: "Sorting early protects buyer trust."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Move produce into shade, sort damaged produce away, and use clean crates or containers with ventilation where possible.",
      guidance: [
        "Do not leave harvested produce in hot sun.",
        "Do not pack wet produce tightly.",
        "Separate rotten or mouldy produce from healthy produce."
      ],
      nextBestAction: {
        id: "shade-and-sort-produce",
        label: "Shade and sort",
        instruction: "Move harvested produce into shade and separate damaged produce from good produce.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "pack-vegetables-for-transport",
    question: "How do I pack vegetables for transport?",
    intent: "harvest",
    possibleCauses: ["Ripeness is unknown", "Containers may be too deep or dirty", "Wet produce may spoil faster"],
    requiredInformation: {
      farmPracticeContext: ["Transport preparation", "Packing", "Quality protection"]
    },
    followUpQuestions: [
      {
        id: "tomato-transport-ripeness",
        question: "Are the tomatoes fully ripe or firm-ripe?",
        requiredForConfidence: true,
        options: ["Fully ripe", "Firm-ripe", "Mixed ripeness", "I am not sure"]
      },
      {
        id: "vegetable-transport-container",
        question: "What container will you use for transport?",
        requiredForConfidence: true,
        options: ["Clean crates", "Sacks or bags", "Mixed containers", "I am not sure"]
      },
      {
        id: "vegetable-transport-wetness",
        question: "Is the produce dry or wet now?",
        requiredForConfidence: false,
        options: ["Dry", "Wet", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "Vegetables should be sorted, shaded and packed in clean containers that reduce bruising and allow airflow.",
      confidence: "medium",
      reasoning: [
        {
          id: "transport-ripeness-risk",
          observation: "Fully ripe vegetables bruise more easily during transport.",
          interpretation: "Ripeness should guide packing and travel distance."
        },
        {
          id: "transport-wetness-risk",
          observation: "Wet produce packed tightly can spoil faster.",
          interpretation: "Ventilation and gentle packing protect quality."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Sort damaged produce away, keep vegetables shaded, and pack gently in clean crates or clean ventilated containers where possible.",
      guidance: [
        "Do not pack wet produce tightly.",
        "Do not mix rotten produce with healthy produce.",
        "Use clean crates or clean containers where possible."
      ],
      nextBestAction: {
        id: "sort-before-transport",
        label: "Sort before transport",
        instruction: "Sort damaged vegetables away before packing for transport.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "harvest-before-rain",
    question: "Can I harvest before rain?",
    intent: "harvest",
    possibleCauses: ["Rain may damage mature produce", "Produce may spoil if harvested wet", "Crop may not be mature enough"],
    requiredInformation: {
      crop: "Unknown",
      recentWeather: "Rain expectation needed",
      farmPracticeContext: ["Harvest before rain", "Post-harvest loss prevention"]
    },
    followUpQuestions: [
      {
        id: "harvest-before-rain-crop",
        question: "Which crop or produce are you harvesting?",
        requiredForConfidence: true,
        options: ["Vegetables", "Roots or tubers", "Grains", "I am not sure"]
      },
      {
        id: "harvest-rain-expectation",
        question: "Is heavy rain expected soon?",
        requiredForConfidence: true,
        options: ["Yes, heavy rain is expected", "No heavy rain expected", "I am not sure"]
      },
      {
        id: "harvest-maturity-check",
        question: "Is the produce mature enough to harvest?",
        requiredForConfidence: true,
        options: ["Mature and ready", "Not fully ready", "I am not sure"]
      },
      {
        id: "harvest-storage-check",
        question: "Can you keep the harvested produce dry and shaded?",
        requiredForConfidence: false,
        options: ["Yes, I can keep it dry", "No dry place available", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "Harvesting before rain can reduce loss when produce is mature and rain may damage quality.",
      confidence: "medium",
      reasoning: [
        {
          id: "mature-produce-rain-risk",
          observation: "Heavy rain can damage or reduce quality of some mature produce.",
          interpretation: "FarmMate should recommend harvesting mature produce first when loss risk is high."
        },
        {
          id: "wet-storage-risk",
          observation: "Wet harvested produce can spoil faster.",
          interpretation: "Dry shade and handling matter after harvest."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Harvest mature produce before heavy rain if rain may damage it, then keep it dry and shaded.",
      guidance: [
        "Do not harvest immature produce only because rain may come.",
        "Keep harvested produce off wet ground.",
        "Sort damaged produce early."
      ],
      nextBestAction: {
        id: "harvest-mature-produce-first",
        label: "Harvest mature produce",
        instruction: "Harvest mature produce first if heavy rain may damage it.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "dry-produce-outside",
    question: "Can I dry produce outside?",
    intent: "weather-decisions",
    possibleCauses: ["Rain may wet produce", "Damp produce can mould", "Dirty drying surface", "No quick cover available"],
    requiredInformation: {
      recentWeather: "Rain expectation needed",
      farmPracticeContext: ["Drying produce outside", "Post-harvest loss prevention"]
    },
    followUpQuestions: [
      {
        id: "weather-rain-expectation",
        question: "Is rain likely today?",
        requiredForConfidence: true,
        options: ["Yes, rain is likely", "No rain expected", "I am not sure"]
      },
      {
        id: "weather-drying-surface",
        question: "Will the produce be on a clean raised surface?",
        requiredForConfidence: true,
        options: ["Clean raised surface", "Bare ground", "I am not sure"]
      },
      {
        id: "weather-drying-cover",
        question: "Can you cover or move the produce quickly if clouds build up?",
        requiredForConfidence: false,
        options: ["Yes, I can cover it", "No cover ready", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "Dry produce outside only when rain risk is low and the produce can stay clean and dry.",
      confidence: "medium",
      reasoning: [
        {
          id: "drying-rain-risk",
          observation: "Rain can wet drying produce and increase mould risk.",
          interpretation: "FarmMate should not recommend outdoor drying when rain risk is unclear."
        },
        {
          id: "clean-drying-surface",
          observation: "Drying on bare ground can contaminate produce.",
          interpretation: "A clean raised surface protects quality."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Dry outside only if rain risk is low, the surface is clean and raised, and you can cover the produce quickly.",
      guidance: [
        "Do not dry on bare ground.",
        "Keep a cover ready.",
        "Move produce under shelter if clouds build up."
      ],
      nextBestAction: {
        id: "check-rain-before-drying",
        label: "Check rain risk",
        instruction: "Check rain risk before drying produce outside.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "planting-before-rain",
    question: "Can I plant before rain?",
    intent: "weather-decisions",
    possibleCauses: ["Light rain may help germination", "Heavy rain may wash seeds away", "Waterlogged soil may rot seed"],
    requiredInformation: {
      recentWeather: "Rain expectation and soil wetness needed",
      farmPracticeContext: ["Planting before rain"]
    },
    followUpQuestions: [
      {
        id: "weather-rain-expectation",
        question: "Is the rain expected to be light or heavy?",
        requiredForConfidence: true,
        options: ["Light rain expected", "Heavy rain expected", "I am not sure"]
      },
      {
        id: "weather-soil-wetness",
        question: "Is the soil moist, dry, or waterlogged now?",
        requiredForConfidence: true,
        options: ["Soil is moist", "Soil is dry", "Soil is waterlogged", "I am not sure"]
      },
      {
        id: "weather-field-drainage",
        question: "Does the field drain well after rain?",
        requiredForConfidence: false,
        options: ["Drains well", "Holds water", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "Planting before rain can help if rain is light, but heavy rain can wash seed away or waterlog the field.",
      confidence: "medium",
      reasoning: [
        {
          id: "light-rain-planting-benefit",
          observation: "Light rain can support germination.",
          interpretation: "Rain can help planting when soil is not waterlogged."
        },
        {
          id: "heavy-rain-planting-risk",
          observation: "Heavy rain can wash seed away and damage soil structure.",
          interpretation: "FarmMate should ask about rain strength and drainage before recommending planting."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Plant when soil is moist and rain is not expected to be heavy; delay if the field may flood or wash seed away.",
      guidance: [
        "Avoid working waterlogged soil.",
        "Protect seed from runoff.",
        "Use mulch or soil cover where suitable."
      ],
      nextBestAction: {
        id: "check-rain-strength-before-planting",
        label: "Check rain strength",
        instruction: "Check whether the expected rain is light or heavy before planting.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "what-should-i-plant-this-month",
    question: "What should I plant this month?",
    intent: "planting",
    possibleCauses: ["Crop type is not known", "Region and month affect planting choice", "Rain or irrigation availability is not known"],
    requiredInformation: {
      region: "Unknown",
      recentWeather: "Rain or irrigation availability needed",
      farmPracticeContext: ["Crop choice", "Month or season", "Land preparation"]
    },
    followUpQuestions: [
      {
        id: "planting-crop-type",
        question: "What type of crop are you interested in?",
        requiredForConfidence: true,
        options: ["Vegetables", "Staples like maize", "Root and tuber crops", "I am not sure"]
      },
      {
        id: "planting-region",
        question: "Which region are you farming in?",
        requiredForConfidence: true,
        options: ["Greater Accra", "Ashanti", "Eastern", "Northern", "Other region"]
      },
      {
        id: "planting-water-source",
        question: "Do you have steady rain, irrigation, or both?",
        requiredForConfidence: true,
        options: ["Steady rain", "Irrigation available", "Both", "Not sure"]
      }
    ],
    recommendation: {
      summary: "FarmMate should choose planting options only after checking crop type, region, season, water and land preparation.",
      confidence: "medium",
      reasoning: [
        {
          id: "crop-choice-context-needed",
          observation: "The farmer has not chosen a crop type yet.",
          interpretation: "FarmMate should ask crop type first instead of pretending one crop is best."
        },
        {
          id: "region-season-needed",
          observation: "Region and month affect rain pattern, heat and irrigation needs.",
          interpretation: "FarmMate needs local context before giving a planting recommendation."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Choose a crop category, then check region, water availability and whether the land is ready before planting.",
      guidance: [
        "Avoid planting into waterlogged soil.",
        "Use healthy seed or planting material.",
        "Add compost or organic matter where available."
      ],
      nextBestAction: {
        id: "choose-crop-type",
        label: "Choose crop type",
        instruction: "Choose whether you want vegetables, staples like maize, root and tuber crops, or need help deciding.",
        actionType: "ask-follow-up"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "can-i-plant-tomatoes-now",
    question: "Can I plant tomatoes now?",
    intent: "planting",
    possibleCauses: ["Region is unknown", "Rain or irrigation availability is unknown", "Tomato seedlings and drainage need checking"],
    requiredInformation: {
      crop: "Tomato",
      region: "Unknown",
      recentWeather: "Rain, irrigation and soil wetness needed",
      farmPracticeContext: ["Tomato planting", "Land preparation", "Seedling strength"]
    },
    followUpQuestions: [
      {
        id: "tomato-planting-region",
        question: "Which region are you farming in?",
        requiredForConfidence: true,
        options: ["Greater Accra", "Ashanti", "Eastern", "Northern", "Other region"]
      },
      {
        id: "tomato-planting-water",
        question: "Do you have steady rain or irrigation for the tomatoes?",
        requiredForConfidence: true,
        options: ["Steady rain", "Irrigation available", "Both", "Not sure"]
      },
      {
        id: "tomato-field-condition",
        question: "Is the field moist, dry, or waterlogged?",
        requiredForConfidence: true,
        options: ["Moist", "Dry", "Waterlogged", "Not sure"]
      }
    ],
    recommendation: {
      summary: "Tomatoes can be planted when seedlings are strong, the soil is moist but not waterlogged, and water is reliable.",
      confidence: "medium",
      reasoning: [
        {
          id: "tomato-region-needed",
          observation: "The region is not known yet.",
          interpretation: "FarmMate should ask region before giving timing advice."
        },
        {
          id: "tomato-waterlogging-risk",
          observation: "Tomato roots suffer in waterlogged soil.",
          interpretation: "Drainage must be checked before transplanting."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Plant or transplant tomatoes only when seedlings are healthy, soil is moist, drainage is good and heavy rain or extreme heat is not expected.",
      guidance: [
        "Avoid planting into waterlogged soil.",
        "Transplant in the cool morning or late afternoon.",
        "Use compost and rotate away from tomato-family crops where possible."
      ],
      nextBestAction: {
        id: "share-tomato-region",
        label: "Share region",
        instruction: "Share your region so FarmMate can guide the tomato planting decision more safely.",
        actionType: "ask-follow-up"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "plant-melon-clarification",
    question: "How do I plant melon?",
    intent: "planting",
    possibleCauses: ["Melon can mean watermelon or melon grown for seed.", "Region, water and land preparation are not known."],
    requiredInformation: {
      crop: "Unknown",
      region: "Unknown",
      recentWeather: "Rain or irrigation availability needed"
    },
    followUpQuestions: [
      {
        id: "melon-crop-type",
        question: "Do you mean watermelon or melon grown for seed?",
        requiredForConfidence: true,
        options: ["Watermelon", "Melon grown for seed", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "I can guide you best on watermelon for now. If you mean melon grown for seed, confirm the right variety and local practice before planting.",
      confidence: "medium",
      reasoning: [
        {
          id: "melon-crop-meaning",
          observation: "The word melon can describe more than one crop or purpose.",
          interpretation: "FarmMate should confirm the crop before giving planting steps."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Confirm whether you mean watermelon or melon grown for seed, then check region, water and drainage before planting.",
      guidance: ["Do not plant into waterlogged soil.", "Use healthy seed and prepare the land before sowing."],
      nextBestAction: {
        id: "confirm-melon-type",
        label: "Confirm melon type",
        instruction: "Choose whether you mean watermelon or melon grown for seed.",
        actionType: "ask-follow-up"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "how-to-plant-watermelon",
    question: "How do I plant watermelon?",
    intent: "planting",
    possibleCauses: ["Region is unknown.", "Rain or irrigation availability is unknown.", "Drainage and vine spacing need checking."],
    requiredInformation: {
      crop: "Watermelon",
      region: "Unknown",
      recentWeather: "Rain or irrigation availability needed",
      farmPracticeContext: ["Land preparation", "Drainage", "Vine spacing"]
    },
    followUpQuestions: [
      {
        id: "watermelon-planting-region",
        question: "Which region are you farming in?",
        requiredForConfidence: true,
        options: ["Greater Accra", "Ashanti", "Eastern", "Northern", "Other region"]
      },
      {
        id: "watermelon-planting-water",
        question: "Do you have steady rain or irrigation available?",
        requiredForConfidence: true,
        options: ["Steady rain has started", "I have irrigation", "Not enough water yet", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "Plant watermelon in warm, well-drained soil after steady rain or when reliable irrigation is available. Leave enough room for vines and do not plant into waterlogged soil.",
      confidence: "medium",
      reasoning: [
        {
          id: "watermelon-moisture",
          observation: "Watermelon needs moisture to establish but roots suffer in waterlogged soil.",
          interpretation: "Water availability and drainage should be checked before planting."
        },
        {
          id: "watermelon-vine-space",
          observation: "Watermelon vines spread across the field.",
          interpretation: "Enough spacing helps airflow, weeding and field access."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Prepare a well-drained bed or mound, use healthy seed, and keep about 1 to 1.5 m between plants where local guidance allows.",
      guidance: ["Use compost or well-rotted organic matter where available.", "Keep young plants moist, but avoid waterlogging.", "Weed early and mulch where practical."],
      nextBestAction: {
        id: "check-watermelon-field",
        label: "Check field readiness",
        instruction: "Check drainage and confirm steady rain or irrigation before planting watermelon.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "best-spacing-for-watermelon",
    question: "Best spacing for watermelon",
    intent: "planting",
    possibleCauses: ["Watermelon vines need room to spread.", "Field layout and drainage are unknown."],
    requiredInformation: {
      crop: "Watermelon",
      region: "Unknown",
      farmPracticeContext: ["Watermelon spacing", "Field layout", "Drainage"]
    },
    followUpQuestions: [
      {
        id: "watermelon-spacing-layout",
        question: "Are you planting on beds, mounds, ridges, or flat land?",
        requiredForConfidence: true,
        options: ["Beds or mounds", "Ridges", "Flat land", "Not sure"]
      },
      {
        id: "watermelon-spacing-drainage",
        question: "Does the field drain well after rain?",
        requiredForConfidence: true,
        options: ["Yes, it drains well", "No, water stays", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "Watermelon needs enough room for vines, airflow and field work. Use local extension spacing where available; many open-field plantings leave about 1 to 1.5 m between plants and 1.5 to 2 m between rows.",
      confidence: "medium",
      reasoning: [
        {
          id: "watermelon-spacing-airflow",
          observation: "Crowded vines hold humidity and make field work harder.",
          interpretation: "Open spacing supports airflow, weeding and fruit care."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Mark rows before sowing and leave enough vine space for your field system.",
      guidance: ["Avoid crowding plants.", "Keep drainage open between beds or mounds.", "Use mulch where practical to reduce moisture loss."],
      nextBestAction: {
        id: "mark-watermelon-spacing",
        label: "Mark planting space",
        instruction: "Mark your rows and plant positions before sowing watermelon.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "can-i-plant-watermelon-now",
    question: "Can I plant watermelon now?",
    intent: "planting",
    possibleCauses: ["Region and season are unknown.", "Rain or irrigation availability is unknown.", "Soil moisture and drainage need checking."],
    requiredInformation: {
      crop: "Watermelon",
      region: "Unknown",
      recentWeather: "Rain or irrigation availability needed",
      farmPracticeContext: ["Watermelon planting", "Soil moisture", "Drainage"]
    },
    followUpQuestions: [
      {
        id: "watermelon-now-region",
        question: "Which region are you farming in?",
        requiredForConfidence: true,
        options: ["Greater Accra", "Ashanti", "Eastern", "Northern", "Other region"]
      },
      {
        id: "watermelon-now-water",
        question: "Do you have steady rain or irrigation available?",
        requiredForConfidence: true,
        options: ["Steady rain has started", "I have irrigation", "Not enough water yet", "I am not sure"]
      }
    ],
    recommendation: {
      summary: "Watermelon may be suitable to plant when the soil is moist but not waterlogged, the field drains well, and you can rely on steady rain or irrigation after sowing.",
      confidence: "medium",
      reasoning: [
        {
          id: "watermelon-establishment",
          observation: "Young watermelon plants need steady moisture to establish.",
          interpretation: "FarmMate should check water availability and soil condition before recommending planting."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Delay planting if the field is waterlogged or you cannot support young plants with steady rain or irrigation.",
      guidance: ["Avoid planting after one uncertain shower if the soil is still dry.", "Avoid waterlogged soil.", "Use healthy seed and prepare drainage before sowing."],
      nextBestAction: {
        id: "confirm-watermelon-conditions",
        label: "Check planting conditions",
        instruction: "Confirm soil moisture, drainage and water availability before planting watermelon.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "best-spacing-for-pepper",
    question: "Best spacing for pepper",
    intent: "planting",
    possibleCauses: ["Pepper variety and field layout are unknown", "Crowding can reduce airflow", "Water and drainage affect pepper establishment"],
    requiredInformation: {
      crop: "Pepper",
      region: "Unknown",
      farmPracticeContext: ["Pepper spacing", "Transplanting", "Field airflow"]
    },
    followUpQuestions: [
      {
        id: "pepper-spacing-region",
        question: "Which region are you farming in?",
        requiredForConfidence: true,
        options: ["Greater Accra", "Ashanti", "Eastern", "Northern", "Other region"]
      },
      {
        id: "pepper-spacing-system",
        question: "Are you planting on beds, ridges, or flat land?",
        requiredForConfidence: true,
        options: ["Beds", "Ridges", "Flat land", "Not sure"]
      },
      {
        id: "pepper-spacing-moisture",
        question: "Is the soil moist, dry, or waterlogged?",
        requiredForConfidence: true,
        options: ["Moist", "Dry", "Waterlogged", "Not sure"]
      }
    ],
    recommendation: {
      summary: "Pepper spacing should give roots enough room and leave airflow so disease pressure is lower.",
      confidence: "medium",
      reasoning: [
        {
          id: "pepper-airflow",
          observation: "Crowded pepper plants hold humidity.",
          interpretation: "Spacing helps airflow and makes scouting easier."
        },
        {
          id: "pepper-field-layout",
          observation: "Bed, ridge or flat planting affects practical spacing.",
          interpretation: "FarmMate should ask field layout before being too exact."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Use local extension spacing where available; about 45 to 60 cm between pepper plants can help airflow in many smallholder fields.",
      guidance: [
        "Keep enough space for airflow and picking.",
        "Avoid transplanting into waterlogged soil.",
        "Use compost or well-rotted manure before planting where available."
      ],
      nextBestAction: {
        id: "measure-pepper-spacing",
        label: "Measure spacing",
        instruction: "Measure your intended pepper spacing and keep enough room for airflow before transplanting.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "when-should-i-plant-maize",
    question: "When should I plant maize?",
    intent: "planting",
    possibleCauses: ["Region is unknown", "Rain reliability is unknown", "Soil moisture and drainage need checking"],
    requiredInformation: {
      crop: "Maize",
      region: "Unknown",
      recentWeather: "Rain reliability and soil wetness needed",
      farmPracticeContext: ["Maize sowing", "Land preparation"]
    },
    followUpQuestions: [
      {
        id: "maize-planting-region",
        question: "Which region are you farming in?",
        requiredForConfidence: true,
        options: ["Greater Accra", "Ashanti", "Eastern", "Northern", "Other region"]
      },
      {
        id: "maize-rain-status",
        question: "Have steady rains started, or is the soil still dry?",
        requiredForConfidence: true,
        options: ["Steady rains started", "Soil is still dry", "I have irrigation", "Not sure"]
      },
      {
        id: "maize-land-ready",
        question: "Is the land prepared and draining well?",
        requiredForConfidence: true,
        options: ["Prepared and drains well", "Prepared but holds water", "Not prepared yet", "Not sure"]
      }
    ],
    recommendation: {
      summary: "Maize should be planted when the soil has steady moisture, the field drains well and good seed is ready.",
      confidence: "medium",
      reasoning: [
        {
          id: "maize-steady-rains",
          observation: "Maize needs moisture for germination.",
          interpretation: "Planting after reliable rains is safer than planting after one light shower."
        },
        {
          id: "maize-waterlogging",
          observation: "Waterlogged soil can rot seed and damage soil structure.",
          interpretation: "Drainage should be checked before sowing."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Plant maize after steady rains when soil is moist but not waterlogged, and the land is prepared.",
      guidance: [
        "Avoid planting into waterlogged soil.",
        "Use healthy seed.",
        "Rotate with legumes where possible."
      ],
      nextBestAction: {
        id: "check-maize-soil",
        label: "Check soil",
        instruction: "Check that maize soil is moist and drains well before sowing.",
        actionType: "take-farm-action"
      }
    },
    safetyRules: [decisionEngineSafetyRules[2]]
  },
  {
    id: "when-to-transplant-tomatoes",
    question: "When should I transplant tomatoes?",
    intent: "planting",
    possibleCauses: ["Seedling strength is unknown", "Region and field moisture are unknown", "Heat or waterlogging can damage seedlings"],
    requiredInformation: {
      crop: "Tomato",
      region: "Unknown",
      growthStage: "Seedling",
      recentWeather: "Heat, rain and field moisture needed",
      farmPracticeContext: ["Tomato transplanting", "Nursery", "Field preparation"]
    },
    followUpQuestions: [
      {
        id: "tomato-transplant-region",
        question: "Which region are you farming in?",
        requiredForConfidence: true,
        options: ["Greater Accra", "Ashanti", "Eastern", "Northern", "Other region"]
      },
      {
        id: "tomato-seedling-strength",
        question: "Are the tomato seedlings strong and hardened?",
        requiredForConfidence: true,
        options: ["Strong and hardened", "Weak or leggy", "Not sure"]
      },
      {
        id: "tomato-transplant-field",
        question: "Is the field moist, dry, or waterlogged?",
        requiredForConfidence: true,
        options: ["Moist", "Dry", "Waterlogged", "Not sure"]
      }
    ],
    recommendation: {
      summary: "Tomato seedlings should be transplanted when they are strong, the field is moist but not waterlogged, and the heat is not extreme.",
      confidence: "medium",
      reasoning: [
        {
          id: "tomato-seedling-hardening",
          observation: "Weak or soft seedlings suffer after transplanting.",
          interpretation: "Seedling strength should be checked before moving them."
        },
        {
          id: "tomato-transplant-heat",
          observation: "Extreme heat can shock young tomato seedlings.",
          interpretation: "Cool morning or late afternoon transplanting is safer."
        }
      ],
      sustainabilityPriority: sustainabilityPriorityOrder,
      recommendedAction: "Transplant tomatoes in the cool part of the day when seedlings are strong and the field is moist but not waterlogged.",
      guidance: [
        "Avoid transplanting during extreme heat.",
        "Avoid waterlogged soil.",
        "Use compost and keep spacing open for airflow."
      ],
      nextBestAction: {
        id: "check-tomato-seedlings",
        label: "Check seedlings",
        instruction: "Check that tomato seedlings are strong and the field is moist before transplanting.",
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
  },
  ...generalAgronomyDecisionFlows
];

export function findDecisionFlow(flowId: string) {
  return farmMateDecisionFlows.find((flow) => flow.id === flowId);
}
