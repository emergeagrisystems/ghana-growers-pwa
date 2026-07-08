"use client";

import { Camera, CheckCircle2, ImagePlus, Loader2, Stethoscope, UploadCloud } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";

const farmMateQuestion = "I uploaded a tomato leaf with possible early blight. What should I do next?";

export function CropDoctor() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [hasDiagnosis, setHasDiagnosis] = useState(false);

  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

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
    setHasDiagnosis(false);
    setIsAnalysing(false);
  }

  function analyseCrop() {
    if (!selectedImage || isAnalysing) {
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
    window.dispatchEvent(new CustomEvent("gg-farmmate-prefill", { detail: farmMateQuestion }));
    document.getElementById("assistant")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <article id="crop-doctor" className="rounded-md border border-[#2E7D32]/10 bg-white p-5 shadow-soft sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-[#2E7D32]/10 text-[#2E7D32]">
          <Camera size={30} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-2xl font-black text-ink">{"\uD83D\uDCF7 Crop Doctor"}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/66">Upload a crop photo and get practical next steps.</p>
        </div>
      </div>

      <label
        htmlFor="crop-doctor-upload"
        className="mt-5 grid min-h-44 cursor-pointer place-items-center rounded-md border-2 border-dashed border-[#2E7D32]/20 bg-[#FBFFE8] p-5 text-center transition hover:border-[#2E7D32]/45 hover:bg-white"
      >
        <input id="crop-doctor-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
        <div>
          <UploadCloud className="mx-auto text-[#2E7D32]" size={34} aria-hidden="true" />
          <p className="mt-3 text-base font-black text-ink">Take photo or choose photo</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-ink/58">Image files only. This demo stays on your device.</p>
        </div>
      </label>

      {selectedImage ? (
        <div className="mt-5">
          <div className="overflow-hidden rounded-md border border-[#2E7D32]/10 bg-[#FBFFE8]">
            <Image src={selectedImage} alt="Selected crop preview" width={900} height={420} unoptimized className="h-56 w-full object-cover" />
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm font-bold text-ink/62">
              <ImagePlus className="text-[#2E7D32]" size={18} aria-hidden="true" />
              {fileName || "Crop photo selected"}
            </p>
            <button
              type="button"
              onClick={analyseCrop}
              disabled={isAnalysing}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#2E7D32] px-5 py-3 text-sm font-black text-white transition hover:bg-[#246428] disabled:cursor-not-allowed disabled:bg-ink/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32]"
            >
              {isAnalysing ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Stethoscope size={18} aria-hidden="true" />}
              Analyse Crop
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5" aria-live="polite">
        {isAnalysing ? (
          <div className="flex items-center gap-2 rounded-md bg-[#FBFFE8] px-4 py-3 text-sm font-black text-ink/70">
            <Loader2 className="animate-spin text-[#2E7D32]" size={18} aria-hidden="true" />
            FarmMate is analysing your crop...
          </div>
        ) : null}

        {hasDiagnosis ? (
          <div className="rounded-md border border-[#2E7D32]/10 bg-[#FBFFE8] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#2E7D32]">Possible issue</p>
                <h3 className="mt-2 text-2xl font-black text-ink">Early blight</h3>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-black text-[#2E7D32]">
                <CheckCircle2 size={17} aria-hidden="true" />
                92% confidence
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {[
                ["What this means", "Early blight is a fungal disease that often appears after rain and high humidity."],
                ["Recommended action", "Remove affected leaves, improve airflow, and avoid watering the leaves directly."],
                ["Prevention", "Rotate crops, water at soil level, and monitor nearby plants."]
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
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#2E7D32] px-5 py-3 text-sm font-black text-white transition hover:bg-[#246428] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32]"
            >
              Ask FarmMate about this
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
