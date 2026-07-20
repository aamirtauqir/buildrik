# Buildrick Editor — Complete Product Redesign

> **Supersedes** `archive/2026-07-17-editor-ia-redesign.md` (that was the IA-shell slice only). This is the full redesign: shell IA + all 6 jobs designed to completeness + every suggestion from the code audit, eng review, and design review, consolidated and sequenced.
>
> Sources: `docs/audits/2026-07-08-editor-deep-audit.md` (§0.5 job lens, ~55 bugs, 47 fixes, D1-D10), PRD v3 (`docs/prd/BUILDRIK-PRD-EDITOR.md` Ch.01-12), the office-hours foundation interview (2026-07-17), the eng review (9 findings), the design review (dimension ratings + 5 tasks). Office-hours output: a design doc, not code.

---

## Document map (SSOT — one owner per concern, no duplication)

| Concern | Canonical doc |
|---|---|
| Feature catalog (raw, ~120) + per-module detail | PRD `docs/prd/editor/12-feature-catalog.md` (Ch.12) + Ch.01-10 |
| Flows (app/user/feature) | PRD `11-flows.md` (Ch.11); job flow-graphs in the new IA → §5.9 here |
| **Per-screen PRD (56 specs)** | PRD `docs/prd/editor/14-screen-specs.md` ← added by this arc (numbered 14 to avoid colliding with the master PRD's §13 defect register) |
| IA / shell redesign + roadmap + decisions | **THIS doc** |
| Works vs broken, by job | `2026-07-18-editor-complete-state.md` |
| Feature improvements (enhancement layer) | `2026-07-18-feature-improvements.md` |
| J5 wedge wireframes | `2026-07-18-j5-signoff-wireframes.md` |
| ~~IA-shell slice~~ | ~~`archive/2026-07-17-editor-ia-redesign.md`~~ — SUPERSEDED (banner added in-file) |
| Defect ids D1-D10 / A*/B* | `docs/audits/2026-07-08-editor-deep-audit.md` |
| Defect register §13 / §13b (`§13-A2` etc.) | `docs/prd/BUILDRIK-PRD-EDITOR.md` |
| **Shell dimensions + shell wireframes** | `2026-07-18-editor-shell-wireframes.md` ← added by this arc |
| **Site full-page (settings · domains · export · publish history · brand-push)** | `2026-07-18-site-fullpage-wireframes.md` ← added by this arc |
| **Rail drawer cargo (what is inside each of the 6 panels)** | `2026-07-18-drawer-cargo-sheets.md` ← added by this arc |
| **Inspector (section order per profile + control anatomy)** | `2026-07-18-inspector-spec.md` ← added by this arc |
| **Floating panels (⌘K · Versions+Compare · Issues · AI)** | `2026-07-18-floating-panels-spec.md` ← added by this arc |
| **Information architecture (target)** | `PART-1-information-architecture.md` ← added by this arc |
| **All code counts** | `GENERATED-inventory.md` — emitted by `node .render/inventory.mjs`; never hand-write a count elsewhere |

Rule: each fact lives in exactly one doc above; others link, never copy.

---

## 0. Design-review resolutions (2026-07-18)

Ran the `figma-product-design` lens over this doc as a build-spec. What locked:

| # | Decision | Detail | Source |
|---|---|---|---|
| **L1** | **Build J5 wedge FIRST** | Client sign-off before the declutter. Highest leverage; new surface, so it can't break J3. Track-A declutter = Phase 2. | founder-locked |
| **L2** | **Client-review = dedicated DESKTOP page** | A clean standalone review surface — **NOT** the full editor (client sees no edit tools), **NOT** mobile (desktop-only, per DESIGN.md). Client sees: site preview · comment pins · **Approve / Request-changes**. | founder-locked |
| R1 | **One home per review action** | *(refined by §4.3)* Topbar = the *action* (Send-for-review / Publish) **and** the status pill; the REVIEW rail group was later removed — comments became a canvas mode and versions moved to the save pill. | review-rec |
| R2 | **Rail = persistent swap-panel, not accordion** (6 icons — see §4.3) | Click an icon → drawer swaps (Webflow/Framer pattern). NOT "one group open at a time" — that re-adds the friction the redesign removes. Collapse-to-icons only for first-run calm. | review-rec |
| ~~R3~~ | ~~**BRAND & REVIEW are tabs, not "groups"**~~ | ~~They hold one surface each; only CREATE & STRUCTURE are true multi-item groups.~~ **SUPERSEDED by §4.3** — the rail has no groups at all now: 6 flat tool icons, and the REVIEW group was removed entirely. | review-rec |

Review findings that became work: **C2** (surface context) → L2 · **C3** (dual action home) → R1 · **M1/M2/M3** (rail grouping) → R2/R3 · **C1** (undecided binaries) → §6.5 checklist below. `review-rec` = proceed unless founder objects.

---

## 1. The problem — two tracks, don't conflate them

The founder's felt problem: **"editor sahi se design nahi hua"** → pushed to specifics → **clutter / "samajh nahi aata kahan jaaun."** An information-architecture problem.

The code's truth (audit §0.5): the deeper issue is **incomplete jobs** — of the 6 jobs an agency designer hires this editor for, **only J3 (build) works end-to-end.** J2 AI-draft is fake, J5 sign-off has no client UI, J4 brand-push is absent.

**These are two separate tracks. Decluttering the IA will NOT make sign-off work.** This doc addresses both, kept distinct:
- **Track A — Shell IA redesign** (fixes the felt clutter): §4.
- **Track B — Job completion** (fixes the real gaps): §5, per job.

Conflating them is the trap: a beautiful decluttered shell around jobs that still dead-end is worse than honest, because it looks finished.

---

## 2. Locked foundation (office-hours, founder-confirmed)

| # | Fundamental | Decision |
|---|---|---|
| 1 | WHO | **Agency designer** (OWNER/ADMIN/DESIGNER) building CLIENT sites, ships after client approval. Not solo-freelancer, not end-client. |
| 2 | WEDGE | **Client sign-off loop** — the one job Webflow does badly. The differentiator. |
| 3 | Felt problem | **Clutter / confusing IA** (nav scattered), not incomplete flows. |
| 4 | IA principle | **All editor-concern surfaces on the LEFT** — one predictable spine. |
| 5 | Rail contents | *(original office-hours lock — **SUPERSEDED by §4.3**)* LEFT = Create · Structure · Brand · History. **Now:** LEFT = Insert · Layers · Pages · Media · Content · Brand (canvas-interacting only); settings/publish → Site page; device/zoom/preview → canvas toolbar. |
| 6 | Inspector | **Stays RIGHT** (add/navigate left, edit-selected right, canvas between — Webflow/Framer/Figma standard). |
| 7 | Entry point | *(original lock — **SUPERSEDED by §4.3**: the rail is 6 tool icons, not job groups)* On open the rail shows its icons and the canvas is maximised; click an icon → its panel swaps in. Progressive disclosure still holds. |

**Personas (design for both):**
- **Agency designer** (primary) — builds fast, brands, needs client sign-off, ships to a domain.
- **Invited client** (secondary, the approver) — reviews, comments, approves. Today has **no interface** — the single biggest missing persona.

---

## 3. Design-system & craft direction (per DESIGN.md)

Non-negotiables the redesign inherits (already the codebase rule, enforce in every new surface):
- **One accent: cobalt `#2D6DFF`.** Purple/violet/indigo banned. No black (`#000`) — use slate-700.
- **Type:** General Sans (display), Inter Tight / Geist (body/UI), Geist Mono (data). No Arial/Helvetica/Roboto fallbacks.
- **4px base spacing, compact density.** Minimal motion — no spring physics, no scroll choreography.
- **Light theme canonical** (desktop-only). The removed AIAssistantBar's dark-glass was a DESIGN.md violation — don't reintroduce dark surfaces.
- **Tokens only, no inline hex** (CI now blocks it — audit D9). Every new component uses `var(--bd-*)`.
- **Cards must earn their existence; one job per section; no AI-slop card-grids.**

Craft gaps the design review flagged (fix in the redesign):
- SEO score labels must show **live earned points**, not max weights (still over-promises).
- Inspector still slightly over-dense — the "6→2 levels" ux-audit target is open.

---

## 4. TRACK A — Shell IA redesign (the declutter)

### 4.1 Current clutter → target

```
CURRENT: navigation in 3+ places —
  rail (4 tools OR 11 tabs) + topbar (undo/device/preview/publish/AI✨/⋯/⌘K) + footer (⌗/zoom/sync)
  → "kahan jaaun?"

TARGET:
┌────────────────────────────────────────────────────────────┐
│ TOPBAR (GLOBAL only): ‹Exit · site · save-pill(→Versions) ·  │
│              review-pill · [Send-review/Publish] · ⋯          │
├──────┬───────────────────────────────────────┬─────────────┤
│ LEFT │                                       │  INSPECTOR  │
│ RAIL │                CANVAS                 │  (right —   │
│ 6    │             (maximized)               │  selected   │
│ tools│                                       │  element)   │
├──────┴───────────────────────────────────────┴─────────────┤
│ CANVAS TOOLBAR: undo/redo·device·preview·💬·view-opts·zoom·?│
│ FOOTER (status): issues → panel · sync · breadcrumb          │
└────────────────────────────────────────────────────────────┘

LEFT RAIL — canvas-interacting surfaces ONLY, frequency-ordered.
6 permanent icons (persistent, click SWAPS the drawer — R2):
  1. Insert    elements (48) · blocks (63) · components (browse+insert) · section templates · My Templates
  2. Pages     site tree · CRUD · folders · bulk · SEO listings · page-settings modal (580w)
  3. Layers    active-page tree · reorder · hide/lock · group
  4. Media     assets · folders · stock · 370 icons · image editor · replace-across
  5. Content   CMS collections · records · per-record publish · dynamic pages + Data tab
  6. Brand     tokens (14 kinds) · presets · starters · typography+fonts · lint · import/export

  Codex round-2 corrections applied:
   · Pages and Layers stay SEPARATE — different zoom levels, different cadence. Merged,
     a real client site's layer tree eats the panel and starves page management, so the
     user scrolls through layers just to switch page.
   · Content is PERMANENT, not conditional — hiding it until a collection exists is a
     circular trap: the way to discover CMS was behind CMS. Empty state does the teaching.

NOT in the rail — and why:
  Templates            dissolved — full-page templates into the New-Page flow,
                       section templates into Insert. (Also kills the 3-surface problem, S21.)
  AI                   ⌘K launcher + canvas selection-toolbar action. It assists across
                       every tool; it is not a browsable panel competing for a rail slot.
  Comments             a MODE, not a destination — Figma's model: 💬 toggle in the toolbar
                       (key C) → click the canvas → pin → thread. A thread list slides in
                       when you want it. Pins live on the canvas, which is where the
                       conversation actually is.
  Versions / history   the SAVE-STATUS PILL opens it (document state → document history).
                       Not the ⋯ menu — Codex flagged that burial as a regression, because
                       restore is the safety net when client feedback thrashes a design.
  Component MANAGEMENT create-from-selection · variants · detach → contextual from the
                       selection / right panel. Only browse-and-insert lives in Insert.
  Site-level           Settings (11 screens) · Domains · Export · Publish status ·
                       cross-site Brand-push → a separate "Site" full-page opened from
                       the topbar. None of these touch the canvas.

Why removing Review from the rail STRENGTHENS the wedge: sign-off is an ACTION plus a
STATE, not a place you navigate to. `[ Send for review ]` sits in the topbar as the
primary CTA and the review-status pill (pending / changes / approved) sits beside it,
permanently visible — instead of being buried one click deep inside a rail drawer.
TOPBAR (GLOBAL only — 6): Exit · site name · save-pill (→ Versions → Compare)
  · review-status pill (→ review bar when active) · [Send-review]/[Publish] · ⋯
  ⋯ = Site full-page · preview-as-client · invite · Help · ⌘K · account
CANVAS TOOLBAR: undo/redo · device · preview · 💬 comment (C) · view-options · zoom · ?
  (canvas prefs grid/snap live in view-options; ProjectSettingsModal keeps ONLY those)
```

> **IA history (each step superseded the last; §4.3 is current):** (1) CREATE/STRUCTURE — rejected as module buckets wearing job clothes. (2) BUILD/BRAND/REVIEW/SHIP job-groups — rejected after a Codex review: job labels on nav over-apply JTBD to what is an *editing cockpit*. (3) **Current — a tool-based, frequency-ordered rail of canvas-interacting surfaces only** (Insert · Layers · Pages · Media · Content · Brand). Settings/domains/export/publish/brand-push → the separate **Site** full-page; **AI** → ⌘K + selection toolbar; **comments** → canvas mode; **versions** → save pill. Job-framing stays authoritative for product completeness, the roadmap (§5, §8) and the editor boundary — just not for nav labels.

### 4.2 Rules
- **Dimensions live in `2026-07-18-editor-shell-wireframes.md`** — panel widths, heights, row density, the chrome arithmetic and the 12 shell states. This section settles *what goes where*; that file settles *how big*.
- **Persistent 6-icon rail; click swaps the drawer** (R2) — Webflow/Framer pattern, NOT accordion "one open at a time" (which re-adds switching friction for the power-user's Layers↔Insert↔Design loop). Collapse-to-icons only for the calm first-run entry.
- **AI has no rail slot** (superseded: it was briefly "CREATE ▸ AI"). One AI surface — **⌘K launcher + canvas selection-toolbar ✨**; an agent *run* promotes to the right-side AI panel (§4.3 round-2 #4). The dual/triple AI surfaces were consolidated (audit D2).
- **Topbar = GLOBAL only** — document state (save pill → Versions), review state (status pill), the one CTA, and ⋯. **Undo/redo, device, preview and comment-mode live on the CANVAS toolbar**, not here: if it acts on the canvas it sits with the canvas. No navigation in either.
- **Footer = status strip only** (issues pill → panel, sync, breadcrumb). Zoom + view-options moved to the canvas toolbar; the structure ⌗ popover is CUT (duplicated Layers).
- **Inspector stays right** — confirms the 2026-06-29 object-rail decision is NOT reversed. It now also hosts **component management** (variants · detach · swap) and the **form settings** section, and it **shares the right slot with the AI panel** when an agent run is promoted (§4.3 round-2 #4).
- **Entry:** **first run** → rail icons only, canvas full, one-time coach over the 6 icons (replaces the orphaned SpotlightOverlay — §5-J1), replayable from ⋯ Help. **Returning** → drawer open on the last-used panel. *(Authoritative: shell wireframes §4 states 1-2 + §5 A1. This line previously stated icons-only for both and contradicted them.)*

### 4.3 REGION MAP — exactly what lives where (the authoritative placement)

Every user-facing feature assigned to exactly one region. No "or". Verified against the 6-agent code inventory (§5.10).

#### ◧ LEFT RAIL — canvas-interacting surfaces only, frequency-ordered (6 items)

> **Taxonomy decision, founder-locked 2026-07-18 after a Codex cross-review.** Two earlier attempts were wrong: CREATE/STRUCTURE was a **module** taxonomy in job clothes, and BUILD/BRAND/REVIEW/SHIP put **job labels on nav** — which Codex called out bluntly as over-applying JTBD to a visual editor. A builder is an **editing cockpit**, not a wizard: the designer bounces between insert → select → switch page → swap content → tune styles → check comments every few seconds. Job-framing stays authoritative for **product completeness and roadmap** (§5, §8) and for the **editor boundary** (what is canvas-chrome vs the separate Site page) — but the rail itself is tool-based and frequency-ordered. Both founder instincts that produced this were right: *left = canvas-interacting only*, and *Insert is the most-used, so it leads*.

| # | Rail item | Drawer contents (⊕ = a previously homeless feature, now placed) |
|---|---|---|
| 1 | **Insert** | 48 element types · 63 blocks / 7 categories · **components (browse + insert only)** · **section templates** · ⊕ **My Templates** (user-saved, own section) · search · drag + click |
| 2 | **Pages** | site tree · CRUD · folders · bulk · SEO listings table · page-settings modal (580w) (SEO/Social/Advanced) · ⊕ **Save-as-template** (row context menu) |
| 3 | **Layers** | active-page tree · search · reorder · hide/lock · group · context actions |
| 4 | **Media** | grid · folders · upload · stock · image editor · optimize · 370 icons · replace-across · versions · quota · alt-text AI |
| 5 | **Content** | CMS collections · records + per-record publish · dynamic pages · repeaters · ⊕ **"Data" tab** — data sources · **global variables** · conditions (the non-CMS half of DataManager, which would otherwise hide inside a CMS-named panel) |
| 6 | **Brand** | 14 token kinds · 94 default tokens · 18 presets / 11 categories · 6 starters · typography + fonts incl. ⊕ **custom-font upload** · DS lint · import/export · ⊕ **color-mode (light/dark preview)** · ⊕ **DS Mode toggle (beginner/pro)** in the header — **renamed from "Styles"** to kill the collision with the inspector's per-element styling on the right |

**Deliberately NOT in the rail**
- **Templates** — dissolved. Full-page templates belong to the **New-Page flow**; section templates are just blocks, so they live in **Insert**. Not the topbar either: the topbar is for global actions and state, and parking a rare creation-aid there makes low-frequency behaviour permanently visible while separating templates from the moment of insertion. This also resolves the 3-duplicate-surfaces problem (S21).
- **AI** — a ⌘K launcher plus an action on the canvas selection toolbar. It assists across every tool (draft, edit selection, write copy, alt-text); it is not a destination to browse.
- **Comments** — a **mode**, not a place (Figma's model): 💬 toggle on the **canvas toolbar** (key `C`) → click the canvas → pin → thread; pins stay visible on the canvas; a thread list slides in on demand. Codex noted Webflow treats comments as a top-toolbar mode for the same reason.
- **Versions / history** — opened from the **save-status pill** (one click, document state → document history). Not a rail slot, and deliberately *not* the ⋯ menu: Codex called burying restore in a kebab a regression for a client-approval workflow.
- **Review as a rail group** — removed. Sign-off is an **action + a state**, not a destination: `[ Send for review ]` is the topbar primary CTA and the **review-status pill** sits beside it, permanently visible. That makes the wedge *more* prominent than a rail drawer one click deep, not less.
- **Component management** — create-from-selection, variants, detach and definition editing are **contextual from the selection / right panel**. Only browse-and-insert belongs in Insert (Codex: folding management into Insert would hide it as "just another thing you insert").
- **Site-level** — Settings (11 screens) · Domains · Export · Publish status · cross-site Brand-push → a separate **"Site" full-page** opened from the topbar. None of them touch the canvas.
- **Media stays its own item** (the one place this doc departs from Codex, which merged Media into Content): media is high-frequency, CMS is low-frequency, and bundling them buries the frequent one behind the rare one.

#### ▤ TOPBAR — GLOBAL only (document + review state + the one CTA)
`‹Exit · Site name` — `Save-status pill (Saved/Saving/Unsaved/Offline) → click opens Versions` — `Review-status pill (pending / changes-requested / approved / edited-since-approval)` — **`[ Send for review ]` / `[ Publish ]`** (primary CTA) — `⋯`
`⋯ overflow` = **Site** (full-page: settings ×11 · domains · export · publish history · brand-push) · Preview as client · Invite teammates · ⊕ **Help & shortcuts** (→ replay the onboarding checklist and the first-run coach) · ⊕ **Command palette ⌘K** (the one visible affordance for the shortcut) · Account.

What each topbar element opens (⊕ = previously homeless):
- **Save pill** → ⊕ **Versions panel** — Changes · Saves · Time-Travel · restore, and inside it ⊕ **Compare / diff vs the approved version**. *This is the piece Codex called the actual wedge: resolving review safely, not sending it.*
- **Review-status pill** → when a review is ACTIVE it expands into a ⊕ **review bar**: open-comment count · jump to next comment · compare with approved · resend. Invisible when no review is running, loud when one is — a state, not a destination.
- **CTA** → ⊕ **publish progress modal** (connect-Vercel · publishing · live URL · failed+reason). It belongs to the action, not to the Site page.
- Directly under the topbar: ⊕ **recovery banner** — one-time "restore unsaved work from 3 min ago" (RecoveryManager is wired in the engine but has never had a surface).

**6 items.** Everything that is about the *canvas* left the topbar (founder call): undo/redo, device switcher, preview and comment-mode now sit with the canvas, where the thing they act on actually is. This directly answers Codex's "everything that lost a home got promoted upward" — the topbar carries **document state + review state + the CTA**, nothing else, so the CTA the business depends on stops competing with twelve neighbours.
**Versions is one click, not buried:** the save pill is already where the eye goes for document state, so document-state → document-history needs no new chrome and no kebab dive.

#### ▨ CANVAS TOOLBAR — everything that acts on the canvas/viewport
`Undo / Redo` — `Device & breakpoint switcher` — `Preview ⌘P` — **`💬 Comment mode (key C)`** — `View options` (grid · rulers · guides · spacing · badges · X-ray · device frame) — `Zoom` — `?`
Sits with the canvas (this is also where the code already puts them — `CanvasFooterToolbar`). Rule: if it changes what you *see or do on the canvas*, it lives here; if it describes the *document or the review*, it lives in the topbar.

**Comment mode (Figma model):** toggling 💬 turns the canvas into a commenting surface — click anywhere to drop a pin and start a thread; existing pins are always visible on the canvas. A thread list slides in on demand. Comments are a *mode over the canvas*, never a rail destination, because the conversation is anchored to the design, not to a panel.

#### ▥ RIGHT — Inspector (edit the SELECTED element only)
Header: element icon+name · selection breadcrumb · pick-on-canvas · select-parent · ⋯ (duplicate · copy styles · paste styles · delete)
Strips: **Reach** (This item / All like this / Whole site) · **Breakpoint pill** · **State pills** (Base·hover·focus·active·disabled)
Sections (**no tabs** — one scrolling column, order per profile in `2026-07-18-inspector-spec.md` §2): Quick-actions · Size · Spacing · Layout · Flexbox · Grid · Typography · Background · Border · Corner-radius · Effects · **Interactions** (14 triggers × 39 presets) · **Animation** (25 presets) · Visibility · Link · Element-properties · CSS-classes · AllCSS(gated)
Also: **Variant** (component instances) · token-binding chips · CMS binding popover · multi-select mode (align/distribute/batch) · empty-state.

#### ▣ CANVAS — the page + direct manipulation only
Render · selection box + resize handles · hover overlay + spacing labels · smart guides · snap · rulers · guides · measurements · grid · selection label · **floating selection toolbar** (ancestors · duplicate · delete · copy · wrap · move · +Add · ✨AI) · inline text edit + rich-text bar · **right-click context menu** — incl. ⊕ **Create component from selection** and ⊕ **Save as template** · drop feedback · section reorder handles · **comment pins (J5)** · device frame · empty-canvas CTA · ⊕ **first-run coach overlay** (one-time; replayable from ⋯ Help).

#### ▁ FOOTER — status strip only
⊕ **`Issues pill` → issues panel** (errors · warnings · accessibility findings) · `Sync status` · `Breadcrumb`.
**Removed:** `Structure ⌗` popover — it duplicated the Layers rail item; `View options` and `Zoom` moved to the canvas toolbar where the rest of the viewport controls live.

#### 👤 CLIENT — surfaces the AGENCY'S CLIENT sees (outside the editor entirely)

The map had no bucket for surfaces the **client** sees — only editor regions and the Site page — so the client-facing half of the wedge had nowhere to land and fell out of the map. Third bucket:

| Surface | Where it ships | Notes |
|---|---|---|
| **Client review page `/review/<token>`** | **dashboard package** (Next.js route, mirrors `app/share/[token]/`) — NOT the Vite editor | The #1 build-first screen. Wireframes: `2026-07-18-j5-signoff-wireframes.md`. Desktop-only (L2). Identity = hybrid token + name/email (State A0). |
| **Send-for-review modal** | editor, from the topbar CTA | reviewer(s) · message · version · link — the submit half of S5.1 |
| **Approval error-state** | editor, modal/inline on a blocked publish | "needs approval → who can approve → review link" |
| **Post-approval lock** | editor, topbar review pill | adds the 4th pill state `edited-since-approval` (now carried in every pill spec) |

#### 🗔 SITE — a separate full page (topbar ⋯ → Site), outside the editor chrome
Settings ×11 (General · SEO · Analytics · Custom-code · Redirects · Headers · Localization · Forms inbox · Integrations · Locked/Pro · Workspace deep-links) · **Domains** (connect + DNS verify + SSL) · **Export** (HTML / ZIP / React) · **Publish history** · **Cross-site Brand-push** (pick sites → diff → blast-radius → confirm → rollback).
None of these touch the canvas, which is exactly why they are not in the editor.

#### ⧉ FLOWS & MODALS (not a region — entered from somewhere above)
**New-Page flow** (Blank · Template · AI) — ⊕ *full-page templates live here*, which is what "dissolving Templates" means · publish progress modal · save-conflict modal · CollectionSetup modal (fires on an e-commerce block drop) · Create-component modal · Locked/Pro upgrade.

#### ⊞ ROUND-2 PLACEMENTS — the 20 features the first pass still left homeless

A second audit ran the full verified inventory (6-agent sweep + PRD Ch.12) against the map above. Twenty items had no home. Placed:

| # | Feature | Placed at | Why there |
|---|---|---|---|
| 1 | **PageTabBar** (open-page tabs above canvas) | **KEEP — canvas top strip**, scoped to the *working set* | It collided with the Pages rail item, so the two get an explicit split: **tabs = the 3-4 pages you're bouncing between right now** (closeable, dirty-dot, F2 rename); **Pages panel = the whole site tree** (create · folders · bulk · SEO). Neither Webflow nor Framer ships page-tabs, so this is a deliberate bet on multi-page agency sites — reversible if it reads as clutter. |
| 2 | **GlobalStyleManager** (global/utility classes) | **split** — *apply* → Inspector › CSS Classes · *manage* → **Brand › Classes** tab | Applying a class is per-element (right); curating the class system is site-wide (Brand). |
| 3 | **Import / insert HTML** (`importHTMLToActivePage`) | **engine path** behind template-apply — no surface of its own; optional **Insert › Paste HTML** advanced action | This is the canonical apply path now that TemplateManager is deprecated; it powers the New-Page and section-template flows rather than being a destination. |
| 4 | **AI agent mode** (plan · steps · approve/skip · stop · auto-apply) | **Right-side AI panel** — opens from ⌘K or the selection toolbar ✨, shares the right slot with the inspector | A multi-step agent run is a task list you watch while the canvas stays visible; it cannot live inside a ⌘K popover. Quick prompts stay inline in ⌘K; a *run* promotes to the panel. |
| 5 | **Offline state** | **merged into the save pill** (it already has an offline variant) | Offline is document state; it needs no separate topbar item. |
| 6 | **Template apply options** (backup page · reset global styles · progress · retry) | **Template-apply confirm modal** in the New-Page / section-template flow | Applying a template replaces page content — a destructive action needs a confirm with its options, which is what was lost when Templates dissolved. |
| 7 | **Token usage map · safe rename · alias chains** | **Brand › token detail view** | "Where is this used" belongs on the token you clicked; rename is only safe when usage is visible. |
| 8 | **Contrast auto-fix** | **Brand › lint** (list, primary) + inline fix on the **Inspector colour control** | Fix it where the failure is reported, and again where the failing colour is being edited. |
| 9 | **AIPromptModal** (generate a component schema with AI) | **Brand › Components → "Generate with AI"** | It authors a design-system component, so it belongs to the DS, not to Insert's browse list. |
| 10 | **Dark-missing warn chip** (DarkResolver) | **Inspector colour control** + Brand lint list | Surfaces when you touch a colour token that has no dark value. |
| 11 | **Auto-milestone suggestion banner** | **Versions panel** (top banner) | "40 changes since your last save — name a milestone?" belongs where milestones live. |
| 12 | **Version export / import** | **Versions panel ⋯** | |
| 13 | **Form settings section** | **Inspector**, when a form element is selected | `FormSettingsSection` already exists in `shared/forms`; submissions stay in Site › Forms inbox. |
| 14 | **Stripe / checkout config** | **Site › Integrations** (site-level keys) + per-block settings in the Inspector | |
| 15 | **Migration progress modal** | **Flows** — fires automatically on a schema migration | |
| 16 | **Achievement prompts** | **Overlay toasts** (onboarding), replayable from ⋯ Help | |
| 17 | **Rail letter shortcuts — REMAP** (were 11 tabs, now 6) | `A` Insert · `P` Pages · `L` Layers · `M` Media · `D` Content/Data · `B` Brand — with `C` = comment mode, `⌘P` = preview, `⌘K` = palette | The old A/I/T/M/Z/P/D/S/U/H map pointed at tabs that no longer exist. |
| 18 | **Media full-page vs panel** | **Rail panel with an "Open full library" expand** | Keeps bulk management without a second IA path; retires the unreachable `FullPageRouter` templates branch (N4). |
| 19 | **Pro / Locked gating** | **Inline lock chip** on the gated row/section → **UpgradeModal**; `LockedScreen` only for whole gated screens inside Site | Gate where the feature is, not on a separate wall. |
| 20 | **Collaboration** *(only if D3 says invest)* | presence avatars → **topbar** beside the state pills · live cursors → **canvas** · comments → already the canvas comment mode | Written down so the bet has a landing site; not on the roadmap until D3 is called. |

#### ✂ CUT (duplicates and dead surfaces this map retires)
`Structure ⌗` popover (dup of Layers) · the 2nd help surface (B5 — keep the canvas `?`) · the Media *modal* (keep the rail panel + expand) · the 53-block catalog (keep the 63 registry — N2) · the 2nd command palette (B8) · Templates as a rail item · AI as a rail item · **Plugin manager** (implemented, flag-dead, zero plugins ever registered — recommend cut) · the ~25 orphans in the §5.10 ledger.

#### Conflicts this map RESOLVES — C-series (the ~~struck~~ column is the old state; the right column is the answer)
| # | Was | Now |
|---|---|---|
| C1 | ~~Undo/redo → Topbar~~ | **CANVAS toolbar.** Undo/redo acts on the canvas, so it sits with the canvas; the topbar is global-only. |
| C2 | ~~Device switcher → Topbar~~ | **CANVAS toolbar.** It is a viewport control and belongs with zoom/view-options (which is also where the code already puts it). |
| C3 | ~~Zoom implemented 3×~~ (footer · canvas toolbar · orphan ZoomControls) | **CANVAS TOOLBAR only** (it is a viewport control); delete the other two (B20) |
| C4 | ~~Overlay toggles scattered~~ | **One "View options" popover on the CANVAS TOOLBAR** (grid·rulers·guides·spacing·badges·X-ray·device-frame·canvas prefs). They are viewport concerns, so they belong with the viewport, not in the status strip. |
| C5 | ~~AI as a topbar ✨~~ (E3-mode only, hidden in default) | **⌘K + canvas selection toolbar**; agent runs promote to the right-side AI panel. No rail slot. |
| C6 | ~~Settings + Publish as rail tabs → bottom-pin → SHIP job-group~~ | **Settings live in the separate "Site" full-page** (they never touch the canvas). **Publish stays a TOPBAR action** (the CTA); publish history sits in Site. |
| C7 | ~~Two command palettes~~ (⌘K shell + ⌘⇧P canvas) | **One ⌘K**, registry-backed |
| C8 | ~~Structure ⌗ + AI ✨ only in E3 rail mode~~ | Both get real homes above; E3/legacy rail modes retired |

### 4.4 Consistency sweep (from audit)
- **Brand chaos fixed** (Aquibra/dudo/buildrik → "Buildrick", audit D5) — verify no user-visible remnants in new surfaces.
- **Docs-link domain unified** (`docs.aquibra.com` vs `docs.buildrik.com` → `docs.buildrick.com`).
- **Duplicate utils consolidated** (formatBytes/slugify/MediaAsset — audit D8) so panels render numbers/slugs identically.

---

## 5. TRACK B — the 6 jobs, designed to completeness

Each job: **health · target experience · required states · missing screens · the suggestions.** Ratings from audit §0.5.

### J1 · Discover & onboard — 🟡 5/10
- **Target:** agency opens a site, knows what to do in <5s, reaches first edit in <2min.
- **States needed:** first-run (empty canvas) · returning (last-edited) · blank-vs-template choice · loading · load-error ("session expired → sign in").
- **Missing / broken:** PageWizard "AI" is **simulated** (inputs discarded — either make it real via J2 or cut it); WelcomeModal + SpotlightOverlay **orphaned** = the coach-mark "aha" doesn't exist.
- **Suggestions:** (a) replace the orphaned spotlight with a real, minimal first-run: highlight the 6 rail icons once, "start here." (b) Kill the fake PageWizard or wire it to real AI (J2). (c) Onboarding checklist stays (works) but tie its steps to the 6 rail items (§4.3).

### J2 · AI-draft a site — 🔴 4/10
- **Target:** brief/prompt → a real first-draft site the designer polishes.
- **States needed:** prompt input · generating (real progress, not fake) · result-preview · accept/regenerate · error/quota · "AI not configured."
- **Missing / broken:** whole-site generation is a **STUB** (no AI branch → blank site); image-gen fake (picsum). Edit-AI (AITab) is real + hardened this pass (30s timeout wired, rate-limiter fixed).
- **Suggestions:** (a) Decide: build real whole-site AI-draft (server `templates.generate` path exists but returns blank) **or** cut the promise from onboarding/marketing until built. (b) Real image handling (stock/AI) not picsum. (c) AITab: add the ⌘K launcher (D-T3). This is a headline promise — don't ship it fake.

### J3 · Build the page — 🟢 9/10 (the strength; protect it)
- **Target:** fast, precise canvas editing. Already complete (journey-audit confirmed).
- **Hardened this pass:** moveElement cycle-guard, StyleEngine breakpoint-mirror + optimizeCSS + selector-collision, inline-edit, duplicate-`title` field, aria-prefix.
- **Suggestions:** (a) Don't redesign the canvas — it's the one thing that works; the IA redesign must not disturb J3. (b) Inspector density: pursue the ux-audit "6→2 levels" simplification (open). (c) Keystroke-per-transaction undo-spam (attribute/link edits) — debounce like the style path.

### J4 · Make it on-brand — 🟡 6/10
- **Target:** design tokens/components, applied consistently, pushed across the agency's client sites.
- **States needed:** token edit · dirty/save/discard · dark-mode preview · lint warnings · import/export · **cross-site push (diff → confirm → rollback)**.
- **Missing / broken:** component **"reset to master" STILL lies** — path-scheme mismatch `#/` vs `/elements/` (`ComponentInstance.ts:72` vs `:177-179`, §13-A2, NOT fixed this pass — the earlier "trust-lie fixed" claim was wrong); **cross-site brand push absent** (link-out only — the agency-scale wedge).
- **Suggestions:** (a) **Fix the override path-scheme** so reset/is-overridden actually work (real trust-lie, still open). (b) Design the **brand-push flow** in-editor (diff-preview → blast-radius → rollback) — backend schemas exist (`theme.ts`), UI missing; this is a second agency wedge. (c) DS fixes already applied: undo dirty-guard, color id-diff, discard-covers-presets, import darkValue.

### J5 · Get client sign-off — 🔴 3/10 (THE WEDGE, worst job)
- **Target:** designer sends a clean review link → **client reviews/comments/approves in a real interface** → approved-gate blocks publish → everyone in one place.
- **Personas:** designer (submits, resolves) + **client (the approver — has NO screen today)**.
- **States needed (full set, currently mostly absent):**
  - Designer: submit-for-review · in-review (pending) · changes-requested · approved · publish-blocked-until-approved.
  - **Client (all missing):** review landing (tokenized link) · view site as-built · comment (pin to element) · request-changes · approve · post-approval "you approved this version."
- **Missing / broken:** approval gate now **enforced** server-side (audit D1) BUT (a) **rollout unsafe** — flips every ADMIN to blocked on deploy, no flag (eng T1 → gate behind a flag + comms, user-approved); (b) **gameable** — edits after approval aren't invalidated (client approves → agency edits → publishes unseen); (c) **client has no UI AND no identity** — ⚠ corrected 2026-07-18: the built review/comments backend is **INTERNAL** (every procedure is `protectedProcedure`, workspace-member-scoped; `resolve` requires ADMIN; `Comment.authorId` is a User). That is *staff approval*, not *client sign-off* — an account-less client can neither comment nor approve. Earlier "backend complete, zero UI" was wrong; (d) share-link decorative (`ShareLink` model exists but isn't bound to `ReviewRequest`).

> **J5 spans 3 packages** — editor (designer screens) · **dashboard `app/review/[token]/`** (the client page — cannot live in the Vite editor) · server+prisma (mostly exists, incl. the `Client` white-label model). Full code-verified architecture, exists-vs-missing table, and the identity model — **RESOLVED = hybrid** (token grants access, name+email captured on first visit, State A0) → **PRD Ch.14 § "J5 — architecture reality"**. This is why the CEO review called "6 screens" under-scoped.
- **Suggestions (the priority work):**
  1. **Design + build the client review surface** — a tokenized `/review/<token>` page: view the site, comment (pins), approve/request-changes. This is the wedge's front door. **Locked (L2): dedicated DESKTOP page — not the editor (client gets no edit tools), not mobile-responsive.** Reuses brand tokens, its own minimal chrome (agency logo · version label · site preview · comment layer · Approve/Request-changes CTAs).
  2. **Approval error-state UX** — an ADMIN hitting the gate sees "needs approval → here's who can approve → review link," not a raw `PRECONDITION_FAILED` (design-review D-T2).
  3. **Invalidate approval on post-approval edits** (change-since-approval tracking) — else the gate is theater (eng T2).
  4. **Comments editor UI** — surface the built backend (create/pin/resolve) in the editor (audit D4).
  5. Ship the enforcement behind a **per-workspace flag** first (eng T1).

### J6 · Ship & run — 🟡 7/10
- **Target:** publish to a domain, forms/analytics/redirects actually work live.
- **States needed:** pre-publish checklist · publishing (real steps) · published (live URL) · failed (clear reason) · custom-domain connect/verify.
- **Hardened this pass:** export-format honored, ReactExporter dup-names, AssetBundler errors, SEOInjector slug, sanitizeHeadCode, **media quota enforced**.
- **Missing / broken:** Redirects/Headers/Localization **saved-but-not-enforced** on live sites (explicit "not yet live" banners); forms in-memory (editor preview); publish worker fakes "Optimizing images"/"Performance check" steps (shown completed, no-op, lighthouseScore always null); custom-domain e2e untested.
- **Suggestions:** (a) **Enforce or clearly beta-label** Redirects/Headers/Localization — saved-but-dead is a trust-eroder. (b) Real publish-worker steps or remove the fake ones (don't show "Optimizing images ✓" when it's a no-op). (c) SEO score labels → live earned points (D-T4). (d) Custom-domain e2e verify.

---

## 5.5 Complete feature map — EVERY PRD feature → new IA → design call

The §5 jobs rolled features up; this places **every feature in the PRD catalog** (Ch.12, ~120) into the new IA with an explicit call. Vocabulary: **KEEP** (works, protect) · **REDESIGN** (works, IA/craft rework) · **COMPLETE** (partial/stub → finish) · **FIX** (broken → repair) · **CUT** (dead/fake → remove) · **DEFER** (flagged bet) · **GATE** (flag-gated, intentional). Status from Ch.12: ✅🟡🔵🔴⚪👻🔒.

> ⚠ **IA-home names below are SUPERSEDED by §4.3.** §5.5 and §5.6 were written against the earlier CREATE / STRUCTURE / BRAND / REVIEW+SHIP grouping. **§4.3 is the authoritative placement map.** Translate as you read:
>
> | Old name used below | Where it actually lives now (§4.3) |
> |---|---|
> | CREATE › Insert / Components | **Insert** (components = browse+insert only; *management* → Inspector) |
> | CREATE › Templates | **dissolved** — full-page → New-Page flow · section → Insert · save-as-template → canvas right-click + Pages menu |
> | CREATE › Media | **Media** |
> | CREATE › AI | **⌘K launcher + canvas selection toolbar** (no rail slot) |
> | STRUCTURE › Pages / Layers | **Pages** and **Layers** — separate rail items (Codex: different zoom levels + cadence) |
> | STRUCTURE › Content | **Content** — permanent, plus a **Data tab** for global variables + conditions |
> | BRAND › Design | **Brand** (renamed from "Styles" to avoid colliding with the inspector) |
> | BRAND › Push | **Portfolio** (cross-site push never touches this canvas — and no single site's history can author its record) |
> | REVIEW › Comments | **canvas comment mode** (💬, key C) |
> | REVIEW › History / Versions | **Save-status pill → Versions panel → Compare/diff** |
> | REVIEW › Sign-off | **Topbar** — CTA + review-status pill (→ review bar when active) |
> | SHIP / Settings ×11 / Domains / Export / Publish history | **Site full-page** (topbar ⋯ → Site) |

### A. Insert-group features (was "CREATE")
| Feature | Status | New home | Call |
|---|---|---|---|
| Insert — **48 element types + 63 blocks / 7 categories** (the rail's BuildTab shows a divergent 53-item catalog — N2, unify), search, drag+click | ✅ | Insert | **KEEP** (favorites plumbing is DEAD — N3: wire it or CUT) |
| Blocks — 63 registry (Basic11·Media9·Layout5·Forms16·Sections5·Components13·Ecommerce4) | ✅ | Insert catalog | **KEEP**; **FIX** contact-form (true orphan — exported but absent from blockRegistry). NOTE: 4 ecom blocks ARE reachable (surface under "Advanced" via CATEGORY_REMAP) — earlier "excluded" claim was wrong. |
| ⚠ TWO insert catalogs | 🟡 | reconcile | **FIX** — rail Insert (BuildTab) reads a **53-block** `build/catalog/catalog.ts`; canvas BlockPickerModal (ElementsTab) reads the **63-block** `blockRegistry`. Two divergent element catalogs. Unify. |
| Templates — sidebar tab (10) | ✅ | CREATE › Templates | **REDESIGN** — collapse the **3 template surfaces** (sidebar 10 + TemplateLibrary modal 15 + SectionTemplates 11) into ONE (§12 F2, "won't do" → revisit; 3 surfaces IS clutter) |
| My Templates (save/rename/delete) | 🟡 ⚪+server | Templates | **KEEP** (server mirror works) |
| Components — catalog 27 (8 atoms/11 molecules/8 organisms) + user, create-from-selection, variant, detach, MAX 100 | 🟡 | CREATE › Components | **KEEP** authoring; **FIX** reset-to-master path (§13-A2, still lies); ComponentsPanelV2 gated OFF (flag `componentsV2`) — legacy ComponentsTab is the live path; `handleDetailInsert` no-op stub; "Swap component" removed (no engine API) |
| Media library — folders, stock, image-editor, optimize, replace-across, icons, versions | ✅ | CREATE › Media | **KEEP**; **FIX** From-URL modal stub (vs working LibraryManager — two UIs), Trash stub, "This device only" misleading pill; unify 50MB-vs-"10MB" copy |
| — Image editor (crop/adjust/resize, 6 filters, versions) | ✅ | Media detail | KEEP |
| — Optimization (WebP/AVIF/JPEG/PNG) | ✅ | Media detail | KEEP |
| — Alt-text + AI generate + provenance | ✅ | Media detail | KEEP |
| — Stock (Unsplash/Pexels/Pixabay) | ✅ env | Media | KEEP (env-gate) |
| — Icon picker (Lucide 370, 17 categories) | ✅ | Media | KEEP (UI says "300+") |
| AI (AITab — chat/agent/models/scope) | ✅ | CREATE › AI | **REDESIGN** — move here from topbar ✨; add ⌘K launcher; **CUT** AIAssistant modal + AIAssistantBar + AICopilot (dead/legacy — consolidation done); **COMPLETE-or-CUT** whole-site AI-draft (stub) + image-gen (fake picsum) |

### B. Pages / Layers / Content features (was "STRUCTURE")
| Feature | Status | New home | Call |
|---|---|---|---|
| Pages — CRUD, dup, delete+undo, set-home, copy-link, bulk, folders, SEO-table | ✅ | STRUCTURE › Pages | **KEEP**; **FIX** bulk-delete-all silent no-op (done), SEO counter/label lies (partial); folders ⚪ localStorage → **COMPLETE** server-persist |
| — Page translations (i18n) | 🟡 | Page settings | **DEFER/COMPLETE** — engine locale-unaware; enforce or beta-label (ties J6 Localization) |
| Layers — tree, search, reorder, hide/lock, group, 11 context actions | ✅ | STRUCTURE › Layers | **KEEP** (hide/lock ⚪ localStorage/page — acceptable) |

### C. Brand features (was "BRAND")
| Feature | Status | New home | Call |
|---|---|---|---|
| Design system — 14 token kinds, tokens/styles/components/export | ✅ | BRAND › Design | **KEEP** (persistAll 14/14 fixed); **REDESIGN** for density |
| — 18 style presets / 11 categories | ✅ | Design › Styles | KEEP; **COMPLETE** preset-binding picker (click no-op v1) |
| — 6 starter themes | ✅ | Design | KEEP |
| — DS lint (no-black, banned-hue, alias-depth) | ✅ | Design | KEEP |
| — Import/export (CSS/JSON/Tailwind) | ✅ | Design › Export | KEEP; **COMPLETE** Figma export (stub envelope) or CUT |
| — Shared theme push (agency→client sites) | ⚪ link-out | **Portfolio › Brand push** | **COMPLETE** — build in-editor push flow (diff→blast-radius→rollback); backend `theme.*` exists, UI missing (**second wedge**, S10) |

### D. Review + Ship features (now split: comments→canvas mode · versions→save-pill · sign-off→topbar · ship→Site page)
| Feature | Status | New home | Call |
|---|---|---|---|
| History — Changes + Saves + Time-Travel + AI-summary + compare | ✅ | **Save pill → Versions panel** | **KEEP** — moved off the separate History tab |
| Versions (named, restore, cap 50) | ✅ | **Save pill → Versions panel** | KEEP |
| Send for review | 🟡 gates-nothing | **Topbar CTA + review pill** | **FIX** — now enforced server-side (D1), behind flag (S5) |
| **Client review surface (tokenized)** | 🔴 absent | Standalone `/review/<token>` (desktop, not editor) | **COMPLETE (build)** — the approver has NO UI (S4). #1 priority. L2: dedicated desktop page, no mobile. |
| **Comments (pin/create/resolve)** | 🟡 internal-only | canvas comment mode (💬) | **COMPLETE** — backend exists but is `protectedProcedure` + workspace-member-scoped, so an account-less client can neither comment nor approve. Needs the external-identity path too (see §5-J5c). |
| Publish status / checklist | ✅ read-only | **Site full-page + publish modal** | **FIX** — renders 5 of 7 checks (done); real pre-publish states |

### E. RIGHT — Inspector (edit selected; stays right)
| Feature | Status | Call |
|---|---|---|
| 18-section registry, 7 profiles — **the Look/Layout/Effects tab strip is REMOVED** | ✅ | **REDESIGN** — one scrolling column; 6→2 density quantified in shell §5.6, section order per profile + control anatomy in `2026-07-18-inspector-spec.md` |
| Per-breakpoint + pseudo-state overrides | ✅ | KEEP |
| Reach strip (This/All-like/Whole-site) | ✅ | KEEP |
| Token binding chips + chains | ✅ | KEEP |
| Element properties per-type + custom data-attrs | ✅ | KEEP; **FIX** duplicate link-editing homes, aria-prefix (done), dup-title (done) |
| **Interactions — 14 triggers × 39 presets** | ✅ | **KEEP** — real, works (14 triggers: element5/page3/scroll3/mouse3; 39 presets fade6/slide6/scale6/rotate6/attention8/special7). Big feature the roll-up buried. |
| **Animation editor — 25 presets (12 entrance+8 attention+5 exit) + 7 easings** | ✅ | **KEEP** (separate preset set from Interactions' 39); triggers removed (engine ignored) — Timeline/ScrollTrigger L0 stubs → **CUT** stubs or COMPLETE |
| Visibility per-breakpoint | ✅ | KEEP |
| AllCSS raw editor | 👻 dead | **CUT or GATE** — devMode-false dead; keep dead until Pro-gate+sanitize (§13-C2) |
| ColorInput alpha | 🔵 stub | **COMPLETE** (real rgba/hex8) or accept 0/100 — DEFER (scope) |
| Schema-driven border/spacing | 🔒 flag | GATE (parallel pipeline, off) |

### F. CHROME — topbar / footer (actions/status, NOT navigation)
| Feature | Status | Call |
|---|---|---|
| Undo/redo, device switch, preview ⌘P | ✅ | **MOVE → canvas toolbar** (§4.3). Save-pill (4 variants + offline) stays topbar and now opens Versions; color-mode → Brand panel. |
| Publish dropdown | 🟡🔒 | **FIX** — Submit-review/Approve/Unpublish are no-ops ("Phase 7"); wire or hide; ties J5 |
| Export HTML (flag-off fallback) | ✅ | KEEP |
| Command palette — shell ⌘K + canvas ⌘⇧P (TWO) | ✅ | **REDESIGN** — unify into one ⌘K (fragmented; §12 #5); make it read the command registry (currently hardcoded, bypasses CommandCenter) |
| Footer: structure ⌗, zoom 25-200, sync pill, breadcrumb | ✅ | **REDESIGN → status strip only** (issues→panel · sync · breadcrumb). Zoom → canvas toolbar; **⌗ popover CUT** (dup of Layers). **FIX** static "Connected · main" label. |
| Issues pill | ✅ | KEEP |
| Keyboard shortcuts (full map) | ✅ | KEEP; **FIX** dual arrow-handler conflict (done) |

### G. FIRST-RUN / ONBOARDING
| Feature | Status | Call |
|---|---|---|
| Onboarding checklist (7 steps) | ✅⚪ | **KEEP**; retie steps to the 6 rail items (§4.3); server-persist |
| Achievement prompts | ✅ | KEEP |
| WelcomeModal | 👻 orphan | **CUT or COMPLETE** — never mounted; replace with real first-run |
| SpotlightOverlay (coach-marks) | 👻 orphan | **COMPLETE** — build the real spotlight (highlight the 6 rail icons once) or CUT |
| PageWizard ("AI") | 🔵 simulated | **CUT or COMPLETE** — inputs discarded; real via J2 or remove |

### H. SETTINGS (11 screens — a full surface, was buried)
| Screen | Status | Call |
|---|---|---|
| General / Site identity | ✅ | KEEP |
| ~~Branding~~ | phantom | **CORRECT (X9)** — no `BrandingScreen` in code; site identity lives in SiteSettings. Drop from the list. |
| Locked / Pro-gate (LockedScreen) | ✅ live (X1) | **KEEP** — the upgrade/locked state for gated settings |
| SEO (site-level) | ✅ | KEEP; **FIX** score labels → live earned points (S15) |
| Analytics (GA4/Pixel/consent) | ✅ | KEEP (injected at publish) |
| Custom code (head/body/CSS) | ✅ | KEEP (sanitized) |
| Redirects | 🟡 saved-not-live | **FIX** — enforce on live or beta-label (S13); toUrl validation (done) |
| Headers (CSP/HSTS/etc.) | 🟡 saved-not-enforced | **FIX** — enforce or beta-label (S13) |
| Localization | 🟡 Phase-D | **FIX/DEFER** — engine locale-unaware; beta-label |
| Forms inbox (filter/CSV/mark) | ✅ | KEEP; **FIX** editor-preview submissions in-memory (published uses real endpoint) |
| Integrations (6 cards) | 🔵 all Coming-Soon | **CUT or COMPLETE** — doc-links only; don't show dead cards |
| Workspace deep-links (Domains/Members/Billing) | ✅ | KEEP (→ dashboard) |

### I. SHIP / distribution (chrome + settings)
| Feature | Status | Call |
|---|---|---|
| Publish pipeline (Vercel BYO-OAuth, job states, poll) | ✅ | **KEEP**; **FIX** worker fake "Optimizing images"/"Performance" steps (shown ✓, no-op) + lighthouseScore null (S14) |
| Export modal (HTML/ZIP/React) | ✅ | KEEP; Vue/Next = coming-soon → **CUT the stubs** or COMPLETE |
| Custom domains | 🟡 | **COMPLETE** — dns-verify untested e2e |
| Analytics injection (GA4/Pixel/Ads) | ✅ | KEEP (privacy flags on) |

### J. COLLABORATION (the feature the founder named — a real decision)
| Feature | Status | Call |
|---|---|---|
| Collab manager (OT over SSE) | 🔴 demo-only, 6 P1 non-convergence | **DEFER (bet D3)** — invest in real OT/CRDT (eval Yjs) **or CUT from product**. As-is it's dangerous (remote-wins clobbers edits). Where it'd live if built: presence in topbar, cursors on canvas, comments = the canvas comment mode. NOT in this roadmap until the invest-or-cut call is made. |
| Presence indicators / cursors | 🔴🔒 MOCK_USERS | Same bet — currently fakes "You/Ana" when disconnected |
| ConnectionQualityIndicator | 👻 orphan | CUT (never mounted) |

### K. CMS / dynamic content / ecommerce
| Feature | Status | Call |
|---|---|---|
| CMS collections / entries / bindings | 🟡 | **COMPLETE the front-door** — dynamic-page-per-entry binding and per-record publish/unpublish **both exist** (CMSCollectionSetupModal + CMSRecordsModal); the real gap is a discoverable in-rail entry point. Earlier "per-record publish absent" was wrong. |
| Repeaters (bind collection→elements) | ✅ | KEEP (escapeHtml/`$&`/nested fixed this pass) |
| Ecommerce CollectionSetupModal (Products on block drop) | ✅ local | KEEP |
| Ecommerce blocks (product-card/grid/detail/cart) | ✅ | **KEEP** — reachable under "Advanced" via CATEGORY_REMAP; the earlier "excluded/unreachable" claim was wrong. Open: is "Advanced" a discoverable label for e-commerce? |
| ProductCollectionService | ✅ | KEEP |

### L. ENGINE / invisible (no IA home — infra)
| Capability | Status | Call |
|---|---|---|
| Composer + ~30 managers, events (~293), 48 element types, nesting rules | ✅ | KEEP (the solid core) |
| History/transactions/storage/sanitize-SSOT | ✅ | KEEP; **FIX** breakpoint 1023/767 vs 991/575, nesting cap 50 vs 30 (§13b B9) |
| Version timeline / export injectors | ✅ | KEEP (export fixes done) |
| Plugin manager | 🔒 off | GATE |
| TemplateManager | 👻 deprecated | **CUT** (documented dead) |
| EmailService cloud providers | 🔵 throw | **COMPLETE** (wire `/api/email/send`) or CUT; XSS escape done |
| Forms runtime (editor) | ⚪ in-memory | acceptable (preview); published uses real POST |

**Coverage check:** every row of PRD Ch.12 (§12.1-12.6, ~120 features) is placed above. Counts to preserve: 63 blocks · 48 element types · 18 inspector sections · 14 token kinds · 18 presets · 6 starters · 370 icons · 14 interaction triggers · 25 animation presets · 11 settings screens.

> §5.5 lists features by **module** (where in the shell). §5.6 below re-slots the SAME features by **JOB**, names the **screen** each lives on, its **IA home**, its **states**, and whether the screen **exists / redesign / build-new**. This is the buildable screen list.

---

## 5.6 Job-based screen inventory (every feature → screen → IA → states)

Read as: for each job, the screens the agency flows through; each screen names the features it hosts, where it sits in the IA, the states to design, and build-status (**EXISTS** = works, protect · **REDESIGN** = works, rework · **BUILD** = new/absent · **FIX** = broken). Screen IDs are stable (S1.1…). Total: **47 screens/surfaces** across 6 jobs (PRD Ch.14 specs 56 — it adds S3.1a, S3.12b and 7 chrome surfaces).

### J1 · Discover & onboard (🟡 5/10) — 5 screens
| Screen | IA home | Features hosted | States | Build |
|---|---|---|---|---|
| S1.1 First-open | shell (rail collapsed, canvas max) | first-run coach (highlight the 6 rail icons once), empty canvas | first-run · hint-dismissed | REDESIGN (replaces orphan SpotlightOverlay) |
| S1.2 Returning-open | shell | last-edited restore, resume banner | has-draft · clean | EXISTS |
| S1.3 New-page choice | modal | blank · template · AI-draft entry | 3-way choice · loading | REDESIGN (kill fake PageWizard) |
| S1.4 Onboarding checklist | overlay panel | 7-step checklist, achievement prompts | 0/7…7/7 · dismissed · server-persist | EXISTS (retie steps to the 6 rail items) |
| S1.5 Load-error | full-screen | session-expired → sign-in | error · retry | BUILD |

### J2 · AI-draft (🔴 4/10) — 5 screens
| Screen | IA home | Features hosted | States | Build |
|---|---|---|---|---|
| S2.1 AI brief entry | CREATE › AI | prompt/brief input, scope | empty · typing | REDESIGN |
| S2.2 Generating | CREATE › AI (panel) | real progress (not fake) | streaming · slow · cancel | BUILD (server gen returns blank today) |
| S2.3 Result & accept | canvas + AI panel | preview draft, accept / regenerate | preview · accepted · regen | BUILD |
| S2.4 AI unavailable | CREATE › AI | not-configured · quota/error | no-key · quota · error | BUILD |
| S2.5 AITab chat (edit-AI) | CREATE › AI | chat/agent, models, scope, ⌘K launcher | idle · thinking · applied · error | EXISTS (hardened; add ⌘K) |

### J3 · Build the page (🟢 9/10 — protect) — 15 surfaces
| Screen | IA home | Features hosted | States | Build |
|---|---|---|---|---|
| S3.1 Canvas | center | drag/select/resize/inline-edit, 48 element types, nesting, zoom 25-200 | empty · selected · multi-select · dragging | EXISTS — **do not disturb** |
| S3.2 Insert | CREATE › Insert | 48 element types · 63 blocks / 7 categories, search, favorites | empty-search · results · drag | EXISTS (wire or cut favorites) |
| S3.3 Blocks catalog | CREATE › Insert | 63 blocks | category · search · drop | EXISTS (FIX contact-form; ecom blocks already reachable — S23 struck) |
| S3.4 Templates — **DISSOLVED** (full-page → New-Page flow S1.3 · section → Insert S3.2) | not a rail screen | My Templates → Insert | gallery · preview · apply · empty | REDESIGN (collapse 3→1) |
| S3.5 Components | CREATE › Components | catalog 27 + user, variant, detach, create-from-selection | list · instance · overridden · reset | FIX (reset-to-master path §13-A2) |
| S3.6 Media library | CREATE › Media | folders, stock, image-editor, optimize, icons 370, alt-text, replace-across | grid · detail · upload · editing · empty | EXISTS (FIX From-URL/Trash stubs) |
| S3.7 Pages | STRUCTURE › Pages | CRUD, dup, delete+undo, set-home, bulk, folders, SEO-table | list · empty · bulk-select · folder | EXISTS (COMPLETE folders server-persist) |
| S3.8 Layers | STRUCTURE › Layers | tree, search, reorder, hide/lock, group, 11 context-actions | tree · filtered · locked/hidden | EXISTS |
| S3.9 Inspector | RIGHT | **no tabs** — one column, 18 sections ordered per 7 profiles; context bar (This/Breakpoint/State); token chips | no-selection · single · multi · instance · bound · override · agent-run | REDESIGN — spec'd in `2026-07-18-inspector-spec.md` |
| S3.10 Inspector › Interactions | RIGHT | 14 triggers × 39 presets | none · configured · preview | EXISTS |
| S3.11 Inspector › Animation | RIGHT | 12/8/5 presets | none · applied | EXISTS (CUT Timeline/ScrollTrigger stubs) |
| S3.12 CMS / repeaters | STRUCTURE › (new sub) | CollectionManager, CMSBindingManager, CMSCollectionSetupModal (2-step + **dynamic-page-per-entry**), CMSRecordsModal (record CRUD + **publish/unpublish**), inspector BindingPopover (element→collection→field→record), repeaters | empty · collection · bound · record-draft/published | **COMPLETE the front-door** — modals+per-record-publish EXIST; missing is a discoverable in-rail entry (today only via block-drop/inspector). NOTE: RepeaterRenderer/DataBindResolver = 👻 0 non-test importers |
| S3.13 Ecommerce | CREATE › Insert + modal | 4 product blocks (reachable under "Advanced"), CollectionSetupModal (Products collection + sample data) | setup · bound | **KEEP** — blocks ARE reachable (earlier "excluded" wrong); Products schema real |
| S3.14 Command palette | overlay (⌘K) | unified command palette, registry-backed | closed · open · results · empty | REDESIGN (unify 2→1) |
| S3.15 Preview / device | **canvas toolbar** (color-mode → Brand) | preview ⌘P, device/breakpoint switch | edit · preview · mobile/tablet/desktop/wide | EXISTS |

### J4 · On-brand (🟡 6/10) — 7 screens
| Screen | IA home | Features hosted | States | Build |
|---|---|---|---|---|
| S4.1 Design tokens | BRAND › Design | 14 token kinds (color/type/space/radius/shadow/motion/…) | view · edit · dirty/save/discard | EXISTS (REDESIGN density) |
| S4.2 Styles/presets | BRAND › Design | 18 presets / 11 categories, binding picker | list · bound · unbound | EXISTS (COMPLETE binding picker) |
| S4.3 Starters | BRAND › Design | 6 starter themes | gallery · applied | EXISTS |
| S4.4 DS lint | BRAND › Design | no-black / banned-hue / alias-depth warnings | clean · warnings | EXISTS |
| S4.5 Import/export | BRAND › Export | CSS/JSON/Tailwind (Figma stub) | idle · exported · imported · error | EXISTS (cut/complete Figma) |
| S4.6 Dark-mode preview | BRAND › Design | color-mode token preview | light · dark | EXISTS |
| S4.7 Cross-site brand push | **Portfolio › Brand push** (NEW) | agency→client-sites theme push | pick-sites · diff-preview · blast-radius · confirm · rollback | BUILD (2nd wedge — backend exists, UI absent) |

### J5 · Client sign-off (🔴 3/10 — THE WEDGE, build first) — 6 screens
| Screen | IA home | Features hosted | States | Build |
|---|---|---|---|---|
| S5.1 Send-for-review | topbar (action) | submit-for-review CTA | ready · submitting · sent | FIX/BUILD (wire real submit) |
| S5.2 Review status | **topbar review-status pill → review bar** | pending / changes-requested / approved / edited-since-approval, version compare | draft · pending · changes · approved | BUILD |
| S5.3 Comments (editor) | canvas comment mode (💬) + thread list | create/pin/resolve, thread | none · open-thread · replied · resolved | BUILD — backend is workspace-member-only; external client identity still missing |
| S5.4 Approval error-state | modal/inline | ADMIN blocked → "needs approval + who + link" | blocked · who-can-approve | BUILD (not raw PRECONDITION_FAILED) |
| **S5.5 Client review page** | **`/review/<token>` — desktop dedicated (L2)** | site preview, comment pins, Approve / Request-changes | landing · viewing · commenting · request-changes · approved · post-approval · expired-token | **BUILD — #1 priority, the wedge's front door** |
| S5.6 Post-approval guard | topbar/gate | edits-after-approval mark the approval **stale** (not revoked) | approved-clean · edited-since (publish w/ acknowledgement, or re-review) | BUILD (else gate is theater) |

### J6 · Ship & run (🟡 7/10) — 9 screens
| Screen | IA home | Features hosted | States | Build |
|---|---|---|---|---|
| S6.1 Publish flow | topbar → modal | Vercel BYO-OAuth publish, checklist | ready · connect-vercel · publishing · live · failed | EXISTS (FIX fake worker steps) |
| S6.2 Export | modal | HTML / ZIP / React (Vue/Next stubs) | idle · exporting · done · error | EXISTS (cut Vue/Next stubs) |
| S6.3 Custom domain | SETTINGS | connect + DNS-verify | none · pending · verified · failed | COMPLETE (e2e untested) |
| S6.4 Settings: General | SETTINGS | site identity | view · edit · saved | EXISTS |
| S6.5 Settings: SEO | SETTINGS | site-level SEO, score | view · edit · score(live points) | FIX (labels → earned points S15) |
| S6.6 Settings: Analytics + Custom-code | SETTINGS | GA4/Pixel/consent, head/body/CSS | off · configured | EXISTS |
| S6.7 Settings: Redirects/Headers/Localization | SETTINGS | saved-not-live rules | saved · **beta-label** (not live) | FIX (enforce or beta-label S13) |
| S6.8 Forms inbox | SETTINGS | submissions filter/CSV/mark | empty · list · exported | EXISTS |
| S6.9 Settings: Integrations | SETTINGS | 6 cards (all Coming-Soon) | — | CUT (dead cards) |

### Cross-cutting / no-screen (infra + deferred)
| Item | Where if surfaced | Build |
|---|---|---|
| Chrome: undo/redo · save-pill · footer · issues-pill · shortcuts | **canvas toolbar** (undo/redo·zoom·view-options) · **topbar** (save-pill→Versions) · **footer** (issues→panel·sync·breadcrumb) | EXISTS (FIX static sync label; ⌗ popover cut) |
| Engine (Composer, ~30 managers, history, sanitize, export injectors) | invisible | EXISTS (FIX breakpoint/nesting-cap constants) |
| Collaboration (presence/cursors/realtime-comments) | topbar presence · canvas cursors · canvas comment mode | DEFER (invest OT/CRDT or cut — §6.5) |
| TemplateManager · plugin-manager · EmailService | infra | CUT / GATE / COMPLETE (§6.5) |

**Screen totals:** J1=5 · J2=5 · J3=15 · J4=7 · J5=6 · J6=9 = **47 screens/surfaces.** Build-new (from scratch): S1.5, S2.2-2.4, S4.7, S5.2-5.6 = **10 net-new screens**, of which **5 are the J5 wedge** (S5.1 is a fix, not new).

---

## 5.7 Enhancement layer — features made best-in-class

§5.6 is the WHAT (screens). `2026-07-18-feature-improvements.md` is the **canonical HOW-GREAT** — per-feature "today → better → why it wins" (agency lens). Every screen design pulls its job's improvements from there. **Rule: a screen isn't "designed" until its job's ★/◆ improvements are IN it** — not just today-behavior. The ★ wedge-critical ones, folded to the screens so they aren't lost:

**★ Wedge-critical (fold now):**
- **J5 client review (S5.3/S5.5)** → video walkthrough · threaded pins · per-page approve · **"what changed since last review"** · **white-label** (agency logo/domain, client never sees "Buildrick") · **approval audit-trail** (who/what/when, exportable).
- **J5 approval (S5.1/S5.2/S5.6)** → **multi-stakeholder** (2+ approvers, sequential/parallel) · deadline + auto-reminder.
- **J4 brand-push (S4.7)** → diff-preview → blast-radius → rollback · **token usage-map + safe-rename**.

**◆ High (fold per job as its screens are designed):** inspector contextual density (S3.9) · unified AI ⌘K (S3.14) · AI brief-wizard (S2.1-2.3) · real publish staging+Lighthouse+rollback (S6.1) · dynamic-page builder (S3.12) · import-brand-from-URL (S4.5).

---

## 5.8 Current-app completeness cross-check (vs LIVE code, 2026-07-18)

Verified the doc against the **actual source** (not the PRD — the PRD can drift), so nothing in the existing app is dropped before we build. Method: enumerated every real surface from code — rail nav (`rail/tabsConfig.ts`), sidebar tabs, `settings/screens/`, inspector sections, engine managers/Composer wiring, modals, `src/ai/` — and diffed against §5.5/§5.6.

**Authoritative inventory (what actually exists in the running app):**
- **Rail nav — 11 destinations:** Insert · AI · Templates · Media · Layers · Pages · Components · Design · Settings · Publish · History. → all mapped (§4.3): **5 stay** (Insert · Layers · Pages · Media · Design→Brand), **Content is net-new**, and 6 relocate; **Templates** dissolves into the New-Page flow + Insert; **Components** splits (browse→Insert, manage→Inspector); **AI**→⌘K + selection toolbar; **History**→save pill; **Settings + Publish**→Site full-page + topbar CTA.
- **Settings — 11 screens:** SiteSettings · SEO · Analytics · Advanced(custom-code) · Redirects · Headers · Localization · Forms · IntegrationsScreen · IntegrationsHub · LockedScreen.
- **Inspector — real sections:** Background · Border · CornerRadius · Size · Spacing · Grid · Flexbox · Typography · Effects · Visibility · Link · CSSClasses · AllCSS · QuickActions · Variant · Animation · Interactions.
- **Engine managers:** Composer · History · VersionTimeline · Selection · Viewport · Plugin + domains (cms · forms · **fonts** · media · interactions · animations · designSystem · export · storage · **recovery** · migration · colorMode · drag · routing · dark/aliasResolver · integrations · collaboration · ai · data · components · templates).
- **Modals (live):** CommandPalette · **Conflict** · **ProjectSettings** · CreateComponent · DetachConfirm · CMSCollectionSetup · CMSRecords · IconPicker · ImageEditor · ReplaceAcross · BlockPicker · StarterGallery · **AIPrompt** · AddToken · TokenReplace · TabGuard · Review · MigrationProgress · TemplatePreview · DeleteConfirm.
- **`src/ai/` module:** AccessibilityChecker · ColorPalette · LayoutSuggestions · GeneratedResult · quickPrompts.

**Gaps the cross-check found (now folded in):**
| # | Missing/wrong in doc | Reality (code, live-checked) | Fix |
|---|---|---|---|
| X1 | LockedScreen absent | live (4 refs) — Pro-gate / locked settings state | **ADD** → Settings; a real gated-state screen |
| X2 | IntegrationsHub vs Screen conflated | two surfaces (hub list + detail) | note both; still 🔵 coming-soon |
| X3 | ProjectSettingsModal absent | live (2 refs) — project-level settings modal | **ADD** → chrome (⋯/topbar), distinct from the Settings tab |
| X4 | ConflictModal absent | live (2 refs) — save-conflict dialog | **ADD** → J3/J6 save state (the spurious-conflict bug P1-2 surfaces here) |
| X5 | AIPromptModal absent | live (3 refs) — AI-generate design-system from a prompt | **ADD** → BRAND/Design (a real AI feature beyond AITab) |
| X6 | Fonts not a feature | `FontManager` wired in Composer — Google-fonts + custom | **ADD** → BRAND/Design › typography |
| X7 | Recovery not a feature | `RecoveryManager` wired in Composer — crash/unsaved recovery | **ADD** → engine cross-cutting (a real trust surface) |
| X8 | PageTabBar not in chrome | live — open-pages tab strip (multi-page) | **ADD** → chrome (top page tabs) |
| X9 | "Branding" settings screen listed (§5.5-H) | **no BrandingScreen in code — phantom** | **CORRECT** → drop; site identity lives in SiteSettings |
| X10 | AI helpers unaccounted | AccessibilityChecker / ColorPalette / LayoutSuggestions / GeneratedResult / quickPrompts = **0 importers (dead since D2 removed their surfaces)** | **ADD to dead-list**; **AccessibilityChecker worth re-homing** (a11y audit → inspector), rest CUT |

**Verdict:** after folding X1-X10, **every live surface in the current app maps into the redesign.** Nothing dropped. The only removals are deliberate: phantom "Branding" (X9), post-D2 dead AI helpers (X10), and the flagged-bet collab. Real net surfaces ≈ 47 screens + these 7 cross-check adds (X1, X3-X8) as sub-surfaces/states.

---

## 5.9 Job flow-graphs (screen → screen; where each job leads in and out)

The screen list is nodes; these are the edges. Screen IDs from §5.6. ⚠ **The group labels in these graphs (CREATE ▸ / STRUCTURE ▸ / BRAND drawer) are the superseded taxonomy** — read them via the §5.5 translation table; the live rail is Insert · Layers · Pages · Media · Content · Brand (§4.3).

**J1 · Onboard**
```
open editor
 ├ first time → S1.1 first-open (coach) ─▶ S1.3 new-page choice
 │                                          ├ Blank    → S3.1 canvas (J3)
 │                                          ├ Template → S3.4 → S3.1
 │                                          └ AI       → S2.1 (J2)
 ├ returning  → S1.2 returning-open ─▶ S3.1 canvas
 └ session dead → S1.5 load-error → sign-in
 S1.4 checklist = overlay, always reachable → deep-links into J3/J4/J5
```

**J2 · AI-draft**
```
S2.1 brief → S2.2 generating → S2.3 result ─┬ accept     → S3.1 canvas (J3)
                                            └ regenerate → S2.2
S2.4 unavailable (no key/quota) guards S2.1
S2.5 AITab chat = in-editor anytime (⌘K)
```

**J3 · Build (the hub)**
```
                CREATE ▸ S3.2 insert · S3.3 blocks · S3.4 templates · S3.5 components · S3.6 media · AI
                   ▲▼
   S3.1 CANVAS ◀────────▶ STRUCTURE ▸ S3.7 pages · S3.8 layers · S3.12 CMS
       │  ▲
   select│  │  S3.9 INSPECTOR → S3.10 interactions · S3.11 animation
       ▼  │
   S3.14 ⌘K palette (jump anywhere) · S3.15 preview/device
   exits → J4 brand · J5 send-for-review · J6 publish
```

**J4 · On-brand**
```
S4.1 tokens ◀▶ S4.2 styles ◀▶ S4.3 starters   (BRAND drawer)
S4.4 lint (warn/auto-fix) · S4.5 import/export · S4.6 dark-preview
S4.7 brand-push: pick sites → diff → blast-radius → confirm → rollback
                 ⚠ crosses into OTHER client sites
```

**J5 · Sign-off (the wedge)**
```
DESIGNER (editor)                         CLIENT (S5.5 desktop link)
S5.1 send-review ──emails link──▶ S5.5 landing → view → comment (pins)
   │                                     ├ Request changes ─▶ S5.2 (changes)
   ▼                                     └ Approve ─▶ S5.2 (approved) ─▶ J6 unlocks
S5.2 status ◀── client action
S5.3 comments (canvas pins) ◀── client pins
S5.4 gate-error ◀── publish attempted while pending
S5.6 post-approval lock ◀── designer edits after approval → re-review
```

**J6 · Ship**
```
S6.1 publish → (connect Vercel?) → publishing (real steps) → live URL
                                        └ failed → reason → retry
S6.2 export (HTML/ZIP/React) · S6.3 custom-domain: connect → DNS-verify → SSL
S6.4-S6.9 settings (SEO/analytics/redirects/headers/forms/locked)
GATE: J5 approval must be APPROVED — else S5.4 blocks
```

**Cross-job spine**
```
J1 onboard → J3 build → {J2 assist · J4 brand} → J5 sign-off → J6 ship
                                                    ▲ gate blocks J6 until APPROVED
```

---

## 5.10 Full codebase reconciliation (6-agent evidence inventory, 2026-07-18)

Six parallel agents inventoried the WHOLE editor source (engine · sidebar · inspector · shell/rail/canvas · domains · services/ai/blocks/shared), every row cited `file:line`. This section captures what §5.5/§5.6 got wrong or missed — so nothing implemented, broken, or dead is unaccounted for.

### Corrections already applied inline (above)
Interactions **14 triggers × 39 presets** (was "13-14 × 42") · AnimationEditor **25 presets** (12+8+5) SEPARATE from Interactions' 39 · Icons **370/17-cat** (was 369) · Catalog **27** (8/11/8) (was 27-30) · **ecom blocks reachable** under "Advanced" (was "excluded") · **contact-form** is the only true block orphan · CMS **dynamic-pages + per-record publish EXIST** (was "missing") · Blocks 63 breakdown added.

### Net-new IMPLEMENTED features (were absent from the doc — now placed)
| Feature | Engine/UI | Status | IA home + call |
|---|---|---|---|
| **DataManager** — data-source registry, path resolution, condition eval, **global variables**, Style/Text/Trait data-binding, watch | `engine/data/DataManager.ts` + `useDataManager` | ✅ wired | **ADD → STRUCTURE › Data** (a real dynamic-data subsystem beyond CMS; today no discoverable UI home) |
| **FontManager** — system + Google Fonts + **custom-font upload** (data-URL) + favorites + delete | `engine/fonts/FontManager.ts` | ✅ wired | **ADD → BRAND › Typography** (X6) |
| **RecoveryManager** — crash capture, `wasLastSessionCrashed`, inactivity recovery, ensure-page-root | `engine/recovery/` | ✅ wired | **ADD → chrome** (recovery banner "restore unsaved work" on reopen) (X7) |
| **PluginManager** — register/load/unload, HTTPS+allowlist+SRI CDN load | `engine/PluginManager.ts` | ✅ wired, 🔒 flag-dead (B17), 0 plugins ever | **DECIDE/GATE** — real capability or cut |
| **AliasResolver** — token alias graph, resolve/getChain, cycle+depth errors, rename bridges | `engine/aliasResolver/` | ✅ wired | KEEP (BRAND engine) |
| **DarkResolver** — light/dark token resolve, `tokens:dark-missing` | `engine/darkResolver/` | 🟡 warn-chip UI "later phase" | **COMPLETE** the inspector dark-missing chip |
| DS engine: TokenUsageTracker · LintState · DSLinter · CSSBundler · contrastFix · tokenValueGuard · projectMigrations | `engine/designSystem/` | ✅ wired | KEEP (BRAND engine) |
| **ProjectSettingsModal** — General / Canvas (grid+snap) / SEO tabs | `shell/modals/` | ✅ | **ADD → chrome ⋯** (X3, distinct from Settings tab) |
| **SaveAsComponent** modal (canvas right-click, binding-aware) | `shell/StudioModals` | 🟡 first-id-only | KEEP/FIX |
| **7 form field primitives** (Input/Number/Select/Color/Textarea/Slider/File) + FormStateOverlay | `shared/forms/` | ✅ | KEEP (DS — designer needs these) |
| **shared/extensions**: PanelHeader · ConfirmDialog · CopyButton · UpgradeModal🔒 · PremiumBadge🔒 · SkeletonCompounds · TabFrame | `shared/extensions/` | ✅ | KEEP (DS compositions) |
| Export injectors: SEO · Sitemap · **Analytics (GA/Pixel/Ads)** · Stripe · Formspree · sanitizeHeadCode | `engine/export/` | ✅ | KEEP (J6 engine) |
| Canvas overlays: measurements · guides · smart-guides · rulers; CanvasFooterToolbar toggles **X-Ray · Badges · DeviceFrame** | `editor/canvas/` | ✅ | KEEP (J3 — enrich S3.15) |
| Pages: **SearchListingsTable** (site SEO listings) · page-settings modal (580w) (SEO/Social/**Advanced: password-protect + custom head**) | `sidebar/tabs/pages/` | ✅ | KEEP (fold into S3.7) |
| **ElementsTab** — 2nd block library (canvas BlockPickerModal), favorites LIVE | `sidebar/tabs/ElementsTab` | 🟡 | reconcile w/ BuildTab (two surfaces) |
| StockService (stock photo/video/icon/font search) | `services/stock/` | ✅ LIVE | KEEP (docstring wrongly says "stub") |
| LockedScreen (pro/enterprise/coming-soon + waitlist) | `settings/screens/` | ✅ | KEEP (X1) |

### New DEFECTS found this pass (not in the prior §1-3 audit)
| # | Defect | Where | Sev |
|---|---|---|---|
| N1 | **Settings custom-code plan-gate is a NO-OP** — lock map keys `advanced`+`integrations` but nav ids are `custom-code`+`integrations` → custom-code never gated (only Integrations locks) | `settings/types.ts:61-64`, `SettingsTab.tsx:215` | 🔴 |
| N2 | **Two divergent Insert catalogs** — rail BuildTab reads 53-block `build/catalog`, canvas BlockPickerModal reads 63-block `blockRegistry` | — | 🟡 |
| N3 | **BuildTab favorites system DEAD** — favs computed in hook, never rendered; ElCard has no star (its own comment lies) | `useBuildTab.ts:142-169` | 🟡 |
| N4 | **FullPageRouter templates branch unreachable** — no tab has `mode:"fullpage"`; only assets reaches it | `FullPageRouter.tsx:54` | 🟡 |
| N5 | Two "add-element" surfaces diverge (BuildTab dead-fav vs ElementsTab live-fav) | — | 🟡 |
| N6 | Shell CommandPalette mounts TWICE (Topbar + StudioModals) | — | 🟡 |
| N7 | **engine/ai generators = dead parallel impl** of the live AITab path (PageGenerator/ContentWriter/CodeGenerator/LayoutAnalyzer, 0 instantiation) — root cause of J2 whole-site stub | `engine/ai/` | 👻 |
| N8 | StockService docstring claims "stub"; impl is LIVE (doc-drift) | `services/stock/StockService.ts:4` | 🟡 |

### Complete ORPHAN ledger (👻 — built, 0 live importers; cut candidates)
`src/ai/` whole folder (AccessibilityChecker·ColorPalette·LayoutSuggestions·GeneratedResult·LoadingIndicator·quickPrompts) · `engine/ai` generators (PageGenerator·ContentWriter·CodeGenerator·LayoutAnalyzer) · WelcomeModal · SpotlightOverlay · ConnectionQualityIndicator · media/ReplaceAcrossModal (superseded by sidebar ReplaceAcrossDialog) · canvas: InspectorToggle·ZoomControl·QuickAddBar·SmartSuggestions·UndoRedoControls·DeviceSelector·MediaQuickActions·TemplatePreviewPanel·root ZoomControls(262L) · cms/RepeaterRenderer · cms/DataBindResolver · data/TemplateEngine · engine/history/StateReconstructor · TemplateManager · integrations/EmailMarketingService (throws) · blocks/Navigation (empty) · blocks/contact-form · renderer/spacingEssentialsSchema · sidebar/FeatureCard(245L)·FilterChips·ViewSwitcher(192L) · BuildTab favorites+insertionContext.
→ **AccessibilityChecker worth re-homing** (a11y audit → inspector); the rest = CUT (raises coverage by removing denominator).

### Complete STUB ledger (🔵 — fake/not-wired)
PageWizard (fake AI) · engine PageGenerator (whole-site draft) · image-gen picsum · DS Figma-export · Vue/Next export · MediaLibraryPanel From-URL tab · LibraryManager Trash · AnimationEditor Timeline/ScrollTrigger · EmailService cloud providers (throw) · AIAssistService (null client default) · Integrations 6 cards (Coming-Soon) · ColorInput alpha.

### Saved-not-live cluster (🟡 — persist but not enforced on live site)
Redirects · Headers · Localization (each self-declares via in-screen banner; live enforcement = publish-middleware "Phase D") · page-settings password-protect + custom-head (enforcement depends on publish middleware) · forms submissions (editor preview in-memory; published uses real endpoint).

---

## 6. Actionable suggestions — master table

Consolidated from audit (47 fixes done + open), eng review (9), design review (5). Status: ✅ done this pass · 🔲 open.

| # | Suggestion | Job | Track | Status | Source |
|---|---|---|---|---|---|
| S1 | Left-rail spine — **6 canvas-interacting icons** (Insert·Pages·Layers·Media·Content·Brand), swap-panel | shell | A | 🔲 | office-hours + §4.3 |
| S2 | AI → **⌘K launcher + canvas selection toolbar** (no rail slot); agent runs promote to the right AI panel | J2 | A | 🔲 (consolidation ✅) | D2/D-T3 |
| S3 | Topbar/footer = actions/status only | shell | A | 🔲 | office-hours |
| S4 | **Client review surface** (tokenized, comment, approve) | J5 | B | 🔲 | audit D4 / design |
| S5 | Approval-gate behind flag + comms | J5 | B | 🔲 | eng T1 |
| S6 | Approval error-state UX | J5 | B | 🔲 | design D-T2 |
| S7 | Invalidate approval on post-approval edit | J5 | B | 🔲 | eng T2 |
| S8 | Comments editor UI | J5 | B | 🔲 | audit A4 |
| S9 | **Fix component "reset to master"** path-scheme | J4 | B | 🔲 | §13-A2 |
| S10 | Brand cross-site push flow (diff/blast/rollback) | J4 | B | 🔲 | audit §12 |
| S11 | Real whole-site AI-draft or cut the promise | J2 | B | 🔲 | audit A7 |
| S12 | Kill/real PageWizard; real first-run coach | J1 | B | 🔲 | audit A17/A18 |
| S13 | Enforce/beta-label Redirects/Headers/Localization | J6 | B | 🔲 | audit B8 |
| S14 | Real publish-worker steps (no fake ✓) | J6 | B | 🔲 | audit A20 |
| S15 | SEO score labels → live earned points | J6 | A | 🔲 | design D-T4 |
| S16 | Inspector 6→2 density simplification | J3 | A | 🔲 | ux-audit |
| S17 | Instrument the funnel (metrics) | all | — | 🔲 | §7 |
| S18 | Commit the 150-file blob as logical units | infra | — | 🔲 | eng T3 |
| S19 | Restore collab leak regression test | infra | — | 🔲 | eng T4 |
| S20 | Fix vitest↔coverage-v8 + dashboard-glob (CI coverage) | infra | — | 🔲 | eng T5 |
| S21 | Dissolve the 3 template surfaces → New-Page flow + Insert (not one panel) | J1/J3 | A | 🔲 | §12 F2 / Ch.12 |
| S22 | CMS **front-door only** (per-record publish + dynamic pages already exist — re-scoped 2026-07-18) | J3 | B | 🔲 | §12 #6 |
| S23 | ~~Register 4 ecommerce blocks~~ → **restated**: improve e-commerce block discoverability (they are reachable, but only under the "Advanced" label) | J3 | B | 🔲 | Ch.12 §12.6 |
| S24 | Unify 2 command palettes → one ⌘K, registry-backed | shell | A | 🔲 | §12 #5 |
| S25 | Cut dead cards/stubs (Integrations Coming-Soon, Vue/Next export, AllCSS, WelcomeModal, ConnectionQualityIndicator, TemplateManager) | all | A | 🔲 | Ch.12 |
| S26 | Collaboration: invest (real OT/CRDT, eval Yjs) or cut | collab | B | 🔲 DEFER | §13-B3 |
| S27 | Interactions + Animation: keep (real, big) — CUT Timeline/ScrollTrigger L0 stubs | J3 | A | 🔲 | Ch.12 §12.4 |
| — | 47 bug-fixes (styles/services/media/export/inspector/sidebar) | J3/J4/J6 | B | ✅ | audit §5f |
| — | Brand sweep, dedupe utils, CI-lint-blocking, email XSS, AI consolidation, media quota | all | A/B | ✅ | audit §5h |

---

## 6.5 Decide-before-build checklist (resolves review finding C1)

The doc hedges ~10 features as "CUT or COMPLETE." Each is a hole a screen can't be built into. One-word founder call each; cheap, blocking. My lean in the last column — override any.

| Feature | Problem today | Cut | Complete | Lean |
|---|---|---|---|---|
| PageWizard "AI" | inputs discarded, fake | remove | wire to real AI | **cut** (dupes J2) |
| Whole-site AI-draft | returns blank site | drop the promise | build server gen | decide **with J2** (Phase 4) |
| Integrations (6 cards) | all "Coming Soon" | hide | build | **cut** (dead cards erode trust) |
| Branding settings screen | no fields, just links | remove | add fields | **cut** (SEO/DS cover it) |
| Vue / Next export | stub coming-soon | remove | build | **cut** (HTML/React ship) |
| AllCSS raw editor | devMode-dead | remove | Pro-gate + sanitize | **gate** (Pro, later) |
| Figma export | stub envelope | remove | build | **cut** (low ROI) |
| EmailService providers | throw | remove | wire `/api/email/send` | **complete** (forms need it) |
| Catalog-drop | placeholder | remove | build | **cut** |
| Collaboration | 6 P1 non-convergence | cut from marketing | real OT/CRDT (Yjs) | **cut now, revisit** |

Resolve this table → the "or" disappears → §5.5 becomes a buildable spec.

---

## 7. Success metrics (propose — none instrumented today)

Audit found **no product-funnel analytics** (only AI-adoption + Sentry). You can't see where agencies drop. Instrument:
- **Time-to-first-published-site** (activation) — target ≤ first session.
- **Sign-off-loop completion rate** (approved ÷ submitted-for-review) — the wedge's health.
- **Client-review engagement** (client opens review link ÷ sent) — does the approver actually use it.
- **Publish success rate** (COMPLETED ÷ started) — ≥95%.
- **Time-to-first-edit** (open → first applied change) — ≤2min.

---

## 8. Sequenced roadmap (build order)

**Phase 0 — stabilize (infra, before any new UI):** S18 commit-in-units · S19 collab regression test · S20 CI coverage reproducible · S5 approval-gate flag (don't let the prod-behavior change ship raw).

**Phase 1 — the wedge (J5, highest leverage):** S4 client review surface · S6 approval error-state · S7 invalidate-on-edit · S8 comments UI. This is where the product wins vs Webflow. Design in Figma first (`figma-product-design`), then build. **Ship a minimal funnel instrument WITH this phase (not Phase 5)** — sign-off-completion-rate + client-review-open-rate — or you can't tell if the wedge landed (CEO review). **Scope reality (CEO):** J5 is not "6 screens" — the client page needs public tokenized sessions for non-users, notifications, and an audit trail; treat it as a real backend, not a UI sprint. **Consider a "declutter-lite" (rail spine only) in parallel** so the founder sees progress on the felt clutter problem while the wedge builds.

**Phase 2 — the declutter (Track A shell)** — build against `2026-07-18-editor-shell-wireframes.md`: S1 rail spine (6 canvas-interacting icons) · S3 topbar→global-only + canvas-toolbar split + footer→status-strip · S2 AI → ⌘K + selection toolbar · S15 SEO labels · S16 inspector density. Fixes the founder's felt problem. Must NOT disturb J3.

**Phase 3 — brand-at-scale (J4):** S9 fix reset-to-master · S10 cross-site brand push. The second agency wedge.

**Phase 4 — honesty pass (J6/J2):** S13 enforce/beta-label settings · S14 real publish steps · S11 real-or-cut AI-draft · S12 first-run/PageWizard.

**Phase 5 — measure:** S17 instrument the funnel, then let data pick the next work.

---

## 9. Open product decisions (still yours)

- **★ Strategic risk #1 (CEO review):** the wedge bets on top of an editor whose **competitive build-quality vs Webflow/Framer is asserted, not validated** (J3 9/10 = internal-bug-free, ≠ "an agency will choose to build here"). Before over-investing in J5, validate that a real agency will build the *whole* site here — watch build→brand→sign-off→ship end-to-end (§10 item 2), not just sign-off. If they won't build here, the sign-off wedge never gets used.
- **Persona validation:** WHO=agency-designer is locked from office-hours but not tested with real agencies. If the base skews solo/SMB, the sign-off wedge is worth less.
- **D3 collaboration** (demo-only, 6 P1s) — invest in real OT/CRDT or cut from marketing. (Not on this roadmap; flagged bet.)
- **AI-draft (J2)** — build real or cut the promise (S11). Decide before Phase 4.
- **ColorInput real alpha** — deferred (scope).

## 10. Assignment (do this next)

1. **Take J5 (client sign-off) into Figma** (`figma-product-design`) — detailed wireframes done: **`2026-07-18-j5-signoff-wireframes.md`** (6 screens, every state, layout + real content). Hi-fi those. Spec: §5-J5 + §5.6.
2. **Then watch one real agency designer** send a site to a real client and watch the client try to approve it — without help. Where the client hesitates is the wedge's truth. (Watch, don't demo.)

## 11. Handoff
- **Screens** → `figma-product-design`, this doc as spec + PRD Ch.14 per-screen. Start with J5 (§5), then the shell (§4).
- **Build** → per the Phase order (§8); Phase 0 infra before new UI.
- Keep Track A (declutter) and Track B (job completion) as separate PRs — don't let the shell redesign hide the unfinished jobs.

---

## GSTACK REVIEW REPORT

Design-lens plan review (`/plan-design-review`) of this doc + PRD Ch.14 screen-specs, 2026-07-18. Reviewed as a PLAN (IA/spec), not a live site. No visual mockups generated — this is an IA/spec pass; per-screen hi-fi is the next step, and J5 wireframes already exist (`2026-07-18-j5-signoff-wireframes.md`).

**Runs / Status**

| Dimension | Rate (before → after fix) | Status |
|---|---|---|
| Information architecture | 7 → 8 | fixed (Settings promoted, Content group, ProjectSettings de-dup) |
| Flow completeness (§5.9) | 8 | ok (add error/back paths at hi-fi) |
| Interaction-state coverage (Ch.14) | 7 | ok (EXISTS screens terse by design; new screens full) |
| Navigation hierarchy | 6 → 8 | fixed (Settings destination, one settings home, ⌘K unify already S24) |
| Specificity / designer-buildable | 7 | ok (WHAT complete + grounded; LAYOUT = per-screen step) |
| SSOT / duplication | 7 | partial (document-map owns; works/broken still echoed — see unresolved) |
| AI-slop / craft | 8 | ok (§3 inherits DESIGN.md) |

**Findings fixed in this pass**
- F1 (Major, nav-hierarchy): Settings (11 screens) was in chrome-overflow ⋯ — fails the trunk-test. → first promoted to a bottom-pinned rail destination, then **finally resolved (§4.3): Settings live in the separate "Site" full-page**, because they never touch the canvas.
- F2 (Major, IA): DataManager + CMS modals had no IA home after reconciliation. → Content rail item (§4.3).
- F3 (Minor, dup): ProjectSettingsModal General/SEO duplicated the Settings tab. → keep canvas grid/snap only; General/SEO → SETTINGS (Ch.14 C4).
- F4 (Minor, label): REVIEW+SHIP → REVIEW (nothing ships from rail).
- F5 (IA): Typography/fonts (FontManager) placed under BRAND › Design.

**Codex / cross-model:** not run *at the time this report was written*. Two `/codex` reviews were run afterwards (left-rail IA, then the 4-icon rail) and their findings are folded into §4.3 — that is the cited "Codex cross-review".

**VERDICT (design):** Plan is design-sound for an IA/spec at this stage. IA rated 8/10 after fixes; the two agency wedges (J5 sign-off, J4 brand-push) are the correct priority and are spec-complete. Ready for per-screen hi-fi (start J5). Nav-hierarchy fixes above should hold before the shell redesign (Track A) begins.

### CEO / strategy review (`/plan-ceo-review`, 2026-07-18)

| Lens | Verdict |
|---|---|
| Premise — is the wedge right? | ✅ Client sign-off is a real, recurring agency pain Webflow doesn't own. Defensible wedge. It's a *feature* alone; the *moat* is agency relationships + J4 brand-push (multi-site). Doc names both — good. |
| Scope realism | ⚠️ J5 under-scoped as "6 screens" — it's a real product (public tokenized sessions for non-users, notifications, audit trail, multi-approver, white-label). Fixed §8/§5-J5. |
| Sequencing for leverage | ⚠️ Instrumentation was Phase 5 (last); can't tell if the wedge landed without measuring sign-off-completion-rate day one → moved to Phase 1 (§8). Declutter-lite in parallel so founder feels progress. |
| Focus (subtraction) | Roadmap phases are right, but ~15 open bugs + 10 §6.5 binaries + collab bet + uncommitted blob = spread. Hold to the phase order; don't do all four tracks at once. |

**Biggest strategic risk (CEO):** the wedge bets on top of an editor whose competitive build-quality vs Webflow/Framer is **asserted (J3 9/10 internal), not market-validated.** If an agency won't build the client site in Buildrick at all, the sign-off wedge is never reached. Mitigation added to §9 + §10 item 2 (watch the WHOLE build→sign-off→ship, not just sign-off).

**VERDICT (CEO):** Bet is sound and correctly sequenced after fixes. Ship J5 behind validation that agencies will build here at all. (Two Codex cross-reviews were subsequently run on the left-rail IA; their corrections are in §4.3.)

**UNRESOLVED DECISIONS:**
- **U1 — Settings placement: RESOLVED (§4.3).** Settings, domains, export, publish history and brand-push live in a separate **"Site" full-page** opened from the topbar ⋯ — none of them touch the canvas, which is the rule that decides rail membership.
- **U2 — Data vs CMS:** folded both into STRUCTURE › Content. Confirm whether Data-binding (DataManager) is shipped scope or an advanced/beta surface separate from CMS.
- **U3 — works/broken SSOT:** `complete-state.md` is the canonical works/broken doc, but status still echoes in §5.5/§5.10/Ch.14 (screen specs need inline build-status). Accept the per-screen echo, or thin §5.5 to links only.
- **U4 — validate before over-investing (CEO):** confirm a real agency will build the WHOLE site in Buildrick (not just approve in it) before pouring weeks into the J5 backend. This is the #1 strategic risk (§9).
- **U5 — J2 AI-draft + D3 collab:** the two headline bets still open (§6.5) — build-real vs cut. Decide before their phases.
