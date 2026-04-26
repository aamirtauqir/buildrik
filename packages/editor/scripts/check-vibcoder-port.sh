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

    # (a) Extract class name from file — look for any .bd-* or .bdr-* class definition
    classname=$(grep -oE "^\s*\.bd-[a-z0-9_-]+|^\s*\.bdr-[a-z0-9_-]+" "$f" | head -1 | sed 's/^[[:space:]]*\.//')
    if [ -z "$classname" ]; then
      fail "$f: no body class definition .bd-* or .bdr-* found"
    fi

    # (b) manifest entry — class should exist in manifest (either original bdr-* or renamed bd-*)
    # The manifest documents vibcoder names (bdr-*). Codemod 1 renames them to bd-*.
    # Check for the classname as-is; if not found, derive the original bdr-* equivalent.
    if ! grep -qE "\b${classname}\b" "$MANIFEST"; then
      # If the current class is bd-*, try the original bdr-* form
      if [[ "$classname" == bd-* ]]; then
        original="${classname/bd-/bdr-}"
        if ! grep -qE "\b${original}\b" "$MANIFEST"; then
          fail "$f: no manifest entry for ${classname} (or original ${original}) in $MANIFEST"
        fi
      else
        fail "$f: no manifest entry for ${classname} in $MANIFEST"
      fi
    fi

    count=$((count+1))
  done
done

pass "vibcoder port: $count file(s) checked, all have manifest + body class"
