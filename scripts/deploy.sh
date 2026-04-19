#!/bin/bash
set -euo pipefail

# Invoked by GitHub Actions via an SSH key locked to this exact path
# (`command="..."` in /root/.ssh/authorized_keys on verity). Pulls main,
# rebuilds, and restarts the systemd unit.

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
