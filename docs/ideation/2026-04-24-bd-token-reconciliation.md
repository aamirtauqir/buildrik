# `--bd-*` Token Reconciliation — P0a Gating Artifact

Date: 2026-04-24
Owner: shahg
Branch: main
References: `~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-ds-implementation-20260424-214519.md` (v3 APPROVED)

## Purpose

Gate for P0a of the design-system port plan: delete `src/themes/bridge-tokens.css` WITHOUT breaking the shipped editor shell. Every `--bd-*` token in bridge-tokens must either (a) already resolve to the same computed value via `bd-aliases.css`, or (b) have a named remediation before delete.

## Cascade context

`src/editor/shell/AquibraStudio.tsx` imports CSS in this order:
1. `themes/default.css` → loads `design-system/index.css` → loads `bd-aliases.css`
2. `themes/bridge-tokens.css`
3. `themes/ux-fixes.css`
4. `new-design/chrome.css` (and friends)

Because bridge-tokens loads AFTER bd-aliases, bridge's literal values win the cascade for every overlapping `--bd-*` name. After deletion, each `--bd-*` resolves through bd-aliases to `--buildrick-*` canonical. Reconciliation verifies that the resolved value matches bridge's literal.

## Counts

- bridge-tokens.css: **77** `--bd-*` definitions
- bd-aliases.css: **72** `--bd-*` definitions
- Delta (in bridge, NOT in bd-aliases): **5** (all `--bd-shell-*` layout tokens)

## Reconciliation Table

Legend:
- `✓` — bridge value and canonical resolution match. Safe delete.
- `!` — values differ or canonical missing. Named remediation required before delete.
- `→N` — see Remediation section below, item N.

### Surfaces (10)

| `--bd-*` | bridge value | bd-aliases target | canonical value | match? |
|---|---|---|---|---|
| `--bd-bg-panel` | `var(--buildrick-bg-panel)` | `var(--buildrick-bg-panel)` | `#F8FAFC` | ✓ |
| `--bd-bg-card` | `var(--buildrick-bg-card)` | `var(--buildrick-bg-card)` | `#FFFFFF` | ✓ |
| `--bd-bg-input` | `var(--buildrick-bg-input)` | `var(--buildrick-bg-input)` | `#FFFFFF` | ✓ |
| `--bd-bg-elevated` | `var(--buildrick-bg-elevated)` | `var(--buildrick-bg-elevated)` | `#FFFFFF` | ✓ |
| `--bd-bg-subtle` | `var(--buildrick-bg-subtle)` | `var(--buildrick-bg-subtle)` | `#F1F5F9` | ✓ |
| `--bd-bg-hover` | `var(--buildrick-bg-hover)` | `var(--buildrick-bg-hover)` | `rgba(15,23,42,0.04)` | ✓ |
| `--bd-bg-pressed` | `rgba(15, 23, 42, 0.06)` (literal) | `var(--buildrick-bg-pressed)` | `rgba(15, 23, 42, 0.06)` | ✓ |
| `--bd-canvas-wrapper` | `var(--buildrick-bg-panel)` | `var(--buildrick-canvas-wrapper)` | `#F8FAFC` | ✓ |
| `--bd-canvas-content` | `var(--buildrick-bg-card)` | `var(--buildrick-canvas-content)` | `#FFFFFF` | ✓ |
| `--bd-canvas-dot` | `rgba(15, 23, 42, 0.08)` (literal) | `var(--buildrick-canvas-dot)` | `rgba(15, 23, 42, 0.08)` | ✓ |

### Text (6)

| `--bd-*` | bridge value | bd-aliases target | canonical value | match? |
|---|---|---|---|---|
| `--bd-fg-primary` | `var(--buildrick-text-primary)` | `var(--buildrick-text-primary)` | `#334155` | ✓ |
| `--bd-fg-secondary` | `var(--buildrick-text-secondary)` | `var(--buildrick-text-secondary)` | `#64748B` | ✓ |
| `--bd-fg-muted` | `var(--buildrick-text-muted)` | `var(--buildrick-text-muted)` | `#94A3B8` | ✓ |
| `--bd-fg-disabled` | `#CBD5E1` (literal) | `var(--buildrick-text-disabled)` | `#CBD5E1` | ✓ |
| `--bd-fg-on-accent` | `var(--buildrick-text-on-accent)` | `var(--buildrick-text-on-accent)` | `#FFFFFF` | ✓ |
| `--bd-fg-heading` | `#0F172A` (literal) | `var(--buildrick-text-heading)` | `#0F172A` | ✓ |

### Borders (5)

| `--bd-*` | bridge value | bd-aliases target | canonical value | match? |
|---|---|---|---|---|
| `--bd-border` | `var(--buildrick-border)` | `var(--buildrick-border)` | `#E2E8F0` | ✓ |
| `--bd-border-medium` | `var(--buildrick-border-medium)` | `var(--buildrick-border-medium)` | `#CBD5E1` | ✓ |
| `--bd-border-strong` | `var(--buildrick-border-strong)` | `var(--buildrick-border-strong)` | `#94A3B8` | ✓ |
| `--bd-border-subtle` | `rgba(148, 163, 184, 0.24)` (literal) | `var(--buildrick-border-subtle)` | `rgba(148, 163, 184, 0.24)` | ✓ |
| `--bd-border-focus` | `var(--buildrick-border-focus)` | `var(--buildrick-border-focus)` | `#2D6DFF` | ✓ |

### Accent (6)

| `--bd-*` | bridge value | bd-aliases target | canonical value | match? |
|---|---|---|---|---|
| `--bd-accent` | `var(--buildrick-accent)` | `var(--buildrick-accent)` | `#2D6DFF` | ✓ |
| `--bd-accent-hover` | `var(--buildrick-accent-hover)` | `var(--buildrick-accent-hover)` | `#4B8DFF` | ✓ |
| `--bd-accent-pressed` | `var(--buildrick-accent-pressed)` | `var(--buildrick-accent-pressed)` | `#1E58D9` | ✓ |
| `--bd-accent-subtle` | `var(--buildrick-accent-subtle)` | `var(--buildrick-accent-subtle)` | `rgba(45,109,255,0.05)` | ✓ |
| `--bd-accent-tint` | `var(--buildrick-accent-tint)` | `var(--buildrick-accent-tint)` | `rgba(45,109,255,0.10)` | ✓ |
| `--bd-accent-alpha-15` | `rgba(45, 109, 255, 0.15)` (literal) | `var(--buildrick-primary-alpha-15)` | `rgba(45,109,255,0.15)` | ✓ |

### Status (12)

| `--bd-*` | bridge value | bd-aliases target | canonical value | match? |
|---|---|---|---|---|
| `--bd-error` | `var(--buildrick-error)` | `var(--buildrick-error)` | `#DC2626` | ✓ |
| `--bd-error-bg` | `var(--buildrick-error-bg)` | `var(--buildrick-error-bg)` | `rgba(220,38,38,0.05)` | ✓ |
| `--bd-error-tint` | `var(--buildrick-error-light)` | `var(--buildrick-error-light)` | `rgba(220,38,38,0.10)` | ✓ |
| `--bd-error-border` | `var(--buildrick-error-border)` | `var(--buildrick-error-border)` | `rgba(220,38,38,0.30)` | ✓ |
| `--bd-success` | `var(--buildrick-success)` | `var(--buildrick-success)` | `#16A34A` | ✓ |
| `--bd-success-bg` | `var(--buildrick-success-light)` | `var(--buildrick-success-bg)` | `rgba(22,163,74,0.10)` | ✓ (see note) |
| `--bd-success-border` | `var(--buildrick-success-border)` | `var(--buildrick-success-border)` | `rgba(22,163,74,0.30)` | ✓ |
| `--bd-warning` | `var(--buildrick-warning)` | `var(--buildrick-warning)` | `#D97706` | ✓ |
| `--bd-warning-bg` | `var(--buildrick-warning-bg)` | `var(--buildrick-warning-bg)` | `rgba(217,119,6,0.05)` | ✓ |
| `--bd-warning-tint` | `var(--buildrick-warning-light)` | `var(--buildrick-warning-light)` | `rgba(217,119,6,0.10)` | ✓ |
| `--bd-warning-border` | `var(--buildrick-warning-border)` | `var(--buildrick-warning-border)` | `rgba(217,119,6,0.30)` | ✓ |
| `--bd-info` | `var(--buildrick-info)` | `var(--buildrick-info)` | `#2D6DFF` | ✓ |

Note on `--bd-success-bg`: bridge routes via `--buildrick-success-light`, bd-aliases routes via `--buildrick-success-bg`. Color.css defines BOTH at identical `rgba(22,163,74,0.10)`. Runtime computed value matches. Naming divergence flagged for cleanup but not blocking.

### Canvas box-model (3)

| `--bd-*` | bridge value | bd-aliases target | canonical value | match? |
|---|---|---|---|---|
| `--bd-box-content` | `rgba(111, 168, 220, 0.50)` (literal) | `var(--buildrick-boxmodel-content)` | `rgba(111,168,220,0.50)` | ✓ |
| `--bd-box-padding` | `rgba(147, 196, 125, 0.45)` (literal) | `var(--buildrick-boxmodel-padding)` | `rgba(147,196,125,0.45)` | ✓ |
| `--bd-box-margin` | `rgba(246, 178, 107, 0.50)` (literal) | `var(--buildrick-boxmodel-margin)` | `rgba(246,178,107,0.50)` | ✓ |

### Overlays (1)

| `--bd-*` | bridge value | bd-aliases target | canonical value | match? |
|---|---|---|---|---|
| `--bd-overlay` | `rgba(15, 23, 42, 0.40)` (literal) | `var(--buildrick-overlay)` | `rgba(15,23,42,0.40)` | ✓ |

### Typography — font families (5) — **CONFLICT**

| `--bd-*` | bridge value | bd-aliases target | canonical value | match? |
|---|---|---|---|---|
| `--bd-font-family` | `"Inter Tight", system-ui, -apple-system, sans-serif` (literal) | `var(--buildrick-font-family)` | `"Inter Tight", sans-serif` | ! →1 |
| `--bd-font-display` | `"Inter Tight", system-ui, sans-serif` (literal) | `var(--buildrick-font-family-display)` | `"General Sans", sans-serif` | **! →2** |
| `--bd-font-mono` | `"Geist Mono", "SF Mono", Menlo, monospace` (literal) | `var(--buildrick-font-family-mono)` | `"Geist Mono", monospace` | ! →1 |
| `--bd-font` | `var(--bd-font-family)` | `var(--buildrick-font-family)` | `"Inter Tight", sans-serif` | ! →1 |
| `--bd-mono` | `var(--bd-font-mono)` | `var(--buildrick-font-family-mono)` | `"Geist Mono", monospace` | ! →1 |

**This is the second silent cascade override** — analogous to the 48/280 shell finding but for fonts. `--bd-font-display` currently renders Inter Tight via bridge; after delete, falls through to canonical "General Sans" which has no `@font-face` loaded, so browsers fall back to `sans-serif` system default. **Visible typographic regression on any surface using `--bd-font-display`.**

### Typography — scale (12)

| `--bd-*` | bridge value | bd-aliases target | canonical value | match? |
|---|---|---|---|---|
| `--bd-text-2xs` | `10px` (literal) | `var(--buildrick-text-2xs)` | `10px` | ✓ |
| `--bd-text-xs` | `11px` (literal) | `var(--buildrick-text-xs)` | `11px` | ✓ |
| `--bd-text-sm` | `12px` (literal) | `var(--buildrick-text-sm)` | `12px` | ✓ |
| `--bd-text-sm-plus` | `13px` (literal) | `var(--buildrick-text-sm-plus)` | `13px` | ✓ |
| `--bd-text-md` | `14px` (literal) | `var(--buildrick-text-md)` | `14px` | ✓ |
| `--bd-text-md-plus` | `15px` (literal) | `var(--buildrick-text-md-plus)` | `15px` | ✓ |
| `--bd-text-lg` | `16px` (literal) | `var(--buildrick-text-lg)` | `16px` | ✓ |
| `--bd-text-xl` | `18px` (literal) | `var(--buildrick-text-xl)` | `18px` | ✓ |
| `--bd-text-2xl` | `20px` (literal) | `var(--buildrick-text-2xl)` | `20px` | ✓ |
| `--bd-text-3xl` | `24px` (literal) | `var(--buildrick-text-3xl)` | `24px` | ✓ |
| `--bd-text-4xl` | `32px` (literal) | `var(--buildrick-text-4xl)` | `32px` | ✓ |
| `--bd-text-display` | `48px` (literal) | `var(--buildrick-text-display)` | `48px` | ✓ |

### Typography — weights (4)

| `--bd-*` | bridge value | bd-aliases target | canonical value | match? |
|---|---|---|---|---|
| `--bd-weight-regular` | `400` (literal) | `var(--buildrick-font-weight-normal)` | `400` | ✓ |
| `--bd-weight-medium` | `500` (literal) | `var(--buildrick-font-weight-medium)` | `500` | ✓ |
| `--bd-weight-semibold` | `600` (literal) | `var(--buildrick-font-weight-semibold)` | `600` | ✓ |
| `--bd-weight-bold` | `700` (literal) | `var(--buildrick-font-weight-bold)` | `700` | ✓ |

### Typography — tracking (5)

| `--bd-*` | bridge value | bd-aliases target | canonical value | match? |
|---|---|---|---|---|
| `--bd-track-tight` | `-0.02em` (literal) | `var(--buildrick-tracking-tight)` | `-0.02em` | ✓ |
| `--bd-track-normal` | `0` (literal) | `var(--buildrick-tracking-normal)` | `0` | ✓ |
| `--bd-track-wide` | `0.02em` (literal) | `var(--buildrick-tracking-wide)` | `0.02em` | ✓ |
| `--bd-track-wider` | `0.04em` (literal) | `var(--buildrick-tracking-wider)` | `0.04em` | ✓ |
| `--bd-track-widest` | `0.08em` (literal) | `var(--buildrick-tracking-widest)` | `0.08em` | ✓ |

### Typography — leading (3)

| `--bd-*` | bridge value | bd-aliases target | canonical value | match? |
|---|---|---|---|---|
| `--bd-leading-tight` | `1.2` (literal) | `var(--buildrick-line-tight)` | `1.2` | ✓ |
| `--bd-leading-normal` | `1.5` (literal) | `var(--buildrick-line-normal)` | `1.5` | ✓ |
| `--bd-leading-relaxed` | `1.6` (literal) | `var(--buildrick-line-relaxed)` | `1.6` | ✓ |

### Shell layout (5) — **CONFLICT + MISSING FROM bd-aliases**

| `--bd-*` | bridge value | bd-aliases target | canonical value | match? |
|---|---|---|---|---|
| `--bd-shell-header-h` | `48px` (literal) | MISSING | `--buildrick-header-height: 48px` | ! →3 |
| `--bd-shell-rail-w` | `48px` (literal) | MISSING | `--buildrick-sidebar-width: 56px` | **! →3 (user locked 48)** |
| `--bd-shell-panel-w` | `280px` (literal) | MISSING | `--buildrick-sidebar-panel-width: 320px` | **! →3 (user locked 280)** |
| `--bd-shell-insp-w` | `280px` (literal) | MISSING | `--buildrick-right-panel-width: 280px` | ! →3 |
| `--bd-shell-foot-h` | `32px` (literal) | MISSING | `--buildrick-footer-height: 32px` | ! →3 |

## Remediation

### Remediation 1 — font fallback hygiene (low risk)

Bridge has richer `font-family` fallbacks: `system-ui, -apple-system` for sans-serif; `"SF Mono", Menlo` for mono. Canonical is shorter. Modern browsers render Inter Tight / Geist Mono from Google Fonts reliably, so dropped fallbacks rarely trigger — but align for hygiene.

**Action:** Edit `src/themes/design-system/typography.css`:

```css
/* before */
--buildrick-font-family: "Inter Tight", sans-serif;
--buildrick-font-family-mono: "Geist Mono", monospace;

/* after */
--buildrick-font-family: "Inter Tight", system-ui, -apple-system, sans-serif;
--buildrick-font-family-mono: "Geist Mono", "SF Mono", Menlo, monospace;
```

### Remediation 2 — `--bd-font-display` cascade override (MEDIUM risk)

`--buildrick-font-family-display: "General Sans"` has no `@font-face` load. After bridge-tokens delete, surfaces using `--bd-font-display` fall back to system sans-serif — visible regression.

**Decision required.** Two options (recall: this was already flagged as a deferred decision in v3 doc Open Q 5 / DESIGN.md divergence):

- **(a) Align canonical to Inter Tight** — edit `typography.css`:
  ```css
  --buildrick-font-family-display: "Inter Tight", system-ui, sans-serif;
  ```
  Matches project/README.md which states Inter Tight is the workhorse. Matches shipped reality. Zero visual regression. `DESIGN.md` mention of "General Sans" becomes aspirational footnote. **Recommended — matches the same shipped-reality bias user locked for 48/280.**

- **(b) Load General Sans** — acquire `GeneralSans-*.woff2`, add `@font-face` to `typography.css`, host under `src/shared/fonts/`. Larger bundle, needs license. Shell display font changes (visible).

Recommended: **(a)**. Matches user's locked 48/280 decision pattern (shipped-reality over aspirational).

### Remediation 3 — shell-layout tokens (BLOCKING — user already decided)

User locked **48/280** as canonical (2026-04-24).

**Action 1 — update `layout.css`:**

```css
/* before */
--buildrick-sidebar-width: 56px;
--buildrick-sidebar-panel-width: 320px;

/* after */
--buildrick-sidebar-width: 48px;       /* was 56px; 48 is shipped reality, D1-D6's 56px aspirational */
--buildrick-sidebar-panel-width: 280px; /* was 320px; 280 is shipped reality, D1-D6's 320px aspirational */
```

Leave `--buildrick-header-height: 48px`, `--buildrick-footer-height: 32px`, `--buildrick-right-panel-width: 280px` unchanged (already match bridge).

**Action 2 — add 5 shell-layout aliases to `bd-aliases.css`:**

```css
/* ─── SHELL LAYOUT ───────────────────────────────────────────────────── */
--bd-shell-header-h: var(--buildrick-header-height);
--bd-shell-rail-w: var(--buildrick-sidebar-width);
--bd-shell-panel-w: var(--buildrick-sidebar-panel-width);
--bd-shell-insp-w: var(--buildrick-right-panel-width);
--bd-shell-foot-h: var(--buildrick-footer-height);
```

Reuse canonical names. Do NOT create parallel `--buildrick-shell-*` series (reviewer v2 Issue 3).

**Action 3 — update 2026-04-23 intake matrix** to reflect 48/280 as canonical (D1-D6 correction).

## Verification Before Delete

After Remediations 1, 2, 3 land:

1. Boot editor (`npm run dev` in `packages/editor/`).
2. Screenshot topbar, rail, left panel, inspector, footer.
3. Pixel-measure: rail 48px, left panel 280px, inspector 280px, header 48px, footer 32px.
4. Grep for any component hardcoding 56 or 320: `grep -rn "56px\|320px" packages/editor/src/editor --include="*.css" --include="*.tsx"`. Investigate each hit — if layout-related, fix.
5. Verify Inter Tight rendering on any `font-family: var(--bd-font-display)` surface.
6. Run SSOT gate check: `grep -rn "^\s*--bd-[a-z0-9-]\+:" packages/editor/src --include="*.css" | grep -v "bd-aliases.css"` should return 3 matches (new-design/project/*) after bridge-tokens delete, 0 after new-design/project/ delete (P0b).
7. Delete `src/themes/bridge-tokens.css`.
8. Remove `import "./bridge-tokens.css"` from `AquibraStudio.tsx` and any other consumer.
9. Re-boot, re-screenshot. Diff against step-2 screenshots. Zero pixel delta expected.

## Summary

- **Tokens reviewed:** 77
- **Safe-delete (✓):** 67 (90%)
- **Requires remediation (!):** 10 — 3 font-family cosmetic, 1 font-display blocking, 5 shell-layout blocking, 1 success-bg naming noise
- **Blocking findings:** 2 distinct silent cascade overrides (shell dimensions, display font), both with user-locked-or-recommended resolution path
- **New insight beyond v3 doc:** `--bd-font-display` cascade override is analogous to the 48/280 shell finding. Logging as second pitfall instance.

## Unlocks

With this document complete, P0a is ready to execute in three commits:

1. **Commit 1:** land Remediations 1 + 2 + 3 Actions 1 & 2 in `typography.css`, `layout.css`, `bd-aliases.css`. Single atomic change — token values aligned.
2. **Commit 2:** delete `src/themes/bridge-tokens.css`, remove import from `AquibraStudio.tsx`. Single atomic change — dead file gone.
3. **Commit 3:** wire SSOT gate into CI (script per v3 doc). Single atomic change — regression-proof.

Verification step 9 (re-screenshot diff) runs between commits 2 and 3.
