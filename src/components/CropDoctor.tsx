"use client";

import { Camera, CheckCircle2, ImagePlus, Loader2, Stethoscope, UploadCloud } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import type { CropDoctorVisionResult } from "@/lib/farmmate/crop-doctor-vision";
import { farmMateCreditLine, getFarmMateAnonymousDeviceId } from "@/lib/farmmate/usage/client";
import {
  CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT,
  cropDoctorCreditMessage,
  shouldDisableCropDoctorAnalysis,
  type FarmMateCreditDecision,
  type FarmMateCreditStatus
} from "@/lib/farmmate/usage";

export function CropDoctor({ onAskFarmMateAboutThis }: { onAskFarmMateAboutThis?: (question: string) => void }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [hasDiagnosis, setHasDiagnosis] = useState(false);
  const [diagnosis, setDiagnosis] = useState<CropDoctorVisionResult | null>(null);
  const [credits, setCredits] = useState<FarmMateCreditStatus | null>(null);
  const [creditMessage, setCreditMessage] = useState("");
  const [showAskFarmMateFallback, setShowAskFarmMateFallback] = useState(false);
  const isCreditExhausted = shouldDisableCropDoctorAnalysis(credits);

  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  async function refreshCredits() {
    try {
      const response = await fetch("/api/farmmate/usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          anonymousDeviceId: getFarmMateAnonymousDeviceId(),
          tool: "crop_doctor",
          action: "status"
        })
      });
      const data = (await response.json().catch(() => null)) as { credits?: FarmMateCreditStatus } | null;

      if (data?.credits) {
        setCredits(data.credits);
        if (data.credits.isExhausted) {
          setCreditMessage(cropDoctorCreditMessage({ reason: "credits_exhausted", refreshInText: data.credits.refreshInText }));
          setShowAskFarmMateFallback(true);
        }
      }
    } catch {
      setCredits(null);
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

    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }

    setSelectedImage(URL.createObjectURL(file));
    setSelectedFile(file);
    setFileName(file.name);
    setDiagnosis(null);
    setHasDiagnosis(false);
    setIsAnalysing(false);
    if (isCreditExhausted && credits) {
      setCreditMessage(cropDoctorCreditMessage({ reason: "credits_exhausted", refreshInText: credits.refreshInText }));
      setShowAskFarmMateFallback(true);
    } else {
      setCreditMessage("");
      setShowAskFarmMateFallback(false);
    }
  }

  async function analyseCrop() {
    if (!selectedImage || !selectedFile || isAnalysing) {
      return;
    }

    if (isCreditExhausted && credits) {
      setCreditMessage(cropDoctorCreditMessage({ reason: "credits_exhausted", refreshInText: credits.refreshInText }));
      setShowAskFarmMateFallback(true);
      return;
    }

    setCreditMessage("");
    setShowAskFarmMateFallback(false);
    setDiagnosis(null);
    setIsAnalysing(true);
    setHasDiagnosis(false);

    const formData = new FormData();
    formData.append("anonymousDeviceId", getFarmMateAnonymousDeviceId());
    formData.append("image", selectedFile);

    const response = await fetch("/api/farmmate/crop-doctor", {
      method: "POST",
      body: formData
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      result?: CropDoctorVisionResult;
      credits?: FarmMateCreditStatus;
      reason?: FarmMateCreditDecision["reason"] | string;
      message?: string;
    } | null;

    if (data?.credits) {
      setCredits(data.credits);
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
    const farmMateQuestion = diagnosis?.askFarmMatePrompt ?? "I uploaded a crop photo. What should I check next?";
    askFarmMate(farmMateQuestion);
  }

  function askFarmMateInstead() {
    askFarmMate(CROP_DOCTOR_ASK_FARMMATE_FALLBACK_PROMPT);
  }

  function askFarmMate(farmMateQuestion: string) {
    if (onAskFarmMateAboutThis) {
      onAskFarmMateAboutThis(farmMateQuestion);
      return;
    }

    window.dispatchEvent(new CustomEvent("gg-farmmate-prefill", { detail: farmMateQuestion }));
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
          <p className="mt-2 text-sm leading-6 text-ink/66">Upload a crop photo and get practical next steps.</p>
        </div>
      </div>

      <label
        htmlFor="crop-doctor-upload"
        className="mt-5 grid min-h-44 cursor-pointer place-items-center rounded-md border-2 border-dashed border-leaf-700/20 bg-leaf-50 p-5 text-center transition hover:border-leaf-700/45 hover:bg-white"
      >
        <input id="crop-doctor-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
        <div>
          <UploadCloud className="mx-auto text-leaf-700" size={32} aria-hidden="true" />
          <p className="mt-3 text-base font-black text-ink">Take photo or choose photo</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-ink/58">JPG, PNG, or WEBP under 5 MB. Ghana Growers does not permanently store this photo in V1.</p>
        </div>
      </label>

      {selectedImage ? (
        <div className="mt-5">
          <div className="overflow-hidden rounded-md border border-leaf-900/10 bg-leaf-50">
            <Image src={selectedImage} alt="Selected crop preview" width={900} height={420} unoptimized className="h-56 w-full object-cover" />
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm font-bold text-ink/62">
              <ImagePlus className="text-leaf-700" size={18} aria-hidden="true" />
              {fileName || "Crop photo selected"}
            </p>
            <button
              type="button"
              onClick={analyseCrop}
              disabled={isAnalysing || isCreditExhausted}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white transition hover:bg-leaf-900 disabled:cursor-not-allowed disabled:bg-ink/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
            >
              {isAnalysing ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Stethoscope size={18} aria-hidden="true" />}
              Analyse Crop
            </button>
          </div>
        </div>
      ) : null}

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
              <button
                type="button"
                onClick={askFarmMateInstead}
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-black text-leaf-700 ring-1 ring-leaf-900/10 transition hover:bg-leaf-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
              >
                Ask FarmMate instead
              </button>
            ) : null}
          </div>
        ) : null}

        {hasDiagnosis && diagnosis ? (
          <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="gg-eyebrow text-leaf-700">Possible issue</p>
                <h3 className="mt-2 gg-card-title">{diagnosis.possibleIssue}</h3>
                <p className="mt-2 text-sm font-bold text-ink/62">
                  {diagnosis.crop ? `Crop detected: ${diagnosis.crop}` : "Crop not confirmed"}
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-black text-leaf-700">
                <CheckCircle2 size={17} aria-hidden="true" />
                {diagnosis.confidence === "high" ? "Strong clue" : diagnosis.confidence === "medium" ? "Needs checking" : "Unclear photo"}
              </span>
            </div>
            <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-bold leading-6 text-ink/64">
              Crop Doctor gives guidance from the photo, not a guaranteed diagnosis. Confirm serious or spreading problems with an extension officer.
            </p>

            <div className="mt-4 grid gap-3">
              {([
                ["Visible signs", diagnosis.visibleSigns],
                ["What this means", [diagnosis.whatThisMeans]],
                ["What to do now", diagnosis.recommendedAction],
                ["Prevention", diagnosis.prevention],
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
          </div>
        ) : null}
      </div>
    </article>
  );
}
