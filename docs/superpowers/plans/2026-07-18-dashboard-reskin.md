# Dashboard Reskin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the existing dashboard to the "Buildrik Dashboard_final" design language (tokens, Inter font, premium card/shadow set, restyled shell) without changing any business logic.

**Architecture:** The dashboard is already token-driven — components read `var(--color-*)` inline and Tailwind utilities (`text-body`, `rounded-lg`, `shadow-card`) that compile from the `@theme inline` block in `packages/dashboard/app/globals.css`. Verified live: those custom properties ARE emitted to `:root`, so changing a token value in globals.css propagates to both utilities and inline `var()` references on the next compile. The reskin is therefore mostly value changes in globals.css plus surgical tweaks to the 8 primitives and the shell. No component APIs change.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4 (`@theme inline`), TypeScript, Bunny Fonts.

## Global Constraints

- **No business-logic change.** Do not touch tRPC calls, services, `server/`, data fetching, mutations, routing, or form validation. Visual / token / props-preserving edits only.
- **SSOT:** every token change lives in `packages/dashboard/app/globals.css`. No new inline hex outside that block.
- **Single accent** cobalt `#2D6DFF`. No purple / violet / indigo as accents (DESIGN.md). Keep the existing categorical palette (teal / amber / pink / ink) for avatars/icon tiles only.
- **Keep the current IA** — top-tabs + sidebar. Reskin, do not restructure navigation.
- **Out-of-scope surfaces stay untouched:** auth (`--color-auth-*`), onboarding (`--color-onb-*`), and the editor. The Inter font must be scoped to the dashboard only — those surfaces keep Inter Tight.
- **Turbopack CSS staleness:** after editing `globals.css`, the running dev server may serve stale compiled CSS. Stop dev → `rm -rf .next` → restart dev before live-verifying (proven this session).
- Canonical design values are transcribed in `docs/superpowers/specs/2026-07-18-dashboard-reskin-final-design.md` (from `fig-tokens.css` + `Shell.dc.html`).
- All paths below are relative to `packages/dashboard/` unless noted.

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `app/globals.css` | Token layer — the entire reskin's foundation (colours, radii, shadows, nav/status tokens, sidebar width) | 1 |
| `app/layout.tsx` | Load Inter via Bunny Fonts (root layout — keep Inter Tight for out-of-scope surfaces) | 2 |
| `components/dashboard/shell/dashboard-shell.tsx` | Scope Inter to the dashboard subtree; content column width | 2, 6 |
| `../../DESIGN.md` (repo root) | Typography note (Inter for dashboard) | 2 |
| `components/dashboard/primitives/stat-card.tsx` | KPI/stat tile | 3 |
| `components/dashboard/primitives/section-card.tsx` | Boxed section surface | 3 |
| `components/dashboard/primitives/metric-value.tsx` | Mono numeric wrapper | 3 |
| `components/dashboard/primitives/button.tsx` | The one button shape | 4 |
| `components/dashboard/primitives/pill.tsx` | Status/label pill | 4 |
| `components/dashboard/primitives/data-table.tsx` | Bordered table shell | 5 |
| `components/dashboard/primitives/page-header.tsx` | Page title chrome | 5 |
| `components/dashboard/primitives/progress-bar.tsx` | Usage/progress meter | 5 |
| `components/dashboard/shell/sidebar.tsx` | Sidebar nav + plan card | 6 (own task) |
| `components/dashboard/shell/top-nav.tsx`, `workspace-switcher.tsx`, `settings-rail.tsx`, `agency-tabs.tsx` | Shell follow-through | 6 |

---

## Task 1: Token layer + premium shadows (`app/globals.css`)

**Files:**
- Modify: `packages/dashboard/app/globals.css` (the dashboard token block, `@theme inline`)

**Interfaces:**
- Produces: updated token values + new tokens (`--color-nav-*`, `--color-status-*`, `--radius-2xl`, `--shadow-ring`/`-card`/`-card-hover`/`-panel`/`-modal`, `--text-display`) consumed by every later task. `--sidebar-w` becomes `244px`.

Only touch the **dashboard** token group (the block under `/* Dashboard colors — dc design tokens … */`). Do NOT touch `--color-auth-*` or `--color-onb-*`.

- [ ] **Step 1: Change the drifted colour tokens.** In the dashboard block, set these exact values:

```css
--color-bg-page: #FAFAFC;        /* was #F9FAFC */
--color-bg-subtle: #F1F5F9;      /* was #F3F5F8 */
--color-border-default: #E5E8ED; /* was #E8EAEF */
--color-border-strong: #CCD1DB;  /* was #D6DAE1 */
--color-text-primary: #334155;   /* was #1C212C — slate; weight carries hierarchy */
```

Leave `--color-primary` (#2D6DFF), `--color-primary-hover` (#1950DC), `--color-primary-subtle` (#EBF1FF), `--color-text-secondary` (#6B7380), and the status `--color-*-subtle`/`--color-*-text` tokens unchanged.

- [ ] **Step 2: Add nav + status tokens.** Append inside the dashboard block:

```css
/* Sidebar nav item states (design: Shell.dc.html) */
--color-nav-item-active-bg: #EBF1FF;
--color-nav-label: #475569;
--color-nav-label-active: #1950DC;
/* Status fg/bg — status.live=success, review=warning, failed=error, draft=neutral */
--color-status-live-bg: #DCFCE7;   --color-status-live-fg: #15803D;
--color-status-review-bg: #FEF3C7; --color-status-review-fg: #D97706;
--color-status-failed-bg: #FEE2E2; --color-status-failed-fg: #DC2626;
--color-status-draft-bg: #F7FAFA;  --color-status-draft-fg: #6B7380;
```

- [ ] **Step 3: Add `--radius-2xl` + the premium shadow set.** In the radius group add `--radius-2xl: 16px;`. Replace the existing `--shadow-card` and add the rest:

```css
--shadow-ring: inset 0 0 0 1px var(--color-border-default);
--shadow-card: inset 0 0 0 1px var(--color-border-default), 0 1px 1px rgba(16,24,40,0.04), 0 2px 4px -2px rgba(16,24,40,0.07);
--shadow-card-hover: inset 0 0 0 1px var(--color-border-strong), 0 4px 10px -4px rgba(16,24,40,0.12), 0 1px 3px rgba(16,24,40,0.07);
--shadow-panel: 0 0 0 1px rgba(15,23,42,0.10), 0 18px 40px -24px rgba(15,23,42,0.16);
--shadow-modal: 0 24px 60px -12px rgba(15,23,42,0.35);
```

- [ ] **Step 4: Add the display type size + narrow the sidebar.** In the named-text group add `--text-display: 28px; --text-display--line-height: 1.2; --text-display--font-weight: 700;`. In the shell group change `--sidebar-w: 272px;` → `--sidebar-w: 244px;`.

- [ ] **Step 5: Typecheck + restart dev.**

Run:
```bash
cd packages/dashboard && npx tsc --noEmit 2>&1 | grep -E "globals|error TS" || echo "clean"
```
Expected: `clean` (globals.css is not typechecked; confirms no accidental TS breakage). Then stop the dev server, `rm -rf .next`, restart `npm run dev`.

- [ ] **Step 6: Live-verify tokens resolved.** Load `http://localhost:3000/dashboard`, in the console/JS check `getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary')` → `#334155` and `--color-border-default` → `#E5E8ED`, and `--sidebar-w` → `244px`. Confirm the page still renders (no layout break).

- [ ] **Step 7: Commit.**
```bash
git add packages/dashboard/app/globals.css
git commit -m "feat(dashboard): reskin token layer — slate text, refined borders, premium shadows, 244px sidebar"
```

---

## Task 2: Inter font (scoped to dashboard) + DESIGN.md

**Files:**
- Modify: `packages/dashboard/app/layout.tsx` (Bunny Fonts URL)
- Modify: `packages/dashboard/components/dashboard/shell/dashboard-shell.tsx` (scope font on the dashboard root)
- Modify: `DESIGN.md` (repo root — typography note)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: Inter available app-wide via Bunny; applied only under the dashboard shell root.

The root `app/layout.tsx` wraps the whole app, so `--font-sans` must NOT change globally (auth/onboarding/editor keep Inter Tight). Load Inter, then set it on the dashboard shell's outermost element only.

- [ ] **Step 1: Add Inter to the Bunny Fonts link.** In `app/layout.tsx`, change the stylesheet href to include Inter (keep inter-tight + geist-mono):

```
href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800|inter-tight:400,500,600,700|geist-mono:400,500&display=swap"
```

- [ ] **Step 2: Find the dashboard shell root.** Read `components/dashboard/shell/dashboard-shell.tsx` and identify its outermost wrapper element (the div that contains the top-nav + sidebar + content).

- [ ] **Step 3: Scope Inter to the dashboard.** Add `style={{ fontFamily: "'Inter', 'Inter Tight', sans-serif" }}` to that outermost element (merge with any existing style). This cascades Inter to all inheriting descendants; auth/onboarding/editor (outside this subtree) keep Inter Tight.

- [ ] **Step 4: Guard against explicit `.font-sans` inside the dashboard.** Run:
```bash
cd packages/dashboard && grep -rn 'font-sans' components/dashboard app/dashboard || echo "none"
```
For any match that would re-pin Inter Tight inside the dashboard (an explicit `font-sans` class on dashboard content), remove that class so the element inherits Inter. `font-mono` is fine — leave it.

- [ ] **Step 5: Update DESIGN.md.** In the typography section, note that the **dashboard** body/UI face is Inter (scoped), while auth/onboarding keep Inter Tight, and Geist Mono remains the data face. One or two lines — do not rewrite the section.

- [ ] **Step 6: Restart dev + live-verify the font boundary.** Restart is not required (layout/component change, HMR handles it), but reload. On `http://localhost:3000/dashboard`, JS-check a dashboard text element's `getComputedStyle(el).fontFamily` → starts with `Inter` (not "Inter Tight"). On `http://localhost:3000/onboarding/workspace` and `/auth/login`, confirm computed font still starts with `"Inter Tight"`.

- [ ] **Step 7: Commit.**
```bash
git add packages/dashboard/app/layout.tsx packages/dashboard/components/dashboard/shell/dashboard-shell.tsx DESIGN.md
git commit -m "feat(dashboard): scope Inter font to the dashboard shell (auth/onboarding keep Inter Tight)"
```

---

## Task 3: Card primitives — stat-card, section-card, metric-value

**Files:**
- Modify: `components/dashboard/primitives/stat-card.tsx`
- Modify: `components/dashboard/primitives/section-card.tsx`
- Modify: `components/dashboard/primitives/metric-value.tsx`
- Test: `components/dashboard/__tests__/` (run whatever covers these; none may exist — rely on tsc + live-verify)

**Interfaces:**
- Consumes: `--shadow-card`, `--shadow-card-hover`, `--font-mono`, updated border/text tokens from Task 1.
- Produces: no API change — same props, restyled output.

- [ ] **Step 1: Reskin `stat-card.tsx`.** In the `cardStyle` object change `borderRadius: "10px"` → `"12px"` and replace the `boxShadow` line with `boxShadow: "var(--shadow-card)"`. On the `href` (link) branch, change the hover class from `hover:border-[var(--color-primary)]` to a hover shadow: keep the border and add `style` hover via a class — set the link className to include `hover:[box-shadow:var(--shadow-card-hover)]`. Change the label `<p>` to use the mono font and the design's spec: replace its className/style with:

```tsx
<p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--color-text-secondary)" }}>{label}</p>
```

Leave the value (`text-[27px]`, `fontWeight: 730`, `tabular-nums`, `-0.02em`) and delta as-is.

- [ ] **Step 2: Reskin `section-card.tsx`.** Change `rounded-[10px]` → `rounded-[12px]` on the `<section>`. Keep `shadow-card` (now the premium value from Task 1) and the border token. No other change.

- [ ] **Step 3: `metric-value.tsx`.** Confirm it stays `font-mono tabular-nums`. No value change needed (it inherits size/weight from context). Leave as-is unless the review finds drift — this step is a no-op check.

- [ ] **Step 4: Typecheck + tests.**
```bash
cd packages/dashboard && npx tsc --noEmit 2>&1 | grep -E "stat-card|section-card|metric-value|error TS" || echo "clean"
npx vitest run components/dashboard 2>&1 | tail -15 || true
```
Expected: `clean`; any existing dashboard component tests green.

- [ ] **Step 5: Live-verify.** On `http://localhost:3000/dashboard`, confirm the stat cards show a 12px radius, the inset-ring + soft shadow, and a **mono uppercase** label; section cards render with 12px radius. No layout shift.

- [ ] **Step 6: Commit.**
```bash
git add packages/dashboard/components/dashboard/primitives/stat-card.tsx packages/dashboard/components/dashboard/primitives/section-card.tsx packages/dashboard/components/dashboard/primitives/metric-value.tsx
git commit -m "feat(dashboard): reskin card primitives — 12px radius, ring shadow, mono stat labels"
```

---

## Task 4: Control primitives — button, pill

**Files:**
- Modify: `components/dashboard/primitives/button.tsx`
- Modify: `components/dashboard/primitives/pill.tsx`

**Interfaces:**
- Consumes: `--radius-sm` (6px), status tokens from Task 1.
- Produces: no API change (`Button`, `ButtonLink`, `Pill`, `PillTone` signatures unchanged).

- [ ] **Step 1: Reskin `button.tsx`.** Change the `BASE` constant's `rounded-[9px]` → `rounded-[6px]`. Give the primary variant the design's subtle cobalt shadow — change the `primary` entry in `VARIANTS` to:

```tsx
primary: "bg-[var(--color-primary)] text-white shadow-[0_1px_2px_rgba(45,109,255,0.28)] hover:bg-[var(--color-primary-hover)] hover:shadow-[0_4px_10px_rgba(45,109,255,0.32)]",
```

Leave `ghost` and `danger` unchanged (they follow the updated border/error tokens automatically).

- [ ] **Step 2: `pill.tsx` — confirm tone mapping.** The existing `TONES` already map `success`/`warning`/`error`/`accent`/`neutral` to `*-subtle`/`*-text` tokens, which now carry the design's status colours. No structural change required. This step is a no-op check — leave the file as-is unless review finds a tone reading a wrong token.

- [ ] **Step 3: Typecheck + tests.**
```bash
cd packages/dashboard && npx tsc --noEmit 2>&1 | grep -E "button|pill|error TS" || echo "clean"
npx vitest run components/dashboard 2>&1 | tail -15 || true
```
Expected: `clean`; existing tests green.

- [ ] **Step 4: Live-verify.** On a page with a primary button (e.g. a settings page or `/dashboard`), confirm the button has a 6px radius and a soft cobalt shadow that deepens on hover; status pills render with the correct subtle bg + text colour.

- [ ] **Step 5: Commit.**
```bash
git add packages/dashboard/components/dashboard/primitives/button.tsx packages/dashboard/components/dashboard/primitives/pill.tsx
git commit -m "feat(dashboard): reskin button (6px radius + cobalt shadow); confirm pill status tones"
```

---

## Task 5: Layout primitives — data-table, page-header, progress-bar

**Files:**
- Modify: `components/dashboard/primitives/data-table.tsx`
- Modify: `components/dashboard/primitives/page-header.tsx`
- Modify: `components/dashboard/primitives/progress-bar.tsx`

**Interfaces:**
- Consumes: `--text-display`, `--color-bg-subtle`, updated borders from Task 1.
- Produces: no API change.

- [ ] **Step 1: `data-table.tsx`.** Change the wrapper `rounded-lg` → `rounded-[12px]`. Keep `shadow-card` (now premium). Borders/`bg-subtle` header follow the updated tokens automatically — no other change.

- [ ] **Step 2: `page-header.tsx`.** Enlarge the title to the design's display size. Change the `<h1>` className from `text-page-title font-[720] tracking-[-0.02em]` to:

```tsx
<h1 className="text-[28px] font-bold leading-[1.2] tracking-[-0.02em]" style={{ color: "var(--color-text-primary)" }}>{title}</h1>
```

Do NOT add a search pill or command-palette control here — that is interactive/logic and out of scope. Keep `description` + `actions` exactly as they are.

- [ ] **Step 3: `progress-bar.tsx`.** Change the track height `h-1.5` → `h-[5px]` and the track `backgroundColor` from `var(--color-border-default)` → `var(--color-bg-subtle)`. Keep the fill logic (accent/warning/error/auto) unchanged.

- [ ] **Step 4: Typecheck + tests.**
```bash
cd packages/dashboard && npx tsc --noEmit 2>&1 | grep -E "data-table|page-header|progress-bar|error TS" || echo "clean"
npx vitest run components/dashboard 2>&1 | tail -15 || true
```
Expected: `clean`; existing tests green.

- [ ] **Step 5: Live-verify.** On a page with a table (e.g. `/dashboard/settings/domains` or `/dashboard/settings/team`) confirm the 12px radius; on any page confirm the title reads at 28px; on a usage page (`/dashboard/settings/usage` or `/dashboard/getting-started`) confirm the 5px progress track.

- [ ] **Step 6: Commit.**
```bash
git add packages/dashboard/components/dashboard/primitives/data-table.tsx packages/dashboard/components/dashboard/primitives/page-header.tsx packages/dashboard/components/dashboard/primitives/progress-bar.tsx
git commit -m "feat(dashboard): reskin table/page-header/progress-bar primitives"
```

---

## Task 6: Sidebar reskin — 244px, active accent bar, plan card

**Files:**
- Modify: `components/dashboard/shell/sidebar.tsx`
- Test: `components/dashboard/shell/__tests__/` (run; keep green)

**Interfaces:**
- Consumes: `--sidebar-w` (244px, Task 1), `--color-nav-item-active-bg`, `--color-nav-label`, `--color-nav-label-active`, `--color-primary`.
- Produces: restyled sidebar; new bottom plan card (display-only).

Read `sidebar.tsx` fully first — it already renders the nav items and reads the active route. Preserve every `href`, active-detection, and data read; change only styling and add the plan card markup.

- [ ] **Step 1: Restyle nav items to the design's active state.** For each nav item, the resting style is transparent bg + label `var(--color-nav-label)` weight 400 + icon stroke `var(--color-text-primary)`. The **active** item is: `background: var(--color-nav-item-active-bg)`, `box-shadow: inset 3px 0 0 var(--color-primary)` (left accent bar), label `var(--color-nav-label-active)` weight 600, icon stroke `var(--color-primary)`. Item metrics: height 44px, `border-radius: var(--radius-lg)` (10px), horizontal padding 15px, icon/label gap 14px. Apply via the existing active/inactive branching — do not change which item is active or its `href`.

- [ ] **Step 2: Add the bottom plan card (display-only).** Below the nav list, pinned to the sidebar bottom (border-top `var(--color-border-default)`, padding `14px 20px 16px`), render: a row with "Plan" (13px, weight 600, `--color-text-primary`) + a tier pill (`Pill tone="neutral"` with the current plan name); a "Sites" usage row (label `--color-text-secondary` 11px + `usage` text 12px weight 500) over a `ProgressBar pct={usagePct}`; and an "Upgrade ↗" link (12px, weight 500, `--color-primary`) pointing at the existing plans route (`/dashboard/settings/plans`). Use ONLY plan/usage values already available to the sidebar (read from the same source the current sidebar/shell already uses; if plan/usage is not currently passed to the sidebar, wire it through from data the shell already fetches — do NOT add a new tRPC query). If the data is genuinely unavailable without new fetching, render the card with the plan name only and omit the usage bar, and note it for the final review.

- [ ] **Step 3: Typecheck + shell tests.**
```bash
cd packages/dashboard && npx tsc --noEmit 2>&1 | grep -E "sidebar|error TS" || echo "clean"
npx vitest run components/dashboard/shell 2>&1 | tail -20
```
Expected: `clean`; shell tests green (update a test only if it asserts the old 272px width or an old nav class — a legitimate expectation change, not a behavior change).

- [ ] **Step 4: Live-verify.** On `http://localhost:3000/dashboard`, confirm: sidebar is 244px wide; the active nav item has the cobalt left accent bar + tinted bg + cobalt bold label; inactive items are slate; the plan card sits at the bottom with the usage bar. Click through 2–3 nav items — routing still works, active state moves correctly.

- [ ] **Step 5: Commit.**
```bash
git add packages/dashboard/components/dashboard/shell/sidebar.tsx
git commit -m "feat(dashboard): reskin sidebar — 244px, cobalt active accent bar, plan card"
```

---

## Task 7: Shell follow-through + final verification

**Files:**
- Modify (as needed): `components/dashboard/shell/top-nav.tsx`, `dashboard-shell.tsx`, `workspace-switcher.tsx`, `settings-rail.tsx`, `agency-tabs.tsx`
- Test: full dashboard suite

**Interfaces:**
- Consumes: all tokens from Task 1; Inter scope from Task 2.

- [ ] **Step 1: Audit the shell for hardcoded values.** Run:
```bash
cd packages/dashboard && grep -rnE '#[0-9A-Fa-f]{6}|272px|rounded-\[10px\]' components/dashboard/shell || echo "none"
```
For each hardcoded hex, replace with the matching `var(--color-*)` token; replace any lingering `272px` with `var(--sidebar-w)`; replace `rounded-[10px]` on cards/surfaces with `rounded-[12px]`. Do NOT change layout structure or the top-tabs.

- [ ] **Step 2: Confirm the content column tracks the sidebar width.** In `dashboard-shell.tsx`, verify the content region offsets by `var(--sidebar-w)` (now 244px), not a hardcoded 272. Fix if hardcoded.

- [ ] **Step 3: Typecheck + full dashboard tests.**
```bash
cd packages/dashboard && npx tsc --noEmit 2>&1 | grep -E "error TS" | grep -v "e2e/browserstack-local" || echo "clean"
npx vitest run components/dashboard 2>&1 | tail -25
```
Expected: `clean` (the pre-existing `e2e/browserstack-local.ts` error is unrelated — ignore it); all dashboard component + shell tests green.

- [ ] **Step 4: Live-verify against the design.** Restart dev if globals changed since last restart. Screenshot and eyeball these four against the design's rendered frames (tokens, Inter, 12px cards, ring/premium shadows, 244px sidebar, cobalt active accent bar):
  - `http://localhost:3000/dashboard` (Home — stat cards, sidebar, plan card)
  - `http://localhost:3000/dashboard/sites` (Sites — project/site cards)
  - `http://localhost:3000/dashboard/settings/team` (a table screen)
  - `http://localhost:3000/dashboard/settings/billing` (buttons, pills, sections)

- [ ] **Step 5: Confirm no business behaviour changed.** On one screen each: nav routes correctly, a form still submits (or shows its validation), and data still loads (no empty/error state that wasn't there before).

- [ ] **Step 6: Commit.**
```bash
git add packages/dashboard/components/dashboard/shell/
git commit -m "feat(dashboard): shell token/width follow-through + reskin verification"
```

---

## Self-review notes

- **Spec coverage:** tokens (T1), font (T2), shadows (T1), 8 primitives (T3 stat/section/metric, T4 button/pill, T5 table/page-header/progress), shell (T6 sidebar, T7 top-nav/shell/others), DESIGN.md (T2), verification (each task + T7). All spec sections mapped.
- **No business logic:** every task is styling/token only; the sidebar plan card and page-header explicitly forbid new queries / interactive controls.
- **Out-of-scope protection:** Inter is scoped in T2; T1 touches only the dashboard token group.
- **Testing reality:** this is a visual reskin — the regression guard is the existing dashboard/shell test suite (kept green each task) plus live-verify. No brittle CSS-value unit tests are added.
