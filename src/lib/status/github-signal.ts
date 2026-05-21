/**
 * Lightweight check: has the user pushed commits to a public repo recently?
 *
 * Used as the second signal for "presumed dead" — we only flip an incident to
 * presumed_dead when both the Telegram channel AND the public commit channel
 * have been silent for the threshold window. Avoids the page going RIP when
 * the user is just heads-down working but ignoring the meme bot.
 *
 * Uses GitHub's public events feed (PushEvent only) with a short in-memory TTL
 * so the scheduler tick is cheap and rate-limit-safe.
 */

const USER = process.env.STATUS_GITHUB_USER || 'Ghoul4500';
const TTL_MS = 5 * 60 * 1000;

type CacheEntry = { fetchedAt: number; lastPushAt: number | null };
let cache: CacheEntry | null = null;

function getToken(): string | undefined {
  const fromImport = (import.meta as any).env?.GITHUB_TOKEN;
  if (typeof fromImport === 'string' && fromImport.length > 0) return fromImport;
  return typeof process !== 'undefined' ? process.env?.GITHUB_TOKEN : undefined;
}

async function fetchLastPushTimestamp(): Promise<number | null> {
  const token = getToken();
  try {
    const res = await fetch(
      `https://api.github.com/users/${USER}/events/public?per_page=30`,
      {
        headers: {
          'User-Agent': 'ghoul.dev-status',
          Accept: 'application/vnd.github+json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    if (!res.ok) return null;
    const events = (await res.json()) as Array<{ type: string; created_at: string }>;
    const pushes = events.filter((e) => e.type === 'PushEvent');
    if (pushes.length === 0) return null;
    const newest = pushes
      .map((e) => Date.parse(e.created_at))
      .filter((t) => !Number.isNaN(t))
      .sort((a, b) => b - a)[0];
    return newest ?? null;
  } catch {
    return null;
  }
}

async function getLastPushTimestamp(now: number): Promise<number | null> {
  if (cache && now - cache.fetchedAt < TTL_MS) return cache.lastPushAt;
  const ts = await fetchLastPushTimestamp();
  cache = { fetchedAt: now, lastPushAt: ts };
  return ts;
}

/**
 * True if the user has pushed commits within the last `windowHours` hours.
 * Network failures default to `true` (safer: don't escalate to presumed-dead
 * on transient GitHub flakiness — the user can always be manually marked).
 */
export async function hasRecentCommits(windowHours = 96): Promise<boolean> {
  const now = Date.now();
  const ts = await getLastPushTimestamp(now);
  if (ts === null) return true;
  return now - ts < windowHours * 3_600_000;
}
