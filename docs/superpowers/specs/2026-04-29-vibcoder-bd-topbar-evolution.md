# Vibcoder `bd-topbar` Evolution — Upstream Proposal

**Status:** PROPOSAL — paired with local override layer at `packages/editor/src/themes/design-system/bd-topbar-overrides.css` and prototype at `~/.gstack/projects/aamirtauqir-buildrik/designs/topbar-v2-fidelity-20260429/topbar.html`.

**Date:** 2026-04-29

**Author:** /plan-design-review session, gstack v1.17.0.0, against `main` at `d32a3a5f`.

**Lifecycle:** When this proposal is accepted upstream and the next `npm run vibcoder:vendor` regenerates the bundle, the override file at `themes/design-system/bd-topbar-overrides.css` becomes empty and is deleted. This is an intentional temporary bridge.

---

## Problem

Three definitions of the editor topbar exist in this repo, and they don't agree:

| Definition | File | Height | Shape | Composition |
|---|---|---|---|---|
| Production shell | `packages/editor/src/editor/shell/Topbar.tsx` (`.bdc-*`) | 56px | Flush bar, hairline bottom | Brand mark · Undo/Redo/History · Breadcrumb · Breakpoints (4-way: wide/desktop/tablet/mobile) · Saved badge · +Invite · Cmd palette · Preview · Publish · Help · Account avatar |
| Vibcoder canonical | `packages/editor/src/themes/components/organisms/topbar.{css,html}` (`.bd-*`) | 48px | Floating panel: 1px border, 10px radius, `--buildrick-shadow-xs` | Brand label · Undo/Redo · Saved · Breakpoints (3-way: desktop/tablet/mobile) · Preview · Share · Publish |
| DESIGN.md spec | `DESIGN.md §Layout` | 56px | Flush, light chrome, no shadow | Full action set per shell |

DESIGN.md is the authority. Vibcoder canonical lags it. Production shell honors DESIGN.md but uses the deprecated `.bdc-*` namespace (Position 3 hold pending M8 chrome re-port to vibcoder).

This blocks the M8 chrome re-port from progressing on Topbar.tsx because the migration target (vibcoder canonical) doesn't yet express the shell's required shape.

## Goal

Bring `bd-topbar` canonical to full DESIGN.md spec parity so the M8 chrome re-port can swap `.bdc-top` (Topbar.tsx) for `.bd-topbar` (vibcoder organism) without losing features or geometry.

## Non-Goals

- No source-code change to `editor/shell/Topbar.tsx` in this proposal. M8 re-port is a separate task.
- No breaking change to existing `.bd-topbar` consumers — proposal is additive (new slots, new variants, geometry override).
- No new tokens. All new CSS uses existing `--buildrick-*` and `--bd-*` aliases.
- No icon-sprite additions in this round (see "Open gaps" below).

## Target Shape — what `bd-topbar` should compose

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [B] Buildrik ⌄│ Undo Redo Hist  │  ──   Acme / Home ⌄   ──    [W][D][T][M]   │  ●Saved·3m  +Invite  ⌨  👁 Preview  Publish⌄  ?  (SK) │
└────────────────────────────────────────────────────────────────────────────────────────┘
   brand        history-group       title (centered)         breakpoints                 status     secondary  ghost  secondary  primary  ghost  account
```

- **Height:** 56px (matches DESIGN.md §Layout `--buildrick-header-height` exposed as `--bd-shell-header-h`)
- **Container:** flush, `background: var(--buildrick-bg-card)`, `border-bottom: 1px solid var(--buildrick-border)`, no border-radius, no box-shadow
- **Layout:** CSS grid `auto auto auto 1fr auto auto auto auto` with `gap: var(--buildrick-space-3)` and `align-items: center`
- **Padding:** `0 var(--buildrick-space-3)`

### New slots (additive to current `bd-topbar__*`)

| Slot | Purpose | Composition |
|---|---|---|
| `.bd-topbar__brand-mark` | Cobalt B square left of wordmark | 22×22, `background: var(--buildrick-accent)`, `border-radius: var(--buildrick-radius-md)`, white "B" Inter Tight 700 12px, `letter-spacing: -0.04em` |
| `.bd-topbar__title` | Centered breadcrumb (project · `/` · page · chevron) | `flex: 1`, `justify-content: center`, `gap: var(--buildrick-space-2)`, `font: var(--buildrick-font-weight-medium) 12.5px var(--buildrick-font-family)`, project in secondary text, `/` in muted, page in heading-color semibold |
| `.bd-topbar__title--issues` | Issue pill replaces breadcrumb when `issues.length > 0` | Amber pill: `background: var(--buildrick-warning-bg)`, `border: 1px solid var(--buildrick-warning-border)`, `color: var(--buildrick-warning)`, alert-triangle icon |
| `.bd-topbar__account` | Cobalt circular initials avatar (replaces legacy `#1F2937` pill) | 28×28, `border-radius: var(--buildrick-radius-full)`, `background: var(--buildrick-accent)`, `color: var(--buildrick-text-on-accent)`, Inter Tight 600 11px |
| `.bd-topbar__offline` | Offline indicator pill paired with status | Muted dot + "Offline" text on `--buildrick-bg-subtle` |
| `.bd-topbar__collab` | Collaborator avatar stack (presence) | Overlapping 22px circles with 2px white border; deferred per-user color scheme to `/design-consultation` |

### Status-pill state variants (additive to current `bd-topbar__status`)

Today `.bd-topbar__status` ships only one shape (neutral subtle bg, dot whatever color you inline). Promote dot color to a variant modifier so consumers don't recompute it:

| Variant | Class | Dot color | Background | Border | Click? |
|---|---|---|---|---|---|
| Saved | `.bd-topbar__status--ok` (default) | `var(--buildrick-success)` | `var(--buildrick-bg-subtle)` | none | no |
| Saving | `.bd-topbar__status--saving` | `var(--buildrick-accent)` (pulsing 1.2s ease-in-out) | `var(--buildrick-accent-subtle)` | `var(--buildrick-accent)` 1px | no |
| Unsaved | `.bd-topbar__status--warn` | `var(--buildrick-warning)` | `var(--buildrick-warning-bg)` | `var(--buildrick-warning-border)` 1px | yes (click to save) |
| Save failed | `.bd-topbar__status--error` | `var(--buildrick-error)` | `var(--buildrick-error-bg)` | `var(--buildrick-error-border)` 1px | yes (click to retry) |

Pulse animation honors `prefers-reduced-motion: reduce`.

### Breakpoint switcher upgrade

Today `bd-bp-switcher` ships 3 cells (desktop/tablet/mobile). Spec requires 4 cells (wide/desktop/tablet/mobile). Add the wide variant icon to the sprite (`i-monitor-wide`) and let `bd-bp-switcher` accept any number of `__btn` children. No CSS change needed — the atom is already child-count-agnostic.

## Atoms used (zero new atoms required)

- `bd-icon-btn--sm` (28×28 square) — Undo, Redo, History, Cmd palette, Help, plus the four breakpoint cells (via `bd-bp-switcher__btn`)
- `bd-btn--secondary` — `+Invite`, Preview
- `bd-btn--publish` — Publish CTA (cobalt pill, full radius)
- `bd-btn--busy` + `bd-btn__spinner` — Publishing… in-flight
- `bd-divider bd-divider--vertical` — section separators (replaces `bd-topbar__sep`, already deprecated per `bd-topbar.css` comment)
- `bd-bp-switcher` + `bd-bp-switcher__btn` — breakpoint segmented control

## Open gaps that block strict-canonical render

**Sprite needs these icons added to `themes/components/atoms/icons.svg`:**

| ID | Use | Lucide source |
|---|---|---|
| `i-monitor` | Desktop breakpoint | `monitor` |
| `i-monitor-wide` | Wide breakpoint | `monitor` (1.5× width variant) |
| `i-tablet` | Tablet breakpoint | `tablet` |
| `i-smartphone` | Mobile breakpoint | `smartphone` |
| `i-keyboard` | Cmd palette icon | `keyboard` |
| `i-user` | Account avatar fallback (when no initials) | `user` |
| `i-help-circle` | Help button | `help-circle` |
| `i-alert-triangle` | Issue pill icon | `alert-triangle` |
| `i-cloud-off` | Offline indicator | `cloud-off` |

Until these land in the sprite, the override layer + prototype inline lucide-style SVGs at the call site (`<svg>` markup directly in JSX/HTML, stroke 1.6, lucide path data). This is the only short-term workaround — the override does NOT add to the sprite (sprite is bundle-managed).

## Migration sequence

1. **Today (this PR):** ship the override layer + proposal markdown + prototype.
   - `packages/editor/src/themes/design-system/bd-topbar-overrides.css` (new)
   - `packages/editor/src/themes/design-system/index.css` (add one `@import` line)
   - `~/.gstack/projects/aamirtauqir-buildrik/designs/topbar-v2-fidelity-20260429/topbar.html` (rebuilt with bd-* atoms + override layer)
   - `DESIGN.md §Decisions Log` (add 2026-04-29 entry)
   - **No vendored bundle edits.** Gates 19, 21, vibcoder:check-port stay green.

2. **Next sprint:** open upstream PR against the vibcoder source repo proposing this exact shape change to `bd-topbar`. Include the 9 sprite additions. Cite this proposal.

3. **When upstream merges:** run `npm run vibcoder:vendor` locally. Vendored `themes/components/organisms/topbar.css` regenerates with the additive slots and state variants. Sprite regenerates with the 9 new icons. Bundle pin (`.bundle-version`) bumps.

4. **Sunset:** delete `themes/design-system/bd-topbar-overrides.css` and remove the `@import` line from `themes/design-system/index.css`. Re-run `verify:ds` — should still pass.

5. **M8 chrome re-port (separate task, not blocked by this proposal):** migrate `editor/shell/Topbar.tsx` from `.bdc-*` to `.bd-*` namespace consuming the now-canonical `bd-topbar`. Codemod-driven per CLAUDE.md vibcoder routing.

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Override file forgotten after upstream merges | Med | Add a TODO at top of override CSS naming the upstream PR; sunset checked in `verify:ds` once the upstream change ships |
| Drift between override geometry and DESIGN.md if DESIGN.md updates first | Low | DESIGN.md `§Decisions Log` entry references this file; both must update in lock-step |
| Inline lucide SVGs in prototype/override violate "icons via sprite only" rule | Low | Documented exception, scoped to the 9 icons listed above, time-boxed to upstream PR landing |
| Production `.bdc-*` shell continues to be the visible topbar — users won't see this change | Expected | Override is forward-looking. Visible only after M8 re-port reaches Topbar.tsx |
| Pulse animation on saving badge is new motion not in DESIGN.md §Motion | Low | DESIGN.md §Motion permits transitions that "aid comprehension." 1.2s pulse is ambient feedback for an in-flight async op, not a transition. Honors `prefers-reduced-motion: reduce` |

## Acceptance criteria (this PR)

- [ ] `themes/design-system/bd-topbar-overrides.css` exists, lives in `@layer overrides`, references only `--buildrick-*` / `--bd-*` tokens
- [ ] `themes/design-system/index.css` imports the override file
- [ ] `npm run verify:ds` passes (8 gates)
- [ ] `scripts/ds-grep-gates.sh` Gates 11-14 pass (no new gradients, no raw shadows, radius ≤ 4px on chrome containers, no new magic literals)
- [ ] `vibcoder:check-port` passes (override is in `themes/design-system/`, NOT in `themes/components/` — does not register as a vendored file)
- [ ] Prototype HTML opens in browser, all 4 states render correctly with Inter Tight loaded
- [ ] DESIGN.md `§Decisions Log` has 2026-04-29 entry pointing at this proposal

## Acceptance criteria (upstream PR)

- [ ] `bd-topbar` canonical CSS includes brand-mark slot, title slot (with --issues variant), account slot, offline slot, collab slot
- [ ] `bd-topbar__status` accepts 4 state modifiers (`--ok`, `--saving`, `--warn`, `--error`)
- [ ] 9 icons added to `themes/components/atoms/icons.svg`
- [ ] `docs/reference/vibcoder/components/COMPONENTS.md` `bd-topbar` row updated with new slots
- [ ] `docs/reference/vibcoder/components/organisms/topbar.html` updates demo to show all states
- [ ] Bundle pin bumps; `npm run vibcoder:vendor` produces clean diff
