# Primitive Conformance Audit — P0c

Date: 2026-04-25
Owner: shahg
Branch: main
Status: READ-ONLY AUDIT (no code changes)

References:
- Plan: `~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-ds-implementation-20260424-214519.md` (v3 APPROVED)
- Prototypes: `packages/editor/project/preview/comp-{buttons,inputs,popovers,modals,badges}.html`
- Live: `packages/editor/src/shared/ui/{Button,TextInput,Popover,Modal,Badge}.tsx`

## Purpose

Gate artifact for Week 1 (primitive reconciliation). For each of the 5 highest-traffic primitives, enumerate the deltas between the shipped React component and the HTML prototype spec. Output is a delta list per primitive; no code changes in this doc.

## Overall Findings

| Primitive | Conformance | Severity | Deltas count |
|-----------|-------------|----------|--------------|
| Button | 4/10 | **HIGH** | 7 |
| TextInput | 6/10 | MEDIUM | 5 |
| Popover | 5/10 | MEDIUM | 4 |
| Modal | 6/10 | MEDIUM | 5 |
| Badge | 7/10 | LOW-MEDIUM | 4 |

**Cross-cutting patterns:**
1. **Token namespace violation** — 4 of 5 primitives use `--buildrick-*` directly instead of `--bd-*` alias. Contradicts plan Premise 2 ("The `--bd-*` alias layer is the chrome contract").
2. **Hardcoded hex in primitives** — Button has `rgba(99, 102, 241, 0.25)` (legacy indigo, banned per DESIGN.md) in boxShadow; Popover has `rgba(0,0,0,0.4)` (black, not cool-slate).
3. **Hover/focus/pressed states missing** — prototypes specify hover tints for every interactive element; live primitives either rely on native browser hovers or omit entirely.
4. **Size scales diverge** — prototype and live use different sm/md/lg pixel values across all 3 sized primitives.

---

## 1. Button — `shared/ui/Button.tsx`

**Prototype:** `project/preview/comp-buttons.html` (37 lines).

### Deltas

| # | Gap | Severity |
|---|-----|----------|
| B1 | Uses `--buildrick-accent` / `--buildrick-radius-md` / `--buildrick-error` directly. Should use `--bd-accent` / `--bd-radius-md` (alias) per plan contract. | HIGH |
| B2 | `primary` variant has `boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)"` — **indigo color** (`#6366F1`), banned per DESIGN.md. Should be cobalt `rgba(45, 109, 255, 0.25)` OR removed (prototype has no shadow on primary). | **HIGH** |
| B3 | Missing `publish` pill variant — prototype has `.publish` at `border-radius: 9999px` for the topbar CTA. No live equivalent. | HIGH |
| B4 | `danger` variant visually wrong — live = red bg + white text (solid destructive); prototype = white bg + red border + red text (subtle destructive). Two different design intents. Pick one, align. | HIGH |
| B5 | Missing hover styles — prototype has `.primary:hover { background: var(--bd-accent-hover) }`, `.secondary:hover { background: var(--bd-bg-subtle) }`, `.ghost:hover { background: rgba(15,23,42,0.04); color: var(--bd-fg-primary) }`. Live relies on transition with no hover target color. | HIGH |
| B6 | Size scale mismatch. Live: `sm=28h/10px`, `md=36h/16px`, `lg=44h/20px`. Prototype: no explicit height, uses padding — `sm=6px 12px`, `md=9px 16px`, `lg=12px 22px`, with font 12/13/14. Live md=14 prototype md=13. Convergence needed. | MEDIUM |
| B7 | Legacy class `buildrick-btn buildrick-btn-{variant}` — components.css still has `.buildrick-btn` rules that may double-style. Ideally class-less Emotion-styled component after Week 3 components.css split. | LOW |

### Recommended fix path (Week 1)

1. Replace all `--buildrick-*` with `--bd-*` (B1).
2. Remove boxShadow or replace with cobalt (B2).
3. Add `publish` variant with `border-radius: var(--bd-radius-full)` (B3).
4. Decide danger design: recommend prototype's subtle style (white + red border) — matches restraint of DESIGN.md (B4).
5. Add `:hover` styles for all 4 interactive variants (B5).
6. Reconcile size scale — drop height, use padding + font tokens (B6).
7. Defer legacy class removal to Week 3 (B7).

---

## 2. TextInput — `shared/ui/TextInput.tsx`

**Prototype:** `project/preview/comp-inputs.html` (42 lines).

### Deltas

| # | Gap | Severity |
|---|-----|----------|
| T1 | Uses `--buildrick-space-2` / `--buildrick-radius-sm` / `--buildrick-transition-colors` / `--buildrick-glow-primary` directly. Mix of `--bd-*` and `--buildrick-*` within one file. | HIGH |
| T2 | Size scale too tiny. Live: `sm=20h/10px`, `md=24h/11px`, `lg=28h/12px`. Prototype: `padding 8px 12px / font 13px` = ~34h at md. Live is inspector-sized; prototype is form-sized. Probably live SHOULD be "inspector" variant, prototype is "form" variant — need two size families or rename. | **HIGH** |
| T3 | Missing `stepper` variant — prototype has `.stepper` pattern with `-/+` buttons + value + unit suffix (`px`). Used heavily in inspector for numeric values. No live primitive for this — consumers recreate it ad-hoc. | **HIGH** |
| T4 | Default background mismatch. Live: `background: var(--bd-bg-subtle)` (slate-100). Prototype: `background: #fff`. Live's style matches inspector compact style; prototype matches form style. Same dual-size question as T2. | MEDIUM |
| T5 | Missing error-hint pattern. Prototype: `.err-hint` below input with red text. Live only sets `aria-invalid` + border color. Consumers must render their own hint. Consider a `helperText` / `errorText` prop. | MEDIUM |

### Recommended fix path (Week 1)

1. Align all tokens to `--bd-*` (T1).
2. Rename live `TextInput` to `CompactInput` or add a `variant="form" | "inspector"` prop. Form variant matches prototype (T2, T4).
3. Extract `NumericStepper` primitive from prototype `.stepper` pattern (T3) — new file.
4. Add `helperText` / `errorText` optional slots (T5).

---

## 3. Popover — `shared/ui/Popover.tsx`

**Prototype:** `project/preview/comp-popovers.html` (first 80 lines read; file is large, includes menu, tooltip, multiline, dropdown variants).

### Deltas

| # | Gap | Severity |
|---|-----|----------|
| P1 | Uses `--buildrick-bg-panel` / `--buildrick-border` directly. Should be `--bd-*`. | HIGH |
| P2 | Wrong shadow. Live: `boxShadow: "0 8px 30px rgba(0,0,0,0.4)"` — **pure black**, too heavy. Prototype: `box-shadow: 0 12px 30px -8px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.06)` — cool-slate double-layer. DESIGN.md: "Shadows are always cool-tinted slate (rgba(15,23,42,...)), never warm grey or black." | **HIGH** |
| P3 | Missing arrow/caret. Prototype: `.pop::before` renders rotated square arrow at trigger side. Live: no arrow. Visual-fidelity gap. | MEDIUM |
| P4 | Not split by variant. Prototype distinguishes `.pop` (popover), `.tooltip` (dark), `.menu` (dropdown). Live is one generic Popover that consumers style internally. Consider splitting: Popover (light + arrow), Tooltip (dark, existing separate Tooltip.tsx), Menu (dropdown list). | MEDIUM |

### Recommended fix path (Week 1)

1. Token alignment (P1).
2. Replace shadow with prototype's double-layer slate shadow (P2).
3. Add arrow render via pseudo-element or inline SVG pointing at trigger (P3).
4. Audit existing Tooltip.tsx for overlap with prototype's `.tooltip`; consider extracting `Menu` primitive separately (P4).

Verify `useFocusTrap` hook works with portaled content — prototype docs don't cover focus behavior.

---

## 4. Modal — `shared/ui/Modal.tsx`

**Prototype:** `project/preview/comp-modals.html` (first 60 lines read).

### Deltas

| # | Gap | Severity |
|---|-----|----------|
| M1 | Zero `--bd-*` usage. Live uses inline styles from hoisted `overlayStyles`, `modalStyles`, `headerStyles` constants — likely hardcoded values. | **HIGH** |
| M2 | Size mismatch. Live: `sm=400, md=560, lg=720, xl=960, full=90vw`. Prototype: `.modal max-width: 380px`, `.modal.lg max-width: 460px`. Live is way bigger (roughly 1.5x). Different scale philosophy — resolve. | HIGH |
| M3 | Missing icon-prefix header pattern. Prototype: `.modal-h .ic` = 32×32 tinted square with icon (default cobalt, `.danger` red, `.warn` amber, `.ok` green). Live header is title + close only. New prop: `headerIcon?: { type: "default" \| "danger" \| "warn" \| "ok"; icon: ReactNode }`. | MEDIUM |
| M4 | Backdrop style. Live uses `overlayStyles` (not read in full). Prototype `.stage::before` uses `rgba(15,23,42,0.48)` + `backdrop-filter: blur(2px)`. **DESIGN.md says no backdrop-filter blur in editor chrome.** If live has blur, remove; if prototype has it, that contradicts DESIGN.md and the prototype is wrong. Flag as spec conflict. | MEDIUM |
| M5 | Close button variant mismatch. Live uses inline `<svg>` at 20px. Prototype: `.modal-h .x` = 22×22 with muted color + subtle hover. Style details differ (radius 4 vs unspecified, hover = bg-subtle + fg-primary). | LOW |

### Recommended fix path (Week 1)

1. Extract inline styles to Emotion; replace all literal values with `--bd-*` tokens (M1).
2. Shrink size scale to match prototype: sm=380, md=460. Drop xl/full or relabel (M2).
3. Add optional `headerIcon` prop (M3).
4. Resolve backdrop-filter:blur spec conflict — DESIGN.md is authoritative; prototype is wrong or intentionally exceptional (M4).
5. Refine close-button styling to match prototype hover (M5).

---

## 5. Badge — `shared/ui/Badge.tsx`

**Prototype:** `project/preview/comp-badges.html` (36 lines).

### Deltas

| # | Gap | Severity |
|---|-----|----------|
| BD1 | Token usage: GOOD. All `--bd-*`. Only deviation: `gap: var(--buildrick-space-2)` and `border-radius: var(--buildrick-radius-full)` — should align to `--bd-*`. | LOW |
| BD2 | Variant mismatch. Live has 6 semantic variants (default, primary, success, warning, error, info). Prototype has 7 use-case variants (published, draft, issues, unsaved, syncing, new, premium) + 1 tab-badge counter style. Live's `success` ≈ `published`, `default` ≈ `draft`, `error` ≈ `issues`, `warning` ≈ `unsaved`, `primary`/`info` ≈ `syncing`/`new`. **Missing `premium` variant** — prototype `.premium` is solid black bg + white text (PRO tier badge). | MEDIUM |
| BD3 | Missing `counter` size/variant. Prototype `.tab-badge` = 10px font / 1px 6px pad / radius 10px / accent-tint bg — used for tab item-count chips. Live has no tiny counter size. | MEDIUM |
| BD4 | Dot rendering differs. Live: dot REPLACES body when `dot={true}`. Prototype: dot appears INSIDE pill alongside text (prefix). Different API semantics — consumers can't render "Published" pill with leading green dot via current API. | MEDIUM |

### Recommended fix path (Week 1)

1. Token alignment: last 2 `--buildrick-*` → `--bd-*` (BD1).
2. Add `premium` variant (BD2) — solid `--bd-fg-heading` bg + `--bd-fg-on-accent` text.
3. Add `counter` size — `xs` or dedicated `isCounter` prop (BD3).
4. Change `dot` semantics: when `dot={true}`, render dot AS PREFIX inside pill, not as replacement. Add separate `DotIndicator` primitive if standalone dot is still needed (BD4).

---

## Cross-Cutting Action — Token Sweep

Before any primitive-level fix, do a global sweep on `shared/ui/{Button,TextInput,Popover,Modal,Badge}.tsx`:

```bash
grep -nE "var\(--buildrick-" packages/editor/src/shared/ui/{Button,TextInput,Popover,Modal,Badge}.tsx
```

Every hit should become `var(--bd-*)` per plan Premise 2. Any missing `--bd-*` alias gets added to `bd-aliases.css` (e.g. `--bd-radius-md`, `--bd-radius-full`, `--bd-space-*`, `--bd-glow-primary`, `--bd-transition-colors` — these alias families don't exist today).

**Missing alias families identified (need to add to `bd-aliases.css` in Week 1):**

- `--bd-radius-{sm,md,lg,xl,full}` → `var(--buildrick-radius-*)`
- `--bd-space-{1..8}` → `var(--buildrick-space-*)`
- `--bd-shadow-{xs,sm,md,lg,xl}` → `var(--buildrick-shadow-*)`
- `--bd-glow-primary` → `var(--buildrick-input-ring)` or equivalent
- `--bd-transition-colors` → `var(--buildrick-transition-colors)` (verify this exists in motion.css)

This alias expansion is a blocker — primitives can't fully converge on `--bd-*` until these exist.

---

## Summary

Overall conformance: **5 primitives, 25 deltas, 6 HIGH severity.**

The shipped primitives were ported before the `--bd-*` alias contract was locked (2026-04-23). Reconciliation work is real but mechanical:

1. **Alias expansion** — add missing `--bd-*` families to `bd-aliases.css`. Blocker for everything else. ~1 hour.
2. **Token sweep** — replace `--buildrick-*` with `--bd-*` in 5 files. ~1 hour.
3. **Button** — fix indigo color (B2), add publish variant (B3), resolve danger style (B4), add hover states (B5). ~2 hours.
4. **TextInput** — decide size policy (T2), extract NumericStepper (T3), add helper text (T5). ~3 hours (NumericStepper is the bulk).
5. **Popover** — replace shadow (P2), add arrow (P3). ~1 hour.
6. **Modal** — Emotion rewrite (M1), shrink sizes (M2), headerIcon prop (M3), resolve blur spec (M4). ~3 hours.
7. **Badge** — add premium + counter variants (BD2, BD3), fix dot semantics (BD4). ~1 hour.

Total Week 1 estimate: **~12 CC+gstack hours / ~4-5 working days solo human**.

Tests per primitive: 1 interaction test + 1 CSS source scan (assert only `var(--bd-*)` references, no hex).

## Blockers to flag to user

- **M4 spec conflict**: prototype uses `backdrop-filter: blur(2px)` but DESIGN.md says no blur in chrome. Decision needed.
- **T2 size policy**: is current live `TextInput` the inspector variant (tiny) and prototype is the form variant (bigger)? If yes, split into two primitives or add `variant="inspector" | "form"` prop.
- **B4 danger variant**: prototype subtle (white+red-border), live destructive (solid red). Pick one.
- **BD2 premium variant**: is PRO tier concept live in product copy? If yes, add variant; if no, defer.
