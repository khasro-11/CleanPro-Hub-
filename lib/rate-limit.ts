const requests = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10;

export function rateLimit(identifier: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = requests.get(identifier);

  if (!entry || now > entry.resetAt) {
    requests.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { ok: false, remaining: 0 };
  }

  entry.count += 1;
  return { ok: true, remaining: MAX_REQUESTS - entry.count };
}
