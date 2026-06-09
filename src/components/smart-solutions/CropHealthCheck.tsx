"use client";

import { ImagePlus, ScanSearch } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cropHealthDisclaimer, type CropHealthResult } from "@/lib/cropHealth";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxSize = 5 * 1024 * 1024;

export function CropHealthCheck() {
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState<CropHealthResult | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [errorMessage, setErrorMessage] = useState("");

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
    setErrorMessage("");

    const formData = new FormData();
    formData.append("photo", selectedFile);

    try {
      const response = await fetch("/api/crop-health", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json().catch(() => null)) as CropHealthResult | { error?: string } | null;

      if (!response.ok || !payload) {
        throw new Error("Crop health request failed");
      }

      if ("error" in payload) {
        const apiError = payload as { error?: string };
        throw new Error(apiError.error || "Crop health request failed");
      }

      setResult(payload as CropHealthResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Crop health request failed";
      setErrorMessage(message);
      setResult({
        possibleIssue: "Unable to complete image advisory",
        confidence: 0,
        symptoms: "The image could not be checked at this time.",
        recommendedAction: "Please try again with a clear photo and confirm urgent crop issues with an extension officer.",
        severity: "Unknown",
        disclaimer: cropHealthDisclaimer,
        provider: "mock",
        lowConfidence: true
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
        Take a clear photo of the affected leaf, stem, fruit, or whole plant. Ghana Growers checks the image through a secure server route and returns advisory next steps.
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
          <span className="mt-3 text-xs leading-5 text-ink/60">Use JPG, PNG, or WEBP. Maximum file size: 5MB.</span>
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setErrorMessage("");
              setResult(undefined);

              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
              }

              if (!file) {
                setFileName("");
                setSelectedFile(undefined);
                setPreviewUrl("");
                return;
              }

              if (!allowedTypes.includes(file.type)) {
                setFileName("");
                setSelectedFile(undefined);
                setPreviewUrl("");
                setErrorMessage("Upload a JPG, PNG, or WEBP crop image.");
                event.target.value = "";
                return;
              }

              if (file.size > maxSize) {
                setFileName("");
                setSelectedFile(undefined);
                setPreviewUrl("");
                setErrorMessage("Crop image must be 5MB or smaller.");
                event.target.value = "";
                return;
              }

              setFileName(file.name);
              setSelectedFile(file);
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
              {errorMessage ? (
                <p className="rounded-md bg-white p-3 font-bold text-tomato">
                  {errorMessage}
                </p>
              ) : null}
              {result.noDiseaseDetected ? (
                <p className="rounded-md bg-white p-3 font-bold text-leaf-700">
                  No strong disease match was detected. Keep monitoring and upload a clearer symptom photo if the problem continues.
                </p>
              ) : null}
              {result.lowConfidence ? (
                <p className="rounded-md bg-white p-3 font-bold text-earth-700">
                  Low confidence result. Take another close-up photo in good light and confirm before treatment.
                </p>
              ) : null}
              <p><span className="font-black text-ink">Possible issue:</span> {result.possibleIssue}</p>
              <p><span className="font-black text-ink">Confidence level:</span> {result.confidence}%{result.provider === "mock" ? " mock confidence" : ""}.</p>
              {result.severity ? <p><span className="font-black text-ink">Severity:</span> {result.severity}</p> : null}
              {result.symptoms ? <p><span className="font-black text-ink">Symptoms:</span> {result.symptoms}</p> : null}
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
              Upload a clear crop photo first. This tool provides advisory guidance only. Please confirm serious crop problems with an agricultural extension officer.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
