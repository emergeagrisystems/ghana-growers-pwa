"use client";

import { Camera, CheckCircle2, ImagePlus, Loader2, Stethoscope, UploadCloud } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  buildCropDoctorHandoffContext,
  cropDoctorResultBadge,
  cropDoctorResultHeadline,
  cropDoctorSymptomsForCrop,
  CROP_DOCTOR_AUTO_DETECT_VALUE,
  CROP_DOCTOR_ACCEPTED_IMAGE_TYPES,
  CROP_DOCTOR_CROP_GROUPS,
  validateCropDoctorImage,
  type CropDoctorHandoffContext,
  type CropDoctorVisionResult
} from "@/lib/farmmate/crop-doctor-vision";
import { farmMateCreditLine, getFarmMateAnonymousDeviceId } from "@/lib/farmmate/usage/client";
import {
  CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT,
  FARM_MATE_FEEDBACK_CTA,
  cropDoctorCreditMessage,
  shouldDisableCropDoctorAnalysis,
  shouldDisableCropDoctorUpload,
  type FarmMateCreditDecision,
  type FarmMateCreditStatus
} from "@/lib/farmmate/usage";
import { FarmMateAnswerFeedback } from "@/components/FarmMateAnswerFeedback";
import { farmMateAnswerSnippet } from "@/lib/farmmate/answer-feedback";

type CropDoctorCreditStatus = FarmMateCreditStatus & { storage?: string };
const CROP_DOCTOR_IMAGE_ACCEPT = CROP_DOCTOR_ACCEPTED_IMAGE_TYPES.join(",");

function logCropDoctorCreditState(detail: {
  anonymousDeviceId: string;
  tool: "crop_doctor";
  credits?: CropDoctorCreditStatus | null;
  supabaseCheck?: "success" | "failure" | "not_applicable";
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[FarmMate Crop Doctor Credits]", {
    anonymousDeviceIdExists: detail.anonymousDeviceId.length > 0 ? "yes" : "no",
    tool: detail.tool,
    creditState: detail.credits?.creditState ?? "loading",
    remainingCredits: detail.credits?.remaining ?? null,
    resetTime: detail.credits?.resetAt ?? null,
    supabaseCheck: detail.supabaseCheck ?? "not_applicable"
  });
}

export function CropDoctor({ onAskFarmMateAboutThis }: { onAskFarmMateAboutThis?: (handoff: CropDoctorHandoffContext | string) => void }) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [hasDiagnosis, setHasDiagnosis] = useState(false);
  const [diagnosis, setDiagnosis] = useState<CropDoctorVisionResult | null>(null);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [credits, setCredits] = useState<FarmMateCreditStatus | null>(null);
  const [creditMessage, setCreditMessage] = useState("");
  const [showAskFarmMateFallback, setShowAskFarmMateFallback] = useState(false);
  const isCreditExhausted = credits?.creditState === "exhausted";
  const isCreditTemporarilyUnavailable = credits?.creditState === "temporarily_unavailable";
  const isAnalysisDisabled = shouldDisableCropDoctorAnalysis(credits);
  const isUploadDisabled = shouldDisableCropDoctorUpload(credits);
  const symptomOptions = cropDoctorSymptomsForCrop(selectedCrop);
  const isAnalyseButtonDisabled = !selectedFile || isAnalysing || isAnalysisDisabled;
  const analyseButtonText = isAnalysing
    ? "FarmMate is checking your crop photo..."
    : !selectedFile
      ? "Take or choose a photo first"
      : isAnalysisDisabled
        ? "No Crop Doctor checks available"
        : "Analyse Crop";
  const diagnosisHasSelectedCrop = Boolean(diagnosis?.selectedCrop && diagnosis.selectedCrop !== "Not sure");
  const diagnosisSelectedSymptom = diagnosis?.selectedSymptom && diagnosis.selectedSymptom !== "Not sure" ? diagnosis.selectedSymptom : null;

  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  async function refreshCredits() {
    const anonymousDeviceId = getFarmMateAnonymousDeviceId();

    try {
      const response = await fetch("/api/farmmate/usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          anonymousDeviceId,
          tool: "crop_doctor",
          action: "status"
        })
      });
      const data = (await response.json().catch(() => null)) as { credits?: CropDoctorCreditStatus } | null;

      if (data?.credits) {
        setCredits(data.credits);
        logCropDoctorCreditState({
          anonymousDeviceId,
          tool: "crop_doctor",
          credits: data.credits,
          supabaseCheck: data.credits.storage === "unavailable" ? "failure" : "success"
        });

        if (data.credits.creditState === "temporarily_unavailable") {
          setCreditMessage(cropDoctorCreditMessage({ reason: "usage_tracking_unavailable", refreshInText: data.credits.refreshInText }));
          setShowAskFarmMateFallback(true);
          return;
        }

        if (data.credits.creditState === "exhausted") {
          setCreditMessage(cropDoctorCreditMessage({ reason: "credits_exhausted", refreshInText: data.credits.refreshInText }));
          setShowAskFarmMateFallback(true);
          return;
        }

        setCreditMessage("");
        setShowAskFarmMateFallback(false);
      }
    } catch {
      setCredits(null);
      logCropDoctorCreditState({
        anonymousDeviceId,
        tool: "crop_doctor",
        credits: null,
        supabaseCheck: "failure"
      });
    }
  }

  useEffect(() => {
    void refreshCredits();
  }, []);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const imageValidation = validateCropDoctorImage({ type: file.type, size: file.size });

    if (!imageValidation.ok) {
      setCreditMessage(imageValidation.message);
      setShowAskFarmMateFallback(false);
      event.currentTarget.value = "";
      return;
    }

    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }

    setSelectedImage(URL.createObjectURL(file));
    setSelectedFile(file);
    setFileName(file.name);
    setDiagnosis(null);
    setHasDiagnosis(false);
    setIsAnalysing(false);
    if (isCreditTemporarilyUnavailable && credits) {
      setCreditMessage(cropDoctorCreditMessage({ reason: "usage_tracking_unavailable", refreshInText: credits.refreshInText }));
      setShowAskFarmMateFallback(true);
    } else if (isCreditExhausted && credits) {
      setCreditMessage(cropDoctorCreditMessage({ reason: "credits_exhausted", refreshInText: credits.refreshInText }));
      setShowAskFarmMateFallback(true);
    } else {
      setCreditMessage("");
      setShowAskFarmMateFallback(false);
    }

    event.currentTarget.value = "";
  }

  function openCameraCapture() {
    cameraInputRef.current?.click();
  }

  function openImagePicker() {
    galleryInputRef.current?.click();
  }

  function resetDiagnosisForFieldContext() {
    setDiagnosis(null);
    setHasDiagnosis(false);
    setIsAnalysing(false);
  }

  async function analyseCrop() {
    if (!selectedImage || !selectedFile || isAnalysing) {
      return;
    }

    const imageValidation = validateCropDoctorImage({ type: selectedFile.type, size: selectedFile.size });

    if (!imageValidation.ok) {
      setCreditMessage(imageValidation.message);
      setShowAskFarmMateFallback(false);
      return;
    }

    if (isAnalysisDisabled && credits) {
      setCreditMessage(
        cropDoctorCreditMessage({
          reason: credits.creditState === "temporarily_unavailable" ? "usage_tracking_unavailable" : "credits_exhausted",
          refreshInText: credits.refreshInText
        })
      );
      setShowAskFarmMateFallback(true);
      return;
    }

    setCreditMessage("");
    setShowAskFarmMateFallback(false);
    setDiagnosis(null);
    setIsAnalysing(true);
    setHasDiagnosis(false);

    const formData = new FormData();
    const anonymousDeviceId = getFarmMateAnonymousDeviceId();
    formData.append("anonymousDeviceId", anonymousDeviceId);
    formData.append("image", selectedFile);
    formData.append("selectedCrop", selectedCrop || CROP_DOCTOR_AUTO_DETECT_VALUE);
    formData.append("selectedSymptom", selectedSymptom || "Not sure");

    const response = await fetch("/api/farmmate/crop-doctor", {
      method: "POST",
      body: formData
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      result?: CropDoctorVisionResult;
      credits?: CropDoctorCreditStatus;
      reason?: FarmMateCreditDecision["reason"] | string;
      message?: string;
    } | null;

    if (data?.credits) {
      const nextCredits: CropDoctorCreditStatus =
        data.reason === "usage_tracking_unavailable"
          ? {
              ...data.credits,
              remaining: 0,
              isExhausted: true,
              creditState: "temporarily_unavailable"
            }
          : data.credits;
      setCredits(nextCredits);
      logCropDoctorCreditState({
        anonymousDeviceId,
        tool: "crop_doctor",
        credits: nextCredits,
        supabaseCheck: nextCredits.storage === "unavailable" || data.reason === "usage_tracking_unavailable" ? "failure" : "success"
      });
    }

    if (!response?.ok || !data?.ok || !data.result) {
      setIsAnalysing(false);
      setCreditMessage(data?.message || "FarmMate could not complete the photo check right now. You can still ask FarmMate to guide you using a description of what you see.");
      setShowAskFarmMateFallback(data?.reason === "credits_exhausted" || data?.reason === "usage_tracking_unavailable");
      return;
    }

    setDiagnosis(data.result);
    setIsAnalysing(false);
    setHasDiagnosis(true);
  }

  function askFarmMateAboutThis() {
    if (!diagnosis) {
      return;
    }

    askFarmMate(buildCropDoctorHandoffContext(diagnosis));
  }

  function askFarmMateInstead() {
    if (onAskFarmMateAboutThis) {
      onAskFarmMateAboutThis(CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT);
      return;
    }

    window.dispatchEvent(new CustomEvent("gg-farmmate-prefill", { detail: CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT }));
    document.getElementById("assistant")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function askFarmMate(handoff: CropDoctorHandoffContext) {
    if (onAskFarmMateAboutThis) {
      onAskFarmMateAboutThis(handoff);
      return;
    }

    window.dispatchEvent(new CustomEvent("gg-farmmate-prefill", { detail: handoff }));
    document.getElementById("assistant")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <article id="crop-doctor" className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-3">
        <span className="gg-icon bg-leaf-50 text-leaf-700 ring-leaf-700/10">
          <Camera size={24} aria-hidden="true" />
        </span>
        <div>
          <h2 className="gg-card-title">Crop Doctor</h2>
          <p className="mt-1 text-xs font-bold text-ink/48">{farmMateCreditLine("crop_doctor", credits)}</p>
          <p className="mt-1 text-xs font-semibold text-ink/42">Free public users get 2 Crop Doctor checks every 12 hours.</p>
          <p className="mt-2 text-sm leading-6 text-ink/66">Take or choose a crop photo first. If you know the crop or symptom, add it as optional context before analysis.</p>
        </div>
      </div>

      <div
        aria-disabled={isUploadDisabled}
        className={`mt-5 grid min-h-44 place-items-center rounded-md border-2 border-dashed p-5 text-center transition ${
          isUploadDisabled
            ? "cursor-not-allowed border-ink/10 bg-ink/5 opacity-75"
            : "border-leaf-700/20 bg-leaf-50 hover:border-leaf-700/45 hover:bg-white"
        }`}
      >
        <div>
          <UploadCloud className={`mx-auto ${isUploadDisabled ? "text-ink/35" : "text-leaf-700"}`} size={32} aria-hidden="true" />
          <p className="mt-3 text-base font-black text-ink">{isUploadDisabled ? "No Crop Doctor checks available" : "Take a crop photo"}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-ink/58">
            {isUploadDisabled
              ? "You can still ask FarmMate for guidance while you wait."
              : "Take a clear photo of the affected part. If possible, also include some healthy leaves or the whole plant."}
          </p>
          {!isUploadDisabled ? <p className="mt-2 text-xs font-bold text-ink/48">Take a photo of the affected crop, or choose one from your phone.</p> : null}
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <input
              ref={cameraInputRef}
              id="crop-doctor-camera-capture"
              type="file"
              accept={CROP_DOCTOR_IMAGE_ACCEPT}
              capture="environment"
              className="sr-only"
              onChange={handleImageChange}
              disabled={isUploadDisabled}
              aria-label="Take Photo"
            />
            <button
              type="button"
              onClick={openCameraCapture}
              disabled={isUploadDisabled}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-900 disabled:cursor-not-allowed disabled:bg-ink/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
            >
              <Camera size={18} aria-hidden="true" />
              Take Photo
            </button>
            <input
              ref={galleryInputRef}
              id="crop-doctor-photo-picker"
              type="file"
              accept={CROP_DOCTOR_IMAGE_ACCEPT}
              className="sr-only"
              onChange={handleImageChange}
              disabled={isUploadDisabled}
              aria-label="Choose Photo"
            />
            <button
              type="button"
              onClick={openImagePicker}
              disabled={isUploadDisabled}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50 disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
            >
              <ImagePlus size={18} aria-hidden="true" />
              Choose Photo
            </button>
          </div>
          <p className="mt-3 text-xs font-bold leading-5 text-ink/48">
            JPG, PNG, or WEBP under 5 MB. On desktop, Take Photo may open the normal file picker if camera capture is not supported.
          </p>
        </div>
      </div>

      {selectedImage ? (
        <div className="mt-5">
          <div className="overflow-hidden rounded-md border border-leaf-900/10 bg-leaf-50">
            <Image src={selectedImage} alt="Selected crop preview" width={900} height={420} unoptimized className="h-56 w-full object-cover" />
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm font-bold text-ink/62">
            <ImagePlus className="text-leaf-700" size={18} aria-hidden="true" />
            {fileName || "Crop photo selected"}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
        <label className="grid gap-2 text-sm font-black text-ink" htmlFor="crop-doctor-selected-crop">
          Tell FarmMate the crop if you know it
          <select
            id="crop-doctor-selected-crop"
            className="gg-field min-h-12 w-full min-w-0 max-w-full bg-white"
            value={selectedCrop}
            onChange={(event) => {
              setSelectedCrop(event.target.value);
              setSelectedSymptom("");
              resetDiagnosisForFieldContext();
            }}
          >
            <option value="">Detect automatically</option>
            {CROP_DOCTOR_CROP_GROUPS.map((group) => (
              <optgroup key={group.group} label={group.label}>
                {group.crops.map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-black text-ink" htmlFor="crop-doctor-selected-symptom">
          What are you seeing? <span className="font-semibold text-ink/50">(optional)</span>
          <select
            id="crop-doctor-selected-symptom"
            className="gg-field min-h-12 w-full min-w-0 max-w-full bg-white"
            value={selectedSymptom}
            onChange={(event) => {
              setSelectedSymptom(event.target.value);
              resetDiagnosisForFieldContext();
            }}
          >
            <option value="">Not sure</option>
            {symptomOptions.map((symptom) => (
              <option key={symptom} value={symptom}>
                {symptom}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={analyseCrop}
          disabled={isAnalyseButtonDisabled}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-900 disabled:cursor-not-allowed disabled:bg-ink/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
        >
          {isAnalysing ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Stethoscope size={18} aria-hidden="true" />}
          {analyseButtonText}
        </button>
        {isAnalysisDisabled && selectedFile ? (
          <p className="mt-2 text-xs font-bold leading-5 text-ink/48">{creditMessage || "Crop Doctor checks are not available right now."}</p>
        ) : null}
      </div>

      <div className="mt-5" aria-live="polite">
        {isAnalysing ? (
          <div className="flex items-center gap-2 rounded-md bg-leaf-50 px-4 py-3 text-sm font-black text-ink/70">
            <Loader2 className="animate-spin text-leaf-700" size={18} aria-hidden="true" />
            FarmMate is checking your crop photo...
          </div>
        ) : null}

        {creditMessage ? (
          <div className="rounded-md border border-earth-500/25 bg-earth-50 px-4 py-3">
            <p className="text-sm font-bold leading-6 text-ink/68">{creditMessage}</p>
            {showAskFarmMateFallback ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={askFarmMateInstead}
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                >
                  Ask FarmMate instead
                </button>
                <Link
                  href={FARM_MATE_FEEDBACK_CTA.href}
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-leaf-600 px-4 py-2 text-sm font-black text-white transition hover:bg-leaf-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                >
                  {FARM_MATE_FEEDBACK_CTA.label}
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        {hasDiagnosis && diagnosis ? (
          <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="gg-eyebrow text-leaf-700">Main finding</p>
                <h3 className="mt-2 gg-card-title">{cropDoctorResultHeadline(diagnosis)}</h3>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-black text-leaf-700">
                <CheckCircle2 size={17} aria-hidden="true" />
                {cropDoctorResultBadge(diagnosis)}
              </span>
            </div>
            <dl className="mt-4 grid gap-2 rounded-md bg-white p-3 text-sm sm:grid-cols-2">
              {diagnosis.crop ? (
                <div>
                  <dt className="font-black text-ink">Crop</dt>
                  <dd className="mt-1 font-semibold text-ink/64">{diagnosis.crop}</dd>
                </div>
              ) : (
                <div>
                  <dt className="font-black text-ink">Crop not confirmed</dt>
                  <dd className="mt-1 font-semibold text-ink/64">FarmMate could not confirm the crop from this photo.</dd>
                </div>
              )}
              <div>
                <dt className="font-black text-ink">Crop group</dt>
                <dd className="mt-1 font-semibold text-ink/64">{diagnosis.cropGroup ?? "Not confirmed"}</dd>
              </div>
              <div>
                <dt className="font-black text-ink">Photo confidence</dt>
                <dd className="mt-1 font-semibold text-ink/64">{diagnosis.photoConfidenceLabel}</dd>
              </div>
              {diagnosisSelectedSymptom ? (
                <div>
                  <dt className="font-black text-ink">Selected symptom</dt>
                  <dd className="mt-1 font-semibold text-ink/64">{diagnosisSelectedSymptom}</dd>
                </div>
              ) : null}
            </dl>

            {diagnosis.limitedGuidanceNote ? (
              <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-semibold leading-6 text-ink/68">
                {diagnosis.limitedGuidanceNote}
              </p>
            ) : null}
            {diagnosis.familyGuidance ? (
              <p className="mt-2 rounded-md bg-white px-3 py-2 text-sm font-semibold leading-6 text-ink/68">
                {diagnosis.familyGuidance}
              </p>
            ) : null}
            {diagnosis.cashCropCaution ? (
              <p className="mt-2 rounded-md border border-earth-500/20 bg-earth-50 px-3 py-2 text-sm font-bold leading-6 text-ink/70">
                {diagnosis.cashCropCaution}
              </p>
            ) : null}

            <div className="mt-4 grid gap-3">
              {([
                ["Main visible signs", diagnosis.visibleSigns],
                ["What this may suggest", [diagnosis.whatThisMeans]],
                ["What to check next", diagnosis.whatToCheck],
                ["What to do now", diagnosis.recommendedActions],
                ["Next step", [diagnosis.nextBestAction]]
              ] as Array<[string, string[]]>).map(([label, items]) => (
                <div key={label} className="rounded-md bg-white p-3">
                  <p className="text-sm font-black text-ink">{label}</p>
                  <ul className="mt-2 grid gap-1.5">
                    {items.map((item) => (
                      <li key={item} className="text-sm font-semibold leading-6 text-ink/66">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={askFarmMateAboutThis}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
            >
              Ask FarmMate about this
            </button>

            <FarmMateAnswerFeedback
              key={`${diagnosis.resultType}-${diagnosis.mainFinding}`}
              prompt="Was this crop check helpful?"
              wrongButtonLabel="Wrong crop/problem"
              context={{
                tool: "crop_doctor",
                selectedCrop: diagnosisHasSelectedCrop ? diagnosis.selectedCrop : undefined,
                detectedCrop: diagnosis.cropFromImage ?? undefined,
                selectedSymptom: diagnosisSelectedSymptom ?? undefined,
                resultType: diagnosis.resultType,
                visibleSignsSnippet: farmMateAnswerSnippet(diagnosis.visibleSigns.join("; ")),
                answerSnippet: farmMateAnswerSnippet(diagnosis.mainFinding)
              }}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
