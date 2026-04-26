#!/usr/bin/env bash
# packages/editor/scripts/check-vibcoder-port.sh
# Per-PR gate: every ported component file has a manifest entry + body class.
# @license BSD-3-Clause
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../../.."

MANIFEST="docs/reference/vibcoder/components/COMPONENTS.md"
TIER_DIR="packages/editor/src/themes/components"
fail() { echo "PORT CHECK FAIL: $1"; exit 1; }
pass() { echo "  PASS: $1"; }

if [ ! -f "$MANIFEST" ]; then
  echo "  SKIP: manifest not found at $MANIFEST (vibcoder bundle not vendored)"
  exit 0
fi

count=0
for tier in atoms molecules organisms layouts; do
  dir="$TIER_DIR/$tier"
  [ -d "$dir" ] || continue
  for f in "$dir"/*.css; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .css)
    [ "$name" = "_aliases.generated" ] && continue
    [ "$name" = "_layer" ] && continue

    # (a) manifest entry — look for `bd-<name>` or `bdr-<name>` in manifest
    if ! grep -qE "(bdr|bd)-${name}\b" "$MANIFEST"; then
      fail "$f: no manifest entry for bd-${name} (or bdr-${name}) in $MANIFEST"
    fi

    # (b) body class — file must define .bd-<name> at column 0 or after whitespace
    if ! grep -qE "^\s*\.bd-${name}(\s|\{|,|:|__|--)" "$f"; then
      fail "$f: no body class definition .bd-${name} found"
    fi
    count=$((count+1))
  done
done

pass "vibcoder port: $count file(s) checked, all have manifest + body class"
