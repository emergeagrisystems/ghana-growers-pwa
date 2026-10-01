"use client";

import { Camera, CheckCircle2, ImagePlus, Loader2, Stethoscope, UploadCloud } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { boundedJsonRequest, createFarmMateRequestGate, CROP_DOCTOR_BROWSER_TIMEOUT_MS, FARM_MATE_BROWSER_TIMEOUT_MS } from "@/lib/farmmate/request-limits";
import { mamaGPublicText } from "@/lib/farmmate/public-name";
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
import { isPublicSubmissionAvailable } from "@/lib/publicSubmissionAvailability";

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

export function CropDoctor({ onAskFarmMateAboutThis, prefillCrop }: { onAskFarmMateAboutThis?: (handoff: CropDoctorHandoffContext | string) => void; prefillCrop?: string }) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const analysisGate = useRef(createFarmMateRequestGate());
  const photoRequestId = useRef("");
  useEffect(() => {
    const gate = analysisGate.current;
    return () => gate.invalidate();
  }, []);
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
  const isUploadDisabled = isAnalysing || shouldDisableCropDoctorUpload(credits);
  const symptomOptions = cropDoctorSymptomsForCrop(selectedCrop);
  const isAnalyseButtonDisabled = !selectedFile || isAnalysing || isAnalysisDisabled;
  const analyseButtonText = isAnalysing
    ? "Mama G is checking your crop photo..."
    : !selectedFile
      ? "Take or choose a photo first"
      : isAnalysisDisabled
        ? "No Crop Doctor checks available"
        : "Analyse Crop";
  const diagnosisHasSelectedCrop = Boolean(diagnosis?.selectedCrop && diagnosis.selectedCrop !== "Not sure");
  const diagnosisSelectedSymptom = diagnosis?.selectedSymptom && diagnosis.selectedSymptom !== "Not sure" ? diagnosis.selectedSymptom : null;
  const unclearDiagnosis = diagnosis?.resultType === "photo_unclear" || diagnosis?.resultType === "crop_not_confirmed";
  const resultCheck = diagnosis?.whatToCheck.find((item) => item.trim().toLowerCase() !== diagnosis.nextBestAction.trim().toLowerCase());
  const resultDo = diagnosis?.recommendedActions.find((item) => ![resultCheck, diagnosis.nextBestAction].some((other) => other?.trim().toLowerCase() === item.trim().toLowerCase()));

  useEffect(() => {
    if (prefillCrop && CROP_DOCTOR_CROP_GROUPS.some((group) => group.crops.includes(prefillCrop))) setSelectedCrop(prefillCrop);
  }, [prefillCrop]);

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
      const { data } = await boundedJsonRequest<{ credits?: CropDoctorCreditStatus }>("/api/farmmate/usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          anonymousDeviceId,
          tool: "crop_doctor",
          action: "status"
        })
      }, FARM_MATE_BROWSER_TIMEOUT_MS);

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
    if (isAnalysing) return;
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
    photoRequestId.current = crypto.randomUUID();
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
    analysisGate.current.invalidate();
    photoRequestId.current = crypto.randomUUID();
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

    const requestToken = analysisGate.current.start();
    if (requestToken === null) return;

    setCreditMessage("");
    setShowAskFarmMateFallback(false);
    setDiagnosis(null);
    setIsAnalysing(true);
    setHasDiagnosis(false);

    const formData = new FormData();
    const anonymousDeviceId = getFarmMateAnonymousDeviceId();
    formData.append("anonymousDeviceId", anonymousDeviceId);
    photoRequestId.current ||= crypto.randomUUID();
    formData.append("requestId", photoRequestId.current);
    formData.append("image", selectedFile);
    formData.append("selectedCrop", selectedCrop || CROP_DOCTOR_AUTO_DETECT_VALUE);
    formData.append("selectedSymptom", selectedSymptom || "Not sure");
    const previewUsageDiagnostic = new URLSearchParams(window.location.search).get("rc1CropUsage") === "confirm-delayed-insert";

    const result = await boundedJsonRequest<{
      ok?: boolean;
      result?: CropDoctorVisionResult;
      credits?: CropDoctorCreditStatus;
      reason?: FarmMateCreditDecision["reason"] | string;
      message?: string;
    }>("/api/farmmate/crop-doctor", {
      method: "POST",
      ...(previewUsageDiagnostic ? { headers: { "x-rc1-crop-usage": "confirm-delayed-insert" } } : {}),
      body: formData
    }, CROP_DOCTOR_BROWSER_TIMEOUT_MS).catch(() => null);
    if (!analysisGate.current.isCurrent(requestToken)) return;
    analysisGate.current.finish(requestToken);
    const response = result?.response;
    const data = result?.data;

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
      setCreditMessage(data?.message || "Mama G could not confirm the photo check. No diagnosis is available. Describe what you see to Ask Mama G, or retry the photo check manually.");
      setShowAskFarmMateFallback(true);
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
          <h2 className="sr-only">Crop Doctor</h2>
          <p className="mt-1 text-xs font-bold text-ink/48">{farmMateCreditLine("crop_doctor", credits)}</p>
          <p className="mt-1 text-xs font-semibold text-ink/42">Free public users get 2 Crop Doctor checks every 12 hours.</p>
          <p className="mt-2 text-sm leading-6 text-ink/66">Add a photo, then share the crop or signs you notice if you know them.</p>
        </div>
      </div>

      <p id="crop-doctor-disclosure" className="mt-5 text-sm leading-6 text-ink/75">
        Crop Doctor uses AI to analyse the crop photo you upload. The image may be processed by our AI service provider to identify possible crop-health issues. Do not upload photos containing people, personal documents or other sensitive information. Results are guidance, not a confirmed diagnosis.
      </p>

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
          <p className="mt-3 text-base font-black text-ink">{isAnalysing ? "Checking your photo" : isUploadDisabled ? "No Crop Doctor checks available" : "Add a photo"}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-ink/58">
            {isUploadDisabled
              ? "You can still ask Mama G for guidance while you wait."
              : "Photograph the affected part clearly in good daylight."}
          </p>
          {!isUploadDisabled ? <p className="mt-2 text-xs font-bold text-ink/48">Close-ups of leaves, fruit, stems, roots, pests or produce are welcome. A second whole-plant photo may help.</p> : null}
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
              Take photo
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
              Choose photo
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
          Crop (optional)
          <select
            id="crop-doctor-selected-crop"
            disabled={isAnalysing}
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
          What do you notice? <span className="font-semibold text-ink/50">(optional)</span>
          <select
            id="crop-doctor-selected-symptom"
            disabled={isAnalysing}
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
        <div className="flex flex-wrap gap-2" aria-label="Common visible signs">{["Yellow leaves", "Spots on leaves", "Holes in leaves", "Wilting", "Fruit problem", "Insects or pests"].filter((symptom) => symptomOptions.includes(symptom)).map((symptom) => <button key={symptom} type="button" aria-pressed={selectedSymptom === symptom} disabled={isAnalysing} onClick={() => { setSelectedSymptom(symptom); resetDiagnosisForFieldContext(); }} className={`min-h-10 rounded-full border px-3 text-xs font-bold ${selectedSymptom === symptom ? "border-leaf-700 bg-leaf-700 text-white" : "border-leaf-900/15 bg-white text-leaf-700"}`}>{symptom}</button>)}</div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={analyseCrop}
          aria-describedby="crop-doctor-disclosure"
          disabled={isAnalyseButtonDisabled}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-900 disabled:cursor-not-allowed disabled:bg-ink/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
        >
          {isAnalysing ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Stethoscope size={18} aria-hidden="true" />}
          {analyseButtonText}
        </button>
        {isAnalysisDisabled && selectedFile ? (
          <p className="mt-2 text-xs font-bold leading-5 text-ink/48">{mamaGPublicText(creditMessage || "Crop Doctor checks are not available right now.")}</p>
        ) : null}
      </div>

      <div className="mt-5" aria-live="polite">
        {isAnalysing ? (
          <div className="flex items-center gap-2 rounded-md bg-leaf-50 px-4 py-3 text-sm font-black text-ink/70">
            <Loader2 className="animate-spin text-leaf-700" size={18} aria-hidden="true" />
            Mama G is checking your crop photo...
          </div>
        ) : null}

        {creditMessage ? (
          <div className="rounded-md border border-earth-500/25 bg-earth-50 px-4 py-3">
            <p className="text-sm font-bold leading-6 text-ink/68">{mamaGPublicText(creditMessage)}</p>
            {showAskFarmMateFallback ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={askFarmMateInstead}
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                >
                  Ask Mama G instead
                </button>
                {isPublicSubmissionAvailable("farmmate-feedback") ? <Link
                  href={FARM_MATE_FEEDBACK_CTA.href}
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-leaf-600 px-4 py-2 text-sm font-black text-white transition hover:bg-leaf-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                >
                  {FARM_MATE_FEEDBACK_CTA.label}
                </Link> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {hasDiagnosis && diagnosis ? (
          <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="gg-eyebrow text-leaf-700">Main finding</p>
                <h3 className="mt-2 gg-card-title">{unclearDiagnosis ? mamaGPublicText(diagnosis.mainFinding) : mamaGPublicText(cropDoctorResultHeadline(diagnosis))}</h3>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-black text-leaf-700">
                <CheckCircle2 size={17} aria-hidden="true" />
                {cropDoctorResultBadge(diagnosis)}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-ink/70">Crop: {diagnosis.crop ?? "unconfirmed"} ({diagnosis.cropConfidence}) · Visible-problem confidence: {diagnosis.confidence}{diagnosisSelectedSymptom ? ` · You selected: ${diagnosisSelectedSymptom}` : ""}</p>

            {!unclearDiagnosis && diagnosis.limitedGuidanceNote ? (
              <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-semibold leading-6 text-ink/68">
                {mamaGPublicText(diagnosis.limitedGuidanceNote)}
              </p>
            ) : null}
            {!unclearDiagnosis && diagnosis.familyGuidance ? (
              <p className="mt-2 rounded-md bg-white px-3 py-2 text-sm font-semibold leading-6 text-ink/68">
                {mamaGPublicText(diagnosis.familyGuidance)}
              </p>
            ) : null}
            {!unclearDiagnosis && diagnosis.cashCropCaution ? (
              <p className="mt-2 rounded-md border border-earth-500/20 bg-earth-50 px-3 py-2 text-sm font-bold leading-6 text-ink/70">
                {mamaGPublicText(diagnosis.cashCropCaution)}
              </p>
            ) : null}

            {unclearDiagnosis ? <div className="mt-4 space-y-3 rounded-md bg-white p-4 text-sm font-semibold leading-6 text-ink/70">
              {diagnosis.visibleSigns.length ? <p><strong className="text-ink">What I could see:</strong> {mamaGPublicText(diagnosis.visibleSigns.slice(0, 2).join("; "))}</p> : null}
              <p><strong className="text-ink">What remains unconfirmed:</strong> The crop identity and exact cause are not established from this photo.</p>
              <p><strong className="text-ink">Possible:</strong> {mamaGPublicText(diagnosis.whatThisMeans)}</p>
              <div><strong className="text-ink">How to tell:</strong><ul className="mt-1 list-disc space-y-2 pl-4">{diagnosis.whatToCheck.slice(0, 2).map(line => <li key={line}>{mamaGPublicText(line)}</li>)}</ul></div>
              <p><strong className="text-ink">Next step:</strong> {mamaGPublicText(diagnosis.nextBestAction)}</p>
            </div> : <div className="mt-4 space-y-3 rounded-md bg-white p-4 text-sm font-semibold leading-6 text-ink/70">
              {diagnosis.visibleSigns.length ? <p><strong className="text-ink">What I can see:</strong> {mamaGPublicText(diagnosis.visibleSigns.slice(0, 2).join("; "))}</p> : null}
              <p><strong className="text-ink">What it may suggest:</strong> {mamaGPublicText(diagnosis.whatThisMeans)}</p>
              <p><strong className="text-ink">Unconfirmed:</strong> The exact cause is not established by a photo.</p>
              <div><strong className="text-ink">How to tell:</strong><ul className="mt-1 list-disc space-y-2 pl-4">{diagnosis.whatToCheck.slice(0, 2).map(line => <li key={line}>{mamaGPublicText(line)}</li>)}</ul></div>
              {resultDo && resultDo !== diagnosis.nextBestAction ? <p><strong className="text-ink">Do now:</strong> {mamaGPublicText(resultDo)}</p> : null}
              <p><strong className="text-ink">Next step:</strong> {mamaGPublicText(diagnosis.nextBestAction)}</p>
            </div>}
            <details className="mt-3 rounded-md bg-white p-3 text-sm leading-6"><summary className="min-h-11 cursor-pointer font-black text-leaf-700">More detail</summary><ul className="list-disc space-y-2 pl-4">{diagnosis.prevention.slice(0, 3).map(line => <li key={line}>{mamaGPublicText(line)}</li>)}</ul></details>
            <details className="mt-3 rounded-md bg-white p-3 text-sm leading-6"><summary className="min-h-11 cursor-pointer font-black text-leaf-700">Sources &amp; limitations</summary><p>AI compares visible signs using general crop-health guidance. Similar signs can have different causes; this is not professional certification or food/feed safety clearance.</p><a className="underline" href="https://www.pubs.ext.vt.edu/content/dam/pubs_ext_vt_edu/426/426-714/426-714.pdf" target="_blank" rel="noreferrer">Virginia Cooperative Extension: general plant diagnostic principles</a></details>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {unclearDiagnosis ? <><button type="button" onClick={openCameraCapture} className="min-h-12 rounded-md bg-leaf-600 px-4 py-2 text-sm font-black text-white">Take another photo</button><button type="button" onClick={openImagePicker} className="min-h-12 rounded-md border border-leaf-700 bg-white px-4 py-2 text-sm font-black text-leaf-700">Choose another photo</button></> : null}
              <button type="button" onClick={askFarmMateAboutThis} className={`min-h-12 rounded-md px-4 py-2 text-sm font-black ${unclearDiagnosis ? "border border-leaf-700 bg-white text-leaf-700 sm:col-span-2" : "bg-leaf-600 text-white sm:col-span-2"}`}>{unclearDiagnosis ? "Continue with Mama G" : "Ask Mama G about this"}</button>
            </div>

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
