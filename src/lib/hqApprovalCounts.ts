import { createHmac, timingSafeEqual } from "node:crypto";

export const hqApprovalCountsPath = "/api/integrations/hq/approval-counts";
export const hqSignatureMaxAgeMs = 5 * 60 * 1000;
export const hqApprovalCountsTimeoutMs = 4_000;
export const hqNonceLength = 36;

const hqNoncePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type HqApprovalMetricName =
  | "farmerProfileApplicationsPending"
  | "importedFarmersPendingReview"
  | "supplierApplicationsPending";

export type HqSourceAvailability = "available" | "unavailable";

export type HqApprovalCountsResponse = {
  farmerProfileApplicationsPending: number | null;
  importedFarmersPendingReview: number | null;
  supplierApplicationsPending: number | null;
  generatedAt: string;
  availability: Record<HqApprovalMetricName, HqSourceAvailability>;
};

export type HqApprovalCountSources = Record<
  HqApprovalMetricName,
  (signal: AbortSignal) => Promise<number>
>;

export type HqNonceConsumer = (
  nonce: string,
  expiresAt: string,
  signal?: AbortSignal
) => Promise<boolean>;

export function isValidHqNonce(nonce?: string | null): nonce is string {
  return typeof nonce === "string" && nonce.length === hqNonceLength && hqNoncePattern.test(nonce);
}

export function hqSignaturePayload(method: string, requestPath: string, timestamp: string, nonce: string) {
  return [method.toUpperCase(), requestPath, timestamp, nonce].join("\n");
}

export function createHqIntegrationSignature({
  method,
  requestPath,
  timestamp,
  nonce,
  secret
}: {
  method: string;
  requestPath: string;
  timestamp: string;
  nonce: string;
  secret: string;
}) {
  return createHmac("sha256", secret)
    .update(hqSignaturePayload(method, requestPath, timestamp, nonce))
    .digest("hex");
}

function safeHexEqual(received: string, expected: string) {
  if (!/^[a-f0-9]{64}$/i.test(received) || !/^[a-f0-9]{64}$/i.test(expected)) {
    return false;
  }

  const receivedBuffer = Buffer.from(received, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function verifyHqIntegrationRequest({
  method,
  requestPath,
  timestamp,
  nonce,
  signature,
  secret,
  nowMs = Date.now()
}: {
  method: string;
  requestPath: string;
  timestamp?: string | null;
  nonce?: string | null;
  signature?: string | null;
  secret: string;
  nowMs?: number;
}) {
  if (secret.length < 32 || !timestamp || !isValidHqNonce(nonce) || !signature || !/^\d{10}$/.test(timestamp)) {
    return false;
  }

  const timestampMs = Number(timestamp) * 1000;

  if (!Number.isSafeInteger(timestampMs) || Math.abs(nowMs - timestampMs) > hqSignatureMaxAgeMs) {
    return false;
  }

  const expected = createHqIntegrationSignature({ method, requestPath, timestamp, nonce, secret });
  return safeHexEqual(signature, expected);
}

export async function consumeHqIntegrationNonce({
  nonce,
  timestamp,
  consume,
  signal
}: {
  nonce: string;
  timestamp: string;
  consume: HqNonceConsumer;
  signal?: AbortSignal;
}) {
  const expiresAt = new Date((Number(timestamp) * 1000) + hqSignatureMaxAgeMs).toISOString();
  return consume(nonce, expiresAt, signal);
}

function validCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export async function collectHqApprovalCounts(
  sources: HqApprovalCountSources,
  {
    timeoutMs = hqApprovalCountsTimeoutMs,
    now = () => new Date()
  }: {
    timeoutMs?: number;
    now?: () => Date;
  } = {}
): Promise<{ response: HqApprovalCountsResponse; completeFailure: boolean }> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("Approval count source timed out."));
    }, Math.max(1, timeoutMs));
  });

  const metricNames: HqApprovalMetricName[] = [
    "farmerProfileApplicationsPending",
    "importedFarmersPendingReview",
    "supplierApplicationsPending"
  ];

  try {
    const settled = await Promise.allSettled(
      metricNames.map((metricName) => Promise.race([sources[metricName](controller.signal), timeout]))
    );
    const counts = Object.fromEntries(
      metricNames.map((metricName, index) => {
        const result = settled[index];
        return [metricName, result.status === "fulfilled" && validCount(result.value) ? result.value : null];
      })
    ) as Record<HqApprovalMetricName, number | null>;
    const availability = Object.fromEntries(
      metricNames.map((metricName) => [metricName, counts[metricName] === null ? "unavailable" : "available"])
    ) as Record<HqApprovalMetricName, HqSourceAvailability>;
    const completeFailure = metricNames.every((metricName) => availability[metricName] === "unavailable");

    return {
      response: {
        farmerProfileApplicationsPending: counts.farmerProfileApplicationsPending,
        importedFarmersPendingReview: counts.importedFarmersPendingReview,
        supplierApplicationsPending: counts.supplierApplicationsPending,
        generatedAt: now().toISOString(),
        availability
      },
      completeFailure
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
