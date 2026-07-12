# Editor Left-Bar — decision worksheet (2026-06-23)

Goal: decide, for EVERY editor capability, does it go in the **left bar (rail)** or
somewhere else (topbar / right inspector / hidden / dashboard). Grounded in
`feature-inventory.md` + `feature-backend-map.md` (real status) + `tabsConfig.ts`
(the 11 tabs that exist today).

**Homes:** `RAIL` left bar · `TOP` topbar · `RIGHT` inspector (on select) ·
`HIDE` not ready/cut · `DASH` lives in dashboard, not the editor.

Decision rule we agreed: **single-purpose slots, no merging, frequency order.**
Mark the `You` column: keep ✓ / move → (where).

---

## A. Candidates for the LEFT BAR (proposed RAIL)

| # | Feature | Proposed | Why | You |
|---|---------|:---:|-----|-----|
| 1 | **Add** — elements + sections | RAIL | most-used; the insert palette | |
| 2 | **Pages** — list/add/reorder | RAIL | switch pages; core | |
| 3 | **Layers** — structure tree | RAIL | navigate the page; every builder has it | |
| 4 | **Assets** — media library (images/video/fonts) | RAIL | used often while building | |
| 5 | **Design** — brand: colors/fonts/spacing tokens | RAIL | global style; one home for brand | |
| 6 | **CMS** — collections + records | RAIL? | only if the site is data-driven; else hide | |
| 7 | **Components** — reusable saved blocks | RAIL? or inside Add | a kind of insertable — own slot OR Add sub-tab | |
| 8 | **Templates** — page/section templates | inside Add | another insertable; not its own slot | |
| 9 | **Settings** — site config | RAIL (bottom, tucked) | rare; sinks to bottom | |

## B. NOT the left bar — RIGHT inspector (appears on selecting an element)

| # | Feature | Proposed | Why | You |
|---|---------|:---:|-----|-----|
| 10 | Element styling (type/spacing/layout/size/bg/effects/position) | RIGHT | belongs to the selected element; universal convention | |
| 11 | Responsive / breakpoints | RIGHT (+ topbar device switch) | per-element override | |
| 12 | Interactions (triggers) | RIGHT | behavior of the selected element | |
| 13 | Animations | RIGHT | same | |
| 14 | Link / href | RIGHT | element property | |

## C. NOT the left bar — TOPBAR (global actions / already shipped)

| # | Feature | Proposed | Why | You |
|---|---------|:---:|-----|-----|
| 15 | **Publish** | TOP (hero) | rare but #1 importance | |
| 16 | Preview (+ preview-as-client) | TOP | global view action | |
| 17 | Undo / Redo | TOP + ⌘Z | frequent, but keyboard-first | |
| 18 | Version history | TOP (next to undo) | sits with undo | |
| 19 | AI assistant | TOP (✨) | cross-cutting, not a building tool | |
| 20 | Command palette (⌘K) | TOP (⋯) / keyboard | power-user | |
| 21 | Device switch (desktop/tablet/mobile) | TOP (center) | global view | |
| 22 | Share link | TOP (⋯) | infrequent | |
| 23 | Client review (request) | TOP (Review/Send) | sign-off action | |
| 24 | Comments | TOP toggle → overlay | review mode, not a panel | |

## D. NOT the left bar — DASHBOARD (across sites / business, not one site)

| # | Feature | Proposed | Why | You |
|---|---------|:---:|-----|-----|
| 25 | Domains | DASH (site settings) or TOP publish-flow | site-level config | |
| 26 | SEO (per-page meta) | RIGHT or Settings | per page; one SEO home | |
| 27 | Redirects | DASH / Settings | rare config | |
| 28 | Forms — submissions viewing | DASH (site detail) | managing data across | |
| 29 | Analytics | DASH (site detail) | not an editing tool | |

## E. NOT the left bar — HIDE / CUT (backend not ready, or product call)

| # | Feature | Status | Verdict | You |
|---|---------|--------|:---:|-----|
| 30 | Stock photos/videos | STUB → `[]` | HIDE | |
| 31 | Real-time collab (presence) | 6 P1 bugs, off | HIDE (slot only) | |
| 32 | Localization / locales | engine locale-unaware | HIDE | |
| 33 | Export HTML | works | CUT (anti-retention) | |
| 34 | Image editor (crop/version) | works | inside Assets | |

---

## The LEFT BAR — LOCKED decisions (2026-06-23)

Decision rule reaffirmed: **each slot = one obvious thing; no merging; progressive
disclosure for the rare ones.** "Simple" = obvious, not fewest icons.

- **Add = ONE flat palette** of all insertable blocks (text/heading/button/image/box/section/columns). No sub-tabs. Just "add."
- **Templates LEAVE Add** → page-level, live in Pages / new-page (not "add to this page").
- **Components = its OWN slot, but hidden until the user creates their first component** (progressive disclosure, #9). Add + Components together = rejected (different jobs: insert-a-built-in vs manage-my-library).

```
Beginner (5 + tucked):          After making a component:
➕  Add                          🧩  Components   ← appears
🗂  Pages                        ➕  Add
⌗  Layers                        🗂  Pages
🖼  Assets                       ⌗  Layers
🎨  Design                       🖼  Assets
──────────                       🎨  Design
⚙️  Settings (tucked)            ──────────
                                 ⚙️  Settings (tucked)
```

## The 2 ties still open
1. **CMS** — always in the rail, or only show when the site uses collections? (lean: progressive, like Components — show only when a collection exists)
2. **Settings vs dissolve** — keep one tucked Settings slot, or send SEO→inspector, domains/redirects→publish-flow, forms→dashboard, and drop Settings from the rail?

> Tie 1 (Components) = LOCKED: own slot, progressive. Decide CMS + Settings → left bar fully locked.
