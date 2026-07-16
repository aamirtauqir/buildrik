# Dashboard IA v2 — 19 nav items → 6+2, full route merge

**Status:** v5 — post design-review AND eng-review (both with cross-model outside voices, 2026-07-16)
**Prototype:** https://claude.ai/code/artifact/ef00ac33-1f30-49ba-b7dc-6253b478eddd (clickable; NOTE: prototype predates D4/D5 — its "Projects: All·Sites·Apps" tabs and "Clients" label are superseded below)

## Problem

The agency sidebar carries 19 primary nav items in 4 loose groups — double the scannable
limit (7±2). Levels are mixed:

- "Apps" (group 1) and "Apps & Integrations" (group 4) — two nav items, one concept.
  Both `/dashboard/integrations` and `/dashboard/settings/integrations` render the SAME
  `IntegrationsContent` component today (live duplication #1).
- "All projects" (254 lines) and "Sites" (670 lines) — both pages query `trpc.sites.list`
  (live duplication #2).
- `settings/page.tsx` (366 lines) stacks nine concerns AND separate sub-routes render the
  same components (live duplication #3).
- Group 4 is a dumping ground: 8 items mixing account settings with product areas.
- Top nav (Marketplace/Learn/Resources) AND the sidebar both carry destinations.
- The command palette hardcodes the old 19-destination taxonomy (second nav SSOT).

## Decisions (user-approved; D-numbers from the design review)

| # | Decision |
|---|---|
| Brainstorm | Target = real product; FULL route merge; straight cut + 308 redirects; no feature flag |
| D4 | **Apps is CUT from Projects.** `apps/page.tsx` renders a static marketplace catalog ("No apps backend exists yet") — not user projects. `/dashboard/apps` → 308 → `/dashboard/marketplace`. Projects = merged sites list, NO type tabs. Type filter returns only when a real apps service exists. |
| D5 | Agency section parent label = **"Agency"** (not "Clients") — tabs: Clients · Reviews · Shared theme · Partner. Label predicts all four; matches agencyOnly gating. |
| D6 | Settings rail = **4 labeled subgroups + Danger** (not 2 clusters). "General"→"Workspace", "AI"→"AI & Credits". Card-by-card mapping table below. |
| D7 | Solo user hitting `/dashboard/agency/*` (old bookmarks via redirects) → **layout-level guard redirects to `/dashboard`**. Route-level agency gate (today gating is data-level only). |
| D8 | **Zero transition affordance** — deliberate. Pre-launch, user base ≈ internal. Redirects rescue URLs, the updated palette rescues search. |
| D9 | Templates stays top-level; Domains stays in Settings. Argument: Templates is creation-flow (will grow with the marketplace/library arc); day-to-day domain work is site-scoped and lives in `sites/[id]/domains` — the workspace-level Domains list is config. |
| D10 | All 9 mechanical fixes folded in (states, mobile, tokens, PageHeader ownership, palette, ⌘K, fact corrections, sweep expansion, workspace sub-route resolution). |
| E1 | **reviews.ts gets the server-side `agency_layer` gate** (the pattern at clients.ts:28) — today it has none while clients/theme are gated. Layout guard is UX; tRPC layer is the security authority. |
| E2 | **Palette `nav-*` entries DERIVE from `NAV_GROUPS`** (SSOT) — not hardcoded-plus-test. Aliases/moved/actions stay hand-written; the contract test covers **every href in the palette file** (settings/action/moved items too), not just `nav-*`. |
| E3 | 5 test groups added (see Tests) — incl. the IRON-RULE regression test for the reviews.ts gate. |
| E4 | **Folder parity is a merge requirement:** the merged Projects page keeps folder create/RENAME/DELETE and the empty-folders-stay-visible guarantee (old projects/page.tsx:46,96,183). Sites' FolderTabs alone (create/select/archive) is not enough. |
| E5 | **Pathname-consumer audit** joins the sweep: grep `usePathname`, `window.location`, `pathname ===` — known hits: contextual-help.tsx:30 (route-keyed help), client-detail-view.tsx:229 (`window.location.href="/dashboard/clients"`). Redirects don't fix behavior keyed to old paths. |
| E6 | `site-header.tsx:47` "Back to sites" → "Back to projects" (`/dashboard/projects`) — detail chrome must match the new IA, not just the breadcrumb. |
| E7 | **SectionTabs is dissolved** (cross-model tension, resolved for Codex's shape): one `useSectionTabActive(href, {index})` helper + shared token classes, and two thin renderers — `SettingsRail` (grouped, vertical, chips on <lg) and `AgencyTabs` (flat, horizontal). Active rule/aria/tokens stay SSOT in the helper; markup doesn't pretend to be shared. |

## Navigation (SSOT: `components/dashboard/shell/sidebar.tsx`)

```ts
const NAV_GROUPS = [
  { items: [
    { label: "Home",      href: "/dashboard",           icon: "LayoutDashboard" },
    { label: "Projects",  href: "/dashboard/projects",  icon: "FolderKanban" },
    { label: "Agency",    href: "/dashboard/agency",    icon: "Briefcase", agencyOnly: true },
    { label: "Media",     href: "/dashboard/media",     icon: "Image" },
    { label: "Templates", href: "/dashboard/templates", icon: "Library" },
    { label: "Settings",  href: "/dashboard/settings",  icon: "Settings" },
  ]},
  { label: "Support", items: [
    { label: "Getting started", href: "/dashboard/getting-started", icon: "Rocket" },
    { label: "Help center",     href: "/dashboard/help",            icon: "HelpCircle" },
  ]},
];
```

- Solo derivation **already exists and works** — `useVisibleGroups()` filters `agencyOnly`
  (sidebar.tsx:70). No `SOLO_NAV` exists (earlier draft's claim was wrong). Solo sees 5+2.
- **`MOBILE_ITEMS` (sidebar.tsx:58) is the real second hardcoded list** — replace with the
  same 6 destinations AND apply the agencyOnly filter (today it has none). Solo mobile = 5
  items. 6 items at 10px labels is the 320px limit — verified acceptable; Agency drops for solo.
- Topbar (`top-nav.tsx`) already owns Marketplace/Learn/Resources — unchanged.
- **`isActiveRoute` special-case:** `pathname.startsWith("/dashboard/sites")` → Projects
  active (site-detail keeps its URLs; its nav parent is Projects).

## Route moves (file-by-file; line counts verified against HEAD)

| Today | New home | Work |
|---|---|---|
| `projects/page.tsx` (254) + `sites/page.tsx` (670) | `projects/page.tsx` — ONE list | the real merge (below) |
| `apps/page.tsx` (79, static catalog) | **deleted** — content already lives at `marketplace` | D4 |
| `clients/page.tsx` (15) | `agency/(tabs)/page.tsx` | move |
| `reviews/page.tsx` (5) | `agency/(tabs)/reviews/page.tsx` | move |
| `theme/page.tsx` (5) | `agency/(tabs)/theme/page.tsx` | move |
| `partner/page.tsx` (106) | `agency/(tabs)/partner/page.tsx` | move |
| `clients/[id]/page.tsx` | `agency/[id]/page.tsx`, OUTSIDE `(tabs)` | move (no tab row on detail) |
| `team` (242), `plans` (248), `usage` (122), `billing` (310), `domains` (113) | `settings/<name>/page.tsx` | move |
| `integrations/page.tsx` (16, duplicate) | delete — `settings/integrations` exists | kill duplicate #1 |
| `libraries/page.tsx` (93) | `templates/page.tsx` | move + rename |
| `comments/page.tsx` (renders ReviewComments) | fold into `agency/(tabs)/reviews` | kill duplicate |
| `settings/workspace/page.tsx` | **becomes the rail's "Workspace" item content** (see mapping) | resolve dual structure |

New files: `agency/(tabs)/layout.tsx` (guard per D7 + SectionTabs), `settings/layout.tsx`
(SectionTabs rail). Deleted: 13 old top-level route folders.

### Survivors (explicitly untouched)

- `sites/[id]/**` (10-page site-detail hub + layout) and `sites/new` — redirect fires ONLY
  on exact `/dashboard/sites`. Site-detail gets a breadcrumb "Projects / {site name}" (D10.8).
- `notifications` (bell-accessed), `marketplace`/`learn`/`resources` (topbar-owned),
  `help/[slug]`, `getting-started`, `media`, `layout.tsx`, `error.tsx`,
  `settings/integrations/vercel-team-picker` (OAuth callback UI).

## Settings — rail structure + card-by-card mapping

Vertical rail, 4 labeled subgroups + isolated Danger (D6). Eyebrow labels use
`--text-eyebrow` (11px):

```
WORKSPACE          PLATFORM             BILLING        PERSONAL
Workspace (index)  Integrations         Plans          Account
Team               AI & Credits         Billing        Profile
Domains            API tokens           Usage          Security
                                                       Notifications
────────────────────────────────────────────────────────────────
Danger zone (bottom, isolated)
```

**Mapping of the current 366-line `settings/page.tsx` (nine stacked concerns) — every card
gets exactly one home:**

| Current card | New home |
|---|---|
| AI credits | Platform › AI & Credits |
| Workspace + Branding | Workspace › Workspace (index — this IS `settings/workspace` content; the old mega-index dies) |
| Profile | Personal › Profile |
| Account | Personal › Account |
| Security | Personal › Security |
| Notifications (prefs) | Personal › Notifications |
| API tokens | Platform › API tokens |
| Transfer ownership | Workspace › Workspace (danger-adjacent card at bottom of that page) |
| Workspace delete | Danger zone (workspace scope) |
| Export data / delete account | Danger zone (account scope — the Danger page carries BOTH scopes as two clearly-labeled sections: "Workspace" and "Your account") |

Existing sub-routes (`account`, `security`, `ai`, `api-tokens`, `danger`, `notifications`,
`integrations`, `workspace`) are the SSOT; they get rail slots per the table. Incoming 5
(team/plans/billing/usage/domains) move in. `settings/page.tsx` becomes a redirect-free
index rendering the Workspace section.

## Projects merge (simplified by D4 — sites only)

Base = `sites/page.tsx` (670; richest: view prefs, filters, folder tabs, bulk).
Old `projects/page.tsx` (254) folds its folders view in — it already queried the same
`trpc.sites.list`. **No type tabs** (D4).

**Folder parity (E4 — merge requirement, not a nice-to-have):** the old projects page owns
folder create/**rename**/**delete** and guarantees **empty folders stay visible**
(projects/page.tsx:46,96,183). Sites' `FolderTabs` (folder-tabs.tsx:11) only does
create/select/archive. The merged page carries ALL folder capabilities — extend FolderTabs
(or a folder-manage menu) rather than silently dropping rename/delete.

- Page title: "Projects" (PageHeader). Control stack order (top→bottom):
  PageHeader (Select · ViewToggle · New site) → FolderTabs (+ Archived) → SiteFilters → content.
- **⌘K double-bind fix (D10.6):** `sites/page.tsx` binds ⌘K to focus its search input;
  the sidebar binds ⌘K to the command palette — both fire today. The merged page DROPS the
  page-level ⌘K; search gets `/` if a key is wanted. Palette owns ⌘K.
- States (reuse `components/states` by name):
  - loading → `LoadingSkeleton`
  - true-empty (no sites) → existing sites empty state, CTA "Create a site"
  - filtered-empty (folder/filter yields 0) → existing `StateEmpty` with clear-filters action
  - error → `ErrorState` with retry

## Section tabs — helper + two renderers (E7; supersedes the single-component D10.3 shape)

`components/dashboard/shell/section-tab-active.ts` — the SSOT:
- `useSectionTabActive(href: string, opts?: { index?: boolean }): boolean` —
  per-item **prefix match, with exact-match exception for the index href** (fixes both
  the "index lights everything" problem and the nested-survivor case —
  `settings/integrations/vercel-team-picker` keeps Integrations lit mid-OAuth).
- Shared token classes exported beside it (active/hover/focus styles, one place).

Two thin renderers (markup NOT pretend-shared — they genuinely differ):
- `SettingsRail` — grouped vertical rail; group eyebrows `--text-eyebrow` (11px);
  collapses to a horizontal scrollable chip row on `<lg`.
- `AgencyTabs` — flat horizontal row, 4 tabs; scrolls on overflow.

Both renderers:
- **Links, not ARIA tabs** — `<nav>` + `aria-current="page"` on the active link.
  Do NOT copy the libraries page's `role="tab"`-on-buttons pattern.
- **Visual: the sidebar's active pattern** (the adjacent visual system):
  `--color-primary-subtle` fill + semibold + primary text; hover = `--color-bg-subtle`;
  `focus-visible` ring in accent. Labels `--text-body` (13px); item padding `py-2 px-3`;
  radius `--radius-sm` (6px); 44px min touch target on mobile.
- **PageHeader ownership (D10.4): the LAYOUT owns the PageHeader** ("Settings", "Agency")
  with tabs beneath; tab pages provide content only (their current `PageHeader`s are removed
  on move). No double headers, no four competing H1s.

## Agency section

`agency/(tabs)/layout.tsx`:
1. **Guard (D7):** if workspace is not agency (`features.agency_layer` false) → `redirect("/dashboard")`.
   While `features.list` is in flight, render `LoadingSkeleton` — tabs must not flash in/out (D10.1).
2. PageHeader "Agency" + horizontal SectionTabs: Clients · Reviews · Shared theme · Partner.
3. Each moved page keeps its own existing loading/error/empty states.

## Command palette (D10.5 — in scope, was the biggest miss)

`components/search/command-palette.tsx` hardcodes the old 19-destination taxonomy plus a
"moved" alias scope from the PREVIOUS migration (descriptions now wrong twice over). Update:

- **`nav-*` entries DERIVE from `NAV_GROUPS`** (E2) — import the SSOT, map labels/hrefs/icons.
  Nav drift becomes structurally impossible.
- `SETTINGS_ITEMS` (command-palette.tsx:38), `ACTION_ITEMS` (:50) and `MOVED_ITEMS` (:66)
  carry their own route semantics — ALL updated: `a-invite` → `/dashboard/settings/team`,
  `a-domain` → `/dashboard/settings/domains`, `s-profile` → `/dashboard/settings/profile`
  (the index is Workspace now, not Profile), `s-workspace` → `/dashboard/settings`, etc.
- "moved" scope: fresh aliases for all 13 relocated names — billing, team, domains, usage,
  plans, partner, theme, reviews, comments, libraries, apps, sites — each pointing at its
  new home with a correct "Moved → Settings › Billing"-style description.
- Contract test beside the NAV_GROUPS test: **every href anywhere in the palette file**
  (nav/settings/action/moved) resolves against the new route table — no entry may point
  at a deleted route.

## Redirects — extend existing `redirects()` in next.config (15 rules, 308)

```
/dashboard/sites         → /dashboard/projects            (exact only)
/dashboard/apps          → /dashboard/marketplace         (D4)
/dashboard/reviews       → /dashboard/agency/reviews
/dashboard/comments      → /dashboard/agency/reviews
/dashboard/partner       → /dashboard/agency/partner
/dashboard/theme         → /dashboard/agency/theme
/dashboard/clients       → /dashboard/agency
/dashboard/clients/:id   → /dashboard/agency/:id
/dashboard/team          → /dashboard/settings/team
/dashboard/plans         → /dashboard/settings/plans
/dashboard/usage         → /dashboard/settings/usage
/dashboard/billing       → /dashboard/settings/billing
/dashboard/domains       → /dashboard/settings/domains
/dashboard/integrations  → /dashboard/settings/integrations
/dashboard/libraries     → /dashboard/templates
```

Permanent (308) because sent emails link `/dashboard/reviews` (2 templates). Next merges
incoming query params onto the destination. Email-template updates ship in the same deploy
(one repo, one deploy — no sequencing gap).

## Responsive (D10.2)

- **Settings rail `<lg`:** horizontal scrollable chip row (group labels become inline
  dividers), `overflow-x: auto`, no wrap. Content full-width below.
- **Agency tabs `<lg`:** same horizontal scroll treatment (4 tabs usually fit; scroll is the overflow rule).
- **MobileTabBar:** 6 destinations, agencyOnly-filtered (solo=5). Existing 10px label limit verified at 320px.
- **Projects `<lg`:** inherits the sites page's existing responsive behavior (list rows);
  folder tabs scroll horizontally.

## Consumer sweep (measured; re-verify each number against HEAD at implementation start — D10.7)

- ~73 internal link edits (21 exact `/dashboard/sites` + 52 across the other routes) —
  numbers from 2026-07-16 grep; re-run the grep before dispatch.
- 5 editor-package links (`/dashboard/billing` ×2, `/settings` ×2, `/team` ×1).
- **Expanded scope (D10.8):** command palette entries, empty-state CTAs, breadcrumbs,
  "back to …" links. Internal links point at new URLs directly — redirects are the safety
  net, not the mechanism.
- **Pathname-consumer audit (E5):** hrefs are not the only consumers. Grep `usePathname`,
  `window.location`, `pathname ===` / `startsWith` across the dashboard. Known hits to fix:
  `contextual-help.tsx:30` (help content keyed to old routes — remap to new paths) and
  `client-detail-view.tsx:229` (`window.location.href = "/dashboard/clients"` → router.push
  to `/dashboard/agency`). Behavior keyed to an old pathname silently degrades even with
  redirects in place.
- **Detail-chrome consistency (E6):** `site-header.tsx:47` "Back to sites" →
  "Back to projects" (`/dashboard/projects`).

## Tests

1. `dashboard-layout.test.ts` — NAV_GROUPS contract on 6+2 (labels, hrefs, agencyOnly only
   on Agency, uniqueness) + `isActiveRoute` sites→Projects special-case.
2. `section-tab-active` test — prefix-match + index exact-exception (helper level) +
   aria-current in both renderers.
3. Redirect-table test — assert all 15 rules.
4. Palette contract test — **every href in the palette file** (nav/settings/action/moved)
   resolves against the new route table; nav-* derived from NAV_GROUPS.
5. MobileTabBar agencyOnly filter test (solo=5, agency=6).
6. **Agency guard test** — solo → redirect `/dashboard`; agency → tabs render;
   `features.list` in flight → skeleton (tabs never flash).
7. **reviews.ts gate REGRESSION test (IRON RULE)** — `agency_layer` off → deny/empty,
   on → data; mirrors the clients.ts:28 pattern's tests.
8. **Projects merge states test** — folders (create/rename/delete/empty-visible), view
   toggle, true-empty vs filtered-empty vs error.
9. **Settings smoke** — all 13 sub-routes render under the rail (no silent 404 from moves).
10. Full suite stays green (4047 baseline).

## Out of scope (explicitly)

- tRPC routers/services/DB — zero changes.
- `?type=app` filter on Projects — returns only when an apps backend exists (D4).
- Moving `sites/[id]` under `/projects/[id]` — URLs stay; breadcrumb covers wayfinding.
- Nav item counts, transition banners (D8), upsell states on Agency for solo (D7 chose redirect).
- Editor package beyond the 5 link edits.

## Risk register

| Risk | Size | Mitigation |
|---|---|---|
| Projects merge (670+254 → one) | biggest chunk | sites page is the base; folders fold in; both queried the same endpoint |
| ~78-link sweep + palette | widest | mechanical; grep-verified per route; palette contract test |
| settings/page.tsx card split (9 concerns → rail homes) | most detailed | mapping table above is the contract |
| Route-group `(tabs)` vs `[id]` under agency | subtle | static > dynamic in Next; `[id]` outside the group |
| MOBILE_ITEMS drift | small | replaced + agencyOnly-filtered + tested |

## What already exists (reused, not rebuilt)

- `useVisibleGroups()` agencyOnly filter (sidebar.tsx:70) — solo derivation, reused as-is.
- `redirects()` block in next.config — extended, not replaced.
- `components/states` (LoadingSkeleton/ErrorState/StateEmpty) — named in the state matrix.
- `components/sites/*` (FolderTabs/SiteFilters/SiteGrid/site-list-view) — merge base.
- `isFeatureEnabled(workspaceId, "agency_layer")` (clients.ts:28 pattern) — copied to reviews.ts.
- Settings sub-route pages (account/security/ai/api-tokens/danger/notifications/integrations/
  workspace) — become the rail SSOT; nothing rewritten.
- The sidebar's active-state visual pattern — reused as the tab token classes.

## Failure modes (per new codepath)

| Codepath | Realistic failure | Test? | Handled? | User sees |
|---|---|---|---|---|
| Agency guard | `features.list` errors → guard can't decide | test 6 | skeleton→error state | error state, no flash |
| reviews.ts gate | flag lookup fails | test 7 | tRPC error → page ErrorState | clear error, no leak |
| Redirects | stale bookmark w/ query | test 3 | Next merges params | lands filtered correctly |
| Projects merge | folders query fails, sites ok | test 8 | folder row hides, list still renders | list w/o folders + toast |
| Palette derive | NAV_GROUPS import cycle | test 4 | build-time failure (loud) | n/a — CI red |
| Settings moves | one sub-route path typo'd | test 9 (smoke) | 404 caught in test | n/a — CI red |

No silent-failure critical gaps: every new path has a test AND visible handling.

## Worktree parallelization

| Step | Modules touched | Depends on |
|---|---|---|
| T1 nav SSOT | components/dashboard/shell/ | — |
| T5 tab helper+renderers | components/dashboard/shell/ | — |
| T2 route moves+redirects | app/dashboard/, next.config | T5 (layouts import renderers) |
| T3 projects merge | app/dashboard/projects/, components/sites/ | — |
| T4 settings split | app/dashboard/settings/ | T5 |
| T6 palette | components/search/ | T1 (derives from NAV_GROUPS) |
| T7 sweep | app/, components/, packages/editor | T2 (new URLs exist) |
| T8 tests | __tests__/ | all |
| T9 DESIGN.md | DESIGN.md | T1 |

Lanes: **A:** T1 → T6 (shared NAV_GROUPS) · **B:** T5 → T2 → T4 (shell → routes) ·
**C:** T3 (independent). Launch A+B+C parallel; then T7 → T8 → T9 sequential.
Conflict flag: A and B both touch `components/dashboard/shell/` — keep T1 and T5 in ONE
worktree or land T1 first (it's small).

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 2 (design + eng voices) | absorbed | design: 6 findings; eng: 6 findings (5 accepted + 1 tension resolved) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 8 issues (1 arch, 1 quality, 5 test-gap groups, 1 tension), all folded; 0 critical gaps open |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR (FULL) | score 6.5/10 → 9/10; 7 decisions (D4–D10); 2 CRITICAL resolved |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CODEX:** design voice (Agency label, 4-subgroup rail, projects schema, palette seam, states, responsive) + eng outside voice (folder-parity regression, full-palette contract, pathname-consumer audit, back-link, SectionTabs overengineering, spec drift) — all absorbed as D5/D6/D10 and E2/E4–E7.
- **CROSS-MODEL:** independent Claude subagent uniquely caught Apps-is-a-catalog (D4), SOLO_NAV phantom, ⌘K double-bind; Codex uniquely caught the folder rename/delete regression and pathname-consumers. One genuine tension (SectionTabs shape) resolved for Codex's helper+renderers (E7).
- **VERDICT:** DESIGN + ENG CLEARED — ready to implement (T1–T9, lanes A/B/C).

NO UNRESOLVED DECISIONS
