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
# --exclude-dir=project skips designer-facing spec mirror (untracked, not runtime)
LEAK=$(grep -rE '^\s*--buildrick-design-[a-z0-9-]+\s*:' packages/editor/src --include='*.css' --exclude-dir=project 2>/dev/null | grep -v 'design-system/design.css' || true)
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
LEAK=$(grep -rE 'var\(--(ls-|rail-|surface-[a-z]|brand-|primary-[0-9]|buildrick-(control|build|ai)-|accent\)|accent,|bar\)|bar,|blue\)|blue,|txt\)|txt,)' packages/editor/src --exclude-dir=project 2>/dev/null | grep -v __tests__ || true)
if [ -n "$LEAK" ]; then
  echo "$LEAK"
  fail "Gate 4: deprecated alias consumer"
fi
pass "Gate 4: no deprecated alias consumers"

# Gate 5: No old --aqb-* / data-aqb-* (V3 legacy)
LEAK=$(grep -rE '(--aqb-|data-aqb-)' packages/editor/src --include='*.ts' --include='*.tsx' --include='*.css' --exclude-dir=project 2>/dev/null || true)
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
# FAIL mode: backlog cleared 2026-04-26 (J1+J2 commits 0d5e272..61bd942 migrated 22
# blocks across 11 files into themes/design-system/a11y.css). Any new @media
# (prefers-*) outside a11y.css now blocks CI. To add a new override, edit a11y.css
# directly — DESIGN.md §10 Gate 7 makes a11y.css the single canonical home.
#
# Vendored components exception (added 2026-04-26, Phase 1 Batch 2 display atoms):
#   themes/components/ is the vibcoder vendored bundle output. The codemod
#   pipeline does NOT strip per-atom @media (prefers-*) blocks today (e.g., the
#   shipped count.css carries `@media (prefers-reduced-motion: reduce) { .bd-count
#   { transition: none; } }` from upstream). The universal a11y.css rule
#   already kills `transition-duration` for `*` so per-atom overrides are
#   functionally redundant — but stripping them requires a new codemod step,
#   captured as a Phase 6 concern. Until then, vendored output is exempt.
LEAKED_MEDIA=$(grep -rlE '@media\s*\(\s*prefers-' packages/editor/src --include="*.css" --exclude-dir=project 2>/dev/null | grep -vE '(design-system/a11y\.css|themes/components/)' || true)
if [ -n "$LEAKED_MEDIA" ]; then
  echo "  Gate 7 FAIL: @media (prefers-*) found outside themes/design-system/a11y.css:"
  echo "$LEAKED_MEDIA" | sed 's/^/    /'
  echo "  → Move the override into a11y.css. See DESIGN.md §10 Gate 7."
  fail "Gate 7: @media (prefers-*) leak outside a11y.css"
fi
pass "Gate 7: @media (prefers-*) consolidated to a11y.css (0 leaks)"

# Gate 8: No bare deprecated defs (--accent, --buildrick-text, --buildrick-surface)
LEAK=$(grep -rE '^\s*(--accent|--buildrick-text|--buildrick-surface)\s*:' packages/editor/src --include='*.css' --exclude-dir=project 2>/dev/null || true)
if [ -n "$LEAK" ]; then
  echo "$LEAK"
  fail "Gate 8: bare deprecated def"
fi
pass "Gate 8: no bare deprecated defs"

# Gate 9: INSPECTOR_TOKENS fully removed (functional refs only; 1 comment about deprecation is OK)
LEAK=$(grep -rE 'INSPECTOR_TOKENS' packages/editor/src --include='*.ts' --include='*.tsx' --exclude-dir=project 2>/dev/null | grep -v 'constant was deprecated and removed' || true)
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
CHROME_EXCLUDE='__tests__|\.test\.|\.stories\.|sidebar/tabs/design/|inspector/sections/BackgroundSection\.tsx|shared/utils/parsers/|editor/export/PreviewFrame\.tsx|editor/media/VideoPreview\.tsx|editor/wizard/sectionData\.ts|shared/forms/GradientPicker\.tsx|shared/ui/ds/Box\.tsx|shared/ui/ds/tokens\.ts|sidebar/tabs/media/components/StockSourceModal\.tsx'
# Box.tsx + tokens.ts are the Token Binding primitives (Survivor #5). They
# assemble the tokenized output via resolveShadow/resolveRadius resolvers —
# grep cannot distinguish `boxShadow: resolveShadow(...)` (legitimate resolver
# plumbing) from a raw shadow (violation). Exempted narrowly, per-file.
# PanelShell.tsx is NOT exempted — it must stay free of raw shadow/radius.

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
GREEN_PANELS_FILE="$SCRIPT_DIR/.ds-green-panels.json"
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

# Gate 12: Chrome Axiom A1.2 — box-shadow must use shadow/glow token (--buildrick-* OR --bd-* alias).
# Broadened: CSS (box-shadow:) + TSX camelCase (boxShadow:). Exempts lines
# where the next non-whitespace token is var(--buildrick-shadow|glow) or
# var(--bd-shadow|glow). The --bd-* aliases (added 2026-04-25) point at canonical
# --buildrick-shadow-* tokens — both qualify as tokenized.
# Match all box-shadow / boxShadow occurrences first, then subtract token-bound ones.
SHADOW_ALL=$(count_chrome '(box-shadow|boxShadow)[[:space:]]*:')
SHADOW_TOKENIZED=$(count_chrome "(box-shadow|boxShadow)[[:space:]]*:[[:space:]]*[\"']?var\(--(buildrick|bd)-(shadow|glow)")
SHADOW_COUNT=$((SHADOW_ALL - SHADOW_TOKENIZED))
check_gate 12 "$SHADOW_COUNT" "$BASE_12" "A1.2 — box-shadow via shadow/glow token (--buildrick-*|--bd-*)" || exit 1

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

# ------------------------------------------------------------
# Green-panel allowlist check (Survivor #6).
# Any file listed in .ds-green-panels.json must have ZERO chrome-gate
# violations, not just baseline-parity. Adding a file is a one-way door.
# ------------------------------------------------------------
if [ -f "$GREEN_PANELS_FILE" ]; then
  # Disable set -e locally — `jq -er` exits non-zero on empty arrays AND on
  # malformed JSON, and we need to distinguish those cases explicitly.
  # Restore set -e at end of the block.
  set +e
  # Extract file list. Fail LOUDLY on malformed JSON or missing tool —
  # silent failure would let violations slip past the ratchet.
  if command -v jq >/dev/null 2>&1; then
    GREEN_FILES=$(jq -r '.files[]?' "$GREEN_PANELS_FILE" 2>/dev/null)
    JQ_PARSE_CHECK=$(jq 'type' "$GREEN_PANELS_FILE" 2>/dev/null)
    if [ -z "$JQ_PARSE_CHECK" ]; then
      echo "  ERROR: malformed $GREEN_PANELS_FILE (jq parse failed)"
      exit 1
    fi
  elif command -v python3 >/dev/null 2>&1; then
    GREEN_FILES=$(python3 -c "
import json, sys
with open('$GREEN_PANELS_FILE') as f:
    data = json.load(f)
for p in data.get('files', []):
    print(p)
") || { echo "  ERROR: malformed $GREEN_PANELS_FILE (python parse failed)"; exit 1; }
  else
    echo "  ERROR: neither jq nor python3 available; cannot parse $GREEN_PANELS_FILE"
    exit 1
  fi

  GREEN_FAIL=0
  if [ -n "$GREEN_FILES" ]; then
    while IFS= read -r green_file; do
      [ -z "$green_file" ] && continue
      # Fail loudly if a listed file doesn't exist — typo or stale entry.
      if [ ! -f "$green_file" ]; then
        echo "  FAIL green-panel: $green_file listed but not found on disk"
        GREEN_FAIL=1
        continue
      fi
      # Scoped grep against the four chrome patterns, matching the full
      # coverage of gates 11-14 including bare-number TSX patterns.
      # Note: `grep -c` always prints a count (0 for no match) and exits 1 on
      # no match. We capture the count directly — do NOT add `|| echo 0`,
      # since grep's no-match would append a second "0" and break arithmetic.
      file_gradients=$(grep -cE '(linear-gradient|radial-gradient|conic-gradient)' "$green_file" 2>/dev/null); file_gradients=${file_gradients:-0}
      file_shadow_all=$(grep -cE '(box-shadow|boxShadow)[[:space:]]*:' "$green_file" 2>/dev/null); file_shadow_all=${file_shadow_all:-0}
      # Token-bound shadow check allows both ' and " quote styles AND --bd-* aliases.
      file_shadow_tok=$(grep -cE "(box-shadow|boxShadow)[[:space:]]*:[[:space:]]*[\"']?var\(--(buildrick|bd)-(shadow|glow)" "$green_file" 2>/dev/null); file_shadow_tok=${file_shadow_tok:-0}
      file_shadow_raw=$((file_shadow_all - file_shadow_tok))
      file_radius=$(grep -cE "(border-radius|borderRadius)[[:space:]]*:[[:space:]]*[\"']?([5-9]|1[0-9]|2[0-9]|3[0-9]|50%|999)" "$green_file" 2>/dev/null); file_radius=${file_radius:-0}
      # Layout literal: CSS (Npx) + TSX bare-number (camelCase property).
      file_layout_css=$(grep -cE '\b(28|32|36|40|44|48|56|60|240|300|320)px\b' "$green_file" 2>/dev/null); file_layout_css=${file_layout_css:-0}
      file_layout_tsx=$(grep -cE '(height|width|minHeight|maxWidth|minWidth|maxHeight|padding|paddingLeft|paddingRight|paddingTop|paddingBottom|margin|marginLeft|marginRight|marginTop|marginBottom|top|bottom|left|right|gap|rowGap|columnGap)[[:space:]]*:[[:space:]]*(28|32|36|40|44|48|56|60|240|300|320)[^0-9pxPX]' "$green_file" 2>/dev/null); file_layout_tsx=${file_layout_tsx:-0}
      file_layout=$((file_layout_css + file_layout_tsx))
      total=$((file_gradients + file_shadow_raw + file_radius + file_layout))
      if [ "$total" -gt 0 ]; then
        echo "  FAIL green-panel: $green_file has $total chrome-gate violations (gradients=$file_gradients, raw-shadow=$file_shadow_raw, radius>4=$file_radius, layout-literals=$file_layout); must be 0 when allowlisted"
        GREEN_FAIL=1
      fi
    done <<< "$GREEN_FILES"
  fi

  if [ "$GREEN_FAIL" -eq 1 ]; then
    exit 1
  fi

  GREEN_COUNT=$(printf '%s\n' "$GREEN_FILES" | grep -c . 2>/dev/null)
  [ -z "$GREEN_COUNT" ] && GREEN_COUNT=0
  echo "  PASS green-panel allowlist: $GREEN_COUNT file(s) listed, all at zero chrome-gate violations"
  set -e
fi

# Gate 15: --bd-* SSOT — alias tokens defined only in bd-aliases.css and _aliases.generated.css.
# The --bd-* namespace is the chrome shorthand alias layer (contract documented
# in bd-aliases.css header). Every --bd-* name must be defined in exactly one
# of two canonical locations:
#   1. themes/design-system/bd-aliases.css (hand-written core chrome aliases)
#   2. themes/components/_aliases.generated.css (vibcoder codemod 3 output, R2 exception)
# Any other file defining --bd-* (literal or var()) is a cascade-override risk.
# Enforces the SSOT rule that was broken by themes/bridge-tokens.css (deleted 2026-04-24)
# and the src/new-design/project/ reference snapshot (deleted 2026-04-24).
#
# Scope covers both:
#   (a) CSS files — `--bd-foo: value;` rules
#   (b) TSX/TS files — JSX style props like `style={{"--bd-foo": value}}`
# Exclusion is anchored to the exact canonical paths to prevent future
# `/legacy/.../bd-aliases.css` or `/other/.../aliases.generated.css` from silently bypassing.
CANONICAL='packages/editor/src/themes/design-system/bd-aliases.css'
GENERATED='packages/editor/src/themes/components/_aliases.generated.css'
LEAK_CSS=$(grep -rnE '^\s*--bd-[a-z0-9-]+\s*:' packages/editor/src --include='*.css' --exclude-dir=project 2>/dev/null \
  | grep -vE "(^|/)${CANONICAL}:|${GENERATED}:" \
  || true)
LEAK_TSX=$(grep -rnE '"--bd-[a-z0-9-]+"\s*:' packages/editor/src --include='*.tsx' --include='*.ts' --exclude-dir=project 2>/dev/null \
  | grep -v '__tests__' \
  || true)
LEAK=$(printf '%s\n%s' "$LEAK_CSS" "$LEAK_TSX" | sed '/^$/d')
if [ -n "$LEAK" ]; then
  echo "$LEAK"
  fail "Gate 15: --bd-* def outside bd-aliases.css"
fi
pass "Gate 15: --bd-* defs only in bd-aliases.css"

# Gate 17: --bd-* ghost-alias detection (added 2026-04-25).
# Catches --bd-* aliases REFERENCED by consumers but NOT DEFINED in bd-aliases.css.
# A ghost alias renders as initial/inherit value in CSS — silent visual bug,
# no console error. Caught manually 2026-04-25 via Codex audit (4 ghosts shipped:
# --bd-border-light, --bd-text-2xs-plus, --bd-success-light, --bd-warning-light).
# This gate prevents the next ghost from slipping through.
#
# Scope mirrors Gate 15 chrome boundaries: shared/ui, editor, shared/forms, ai,
# features/design-system/ui, themes/components.css, themes/ux-fixes.css.
#
# Ordering: must run AFTER Gate 15. If Gate 15 fails (extra --bd-* defs outside
# canonical file), the DEFINED set below is intentionally limited to the
# canonical file only — ghosts must be fixed by adding aliases to bd-aliases.css,
# not by defining them in random consumer files.
GHOST_DEFINED=$(grep -oE -- '--bd-[a-z0-9-]+:' "$CANONICAL" 2>/dev/null | sed 's/:$//' | sort -u)
GHOST_USED=$(grep -rohE -- 'var\(--bd-[a-z0-9-]+' \
  packages/editor/src/shared/ui \
  packages/editor/src/editor \
  packages/editor/src/shared/forms \
  packages/editor/src/ai \
  packages/editor/src/features/design-system/ui \
  packages/editor/src/themes/components.css \
  packages/editor/src/themes/ux-fixes.css \
  2>/dev/null | sed 's/var(//' | sort -u)
GHOSTS=$(comm -23 <(printf '%s\n' "$GHOST_USED") <(printf '%s\n' "$GHOST_DEFINED") | sed '/^$/d')
if [ -n "$GHOSTS" ]; then
  echo "Ghost --bd-* aliases (referenced but not defined in $CANONICAL):"
  printf '%s\n' "$GHOSTS" | while IFS= read -r ghost; do
    [ -z "$ghost" ] && continue
    echo "  $ghost — first 3 consumers:"
    grep -rn "var(${ghost}" \
      packages/editor/src/shared/ui \
      packages/editor/src/editor \
      packages/editor/src/shared/forms \
      packages/editor/src/ai \
      packages/editor/src/features/design-system/ui \
      packages/editor/src/themes/components.css \
      packages/editor/src/themes/ux-fixes.css \
      2>/dev/null | head -3 | sed 's/^/    /'
  done
  fail "Gate 17: ghost --bd-* aliases (define in bd-aliases.css or remove from consumer)"
fi
pass "Gate 17: zero ghost --bd-* aliases"

# Gate 16: Editor-scoped hex regression gate (added 2026-04-25, renamed 2026-04-25).
# Mode: REGRESSION (compares against scripts/.hex-baseline-editor — fails if count
#       rises above baseline; 0-tolerance ERROR mode requires --fail flag instead).
# Narrower scope than Gate 10 (full chrome WARN mode):
#   - Only scans packages/editor/src/editor/** (excludes shared/ui, shared/forms,
#     ai, features/design-system/ui).
#   - Excludes editor/inspector/** (mid-flight port, joins gate later).
#   - Excludes var(--X, #HEX) fallback-position hex (defensive defaults, not drift).
# New hex in editor/** non-inspector code paths cannot ship without tokenization
# or explicit @lint-hex-policy: marker — count cannot rise above baseline.
# TODO: when baseline reaches 0, flip the invocation below to add --fail and
#       upgrade gate name to "Gate 16: editor-scoped hex ERROR mode (zero tolerance)".
if ! node packages/editor/scripts/find-inline-hex-v2.mjs --editor-only --exclude-fallback >/dev/null 2>&1; then
  echo "GATE 16 FAIL: editor/** (excluding inspector/) hex count regressed above baseline"
  echo "Run 'node packages/editor/scripts/find-inline-hex-v2.mjs --editor-only --exclude-fallback --group-by-value' to see details"
  exit 1
fi
pass "Gate 16: editor-scoped hex at or below baseline (REGRESSION mode)"

# Gate 18: No banned Tailwind/indigo/violet/purple bleed (added 2026-04-26 after
# H1-H4 cleanup. Extended 2026-04-26 with C1-C4 Tailwind blue migration).
# Bans:
#   - Indigo/blue-700/blue-800/indigo-600 hex (original H-arc):
#     #1D4ED8, #1E40AF, #4F46E5
#   - Tailwind blue palette hex (C-arc 2026-04-26):
#     #EFF6FF (blue-50), #DBEAFE (blue-100), #BFDBFE (blue-200),
#     #60A5FA (blue-400), #3B82F6 (blue-500), #2563EB (blue-600),
#     #1E3A8A (blue-900)
#   - Tailwind indigo palette hex (D-arc 2026-04-26):
#     #E0E7FF (indigo-100), #C7D2FE (indigo-200), #A5B4FC (indigo-300),
#     #818CF8 (indigo-400), #6366F1 (indigo-500)
#   - Tailwind violet + lavender + custom violet hex (E-arc 2026-04-26):
#     #8B5CF6 (violet-500), #7C3AED (violet-600), #7C6DFA (lavender —
#     legacy pre-cobalt accent), #9D6FFF (custom violet variant)
#   - Tailwind blue + azure + indigo + violet rgba families:
#     rgba(0, 163, 255, x)    — azure (legacy editor accent)
#     rgba(37, 99, 235, x)    — blue-600 alpha
#     rgba(59, 130, 246, x)   — blue-500 alpha
#     rgba(99, 102, 241, x)   — indigo-500 alpha (D-arc)
#     rgba(129, 140, 248, x)  — indigo-400 alpha (D-arc)
#     rgba(124, 109, 250, x)  — lavender alpha (E-arc)
#     rgba(139, 92, 246, x)   — violet-500 alpha (E-arc)
#     rgba(168, 85, 247, x)   — purple-500 alpha (E-arc)
#   - Words: indigo, violet, purple (case-insensitive, word-boundary).
# Canonical accent: --buildrick-accent #2D6DFF (cobalt). See color.css:33-37.
# Allowlist (paths with legitimate non-chrome usage):
#   Original (H-arc):
#     shared/utils/parsers/colorTypes.ts          — CSS color-name parser data
#     shared/utils/devLogger.ts                   — dev tool log color ramp
#     engine/collaboration/CollaborationManager.ts — collab cursor colors
#     engine/canvas/constants.ts                  — canvas debug overlay comments
#     features/design-system/ui/modals/AddTokenModal.tsx — placeholder hint
#     editor/sidebar/tabs/media/components/StockSourceModal.tsx — stock photo
#                                                                  color filter
#     editor/sidebar/tabs/media/data/mediaTypes.ts — stock filter type union
#   Extended (C-arc 2026-04-26 — user-facing token displays / published HTML):
#     blocks/Ecommerce/                — published HTML for user's website
#     features/design-system/           — user design system token UI
#     themes/design-system/design.css   — user design token defaults
#     shared/forms/ColorField.tsx       — color picker preset palette
#     shared/ui/index.tsx               — doc/example strings
#     shared/constants/config.ts        — USER ELEMENT_COLOR / PRIMARY_COLOR
#     ai/ColorPalette.tsx               — color picker initial state
#     editor/collaboration/PresenceIndicators.tsx — user avatar palette
#     editor/ecommerce/CollectionSetupModal.tsx   — collection accent
#     editor/sidebar/tabs/templates/templatesData.ts — template HTML content
#     editor/canvas/overlays/MediaQuickActions.tsx — color swatch picker
#   Extended (E-arc 2026-04-26 — violet/lavender added):
#     blocks/Components/                — published HTML user blocks (Tabs, Modal)
#     shared/forms/GradientPicker.tsx   — gradient picker default-value example
#     engine/ai/PageGenerator.ts        — AI emits hex as user CSS-variable default
#   - **/__tests__/** + colocated *.test.ts — test fixtures
# History:
#   docs/ideation/2026-04-26-banned-color-cleanup.md  — H-arc (G1-H4)
#   docs/ideation/2026-04-26-tailwind-blue-migration.md — C-arc (C1-C6)
GATE18_RAW=$(grep -rniE '#1D4ED8|#1E40AF|#4F46E5|#EFF6FF|#DBEAFE|#BFDBFE|#60A5FA|#3B82F6|#2563EB|#1E3A8A|#E0E7FF|#C7D2FE|#A5B4FC|#818CF8|#6366F1|#8B5CF6|#7C3AED|#7C6DFA|#9D6FFF|rgba\(\s*(0,\s*163,\s*255|37,\s*99,\s*235|59,\s*130,\s*246|99,\s*102,\s*241|129,\s*140,\s*248|124,\s*109,\s*250|139,\s*92,\s*246|168,\s*85,\s*247)|\b(indigo|violet|purple)\b' packages/editor/src \
  --include='*.css' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
  --exclude-dir=__tests__ \
  --exclude-dir=project \
  --exclude-dir=node_modules \
  --exclude-dir=dist 2>/dev/null || true)
GATE18_VIOLATIONS=$(echo "$GATE18_RAW" | grep -vE \
  'shared/utils/parsers/colorTypes\.ts|shared/utils/devLogger\.ts|engine/collaboration/CollaborationManager\.ts|engine/canvas/constants\.ts|engine/ai/PageGenerator\.ts|features/design-system/|themes/design-system/design\.css|blocks/Ecommerce/|blocks/Components/|shared/forms/ColorField\.tsx|shared/forms/GradientPicker\.tsx|shared/ui/index\.tsx|shared/constants/config\.ts|ai/ColorPalette\.tsx|editor/collaboration/PresenceIndicators\.tsx|editor/ecommerce/CollectionSetupModal\.tsx|editor/sidebar/tabs/templates/templatesData\.ts|editor/canvas/overlays/MediaQuickActions\.tsx|editor/sidebar/tabs/media/components/StockSourceModal\.tsx|editor/sidebar/tabs/media/data/mediaTypes\.ts|\.test\.ts' \
  | grep -v '^$' || true)
if [ -n "$GATE18_VIOLATIONS" ]; then
  echo "$GATE18_VIOLATIONS" | head -20
  echo ""
  echo "Gate 18 explanation: cobalt --buildrick-accent (#2D6DFF) is the canonical accent."
  echo "Banned: stale Tailwind blue/indigo/purple hex + Tailwind blue/azure rgba families"
  echo "        + indigo/violet/purple words in chrome paths."
  echo "If your case is legitimate (debug tooling, color-name parser, user-facing"
  echo "stock filter, user design tokens, published HTML, etc.), add the path to the"
  echo "allowlist in this gate's grep -vE."
  echo "See docs/ideation/2026-04-26-tailwind-blue-migration.md for C-arc cleanup history."
  fail "Gate 18: banned Tailwind/indigo/violet/purple bleed"
fi
pass "Gate 18: no banned Tailwind/indigo/violet/purple bleed"

# Gate 19: No bdr-* class leaks in editor source
# Vibcoder vendoring renames bdr-* CLASSES → bd-* via codemod 1. Any class
# survivor is either a missed codemod pass or a hand-written regression.
# Excludes project/ (designer-facing reference snapshots, not runtime).
# Excludes CSS comments (documentation of original component names is expected).
# Excludes --bdr-* CSS CUSTOM PROPERTIES — codemod 1 intentionally leaves these
# untouched (vibcoder's API contract for value threading, e.g.,
# --bdr-progress-value in atoms/progress.css). Wrappers must reference the
# vendored custom-prop name verbatim. (Added Phase 1 Batch 4 — first atom that
# exercises this contract was progress; pre-batch atoms had no value-threading.)
LEAK=$(grep -rE 'bdr-[a-z0-9_-]+' packages/editor/src --include='*.css' --include='*.tsx' --include='*.ts' --exclude-dir=project 2>/dev/null \
  | grep -vE ':[[:space:]]*/?\*|//' \
  | grep -vE -- '--bdr-' \
  || true)
if [ -n "$LEAK" ]; then
  echo "$LEAK"
  fail "Gate 19: bdr-* class leak (codemod 1 not applied or hand-written regression)"
fi
pass "Gate 19: no bdr-* class leaks"

# Gate 21: No new vibcoder-shape token defs in chrome source
# Vibcoder uses --buildrick-color-* / --buildrick-color-fg-* shapes.
# Buildrik canonical is --buildrick-bg-* / --buildrick-fg-*. New defs
# in vibcoder shape mean someone bypassed codemod 2.
LEAK=$(grep -rE '^\s*--buildrick-(color|color-fg|color-bg)-[a-z0-9-]+\s*:' packages/editor/src --include='*.css' --exclude-dir=components --exclude-dir=project 2>/dev/null || true)
if [ -n "$LEAK" ]; then
  echo "$LEAK"
  fail "Gate 21: vibcoder-shape token def in non-vendored CSS (bypass of codemod 2)"
fi
pass "Gate 21: no vibcoder-shape defs outside vendored components"

echo ""
echo "=== DS V1 gates: 13 passed + 4 chrome-axiom gates at baseline + green-panel check ==="
