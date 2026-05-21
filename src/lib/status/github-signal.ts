/**
 * Lightweight check: has the user pushed commits to ANY repo recently?
 *
 * Second signal for "presumed dead" — paired with Telegram silence so the page
 * doesn't go RIP just because the meme bot is being ignored.
 *
 * When a GITHUB_TOKEN is present we:
 *   1. Resolve the token's own login via /user (cached 1h) — no need for a
 *      separate username env var.
 *   2. Hit /users/{login}/events (authed) which includes PushEvents from
 *      private repos too. Without the token we fall back to /events/public.
 *
 * Short in-memory TTL keeps the scheduler tick cheap and within rate limits.
 */

const EVENTS_TTL_MS = 5 * 60 * 1000;
const LOGIN_TTL_MS = 60 * 60 * 1000;

type EventsCache = { fetchedAt: number; lastPushAt: number | null };
type LoginCache = { fetchedAt: number; login: string | null };

let eventsCache: EventsCache | null = null;
let loginCache: LoginCache | null = null;

function getToken(): string | undefined {
  const fromImport = (import.meta as any).env?.GITHUB_TOKEN;
  if (typeof fromImport === 'string' && fromImport.length > 0) return fromImport;
  return typeof process !== 'undefined' ? process.env?.GITHUB_TOKEN : undefined;
}

async function resolveLogin(token: string, now: number): Promise<string | null> {
  if (loginCache && now - loginCache.fetchedAt < LOGIN_TTL_MS) return loginCache.login;
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        'User-Agent': 'ghoul.dev-status',
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      loginCache = { fetchedAt: now, login: null };
      return null;
    }
    const data = (await res.json()) as { login?: string };
    loginCache = { fetchedAt: now, login: data.login ?? null };
    return data.login ?? null;
  } catch {
    loginCache = { fetchedAt: now, login: null };
    return null;
  }
}

async function fetchLastPushTimestamp(now: number): Promise<number | null> {
  const token = getToken();
  const fallbackUser = process.env.STATUS_GITHUB_USER || 'Ghoul4500';

  let user = fallbackUser;
  if (token) {
    const detected = await resolveLogin(token, now);
    if (detected) user = detected;
  }

  const endpoint = token
    ? `https://api.github.com/users/${user}/events?per_page=30`
    : `https://api.github.com/users/${user}/events/public?per_page=30`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': 'ghoul.dev-status',
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
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
  if (eventsCache && now - eventsCache.fetchedAt < EVENTS_TTL_MS) {
    return eventsCache.lastPushAt;
  }
  const ts = await fetchLastPushTimestamp(now);
  eventsCache = { fetchedAt: now, lastPushAt: ts };
  return ts;
}

/**
 * True if the user has pushed commits within the last `windowHours` hours
 * (public OR private when a token is configured). Network failures default
 * to `true` to avoid false-positive RIP escalations on transient flakes.
 */
export async function hasRecentCommits(windowHours = 96): Promise<boolean> {
  const now = Date.now();
  const ts = await getLastPushTimestamp(now);
  if (ts === null) return true;
  return now - ts < windowHours * 3_600_000;
}
