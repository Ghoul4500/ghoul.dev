import { startScheduler } from './scheduler.ts';
import { startTelegramListener } from './telegram.ts';

declare global {
  // eslint-disable-next-line no-var
  var __statusBootstrapped: boolean | undefined;
}

/**
 * Idempotent boot. Survives HMR / multiple route imports — only the first
 * call actually starts the scheduler and Telegram listener.
 */
export function ensureBootstrap(): void {
  if (globalThis.__statusBootstrapped) return;
  globalThis.__statusBootstrapped = true;
  startScheduler();
  startTelegramListener();
  console.log('[status] bootstrap complete');
}
