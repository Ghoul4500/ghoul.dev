#!/bin/bash
set -euo pipefail

# Invoked by GitHub Actions via an SSH key locked to this exact path
# (`command="..."` in /root/.ssh/authorized_keys on verity). Pulls main,
# rebuilds, and restarts the systemd unit.
#
# Stdin may carry a freshly-rendered env file from the workflow — one
# `KEY=value` per line. We drain it, validate, and write /opt/ghoul.dev/.env
# atomically BEFORE the build so Vite picks up the new values, then restart
# so systemd's EnvironmentFile (if used) reloads them too. Empty stdin is a
# no-op so a manual `ssh user@host` still works for debug deploys.

ENV_FILE=/opt/ghoul.dev/.env

# Peek at stdin with a short timeout. If something is actually piped (GH
# Actions), the first read returns immediately and we drain the rest. If the
# session was opened interactively (manual `ssh user@host` for debugging),
# nothing is piped, read times out, and we leave the existing env file alone.
if IFS= read -r -t 2 _first 2>/dev/null; then
  TMP_ENV="$(mktemp)"
  trap 'rm -f "$TMP_ENV"' EXIT
  {
    printf '%s\n' "$_first"
    /usr/bin/cat
  } > "$TMP_ENV"
  if /usr/bin/grep -qvE '^(#.*)?$|^[A-Z_][A-Z0-9_]*=' "$TMP_ENV"; then
    echo "[deploy] stdin had unexpected content, refusing to touch $ENV_FILE" >&2
    exit 1
  fi
  chmod 600 "$TMP_ENV"
  mv "$TMP_ENV" "$ENV_FILE"
  echo "[deploy] $ENV_FILE updated from secrets stream ($(/usr/bin/wc -l < "$ENV_FILE") line(s))"
fi

cd /opt/ghoul.dev

echo "[deploy] fetching origin/main..."
/usr/bin/git fetch origin main

# Remove any untracked files under scripts/ so pulls don't collide with
# a pre-existing untracked copy of this script (left over from the first
# manual provision). Safe to keep long-term.
/usr/bin/git clean -fd scripts/ || true

/usr/bin/git reset --hard origin/main

echo "[deploy] installing deps..."
/usr/bin/corepack pnpm install --frozen-lockfile

echo "[deploy] building..."
/usr/bin/corepack pnpm build

echo "[deploy] restarting service..."
/usr/bin/systemctl restart ghoul-dev
sleep 2
/usr/bin/systemctl is-active ghoul-dev

echo "[deploy] done"
