"use client";

import { ImagePlus, Save, ScanSearch } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { CropHealthResult } from "@/lib/cropHealth";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxSize = 5 * 1024 * 1024;
const sessionStorageKey = "ghana-growers-crop-health-session";

type SavedCropHealthReport = {
  id: string;
  image_url: string;
  diagnosis: string;
  confidence: number;
  severity: string | null;
  symptoms: string | null;
  recommendations: string | null;
  provider: string | null;
  created_at: string;
  report_date: string;
};

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

function confidenceLabel(confidence: number) {
  if (confidence >= 80) {
    return `High Confidence (${confidence}%)`;
  }

  if (confidence >= 60) {
    return `Moderate Confidence (${confidence}%)`;
  }

  return `Low Confidence (${confidence}%)`;
}

function attentionLevel(value?: string) {
  const lower = value?.toLowerCase() ?? "";

  if (lower.includes("high") || lower.includes("severe") || lower.includes("likely")) {
    return "High Attention Needed";
  }

  if (lower.includes("medium") || lower.includes("moderate") || lower.includes("confirm")) {
    return "Medium Attention Needed";
  }

  return "Low Attention Needed";
}

function attentionClass(level: string) {
  if (level.startsWith("High")) {
    return "bg-tomato text-white";
  }

  if (level.startsWith("Medium")) {
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
  const [showMoreSymptoms, setShowMoreSymptoms] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [reports, setReports] = useState<SavedCropHealthReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedCropHealthReport | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const existing = window.localStorage.getItem(sessionStorageKey);
    const nextSessionId = existing || crypto.randomUUID();

    if (!existing) {
      window.localStorage.setItem(sessionStorageKey, nextSessionId);
    }

    setSessionId(nextSessionId);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    fetch(`/api/crop-health-reports?sessionId=${encodeURIComponent(sessionId)}`)
      .then((response) => response.json())
      .then((payload) => {
        if (Array.isArray(payload.reports)) {
          setReports(payload.reports);
        }
      })
      .catch(() => undefined);
  }, [sessionId]);

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
    setShowMoreSymptoms(false);
    setShowMoreActions(false);

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
      setSaveMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Crop health request failed";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveDiagnosis() {
    if (!result || !selectedFile || !sessionId) {
      return;
    }

    setIsSaving(true);
    setSaveMessage("");

    const formData = new FormData();
    formData.append("photo", selectedFile);
    formData.append("sessionId", sessionId);
    formData.append("diagnosis", JSON.stringify(result));

    const response = await fetch("/api/crop-health-reports", {
      method: "POST",
      body: formData
    }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as { report?: SavedCropHealthReport; error?: string } | null;
    setIsSaving(false);

    if (!response?.ok || !payload?.report) {
      setSaveMessage(payload?.error ?? "Could not save this diagnosis. Check Supabase setup and try again.");
      return;
    }

    setReports((current) => [payload.report as SavedCropHealthReport, ...current].slice(0, 12));
    setSaveMessage("Diagnosis saved to Saved Crop Health Reports.");
  }

  return (
    <section id="crop-health" className="scroll-mt-28 rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-black text-ink">Crop Health Check</h2>
      <p className="mt-2 text-base leading-7 text-ink/65">Upload a crop photo and get farming advice.</p>

      <div className="mt-5 grid gap-4">
        <label className="focus-ring flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-leaf-600/45 bg-leaf-50 p-4 text-center sm:p-6">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Selected crop preview"
              width={960}
              height={520}
              className="h-52 w-full rounded-md object-cover sm:h-80"
              unoptimized
            />
          ) : (
            <div className="grid h-44 w-full place-items-center rounded-md bg-white sm:h-72">
              <ImagePlus className="text-leaf-600" size={42} aria-hidden="true" />
            </div>
          )}
          <span className="mt-4 rounded-md bg-leaf-700 px-5 py-3 text-sm font-black text-white">
            {fileName || "Upload Crop Photo"}
          </span>
          <span className="mt-2 text-xs leading-5 text-ink/60">JPG, PNG, or WEBP. Maximum 5MB.</span>
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setErrorMessage("");
              setResult(undefined);
              setShowMoreSymptoms(false);
              setShowMoreActions(false);

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

        <div className="rounded-md bg-[#ECE7D1] p-4 sm:p-5">
          <button
            type="button"
            disabled={!selectedFile || isLoading}
            onClick={analyzePhoto}
            className="gg-button-primary w-full gap-2 sm:w-auto"
          >
            <ScanSearch size={17} aria-hidden="true" />
            {isLoading ? "Checking Photo..." : "Get Advisory Result"}
          </button>

          {result ? (
            <div className="mt-5 grid gap-4 text-sm">
              {(() => {
                const symptoms = splitText(result.symptoms);
                const symptomPreview = symptoms.slice(0, 3);
                const actions = splitText(result.recommendedAction);
                const actionPreview = actions.slice(0, 3);
                const attention = attentionLevel(result.severity);
                const source =
                  result.provider === "crop.health"
                    ? "Crop.health API"
                    : "Crop advisory fallback";
                const summary =
                  result.noDiseaseDetected
                    ? "No serious problem was clearly detected. Keep monitoring the plant and take another clear photo if symptoms continue."
                    : `${result.possibleIssue}. Check soil condition, water properly, remove badly affected leaves if needed, and avoid applying chemicals until confirmed.`;

                return (
                  <>
                    <div className="rounded-md border border-leaf-900/10 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-earth-700">Diagnosis Summary</p>
                      <div className="mt-3">
                        <p className="text-xs font-black uppercase tracking-wide text-ink/45">Diagnosis</p>
                        <h3 className="mt-1 text-xl font-black leading-tight text-ink">{result.possibleIssue}</h3>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-black uppercase tracking-wide text-ink/45">Farmer Summary</p>
                        <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-ink/70">{summary}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${confidenceClass(result.confidence)}`}>
                          {confidenceLabel(result.confidence)}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${attentionClass(attention)}`}>
                          {attention}
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink/45">Source: {source}</p>
                      {result.noDiseaseDetected ? (
                        <p className="mt-3 rounded-md bg-leaf-50 p-3 font-bold leading-5 text-leaf-700">
                          No strong disease match was detected. Keep monitoring and upload a clearer symptom photo if the problem continues.
                        </p>
                      ) : null}
                      {result.lowConfidence ? (
                        <p className="mt-3 rounded-md bg-earth-50 p-3 font-bold leading-5 text-earth-700">
                          Low confidence result. Take another close-up photo in good light and confirm before treatment.
                        </p>
                      ) : null}
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
                            onClick={() => setShowMoreSymptoms((value) => !value)}
                            className="text-sm font-black text-leaf-700 underline-offset-4 hover:underline"
                          >
                            {showMoreSymptoms ? "Hide symptoms" : "Read more symptoms"}
                          </button>
                          {showMoreSymptoms ? (
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
                        {(actionPreview.length ? actionPreview : [result.recommendedAction]).map((action) => (
                          <li key={action} className="flex gap-2 leading-6 text-ink/68">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-earth-500" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                      {actions.length > actionPreview.length ? (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => setShowMoreActions((value) => !value)}
                            className="text-sm font-black text-leaf-700 underline-offset-4 hover:underline"
                          >
                            {showMoreActions ? "Hide actions" : "Read more actions"}
                          </button>
                          {showMoreActions ? (
                            <p className="mt-3 rounded-md bg-leaf-50 p-3 leading-6 text-ink/70">
                              {result.recommendedAction}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </>
                );
              })()}
              <p className="rounded-md bg-white p-3 font-bold text-tomato">
                {result.disclaimer}
              </p>
              <div className="rounded-md bg-white p-3">
                <button
                  type="button"
                  onClick={saveDiagnosis}
                  disabled={isSaving || !sessionId}
                  className="gg-button-primary w-full gap-2 sm:w-auto"
                >
                  <Save size={16} aria-hidden="true" />
                  {isSaving ? "Saving Diagnosis..." : "Save Diagnosis"}
                </button>
                {saveMessage ? (
                  <p className={`mt-3 text-sm font-bold ${saveMessage.includes("saved") ? "text-leaf-700" : "text-tomato"}`}>
                    {saveMessage}
                  </p>
                ) : null}
              </div>
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
              Upload a clear crop photo first. This tool provides advisory guidance only. Confirm serious crop problems with an agricultural extension officer.
            </p>
          )}
        </div>
      </div>

      {reports.length > 0 ? (
      <div id="crop-health-reports" className="mt-8 scroll-mt-28 rounded-md border border-leaf-900/10 bg-leaf-50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-earth-700">Saved diagnoses</p>
            <h3 className="mt-1 text-xl font-black text-ink">Saved Crop Health Reports</h3>
          </div>
          <p className="text-sm font-bold text-ink/55">{reports.length} saved</p>
        </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {reports.map((report) => {
              const attention = attentionLevel(report.severity ?? undefined);

              return (
                <article key={report.id} className="grid gap-3 rounded-md bg-white p-3 shadow-sm sm:grid-cols-[96px_1fr]">
                  <div
                    role="img"
                    aria-label={`${report.diagnosis} report image`}
                    className="h-24 w-full rounded-md bg-leaf-50 bg-cover bg-center sm:w-24"
                    style={{ backgroundImage: `url(${report.image_url})` }}
                  />
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${confidenceClass(report.confidence)}`}>
                        {confidenceLabel(report.confidence)}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${attentionClass(attention)}`}>
                        {attention}
                      </span>
                    </div>
                    <h4 className="mt-2 font-black leading-tight text-ink">{report.diagnosis}</h4>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-ink/45">
                      {new Date(report.report_date).toLocaleDateString()} · {report.provider === "crop.health" ? "Crop.health API" : "Mock fallback"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedReport(report)}
                      className="mt-3 rounded-md bg-leaf-50 px-3 py-2 text-xs font-black text-leaf-700 transition hover:bg-leaf-100"
                    >
                      View Details
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

        {selectedReport ? (
          <div className="mt-4 rounded-md border border-leaf-900/10 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-earth-700">Report details</p>
                <h4 className="mt-1 text-xl font-black text-ink">{selectedReport.diagnosis}</h4>
                <p className="mt-1 text-sm font-bold text-ink/50">{new Date(selectedReport.created_at).toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-md border border-leaf-900/10 px-3 py-2 text-xs font-black text-ink/60 transition hover:border-leaf-700 hover:text-leaf-800"
              >
                Close Details
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-leaf-50 p-3">
                <p className="text-xs font-black uppercase tracking-wide text-ink/45">Confidence</p>
                <p className="mt-1 font-black text-ink">{confidenceLabel(selectedReport.confidence)}</p>
              </div>
              <div className="rounded-md bg-leaf-50 p-3">
                <p className="text-xs font-black uppercase tracking-wide text-ink/45">Attention Needed</p>
                <p className="mt-1 font-black text-ink">{attentionLevel(selectedReport.severity ?? undefined)}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <div>
                <h5 className="font-black text-ink">Symptoms</h5>
                <p className="mt-2 leading-6 text-ink/68">{selectedReport.symptoms || "No symptom details saved for this report."}</p>
              </div>
              <div>
                <h5 className="font-black text-ink">Recommendations</h5>
                <ul className="mt-2 grid gap-2">
                  {(splitText(selectedReport.recommendations ?? "").length ? splitText(selectedReport.recommendations ?? "") : ["No recommendations saved for this report."]).map((item) => (
                    <li key={item} className="flex gap-2 leading-6 text-ink/68">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-earth-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      ) : null}
    </section>
  );
}
