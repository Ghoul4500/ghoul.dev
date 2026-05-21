import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getCachedStats } from './github.ts';
import { ensureBootstrap } from '../lib/status/bootstrap.ts';
import { load as loadStatus } from '../lib/status/store.ts';
import { derive as deriveStatus } from '../lib/status/derive.ts';

ensureBootstrap();

export const app = new Hono().basePath('/api');

app.use('*', logger());
app.use('*', cors({ origin: '*' }));

app.get('/health', (c) => c.json({ ok: true, service: 'ghoul.dev', t: Date.now() }));

app.get('/github/stats', async (c) => {
  try {
    const stats = await getCachedStats();
    // s-maxage tells Cloudflare to cache 30min at its edge; stale-while-
    // revalidate keeps serving stale for up to 24h while CF silently refreshes
    // in the background. Pair with a CF Cache Rule for /api/github/stats.
    c.header('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    return c.json(stats);
  } catch (err: any) {
    return c.json({ error: err?.message ?? 'upstream error' }, 502);
  }
});

app.get('/status', async (c) => {
  const store = await loadStatus();
  const state = deriveStatus(store);
  c.header('Cache-Control', 'no-store');
  return c.json(state);
});

app.get('/now', (c) => {
  const now = new Date();
  const utc = now.toISOString();
  const local = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Indian/Maldives',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
  return c.json({ utc, local_mv: local, tz: 'Indian/Maldives' });
});

app.notFound((c) => c.json({ error: 'not found' }, 404));
