# Panel 09 — Brand area: functionality specification (FD-PNL-09)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by ⛔ U-1 (document Undo/Redo in the Brand header — interim guard per SC-9) and ⛔ From-logo-or-URL flag decoupling (P3, §7) · not VERIFIED** *(R-1018: "blocked by" added — D2-2)* (independent `design-qa-critic` review: pass 1 PROPOSAL with 4 blocking, pass 2 two one-line fixes applied). Runtime NOT RUN; geometry NOT MEASURED. *(DS)* = designer-selected under owner standing instruction "apply recommended answers" (2026-10-17). Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): P3, P7, N7, N8, V2, V4, V5, V6, V8; gap rows D2-2, D2-19, D2-20, D2-26, D3-10, T1-30, T6-2, T6-8, T6-12, T6-13, T6-14, T6-15, T6-17, T6-20, T6-22, T7-22, T7-23, CS-14, CS-21; INTERACTION_AND_STATE_MATRIX §3 (loading, offline, apply failure). Round 2: Q3, Q6 (pointer), Q9, Q15 *(R-1018b)*.

**No AI in this version (owner 2026-10-17, Panel 00 SC-21):** every AI entry point in this panel is hidden; AI text below is kept for the later AI Build tab; backend unchanged. **"From logo or URL" is NOT an AI entry point** (deterministic color/font extraction, Panel 20 §1) and **ships in this version** (owner P3, 2026-10-18) — it is removed from every AI list in this panel. *(R-1018)*

Visual: DS §2 (header ladder V6 — area title 20/30/600, section 12/16/600 sentence case; info/EditLock banners neutral grey + icon, V2; menus/popovers `shadow-drag`, V4; motion 100/160/240 only, V5). *(R-1018)*

Governing IA: BD-01 (Brand visible in rail), IA-01, IA-02 (Brand shares document Undo; **visible Undo/Redo in Brand's header**), GEO-01 (resource nav 240), IAF-10 (A–M), Panel 02 (rail; Brand disabled for viewers), Panel 06 (Inspector → token → Back), Panel 08 §7 (site fonts). Owner Brand interview 2026-10-05 (full DS, panel + canvas, autosave, Light/Dark, two layers). Site-builder tokens only — **never** the editor chrome `--bk-*` system.

---

## 1. Purpose and boundary

Brand answers: **define my site's look once — colors, type, spacing and the rest — and see exactly what each change touches.**

Job: J1 Build (supporting: keep the site consistent — 00-STRATEGY §3) *(R-1018)*

UI copy uses US spelling (SC-11): **Colors**, **Color mode**; "colour" in as-built rows below quotes today's code only. *(R-1018 — D2-26, T6-8, CS-14)*

| In Brand | Not here (owner) |
|---|---|
| 14 token kinds, aliases, type styles, classes (definitions), Dark mode setting + per-token dark values, checks, starters, import/export, restore points, live preview, usage | Applying a token/class to an element → **Inspector**; font files → **Assets › Fonts**; main components → **Components** (Panel 13); editor chrome tokens → not user-facing |

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)

Files: `src/editor/design-system/ui/BrandWorkspace.tsx` (BW), `ui/sections/*` (TokenDetailView, TypographySection, ReusableStylesSection, StylesSection/StylesRouter/PresetDetailPane, ClassesSection/ClassAddDialog, DarkModeCard, ColourModeSection, StartersSection, ImportCard, ExportSection, BrandFromSource, ScaleGenerator, ConnectTokensCheck, UsageHighlight, Token*Dialog), `ui/tokens/*`, `ui/colors/*`, `ui/BrandLivePreview.tsx`, `ui/ColorModeToggle.tsx`, `ui/SessionEditsPopover.tsx`, `state/*` (useProjectTokens, useApplyStarter, useImportTokens, useSessionEdits, useBrandRestorePoints, useTokenUsageMap), `starters/*` (6), `sidebar/FullPageRouter.tsx:186-201`; engine `Composer.ts:283-323`; server `theme.ts`, `theme.service.ts`, `brand-tokens.ts`, `brand-extract.service.ts`.

| ID | Capability | Today |
|---|---|---|
| BR-01 | Entry | Rail Brand (B) → full-screen Portal (`fixed inset-0`, no `inert` behind, no `data-bk-surface`); deep links via `brandOpenRequest` / `initialPage` |
| BR-02 | Nav | 256w, flat 11 rows: Colours, Colour mode, Fonts & type styles, Styles, Component styles, Classes, Presets, Brand checks, Starters, Spacing, Import / export; counts on Colours and Brand checks; head "Back to canvas" + H1 + site name. Pages without rows: connect, brand-from-source, scale, restore-points. **11 other token kinds only via a "Token kind" select in the Spacing header** |
| BR-03 | Header | (all pages except Import/export, which has no header — `isPanelPage`, BW:925,978) title + caption, **Review changes** popover, **Restore points**, page action (+ Add token / ✦ Generate with AI / + Add class / Run checks / kind select + ⋯ spacing presets / + Add a font). **No Undo/Redo buttons** (⌘Z only) |
| BR-04 | Token kinds | 14 registries. Colour: card with Light picker and a Dark text field (`TokenDetailView.tsx:543-586`); the **Colour mode page already edits dark values with a `ColorPicker` + dark-shade suggestions** (`ColourModeSection.tsx:132`) and a paired light → dark overview (`:201-214`); only semantic tokens take a dark value (`:60`, `TokenDetailView.tsx:238`); rename/delete/reset, Generate scale. Beginner/pro colour filtering exists (BW:265,409), forced to Pro. Type (family, size): FontFamilyPicker / text; rename+delete disabled. Spacing: text + Compact/Normal/Spacious + Reset; no delete/rename. Radius, Shadow, Motion, Border, Opacity, Z-index, Breakpoint, Grid, Sizing, Icon, Imagery: generic text + add/rename/delete |
| BR-05 | Styles / Presets / Classes | type styles read-only list; presets read-only catalogue; classes list + add dialog |
| BR-06 | Starters | 6 starters, **apply on click, no preview, no restore point**; five are **named after real brands** ("Stripe Blue", "Notion Warm", "Apple Minimal", "Linear Dark", "Vercel Mono" — `starters/*.ts`) and two carry **indigo/violet primaries** (INV L4-028) *(R-1018 — T6-14)* |
| BR-07 | Import / Export | Import JSON: **already parses then shows Detected / Valid / Errors / Conflicts and offers "Apply N valid only" + Cancel** (`ImportCard.tsx:2-9`); modes Replace / Merge (keep mine) (`:34-41`); Export CSS / JSON / Tailwind (Copy, Download), 760 panel |
| BR-08 | AI | "✦ Generate with AI" modal **has no Accept** (`dsAi`) |
| BR-08b | From logo or URL (not AI) | Deterministic color/font extraction (`brand-extract.service.ts`, "No AI (OQ-9)"; logo decoded in the browser, never uploaded); EDITOR, rate-limited; **today shares the `dsAi` flag** — client `dsAi` and server `theme.extractBrandFromUrl` refuse `NOT_FOUND` unless `NEXT_PUBLIC_FEATURE_DS_AI` is `"true"` (`server/trpc/routers/theme.ts:219`) *(R-1018 — split from BR-08, D3-10 / T7-22)* |
| BR-09 | Light/Dark | Dark mode Off/Auto saved (Auto fills missing dark values after restore point, one transaction); per-token dark values (Colour mode page); session preview toggle (not saved) |
| BR-10 | Usage | "Used by N" + element list, "Aliased by", highlight in live preview; impact side card for scale, Dark Auto, from-source, Connect, delete; **not for plain edits, starters, import** |
| BR-11 | Save | autosave, nothing staged; each edit = one transaction in the shared canvas history; refusal if read-only/invalid/removing used token; debounce 1000ms; Review changes / Revert; server restore points |
| BR-12 | Flags/roles | `BRAND_TOKENS_V2` (+ workspace list) gates migration/read-only (`EditLock` fieldset + banner reasons switch_off / held / failed); restore points & extract EDITOR; no viewer gating in UI (rail blocks viewers) |
| BR-13 | States | empty first run "No brand set."; read-only banner; load error; usage unknown; from-source loading/timeout/refused; migration progress modal |
| BR-14 | Geometry | nav 256; main px-8; header 30h; title 700w; preview column 468; rows 32 nav / 40 token |
| BR-15 | Keyboard | **Esc leaves Brand** (window capture, skips menus/inputs); token table one Tab stop + arrows; preview toggle tablist |
| BR-16 | Copy drift | "Edits stay in the draft until you Save", "Save to draft", "DRAFT brand… staged" — contradict autosave |

Tests: 88 design-system files / ~646 cases; server theme ~57; e2e `brand-tokens.spec.ts` 11.

## 3. Problems this design solves
1. **Flat 11-row nav** mixes tokens, catalogues and tools; 11 kinds hidden behind a select on the Spacing page.
2. **No visible Undo/Redo** although every edit is a shared-history transaction (IA-02 requires it in Brand's header).
3. **Starters apply without preview or restore point; import shows counts but no restore point and no preview of the result** (IAF-10 G).
4. **AI Generate result can't be kept** (no Accept).
5. **Dark values have two editors with different controls** (picker + suggestions on Colour mode, plain text on the card).
6. **"Draft/Save" copy** contradicts autosave → users wait for a Save that never comes.
7. Esc leaves the workspace (inconsistent with other workspaces); no `inert`.

## 4. Target layout

```
rail │ BRAND NAV (240)              │ BODY (flex)                                   │ LIVE PREVIEW (468 fixed → min 360; hidden <1280, §8)
     │ ‹ Back to Editor · Home      │ Colors · 18 tokens  ↶ ↷  Review(3)  Restore ⌄  │ [Light | Dark]  page preview
     │ TOKENS                       │ [+ Add color]  [Generate scale]                │ with usage highlight
     │   Colors             18      │  ■ primary      #1A56DB  · Used by 42        │
     │   Typography                 │  ■ surface      #FFFFFF  · Used by 12        │
     │   Spacing                    │  …                                            │
     │   Other kinds ›              │                                               │
     │ REUSABLE STYLES              │                                               │
     │   Type styles · Presets      │                                               │
     │   Classes                    │                                               │
     │ TOOLS                        │                                               │
     │   Dark mode                  │                                               │
     │   Checks             2       │                                               │
     │   Starters                   │                                               │
     │   Import / export            │                                               │
```
(Back slot per Panel 00 SC-1: left end of the 56px work-area header — not in the nav, so it survives the ≤1280 nav collapse.) Sketch position of the back link is illustrative.

### 4.1 Nav regrouping (IAF-10 E) — old → new
| Old row | New home |
|---|---|
| Colors | Tokens › Colors |
| Colour mode (per-token dark values + overview) | Tools › **Dark mode** *(R-1018: UI label never "Colour mode"; US spelling)*: setting (Off/Auto) + the existing **paired light → dark overview** with picker and dark-shade suggestions. Colour cards for **semantic** tokens show the dark value with the **same picker + suggestions**; primitive cards show "Dark: via alias" (no picker). One write op for both (§6) |
| Fonts & type styles | Tokens › Typography (families and **Font-size tokens** — this page owns font-size tokens; **type styles are no longer listed here** — they live in Reusable styles, which owns type styles) *(R-1018 — T6-2, T6-17: noun "Font-size token" per SC-11/CS-14)* — "**Manage site fonts ›**" (replaces "+ Add a font") → **Assets › Fonts** door with return (Panel 08 §7) |
| Spacing (+ kind select for 11 kinds) | Tokens › Spacing; **Tokens › Other kinds** row opens a sub-list: Radius, Shadow, Motion, Border, Opacity, Z-index, Breakpoint, Grid, Sizing, Icon, Imagery (each its own page; kind select retired) |
| Styles (type styles, read-only) + Presets (read-only) | Reusable styles › **Type styles · Presets** (one page, two sections, labelled "Read-only catalogue" where they are). Read-only catalogue rows (incl. preset binding rows) are **non-interactive**: no hover fill, no pointer cursor, no chevron *(R-1018 — T6-20)* |
| Classes | Reusable styles › Classes |
| Component styles | Removed as a Brand page; its content becomes a **"Browse section blocks in Add ›"** link on Type styles · Presets (IAF-10 E — never main-component management) |
| Brand checks | Tools › Checks (count kept) |
| Starters | Tools › Starters |
| Import / export | Tools › Import / export |
| Hidden pages: Connect, Brand from logo/URL, Scale, Restore points | Bounded subtasks opened from their actions (Connect from Checks **and from the post-template "Connect to Brand colors" entry, §7** *(R-1018)*; From logo or URL from Starters (ships, not AI — P3 *(R-1018)*); Scale from Colors; Restore points from header) with **exact return** to the invoking page |

Counts stay on Colors and Checks only (avoid badge noise). *(R-1018 — US spelling)*

## 5. Header (every Brand page)
`{Page title} · {count}` · **↶ Undo · ↷ Redo** (NEW visible; same shared document history as canvas — IA-02; tooltip names the last action where labelled; **disabled** when the stack is empty or the site is read-only, with reason; restoring a restore point is one Undo unit; **until ⛔ U-1 ships, the interim guard of SC-9 applies** *(R-1018 — D2-2)*) · **Review changes (N)** (existing popover, Revert per change) · **Restore points ⌄** (existing) · page primary action. Header **56 minimum**, grows with enlarged text (GEO-01 area header; as-built 30 → **Change**); title 20/30/600 (V6, DS §2.3) *(R-1018)*. **Import/export gains this header (NEW)** so Undo/Redo is available there too. **✦ Generate with AI** (dsAi) sits on Reusable styles › Type styles · Presets (today on Styles and Component styles) — hidden in this version (SC-21).

## 6. Token editing contracts

| Kind | Control (target) | Rules |
|---|---|---|
| Color | Card: name, **Light** picker, **Dark** (semantic tokens only: same picker + dark-shade suggestions as Dark mode tool — *NEW on the card*; primitives: "Dark: via alias"), alias source, Used by N + list, Aliased by; menu Rename / Delete / Reset to seed | **One write op for dark values from either surface:** `store.commit(setTokenLiteral(…, "dark"))`, history label "Set dark value". Live applied on commit (picker close / Enter); one transaction each; invalid hex stays local draft with error; alias must be same kind, no cycles |
| Typography | Family (FontFamilyPicker incl. site fonts), **Font-size tokens** (size scale) *(R-1018 — T6-2)* | Rename/delete disabled (existing) with reason "Core type tokens can't be removed" |
| Spacing | Value field per step + presets Compact / Normal / Spacious + Reset to defaults | No delete/rename (existing) |
| Other 11 kinds | Generic value field with the kind's validator, add / rename / delete | No new dedicated editors promised (IAF-10 M) |
| Delete (any deletable) | Existing dialog: replace-before-delete with compatible token; blocks while usage unknown (Retry) | One transaction |

**Before editing a widely used token** *(DS, NEW; threshold N > 20 is a designer choice)*: the card always shows "Used by N" (N = direct uses **plus uses through aliases**); when N > 20 the first edit in a session shows an inline note "This changes 42 places across the site" (no modal — live model kept). Usage unknown → note shows "Can't count right now" instead.

## 7. Tools

| Tool | Contract |
|---|---|
| **Dark mode** | Off / Auto (existing). Auto: impact card (missing dark values to be created) → restore point → one transaction (existing). Paired light → dark overview with picker + dark-shade suggestions (existing, moved here); rows missing a dark value are flagged "No dark value" and edited with the same picker |
| **Checks** | Run checks (existing) → findings with Fix actions; Connect-to-tokens subtask (existing) — **Apply writes a restore point "Before connect" first** (owner Q9 *(R-1018b)*; same rule as starters: server restore point if available, offline/standalone → the §7 local-recovery notice), then one transaction, one Undo. **Page anatomy (existing, INV 1829–1832 — documented, not new)** *(R-1018 — T6-13)*: rules list; each finding row has **Open** (selects the element) and **Fix**, plus **Ignore**; header shows the ignored count with a way to show and restore ignored findings; no findings → "Nothing to fix" |
| **Starters** (Fix, IAF-10 G) | Click a starter → **Preview** via the existing preview layer (`composer.designSystem.setPreview`, BW:287-317; column renders `canvasPreview?.tokens`, BW:1091) with source "starter" — nothing written → **Apply** creates a server restore point first (if available) → one transaction → one Undo. Offline/standalone: notice "Local recovery only; no server restore point" + Apply with local Undo, or Cancel; failed local checkpoint blocks Apply. **Names and colors (owner N8, 2026-10-18)** *(R-1018 — T6-14)*: the five starters named after real brands get **generic descriptive names** — e.g. "Fintech calm" (**placeholder, final names go to copy review**); every starter primary/accent passes the banned-hue rule (no indigo/violet/purple — DESIGN.md), so the two violet primaries are recolored; the user-facing list never shows a third-party brand name. **From logo or URL** lives here as a starter source — **ships in this version, not AI** (owner P3; never labelled ✦; no AI limit) *(R-1018)* |
| **Import / export** | **Keep + extend** the existing inline Import card: parse → existing Detected / Valid / Errors / Conflicts → **NEW** dry-run of the merge (`useImportTokens.ts:55-67`) shown as added / modified / skipped / unsupported type+spacing / alias literalised **and previewed in the live preview** (source "import") → **Apply N valid** (restore point first — NEW; one transaction) or Cancel. Modes named per IAF-10 H: **Update matching** (absent tokens retained; = today's Replace) and **Keep existing** (= today's Merge / keep mine). Export CSS / JSON / Tailwind unchanged; Tailwind notes dark-mode loss |
| **✦ Generate with AI** (dsAi) — **hidden in this version (SC-21)** | Result shown as a preview diff → **Apply** = one transaction that is **one step in the shared document Undo** (canvas and Brand header Undo revert it alike; Panel 20 / SC-18) / Discard (Fix: today no Accept) *(amended 2026-10-17 — source: Panel 20 §10.2 / SC-10, SC-21)* |
| **From logo or URL** (not AI — ships this version, owner P3) *(R-1018)* | Opened from Starters (existing BR-08b flow and states: loading / timeout / refused). Result previews through the shared preview layer (source "from logo or URL") → **Apply** = restore point first → one transaction → one Undo, same as a starter. Needs a connection for a URL (disabled "Needs a connection" offline); a logo is decoded in the browser. Never labelled ✦, never counts against AI limits, not listed with AI entries. **⛔ Dependency (engineering):** move it off the `dsAi` flag on both sides — the client door and the server `theme.extractBrandFromUrl` guard (`theme.ts:219`) — onto a flag/config of its own that is on in production; until then it stays hidden with `dsAi` and this row is not met |
| **"Connect to Brand colors" entry (interim, owner N7)** *(R-1018 — T1-30, T6-22)* | Hand-off from Panel 15: after a page template that binds literal colors is applied, Panel 15 owns the trigger and its copy ("Connect to Brand colors"). Brand owns the destination: the action opens **Tools › Checks › Connect** (existing Connect-to-tokens subtask, unchanged scope), with "‹ Back to {page}" return to the Editor. Interim until templates are re-authored on Brand tokens (N7); Connect writes the **"Before connect" restore point first** (Q9 *(R-1018b)*), then one transaction, one Undo |

## 8. Live preview
- **One width rule (owner V8; Panel 09 wins over IAF-10 F "flex")** *(R-1018 — D2-19, T6-12, T7-23)*: the preview is **fixed 468** (as-built); when the work area is too narrow it **shrinks to min 360**; **below 1280 work width it is hidden** and reached by a **Preview** toggle in the header (body full width). No splitter, no 360–520 range. Light/Dark **session** toggle (existing; Dark disabled when Dark mode Off with reason); usage highlight when a token card is focused (existing).
- **Preview layer ownership:** one source at a time (scale, Dark Auto, from-source, Connect, starter, import, AI). While a source holds the layer (`previewLocked`), the Light/Dark toggle is disabled with "Previewing {source}"; starting another preview asks to discard the current one. Leaving the page or Brand **clears the preview and writes nothing**.
- Width budget at 1440: 56 rail + 240 nav + 468 preview + 64 body padding + 32 body–preview gap ≈ 860 → body ≈ 580; when the body would fall below 480, the token detail replaces the list (IAF-10 F). (The <1280 rule is stated once, above.) *(R-1018 — D2-19 duplicate removed)*

## 9. Save, history, copy
- Model unchanged: **autosave**, each edit one shared-history transaction, no Save button (IAF-10 I).
- **Copy fix (BR-16):** "Edits stay in the draft until you Save" → "Changes apply as you edit — undo any time"; "Save to draft" → "Add token"; preview comment/labels drop "draft". Bottom-bar status shows "Brand changes applied locally" until the document save receipt, then "Brand changes saved" (Panel 00 SC-4; per-owner row depends on the receipt registry, SC-9).
- **Leave guard** *(R-1018b, owner Q3; resolves T1-02)*: leaving Brand (rail, "‹ Back to …", area change, Exit) shows **no dialog while Brand changes are saved**; only **while a Brand save is pending or failed** it shows the SC-24 Brand form — "Leave without saving?" · **Keep editing** (default) · **Save and leave** (flush/retry, 3 s; failure stays in Brand) · **Leave and keep retrying** *(DS)*; offline: no Save and leave. No "Discard changes" (⌘Z undoes Brand steps).
- **Topbar Publish in Brand** *(R-1018b, owner Q15)*: opens the Publish task in this area's tray, in place (SC-7); the preview layer and the open page stay. Brand colors and fonts must render the same on canvas, Preview and the published site (SC-8 render parity, owner Q6).
- Inspector → "Edit token ›" opens the exact token card; **"‹ Back to {element}"** returns to the Inspector row (IAF-10 G, Panel 06).

## 10. States, roles, flags
| Condition | Behaviour |
|---|---|
| Viewer | Rail Brand disabled (Panel 02, unchanged access) |
| Migration / read-only (`BRAND_TOKENS_V2`) | Existing EditLock + banner reasons (switch_off / held / failed) — "held" is not shown as a permission denial (T-IAF10-6); Undo/Redo disabled with reason |
| Empty first run | "No brand set." + Starters + Import (existing) |
| Load error | existing panel error + Retry, worded per DS §3: server "Couldn't load Brand — Retry"; network "You're offline" — never blames the connection for a server error *(R-1018)* |
| Usage unknown | "Can't count right now" + Retry; delete blocked (existing) |
| Restore point unavailable | Starters/import notice per §7 |
| **Loading** *(R-1018 — D2-20)* | nav renders at once; body and preview show the skeleton pattern (rows at token-row height, preview frame grey); header actions and Undo/Redo disabled until tokens load; usage counts show a skeleton until the usage map resolves |
| **Offline** *(R-1018)* | token edits keep working (they are document transactions, kept locally like page edits) and the bottom-bar status reads "Brand changes applied locally" (SC-4); controls that need the server — **Restore points**, From logo or URL (URL), server restore point before a starter/import (→ §7 local-recovery notice), usage map refresh — are disabled with "Needs a connection"; the announcement is Panel 22's one polite announcement |
| **Autosave apply failure** *(R-1018)* | an edit the engine refuses (read-only, invalid value, removing a used token) stays a local draft on the field with its existing error — nothing is written; an applied edit whose **document save** fails stays applied locally (no rollback) and the Brand row of Status details / the bottom-bar status shows "Couldn't save — Retry" (SC-4 Save failed tier, Panel 11 §8); the Brand header shows no separate save state |

## 11. Geometry and keyboard
- rail 56 + nav **240** (GEO-01; as-built 256 → Change) + body flex (title block max 700) + preview per §8 (fixed 468, min 360, hidden <1280) *(R-1018)*; ≤1280 nav collapses to "Brand navigation" overlay; preview → header toggle.
- Workspace is a dedicated surface: editor behind **inert** and not rendered for focus (Fix); `data-bk-surface="fullpage"` added.
- **Esc no longer leaves Brand** *(Change)*, per the shared rule "Escape closes only the topmost cancellable layer" (REMAINING-IA-HANDOFF NAV): Esc closes the open popover / dialog / subtask / preview; with nothing open it is a **no-op**; leaving is via "‹ Back to Editor" or the rail. Same rule in Assets (Panel 08 §10) and CMS (Panel 07 §11).
- Token table: existing one Tab stop + arrows; Enter opens card; ⌘Z/⌘⇧Z work (shared history).

## 12. Preservation map
| Old | New | Disposition |
|---|---|---|
| BR-01 entry | Same + inert + surface attr | Fix |
| BR-02 flat nav, kind select | Grouped nav; Other kinds pages | Redesign |
| BR-03 header | + Undo/Redo buttons; 56 min (Change from 30); Import/export gains header | Keep + NEW |
| BR-04 14 kinds | All kept; dark picker + suggestions on semantic color cards (NEW), one write op | Keep + NEW |
| Colour mode page (picker, suggestions, paired overview) | Tools › Dark mode | Move |
| — (no post-template entry today) | "Connect to Brand colors" entry → Checks › Connect (interim, N7) | NEW *(R-1018)* |
| Beginner/pro color filter (forced Pro) | **Pro everywhere; Beginner path removed** (owner P7) | Remove (dead path) *(R-1018 — T6-15)* |
| BR-05 styles/presets/classes | Reusable styles group; Component styles → Add link | Merge |
| BR-06 starters | Preview → Apply with restore point; generic names + no violet (N8) | Fix *(R-1018)* |
| BR-07 import/export | Existing counts + dry-run detail + live preview + restore point; modes renamed per IAF-10 H; Import/export gains header | Keep + extend |
| BR-08 AI (Generate with AI) | Hidden in this version (SC-21); design kept | Defer |
| BR-08b From logo or URL | Ships this version, not AI; off the `dsAi` flag (⛔ engineering) | Keep + Change *(R-1018 — P3)* |
| BR-09 Light/Dark | Same; dark values on color cards + Dark mode tool | Keep |
| BR-10 usage | Same + large-reach note | Keep + NEW |
| BR-11 save model | Same (autosave) | Keep |
| BR-12/13 flags/states | Same | Keep |
| BR-15 Esc leaves | Esc stays in Brand | Change |
| BR-16 draft copy | Fixed | Fix |
| Hidden subtask pages | Opened from actions with exact return | Keep |

No capability removed (Component styles content is reachable from Add).

## 13. Acceptance (specified, NOT RUN)
| ID | Pass condition |
|---|---|
| T-BR-01 | Nav shows Tokens / Reusable styles / Tools groups; every former page reachable; Other kinds lists 11 kinds |
| T-BR-02 | Change primary color → canvas updates live; header Undo reverts it; canvas ⌘Z after returning also reverts it (one stack) |
| T-BR-03 | Starter: Preview changes only the preview; Cancel leaves tokens unchanged; Apply creates a restore point and one Undo reverts all |
| T-BR-04 | Import JSON shows added/modified/skipped counts that match the applied result; preview shows the result before Apply; Cancel writes nothing |
| T-BR-12 | Edit a semantic token's dark value on its card and in Dark mode → same history label "Set dark value"; primitive card shows "Dark: via alias" |
| T-BR-13 | While a starter preview is active, Light/Dark toggle is disabled with reason; leaving Brand clears the preview with no write |
| T-BR-05 | **Inactive while SC-21 holds** (AI hidden; T-AI-00 asserts no AI door in Brand) — applies when the AI Build tab ships: AI Generate → Apply writes one transaction; Discard writes nothing *(R-1018)* |
| T-BR-06 | Dark value edited with the picker; invalid value stays local with error |
| T-BR-07 | Inspector "Edit token" → card → "‹ Back to Heading" returns to the Inspector row |
| T-BR-08 | Migration held → banner "held", controls disabled, not "permission denied" |
| T-BR-09 | Esc with no popover open does not leave Brand; Back to Editor restores page/selection/breakpoint/zoom |
| T-BR-10 | No "draft"/"Save" wording remains in Brand UI |
| T-BR-11 | Existing ~646 design-system tests and e2e updated with the change, not deleted |
| T-BR-14 | With the AI flag off and production flags, Starters shows **From logo or URL**; a URL extraction previews, Apply creates a restore point and one Undo reverts it; no ✦ label; no AI-limit line; the server route answers with `dsAi` off *(R-1018 — P3; BLOCKED on the flag decoupling)* |
| T-BR-15 | No starter name in the UI is a third-party brand name; no starter primary/accent falls in the banned indigo/violet/purple hues *(R-1018 — N8)* |
| T-BR-16 | Preview is 468 wide at 1440; at narrower work widths ≥1280 it is never below 360; below 1280 it is hidden and the header Preview toggle shows it *(R-1018 — V8)* |
| T-BR-17 | Loading shows the skeleton with Undo/Redo disabled; offline: token edit works and status reads "Brand changes applied locally", Restore points and From logo or URL (URL) are disabled with "Needs a connection"; failed document save → "Couldn't save — Retry" in status with the edit kept *(R-1018)* |
| T-BR-18 | Apply a page template with literal colors → Panel 15's "Connect to Brand colors" action opens Checks › Connect; "‹ Back to {page}" returns to the Editor *(R-1018 — N7)* |
| T-BR-19 *(R-1018b, Q3, Q9)* | Saved Brand edit → rail click leaves with no dialog; with the save failed (network blocked) → "Leave without saving?" with Keep editing focused, Save and leave, Leave and keep retrying. Connect Apply → Restore points lists "Before connect" and one Undo reverts the connect |

## 14. Review and not verified
Independent `design-qa-critic` review done (see Status line; this footer was stale until 2026-10-17). Not verified: runtime, restore point availability offline, final starter names (copy review), From-logo-or-URL flag decoupling, live preview performance with large token sets, measured geometry.
