// One worldwide instant. This module has no release, routing or configuration side effects.
export const LAUNCH_INSTANT = "2026-12-04T05:00:00Z";
export const LAUNCH_FALLBACK = "Launching 4 December 2026 · 5:00 AM Ghana time";
export const LAUNCH_TIMESTAMP = Date.parse(LAUNCH_INSTANT);

export function launchCountdown(now: number) {
  const secondsLeft = Math.max(0, Math.ceil((LAUNCH_TIMESTAMP - now) / 1000));
  return {
    days: Math.floor(secondsLeft / 86400),
    hours: Math.floor((secondsLeft % 86400) / 3600),
    minutes: Math.floor((secondsLeft % 3600) / 60),
    seconds: secondsLeft % 60,
    reached: secondsLeft === 0
  };
}
