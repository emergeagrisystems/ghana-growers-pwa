"use client";

import { Camera, CheckCircle2, ImagePlus, Loader2, Stethoscope, UploadCloud } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import { diagnosisFromFileName, farmMateQuestionFromDiagnosis, unknownCropDiagnosis, type CropDoctorDemoDiagnosis } from "@/lib/farmmate/crop-doctor-demo";
import { farmMateCreditLine, getFarmMateAnonymousDeviceId } from "@/lib/farmmate/usage/client";
import type { FarmMateCreditStatus } from "@/lib/farmmate/usage";

export function CropDoctor({ onAskFarmMateAboutThis }: { onAskFarmMateAboutThis?: (question: string) => void }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [hasDiagnosis, setHasDiagnosis] = useState(false);
  const [diagnosis, setDiagnosis] = useState<CropDoctorDemoDiagnosis>(unknownCropDiagnosis);
  const [credits, setCredits] = useState<FarmMateCreditStatus | null>(null);
  const [creditMessage, setCreditMessage] = useState("");

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
    setFileName(file.name);
    setDiagnosis(diagnosisFromFileName(file.name));
    setHasDiagnosis(false);
    setIsAnalysing(false);
    setCreditMessage("");
  }

  async function analyseCrop() {
    if (!selectedImage || isAnalysing) {
      return;
    }

    setCreditMessage("");

    const usageResponse = await fetch("/api/farmmate/usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        anonymousDeviceId: getFarmMateAnonymousDeviceId(),
        tool: "crop_doctor",
        action: "record"
      })
    }).catch(() => null);
    const usageData = (await usageResponse?.json().catch(() => null)) as { credits?: FarmMateCreditStatus; reason?: string } | null;

    if (usageData?.credits) {
      setCredits(usageData.credits);
    }

    if (!usageResponse?.ok) {
      setCreditMessage(
        usageData?.reason === "rapid_submission"
          ? "FarmMate is still checking your last photo. Please wait a few seconds before trying again."
          : `You've used your free Crop Doctor checks for now. Your credits refresh in ${usageData?.credits?.refreshInText ?? "a little while"}.`
      );
      return;
    }

    setIsAnalysing(true);
    setHasDiagnosis(false);

    window.setTimeout(() => {
      setIsAnalysing(false);
      setHasDiagnosis(true);
    }, 1400);
  }

  function askFarmMateAboutThis() {
    const farmMateQuestion = farmMateQuestionFromDiagnosis(diagnosis);

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
          <p className="mt-1 text-sm font-semibold leading-6 text-ink/58">Image files only. This demo stays on your device.</p>
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
              disabled={isAnalysing}
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
            FarmMate is analysing your crop...
          </div>
        ) : null}

        {creditMessage ? (
          <p className="rounded-md border border-earth-500/25 bg-earth-50 px-4 py-3 text-sm font-bold leading-6 text-ink/68">
            {creditMessage}
          </p>
        ) : null}

        {hasDiagnosis ? (
          <div className="rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="gg-eyebrow text-leaf-700">Possible issue</p>
                <h3 className="mt-2 gg-card-title">{diagnosis.issue}</h3>
                <p className="mt-2 text-sm font-bold text-ink/62">Crop: {diagnosis.crop ?? "Unknown crop"}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-black text-leaf-700">
                <CheckCircle2 size={17} aria-hidden="true" />
                Demo {diagnosis.confidence}% confidence
              </span>
            </div>
            <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-bold leading-6 text-ink/64">
              Demo only: Crop Doctor cannot confirm the crop or diagnosis yet. Use this as a guide for what to check next.
            </p>

            <div className="mt-4 grid gap-3">
              {[
                ["What this means", diagnosis.meaning],
                ["Recommended action", diagnosis.action],
                ["Prevention", diagnosis.prevention]
              ].map(([label, text]) => (
                <div key={label} className="rounded-md bg-white p-3">
                  <p className="text-sm font-black text-ink">{label}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-ink/66">{text}</p>
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
