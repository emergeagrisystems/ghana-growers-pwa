import { NextResponse } from "next/server";
import { analyzeCropDoctorImageWithOpenAI } from "@/lib/farmmate/ai";
import {
  CROP_DOCTOR_FALLBACK_MESSAGE,
  validateCropDoctorImage
} from "@/lib/farmmate/crop-doctor-vision";
import { checkFarmMateCreditsForDevice, getFarmMateCreditsForDevice, recordFarmMateUsageForDevice } from "@/lib/farmmate/usage/server";

export const dynamic = "force-dynamic";

function creditMessage(decision: Awaited<ReturnType<typeof checkFarmMateCreditsForDevice>>) {
  if (decision.reason === "usage_tracking_unavailable") {
    return "Crop Doctor is temporarily limited, but you can still use the other FarmMate tools.";
  }

  if (decision.reason === "rapid_submission") {
    return "FarmMate is still checking your last photo. Please wait a few seconds before trying again.";
  }

  return `You've used your free Crop Doctor checks for now. Your credits refresh in ${decision.refreshInText}.`;
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ ok: false, reason: "invalid_form_data", message: "Please upload a crop image." }, { status: 400 });
  }

  const image = formData.get("image");
  const anonymousDeviceId = formData.get("anonymousDeviceId");

  if (!(image instanceof File)) {
    return NextResponse.json({ ok: false, reason: "missing_image", message: "Please upload a crop image." }, { status: 400 });
  }

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
        message: creditMessage(creditDecision)
      },
      { status: creditDecision.reason === "usage_tracking_unavailable" ? 503 : 429 }
    );
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const result = await analyzeCropDoctorImageWithOpenAI({
    mimeType: image.type,
    base64Image: buffer.toString("base64")
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
        credits,
        message: "Crop Doctor is temporarily limited, but you can still use the other FarmMate tools."
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
