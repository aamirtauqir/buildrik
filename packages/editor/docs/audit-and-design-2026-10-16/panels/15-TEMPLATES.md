# Panel 15 — Templates area: functionality specification (FD-PNL-15)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by P-TRIAL (T-TP-13 only) *(R-1018, D3-18)* · not VERIFIED.** Independent `design-qa-critic` review: pass 1 PROPOSAL with 4 blocking (B1–B4) + 16 notes; pass 2 PROPOSAL with 2 (B4 partial, X1) + 3 notes — all fixed 2026-10-17. Runtime NOT RUN; geometry NOT MEASURED. Written from a code inventory (file:line below) for the product-design review gap X07. *(DS)* = designer-selected under owner instruction 2026-10-17 "han yeha bhee likh do". Panel 00 (incl. SC-11…SC-19) wins on conflicts.
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S2, N7; gap rows D3-2, D3-18, T6-22, T1-30, T3-24, T1-08 (description field), D3-16; CS-01, CS-10, CS-11, CS-14 (US spelling); matrix states offline / long names. Round 2: Q9 (hand-off), Q15, Q16 *(R-1018b)*.
Governing IA: **IAF-06** (A–M, `evidence/ia-final-2026-10-16/module-specifications.md:287-341`), IA-01 (Templates is an editor area), Panel 03 (Add → "Page templates…" door), Panel 11 (Pages → New page → From template = primary entry; row "Replace layout with template…"), Panel 05 (empty-canvas cards), SC-1 back, SC-15 recovery, SC-18 plan limits, 00-STRATEGY job 1 ("get to a professional-looking site fast").
Editor paths under `packages/editor/src/`; `tabs/templates/` = `editor/sidebar/tabs/templates/`.

---

## 1. Purpose and boundary
Job: J1 Build (00-STRATEGY §3) *(R-1018)*

The Templates area answers: **"Which ready-made page layout do I want, and where does it go — a new page or this page?"**
- In: the editor's page-template catalogue (built-in + saved), preview, Create page / Replace page, saved-template management, every editor door into it.
- Out: dashboard **site templates** (`/dashboard/templates`, multi-page, Prisma `Template`) — a different system; Brand › **Starters** (token presets, Panel 09); Add › Sections (the 8 section blocks, Panel 03); CMS collection pages (FD-DYN-01).
- **Noun (amends SC-11, 2026-10-17):** "template" is now free of its other meanings (sections = "Section", CMS = "Collection page"), so the user-facing noun is **Page template**, area name **Templates** — matching the code, the dashboard and Webflow/Framer. The SC-11 row "Starter page" is replaced (avoids a clash with Brand › Starters).

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)
| ID | Area | Today |
|---|---|---|
| TP-01 | Host | `mode:"fullpage"` tab rendered in a full-screen portal (`FullPageRouter.tsx:114-131`) — **rail and topbar hidden**; lazy-loaded with `PanelSkeleton` |
| TP-02 | Doors | event `ui:browse-templates` (`StudioPanels.tsx:594-600`): New page modal "From template" (carries name + nav setting, `NewPageModal.tsx:68-75`); Pages footer / empty-list "From template" (**no name carried**, `PageList.tsx:161-164`); row menu "Replace layout with template…" (replace mode); ⌘K Browse / Replace / one row per template (opens its preview) / Save page as template; key **T**; Add "Page templates ›" via `UI_PANEL_OPEN` (**no origin**, `BuildTab.tsx:350-361`); empty canvas 3 cards + "Browse all templates" (**all open the plain catalogue**, `CanvasEmptyCTA.tsx:64-122`). **No rail button** (`tabsConfig.ts:297-299`) |
| TP-03 | Catalogue | 10 built-in page templates in a static array `SITE_TEMPLATES` (`templatesData.ts:145-256`), 3 premium; saved templates from localStorage `buildrik-my-templates` + server `userTemplates` merge (`templateSync.ts:66-120`); **no categories, filters or search** (deliberate, pinned by `TemplatesTab.ia.test.tsx:27,34,55`) |
| TP-04 | Layout | left list (Back, title, site, "All page templates · N", one row per template, help, "⟳ Reload catalogue"); main grid of cards (`TemplatesTab.tsx:449-546`) |
| TP-05 | Card | scaled iframe thumbnail, name, "N sections", Built-in/Saved chip (+ Pro), APPLIED badge, "Preview template →" / replace mode "Use for {page}" (`TemplateCard.tsx`) |
| TP-06 | Preview | in-area state; header name + type line; "Used on {pages}" links; **Create page** + red **Replace page…**; Desktop 1100 / Tablet 768 / Mobile 375; Esc → catalogue, Esc again closes (`TemplatePreview.tsx`) |
| TP-07 | Create | role gate → Pro gate → confirm → createPage + nav + setActivePage **before** import → import → "Page created" (Done / Open page settings); **no Undo** (`TemplatesTab.tsx:310-321,382-384`) |
| TP-08 | Replace | role → Pro → empty page applies directly; else ReplaceModal with backup checkpoint on by default; backup failure modal (Cancel / Replace without a backup / Try again); one-transaction import; toast + **Undo** (`TemplatesTab.tsx:129-205,367-381`) |
| TP-09 | Apply effects | replaces the page's elements only; name/slug/meta kept; **no Brand, font or CMS writes**; `{{token.*}}` resolved; DOMPurify; applied id in page meta + session; recent list (3) in localStorage |
| TP-10 | Failure | 15 s timeout auto-fails while the apply may still run (`useTemplateApply.ts:78-87`); create-mode failure says "nothing was changed" **although an empty page now exists**; Retry creates a **second** page (`TemplatesTab.tsx:337,631`) |
| TP-11 | Roles | apply needs ADMIN (unknown role allowed); buttons look enabled, toast after click (`TemplatesTab.tsx:153-162`); blank page creation has no such gate |
| TP-12 | Plan | premium locked on `starter` tier → `openUpgrade` (`:156-157`) |
| TP-13 | Brand copy | the preview type line is fixed per source — built-in "Own colours and typography", saved "Styles captured with it" (`TemplatePreview.tsx:83-86`) — while ReplaceModal decides by token presence, "takes this site's brand colours" (`TemplatesTabModals.tsx:113-115`). They disagree for saved templates (captured vs takes brand) and for the token-using built-ins (`templatesData.ts:151,206,250`) |
| TP-14 | Saved templates | save only via ⌘K; **no rename or delete anywhere**; `css` always empty |
| TP-15 | Onboarding | any apply sets `ONBOARDING_DISMISSED` → onboarding ends for good (`templatesStorage.ts:14-19`, `useOnboardingOrchestrator.ts:97-101`) |
| TP-16 | Back labels | "‹ Back to templates" / "‹ Back to Pages" / "‹ Back to canvas" (`TemplatesTab.tsx:455-462`) |
| TP-17 | Dead code | `requestApply/confirmApply/completeApply` state machine unused; its integration test tests nothing the UI runs |

## 3. Problems this design solves (job 1: professional-looking site fast)
1. Doors behave differently — some carry the page name/origin, some don't; empty-canvas cards promise a template and open the list (TP-02).
2. The area hides the rail and topbar, unlike every other area (TP-01).
3. Untruthful failure and duplicate pages on Retry (TP-10).
4. Permission refusals arrive after the click; template create is stricter than blank create (TP-11).
5. Brand copy contradicts itself (TP-13).
6. Saved templates can't be renamed or deleted (TP-14).
7. One apply silently ends onboarding (TP-15).
8. No search; IAF-06 E/K require categories and search while code removed them (TP-03).

## 4. Target layout
```
┌ topbar (unchanged, Panel 01) ─────────────────────────────────────────────────────┐
│rail│ ‹ Back to Pages            Templates                      [ Search ⌕      ] │ header 56
│    ├────────────────┬───────────────────────────────────────────────────────────── │
│    │ SHOW           │ Creating: "About" · added to navigation        Change ›      │ mode bar
│    │ ● All      12  │  (or: Replacing: Home · backup first · Cancel)               │
│    │ ○ Built-in 10  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                 │
│    │ ○ Saved     2  │ │ thumb  │ │ thumb  │ │ thumb  │ │ thumb  │                 │
│    │                │ │SaaS    │ │Portfol.│ │Agency  │ │Rest.   │                 │
│    │ RECENT         │ │6 sect. │ │5 sect. │ │7 sect. │ │6 · Pro │                 │
│    │ Startup        │ └────────┘ └────────┘ └────────┘ └────────┘                 │
│    │ Portfolio      │                                                              │
│    │ 240            │ grid, cards 226 wide                                          │
├ bottom bar (Panel 11) ────────────────────────────────────────────────────────────┤
```
- **Host (Change):** Templates becomes a normal **area** inside the shell — topbar, rail and bottom bar stay; it no longer opens as a full-screen portal (Fix TP-01; IA-01). This overturns board **4418:54134** and **Decision #24** cited at `FullPageRouter.tsx:111-113`; the Figma board must be updated with this panel (dependency T-5). The rail has **no Templates item and no active item** while here (Panel 02; Templates is reached through Pages, Add, canvas, ⌘K, T).
- **Topbar Publish here** *(R-1018b, owner Q15)*: opens the **Publish task in this area's task tray, in place** (SC-7) — the Templates area, its mode bar and any preview stay as they were.
- **Header 56:** SC-1 back slot ("‹ Back to Pages" / "‹ Back to Add" / "‹ Back to Editor · {page}" — Fix TP-16, no "canvas"), title with the **site name** as subtitle (moved from the old left list), **search** (NEW).
- **Local nav 240:** **Show** filter All / Built-in / Saved with counts (NEW, replaces the one-row-per-template list *(DS)*); **Recent** (NEW UI — the recent list max 3 exists in storage, `templatesData.ts:119-135`, but has no UI consumer today). "⟳ Reload catalogue" moves to the ⋯ in the header (kept).
- The old left-list help text ("…saved to History before it is replaced", `TemplatesTab.tsx:486-490`) moves to the mode bar's Replacing line and the Replace confirm (existing sentence), so no guidance is lost.
- **Mode bar** (always visible, IAF-06 E): **Creating** a new page (shows the carried name and nav setting, "Change ›" opens the New page fields inline) or **Replacing** {page} (existing banner text, Cancel). Opening with no mode = Creating with a default name "{template name}", **de-duplicated** ("SaaS Landing 2").
- **Page name rules (IAF-06 H → IAF-05 / Panel 11 PG-06):** empty → "Name the page"; duplicate name → "A page called 'About' already exists"; slug collision → slug gets a suffix and the mode bar says "URL will be /about-2". Create page is disabled with the reason until the name is valid.
- **Grid:** cards (existing anatomy). Card action is always **Preview** (click anywhere / Enter). The replace-mode card button "Use for {page}" is kept as a secondary action.
- **Categories (IAF-06 E/K):** the data has a single category (`site-pages`), so category pills would show one item. Rule *(DS)*: category pills appear automatically when the catalogue has **≥ 2 categories and ≥ 12 templates**; until then search + Show filter. This satisfies IAF-06 K without inventing categories; `TemplatesTab.ia.test.tsx` is rewritten to pin this rule (the "no search" assertions go).

### 4.1 Preview (work area)
```
‹ Back to templates   SaaS Landing · Page template · Uses your brand colors      [Replace page…] [Create page]
[ Desktop | Tablet | Mobile ]                                         Creating "About"
┌──────────────────────── iframe preview ─────────────────────────────┐
```
- Existing preview kept; header carries the actions (IAF-06 F primary Apply); the primary matches the mode (Creating → **Create page** primary; Replacing → **Replace {page}** primary).
- **Brand line (Fix TP-13):** computed per template — contains `{{token.*}}` → "Uses your brand colors"; otherwise "Has its own colors and fonts — your Brand is not changed" (US spelling, SC-11 *(R-1018)*). The same sentence is used in the preview, the Replace confirm and the card tooltip. Brand, fonts and CMS are never written (TP-09, unchanged).
- "Used on {pages}" links kept.
- **Back label:** a preview opened from the catalogue shows "‹ Back to templates"; a preview opened directly (empty-canvas card, ⌘K row) shows the door's origin ("‹ Back to Editor · {page}").
- Esc: preview → catalogue (also for a preview opened directly — only **Back** returns to the door's origin); search → clear, then blur (SC-2 search exception — Templates added there); otherwise no-op (**Change:** Esc never leaves the area, SC-2/SC-10).

## 5. Flows

### 5.1 Doors — one contract (Fix TP-02)
Every door opens the area through one request `{mode, targetPageId?, newPageName?, addToNav?, origin, previewId?}`.
| Door | Mode | Lands on | Back |
|---|---|---|---|
| Pages → New page → From template (primary, SC-10) | Creating, name + nav carried | catalogue | ‹ Back to Pages (reopens the New page sheet with its fields) |
| Pages footer / empty list "From template" | Creating, default name | catalogue | ‹ Back to Pages |
| Pages row "Replace layout with template…" | Replacing {page} | catalogue | ‹ Back to Pages |
| Add › Sections footer "Page templates…" | Creating | catalogue | ‹ Back to Add (Add query/scroll restored, Panel 03) |
| Empty canvas card "{name}" | Replacing the current empty page | **that template's preview** (Fix) | ‹ Back to Editor · {page} |
| Empty canvas "Browse all templates" | Replacing the current empty page | catalogue | ‹ Back to Editor · {page} |
| ⌘K Browse / Replace / template row / T | Creating / Replacing / preview | as named | ‹ Back to Editor · {page} |

### 5.2 Create page
Preview → **Create page** → (plan capacity check, Panel 11 §6; until the capacity query ships, the existing post-save error stays) → apply → land in Editor on the new page, selected root, toast **"About created from SaaS Landing · Page settings"**, and **after T-4** "… · Undo · Page settings" (min 8 s, pauses on hover/focus — WCAG 2.2.1). Until T-4 the toast offers no Undo.
- **Undo** (NEW) removes the page **and** its navigation entry and frees the capacity slot — requires engineering **T-4** (create + nav are outside the import transaction today, `TemplatesTab.tsx:318-320`).
- The existing "Create a page from 'X'?" confirm is **removed once T-4 ships** *(DS — SC-15 Undo over confirm)*; **until then the confirm stays** — a declared, temporary exception tied to T-4 (S2 lists page create under no class; it moves to class a, Undo only, when T-4 ships) *(R-1018)*.
- **Failure (Fix TP-10):** create + import run as one operation. If the import fails after the page was created, the page is **removed** and the message is true: "Couldn't create the page — nothing was changed · Try again". Requires engineering **T-1**; until then the copy says "An empty page 'About' was created — Delete it / Try again into it", and Try again imports into that page (never a second page).

### 5.2a Preflight before any apply (IAF-06 G/I, T-IAF06-3)
- **Dirty state:** an inline text edit or unsaved Inspector draft on the target page is committed or discarded through the existing draft guard before apply.
- **Stale target:** if the target page was deleted or renamed, or the user's role changed while the area was open, the apply is refused: "The page you were replacing changed — choose it again" (the area stays in **Replacing** mode with the target cleared — "Choose a page to replace" — never switching to Creating) / "Your access changed — {reason}". Never falls back to another page or template (see §11 defect 8).
- **Import report (IAF-06 H):** parts the parser can't import are listed at the end of the progress overlay: "2 parts couldn't be imported: embedded form, video" + Keep / Undo. Built-in templates are plain HTML with no components. **Saved templates** are exported from user pages and *may* have held component instances — *assumption, not verified:* the export (`exportHTML().combined`) writes plain HTML, so instances arrive flattened; the import report then says "Components were saved as plain elements" (IAF-06 K: never flatten **silently**). Component packages stay in Panel 13.
- Confirms (Replace, backup failure) are bounded **720** dialogs (IAF-06 F).

### 5.3 Replace page
Kept: empty page applies directly; otherwise a **consequence confirm (SC-15 class b, S2 — default Cancel)** *(R-1018)* that states the consequence — element count removed, Brand line (§4.1) and **Save a backup first** (on by default); backup failure → Cancel / Try the backup again / Replace without a backup (warned). Toast "{page} replaced · Backup in History › Saves · Undo" (existing). Lands in Editor on that page.

### 5.4 Running and double submit
- One apply at a time; buttons disabled while running (existing ref guard) and bound to an **operation id** (engineering **T-2**, IAF-06 H).
- Progress overlay with the existing four stages; **Cancel** only before import (existing).
- **15 s (Change):** no auto-fail while work may still run — show "Taking longer than usual…" with **Keep waiting**; a real failure comes only from the operation (until T-2: after 60 s show "We couldn't confirm the result — check the page" + Open page).

### 5.5 Saved templates (NEW management)
- Save: ⌘K "Save page as template" (existing) + **Pages row menu "Save as template…"** (NEW door; Panel 11 §5 must list it, T1-08/T3-9) → **name + description fields** (both existing, INV 11.5 — the description is kept) *(R-1018)* → saved.
- In the area, a Saved card's ⋯: **Rename**, **Delete** (NEW). **Delete = SC-15 class (a)** *(R-1018b, owner Q16)*: no confirm; toast "{Name} deleted · Undo · Recently deleted ›" (≥ 8 s); the template moves to **Templates › Recently deleted** for 30 days (header ⋯ › Recently deleted (N); layout = Panel 24 §4.8; Restore keeps the same ID; Delete permanently = SC-15 class (c), ADMIN+). Needs **T-7** (= Panel 24 U-9); until then the toast's Undo works through a client grace period before the server delete *(DS)* and there is no Recently deleted entry. Delete uses the existing server endpoint `userTemplates.delete` (`server/trpc/routers/user-template.ts:37`) and removes the local copy, so the server merge doesn't bring it back. Rename needs **T-3** (rename through `upsert`); until then Rename is not shown.
- Empty Saved filter: "No saved templates yet — save any page from Pages › ⋯ › Save as template".

### 5.6 Onboarding (Fix TP-15)
Applying a template no longer sets `ONBOARDING_DISMISSED`; it completes step 1 "Add your first section" of the first-run checklist (Panel 16 §4.3).

### 5.7 Template colors and Brand (N7) *(R-1018 — T6-22, T1-30, T3-24)*
- **Decision (owner N7, 2026-10-18):** the built-in page templates are **re-authored on Brand tokens** (`{{token.*}}`) with **no purple / violet / indigo** (DESIGN.md ban), so a Brand edit recolors them. This is **content work** (engineering/content dependency **T-6**), not a UI change; once a template uses tokens its Brand line reads "Uses your brand colors" (§4.1).
- **Interim — "Connect to Brand colors" offer** (until T-6 covers a template): after applying a template whose colors are literal values (Brand line "Has its own colors…"), a transient toast (Panel 22 §5.10 stack) reads "{template} uses its own colors · Connect to Brand colors ›". The action **hands off to Panel 09 §7 Checks › Connect-to-tokens subtask** (Panel 09 owns its interior), scoped to the page just created or replaced, with exact return to Editor on that page. It is offered once per apply; dismissing it changes nothing. **Connect writes a restore point "Before connect" first** (owner Q9 *(R-1018b)*; Panel 09 §7 owns it), so the hand-off is reversible from Brand › Restore points as well as by one Undo. Saved templates are not offered it (their styles were captured from this site).

## 6. States and permissions
| State | Behaviour |
|---|---|
| Loading (lazy area) | skeleton grid (existing PanelSkeleton, area-shaped) |
| Saved sync pending/failed | Saved count shows "· syncing" / "Couldn't load saved templates — Retry" (server merge) |
| No search match | "No templates match '{q}' — Clear search" |
| Thumbnail / preview render error | card shows name + "Preview unavailable"; preview shows "Couldn't render this template" + Back |
| **Pro templates (SC-20)** | Pro templates (code: `premium`) show a **"Pro"** chip *(amended 2026-10-17 — source: Panel 23 / SC-20, OD-PL-4)* (card, preview header, accessible name). **During the 30-day Pro trial and on Pro:** fully usable, chip reads "Pro · included in your trial" in the trial. **On Free after the trial:** preview stays open to everyone; Create/Replace become **"Upgrade to use"** (billing rights) / **"Ask the workspace owner to upgrade"** (SC-18). Pages already made from a Pro template are never removed |
| Role (Fix TP-11) | **Create page and Replace page are both EDITOR+** — OD-T1 accepted under the owner's standing instruction (backup + Undo make replace recoverable). The ADMIN rule today is a **client-only** gate (`TemplatesTab.tsx:153-162`); the document write is protected by the normal save permissions. Viewers: both actions **disabled with reason** "Create page needs Editor access" / "Replace page needs Editor access" (DS §3 role refusal; replaces "Viewers can't change pages") *(R-1018, D3-16)*, never an after-click toast |
| Role unknown | actions disabled "Checking your access…" (Fix: unknown ≠ grant, same as Panel 10 §6) |
| Viewer | doors disabled with reason; ⌘K rows shown **disabled with reason** (SC-18) |
| Offline *(R-1018 — aligned to Panel 22 §5.3, D3-2; replaces the earlier assumption that apply works offline)* | Panel 22 owns the banner and the one polite announcement. Built-in catalogue, search and preview work (static); saved templates show the last local copy with "· offline". **Create page and Replace page are disabled with "Needs a connection"** — the backup checkpoint (`versions.autoCheckpoint`) and the capacity check need the server. Save as template, Rename and Delete of saved templates are disabled the same way |
| Long names *(R-1018)* | template names: card title 2 lines then ellipsis, full name in the tooltip and the card's accessible name; preview header 1 line + ellipsis. Page names in the mode bar ("Creating '{name}'", "Replacing {page}") and in toasts quote at most 40 characters + "…", full name in the tooltip; the name field accepts the Panel 11 limit |
| Page capacity | per SC-20 / Panel 11 §6 (Pro limit during the trial); until the capacity query ships, the existing post-save error |

## 7. Geometry and accessibility (NOT MEASURED)
Header 56, local nav 240, cards 226 + 16 gap, preview fills the work area; ≤1280 local nav collapses to a Show dropdown in the header. Each card is a group (not a button containing buttons): a **Preview** button whose accessible name is "{name}, {N} sections, {Built-in|Saved}{, Pro}{, applied}" and, in Replacing mode, a separate "Use for {page}" button. Thumbnail iframes are `inert` and `aria-hidden`. The preview iframe has `title="{name} preview"`; the device switch is a `radiogroup`. Toasts with Undo stay ≥ 8 s and pause on hover/focus. Search announces result counts politely. Focus: entering → search field; preview → its primary; Back restores focus to the card that opened the preview.

## 8. Preservation map
| Today | Target | Disposition |
|---|---|---|
| TP-01 full-screen portal | area in the shell | Change |
| TP-02 doors (8) | one request contract; empty-canvas cards open previews | Keep + Fix |
| TP-03 built-in + saved catalogue | same data; search + Show filter; category rule | Keep + Change |
| TP-04 per-template list in left nav | Show filter + Recent (NEW) | Change |
| TP-04 left-list help text + site name | mode bar / Replace confirm; header subtitle | Move |
| TP-05 cards, APPLIED badge, "Use for {page}" | kept | Keep |
| TP-06 preview, devices, Used on | kept; actions in header | Keep |
| TP-07 create confirm | removed after T-4 ships (Undo instead); kept until then | Change (conditional) |
| TP-07 "Page created" Done / Open page settings | toast with Undo + "Page settings" action (confirm stays until T-4) | Change |
| TP-08 replace + backup + failure modal + Undo | kept | Keep |
| TP-09 apply effects (no Brand/CMS writes) | kept | Keep |
| TP-10 timeout / false message / second page | fixed | Fix |
| TP-11 after-click role toast | disabled with reason | Fix |
| TP-12 Pro gate | kept, keyed on the effective plan (trial = Pro, SC-20); SC-18 copy | Keep + Fix |
| ⟳ Reload catalogue | header ⋯ | Move |
| ⌘K Save page as template | kept + Pages row door; name + description kept | Keep *(R-1018)* |
| Replace confirm | consequence confirm (SC-15 class b, S2) | Keep (classified) *(R-1018)* |
| Offline apply (assumed to work) | disabled "Needs a connection" (Panel 22) | Change *(R-1018)* |
| "Connect to tokens" toast after a raw-value template (INV 15.4) | "Connect to Brand colors ›" → Panel 09 §7 Connect subtask (interim, N7) | Keep + Change (copy, owner) *(R-1018)* |
| Built-in templates with literal colors (incl. purple) | re-authored on Brand tokens, no purple (T-6) | Change (content) *(R-1018)* |
No capability removed.

## 9. Engineering dependencies (add to SC-9)
| ID | Dependency | Fallback |
|---|---|---|
| T-1 | create-page + import as one operation (page removed on import failure) | truthful "empty page was created — Delete / Try again into it" |
| T-2 | operation id for apply; real completion signal | ref guard; "couldn't confirm the result" after 60 s |
| T-3 | rename via `userTemplates.upsert` (delete already exists) | Rename hidden |
| T-7 *(R-1018b, owner Q16)* | saved-template soft delete + 30-day Templates › Recently deleted (`UserTemplate` has no `deletedAt`) — = Panel 24 U-9, SC-9 "Recently deleted" row | Undo toast through a client grace period before the server delete *(DS)*; no Recently deleted entry |
| T-4 | create-page undo incl. nav entry + capacity slot | create confirm stays |
| T-5 | Figma board 4418:54134 updated for the in-shell area | — |
| T-6 *(R-1018, N7)* | re-author the 10 built-in templates on Brand tokens, no purple/violet/indigo (content) | interim "Connect to Brand colors" offer (§5.7) |
| ⛔ P-TRIAL *(R-1018, D3-18)* | (existing, SC-20) effective-plan resolver + `trialEndsAt` (Panel 23) | Pro chip without trial copy; **T-TP-13 BLOCKED** |
| — | rewrite `TemplatesTab.ia.test.tsx` (search allowed); delete the unused state machine + its integration test (TP-17) | — |

## 10. Acceptance (specified, NOT RUN)
| ID | Case |
|---|---|
| T-TP-01 | Open from Pages → New page "About" → From template → mode bar "Creating 'About'"; Create page → Editor on About; before T-4 a confirm precedes it and the toast has no Undo; after T-4 no confirm and the toast's Undo deletes About and its nav entry |
| T-TP-02 | Pages footer "From template" and the New page modal path both land in Creating mode; Back → Pages |
| T-TP-03 | Empty canvas card "Portfolio" opens Portfolio's preview with "Replacing {page}" |
| T-TP-04 | Add door → "‹ Back to Add" restores Add's query and scroll |
| T-TP-05 | Topbar, rail and bottom bar visible in Templates; no rail item active |
| T-TP-06 | Search "port" shows Portfolio; "zzz" shows the no-match state; Esc clears search; Esc again blurs the field (SC-2) |
| T-TP-07 | Import failure in create mode never leaves "nothing was changed" next to a new empty page; Try again never creates a second page |
| T-TP-08 | EDITOR can Create and Replace; VIEWER sees both disabled with "Create page needs Editor access" / "Replace page needs Editor access" before any click *(R-1018)* |
| T-TP-09 | A token-using template shows "Uses your brand colors" in card tooltip, preview and Replace confirm *(R-1018)* |
| T-TP-10 | Rename and delete a saved template; delete shows no dialog and the toast "{Name} deleted · Undo · Recently deleted ›"; Undo brings it back; after T-7 it is listed in Templates › Recently deleted and Restore keeps its ID *(R-1018b — Q16)* |
| T-TP-11 | Applying a template does not end onboarding; the first-run checklist step is checked |
| T-TP-12 | Apply taking > 15 s shows "Taking longer than usual…", not a failure |
| T-TP-13 | **BLOCKED by P-TRIAL** *(R-1018)*. In the Pro trial a Pro template is usable with "Pro · included in your trial"; on Free after the trial its preview opens but the primary is "Upgrade to use" / "Ask the workspace owner to upgrade" |
| T-TP-14 | Applying SaaS Landing twice in Creating mode defaults to "SaaS Landing 2"; a duplicate typed name disables Create page with the reason |
| T-TP-15 | Delete the target page in another tab while Replacing → apply refused "The page you were replacing changed"; nothing else replaced |
| T-TP-16 | Backup checkpoint fails → dialog Cancel / Try again / Replace without a backup |
| T-TP-17 | Double-click Create page → one page created |
| T-TP-18 | Saved templates fail to load → "Couldn't load saved templates — Retry"; built-ins still shown |
| T-TP-19 | Preview → Back to templates restores search text, Show filter and scroll (T-IAF06-4) |
| T-TP-20 | Thumbnail render error → card shows "Preview unavailable" |
| T-TP-21 | Unimportable parts listed in the import report with Keep / Undo |
| T-TP-22 | Offline → Create page and Replace page disabled "Needs a connection"; preview and search still work; one polite announcement (Panel 22) (D3-2) *(R-1018)* |
| T-TP-23 | Replace a non-empty page → consequence confirm with Cancel as default, element count and Brand line; empty page applies directly (S2) *(R-1018)* |
| T-TP-24 | Apply a literal-color built-in → toast "… uses its own colors · Connect to Brand colors ›" → opens Panel 09 Connect subtask scoped to that page; Back returns to the page. After T-6 no built-in shows purple and none triggers the offer (N7) *(R-1018)* |
| T-TP-25 | A 120-character template name wraps to 2 lines + ellipsis on the card with the full name in the tooltip; a long page name truncates in the mode bar and toast (long names) *(R-1018)* |

## 11. Code defects found (engineering, not design)
1. Create-mode failure message false; Retry creates a second page (`TemplatesTab.tsx:337,631`; `TemplatesTabModals.tsx:250`).
2. Timeout auto-fails while the apply continues (`useTemplateApply.ts:78-87`).
3. Brand copy contradiction + stale comment (`TemplatesTabModals.tsx:95-115`; `TemplatePreview.tsx:85`); brandCopy test checks the wrong token prefix.
4. Applying any template dismisses onboarding permanently (`templatesStorage.ts:14-19`).
5. Unused apply state machine + test that covers only it (`useTemplateApply`, `TemplatesTab.integration.test.ts:47-86`).
6. `SITE_TEMPLATES` holds page templates (naming).
7. Pro gate keyed on `starter` tier while the comment says FREE (`TemplatesTab.tsx:154-157`) — must be replaced by the SC-20 effective-plan resolver (Free = locked, trial/Pro = open).
8. `replaceCurrentPage` silently falls back to `SITE_TEMPLATES[0]` when the template id is missing (`TemplatesTab.tsx:~189`) — would apply a template the user didn't choose.

## 12. Review and not verified
Independent review: pass 1 PROPOSAL (B1–B4, N1–N16), fixed 2026-10-17; 19 of 22 citations confirmed, 3 corrected (TP-13, Recent, userTemplates.delete). Not verified: runtime, thumbnail render cost with 12+ iframes, preview at Tablet/Mobile, whether `starter` = FREE, dashboard site-template interplay.
