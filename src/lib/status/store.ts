import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Store, Incident } from './types.ts';

const DATA_DIR = process.env.STATUS_DATA_DIR || join(process.cwd(), 'data');
const STORE_FILE = join(DATA_DIR, 'status.json');
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

let writeChain: Promise<unknown> = Promise.resolve();

export async function load(): Promise<Store> {
  try {
    const txt = await readFile(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(txt) as Partial<Store>;
    const incidents = (parsed.incidents ?? []).map(normalize);
    return { incidents };
  } catch {
    return { incidents: [] };
  }
}

function normalize(raw: any): Incident {
  return {
    ...raw,
    pending_prompt: raw.pending_prompt ?? null,
  };
}

function pruneOld(store: Store, now: number): Store {
  return {
    incidents: store.incidents.filter((i) => {
      if (i.resolved_at === null) return true;
      return now - Date.parse(i.resolved_at) < THIRTY_DAYS_MS;
    }),
  };
}

/**
 * Mutate the store via an updater. Writes are serialized so two near-simultaneous
 * commands (e.g. user fires /update while scheduler tick runs) can't tear the file.
 * Returns the resulting store.
 */
export function mutate(updater: (s: Store) => Store | Promise<Store>): Promise<Store> {
  const next = writeChain.then(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    const current = await load();
    const draft = structuredClone(current);
    const updated = await updater(draft);
    const pruned = pruneOld(updated, Date.now());
    await writeFile(STORE_FILE, JSON.stringify(pruned, null, 2));
    return pruned;
  });
  writeChain = next.catch(() => undefined);
  return next;
}

export function findActive(store: Store, type?: Incident['type']): Incident | undefined {
  return store.incidents.find(
    (i) => i.resolved_at === null && (type === undefined || i.type === type)
  );
}

export function findMostRecentActive(store: Store): Incident | undefined {
  const active = store.incidents.filter((i) => i.resolved_at === null);
  if (active.length === 0) return undefined;
  return active.reduce((a, b) =>
    Date.parse(a.started_at) > Date.parse(b.started_at) ? a : b
  );
}
