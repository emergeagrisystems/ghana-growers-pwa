import { createFarmMateConsultationId, isValidFarmMateConsultationId } from "../consultation";

const STORAGE_KEY = "gg-farmmate-ask-recovery-v1";
const WINDOW_MS = 6 * 60 * 60 * 1_000;
type SavedAttempt = { digest: string; consultationId: string; createdAt: number };

async function questionDigest(question: string) {
  const bytes = new TextEncoder().encode(question.trim());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function readAttempts(): SavedAttempt[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SavedAttempt =>
      item && typeof item.digest === "string" && /^[0-9a-f]{64}$/.test(item.digest) &&
      isValidFarmMateConsultationId(item.consultationId) &&
      typeof item.createdAt === "number" && Date.now() - item.createdAt < WINDOW_MS &&
      item.createdAt <= Date.now()
    ).slice(-5);
  } catch {
    return [];
  }
}

function saveAttempts(attempts: SavedAttempt[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts.slice(-5)));
  } catch {
    // The server still enforces quota and duplicate protection if storage is blocked.
  }
}

export async function recoverOrCreateConsultationId(question: string) {
  try {
    const digest = await questionDigest(question);
    const attempts = readAttempts();
    const existing = attempts.find((attempt) => attempt.digest === digest);
    if (existing) return existing.consultationId;
    const consultationId = createFarmMateConsultationId(crypto.randomUUID());
    saveAttempts([...attempts, { digest, consultationId, createdAt: Date.now() }]);
    return consultationId;
  } catch {
    return createFarmMateConsultationId(crypto.randomUUID());
  }
}

export function clearRecoveredConsultation(consultationId: string) {
  saveAttempts(readAttempts().filter((attempt) => attempt.consultationId !== consultationId));
}
