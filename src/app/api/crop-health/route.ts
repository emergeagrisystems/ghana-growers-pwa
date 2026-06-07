import { NextResponse } from "next/server";
import { mockAnalyzeCropImage } from "@/lib/cropHealth";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => undefined);
  const file = formData?.get("photo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Crop photo is required." }, { status: 400 });
  }

  // Future integration point for Plant.id, Crop.health, Plantix, or another crop disease API.
  // Send file bytes from this server route, using provider credentials stored in environment variables.
  const result = await mockAnalyzeCropImage(file.name);

  return NextResponse.json({
    ...result,
    provider: "mock",
    integrationReady: true
  });
}
