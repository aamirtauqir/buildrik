#!/usr/bin/env bash
# Buildrik DS V1 — CI grep gates.
# Enforces namespace invariants from spec §10.
#
# Run: bash packages/editor/scripts/ds-grep-gates.sh
# @license BSD-3-Clause

set -e
cd "$(dirname "$0")/../../.."

fail() { echo "GATE FAIL: $1"; exit 1; }
pass() { echo "  PASS: $1"; }

echo "=== Buildrik DS V1 grep gates ==="

# Gate 1: No self-referential CSS var defs
if grep -rE '^\s*(--buildrick-[a-z0-9-]+)\s*:\s*var\(\1[,)]' packages/editor/src/themes/design-system > /dev/null 2>&1; then
  fail "Gate 1: self-referential CSS var def"
fi
pass "Gate 1: no self-referential defs"

# Gate 2: --buildrick-design-* defs only in canonical locations
# Requires colon after var name to distinguish actual defs from comment text
LEAK=$(grep -rE '^\s*--buildrick-design-[a-z0-9-]+\s*:' packages/editor/src --include='*.css' 2>/dev/null | grep -v 'design-system/design.css' || true)
if [ -n "$LEAK" ]; then
  echo "$LEAK"
  fail "Gate 2: --buildrick-design-* def outside design.css"
fi
pass "Gate 2: --buildrick-design-* defs only in design.css"

# Gate 3: No --buildrick-design-* CONSUMERS in editor chrome
# Excludes features/design-system/ui (Design Tab legitimately displays user tokens)
# Excludes .test.tsx files and JSDoc comments (documentation of binding behavior)
LEAK=$(grep -rnE 'var\(--buildrick-design-' packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai 2>/dev/null \
  | grep -v '__tests__' \
  | grep -vE ':[[:space:]]*/?\*' \
  | grep -vE '//.*var\(--buildrick-design-' \
  || true)
if [ -n "$LEAK" ]; then
  echo "$LEAK"
  fail "Gate 3: --buildrick-design-* consumer in chrome"
fi
pass "Gate 3: chrome consumers of --buildrick-design-* eliminated"

# Gate 4: No deprecated alias consumers (compat.css deleted; aliases must be gone)
LEAK=$(grep -rE 'var\(--(ls-|rail-|surface-[a-z]|brand-|primary-[0-9]|buildrick-(control|build|ai)-|accent\)|accent,|bar\)|bar,|blue\)|blue,|txt\)|txt,)' packages/editor/src 2>/dev/null | grep -v components.css | grep -v __tests__ || true)
if [ -n "$LEAK" ]; then
  echo "$LEAK"
  fail "Gate 4: deprecated alias consumer"
fi
pass "Gate 4: no deprecated alias consumers"

# Gate 5: No old --aqb-* / data-aqb-* (V3 legacy)
LEAK=$(grep -rE '(--aqb-|data-aqb-)' packages/editor/src --include='*.ts' --include='*.tsx' --include='*.css' 2>/dev/null || true)
if [ -n "$LEAK" ]; then
  echo "$LEAK"
  fail "Gate 5: --aqb-* / data-aqb-* still present"
fi
pass "Gate 5: no --aqb-*/data-aqb-*"

# Gate 6: No duplicate keys within any DS file
for f in packages/editor/src/themes/design-system/*.css; do
  DUPS=$(awk '/^\s*--buildrick-/ {match($0,/--buildrick-[a-z0-9-]+/); print substr($0,RSTART,RLENGTH)}' "$f" | sort | uniq -d || true)
  if [ -n "$DUPS" ]; then
    echo "$f has duplicates: $DUPS"
    fail "Gate 6: duplicate keys in DS file"
  fi
done
pass "Gate 6: no duplicate keys in any DS file"

# Gate 8: No bare deprecated defs (--accent, --buildrick-text, --buildrick-surface)
LEAK=$(grep -rE '^\s*(--accent|--buildrick-text|--buildrick-surface)\s*:' packages/editor/src --include='*.css' 2>/dev/null || true)
if [ -n "$LEAK" ]; then
  echo "$LEAK"
  fail "Gate 8: bare deprecated def"
fi
pass "Gate 8: no bare deprecated defs"

# Gate 9: INSPECTOR_TOKENS fully removed (functional refs only; 1 comment about deprecation is OK)
LEAK=$(grep -rE 'INSPECTOR_TOKENS' packages/editor/src --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v 'constant was deprecated and removed' || true)
if [ -n "$LEAK" ]; then
  echo "$LEAK"
  fail "Gate 9: INSPECTOR_TOKENS references remain"
fi
pass "Gate 9: INSPECTOR_TOKENS fully removed"

# Gate 10: Hex regression gate (v2 — baseline-based).
# Compares current hex count against scripts/.hex-baseline. Fails on regression.
# Lines with @lint-hex-policy: on the same or preceding line are exempted.
# Run `node scripts/find-inline-hex-v2.mjs --group-by-value` for details.
if ! node packages/editor/scripts/find-inline-hex-v2.mjs >/dev/null 2>&1; then
  echo "GATE 10 FAIL: hex count regressed above baseline"
  echo "Run 'node packages/editor/scripts/find-inline-hex-v2.mjs' to see details"
  exit 1
fi
pass "Gate 10: hex count at or below baseline"

echo ""
echo "=== All 9 DS gates passed ==="
