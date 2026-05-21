#!/usr/bin/env bash
# Load a status-page fixture into data/status.json with timestamps rebased to
# "now". Use during dev / visual testing. Fixtures live next to this script.
#
# Usage:
#   scripts/status-fixtures/load.sh operational
#   scripts/status-fixtures/load.sh busy
#   scripts/status-fixtures/load.sh sick
#   scripts/status-fixtures/load.sh wellness
#   scripts/status-fixtures/load.sh dead

set -euo pipefail

mode="${1:?missing fixture name}"
here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../.." && pwd)"
src="$here/$mode.json"
dst="$root/data/status.json"

[[ -f "$src" ]] || { echo "no such fixture: $src" >&2; exit 1; }
mkdir -p "$root/data"

python3 - "$src" "$dst" <<'PY'
import json, re, sys, datetime as dt

src, dst = sys.argv[1], sys.argv[2]
with open(src) as f:
    text = f.read()

now = dt.datetime.now(dt.timezone.utc)

def rebase(token: str) -> str:
    m = re.fullmatch(r"__TS_HOURS_AGO_(\d+)__", token)
    if m:
        return (now - dt.timedelta(hours=int(m.group(1)))).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    m = re.fullmatch(r"__TS_DAYS_AGO_(\d+)__", token)
    if m:
        return (now - dt.timedelta(days=int(m.group(1)))).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    m = re.fullmatch(r"__TS_DAYS_AGO_(\d+)_PLUS_(\d+)H__", token)
    if m:
        return (now - dt.timedelta(days=int(m.group(1)), hours=-int(m.group(2)))).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    return token

out = re.sub(r"__TS_[A-Z0-9_]+__", lambda m: rebase(m.group(0)), text)
json.loads(out)  # validate
with open(dst, "w") as f:
    f.write(out)
print(f"loaded {sys.argv[1]} → {sys.argv[2]}")
PY
