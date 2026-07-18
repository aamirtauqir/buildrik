# Dashboard Reskin — "Buildrik Dashboard_final" design language

**Date:** 2026-07-18
**Type:** Visual reskin (no business-logic change)
**Design source:** claude.ai/design project `1f20d4e4-cb45-494b-b81e-b9030a31864d`, files `Buildrik Dashboard_final.dc.html` / `Shell.dc.html` / `figma-tokens/fig-tokens.css` (canonical token layer), component sheets (KPI Cards, Project Card, …).

## Goal

Reskin the existing dashboard (`app/dashboard/**`, `components/dashboard/**`) to the final design's visual language — tokens, Inter font, premium card/shadow treatment, and the shell chrome — **without touching business logic** (tRPC calls, services, data flow, routing, form validation). Scope is **foundation + shared components**: update the token layer, fonts, the 8 primitives, and the shell. Every one of the ~40 screens inherits the new look through those shared pieces; no per-screen layout rebuilds.

## Decisions (locked)

- **Scope:** Foundation + shared components only. Per-screen layout matching and modal/state 1:1 rebuilds are **out of scope**.
- **Nav structure:** Keep the current IA (top-tabs + sidebar + recent IA v2 work). Apply the design's *visual* language to it — do **not** drop the top-tabs or restructure navigation.
- **Font:** Adopt `Inter` (the design's face). Keep `Geist Mono` for data/labels.
- **Accent:** Cobalt `#2D6DFF` stays the single accent (already unified). The design's component sheets show `--color-purple`/teal/amber "categorical" colours; **purple/violet/indigo remain banned as accents** (DESIGN.md). Keep the existing categorical palette (teal/amber/pink/ink) for avatars/icon tiles only — do **not** introduce purple.

## Canonical token values (target)

Transcribed 1:1 from `fig-tokens.css` + `Shell.dc.html` (the newer, authoritative layer; the older component sheets carry a stale snapshot — ignore their differing values).

### Colours — changes from current `globals.css`

| Token | Current | Target | Note |
|---|---|---|---|
| `--color-primary` | `#2D6DFF` | `#2D6DFF` | unchanged |
| `--color-primary-hover` | `#1950DC` | `#1950DC` | unchanged |
| `--color-primary-subtle` | `#EBF1FF` | `#EBF1FF` | unchanged |
| `--color-text-primary` | `#1C212C` | `#334155` | **change** — slate, weight carries hierarchy |
| `--color-text-secondary` | `#6B7380` | `#6B7380` | unchanged |
| `--color-bg-page` | `#F9FAFC` | `#FAFAFC` | **change** (trivial) |
| `--color-bg-surface` | `#FFFFFF` | `#FFFFFF` | unchanged |
| `--color-bg-subtle` | `#F3F5F8` | `#F1F5F9` | **change** (fill-subtle) |
| `--color-border-default` | `#E8EAEF` | `#E5E8ED` | **change** |
| `--color-border-strong` | `#D6DAE1` | `#CCD1DB` | **change** |

### New tokens to add

```
/* Nav (sidebar item states) */
--color-nav-item-active-bg: #EBF1FF;   /* = primary-subtle */
--color-nav-label: #475569;
--color-nav-label-active: #1950DC;     /* = primary-hover */

/* Status fg/bg pairs (map onto existing pill tones) */
--color-status-live-bg: #DCFCE7;   --color-status-live-fg: #15803D;   /* success */
--color-status-review-bg: #FEF3C7; --color-status-review-fg: #D97706; /* warning */
--color-status-failed-bg: #FEE2E2; --color-status-failed-fg: #DC2626; /* error */
--color-status-draft-bg: #F7FAFA;  --color-status-draft-fg: #6B7380;  /* neutral */

/* Radius — add 2xl */
--radius-2xl: 16px;

/* Premium elevation set (from Shell.dc.html) */
--shadow-ring: inset 0 0 0 1px var(--color-border-default);
--shadow-card: inset 0 0 0 1px var(--color-border-default), 0 1px 1px rgba(16,24,40,0.04), 0 2px 4px -2px rgba(16,24,40,0.07);
--shadow-card-hover: inset 0 0 0 1px var(--color-border-strong), 0 4px 10px -4px rgba(16,24,40,0.12), 0 1px 3px rgba(16,24,40,0.07);
--shadow-panel: 0 0 0 1px rgba(15,23,42,0.10), 0 18px 40px -24px rgba(15,23,42,0.16);
--shadow-modal: 0 24px 60px -12px rgba(15,23,42,0.35);

/* Type — add display size for the big page-header title */
--text-display: 28px;  /* weight 700, letter-spacing -0.02em, line-height 1.2 */
```

Existing radius (`xs4 sm6 md8 lg10 xl12 pill`), spacing (`4/8/12/16/20/24/32/40/48/64`), and type scale (`body 14 / sm 13 / eyebrow 11 / page-title 24 / section-title 15`) already match the design and stay.

### Font swap

- `--font-sans`: `'Inter Tight'` → `'Inter'`. Update the font loader in `app/layout.tsx` (next/font/google `Inter`, weights 400–800) and the `--font-sans` value.
- `--font-mono`: `'Geist Mono'` — unchanged.
- Update DESIGN.md typography note (body/UI face is now Inter, not Inter Tight).

## Primitive reskins (`components/dashboard/primitives/`)

Each already token-driven; changes are surgical value/shape tweaks. Business/prop APIs unchanged.

1. **stat-card.tsx** — card radius `10px`→`12px`; card shadow → `var(--shadow-card)`; hover → `var(--shadow-card-hover)`; label → mono font (`var(--font-mono)`), 11px, weight 600, `letter-spacing .06em`, colour `--color-text-secondary`; value stays 27px/tabular/-0.02em.
2. **section-card.tsx** — radius `10px`→`12px` (`rounded-[12px]`); shadow → `var(--shadow-card)`; header/border tokens follow the updated `--color-border-default`.
3. **button.tsx** — primary radius `9px`→`6px` (`--radius-sm`); add the design's subtle cobalt shadow on primary (`0 1px 2px rgba(45,109,255,0.28)`, hover `0 4px 10px rgba(45,109,255,0.32)`); ghost unchanged apart from border token.
4. **pill.tsx** — keep tone system; wire status tones (live→success, review→warning, failed→error, draft→neutral) to the new status fg/bg pairs; optional leading status dot supported via children (no API change).
5. **data-table.tsx** — border/row tokens follow updated borders; header row uses mono uppercase labels where present; radius on wrapper `12px`.
6. **page-header.tsx** — title → `--text-display` (28px, weight 700, `-0.02em`); optional search pill (40px, `--radius-md`, `--shadow-ring`, ⌘K mono badge) + primary CTA row on the right, matching the design's header band. Keep it a page-content header (top-tabs stay above it).
7. **progress-bar.tsx** — track `--color-bg-subtle`, fill `--color-primary`, height 5px, `--radius-pill` (align to design's usage bars).
8. **metric-value.tsx** — confirm tabular-nums + `-0.02em`; align weight to 700.

## Shell reskin (`components/dashboard/shell/`)

Keep structure (top-nav tabs + sidebar). Restyle only.

- **sidebar.tsx** — width `--sidebar-w` `272px`→`244px`; nav item: height 44px, `--radius-lg`, gap 14px, padding `0 15px`; **active state** = `background var(--color-nav-item-active-bg)` + `box-shadow: inset 3px 0 0 var(--color-primary)` (left accent bar) + label `var(--color-nav-label-active)` weight 600 + icon stroke cobalt; inactive label `var(--color-nav-label)` weight 400. Add the bottom **plan card** (Plan label + tier pill, Sites usage bar, "Upgrade ↗") wired to existing plan/usage data (display only — no new logic).
- **top-nav.tsx** — Inter, updated border/active-underline tokens; no structural change.
- **dashboard-shell.tsx** — set the content column against `--sidebar-w` 244; page-header band spacing to match the design (big title, actions right).
- **workspace-switcher.tsx / settings-rail.tsx / agency-tabs.tsx** — token/font follow-through only.

## Constraints / invariants

- **No business-logic change.** Do not touch tRPC calls, services, `server/`, data fetching, mutations, routing, or validation. Visual/props-preserving edits only.
- **SSOT:** all token changes live in `packages/dashboard/app/globals.css`. No inline hex outside the token block (existing rule).
- **Single accent** cobalt `#2D6DFF`; no purple/violet/indigo accents (DESIGN.md).
- **Keep the current IA** (top-tabs + sidebar, IA v2). Reskin, don't restructure.
- Editor chrome, auth, and onboarding surfaces are **out of scope** (separate token namespaces).

## Out of scope

- Per-screen layout rebuilds (home/sites/billing/settings/etc. inherit from primitives + tokens).
- The ~55 modals and screen-state variants (inherit from tokens; not hand-matched).
- The design's alternate shell (244px sidebar + 156px header + no top-tabs) — rejected in favour of keeping the current IA.
- New card *features* from the exploration sheets (sparklines, drill-in chevrons, hover Open/Share, ink hero) — those are additive product changes, not a reskin.

## Verification

- `npx tsc --noEmit` clean (no type regressions from primitive edits).
- Existing dashboard component tests (`components/dashboard/__tests__`, `components/dashboard/shell/__tests__`) green.
- Live-verify: run the dev dashboard, screenshot Home / Sites / a Settings page / Billing, compare against the design's rendered frames (tokens, radii, shadows, Inter, sidebar width, nav active accent bar).
- Spot-check that no business behaviour changed (nav still routes, forms still submit, data still loads).
