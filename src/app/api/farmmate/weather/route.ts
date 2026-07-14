import { NextResponse } from "next/server";
import { FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE, getFarmMateWeatherForecast, validateFarmMateWeatherRequest } from "@/lib/farmmate/weather";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locationKey = url.searchParams.get("locationKey") ?? undefined;
  const latitude = url.searchParams.get("latitude") ?? undefined;
  const longitude = url.searchParams.get("longitude") ?? undefined;
  const label = url.searchParams.get("label") ?? undefined;
  const validation = validateFarmMateWeatherRequest({ locationKey, latitude, longitude, label });

  if (!validation.ok) {
    return NextResponse.json({ ok: false, message: validation.message }, { status: validation.status });
  }

  const result = await getFarmMateWeatherForecast(
    locationKey
      ? {
          locationKey
        }
      : {
          latitude: Number(latitude),
          longitude: Number(longitude),
          label
        }
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: result.message || FARM_MATE_WEATHER_UNAVAILABLE_MESSAGE
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    ok: true,
    forecast: result.forecast
  });
}
