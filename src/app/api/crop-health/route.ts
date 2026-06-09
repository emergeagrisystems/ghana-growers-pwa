import { NextResponse } from "next/server";
import { cropHealthDisclaimer, mockAnalyzeCropImage, type CropHealthResult } from "@/lib/cropHealth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 5 * 1024 * 1024;
const dailyLimit = 20;
const usage = new Map<string, { date: string; count: number }>();

type KindwiseSuggestion = {
  name?: string;
  probability?: number;
  details?: {
    description?: string | { value?: string };
    symptoms?: string | string[] | { text?: string; value?: string };
    treatment?: string | string[] | Record<string, unknown>;
    biological_treatment?: string;
    chemical_treatment?: string;
    prevention?: string;
    severity?: string;
  };
};

type KindwiseResponse = {
  result?: {
    disease?: {
      suggestions?: KindwiseSuggestion[];
    };
    is_healthy?: {
      probability?: number;
      binary?: boolean;
    };
  };
  message?: string;
};

function clientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "local-session";
}

function checkUsage(request: Request) {
  const today = new Date().toISOString().slice(0, 10);
  const key = clientKey(request);
  const current = usage.get(key);

  if (!current || current.date !== today) {
    usage.set(key, { date: today, count: 1 });
    return true;
  }

  if (current.count >= dailyLimit) {
    return false;
  }

  current.count += 1;
  return true;
}

function textFrom(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(textFrom).filter(Boolean).join(" ");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.value === "string") {
      return record.value;
    }

    if (typeof record.text === "string") {
      return record.text;
    }

    return Object.values(record).map(textFrom).filter(Boolean).join(" ");
  }

  return "";
}

function treatmentFrom(details?: KindwiseSuggestion["details"]) {
  const treatment = [
    textFrom(details?.treatment),
    textFrom(details?.prevention),
    textFrom(details?.biological_treatment),
    textFrom(details?.chemical_treatment)
  ]
    .filter(Boolean)
    .join(" ");

  return treatment || "Take clear follow-up photos, isolate badly affected plants where possible, and confirm treatment with an extension officer before applying chemicals.";
}

function mapKindwiseResult(data: KindwiseResponse): CropHealthResult {
  const suggestions = data.result?.disease?.suggestions ?? [];
  const topSuggestion = suggestions[0];
  const probability = topSuggestion?.probability ?? 0;
  const confidence = Math.round(probability * 100);
  const healthyProbability = data.result?.is_healthy?.probability ?? 0;
  const isHealthy = Boolean(data.result?.is_healthy?.binary) || (!topSuggestion && healthyProbability >= 0.65);
  const lowConfidence = !isHealthy && confidence > 0 && confidence < 45;

  if (isHealthy || !topSuggestion) {
    return {
      possibleIssue: "No clear crop disease detected",
      confidence: Math.round(healthyProbability * 100) || confidence,
      symptoms: "The image did not return a strong disease match.",
      recommendedAction:
        "Continue monitoring the crop, take another close-up photo if symptoms develop, and confirm field concerns with an agricultural extension officer.",
      severity: "Low",
      disclaimer: cropHealthDisclaimer,
      provider: "crop.health",
      noDiseaseDetected: true,
      lowConfidence: confidence > 0 && confidence < 45
    };
  }

  return {
    possibleIssue: topSuggestion.name ?? "Possible crop health issue",
    confidence,
    symptoms: textFrom(topSuggestion.details?.symptoms) || textFrom(topSuggestion.details?.description) || "Symptoms were not provided by the diagnosis API.",
    recommendedAction: treatmentFrom(topSuggestion.details),
    severity: topSuggestion.details?.severity ?? (confidence >= 75 ? "Likely issue" : "Needs confirmation"),
    disclaimer: cropHealthDisclaimer,
    provider: "crop.health",
    lowConfidence
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!checkUsage(request)) {
    return NextResponse.json(
      { error: "Daily crop health check limit reached. Please try again tomorrow or contact Ghana Growers for support." },
      { status: 429 }
    );
  }

  const formData = await request.formData().catch(() => undefined);
  const file = formData?.get("photo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Crop photo is required." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Upload a JPG, PNG, or WEBP crop image." }, { status: 400 });
  }

  if (file.size > maxSize) {
    return NextResponse.json({ error: "Crop image must be 5MB or smaller." }, { status: 400 });
  }

  const apiKey = process.env.CROP_HEALTH_API_KEY;

  if (!apiKey) {
    const result = await mockAnalyzeCropImage(file.name);
    return NextResponse.json({
      ...result,
      provider: "mock",
      integrationReady: true
    });
  }

  const imageBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const endpoint = new URL("https://crop.kindwise.com/api/v1/identification");
  endpoint.searchParams.set("details", "description,symptoms,treatment,prevention,biological_treatment,chemical_treatment,taxonomy,wiki_url");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ images: [imageBase64] })
  }).catch(() => null);

  const data = (await response?.json().catch(() => null)) as KindwiseResponse | null;

  if (!response?.ok || !data) {
    return NextResponse.json(
      { error: data?.message ?? "Crop Health API request failed. Please try again with a clear photo." },
      { status: response?.status ?? 502 }
    );
  }

  return NextResponse.json(mapKindwiseResult(data));
}
