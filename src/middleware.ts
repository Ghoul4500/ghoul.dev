import type { MiddlewareHandler } from 'astro';
import { ensureBootstrap } from './lib/status/bootstrap.ts';

// Side effect at module load: middleware is bundled into the Astro server
// entry, so this fires once at process boot — before any request lands.
// Without this, bootstrap was lazy (only ran when /status or an /api route
// was hit), so a freshly-restarted process would silently skip starting the
// status scheduler and Telegram listener until the first SSR request came in.
ensureBootstrap();

export const onRequest: MiddlewareHandler = (_ctx, next) => next();
