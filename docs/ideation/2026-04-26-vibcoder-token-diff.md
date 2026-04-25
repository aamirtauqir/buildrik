# Vibcoder Token Diff — Mechanical Diff vs Shipped DS

**Generated:** 2026-04-26
**Plan:** `~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-vibcoder-integration-20260425-235606.md` (v2 + Pass 5 edits)
**Vibcoder source:** `docs/reference/vibcoder/reference/` (relocated 2026-04-26 from `packages/editor/src/project/vibcoder/reference/`)
**Shipped target:** `packages/editor/src/themes/design-system/`

This doc grounds Plan v2 Step 2 (mechanical diff). Each row enumerates a token-level decision per Pass 5 review findings (verified 2026-04-26, /plan-design-review run).

---

## Summary

| File           | Status               | Folds | Decisions needed                                    |
|----------------|----------------------|------:|-----------------------------------------------------|
| a11y.css       | SKIP (values overlap)|     0 | Q7 RESOLVED — vibcoder is older + thinner          |
| color.css      | ADDITIVE +38         |    11 | Q8 per-tier sign-off (11 tier batches)              |
| layout.css     | CONFLICT (gated)     |     2 | Q3 chrome-ssot Stage 2+3 (Stage 1 LANDED 2026-04-26)|
| motion.css     | ADDITIVE +1 alias    |     1 | Trivial — no vocab add                              |
| radius.css     | ADDITIVE +5 tiers    |     5 | Q8 per-tier sign-off (5 tier decisions)             |
| shadow.css     | REFACTOR (0 net)     |     2 | Trivial — literal→alias indirection only            |
| spacing.css    | IDENTICAL            |     0 | None                                                |
| typography.css | CONFLICT + ADDITIVE  |     5 | Q6 RESOLVED (LEAVE display) + Q8 (5 dense-scale)    |
| z-index.css    | ADDITIVE +1 tier     |     1 | Q8 per-tier sign-off (drawer 250)                   |
| design.css     | OUT OF SCOPE         |     - | Per Issue 2A SKIP — canvas scope, not chrome        |

**Total fold candidates:** 27 token-folds across 7 files (excluding a11y SKIP, spacing IDENTICAL, design OOS, layout gated).
**Net new tokens:** 50 (color 38 + typography 5 + radius 5 + z-index 1 + motion 1 alias).

---

## a11y.css — SKIP (Q7 RESOLVED 2026-04-26)

**Decision:** SKIP vibcoder a11y.css from fold list. Cherry-pick verified zero delta.

**Verification:** Vibcoder `@media (prefers-contrast: high)` block defines:
```css
--buildrick-border: #64748B;
--buildrick-border-light: #94A3B8;
```
Shipped a11y.css lines 14-15 already define these exact values. ZERO delta in border tokens.

Vibcoder `.bdr-btn`/`.bdr-input`/`.bdr-select`/`.bdr-textarea` selectors use BEM `bdr-*` prefix. Shipped uses `.buildrick-btn` etc. Per Plan v2 Premise 3, on-demand component port renames `bdr-X` → `bd-{domain}-X`. So vibcoder's BEM selectors don't fold; they're transformed at port time.

Shipped a11y.css has +65 lines vibcoder lacks: focus rings using `var(--bd-accent)`, skip link with `var(--bd-fg-on-accent)` + `var(--buildrick-z-max)`, print styles. All migrated from `themes/ux-fixes.css` 2026-04-25. These are NEWER than vibcoder snapshot.

**Action:** No fold. No edit to shipped a11y.css.

---

## color.css — ADDITIVE +38 NET-NEW TOKENS (Q8 sign-off REQUIRED per tier)

Vibcoder color.css = shipped color.css + ~38 tokens organized into 11 named tiers under headers `DS V1 HARDENING (2026-04-25) — INK ALPHA RAMP` and `FINAL SWEEP TOKENS`. Each tier is a vocab decision per Open Q8.

**Tier 1 — Ink alpha ramp (12 tokens).** `--buildrick-ink-{04,06,08,10,12,15,18,20,25,30,32,40}` = `rgba(15, 23, 42, X)` at 12 alpha steps. Purpose: "Single source of truth for all rgba(15,23,42,X) literals across components." Tier-decision Q8: **do we adopt a 12-step ink ramp as canonical?** Recommend YES — replaces ad-hoc inline rgba.

**Tier 2 — Soft semantic tints (4 tokens).** `--buildrick-{accent,success,warning,error}-soft` at 0.12 alpha. Sits between `-tint` (0.10) and `-border` (0.30). Used for icon-on-surface backgrounds. Q8: **do we want a -soft tier in the semantic system?** Recommend YES — fills a real gap.

**Tier 3 — On-dark tints (4 tokens).** `--buildrick-on-dark-{10,12,15,40}` = `rgba(255, 255, 255, X)`. For tooltip / inverted surfaces / kbd inverted / code blocks. Q8: **do we adopt on-dark token ladder?** Recommend YES — currently inline rgba on inverted surfaces.

**Tier 4 — Accent alpha extras (3 tokens).** `--buildrick-accent-alpha-{025,04,08}` at extra-low alpha steps. Q8: **do we need 3 extra accent alpha steps below 0.10?** Recommend MAYBE — defer until first consumer surfaces. Skip from initial fold.

**Tier 5 — Status bg-strong (3 tokens).** `--buildrick-{success,warning,error}-bg-strong` at 0.18 alpha. For solid callout / banner surfaces. Q8: YES — banner spec needs this.

**Tier 6 — Ink mid-range (3 tokens).** `--buildrick-ink-{48,50,60}`. For label / placeholder / inverted-surface text on photo bg. Q8: YES — extends Tier 1 ramp.

**Tier 7 — Shadow black (2 tokens).** `--buildrick-shadow-black-{20,30}` = `rgba(0, 0, 0, X)`. Drop shadows that should NOT inherit ink color shift. Q8: YES — shadows are pure black, not ink slate.

**Tier 8 — Highlight mark (1 token).** `--buildrick-highlight-mark` = `rgba(250, 204, 21, 0.35)` (yellow text-highlighter). Q8: YES — non-semantic, brand-safe.

**Tier 9 — Status bg-light (3 tokens).** `--buildrick-{success,warning,error}-bg-light` at 0.08 alpha. Softer than `-light` (0.10). For toast / diff-add / inline alerts. Q8: YES — toast needs this.

**Tier 10 — Status border-soft (3 tokens).** `--buildrick-{success,warning,error}-border-soft` at 0.15 alpha. Softer than `-border` (0.30). For toast banners. Q8: YES — pairs with bg-light Tier 9.

**Tier 11 — Amber-soft (1 token).** `--buildrick-amber-soft` = `rgba(245, 158, 11, 0.30)` distinct from `--buildrick-warning` (217,119,6). Used for search-match highlight. Q8: MAYBE — separate amber from warning is real; defer until first consumer.

**Stage-dark (1 token).** `--buildrick-stage-dark` = `#1E293B` (slate-800). Comment says "dark demo backdrop only; do not use in chrome." Q8: SKIP — explicit out-of-chrome use.

**Tier 12 — Literal→alias indirections (8 tokens).** Vibcoder converts shipped literal values to var() aliases:
- `--buildrick-text-tertiary: var(--buildrick-text-muted)` (vs literal `#94A3B8`)
- `--buildrick-info: var(--buildrick-accent)` (vs literal `#2D6DFF`)
- `--buildrick-amber-light: var(--buildrick-warning-light)` (vs literal rgba)
- `--buildrick-emerald-light: var(--buildrick-success-light)` (same)
- `--buildrick-amber-border: var(--buildrick-warning-border)` (same)
- `--buildrick-emerald-border: var(--buildrick-success-border)` (same)
- `--buildrick-canvas-wrapper: var(--buildrick-bg-panel)` (vs literal)
- `--buildrick-destructive: var(--buildrick-error)` (vs literal)
- `--buildrick-input-ring-error: var(--buildrick-error-light)` (same)
- `--buildrick-success-bg: var(--buildrick-success-light)` (same)
- `--buildrick-status-synced: var(--buildrick-success)` (same)
- `--buildrick-danger-bg: var(--buildrick-error-bg)` (same)
- `--buildrick-border-default: var(--buildrick-border-medium)` (same)

Per Q8 commit-body rule: `vocab-add: <name> | tier=alias-only | design-md=no-change-required: literal replaced with alias, same resolved value | ack=SG`. Pure refactor.

**Action:** 11 fold commits (or one batched commit per tier group), each citing Q8 ack rule.

---

## layout.css — CONFLICT (gated on chrome-ssot Stage 2+3)

Vibcoder ships:
```css
--buildrick-sidebar-width: 56px;
--buildrick-sidebar-panel-width: 320px;
```
Shipped DS (after Stage 1 LANDED 2026-04-26) ships:
```css
--buildrick-sidebar-width: 48px;          /* Stage 3 will move to 60 */
--buildrick-sidebar-panel-width: 280px;   /* Stage 2 will split: 240 nav / 320 authoring */
```
Chrome-ssot doc (`docs/ideation/2026-04-25-chrome-ssot-convergence.md`) Option C path:
- Stage 1 (vertical) — topbar 48→56, footer 32→40 — **LANDED 2026-04-26 this session**
- Stage 2 (sidebar) — drawer 280 → 240 nav / 320 authoring — DEFERRED
- Stage 3 (rail + inspector) — rail 48→60, inspector 280→320 — DEFERRED

After Stages 2+3: shipped will be `60/240(nav)/320(authoring)`. Vibcoder's `56/320` STILL doesn't match (vibcoder rail is 56 not 60; vibcoder doesn't split nav/authoring panel widths). Vibcoder layout.css fold remains DEFERRED indefinitely; shipped DS becomes more granular than vibcoder, not less.

**Action:** No fold today. Re-evaluate after Stage 3 lands.

---

## motion.css — ADDITIVE +1 alias (TRIVIAL)

Vibcoder adds:
```css
--buildrick-duration-default: var(--buildrick-duration-normal);
```
Pure alias. Same resolved value (180ms). No vocab add.

**Action:** Single fold commit. Q8 body line: `vocab-add: --buildrick-duration-default | tier=alias-only | design-md=no-change-required: alias of duration-normal | ack=SG`.

---

## radius.css — ADDITIVE +5 NEW TIERS (Q8 sign-off REQUIRED)

Vibcoder adds:
- `--buildrick-radius-2xs: 2px` — sub-md tier for ultra-tight rounding
- `--buildrick-radius-xs: 3px` — between 2xs and sm
- `--buildrick-radius-2xl: 20px` — above xl (16px)
- `--buildrick-radius-circle: 50%` — circular shapes (avatar, dot indicators)
- `--buildrick-radius-md-plus: 10px` — between md (8) and lg (12), used by panels/cards/inspectors

Each tier is a vocab decision. DESIGN.md A1.3 currently lists `sm: 4px / md: 8px / lg: 12px / full: 9999px`. Adding 5 tiers expands to `2xs: 2px / xs: 3px / sm: 4px / md: 8px / md-plus: 10px / lg: 12px / xl: 16px / 2xl: 20px / full: 9999px / circle: 50%` (10 tiers).

Q8 designer call needed per tier:
- 2xs (2px): rare; for inputs/checkboxes. **Decide: adopt or skip.**
- xs (3px): even rarer. **Decide: adopt or skip.**
- 2xl (20px): for large modals/cards. **Decide: adopt or use lg+border.**
- circle (50%): real need (avatar, dots). **Recommend: ADOPT.**
- md-plus (10px): "off-grid radius for panels/cards/inspectors" per vibcoder. Breaks the 4/8/12/16/20 doubling pattern. **Decide: adopt the off-grid OR keep 8px doubling rule.**

**Action:** 5 fold commits OR one batched. Each cites Q8 ack rule + DESIGN.md A1.3 update.

---

## shadow.css — REFACTOR ONLY (0 net tokens)

Vibcoder converts 2 shipped literals to aliases:
- `--buildrick-shadow-dropdown: var(--buildrick-shadow-md)` (vs literal `0 4px 12px ...`)
- `--buildrick-shadow-accent: var(--buildrick-glow-primary)` (vs literal `0 0 0 3px ...`)

Same resolved values. Pure cleanup.

**Action:** Single fold commit. Q8 body line: `vocab-add: --buildrick-shadow-{dropdown,accent} | tier=alias-only | design-md=no-change-required: aliases of shadow-md and glow-primary, same resolved values | ack=SG`.

---

## spacing.css — IDENTICAL

No diff. No fold needed.

---

## typography.css — CONFLICT + ADDITIVE (Q6 RESOLVED, Q8 needed for dense scale)

**CONFLICT 1 — display family (Q6 RESOLVED 2026-04-26 = LEAVE):**
- Vibcoder: `--buildrick-font-family-display: "General Sans", sans-serif;`
- Shipped: `--buildrick-font-family-display: "Inter Tight", system-ui, sans-serif;`
- **Decision:** KEEP Inter Tight. Vibcoder spec deviates on this row. Plan v2 line 287 OOS holds. No fold.

**CONFLICT 2 — font-family fallback chains:**
- Vibcoder: `"Inter Tight", sans-serif` and `"Geist Mono", monospace`
- Shipped: `"Inter Tight", system-ui, -apple-system, sans-serif` and `"Geist Mono", "SF Mono", Menlo, monospace`
- Vibcoder dropped `system-ui, -apple-system` (cleaner anti-slop per CLAUDE.md "no default font stacks") AND dropped mono fallbacks.
- **Decision:** KEEP shipped fallbacks. CLAUDE.md anti-slop rule applies to PRIMARY fonts; system-ui as ultimate fallback (after Inter Tight loaded) is defensive, not slop. No fold.

**ADDITIVE — Dense scale (5 new tiers, Q8 sign-off REQUIRED):**
- `--buildrick-text-3xs: 9px` — rail kbd, micro labels
- `--buildrick-text-3xs-plus: 9.5px` — dense list secondary (cmd palette meta)
- `--buildrick-text-xs-plus: 11.5px` — card body secondary, popover content
- `--buildrick-text-sm-half: 12.5px` — section heads in dense panels
- `--buildrick-text-md-half: 13.5px` — button labels in dense contexts

Vibcoder's COMPONENTS.md:35 explicitly calls this "dense scale, use sparingly." Q8 designer call needed:
- **Decide: adopt 9px/9.5px tier? CLAUDE.md typography baseline says no body text < 16px... but these are LABELS, not body. UI labels under 11px have a11y risk.**
- **Decide: adopt half-step sizes (.5px increments)? Breaks the integer grid; off-grid by design.**

**Action:** 5 fold commits for dense scale. Q6 conflict rows = NO FOLD (LEAVE).

---

## z-index.css — ADDITIVE +1 NEW TIER (Q8 sign-off)

Vibcoder adds:
```css
--buildrick-z-drawer: 250;  /* between popover (200) and modal (300) */
```

Q8 designer call: **do we want a z-tier between popover and modal for drawers?** Vibcoder uses for the asset-library drawer + pages-drawer. Currently shipped drawer surfaces use modal z-tier (300), which is higher than needed.

Recommend ADOPT. Drawer is conceptually less-foregrounded than modal but more than popover. Tier fills a real gap.

**Action:** Single fold commit. Q8 body: `vocab-add: --buildrick-z-drawer | tier=250 (between popover 200 and modal 300) | design-md=z-index ladder section update | ack=SG`.

---

## design.css — OUT OF SCOPE (Issue 2A SKIP)

Vibcoder reference/design.css scope = user-editable site-builder tokens. Plan v2 Issue 2A explicitly skips per "canvas scope, not chrome." Shipped `themes/design-system/design.css` is the canonical user-site-tokens file, mutated at runtime via `useTokenBase`/`useColorTokens`/`useSpacingTokens`/`useTypeTokens` hooks. Vibcoder's snapshot of these is reference-only.

**Action:** No fold. Not part of bridge phase.

---

## Diff command (for re-verification)

This doc was hand-annotated against verified file contents 2026-04-26. To regenerate raw diff:

```bash
set -euo pipefail
SHIPPED=packages/editor/src/themes/design-system
VIBCODER=docs/reference/vibcoder/reference
for f in a11y color layout motion radius shadow spacing typography z-index; do
  [ -f "$SHIPPED/$f.css" ]  || { echo "MISSING $SHIPPED/$f.css";  exit 1; }
  [ -f "$VIBCODER/$f.css" ] || { echo "MISSING $VIBCODER/$f.css"; exit 1; }
done

{
  for f in a11y color layout motion radius shadow spacing typography z-index; do
    echo "=== $f.css ==="
    diff -u "$SHIPPED/$f.css" "$VIBCODER/$f.css" || true
  done
} > /tmp/vibcoder-token-diff-raw.md
```

Compare against this doc's annotations. Any new delta = bundle re-drop happened; re-annotate.

---

## Cross-reference

- Plan v2: `~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-vibcoder-integration-20260425-235606.md`
- Pass 5 review: same plan, sections "Pass 5 (Design System Alignment) — Review Findings"
- Open Questions Q6/Q7/Q8: same plan
- Chrome-ssot decision: `docs/ideation/2026-04-25-chrome-ssot-convergence.md` (Option C, Stage 1 landed 2026-04-26)
- TODOS.md: "Vibcoder DS Bridge (2026-04-26)" section
