# Editor redesign plan — match the m-editor wireframe, surface by surface

**Status:** ✅ COMPLETE (all 6 phases shipped 2026-06-20) · **Owner:** solo · **Updated:** 2026-06-20

> **Done 2026-06-20** — Phases 1–6 all shipped to `main` + live-verified in the browser:
> P1 `4dc95682` (offline≠"Save failed") · P2 `c09b0802`+`9e826a17` (clean resting canvas + drop parent-highlight) ·
> P3 `43bc6a07` (hide DOM jargon, plain labels, reach copy) · P5 `4be2d9f3` (real `site › page` breadcrumb) ·
> P6 `27f38be1` (calm first load — onboarding pill) · P4 `791d5761` (Insert) `f5a798cc` (Pages search-listings)
> `f5f35590` (Structure popover) `0becdfc7` (Styles shared-theme home).
> **Deferred follow-ups** (noted in commits): Insert Blocks/Templates IA merge; a wide SEO view for the Pages
> table (the 5-col table scrolls in the 340px rail); full editor-side `sharedTheme` sync (currently a link-out);
> inspector body job-grouping (P3 finding 3 — `Look/Layout/Effects` is the interim).

## What this is
The editor's features are strong but the *product design* still reads as old/incoherent (founder call + [codex review](../reviews/) + heuristic audit, 2026-06-20). This plan turns "redesign the whole editor" into a safe, ordered sequence of single-surface passes that each end green.

## Principles (read before touching anything)
1. **The target already exists — implement it, don't reinvent.** Canonical design = `docs/reviews/prototype/m-editor.html` + `50–59`, `41`, `ds2`, `60`. Keep it open while building (`python3 -m http.server 8139` in `docs/reviews/prototype/`).
2. **Chrome only — never the engine.** Redesign is React UI under `packages/editor/src/editor/{shell,inspector,sidebar,rail,canvas}`. The Composer + `engine/` stay untouched. This is what keeps a 5,759-test editor safe.
3. **One surface per pass, ranked by severity.** No big-bang rewrite. Each pass = the loop below, then commit.
4. **The loop:** `read prototype → heuristic audit (finding + severity) → implement → live-verify in browser → commit`.
5. **Vocabulary = the 10 usability heuristics** (`docs/learning/product-design/reference/heuristics-cheatsheet.html`). Every finding cites the rule it breaks + a 0–4 severity. No "feels weird."

## Severity key
`0` not-a-problem · `1` cosmetic · `2` minor · `3` major (fix) · `4` catastrophe (fix before anything else).

## Already done (redesign pass 1, shipped 2026-06-20)
- Inspector header → "YOU ARE EDITING / this <element>"; 3-reach cards + "just this by default"; tabs `Look/Layout/Effects`; section titles `Text`/`Colors`.
- Topbar → `‹ Exit`, `project › page` breadcrumb, `Client view` toggle.
Commits `7634a570`→`82bc794e`. These set the pattern; the rest of this plan finishes the job.

---

## Phase 1 — States (save / offline / conflict) — DO FIRST
**Prototype:** `60-save-states.html` (Saved · Saving… · Offline · Reconnecting · Save failed lifecycle).
**Files:** `shell/Topbar.tsx` (renderSavedLabel ~303), `shell/StudioHeader.tsx`, `shared/hooks/useSaveIndicator.ts`, `shell/AquibraStudio.tsx` (isOffline wiring).

| Finding | Heuristic | Sev | Fix |
|---|---|---|---|
| Topbar shows red **`Save failed`** while footer shows **`Offline`** — contradictory, scary. Offline-queued copy isn't reaching the topbar. | Visibility of status (#1) + Consistency (#4) | **4** | Offline overrides every other status → `Offline — changes queued, will sync`. Never "Save failed" for an offline save. Trace why `isOffline` precedence isn't winning (likely the save error fires + sets status before the offline flag). |
| No `Reconnecting → flushing queue` step; jumps offline→saved. | Visibility of status (#1) | 2 | Add a brief "Reconnecting…" state on `online` before "Saved". |
| Save-failed has Retry only, no "download a backup" escape. | Recover from errors (#9) | 2 | Add "Save a backup" on the failed state (reuse the conflict-modal backup download). |

**Acceptance:** go offline in devtools → topbar reads "Offline — changes queued", footer agrees, no red "failed". Reconnect → "Reconnecting…" → "Saved". One status, one truth.

---

## Phase 2 — Canvas chrome (selection, guides, toolbars)
**Prototype:** m-editor canvas — clean resting state, chrome only on the selected element.
**Files:** `canvas/` (selection overlay, guides), the floating element toolbar, `shell/StudioFooter.tsx` (breadcrumb).

| Finding | Heuristic | Sev | Fix |
|---|---|---|---|
| Every element outlined with dashed-blue guides at rest — page reads as a blueprint. | Aesthetic & minimalist (#8) | **3** | Guides only for the selected element + parent-on-hover. Resting canvas = clean. |
| Two/three selection toolbars stack (`↑ Parent: Container` pill + floating `Paragraph ▾` bar + handles). | Aesthetic (#8) | 2 | One toolbar. Fold "Parent" into the existing bottom breadcrumb (`Canvas › Container › Paragraph`). |
| Selection chrome overlaps the element text (toolbar covers content). | Aesthetic (#8) | 2 | Position toolbar to never occlude the selected content. |

**Acceptance:** empty-selection canvas has zero guide noise; selecting one element shows exactly one toolbar + one outline.

---

## Phase 3 — Inspector body (finish what pass 1 started)
**Prototype:** `59-inspector.html`, `41-scope-picker.html`.
**Files:** `inspector/ProInspector.tsx` (269–350 breadcrumb), `inspector/tabs/InspectorTabContent.tsx`, `inspector/sections/registry/*`, `config/elementProfiles.ts`, `components/InspectorTabs.tsx`.

| Finding | Heuristic | Sev | Fix |
|---|---|---|---|
| `div / p` tag.class breadcrumb still sits ABOVE "You are editing" — engineer jargon on top of the human header. | Match real world (#2) | 3 | Hide the tag breadcrumb in Simple/Client density; keep behind a dev toggle. |
| Reach confirm panel sits open + reads "Apply to all **1** paragraphs". | Match real world (#2) + Aesthetic (#8) | 3 | Confirm only after "All like this" is picked; copy = "Apply to N other <type>s". |
| Body still tab-bucketed by CSS axis, not the prototype's single job-grouped scroll (Text → Size & spacing → Colors & font → More). | Consistency (#4) | 2 | Bigger rebuild: add a grouping layer in `elementProfiles.ts` (content / size-spacing / colors-font / more), keep the section components. Optional — `Look/Layout/Effects` is an acceptable interim. |
| Control labels still abbreviated CSS (`Line H`, `Letter Sp`, `W`, `H`, `Row Gap`). | Match real world (#2) | 2 | Plain labels: `Line height`, `Letter spacing`, `Width`, etc. |

**Acceptance:** Simple density shows no tag.class, plain labels, reach confirm appears only on demand.

---

## Phase 4 — Rail + panels (Insert / Pages / Styles / Site)
**Prototype:** `52-add` (Insert: "Describe or search to insert… /", Blocks/Templates/Components, *AI is NOT here*), `50-pages` (Pages + search-listings table: Title/Description/Index/Status per page), `ds2-styles` (Everyday styling: Brand swatches & fonts → full tokens, Open Styles / Open Shared theme), `53-settings` (Editor›Site: Search listing · Tracking · Forms config, each `Edit ▾`), `51-layers` (Structure = floating popover from footer ⌗).
**Files:** `sidebar/LeftSidebar.tsx`, `sidebar/tabs/{build,pages,settings}/*`, `design-system/ui/DesignSystemTab.tsx`, `shell/StudioFooter.tsx`.

| Finding | Heuristic | Sev | Fix |
|---|---|---|---|
| Insert panel titled "Add", placeholder "Search blocks", no Blocks/Templates segment, no inline "Your components". | Consistency (#4) | 2 | Title "Insert"; placeholder "Describe or search to insert… /"; Blocks/Templates seg + Components. |
| Pages panel has no per-page **search-listing** row (Title/Description/Index/Status). | Recognition (#6) | 2 | Add the search-listings table per `50-pages`. |
| Styles tab is site-local only — no "this site syncs from workspace theme / override" state. | Match real world (#2) | 2 | Add the workspace-sync panel (Open Styles / Open Shared theme) per `ds2`. |
| Structure opens a left drawer, not the prototype's floating popover from the footer ⌗. | Consistency (#4) | 2 | Footer ⌗ → floating popover over canvas, closes on outside-click. |

**Acceptance:** each rail tool's panel matches its prototype screen's structure + copy.

---

## Phase 5 — Topbar data (finish the breadcrumb)
**Prototype:** m-editor topbar — `‹ Exit  Northwind › Acme › acme-main › Home`.
**Files:** `shell/Topbar.tsx` (title 405), `shell/StudioHeader.tsx` (253 — doesn't pass project/page yet), `services/BuildrikSyncProvider.ts` (loadProject returns site name).

| Finding | Heuristic | Sev | Fix |
|---|---|---|---|
| Breadcrumb is hard-coded `My project › Home`, not real agency›client›site›page. | Match real world (#2) | 2 | Thread real data: `agencyName`/`clientName`/`siteName`/`pageName` props; StudioHeader passes site name (from loadProject) + active page name (from composer). |
| `+ Invite` is still first-class chrome; prototype demotes it. | Aesthetic (#8) | 1 | Move Invite into an overflow/secondary spot. |

**Acceptance:** topbar shows the real site + current page name; widens to client/agency when that data is loaded.

---

## Phase 6 — Density & onboarding clutter
**Prototype:** m-editor — one calm surface; onboarding is not four competing badges.
**Files:** onboarding checklist, `3 Issues` pill, `Pro tips` carousel, Get-started panel.

| Finding | Heuristic | Sev | Fix |
|---|---|---|---|
| On load: `3 Issues` (red) + `0/7 done` float + `Pro tips` carousel + Get-started all compete with the canvas. | Aesthetic & minimalist (#8) | 2 | One onboarding surface at a time. "Issues" must not read as an error (red) on an empty draft — neutral until there's a real issue. |
| Density is one-size; power users + clients get the same wall. | Flexibility & efficiency (#7) | 2 | Honor `editorDensity` (Simple/Advanced) — already wired; make sure Simple actually hides advanced controls + chrome. |

**Acceptance:** first editor load is calm — canvas is the hero, at most one onboarding nudge.

---

## Sequencing & risk
- Order = severity-first: **Phase 1 (sev 4) → 2 → 3 → rest.** Phases are independent; can reorder 4/5/6 by taste.
- Each phase ships its own commit(s) + a browser screenshot proof. Re-run `npx tsc --noEmit` (editor) + the touched test dirs before each commit.
- **Out of scope:** the Composer/engine, the publish pipeline, anything in `engine/`. If a redesign seems to need an engine change, stop and flag it — it's a separate arc.
- Gate-24 (no inline `<button>/<input>` in chrome) + DESIGN.md (cobalt only, no purple) apply to every pass.

## How we'll work
One phase per session. I implement → live-verify → commit → show you the before/after. You course-correct between phases. We start at Phase 1 (the `Save failed` bug — small, high-impact, and it teaches the whole loop).
