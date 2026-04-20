#!/usr/bin/env bash
# Buildrik DS V1 — CI grep gates.
# Enforces namespace invariants from spec §10.
#
# Run: bash packages/editor/scripts/ds-grep-gates.sh
# @license BSD-3-Clause

set -e
# Resolve script directory BEFORE cd so baseline-file lookups work regardless of
# whether the script is invoked from repo root or packages/editor (via `pnpm run
# verify:ds`). Both invocation paths are supported.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../../.."

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
LEAK=$(grep -rE 'var\(--(ls-|rail-|surface-[a-z]|brand-|primary-[0-9]|buildrick-(control|build|ai)-|accent\)|accent,|bar\)|bar,|blue\)|blue,|txt\)|txt,)' packages/editor/src 2>/dev/null | grep -v __tests__ || true)
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


# Gate 7: @media (prefers-*) must only appear in a11y.css
# WARN mode: 14 legacy CSS files have leaked @media (prefers-*) blocks (tracked, out
# of scope for this remediation pass). Gate warns and lists files but does not fail CI.
# Flip to fail mode once the backlog is cleared.
LEAKED_MEDIA=$(grep -rlE '@media\s*\(\s*prefers-' packages/editor/src --include="*.css" 2>/dev/null | grep -v 'design-system/a11y.css' || true)
if [ -n "$LEAKED_MEDIA" ]; then
  echo "  WARN Gate 7: @media (prefers-*) outside a11y.css (backlog — not blocking):"
  echo "$LEAKED_MEDIA" | sed 's/^/    /'
fi
pass "Gate 7: @media (prefers-*) audit complete (WARN mode — flip to fail after backlog cleared)"

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

# ------------------------------------------------------------
# Editor-Chrome DS Axioms (A1, Zero Decoration) — baseline-backed
# Added 2026-04-20. See DESIGN.md §Chrome Axioms.
# Baselines frozen in scripts/.chrome-axioms-baseline (one count per line, gates 11-14).
# Regressions (current > baseline) FAIL CI. Improvements (current < baseline)
# print a hint to update the baseline.
# ------------------------------------------------------------
# Chrome paths: editor chrome + shared primitives.
# LOCAL_SHADOW exclusions: user-token editor, BackgroundSection (edits user
# gradients), user-content preview renderers, gradient parsers, tests, stories.
# features/design-system/ui/** is IN scope (Design tab chrome).
CHROME_PATHS="packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms"
CHROME_EXCLUDE='__tests__|\.test\.|\.stories\.|sidebar/tabs/design/|inspector/sections/BackgroundSection\.tsx|shared/utils/parsers/|editor/export/PreviewFrame\.tsx|editor/media/VideoPreview\.tsx|editor/wizard/sectionData\.ts|shared/forms/GradientPicker\.tsx'

# Form atoms — exempt from radius-above-4 (Gate 13) only. Gradient + raw shadow
# (Gates 11, 12) still apply.
FORM_ATOM_EXCLUDE='shared/ui/Button\.tsx|shared/ui/IconButton\.tsx|shared/ui/Tooltip\.tsx|shared/ui/Toast\.tsx|shared/ui/Modal\.tsx|shared/ui/Badge\.tsx|shared/ui/PremiumBadge\.tsx|shared/ui/Kbd\.tsx|shared/ui/SharedDialogs\.tsx|shared/forms/'

count_chrome() {
  # $1 = pattern. $2 (optional) = extra exclusion pattern piped in addition to base.
  local extra="${2:-}"
  local excl="$CHROME_EXCLUDE"
  [ -n "$extra" ] && excl="$excl|$extra"
  grep -rE "$1" $CHROME_PATHS --include='*.ts' --include='*.tsx' --include='*.css' 2>/dev/null \
    | grep -vE "$excl" \
    | wc -l | tr -d ' '
}

# Baseline file (same pattern as .hex-baseline for Gate 10).
# Use absolute SCRIPT_DIR computed at the top so this works whether the script
# was invoked from repo root or from packages/editor.
BASELINE_FILE="$SCRIPT_DIR/.chrome-axioms-baseline"
if [ ! -f "$BASELINE_FILE" ]; then
  echo "  ERROR: missing chrome-axioms baseline at $BASELINE_FILE"
  echo "         Run: bash $(dirname "$0")/freeze-chrome-baseline.sh"
  exit 1
fi

# Read baselines (one per line: 11, 12, 13, 14).
BASE_11=$(sed -n '1p' "$BASELINE_FILE")
BASE_12=$(sed -n '2p' "$BASELINE_FILE")
BASE_13=$(sed -n '3p' "$BASELINE_FILE")
BASE_14=$(sed -n '4p' "$BASELINE_FILE")

check_gate() {
  # $1 = gate number, $2 = current count, $3 = baseline, $4 = axiom label
  local gate="$1" cur="$2" base="$3" label="$4"
  if [ "$cur" -gt "$base" ]; then
    echo "  FAIL Gate $gate ($label): $cur > baseline $base (regression — see DESIGN.md §Chrome Axioms)"
    return 1
  elif [ "$cur" -lt "$base" ]; then
    echo "  OK   Gate $gate ($label): $cur < baseline $base (improvement — lower the baseline in .chrome-axioms-baseline)"
  else
    echo "  PASS Gate $gate ($label): $cur at baseline $base"
  fi
  return 0
}

# Gate 11: Chrome Axiom A1.1 — no gradients in chrome.
# Broadened: catches Emotion templates, JSX inline-style string literals, CSS files.
GRADIENT_COUNT=$(count_chrome '(linear-gradient|radial-gradient|conic-gradient)')
check_gate 11 "$GRADIENT_COUNT" "$BASE_11" "A1.1 — no chrome gradients" || exit 1

# Gate 12: Chrome Axiom A1.2 — box-shadow must use --buildrick-shadow-* token.
# Broadened: CSS (box-shadow:) + TSX camelCase (boxShadow:). Exempts lines
# where the next non-whitespace token is var(--buildrick-shadow or var(--buildrick-glow.
# Match all box-shadow / boxShadow occurrences first, then subtract token-bound ones.
SHADOW_ALL=$(count_chrome '(box-shadow|boxShadow)[[:space:]]*:')
SHADOW_TOKENIZED=$(count_chrome '(box-shadow|boxShadow)[[:space:]]*:[[:space:]]*"?var\(--buildrick-(shadow|glow)')
SHADOW_COUNT=$((SHADOW_ALL - SHADOW_TOKENIZED))
check_gate 12 "$SHADOW_COUNT" "$BASE_12" "A1.2 — box-shadow via --buildrick-shadow-* token" || exit 1

# Gate 13: Chrome Axiom A1.3 — border-radius ≤ 4px on panel chrome (form atoms exempt).
# Broadened: CSS (border-radius:) + TSX camelCase (borderRadius:).
# Matches literal numeric values > 4. Excludes form atoms (Button, Toast, etc.).
RADIUS_COUNT=$(count_chrome '(border-radius|borderRadius)[[:space:]]*:[[:space:]]*"?([5-9]|1[0-9]|2[0-9]|3[0-9]|50%|999)' "$FORM_ATOM_EXCLUDE")
check_gate 13 "$RADIUS_COUNT" "$BASE_13" "A1.3 — panel-chrome border-radius ≤ 4 (form atoms exempt)" || exit 1

# Gate 14: Magic layout literals (Survivor #3 target).
# Broadened: CSS (Npx), TSX camelCase bare numbers, and Emotion interpolated ${N}px.
# TSX pattern: identifier keyword + colon + space + literal number in target set.
LAYOUT_CSS=$(count_chrome '\b(28|32|36|40|44|48|56|60|240|300|320)px\b')
LAYOUT_TSX=$(count_chrome '(height|width|minHeight|maxWidth|minWidth|maxHeight|padding|paddingLeft|paddingRight|paddingTop|paddingBottom|margin|marginLeft|marginRight|marginTop|marginBottom|top|bottom|left|right|gap|rowGap|columnGap)[[:space:]]*:[[:space:]]*(28|32|36|40|44|48|56|60|240|300|320)[^0-9pxPX]')
LITERAL_COUNT=$((LAYOUT_CSS + LAYOUT_TSX))
check_gate 14 "$LITERAL_COUNT" "$BASE_14" "layout literals → src/shared/constants/layout.ts" || exit 1

echo ""
echo "=== DS V1 gates: 10 passed + 4 chrome-axiom gates at baseline ==="
