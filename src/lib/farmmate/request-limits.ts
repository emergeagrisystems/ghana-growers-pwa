// The browser allows time for credit checks and the bounded model request.
export const FARM_MATE_TEXT_TIMEOUT_MS = 20_000;
export const FARM_MATE_VISION_TIMEOUT_MS = 25_000;
export const FARM_MATE_BROWSER_TIMEOUT_MS = 45_000;

export class FarmMateRequestTimeout extends Error {
  constructor() {
    super("The request exceeded its time limit.");
    this.name = "FarmMateRequestTimeout";
  }
}

// Covers both response headers and body. The explicit race also bounds a stalled
// dependency that ignores AbortSignal; its late result is never returned.
export async function boundedJsonRequest<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  fetcher: typeof fetch = fetch
): Promise<{ response: Response; data: T }> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetcher(input, { ...init, signal: controller.signal });
        const data = (await response.json()) as T;
        return { response, data };
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new FarmMateRequestTimeout());
        }, timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// A ref-held gate closes synchronously, before React can render a disabled button.
export function createFarmMateRequestGate() {
  let active = 0;
  let generation = 0;
  return {
    start() {
      if (active) return null;
      active = ++generation;
      return active;
    },
    isCurrent(token: number) { return active === token; },
    finish(token: number) { if (active === token) active = 0; },
    invalidate() { active = 0; generation += 1; }
  };
}
