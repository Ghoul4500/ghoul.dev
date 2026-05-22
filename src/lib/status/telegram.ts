/**
 * Tiny Telegram bot listener — no library, raw long-polling over fetch.
 *
 * Authority model: a single allowlisted user ID (`TELEGRAM_ALLOWED_USER_ID`)
 * can issue commands. Everything else is silently ignored. No HTTP write
 * surface exists on the website itself; this bot is the only control channel.
 *
 * Commands:
 *   /sick     [since=DATE] [free text]
 *   /busy     [since=DATE] [free text]
 *   /cooked   [since=DATE] [free text]
 *   /grass    [since=DATE] [free text]
 *   /update   [phase=PHASE] free text
 *   /recovered [date=DATE] [free text]
 *   /extend   2d | 12h
 *   /back
 *   /status
 *
 * Free text (no slash) is interpreted as /update on the most recent active
 * incident, unless it contains a recovery keyword (better/back/fine/done/
 * recovered/alive/alright) in which case it becomes /recovered.
 */

import { load, mutate, findMostRecentActive } from './store.ts';
import { PRESETS, isIncidentType } from './presets.ts';
import { pickFallback } from './templates.ts';
import { derive } from './derive.ts';
import type { Incident, IncidentType, Phase, Store } from './types.ts';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_USER_ID = process.env.TELEGRAM_ALLOWED_USER_ID;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let listening = false;

export function startTelegramListener() {
  if (listening) return;
  if (!BOT_TOKEN) {
    console.log('[status telegram] TELEGRAM_BOT_TOKEN not set, listener disabled');
    return;
  }
  if (!ALLOWED_USER_ID) {
    console.log('[status telegram] TELEGRAM_ALLOWED_USER_ID not set, listener disabled');
    return;
  }
  listening = true;
  pollLoop().catch((err) => {
    listening = false;
    console.error('[status telegram] loop crashed:', err);
  });
}

export async function sendDm(text: string): Promise<void> {
  if (!BOT_TOKEN || !ALLOWED_USER_ID) {
    console.log('[status telegram] (no token) would DM:', text);
    return;
  }
  try {
    await fetch(`${API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ALLOWED_USER_ID,
        text,
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error('[status telegram] sendDm failed:', err);
  }
}

async function pollLoop() {
  let offset = 0;
  while (listening) {
    try {
      const res = await fetch(
        `${API}/getUpdates?offset=${offset}&timeout=30`,
        { signal: AbortSignal.timeout(35_000) }
      );
      if (!res.ok) {
        await sleep(5_000);
        continue;
      }
      const data = (await res.json()) as {
        ok: boolean;
        result: TelegramUpdate[];
      };
      if (!data.ok) {
        await sleep(5_000);
        continue;
      }
      for (const update of data.result) {
        offset = update.update_id + 1;
        try {
          await handleUpdate(update);
        } catch (err) {
          console.error('[status telegram] handler failed:', err);
        }
      }
    } catch {
      await sleep(5_000);
    }
  }
}

type TelegramUpdate = {
  update_id: number;
  message?: {
    text?: string;
    from?: { id: number };
    chat?: { id: number };
  };
};

async function handleUpdate(update: TelegramUpdate) {
  const msg = update.message;
  if (!msg || !msg.text) return;
  const fromId = String(msg.from?.id ?? '');
  if (fromId !== String(ALLOWED_USER_ID)) return;

  try {
    await dispatch(msg.text.trim());
  } catch (err: any) {
    await sendDm(`✗ ${err?.message ?? String(err)}`);
  }
}

async function dispatch(text: string) {
  if (text.startsWith('/')) {
    const space = text.indexOf(' ');
    const head = (space === -1 ? text : text.slice(0, space)).toLowerCase();
    const args = space === -1 ? '' : text.slice(space + 1).trim();
    const cmd = head.replace(/^\//, '').replace(/@\S+$/, '');
    return runCommand(cmd, args);
  }
  if (/\b(better|back|fine|done|recovered|alive|alright|good now)\b/i.test(text)) {
    return cmdRecovered(text);
  }
  return cmdUpdate(text);
}

async function runCommand(cmd: string, args: string) {
  if (isIncidentType(cmd === 'grass' ? 'touching-grass' : cmd)) {
    return cmdStart(cmd === 'grass' ? 'touching-grass' : (cmd as IncidentType), args);
  }
  switch (cmd) {
    case 'update':    return cmdUpdate(args);
    case 'recovered': return cmdRecovered(args);
    case 'extend':    return cmdExtend(args);
    case 'back':      return cmdBack();
    case 'status':    return cmdStatus();
    case 'help':      return cmdHelp();
    case 'start':     return cmdHelp();
    default:
      throw new Error(`unknown command: /${cmd}. try /help`);
  }
}

// ─── commands ────────────────────────────────────────────────────────────────

async function cmdStart(type: IncidentType, args: string) {
  const { tokens, rest } = extractTokens(args, ['since']);
  const since = parseDate(tokens.since);
  const text = rest.trim();
  const preset = PRESETS[type];

  await mutate(async (s) => {
    const existing = s.incidents.find(
      (i) => i.resolved_at === null && i.type === type
    );
    if (existing) {
      throw new Error(
        `already have an active ${type} incident since ${existing.started_at.slice(0, 16)}. ` +
          `use /update to add progress, /recovered to close, or /back to wipe`
      );
    }
    const now = new Date();
    const inc: Incident = {
      id: cryptoUUID(),
      type,
      started_at: since.toISOString(),
      resolved_at: null,
      presumed_dead: false,
      presumed_recovered: false,
      wellness_check_sent_at: null,
      auto_resolve_offset_hours: 0,
      fired_check_ins: [],
      impact: structuredClone(preset.impact),
      updates: [
        {
          at: now.toISOString(),
          phase: 'investigating',
          text: text || pickFallback(type, 'investigating'),
        },
      ],
      last_user_reply_at: now.toISOString(),
      pending_prompt: null,
    };
    s.incidents.push(inc);
    return s;
  });
  await sendDm(
    `✓ ${type} incident logged. ` +
      `auto-resolve in ${preset.auto_resolve_hours}h. ` +
      `i'll check in at: ${preset.check_ins.map((c) => `${c.after_hours}h`).join(', ') || 'never'}.`
  );
}

async function cmdUpdate(text: string) {
  const { tokens, rest } = extractTokens(text, ['phase']);
  const phase = (tokens.phase as Phase) || 'monitoring';
  const message = rest.trim();
  if (!message) throw new Error('update needs some text');

  let appliedType: string | undefined;
  await mutate(async (s) => {
    const active = findMostRecentActive(s);
    if (!active) {
      throw new Error('no active incident. start one with /sick, /busy, /cooked, /grass');
    }
    active.updates.push({
      at: new Date().toISOString(),
      phase,
      text: message,
    });
    touchUserActivity(s, Date.now());
    appliedType = active.type;
    return s;
  });
  await sendDm(`✓ update added to ${appliedType} incident`);
}

async function cmdRecovered(text: string) {
  const { tokens, rest } = extractTokens(text, ['date']);
  const at = tokens.date ? parseDate(tokens.date) : new Date();
  const message = rest.trim();

  let count = 0;
  await mutate(async (s) => {
    for (const inc of s.incidents) {
      if (inc.resolved_at !== null) continue;
      inc.resolved_at = at.toISOString();
      inc.presumed_dead = false;
      inc.updates.push({
        at: new Date().toISOString(),
        phase: 'resolved',
        text: message || 'User has returned. Cause of life unknown.',
      });
      count++;
    }
    touchUserActivity(s, Date.now());
    return s;
  });
  await sendDm(count > 0 ? `✓ ${count} incident(s) resolved` : 'nothing was active');
}

async function cmdExtend(args: string) {
  const m = /^(\d+)(d|h)$/i.exec(args.trim());
  if (!m) throw new Error('usage: /extend 2d  or  /extend 12h');
  const n = parseInt(m[1], 10);
  const hours = m[2].toLowerCase() === 'd' ? n * 24 : n;

  let affected: string | undefined;
  await mutate(async (s) => {
    const active = findMostRecentActive(s);
    if (!active) throw new Error('no active incident to extend');
    active.auto_resolve_offset_hours += hours;
    active.presumed_recovered = false;
    active.updates.push({
      at: new Date().toISOString(),
      phase: 'monitoring',
      text: `Window extended by ${hours}h. Still in progress.`,
    });
    touchUserActivity(s, Date.now());
    affected = active.type;
    return s;
  });
  await sendDm(`✓ ${affected} incident extended by ${hours}h`);
}

async function cmdBack() {
  let count = 0;
  await mutate(async (s) => {
    for (const inc of s.incidents) {
      if (inc.resolved_at !== null) continue;
      inc.resolved_at = new Date().toISOString();
      inc.presumed_dead = false;
      inc.updates.push({
        at: new Date().toISOString(),
        phase: 'resolved',
        text: 'Emergency clear. All services back.',
      });
      count++;
    }
    return s;
  });
  await sendDm(count > 0 ? `✓ ${count} incident(s) wiped` : 'nothing to wipe');
}

async function cmdStatus() {
  const s = await load();
  const state = derive(s);
  const lines: string[] = [];
  lines.push(`status: ${state.bannerTitle ?? 'OPERATIONAL'}`);
  lines.push(`summary: ${state.overallSummary}`);
  lines.push('');
  lines.push(`active incidents: ${state.activeIncidents.length}`);
  for (const inc of state.activeIncidents) {
    const ageH = Math.floor(
      (Date.now() - Date.parse(inc.started_at)) / 3_600_000
    );
    lines.push(
      `  · ${inc.type}  ${ageH}h old  ` +
        `${inc.fired_check_ins.length} check-in(s) fired` +
        (inc.presumed_recovered ? '  (presumed recovered)' : '') +
        (inc.wellness_check_sent_at ? '  ⚠ wellness check sent' : '') +
        (inc.presumed_dead ? '  💀 PRESUMED DEAD' : '')
    );
  }
  await sendDm(lines.join('\n'));
}

async function cmdHelp() {
  await sendDm(
    [
      'commands:',
      '/sick   [since=DATE] [text]',
      '/busy   [since=DATE] [text]',
      '/cooked [since=DATE] [text]',
      '/grass  [since=DATE] [text]',
      '/update [phase=PHASE] text',
      '/recovered [date=DATE] [text]',
      '/extend 2d | 12h',
      '/back   (wipe all active)',
      '/status (show current state)',
      '',
      'or just text — keyword "better/back/done/fine" closes,',
      'anything else is an /update on the latest active incident.',
      '',
      'DATE formats: 2026-05-18 | monday | yesterday | -3d | -12h',
    ].join('\n')
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function touchUserActivity(s: Store, now: number) {
  for (const inc of s.incidents) {
    if (inc.resolved_at !== null) continue;
    inc.last_user_reply_at = new Date(now).toISOString();
    inc.wellness_check_sent_at = null;
    if (inc.presumed_dead) {
      inc.presumed_dead = false;
      inc.updates.push({
        at: new Date(now).toISOString(),
        phase: 'resolved',
        text: 'User has returned. Cause of life unknown.',
      });
    }
  }
}

function extractTokens(
  input: string,
  names: string[]
): { tokens: Record<string, string>; rest: string } {
  const tokens: Record<string, string> = {};
  let rest = input;
  for (const name of names) {
    const re = new RegExp(`\\b${name}=(\\S+)`, 'i');
    const m = rest.match(re);
    if (m) {
      tokens[name] = m[1];
      rest = rest.replace(m[0], ' ');
    }
  }
  return { tokens, rest: rest.replace(/\s+/g, ' ').trim() };
}

const DAY_NAMES = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

function parseDate(s: string | undefined): Date {
  if (!s) return new Date();
  const trimmed = s.toLowerCase().trim();
  if (trimmed === 'now' || trimmed === 'today') return new Date();
  if (trimmed === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(8, 0, 0, 0);
    return d;
  }
  const rel = /^-?(\d+)(d|h|m)$/.exec(trimmed);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const unit = rel[2];
    const ms =
      unit === 'd' ? n * 86_400_000 : unit === 'h' ? n * 3_600_000 : n * 60_000;
    return new Date(Date.now() - ms);
  }
  const idx = DAY_NAMES.indexOf(trimmed);
  if (idx >= 0) {
    const now = new Date();
    const today = now.getDay();
    let back = (today - idx + 7) % 7;
    if (back === 0) back = 7;
    const d = new Date(now);
    d.setDate(now.getDate() - back);
    d.setHours(8, 0, 0, 0);
    return d;
  }
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) return new Date(parsed);
  throw new Error(`could not parse date: "${s}"`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function cryptoUUID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
