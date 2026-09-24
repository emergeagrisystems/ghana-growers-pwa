const MESSAGE_LIMIT = 800;
const WINDOW_MS = 60 * 1000;
const DAILY_MS = 24 * 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 6;
const MAX_REQUESTS_PER_DAY = 30;

type UsageBucket = {
  windowStartedAt: number;
  windowCount: number;
  dayStartedAt: number;
  dayCount: number;
};

const usageBuckets = new Map<string, UsageBucket>();

function cleanIdentifier(value: string) {
  return value.replace(/[^a-zA-Z0-9:._-]/g, "").slice(0, 120);
}

export function getAssistantClientId(request: Request, sessionId?: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const vercelIp = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || vercelIp || realIp || "unknown-ip";
  const session = typeof sessionId === "string" && sessionId.trim() ? sessionId.trim() : "anonymous-session";

  return `${cleanIdentifier(ip)}:${cleanIdentifier(session)}`;
}

export function validateAssistantQuestion(question: string) {
  if (!question) {
    return "Please enter a farming question first.";
  }

  if (question.length > MESSAGE_LIMIT) {
    return `Please keep your question under ${MESSAGE_LIMIT} characters so the assistant can respond clearly.`;
  }

  return undefined;
}

export function checkAssistantUsageLimit(clientId: string, now = Date.now()) {
  const existing = usageBuckets.get(clientId);
  const bucket: UsageBucket = existing ?? {
    windowStartedAt: now,
    windowCount: 0,
    dayStartedAt: now,
    dayCount: 0
  };

  if (now - bucket.windowStartedAt >= WINDOW_MS) {
    bucket.windowStartedAt = now;
    bucket.windowCount = 0;
  }

  if (now - bucket.dayStartedAt >= DAILY_MS) {
    bucket.dayStartedAt = now;
    bucket.dayCount = 0;
  }

  if (bucket.windowCount >= MAX_REQUESTS_PER_WINDOW) {
    usageBuckets.set(clientId, bucket);
    return {
      ok: false,
      status: 429,
      retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - bucket.windowStartedAt)) / 1000)),
      error: "You have sent several questions quickly. Please wait a minute before asking again."
    };
  }

  if (bucket.dayCount >= MAX_REQUESTS_PER_DAY) {
    usageBuckets.set(clientId, bucket);
    return {
      ok: false,
      status: 429,
      retryAfterSeconds: Math.max(60, Math.ceil((DAILY_MS - (now - bucket.dayStartedAt)) / 1000)),
      error: "You have reached today's Farm Help Assistant limit. Please try again tomorrow, or contact Ghana Growers on WhatsApp for urgent support."
    };
  }

  bucket.windowCount += 1;
  bucket.dayCount += 1;
  usageBuckets.set(clientId, bucket);

  return {
    ok: true,
    remainingToday: Math.max(0, MAX_REQUESTS_PER_DAY - bucket.dayCount)
  };
}

export const assistantUsageLimits = {
  messageLimit: MESSAGE_LIMIT,
  maxRequestsPerWindow: MAX_REQUESTS_PER_WINDOW,
  windowSeconds: WINDOW_MS / 1000,
  maxRequestsPerDay: MAX_REQUESTS_PER_DAY
};
