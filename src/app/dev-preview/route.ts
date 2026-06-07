import { NextResponse, type NextRequest } from "next/server";

const PREVIEW_COOKIE = "ghana_growers_dev_preview";

export function GET(request: NextRequest) {
  const url = new URL(request.url);
  const exitPreview = url.searchParams.get("exit") === "1";
  const destination = new URL(exitPreview ? "/launching-soon" : "/", request.url);
  const response = NextResponse.redirect(destination);

  if (exitPreview) {
    response.cookies.delete(PREVIEW_COOKIE);
  } else {
    response.cookies.set(PREVIEW_COOKIE, "enabled", {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: "/",
      sameSite: "lax",
      secure: url.protocol === "https:"
    });
  }

  return response;
}
