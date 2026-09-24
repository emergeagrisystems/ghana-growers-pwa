import { NextResponse } from "next/server";
import { mamaGPublicText } from "@/lib/farmmate/public-name";
import { createHash } from "node:crypto";
import { farmMateRequestKey, replayFarmMateRequest } from "@/lib/farmmate/request-replay";
import { analyzeCropDoctorImageWithOpenAI } from "@/lib/farmmate/ai";
import {
  CROP_DOCTOR_FALLBACK_MESSAGE,
  CROP_DOCTOR_SYMPTOMS,
  normalizeCropDoctorSelectedCrop,
  validateCropDoctorImage
} from "@/lib/farmmate/crop-doctor-vision";
import { cropDoctorCreditMessage, CROP_DOCTOR_TEMPORARILY_LIMITED_MESSAGE } from "@/lib/farmmate/usage";
import { checkFarmMateCreditsForDevice, getFarmMateCreditsForDevice, recordFarmMateUsageForDevice } from "@/lib/farmmate/usage/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ ok: false, reason: "invalid_form_data", message: "Please upload a crop image." }, { status: 400 });
  }

  const image = formData.get("image");
  const anonymousDeviceId = formData.get("anonymousDeviceId");
  const selectedCrop = normalizeCropDoctorSelectedCrop(formData.get("selectedCrop"));
  const selectedSymptom = typeof formData.get("selectedSymptom") === "string" ? String(formData.get("selectedSymptom")).trim() : "";
  const requestId = formData.get("requestId");

  if (!(image instanceof File)) {
    return NextResponse.json({ ok: false, reason: "missing_image", message: "Please upload a crop image." }, { status: 400 });
  }

  if (typeof anonymousDeviceId !== "string" || !anonymousDeviceId.trim() || (requestId !== null && (typeof requestId !== "string" || !/^[a-z0-9-]{12,100}$/i.test(requestId)))) {
    return NextResponse.json({ ok: false, reason: "invalid_request", message: "Choose a crop photo and start a new check." }, { status: 400 });
  }

  const validation = validateCropDoctorImage({ type: image.type, size: image.size });
  if (!validation.ok) {
    return NextResponse.json({ ok: false, reason: validation.reason, message: validation.message }, { status: validation.reason === "file_too_large" ? 413 : 400 });
  }
  // Older clients lack a request ID. Bind their replay key to the actual image
  // bytes and context, not its filename. The image itself is not cached here.
  const replayId = requestId ?? createHash("sha256").update(Buffer.from(await image.arrayBuffer())).update(`${selectedCrop}:${selectedSymptom}`).digest("hex");

  return replayFarmMateRequest(
    farmMateRequestKey(anonymousDeviceId, "crop_doctor", replayId),
    farmMateRequestKey(anonymousDeviceId, "crop_doctor", "active"),
    () => processCropImage(image, anonymousDeviceId, selectedCrop, selectedSymptom)
  );
}

async function processCropImage(image: File, anonymousDeviceId: string, selectedCrop: string, selectedSymptom: string) {

  const cleanSelectedSymptom = CROP_DOCTOR_SYMPTOMS.includes(selectedSymptom as (typeof CROP_DOCTOR_SYMPTOMS)[number])
    ? selectedSymptom
    : "Not sure";

  const imageValidation = validateCropDoctorImage({ type: image.type, size: image.size });

  if (!imageValidation.ok) {
    return NextResponse.json(
      { ok: false, reason: imageValidation.reason, message: imageValidation.message },
      { status: imageValidation.reason === "file_too_large" ? 413 : 400 }
    );
  }

  const creditDecision = await checkFarmMateCreditsForDevice({
    anonymousDeviceId,
    tool: "crop_doctor"
  });

  if (!creditDecision.allowed) {
    return NextResponse.json(
      {
        ok: false,
        reason: creditDecision.reason,
        credits: creditDecision,
        message: mamaGPublicText(cropDoctorCreditMessage(creditDecision))
      },
      { status: creditDecision.reason === "usage_tracking_unavailable" ? 503 : 429 }
    );
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const result = await analyzeCropDoctorImageWithOpenAI({
    mimeType: image.type,
    base64Image: buffer.toString("base64"),
    selectedCrop,
    selectedSymptom: cleanSelectedSymptom || null
  });

  if (!result.ok) {
    const credits = await getFarmMateCreditsForDevice({
      anonymousDeviceId,
      tool: "crop_doctor"
    });

    return NextResponse.json(
      {
        ...result,
        credits,
        message: mamaGPublicText(CROP_DOCTOR_FALLBACK_MESSAGE)
      },
      { status: 503 }
    );
  }

  const record = await recordFarmMateUsageForDevice({
    anonymousDeviceId,
    tool: "crop_doctor"
  });

  const credits = await getFarmMateCreditsForDevice({
    anonymousDeviceId,
    tool: "crop_doctor"
  });

  if (!record.recorded) {
    return NextResponse.json(
      {
        ok: false,
        reason: "usage_tracking_unavailable",
        fallback: true,
        credits: {
          ...credits,
          remaining: 0,
          isExhausted: true,
          creditState: "temporarily_unavailable"
        },
        message: mamaGPublicText(CROP_DOCTOR_TEMPORARILY_LIMITED_MESSAGE)
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    result: result.result,
    credits,
    usageRecorded: true
  });
}
