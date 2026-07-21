# Template Browser Redesign — Design

**Date:** 2026-07-21
**Status:** Approved (design), pending implementation plan
**Scope:** UI-focused. Dashboard template discovery. No change to the AI-generate or blank-site paths.

## Problem

The dashboard Templates tab (`/dashboard/templates`) is a plain grid whose cards
link out to the create flow (`/dashboard/sites/new?method=template&template=<id>`).
There is no dedicated place to *browse* templates — filter, page, and open one on
its own full page. The user wants an Envato-Elements-style browser:

- A full-page template browser reached from the dashboard.
- A left filter rail (Envato-style).
- A grid with numbered pagination.
- Clicking a card opens that template on its **own full page** with a back
  button to return.

## Non-goals

- **The `sites/new` create flow is untouched.** Its in-flow modal gallery +
  preview stays for the "I'm creating a site, pick a template" context. This
  leaves two template surfaces (browse vs create) — accepted for now; a later
  pass can unify them. Called out so it is a decision, not an accident.
- **No fabricated filters.** Envato exposes tags, colours, layout attributes,
  "compatible with", etc. The `Template` model has none of that data. Inventing
  those filters would repeat the hardcoded-fake-cards anti-pattern that was just
  removed from this same page. Only data-backed filters ship.
- No slug-based detail URLs (uses the existing id-based `templates.get`).
- No change to how a template is cloned into a site (`templates.use` as-is).

## Data reality (what the backend already supports)

`Template` model fields: `id, name, slug, category, description, thumbnail,
previewUrl, difficulty, pages, usageCount, isActive, workspaceId, timestamps`.

`listTemplates(input, workspaceId)` **already** implements:
- `category` filter (ALL + PORTFOLIO/BUSINESS/BLOG/AGENCY/ECOMMERCE/RESTAURANT)
- `search` free-text over name + description (case-insensitive, scope-safe)
- `sort` (popular / newest / alphabetical)
- pagination — returns `{ data, total, page, totalPages }`
- workspace scoping (global built-ins + caller's own clones only)

`templates.get({ id })` and `templates.use({ templateId, siteName })` exist and
are unchanged.

**The only backend gap is the difficulty filter** (the field exists and is
returned, but is not a `where` clause).

## Filters that ship

| Filter | Data-backed? | Work |
|--------|--------------|------|
| Category | Yes | wire only |
| Sort (Popular/Newest/A-Z) | Yes | wire only |
| Search (name + description) | Yes | wire only |
| Difficulty (Beginner/Intermediate/Advanced) | Field exists, not filtered | +3 lines (schema enum + `where.difficulty`) |

Envato extras (tags, colour, layout attributes) are explicitly out — no data.

## Routes & shell

Two routes, both **full-width** (workspace sidebar hidden, like Marketplace):

- `/dashboard/templates` — the browser (redesign of the existing page)
- `/dashboard/templates/[id]` — the template detail page (new)

Both are added to `FULL_WIDTH_ROUTES` in
`components/dashboard/shell/nav.ts`, so `isFullWidthRoute()` hides the sidebar
and marks the topbar "Dashboard" link inactive — identical to how Marketplace /
Learn / Resources / Help already behave.

**Known consequence:** "Templates" is a *sidebar* item, so navigating to it
collapses the sidebar. A persistent "← Dashboard" control on the browser returns
to `/dashboard`. This mirrors the ecosystem full-width pages and is intentional.

## Browser page (`/dashboard/templates`)

Layout (full-width):

```
┌────────────┬──────────────────────────────────┐
│ ← Dashboard│ Templates            [ Search... ]│
│            │ ┌────┬────┬────┬────┐             │
│ FILTERS    │ │card│card│card│card│  card = Link │
│ Category   │ ├────┼────┼────┼────┤  → /[id]     │
│  ▸ All …   │ │card│card│card│card│             │
│ Difficulty │ └────┴────┴────┴────┘             │
│  ▸ 3 levels│  ‹ 1 2 3 4 5 ›   (numbered)       │
│ Sort  ▾    │                                   │
└────────────┴──────────────────────────────────┘
```

- **Top row:** "← Dashboard" back link, "Templates" title, search box.
- **Left filter rail (~240px):** Category (vertical list), Difficulty (vertical
  list), Sort (dropdown or list). Envato-style vertical sections.
- **Grid:** responsive — 4 columns at full width, degrading 3 / 2 / 1. Each cell
  is a `<Link>` to `/dashboard/templates/<id>` wrapping the card visual
  (thumbnail, name, category + difficulty pills, usage count).
- **Numbered pagination** under the grid, driven by `totalPages`.
- **Libraries** stays as a small segmented toggle at the top of the browser
  (Templates | Libraries); the Libraries side keeps its current empty state.

**Filter state lives in the URL query string**
(`?category=&difficulty=&sort=&search=&page=`) so it is shareable and
browser-back works. A pure helper maps params ⇄ filter state (mirrors the
existing `initial-view.ts` pattern) so the mapping is unit-testable without
mounting the page.

**States:** loading skeleton (grid), empty ("No templates match these filters"
with a clear-filters action), error (retry).

## Detail page (`/dashboard/templates/[id]`)

```
┌────────────────────────────────────────┐
│ ← Back to templates                    │
│ ┌──────────────┐  <name>               │
│ │              │  <category> · <diff>   │
│ │ big preview  │  <usageCount> sites    │
│ │  (iframe)    │  <description>         │
│ └──────────────┘  [ Use this template →]│
│                   [ Live preview ↗ ]    │
└────────────────────────────────────────┘
```

- "← Back to templates" returns to the browser (`router.back()` to preserve the
  filter query; falls back to `/dashboard/templates`).
- Big preview: `<iframe src={previewUrl}>` when present, else the large
  thumbnail, else a neutral placeholder.
- Meta: name, category, difficulty, usage count, description.
- **Use this template →** calls `templates.use({ templateId, siteName })` where
  `siteName` defaults to the template's own `name` (this page has no name input;
  the site can be renamed later in the editor) → success toast →
  `getEditorHref(site.id, unified)` → editor. Mirrors the existing create-flow
  handler exactly.
- **Live preview ↗** opens `previewUrl` in a new tab (hidden when null).
- **States:** loading skeleton; bad/removed id → error state with "Browse
  templates" back to the browser. (The existing `sites/new` preview cold-load
  states are the reference — the detail page must not fall through to a blank
  screen.)

Route param is the template **id** (matches `templates.get({ id })`; no
get-by-slug needed).

## Components

- `TemplateFilterRail` — renders the Category / Difficulty / Sort sections from
  the current filter state; emits changes. No data fetching.
- `TemplateBrowser` — the browser page body: rail + grid + pagination, owns the
  `templates.list` query and the param↔state sync.
- `TemplateDetail` — the detail page body: `templates.get` query, meta, CTAs,
  states.
- Grid card — a `<Link>` wrapping the existing card visual. Reuse the visual
  from the current `/dashboard/templates` grid rather than the create-flow
  `TemplateCard` (whose `onPreview`/`onUse` callback shape does not fit a link).

## Backend delta

Only one change:

- `packages/shared/schemas/templates.ts` — add
  `difficulty: z.enum(["ALL","BEGINNER","INTERMEDIATE","ADVANCED"]).default("ALL")`
  to `listTemplatesSchema`.
- `server/services/template.service.ts` — in `listTemplates`, after the category
  clause: `if (difficulty !== "ALL") where.difficulty = difficulty;`

`perPage` (schema max 20) is enough for a 12-per-page grid — no change. Search,
sort, pagination, `get`, and `use` are all reused unchanged.

## Data flow

```
Browser page → trpc.templates.list({category,difficulty,sort,search,page,perPage})
             → templates router → listTemplates service → Prisma
Card click   → Link → /dashboard/templates/[id]
Detail page  → trpc.templates.get({id}) → getTemplate service → Prisma
Use          → trpc.templates.use({templateId,siteName})
             → useTemplate service (plan-limit check, site clone, usageCount++)
             → editor
```

No layer is skipped (Page → Router → Service → Prisma).

## Testing

- **Unit:** the param ⇄ filter-state helper (all filters, defaults, bad values,
  page bounds) — pure function, no mount. Follows `initial-view.ts`.
- **Service:** `listTemplates` difficulty filter — returns only matching
  difficulty; `ALL` returns all; combines with category + search.
- **Live-verify (authed browser):** browser renders full-width with the sidebar
  hidden; each filter narrows results and updates the URL; numbered pagination
  moves pages; a card opens `/dashboard/templates/[id]`; "← Back" returns with
  filters intact; "Use this template" clones and lands in the editor; a bad id
  shows the error state, not a blank screen.

## Rollout

Local `main` (solo workflow). Not part of the held prod deploy. No migration
(the `difficulty` column already exists).
