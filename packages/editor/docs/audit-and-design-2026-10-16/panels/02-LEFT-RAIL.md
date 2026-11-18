# Panel 02 — Left rail: functionality specification (FD-PNL-02)

> **BD-25 — compact Pages width, 2026-10-18:** normal Pages/Structure/rename/recovery manager is284px, matching Add/Layers. Rail56px + panel284px =340px. Supersedes earlier560px normal manager width; expanded Listings remains720px. See the canonical brief and `pages-compact-width.md` evidence.

> **BD-24 — latest owner correction, 2026-10-18:** Pages management is in the left rail after Layers. The bottom bar contains created-page tabs and save status. This overrides earlier bottom Pages-button / no-Pages-in-rail instructions in this record and its historical references. The manager anchors beside the 56px rail, below the 56px topbar, above the 32px bottom bar; existing widths, guard/return and permission contracts remain. See the canonical decision in PRODUCT-DESIGN-BRIEF.md and `evidence/figma-design-execution/pages-placement-correction.md`.

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · not VERIFIED** (independent `design-qa-critic` review: pass 1 PROPOSAL with B1–B4, pass 2 passed; 4 final notes fixed). Runtime NOT RUN; geometry NOT MEASURED. Designer-selected choices are marked *(DS)*; owner standing instruction 2026-10-17: apply recommended answers. Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S3, N1, V5, V7; gap rows T1-01, D2-28, T1-12, T1-15, T7-1 (pointer only); CS-02, CS-05, CS-14 ("area" for editor destinations throughout §4–§12, SC-11 *(R-1018)*), CS-22. Not applied: T1-02 (see §7). Round 2: Q3, Q4, Q5 (pointer) *(R-1018b)*.

**No AI in this version (owner 2026-10-17, Panel 00 SC-21):** every AI entry point in this panel is hidden; AI text below is kept for the later AI Build tab; backend unchanged.

Governing IA (do not reopen): BD-01 (Assets/CMS/Brand visible in rail), BD-02/BD-24 (created-page tabs in bottom bar; management in rail), BD-05/BD-24 (rail Add, Layers, Pages, Assets, CMS, Brand + Help utility), BD-06 (rail stays across workspaces), BD-11 (two groups, stable positions), IA-01 active-marker rule, GEO-01 (rail 56w fixed, labels beneath icons, utility group scrolls at short height), NAV-01..04, IAF-01.
Scope: the rail itself — items, order, active state, what each click opens, keyboard, geometry. The **interiors** of Add, Layers, Assets, CMS, Brand are their own panel docs (03–09).

---

## 1. Purpose

The rail is the **permanent map of the editor**: two page-editing tools and three site resources, always in the same place, always labelled, from every area. One click = one predictable destination.

Job: S supporting — navigation for J1 Build and the Change step (00-STRATEGY §3–4) *(R-1018)*
Visual: SC-27 (DESIGN_SYSTEM_SPECIFICATION §2–§4); sentences SC-28 *(R-1018)*

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)

Files: `src/editor/rail/tabsConfig.ts`, `sidebar/LeftSidebar.tsx` + `.css`, `sidebar/useSidebarKeyboard.ts`, `shell/StudioPanels.tsx`, `shell/hooks/useStudioState.ts`, `shell/hooks/useTabSwitchGuard.ts`, `shell/shellDirtyRegistry.ts`, `onboarding/RailCoach.tsx`.

| ID | Item (order) | Key | Opens today |
|---|---|---|---|
| LR-01 | Add | A | 280 drawer (`tabsConfig.ts:57-69`) |
| LR-02 | Layers | L | drawer (`:100-110`) |
| LR-03 | **Pages** | P | drawer (`:111-121`) |
| LR-04 | Assets | M | drawer; can switch to full-page library (`:87-98`, `StudioPanels.tsx:443`) |
| LR-05 | CMS (`content`) | D | drawer **and** CMS workspace replacing canvas+inspector (`:226-244`, `StudioPanels.tsx:921`) |
| LR-06 | Brand (`design`) | B | full-screen workspace (`:142-157`) |
| LR-07 | Help (bottom) | ? (tooltip) | keyboard legend (`LeftSidebar.tsx:451-462`) |
| LR-08 | Viewer-only group: History, Activity, Review* | — | right column (set `VIEWER_TABS` `tabsConfig.ts:328-334`; drawn `LeftSidebar.tsx:205-247`) |
| LR-09 | Owner's read-only view mode | — | **rail not rendered at all** (`StudioPanels.tsx:841`) |
| — | Off-rail tabs | T, ⇧A, S, U, H, R | Templates, Components, Settings, Publish, History, Activity, Review — via ⌘K, menus, buttons |

Behaviour today: one group, no divider; label under icon (11px, max 42, ellipsis); tooltip right with label + key; clicking a different item switches + opens drawer, clicking the active item toggles the drawer; active = accent tint, bar and `aria-selected` **only when the drawer is open** — so Brand (full screen) and right-column tabs never show the active bar; drawer closed = grey "last" plate. Viewer: Add/Pages/CMS/Brand visible but refuse with toast, forced onto Layers. Persistence `buildrick-panel-state` stores last drawer tab (full-screen saved as previous drawer tab), drawer always opens on load, default Add. Guard: Settings + CMS-record dirty only (Brand autosaves); failed discard **still switches** and toasts. ARIA: `tablist` + `tab` + roving tabindex; arrows switch tabs without opening the drawer. Geometry: token rail 60, items 44 square, pitch 48, icon 18; `.ls-rail` `overflow:hidden` → **items clip at short heights**. No badges, no splitter.

Tests: 16 files (~128 tests), incl. `LeftSidebarRailClick` (11), `useTabSwitchGuard` (15), `useStudioState` (28), `tabsConfig*` (29).

## 3. Problems this redesign solves

1. **Historical finding superseded by BD-24:** Pages on the rail is now the explicitly required placement; only the page strip belongs in the bottom bar.
2. **Active state lies in workspaces**: Brand/CMS open with no active bar; screen readers get `aria-selected=false` for the open destination.
3. **Keyboard trap/skip**: when the active tab is off-rail (Settings, Publish…), no rail item has `tabIndex=0` → Tab skips the rail; `aria-labelledby` points to a missing id.
4. **Mixed destination types** behind identical buttons (drawer vs drawer+workspace vs full screen) — CMS and Assets have two different "open" results.
5. **Short-height clipping**: rail cuts items off instead of scrolling (GEO-01 requires scroll of the utility group).
6. **Failed discard still navigates** (IAF-01 H requires "Retry or stay", never continue).
7. **Role-specific extra group** changes rail composition by role, against stable positions (BD-11). *Removed 2026-10-17* now that its replacement doors exist (§10) — capability before tidiness.

## 4. Target composition

```
┌──────┐
│ [+]  │ Add        ┐ Page editing (open a panel in Editor)
│ Add  │            │
│[lyr] │ Layers     │
│Layers│
│[file]│ Pages (P)  ┘
│Pages │
│ ──── │            divider (24w)
│[img] │ Assets     ┐ Site resources (open an area)
│Assets│            │
│[db]  │ CMS        │
│ CMS  │            │
│[pal] │ Brand      ┘
│Brand │
│      │  (flex space)
│ ──── │
│  ?   │ Help       Utility (pinned to bottom; items above scroll at short height)
│ Help │
└──────┘
```
*(R-1018, CS-22: Lucide icons named in brackets — plus, layers, image, database, palette, circle-help; no emoji. Group names are annotations, not UI text.)*

Fixed order: Add, Layers, Pages, then Assets, CMS, Brand; Help pinned below. No badges *(DS — badges add noise; status has its own homes)*.

## 5. Item contracts

| Item | Click result | Clicking it when already active | Key | Viewer |
|---|---|---|---|---|
| **Add** | Enter Editor (if elsewhere, restore last page/selection/breakpoint/zoom) and open Add panel 284w | Collapses the panel (canvas widens); click again restores | A | Visible, disabled with reason "Adding needs Editor access"; A key announces the same reason via live region (no toast) |
| **Layers** | Enter Editor and open Layers panel | Collapse / restore | L | Enabled (default tool for viewers) |
| **Pages** | Open the Pages manager beside the rail without changing the active page or discarding the current draft (Panel 11 / BD-24) | Close manager and restore prior tool/context; focus stays on the rail entry | P | Visible, disabled with reason "Managing pages needs Editor access" |
| **Assets** | Open **Assets area** (local nav 240 + library + detail 320) | No-op; focus moves to the area local nav | M | Enabled read-only (today viewers already reach Assets — `VIEWER_TABS`); upload/edit disabled with reason |
| **CMS** | Open **CMS area** (collections nav + Records/Fields/Dynamic pages/Collection settings, CMS → Data) | No-op; focus local nav | D | **Disabled with reason** "CMS needs Editor access" — unchanged access (IAF-20 K: no new viewer grant) |
| **Brand** | Open **Brand area** | No-op; focus local nav | B | **Disabled with reason** "Brand needs Editor access" — unchanged access |
| **Help** | Opens a small Help menu (popover 240w) with the help capabilities that exist today: **Keyboard shortcuts (? or ⌘/ — both exist, `useEditorShortcuts.ts:41,196`)** → existing shortcuts dialog (bounded 720, IAF-21 F) · **Getting started** (onboarding replay; hidden in view mode, as in Panel 01) *(DS: no new help content invented; ⋯ menu keeps its rows)*. **Exactly these two rows**; the Keyboard legend card is retired — its rows move to the shortcuts sheet's BASICS group *(amended 2026-10-17 — source: Panel 18 §4.5, §9 / SC-10, SC-12)* | Closes menu | — (the popover has no letter key; **?** opens Keyboard shortcuts directly — SC-12) *(amended 2026-10-17 — source: Panel 18 / SC-12)* | Enabled (Keyboard shortcuts only) |

Rules:
- **Two destination types only** *(DS, per IA-01)*: tools open a panel inside Editor; resources open a full area. CMS's left drawer becomes the CMS area's local navigation (same content: collections + Data); Assets' drawer mode becomes the **contextual Asset picker** opened from fields (IAF-09) — so picking an image never needs the rail.
- **Contextual asset pick** from a CMS field: opens the picker over CMS; **CMS stays the active rail item** (preserves `assetPick.ts:79-82` intent).
- **Asset picker in Editor (IAF-09 E — preserves the drawer's insert/place capability):** from Add → Media, an empty media block, Inspector "Replace…", or ⌘K "Replace selected media" (`assetPick.ts:89-95`), a **temporary left Asset picker (284w) replaces the Add/Layers panel** inside Editor. Header per Panel 08 §4.3 ("Insert image at …" / "Replace image · …") + Cancel. Supports pick-to-apply and **drag to canvas / Insert** (drag starts only from this picker). Rail state: Editor tool shows its **last plate**; **Assets is not active** (the user is still in Editor). Finishing (applied/inserted) or Cancel restores the previous Add/Layers panel and focus to the origin control. Rail click while picking = Cancel the pick, then navigate.
- Switching from an area to Add/Layers restores the **exact Editor origin** (IA "Exact return"); switching between areas keeps each area's own last location for the session.
- Every switch runs the dirty guard (§7). Direct rail navigation does not push onto the Back stack (IAF-01 G).

## 6. Active-state rules (fixes problem 2)

| Situation | Rail shows |
|---|---|
| Editor, Add or Layers panel open | That tool: **active** (accent tint + 3px bar + `aria-current="true"`) |
| Editor, panel collapsed | Remembered tool: **"last" plate** (grey, no bar, `aria-current` absent); tooltip "Show Layers panel" |
| Assets / CMS / Brand area | That resource: **active** (tint + bar + `aria-current="page"`) — regardless of drawer state |
| Contextual picker open from CMS | CMS stays active |
| Site settings, Templates, Components, Compare/Time Travel | **No rail item active**; the topbar/area header names the location (IA-01) |
| Right task host (Publish, Review, History, AI…) open over Editor | Editor tool state unchanged; task host has its own header |
| Temporary Asset picker in Editor | Remembered Editor tool "last" plate; Assets not active |
| Owner's read-only view mode | Rail hidden (unchanged, LR-09) |

Active is never colour-only (bar + weight + `aria-current`).

### 6.1 Returns (IA-04)

| Path | Result |
|---|---|
| Rail click into an area | Deliberate navigation: **leaves any contextual chain** (e.g. drops `cmsReturn`), no Back-stack push; area local header shows **"‹ Back to Editor · {page}"** which restores page, selection, breakpoint, zoom |
| Contextual deep link (Inspector "Open record ›", ⌘K result, CMS-binding chip) | Opens the **exact target** (collection/record/field) with that area active; header shows an origin-named back ("‹ Back to Heading" / "‹ Back to Editor"), keeping today's `cmsReturn` behaviour |
| Re-click active resource | No navigation; focus local nav. Leaving is via the header Back or Add/Layers |

## 7. Navigation guard (fixes problem 6)

- Dirty domains: Settings (staged), CMS record (draft), plus any future owner registered in `shellDirtyRegistry`. Brand stays unguarded (autosave) — matches code; inventory 4.11 is corrected. *(R-1018 source check: `shellDirtyRegistry` is written only by `SettingsTab.tsx` and `cms/RecordSheet.tsx`, and `useTabSwitchGuard.ts:25` states "Brand has nothing to guard since its edits autosave". ~~**Not applied — T1-02 open**~~ — **decided by owner Q3** *(R-1018b)*: Brand counts as guarded **only while a Brand save is pending or failed**; saved (or applied locally with a save in flight that succeeds) → no dialog. The guard uses the SC-24 Brand form (Keep editing · Save and leave · Leave and keep retrying); engineering registers Brand in `shellDirtyRegistry` for those two states only.)*
- Dialog: **SC-24** (one unsaved-changes dialog, S3) *(R-1018, CS-02 / D2-28 / T1-01 — replaces "Keep editing · Leave and lose changes")*: title **"Leave without saving?"** · **Keep editing** (default focus) · **Discard changes** · **Save and leave** — Save and leave shows because both guarded domains (Site settings, CMS record) have an explicit Save. When a discard is uncertain the body says "Some changes may not be discarded" (was the "Leave anyway — some changes may be lost" label).
- **Fix:** if any discard throws, navigation **stops**; dialog changes to "Couldn't discard {Settings/record} changes" with **Retry** · **Keep editing** (IAF-01 H; was Retry/Stay *(R-1018)*). If Save and leave fails, navigation stops with "Couldn't save — Retry" (SC-4). Origin and its draft are untouched.
- No guard for re-clicking the active item or for disabled items.

## 8. Keyboard and accessibility (fixes problem 3)

- Landmark: `<nav aria-label="Editor navigation">` containing a vertical **toolbar of buttons** *(DS: destinations are navigation, not tabs of one panel)*; active destination uses `aria-current`. Retire `tablist/tab/tabpanel` and the dangling `aria-labelledby`.
- Roving tabindex: exactly one item is always tabbable — the active item, else the remembered tool, else **Add**. Tab enters the rail once; ArrowUp/Down move focus (wrap), Home/End jump, **Enter/Space activates** (arrows no longer switch destinations by themselves — avoids accidental area loads and guard dialogs).
- Letter shortcuts unchanged (A, L, M, D, B, ?), suppressed in inputs/contenteditable/modals/with modifiers (existing). **P** opens the left-rail Pages manager (Panel 11). Off-rail keys unchanged: T, ⇧A, U, H, R (when reviews on); **S / ⌃, no longer open Site settings** — no shortcut, owner Q4 *(R-1018b)*; **⌘\ = focus mode** (hides all panels including the rail, topbar and bottom bar — SC-12, owner Q5) *(R-1018b)*. AI key I is hidden in this version (SC-21); ⌘J is removed (SC-12). *(amended 2026-10-17 — source: Panel 20 / SC-12, SC-21)*
- F6 order per SC-5 / amended NAV-04: topbar → global banner slot (only while a banner shows) → rail → left panel/local nav → canvas toolbar + canvas (or area body) → Inspector/right task → bottom bar. *(amended 2026-10-17 — source: Panel 22 / SC-5)*
- Tooltips: label + shortcut, shown on hover and focus; visible label stays under every icon (tooltip is supplemental).
- Focus: accent border + soft 2 px ring `--bk-shadow-focus` (founder 2026-07-29, DS §2.9) *(R-1018 — was "2px accent")*. Disabled items stay focusable with `aria-disabled` and the reason in tooltip/description.
- **Skip to canvas** link kept (existing, INV 1.11) *(R-1018, T1-12)*: first tabbable element of the editor, visible on focus; targets the canvas in Editor and the area body in other areas; stays tabbable under full-page views.
- Motion *(R-1018, V5)*: active bar and hover tint change with the fast 100 token; the Help popover (240w, V7) opens with the base 160 fade; reduced motion → instant.

## 9. Geometry (GEO-01; NOT MEASURED)

| Property | Value |
|---|---|
| Rail width | **56 fixed** (selected); as-built token `--bk-size-rail` 60 → change via Figma → `generate.mjs` (token/DESIGN.md drift, not an open choice — DS §2.12, T7-1/CS-05) *(R-1018)* |
| Item | 48 wide × 52 tall hit area (icon 20, label 11/500 beneath, max 48, ellipsis + full label in tooltip) |
| Gaps | 4 between items; group divider 24w with 8 above/below |
| Top padding | 8 |
| Bottom | Help pinned to bottom with 8 padding |
| Short height | Whole item list becomes **one scroll region** (no clipping) when height < content; Help stays pinned; scroll shows a fade edge; focus-scroll keeps the focused item visible |
| Enlarged text | Labels wrap to 2 lines max; rail width stays 56; item height grows |

The Getting-started chip that sat at the rail foot above Help (INV 12.2) moves to bottom-left above the bottom bar (Panel 16 §4.3), so it is not in this height *(R-1018, T1-15)*.

Content height ≈ 8 (top) + 5×52 (items) + 3×4 (gaps) + 17 (group divider 1px + 8 + 8) + 17 (divider above Help) + 52 (Help) + 8 (bottom) = 374; the viewer rail is the same 374 (viewer group removed). Fits 1440×600 (canvas column height ≈ 600−56−32 = 512) with room; at 200% text it scrolls rather than clips.

## 10. States, roles, persistence

| Condition | Behaviour |
|---|---|
| Viewer | Same six items + Help. Add, Pages, CMS, Brand disabled with reason; Layers enabled; Assets read-only (access unchanged from today). **Viewer group (Review · History · Activity): revisit trigger met 2026-10-17** — Panel 11 gives viewers "Versions ›" and Panel 01's viewer row now includes the review chip (Panel 00 SC-6) — so the group is **removed**: Review via the topbar review chip, History via status "Versions ›", Activity via the bell footer "View all activity". No viewer door is lost. H/R keys keep working for viewers (R only with reviews on; ⌘H removed — SC-12) |
| Owner's read-only view mode | Rail not rendered (unchanged); topbar "‹ Back to editing" restores the rail |
| Role loading | Items enabled; actions re-check permission at execution (no flash-disable) |
| Area load failure | Rail stays usable; the area shows its own "Couldn't load {area} — Retry" (server) or "You're offline" (network) *(R-1018, DS §3 load-error pattern)* |
| Offline | Rail stays usable; areas that need the server show their own offline state; the one polite announcement is Panel 22's *(R-1018, CS-10)* |
| Components door *(R-1018, N1)* | No rail item for Components (decided): doors are "Components ›" in the Add header (Panel 03) and the Layers instance link (Panel 04), plus ⇧A and ⌘K |
| Reload | Returns to **Editor** with the last tool (Add/Layers) open; areas are not auto-restored *(DS — matches current "fullscreen saved as previous drawer tab")*; storage key `buildrick-panel-state` migrated: stored `pages` → Layers + Pages manager closed; stored `assets`/`content`/`design` → last tool |
| Onboarding coach | `RailCoach` kept; it must anchor to existing items (Pages coach step anchors to the left-rail Pages entry); copy names the six rail items and it shows until dismissed (not "0 steps done") — Panel 16 §4.2 *(amended 2026-10-17 — source: Panel 16 / SC-10)* |

## 11. Preservation map

| Old | New | Disposition |
|---|---|---|
| LR-01 Add, LR-02 Layers (drawer, toggle) | Same tools, Editor panel 284, collapse/restore | Keep |
| LR-03 Pages on rail (P) | Left-rail Pages entry + manager (P key kept), BD-24 | Keep |
| LR-04 Assets drawer + full page | Assets area (management); drawer pick/insert/drag-to-canvas → **temporary Asset picker in Editor** (§5, IAF-09 E); field picks → contextual picker | Redesign (same capabilities) |
| LR-05 CMS drawer + area | CMS area with local nav (collections + Data) | Merge |
| LR-06 Brand full screen | Brand area, now shows active state | Keep + Fix |
| LR-07 Help → shortcuts legend | Help popover (two rows: Keyboard shortcuts · Getting started; no letter key — ? opens the shortcuts sheet). Legend card **removed**, rows → sheet BASICS | **Removal** of the legend card (IAF-21 K amendment); Help door Keep *(amended 2026-10-17 — source: Panel 18 §9 / SC-10)* |
| LR-08 Viewer group | Removed; doors: topbar review chip, status "Versions ›", bell footer Activity (§10, Panel 00 SC-6) | Move |
| LR-09 Read-only view: no rail | Unchanged | Keep |
| CMS deep links + `cmsReturn` back | §6.1 contextual row | Keep |
| Off-rail tabs + keys | Unchanged entries | Keep |
| Viewer refuse-toast | Disabled-with-reason | Redesign |
| Arrow keys switch tabs | Arrows move focus, Enter activates | Change (intentional) |
| Failed discard navigates | Retry / Stay | Fix |
| Drawer expand 700 (inside LeftSidebar) | Owned by Add/Layers panel docs (03/04) | Out of rail scope |

No capability removed.

## 12. Acceptance (specified, NOT RUN)

| ID | Pass condition |
|---|---|
| T-LR-01 | Rail shows Add, Layers, Pages │ Assets, CMS, Brand │ Help in every area and role , except owner read-only view where the rail is hidden (LR-09); Pages is present after Layers |
| T-LR-02 | Brand/CMS/Assets area open → that item has bar + `aria-current="page"`; Site settings/Templates/Components/Compare → none active |
| T-LR-03 | From CMS, click Layers → Editor restores last page, selection, breakpoint, zoom; Layers open |
| T-LR-04 | With Settings open (off-rail), Tab reaches the rail on the active-or-Add item; arrows move focus only; Enter activates |
| T-LR-05 | 1440×600 and 200% text: no item clipped; list scrolls; Help pinned |
| T-LR-06 | Dirty CMS record → click Brand → "Leave without saving?" with Keep editing · Discard changes · Save and leave; forced discard failure → Retry/Keep editing, no navigation *(R-1018)* |
| T-LR-07 | Viewer: Add/CMS/Brand disabled with reason; Layers + Assets (read-only) work; Review/History/Activity reachable via review chip, status "Versions ›", bell footer and H/R keys; **no viewer door that exists today is missing** |
| T-LR-11 | Inspector "Replace…" on an image → temporary Asset picker replaces Layers; Assets not active; pick applies, Layers returns, focus on Replace; drag from picker inserts on canvas |
| T-LR-12 | Rail CMS click → header "‹ Back to Editor · Home" restores origin; Inspector "Open record ›" → exact record, "‹ Back to Heading" returns to the bound row, restoring the Binding subview if it was open (Panel 06 C3) |
| T-LR-08 | Picking an image for a CMS field keeps CMS active and returns to the field |
| T-LR-09 | Stored `pages` preference from an old session loads without error into Layers |
| T-LR-10 | Existing rail/guard/state tests updated with the change, not deleted |

## 13. Review and not verified
Independent review complete (see status). Not verified: runtime, measured geometry, screen-reader output, onboarding coach re-anchoring.
