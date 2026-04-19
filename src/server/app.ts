import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getGitHubStats } from './github.ts';

export const app = new Hono().basePath('/api');

app.use('*', logger());
app.use('*', cors({ origin: '*' }));

app.get('/health', (c) => c.json({ ok: true, service: 'ghoul.dev', t: Date.now() }));

app.get('/github/stats', async (c) => {
  try {
    const stats = await getGitHubStats();
    c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return c.json(stats);
  } catch (err: any) {
    return c.json({ error: err?.message ?? 'upstream error' }, 502);
  }
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
