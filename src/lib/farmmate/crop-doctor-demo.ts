import { detectFarmMateCropFromQuestion } from "./crop-context";

export type CropDoctorDemoDiagnosis = {
  crop?: string;
  issue: string;
  confidence: number;
  meaning: string;
  action: string;
  prevention: string;
};

export const cropDoctorDiagnosisByCrop: Record<string, CropDoctorDemoDiagnosis> = {
  Cassava: {
    crop: "Cassava",
    issue: "Possible mosaic disease",
    confidence: 88,
    meaning: "Mosaic disease can cause pale patches, leaf distortion and weaker cassava growth.",
    action: "Remove badly affected plants where appropriate and avoid using cuttings from diseased plants.",
    prevention: "Use clean planting material, control whiteflies where possible, and monitor nearby plants."
  },
  Maize: {
    crop: "Maize",
    issue: "Possible nutrient or water stress",
    confidence: 84,
    meaning: "Maize growth problems can come from low nutrients, poor root growth, moisture stress or waterlogging.",
    action: "Check older leaves, soil moisture and the base of nearby plants before adding more fertilizer.",
    prevention: "Keep weeds down early, avoid waterlogged plots, and apply nutrients based on local guidance."
  },
  Tomato: {
    crop: "Tomato",
    issue: "Possible early blight",
    confidence: 86,
    meaning: "Early blight is a fungal disease that often appears after rain and high humidity.",
    action: "Remove affected leaves, improve airflow, and avoid watering the leaves directly.",
    prevention: "Rotate crops, water at soil level, and monitor nearby plants."
  }
};

export const unknownCropDiagnosis: CropDoctorDemoDiagnosis = {
  issue: "Possible crop health issue",
  confidence: 72,
  meaning: "This demo cannot confirm the crop from the photo yet, so FarmMate should avoid guessing.",
  action: "Check the newest and oldest leaves, look for insects, and note whether the problem is spreading.",
  prevention: "Keep the crop well spaced, avoid overwatering, and monitor nearby plants."
};

export function diagnosisFromFileName(fileName: string): CropDoctorDemoDiagnosis {
  const detectedCrop = detectFarmMateCropFromQuestion(fileName.replace(/[-_]/g, " "))?.displayName;

  return (detectedCrop && cropDoctorDiagnosisByCrop[detectedCrop]) || unknownCropDiagnosis;
}

export function farmMateQuestionFromDiagnosis(diagnosis: CropDoctorDemoDiagnosis) {
  if (diagnosis.crop && diagnosis.issue) {
    return `I uploaded a ${diagnosis.crop.toLowerCase()} crop photo with ${diagnosis.issue.toLowerCase()}. What should I do next?`;
  }

  return "I uploaded a crop photo. What should I check next?";
}
