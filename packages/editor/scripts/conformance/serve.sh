#!/usr/bin/env bash
# Both servers the conformance harness measures against, with health waits.
#
# There are TWO, and that is the single most common way a first run fails:
#
#   :5050  the demo app       — `shell-default` only
#   :5051  the component probe — the other eight recipes
#
# Different vite roots, so one server cannot serve both. The probe exists
# because the states those boards draw (populated media library, failed upload)
# are not reachable by clicking the demo app.
#
# This mirrors the `Figma conformance` step in .github/workflows/editor-ci.yml.
# Until this script existed, that CI block was the only place either port was
# written down, and README §"Running it" documented only :5050 — i.e. the wrong
# server for 8 of 9 surfaces.
#
# @license BSD-3-Clause
set -euo pipefail
cd "$(dirname "$0")/../.."

npx vite --port 5050 --strictPort > /tmp/vite-conformance.log 2>&1 &
DEMO_PID=$!
npx vite . --port 5051 --strictPort > /tmp/vite-probe.log 2>&1 &
PROBE_PID=$!
trap 'kill $DEMO_PID $PROBE_PID 2>/dev/null || true' EXIT INT TERM

wait_for() {
  local url="$1" name="$2" log="$3"
  for _ in $(seq 1 90); do
    curl -sf -o /dev/null "$url" && { echo "[serve] $name up  $url"; return 0; }
    sleep 1
  done
  echo "[serve] $name never came up; last 40 lines of $log:" >&2
  tail -40 "$log" >&2
  return 1
}

wait_for "http://localhost:5050/" "demo " /tmp/vite-conformance.log
wait_for "http://localhost:5051/e2e/probe/probe.html" "probe" /tmp/vite-probe.log

echo "[serve] both up. Run: pnpm run conformance:measure <surface> && pnpm run conformance:diff <surface>"
echo "[serve] ctrl-c to stop."
wait
