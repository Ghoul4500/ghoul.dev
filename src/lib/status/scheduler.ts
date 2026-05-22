import { load, mutate } from './store.ts';
import { sendDm, type InlineKeyboard } from './telegram.ts';
import { PRESETS } from './presets.ts';
import { hasRecentCommits } from './github-signal.ts';
import type { Incident, IncidentType, PendingPrompt } from './types.ts';

const TICK_MS = 60_000;
const WELLNESS_CHECK_HOURS = 96;
const WELLNESS_CHECK_GRACE_HOURS = 24;

type DmTask = {
  text: string;
  buttons: InlineKeyboard;
  incidentId: string;
  promptKind: PendingPrompt['kind'];
};

const CHECKIN_BUTTONS: Record<
  IncidentType,
  { recovered: string; still: string; extend: { label: string; hours: number } }
> = {
  sick:             { recovered: '✓ feeling better', still: '📈 still ill',    extend: { label: '+1d',  hours: 24 } },
  busy:             { recovered: '✓ back to normal', still: '📈 still busy',   extend: { label: '+12h', hours: 12 } },
  cooked:           { recovered: '✓ slept it off',   still: '📈 still cooked', extend: { label: '+1d',  hours: 24 } },
  'touching-grass': { recovered: '✓ done',           still: '📈 still out',   extend: { label: '+2h',  hours: 2  } },
};

function checkinKeyboard(incidentId: string, type: IncidentType): InlineKeyboard {
  const b = CHECKIN_BUTTONS[type];
  return [
    [
      { text: b.recovered, callback_data: `recovered:${incidentId}` },
      { text: b.still,     callback_data: `still:${incidentId}` },
    ],
    [
      { text: b.extend.label, callback_data: `extend:${incidentId}:${b.extend.hours}` },
    ],
  ];
}

function wellnessKeyboard(incidentId: string): InlineKeyboard {
  return [
    [
      { text: "✓ i'm alive",        callback_data: `recovered:${incidentId}` },
      { text: '📈 still recovering', callback_data: `still:${incidentId}` },
    ],
  ];
}

let handle: ReturnType<typeof setInterval> | null = null;

export function startScheduler() {
  if (handle) return;
  handle = setInterval(() => {
    tick().catch((err) => console.error('[status scheduler]', err));
  }, TICK_MS);
  setTimeout(() => {
    tick().catch((err) => console.error('[status scheduler]', err));
  }, 3_000);
}

export function stopScheduler() {
  if (handle) clearInterval(handle);
  handle = null;
}

export async function tick(now = Date.now()): Promise<void> {
  const snapshot = await load();
  const anyActive = snapshot.incidents.some((i) => i.resolved_at === null);
  if (!anyActive) return;

  const anyMightBeDead = snapshot.incidents.some((i) => {
    if (i.resolved_at !== null || i.presumed_dead) return false;
    const sinceReplyH =
      (now - Date.parse(i.last_user_reply_at)) / 3_600_000;
    return sinceReplyH >= WELLNESS_CHECK_HOURS;
  });

  const noRecentCommits = anyMightBeDead
    ? !(await hasRecentCommits(WELLNESS_CHECK_HOURS))
    : false;

  const dmsToSend: DmTask[] = [];

  await mutate(async (s) => {
    for (const inc of s.incidents) {
      if (inc.resolved_at !== null) continue;
      if (inc.presumed_dead) continue;

      processCheckIns(inc, now, dmsToSend);
      processAutoResolve(inc, now);
      processPresumedDead(inc, now, noRecentCommits, dmsToSend);
    }
    return s;
  });

  for (const task of dmsToSend) {
    try {
      const messageId = await sendDm(task.text, { buttons: task.buttons });
      if (messageId !== null) {
        await mutate(async (s) => {
          const inc = s.incidents.find((i) => i.id === task.incidentId);
          if (inc && inc.pending_prompt) {
            inc.pending_prompt.dm_message_id = messageId;
          }
          return s;
        });
      }
    } catch (err) {
      console.error('[status scheduler] dm failed:', err);
    }
  }
}

function processCheckIns(inc: Incident, now: number, dms: DmTask[]) {
  const preset = PRESETS[inc.type];
  const ageH = (now - Date.parse(inc.started_at)) / 3_600_000;
  for (let i = 0; i < preset.check_ins.length; i++) {
    if (inc.fired_check_ins.includes(i)) continue;
    if (ageH < preset.check_ins[i].after_hours) continue;
    inc.fired_check_ins.push(i);
    inc.updates.push({
      at: new Date(now).toISOString(),
      phase: 'monitoring',
      text: preset.check_ins[i].page_update,
      auto: true,
    });
    inc.pending_prompt = {
      kind: 'checkin',
      sent_at: new Date(now).toISOString(),
      dm_message_id: null,
    };
    dms.push({
      text: preset.check_ins[i].dm,
      buttons: checkinKeyboard(inc.id, inc.type),
      incidentId: inc.id,
      promptKind: 'checkin',
    });
  }
}

function processAutoResolve(inc: Incident, now: number) {
  const preset = PRESETS[inc.type];
  const ageH = (now - Date.parse(inc.started_at)) / 3_600_000;
  const threshold = preset.auto_resolve_hours + inc.auto_resolve_offset_hours;
  if (ageH < threshold) return;

  if (preset.full_resolve_on_auto) {
    if (inc.resolved_at !== null) return;
    inc.resolved_at = new Date(now).toISOString();
    inc.updates.push({
      at: new Date(now).toISOString(),
      phase: 'resolved',
      text: 'Auto-closed: scheduled window expired without further updates.',
      auto: true,
    });
  } else if (!inc.presumed_recovered) {
    inc.presumed_recovered = true;
    inc.updates.push({
      at: new Date(now).toISOString(),
      phase: 'monitoring',
      text: 'User went silent. Presumed recovered, pending confirmation.',
      auto: true,
    });
  }
}

/**
 * Two-stage check before the page goes full RIP:
 *
 *   Stage 1: silence >= 96h AND no public commits in 96h
 *            → send "u alive?" DM, record wellness_check_sent_at, append a
 *              page update. Do NOT flip presumed_dead yet.
 *   Stage 2: stage-1 fired AND another 24h grace elapsed AND still no reply
 *            AND still no commits → flip presumed_dead.
 *
 * Any user activity in between clears wellness_check_sent_at (done in the
 * Telegram listener), so vacation-with-occasional-phone-glance never reaches
 * stage 2.
 */
function processPresumedDead(
  inc: Incident,
  now: number,
  noRecentCommits: boolean,
  dms: DmTask[]
) {
  if (!noRecentCommits) return;
  const sinceReplyH = (now - Date.parse(inc.last_user_reply_at)) / 3_600_000;
  if (sinceReplyH < WELLNESS_CHECK_HOURS) return;

  if (inc.wellness_check_sent_at === null) {
    inc.wellness_check_sent_at = new Date(now).toISOString();
    inc.updates.push({
      at: new Date(now).toISOString(),
      phase: 'identified',
      text: 'Engineering initiating final wellness check. No commits, no replies in 96h.',
      auto: true,
    });
    inc.pending_prompt = {
      kind: 'wellness',
      sent_at: new Date(now).toISOString(),
      dm_message_id: null,
    };
    dms.push({
      text:
        'ok genuine question — u alive? no replies and no commits in 96h. ' +
        'reply anything within 24h or status goes full RIP.',
      buttons: wellnessKeyboard(inc.id),
      incidentId: inc.id,
      promptKind: 'wellness',
    });
    return;
  }

  const sinceCheckH =
    (now - Date.parse(inc.wellness_check_sent_at)) / 3_600_000;
  if (sinceCheckH < WELLNESS_CHECK_GRACE_HOURS) return;

  inc.presumed_dead = true;
  inc.updates.push({
    at: new Date(now).toISOString(),
    phase: 'identified',
    text: 'Wellness check went unanswered. Service presumed permanently unreachable.',
    auto: true,
  });
  dms.push({
    text: 'alright. RIP for now. any reply or commit will resurrect.',
    buttons: [],
    incidentId: inc.id,
    promptKind: 'wellness',
  });
}
