"use client";

import { ImagePlus, ScanSearch } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { CropHealthResult } from "@/lib/cropHealth";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxSize = 5 * 1024 * 1024;

function splitText(value?: string) {
  return (value ?? "")
    .split(/(?<=[.!?])\s+|;\s+|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function confidenceClass(confidence: number) {
  if (confidence > 80) {
    return "bg-leaf-600 text-white";
  }

  if (confidence >= 60) {
    return "bg-earth-500 text-ink";
  }

  return "bg-ink/10 text-ink/60";
}

function severityLevel(value?: string) {
  const lower = value?.toLowerCase() ?? "";

  if (lower.includes("high") || lower.includes("severe") || lower.includes("likely")) {
    return "High";
  }

  if (lower.includes("medium") || lower.includes("moderate") || lower.includes("confirm")) {
    return "Medium";
  }

  return "Low";
}

function severityClass(level: string) {
  if (level === "High") {
    return "bg-tomato text-white";
  }

  if (level === "Medium") {
    return "bg-earth-500 text-ink";
  }

  return "bg-leaf-50 text-leaf-700";
}

export function CropHealthCheck() {
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState<CropHealthResult | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [errorMessage, setErrorMessage] = useState("");
  const [showFullDetails, setShowFullDetails] = useState(false);

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
    setShowFullDetails(false);

    const formData = new FormData();
    formData.append("photo", selectedFile);

    try {
      const response = await fetch("/api/crop-health", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json().catch(() => null)) as CropHealthResult | { error?: string; diagnostics?: CropHealthResult["diagnostics"] } | null;

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
              setShowFullDetails(false);

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
            <div className="mt-5 grid gap-4 text-sm">
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
              {(() => {
                const symptoms = splitText(result.symptoms);
                const symptomPreview = symptoms.slice(0, 3);
                const actions = splitText(result.recommendedAction);
                const severity = severityLevel(result.severity);
                const source =
                  result.provider === "crop.health"
                    ? "Crop.health API"
                    : `Mock fallback${result.diagnostics?.fallbackReason === "api_key_missing" ? " - API key missing on server" : ""}`;

                return (
                  <>
                    <div className="rounded-md border border-leaf-900/10 bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-earth-700">Diagnosis summary</p>
                          <h3 className="mt-2 text-xl font-black leading-tight text-ink">{result.possibleIssue}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${confidenceClass(result.confidence)}`}>
                            {result.confidence}% confidence
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${severityClass(severity)}`}>
                            {severity} severity
                          </span>
                        </div>
                      </div>

                      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-black uppercase tracking-wide text-ink/45">Possible issue</dt>
                          <dd className="mt-1 font-bold leading-6 text-ink/75">{result.possibleIssue}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-black uppercase tracking-wide text-ink/45">Result source</dt>
                          <dd className="mt-1 font-bold leading-6 text-ink/75">{source}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-md border border-leaf-900/10 bg-white p-4">
                      <h3 className="font-black text-ink">Symptoms</h3>
                      {symptomPreview.length > 0 ? (
                        <ul className="mt-3 grid gap-2">
                          {symptomPreview.map((symptom) => (
                            <li key={symptom} className="flex gap-2 leading-6 text-ink/68">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-600" />
                              <span>{symptom}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 leading-6 text-ink/68">No detailed symptoms were returned by the diagnosis provider.</p>
                      )}

                      {symptoms.length > symptomPreview.length ? (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => setShowFullDetails((value) => !value)}
                            className="text-sm font-black text-leaf-700 underline-offset-4 hover:underline"
                          >
                            {showFullDetails ? "Hide details" : "Read More"}
                          </button>
                          {showFullDetails ? (
                            <p className="mt-3 rounded-md bg-leaf-50 p-3 leading-6 text-ink/70">
                              {result.symptoms}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-md border border-leaf-900/10 bg-white p-4">
                      <h3 className="font-black text-ink">Recommended Actions</h3>
                      <ul className="mt-3 grid gap-2">
                        {(actions.length ? actions : [result.recommendedAction]).map((action) => (
                          <li key={action} className="flex gap-2 leading-6 text-ink/68">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-earth-500" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                );
              })()}
              <p className="rounded-md bg-white p-3 font-bold text-tomato">
                {result.disclaimer}
              </p>
            </div>
          ) : isLoading ? (
            <p className="mt-5 rounded-md bg-white p-3 text-sm font-bold text-leaf-700">
              Checking the photo and preparing an advisory result...
            </p>
          ) : errorMessage ? (
            <p className="mt-5 rounded-md bg-white p-3 text-sm font-bold text-tomato">
              {errorMessage}
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
