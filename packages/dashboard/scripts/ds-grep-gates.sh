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
# Gate D3 — --color-primary must be the brand accent.
# #406ED6 since the 2026-07-18 single-product-accent flip (DESIGN.md L26:
# "#406ED6 is the single accent ... across dashboard + auth + onboarding").
# Editor chrome keeps cobalt #2D6DFF in its own DS — separate migration, not
# guarded here. This gate guarded #2D6DFF from 2026-07-13 and was not updated
# when the accent flipped, so it went red on 07-18 and blocked every push after
# it. DESIGN.md is the SSOT; when they disagree, the gate is what's stale.
# ─────────────────────────────────────────────────────────────
if ! grep -qE "^\s*--color-primary:\s*#406ED6\s*;" packages/dashboard/app/globals.css 2>/dev/null; then
  echo "GATE FAIL: D3 — --color-primary in globals.css must be #406ED6 (DESIGN.md L26)"
  grep -nE "^\s*--color-primary:" packages/dashboard/app/globals.css 2>/dev/null
  exit 1
fi
pass "D3: --color-primary = #406ED6 (DESIGN.md single product accent)"

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
# globals.css must define --sidebar-w + --topnav-h. dashboard-shell.tsx sizes
# the whole app off them (`lg:ml-[var(--sidebar-w)]`, `pt-[var(--topnav-h)]`),
# so deletion would silently break layout.
#
# Guarded --sidebar-width/--topbar-height until 2026-07-20 — names that had been
# renamed, so the grep matched nothing. `grep -c` exits 1 on zero matches, so
# `|| echo 0` appended a second "0" to grep's own "0"; D5_COUNT became "0\n0",
# `[ -lt ]` errored, and a failed test read as a pass. The gate reported PASS
# while its invariant was unverifiable. Count with grep -o | wc -l, which does
# not need the || fallback.
# ─────────────────────────────────────────────────────────────
D5_COUNT=$(grep -oE "^\s*--(sidebar-w|topnav-h):" packages/dashboard/app/globals.css 2>/dev/null | wc -l | tr -d ' ')
if [ "${D5_COUNT:-0}" -lt 2 ]; then
  echo "GATE FAIL: D5 — globals.css must define --sidebar-w + --topnav-h (found ${D5_COUNT:-0}/2)"
  exit 1
fi
pass "D5: layout tokens --sidebar-w + --topnav-h present"

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

# ─────────────────────────────────────────────────────────────
# Gate D7 — Zero-tolerance for hardcoded token-backed hex in tsx/ts chrome.
# Every consumer must reference var(--color-*) (or Tailwind text-primary/bg-primary
# style mapped class), never hardcoded hex. Codemod ran 2026-05-24:
#   - 266 brand red (#E42313)            → var(--color-primary)
#   - 1383 slate-neutral palette         → var(--color-text-*/border-*/bg-*)
#   - 38 semantic (success/warning/info) → var(--color-success/warning/info)
# Total drained: 1687 occurrences. Locked at 0 going forward.
# emails/ excepted (email clients have no CSS-var support).
# globals.css excepted (canonical token definition site).
# ─────────────────────────────────────────────────────────────
D7_HEX_PATTERN="#(E42313|7A7A7A|0D0D0D|E8E8E8|F4F4F4|B0B0B0|FAFAFA|D4D4D4|22C55E|EA580C|7a7a7a|0d0d0d|e8e8e8|f4f4f4|b0b0b0|fafafa|d4d4d4|22c55e|ea580c)"
D7_HITS=$(grep -rEn "$D7_HEX_PATTERN" packages/dashboard \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "/node_modules/" \
  | grep -v "/.next/" \
  | grep -v "/emails/" \
  | wc -l | tr -d ' ')
if [ "$D7_HITS" -gt 0 ]; then
  echo "GATE FAIL: D7 — $D7_HITS hardcoded token-backed hex in dashboard chrome tsx/ts (use var(--color-*) or token classes)"
  grep -rEn "$D7_HEX_PATTERN" packages/dashboard \
    --include="*.tsx" --include="*.ts" 2>/dev/null \
    | grep -v "/node_modules/" \
    | grep -v "/.next/" \
    | grep -v "/emails/" \
    | head -5
  exit 1
fi
pass "D7: no hardcoded token-backed hex in dashboard chrome tsx/ts (emails + globals.css exempt)"

echo
echo "=== Dashboard DS gates: 7 passed ==="
