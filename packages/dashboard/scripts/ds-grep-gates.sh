#!/usr/bin/env bash
# Buildrik Dashboard DS gates (2026-05-24).
#
# Mirrors editor's `ds-grep-gates.sh` pattern but scoped to dashboard chrome.
# Dashboard runs a different surface than editor (DESIGN.md two-accent rule —
# dashboard chrome IS red, editor chrome IS cobalt) so its gate set differs.
#
# Run: bash packages/dashboard/scripts/ds-grep-gates.sh
# @license BSD-3-Clause

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../../.."

fail() { echo "GATE FAIL: $1"; exit 1; }
pass() { echo "  PASS: $1"; }

echo "=== Buildrik Dashboard DS gates ==="

# ─────────────────────────────────────────────────────────────
# Gate D1 — No banned font fallbacks in dashboard chrome.
# DESIGN.md L48: "No system-ui. No -apple-system. No Roboto/Helvetica/Arial/Segoe UI."
# Email templates exempt — email clients have no font loader, system-ui necessary.
# ─────────────────────────────────────────────────────────────
D1_HITS=$(grep -rEn "system-ui|-apple-system|BlinkMacSystemFont|Segoe UI|Roboto|Helvetica|Arial" \
  packages/dashboard --include="*.tsx" --include="*.ts" --include="*.css" 2>/dev/null \
  | grep -v "/node_modules/" \
  | grep -v "/.next/" \
  | grep -v "/emails/" \
  | wc -l | tr -d ' ')
if [ "$D1_HITS" -gt 0 ]; then
  echo "GATE FAIL: D1 — $D1_HITS banned font fallback(s) in dashboard chrome (emails exempt)"
  grep -rEn "system-ui|-apple-system|BlinkMacSystemFont|Segoe UI|Roboto|Helvetica|Arial" \
    packages/dashboard --include="*.tsx" --include="*.ts" --include="*.css" 2>/dev/null \
    | grep -v "/node_modules/" \
    | grep -v "/.next/" \
    | grep -v "/emails/" \
    | head -5
  exit 1
fi
pass "D1: no banned font fallbacks in dashboard chrome (emails exempt)"

# ─────────────────────────────────────────────────────────────
# Gate D2 — No purple/violet/indigo bleed in dashboard chrome.
# DESIGN.md anti-slop rule #2 + Gate 18 (editor). Two-accent system mandates
# dashboard chrome stays red+slate+cobalt-decoration only.
# Exempt: settings/profile-form.tsx (user avatar color palette = user content).
# ─────────────────────────────────────────────────────────────
D2_HITS=$(grep -rEni "purple|violet|indigo|#7c3aed|#a855f7|#8b5cf6|#6366f1|#4f46e5" \
  packages/dashboard --include="*.tsx" --include="*.ts" --include="*.css" 2>/dev/null \
  | grep -v "/node_modules/" \
  | grep -v "/.next/" \
  | grep -v "components/settings/profile-form.tsx" \
  | wc -l | tr -d ' ')
if [ "$D2_HITS" -gt 0 ]; then
  echo "GATE FAIL: D2 — $D2_HITS purple/violet/indigo bleed in dashboard chrome"
  grep -rEni "purple|violet|indigo|#7c3aed|#a855f7|#8b5cf6|#6366f1|#4f46e5" \
    packages/dashboard --include="*.tsx" --include="*.ts" --include="*.css" 2>/dev/null \
    | grep -v "/node_modules/" \
    | grep -v "/.next/" \
    | grep -v "components/settings/profile-form.tsx" \
    | head -5
  exit 1
fi
pass "D2: no purple/violet/indigo bleed in dashboard chrome"

# ─────────────────────────────────────────────────────────────
# Gate D3 — --color-primary must be the brand red.
# DESIGN.md L15-17: dashboard chrome CTA = #E42313 red. Sentinel for accidental
# rebrand (e.g. someone copy-pasting cobalt config from editor).
# ─────────────────────────────────────────────────────────────
if ! grep -qE "^\s*--color-primary:\s*#E42313\s*;" packages/dashboard/app/globals.css 2>/dev/null; then
  echo "GATE FAIL: D3 — --color-primary in globals.css must be #E42313 (DESIGN.md L15)"
  grep -nE "^\s*--color-primary:" packages/dashboard/app/globals.css 2>/dev/null
  exit 1
fi
pass "D3: --color-primary = #E42313 (DESIGN.md two-accent dashboard red)"

# ─────────────────────────────────────────────────────────────
# Gate D4 — NO BLACK rule.
# DESIGN.md L35-44: no #000, #0a0a0a, #14141f, #1F2937 as surface/text/border.
# Editor enforces strictly. Dashboard chrome also avoids near-black surfaces.
# Email templates exempt.
# ─────────────────────────────────────────────────────────────
D4_HITS=$(grep -rEni "#000[^0-9a-f]|#0a0a0a|#14141f|#1f2937" \
  packages/dashboard --include="*.tsx" --include="*.ts" --include="*.css" 2>/dev/null \
  | grep -v "/node_modules/" \
  | grep -v "/.next/" \
  | grep -v "/emails/" \
  | wc -l | tr -d ' ')
if [ "$D4_HITS" -gt 0 ]; then
  echo "GATE FAIL: D4 — $D4_HITS NO-BLACK violation(s) in dashboard chrome (emails exempt)"
  grep -rEni "#000[^0-9a-f]|#0a0a0a|#14141f|#1f2937" \
    packages/dashboard --include="*.tsx" --include="*.ts" --include="*.css" 2>/dev/null \
    | grep -v "/node_modules/" \
    | grep -v "/.next/" \
    | grep -v "/emails/" \
    | head -5
  exit 1
fi
pass "D4: no NO-BLACK violations in dashboard chrome (emails exempt)"

# ─────────────────────────────────────────────────────────────
# Gate D5 — Layout token sentinel.
# globals.css must define --sidebar-width + --topbar-height. Used by dashboard
# shell. Deletion would silently break layout.
# ─────────────────────────────────────────────────────────────
D5_COUNT=$(grep -cE "^\s*--(sidebar-width|topbar-height):" packages/dashboard/app/globals.css 2>/dev/null || echo 0)
if [ "$D5_COUNT" -lt 2 ]; then
  echo "GATE FAIL: D5 — globals.css must define --sidebar-width + --topbar-height (found $D5_COUNT/2)"
  exit 1
fi
pass "D5: layout tokens --sidebar-width + --topbar-height present"

# ─────────────────────────────────────────────────────────────
# Gate D6 — @theme block sentinel.
# Tailwind v4 reads tokens from @theme directive. Removal breaks all
# token-bound classes. Sentinel against accidental deletion.
# ─────────────────────────────────────────────────────────────
if ! grep -qE "^@theme" packages/dashboard/app/globals.css 2>/dev/null; then
  echo "GATE FAIL: D6 — globals.css must contain @theme directive (Tailwind v4 token source)"
  exit 1
fi
pass "D6: @theme block present in globals.css"

echo
echo "=== Dashboard DS gates: 6 passed ==="
