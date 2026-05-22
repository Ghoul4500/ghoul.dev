# Telegram bot — flow contract

The status page at `ghoul.dev/status` is driven entirely by a private Telegram
bot. There is no HTTP write surface; the bot is the only control channel.
The bot only listens to `TELEGRAM_ALLOWED_USER_ID` — everything else is
silently dropped.

This file is the source of truth for what each input does. The user-facing
`/help` is a short summary; this is the long form.

## Commands

| Command                                   | What it does                                                                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `/sick   [since=DATE] [text]`             | Open a `sick` incident. Errors if one is already active.                                                                                  |
| `/busy   [since=DATE] [text]`             | Open a `busy` incident.                                                                                                                   |
| `/cooked [since=DATE] [text]`             | Open a `cooked` incident.                                                                                                                 |
| `/grass  [since=DATE] [text]`             | Open a `touching-grass` incident.                                                                                                         |
| `/update [phase=PHASE] text`              | Add a public timeline update to the most recent active incident. Errors if nothing is active.                                             |
| `/recovered`                              | Close the **most recent** active incident.                                                                                                |
| `/recovered all`                          | Close **every** active incident.                                                                                                          |
| `/recovered sick\|busy\|cooked\|grass [text]` | Close one specific type.                                                                                                                  |
| `/extend 2d` or `/extend 12h`             | Push the auto-resolve window of the most recent active incident out by the given duration. Clears `presumed_recovered`.                   |
| `/status`                                 | DM dump of current state.                                                                                                                 |
| `/help`                                   | Compact reference.                                                                                                                        |

`DATE` accepts: `2026-05-18`, `monday`, `yesterday`, `-3d`, `-12h`, `now`.

## Free-text replies — the rules that matter

Free-text dispatch depends on whether the bot is **expecting an answer**.

The bot sets `pending_prompt` on an incident when it sends a check-in or
wellness-check DM. The prompt stays "live" for **48h** (`PENDING_PROMPT_TTL_HOURS`).
Inside that window, replies are interpreted in context. Outside it, the bot
falls back to the unprompted rules.

### When a check-in / wellness DM is pending

| You type                                                              | Result                                                                                |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `yes`, `yeah`, `yep`, `yup`, `ok`, `k`, `sure`, `👍`, `✓`, `better`, `back`, `fine`, `all good`, `i'm good`, `much better`, `feeling better` | Close **that specific** incident. Posts "User has returned. Cause of life unknown." to public timeline. |
| `no`, `nope`, `nah`, `not yet`, `still`, `still cooked`, `👎`         | **Silent private ack.** Bot DMs "✓ noted, will check back later". Public timeline is **not** touched. Wellness countdown resets. |
| Anything else                                                         | Posted to public timeline as a normal `/update`. Pending prompt cleared.              |

### When nothing is pending

| You type                                                              | Result                                                                                |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Contains `better`, `back`, `fine`, `done`, `recovered`, `alive`, `alright`, `all good`, `good now`, `much better`, `feeling better`, `all better` | `/recovered` — closes the most recent active incident.                              |
| Anything else                                                         | Posted to public timeline as `/update` on the most recent active incident.            |

## Check-in & wellness flows

### Per-incident check-ins (the cute "u feeling better T-T" DMs)

Each incident type has its own check-in schedule (`src/lib/status/presets.ts`).
When the age threshold is crossed during a scheduler tick:

1. Public timeline gets a stage update (e.g. "Engineering attempted contact").
2. Bot DMs you the canned line with three inline buttons.
3. `pending_prompt = { kind: 'checkin', sent_at, dm_message_id }` is set.
4. Your reply (button or text) resolves it per the table above. The original
   DM is edited in place to show the outcome.

Buttons per incident type:

| Type             | ✓ recovered button   | 📈 still button     | extend button |
| ---------------- | -------------------- | ------------------- | ------------- |
| `sick`           | ✓ feeling better     | 📈 still ill        | +1d           |
| `busy`           | ✓ back to normal     | 📈 still busy       | +12h          |
| `cooked`         | ✓ slept it off       | 📈 still cooked     | +1d           |
| `touching-grass` | ✓ done               | 📈 still out        | +2h           |

### The wellness-check / presumed-dead two-stage flow

If an active incident sees **no user reply for 96h** *and* **no public commits
for 96h** (`hasRecentCommits`), the scheduler escalates:

**Stage 1 — wellness check.** Sets `wellness_check_sent_at`, sets
`pending_prompt = { kind: 'wellness', ... }`, posts an `identified`-phase
update to the public timeline ("Engineering initiating final wellness check…"),
and DMs:

> ok genuine question — u alive? no replies and no commits in 96h. reply
> anything within 24h or status goes full RIP.

With two buttons: `✓ i'm alive` / `📈 still recovering`. Both clear the
wellness check and count as activity; `✓` also closes the incident.

**Stage 2 — presumed dead.** If 24h passes with still no reply and still no
commits, `presumed_dead = true`, public timeline goes RIP, bot DMs:

> alright. RIP for now. any reply or commit will resurrect.

Any future user activity (Telegram message *or* a public commit picked up by
`github-signal.ts`) clears `presumed_dead`.

## Phases (`/update phase=...`)

`investigating` · `identified` · `monitoring` · `resolved`. Default for
`/update` is `monitoring`. `cmdStart` always logs `investigating`.
`cmdRecovered` and the per-incident close path always log `resolved`.

## What does NOT post publicly

- `/help`, `/status` — DM-only.
- Negative replies (`no`/`still`/etc) to a pending check-in — silent ack.
- The bot's own ack DMs (`✓ marked recovered`, `✓ noted, will check back later`).
- `dm_message_id` editing the original check-in DM.

## Storage

State lives in `data/status.json` (`STATUS_DATA_DIR` env to override). Writes
are serialized through `mutate()` so a Telegram reply firing in parallel with
a scheduler tick can't tear the file. Resolved incidents are pruned after 30
days.
