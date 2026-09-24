// Legacy tools do not meet the RC1 disclosure, timeout and operational gates.
// Keep their implementations for future review without exposing side effects.
export function legacyFarmToolGate(): Response | null {
  return Response.json({
    ok: false,
    error: "This legacy tool is unavailable. Use Ask Mama G or Crop Doctor from the Farmer Hub.",
    message: "This legacy tool is unavailable. Use Ask Mama G or Crop Doctor from the Farmer Hub.",
    href: "/farmer-hub"
  }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
