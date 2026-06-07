"use client";

import { ImagePlus, ScanSearch } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { CropHealthResult } from "@/lib/cropHealth";

export function CropHealthCheck() {
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState<CropHealthResult | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | undefined>();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function analyzePhoto() {
    if (!selectedFile) {
      return;
    }

    setIsLoading(true);
    setResult(undefined);

    const formData = new FormData();
    formData.append("photo", selectedFile);

    try {
      const response = await fetch("/api/crop-health", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Crop health request failed");
      }

      setResult((await response.json()) as CropHealthResult);
    } catch {
      setResult({
        possibleIssue: "Unable to complete image advisory",
        confidence: 0,
        recommendedAction: "Please try again with a clear photo and confirm urgent crop issues with an extension officer.",
        disclaimer: "This is advisory only. Please confirm with an agricultural extension officer."
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section id="crop-health" className="scroll-mt-28 rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft sm:p-6">
      <p className="text-sm font-black uppercase text-earth-700">Crop Health Check</p>
      <h2 className="mt-2 text-2xl font-black text-ink">Upload Crop Photo</h2>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        Take a clear photo of the affected leaf, stem, fruit, or whole plant. This demo shows how future crop health results will guide the next step.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <label className="focus-ring flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-leaf-600 bg-leaf-50 p-6 text-center">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Selected crop preview"
              width={360}
              height={240}
              className="h-44 w-full rounded-md object-cover"
              unoptimized
            />
          ) : (
            <ImagePlus className="text-leaf-600" size={42} aria-hidden="true" />
          )}
          <span className="mt-4 rounded-md bg-leaf-600 px-4 py-3 text-sm font-black text-white">
            {fileName || "Upload Crop Photo"}
          </span>
          <span className="mt-3 text-xs leading-5 text-ink/60">Use JPG, PNG, or WEBP. No file is uploaded in this demo.</span>
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFileName(file?.name ?? "");
              setSelectedFile(file);
              setResult(undefined);

              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
              }

              setPreviewUrl(file ? URL.createObjectURL(file) : "");
            }}
          />
        </label>

        <div className="rounded-md bg-earth-50 p-5">
          <button
            type="button"
            disabled={!selectedFile || isLoading}
            onClick={analyzePhoto}
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-leaf-600 px-4 py-3 text-sm font-black text-white transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-ink/25 sm:w-auto"
          >
            <ScanSearch size={17} aria-hidden="true" />
            {isLoading ? "Checking Photo..." : "Get Advisory Result"}
          </button>

          {result ? (
            <div className="mt-5 grid gap-3 text-sm">
              <p><span className="font-black text-ink">Possible issue:</span> {result.possibleIssue}</p>
              <p><span className="font-black text-ink">Confidence level:</span> {result.confidence}% mock confidence.</p>
              <p><span className="font-black text-ink">Recommended action:</span> {result.recommendedAction}</p>
              <p className="rounded-md bg-white p-3 font-bold text-tomato">
                {result.disclaimer}
              </p>
            </div>
          ) : isLoading ? (
            <p className="mt-5 rounded-md bg-white p-3 text-sm font-bold text-leaf-700">
              Checking the photo and preparing an advisory result...
            </p>
          ) : (
            <p className="mt-5 text-sm leading-6 text-ink/65">
              Upload a clear photo first. Later this area can connect to Plant.id, Crop.health, Plantix, or another crop disease API.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
