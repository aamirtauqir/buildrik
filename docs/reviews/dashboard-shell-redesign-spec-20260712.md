# Dashboard Shell + Design-System Re-Implementation Spec

**Why:** The current dashboard reads as assembled screen-by-screen (Codex audit 2026-07-12, session `019f573a`). It's missing the dc design's **global top nav bar**, put top-level sections (Marketplace/Learn/Resources) in the left sidebar, and every screen hand-rolls its header/cards/spacing with no shared primitives or token contract. This spec turns it into **one cohesive system**: a real shell + a primitive layer + a token contract, then all screens refactored onto them.

**Source of truth:** `~/Downloads/Buildrik Dashboard.dc.html` (metrics extracted below). Accent cobalt `#2D6DFF` (kept). Brand Buildrick.

**Approval gate:** review this doc; I build only after you approve. Nothing below is coded yet.

---

## 0. dc metrics (extracted, ground truth)

- **Top nav (horizontal, top of page):** `Dashboard · Marketplace · Learn · Resources` (states `tDash/tMkt/tLearn/tRes` + active-color states) + **workspace switcher** ("Taiba's Workspace" / "Pro · 6 seats" in **mono**) + **Search (⌘K)** + **Account**. Brand mark far-left.
- **Type scale (px, by usage):** 11, 12, **13 (body/label — dominant)**, 14, 16, 17, 20, **22 (page title)**, 24, 26, 30, 58 (hero).
- **Spacing scale (px):** 8, 10, 12, 14, 16, 18, 20, 24, 32.
- **Radius:** xs 4 / sm 6 / md 8 / lg 10 / xl 12 / pill.
- **Fonts:** `--font-sans` Inter Tight (UI), `--font-mono` **Geist Mono** (data: counts, plans, seats, sizes, dates).
- **Sidebar rail:** ~262–280px. Control heights ~38–42px.

---

## 1. Information architecture (the fix)

Two-level nav, not one:

```
┌─────────────────────────────────────────────────────────────┐
│ TOP NAV (full width, 52px):                                   │
│  Buildrick   Dashboard  Marketplace  Learn  Resources   ⌘K  🔔 ⛭  [WS ▾] [Account ▾] │
├──────────────┬──────────────────────────────────────────────┤
│ SIDEBAR 262  │ CONTENT (offset: top 52 + left 262)            │
│ (workspace/  │                                                │
│  admin nav)  │   PageHeader                                   │
│              │   …sections built from primitives…            │
└──────────────┴──────────────────────────────────────────────┘
```

- **Top nav owns the top-level product areas:** Dashboard, Marketplace, Learn, Resources (the four `tX` tabs). Active tab = cobalt text + underline/pill.
- **Sidebar owns workspace/operational destinations:** My Sites, All projects, Media, Getting started, Team, Billing, Plans, Usage, Domains, Settings, Help + (agency) Clients/Reviews/Comments/Shared-theme/Partner. **Remove Marketplace/Learn/Resources from the sidebar.**
- **Command palette** IA updated to match (top-nav areas + sidebar destinations; agency gating kept).

---

## 2. DashboardShell architecture

Replace the 3 loose files (`layout.tsx`, `sidebar.tsx`, `topbar.tsx`) with a composed shell.

**New:** `components/dashboard/shell/`
- `dashboard-shell.tsx` — orchestrates TopNav + Sidebar + Content; owns the CSS grid/offset math (`--topnav-h: 52px`, `--sidebar-w: 262px`).
- `top-nav.tsx` — full-width bar: brand · 4 top-level tabs (active-aware via `usePathname`) · spacer · `⌘K` search trigger · notifications · help · **WorkspaceSwitcher** · **AccountMenu**. Height 52px, `border-b`, `bg-surface`.
- `workspace-switcher.tsx` — name + "Pro · 6 seats" (mono) + dropdown (reuse existing workspace-select data).
- `sidebar.tsx` (rewritten) — 262px rail **below** the top nav (`top: var(--topnav-h)`), grouped nav (workspace/admin only), footer (plan + usage + upgrade). Keeps solo/agency gating.
- `account-menu.tsx` — moves the existing avatar-dropdown into the top nav.

**`app/dashboard/layout.tsx`** becomes: `<DashboardShell>{children}</DashboardShell>`. Content region: `padding-top: var(--topnav-h)`, `margin-left: var(--sidebar-w)`, `max-w-[1220px]` inner, `p-8`.

Mobile: top nav collapses to brand + hamburger + account; sidebar → drawer; existing MobileTabBar retained.

---

## 3. Token contract (globals.css `@theme`)

Add (currently missing):
```css
/* radius scale */
--radius-xs: 4px; --radius-sm: 6px; --radius-md: 8px;
--radius-lg: 10px; --radius-xl: 12px; --radius-pill: 9999px;
/* mono for data */
--font-mono: 'Geist Mono', ui-monospace, monospace;
/* shell */
--topnav-h: 52px;   --sidebar-w: 262px;  (existing --sidebar-width folds in)
/* named text tokens (size/line/weight) */
--text-page-title: 22px;      /* h1 */
--text-section-title: 15px;   /* section headings */
--text-eyebrow: 11px;         /* uppercase labels / stat eyebrow */
--text-metric: 24px;          /* stat/metric value (mono) */
--text-body: 13px; --text-body-sm: 12px;
```
Rules: **no more arbitrary `text-[22px]` or freehand `rounded-*`/`p-[n]`** — components consume tokens/primitives. Numeric/data values (counts, $, sizes, seats, dates) render in `--font-mono` `tabular-nums`.

---

## 4. Primitive layer

**New:** `components/dashboard/primitives/`

| Primitive | Props | Replaces |
|---|---|---|
| `PageHeader` | `title, description?, actions?` | every hand-rolled `<header>` (12+ screens) |
| `SectionCard` | `title?, description?, actions?, children, padding?` | site-detail local `Section` (settings-tab, seo-tab) + ad-hoc `rounded-xl border` blocks |
| `StatCard` | `label, value, delta?, icon?, mono?` | dashboard `stat-card`, team `stat-cards`, site-detail overview stat box, usage tiles, partner `Metric` |
| `DataTable` | `columns, rows, empty?` | hand-rolled `<table>` in domains/partner/members/invoice |
| `Pill` | `tone (neutral/success/warning/error/accent), children` | status pills scattered across sites/domains/team/billing |
| `ProgressBar` | `pct, tone?` | usage/getting-started/partner/sidebar bars |
| `MetricValue` | `children` (wraps mono+tabular-nums) | all numeric displays |

Each owns radius (`--radius-*`), padding (spacing scale), surface (`--color-bg-surface` + `--color-border-default`), and title/eyebrow typography (text tokens). Screens compose these — they stop styling directly.

---

## 5. Screen refactor map (batches)

**Batch 1 — new screens (10):** marketplace, apps, learn, resources, getting-started, projects, libraries, plans, usage, partner → swap hand-rolled header→`PageHeader`, cards→`SectionCard`/`StatCard`, tables→`DataTable`, pills→`Pill`, bars→`ProgressBar`, numbers→mono. Delete `Metric` in partner.
**Batch 2 — existing top-level:** dashboard home (stat cards, needs-attention, recent sites, activity), team (stat-cards → StatCard), billing (plan-card/usage-bars/invoice-table), sites index, settings shell.
**Batch 3 — site-detail cluster:** `sites/[id]/layout` (into shell content), site-header, tab-nav, overview/settings/seo/domains/redirects/access/analytics → delete local `Section`/stat boxes, use primitives.

Each batch ends: tsc 0, live-verify (fresh-tab screenshots per [[reference_dashboard_screenshot_fresh_tab]]), 0 old-red, cobalt intact.

---

## 6. Sequencing + guardrails

1. Token contract (§3) — additive, no visual change yet.
2. Primitive layer (§4) — build + unit-render, not yet consumed.
3. DashboardShell + TopNav + sidebar rewrite (§2) — the headline structural fix; screenshot the new shell.
4. Batch 1 → 2 → 3 refactors (§5), each independently verified.
5. Delete dup primitives (dashboard/stat-card, team/stat-cards, site-detail local Section, partner Metric) once callers move.
- **Guardrails:** cobalt accent unchanged; error/danger stay red; no route renames; DESIGN.md updated with the shell + token contract; brand Buildrick. Commit per batch.

**Est. scope:** shell rewrite + 7 primitives + token contract + ~22 screens refactored + dup deletion. Multi-hour, multi-commit. This supersedes the piecemeal layer in commit `1c8fae40` (keeps the cobalt tokens + new-screen *content/logic*; rebuilds their *structure* on primitives).
