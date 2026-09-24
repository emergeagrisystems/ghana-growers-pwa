import { createHash } from "node:crypto";

const REPLAY_TTL_MS = 10 * 60_000;
const MAX_REPLAYS = 256;
const requests = new Map<string, { expires: number; result: Promise<Response> }>();
const activeDevices = new Set<string>();

export function farmMateRequestKey(device: string, tool: string, requestId: string) {
  return createHash("sha256").update(`${device}:${tool}:${requestId}`).digest("hex");
}

// Supplement to durable credit/continuation enforcement, scoped to this server
// instance only. No claim of cross-instance or durable exactly-once execution.
export async function replayFarmMateRequest(
  key: string,
  deviceKey: string,
  operation: () => Promise<Response>
): Promise<Response> {
  const now = Date.now();
  requests.forEach((entry, savedKey) => { if (entry.expires < now) requests.delete(savedKey); });
  const existing = requests.get(key);
  if (existing) return (await existing.result).clone();
  if (activeDevices.has(deviceKey)) {
    return Response.json({ ok: false, reason: "request_in_progress", message: "A check is already in progress. Wait for it to finish before starting another." }, { status: 409 });
  }
  if (requests.size >= MAX_REPLAYS) {
    return Response.json({ ok: false, reason: "temporarily_unavailable", message: "The service is busy. Please try again shortly." }, { status: 503 });
  }
  activeDevices.add(deviceKey);
  const result = Promise.resolve().then(operation).catch(() => Response.json({
    ok: false,
    reason: "request_outcome_unknown",
    message: "The check could not be confirmed. No answer or diagnosis is available."
  }, { status: 503 })).finally(() => activeDevices.delete(deviceKey));
  requests.set(key, { expires: now + REPLAY_TTL_MS, result });
  return (await result).clone();
}
