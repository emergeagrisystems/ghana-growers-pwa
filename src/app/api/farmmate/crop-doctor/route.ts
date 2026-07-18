import { NextResponse } from "next/server";
import { analyzeCropDoctorImageWithOpenAI } from "@/lib/farmmate/ai";
import {
  CROP_DOCTOR_FALLBACK_MESSAGE,
  CROP_DOCTOR_SUPPORTED_CROPS,
  CROP_DOCTOR_SYMPTOMS,
  validateCropDoctorImage
} from "@/lib/farmmate/crop-doctor-vision";
import { cropDoctorCreditMessage, CROP_DOCTOR_TEMPORARILY_LIMITED_MESSAGE } from "@/lib/farmmate/usage";
import { checkFarmMateCreditsForDevice, getFarmMateCreditsForDevice, recordFarmMateUsageForDevice } from "@/lib/farmmate/usage/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ ok: false, reason: "invalid_form_data", message: "Please upload a crop image." }, { status: 400 });
  }

  const image = formData.get("image");
  const anonymousDeviceId = formData.get("anonymousDeviceId");
  const selectedCrop = typeof formData.get("selectedCrop") === "string" ? String(formData.get("selectedCrop")).trim() : "";
  const selectedSymptom = typeof formData.get("selectedSymptom") === "string" ? String(formData.get("selectedSymptom")).trim() : "";

  if (!(image instanceof File)) {
    return NextResponse.json({ ok: false, reason: "missing_image", message: "Please upload a crop image." }, { status: 400 });
  }

  if (!CROP_DOCTOR_SUPPORTED_CROPS.includes(selectedCrop as (typeof CROP_DOCTOR_SUPPORTED_CROPS)[number])) {
    return NextResponse.json({ ok: false, reason: "missing_crop", message: "Please select the crop before analysing the photo." }, { status: 400 });
  }

  const cleanSelectedSymptom = CROP_DOCTOR_SYMPTOMS.includes(selectedSymptom as (typeof CROP_DOCTOR_SYMPTOMS)[number])
    ? selectedSymptom
    : "";

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
        message: cropDoctorCreditMessage(creditDecision)
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
        message: CROP_DOCTOR_FALLBACK_MESSAGE
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
        message: CROP_DOCTOR_TEMPORARILY_LIMITED_MESSAGE
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
