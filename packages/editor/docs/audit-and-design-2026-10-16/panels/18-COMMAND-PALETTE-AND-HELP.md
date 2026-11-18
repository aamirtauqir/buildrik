# Panel 18 — Command palette, Keyboard shortcuts and Help: functionality specification (FD-PNL-18)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by P-TRIAL (T-CP-07 only) · not VERIFIED.** Independent `design-qa-critic` review: pass 1 PROPOSAL (4 blocking) + 14 notes — fixed 2026-10-17; pass 2: 4 blocking fixed 2026-10-17. Runtime NOT RUN; geometry NOT MEASURED. Written from a source read (file:line below) after the product-design review listed the ⌘K palette as a surface with no spec (`REVIEW-2026-10-17-pro-product-design.md:14,41`). *(DS)* = designer-selected; owner standing instruction 2026-10-17: designer recommendations are accepted. Owner decisions OD-18-2/3 are decided (SC-22, §10). Panel 00 (SC-1…SC-22) wins on conflicts.
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S2 (Clear history stays an existing SC-15 item), V5, V7; FINAL §4 items 6 (CS-10/11), 13; gap rows D3-5, D3-16, D3-17, T1-29 (index row only), T2-37, CS-19. Round 2: Q4, Q5 *(R-1018b)*.

**No AI in this version (owner 2026-10-17, Panel 00 SC-21):** every AI entry point in this panel is hidden; AI text below is kept for the later AI Build tab; backend unchanged.

Governing IA: **IAF-21 F** (help dialog bounded 720; overlay priority; one focus owner — `evidence/ia-final-2026-10-16/module-specifications.md:1127-1181`), **IAF-21 H** ("keyboard legend reflects actual platform/context bindings"), **IAF-21 K** (amended here, §9), **IAF-20 E** (one resolved capability result across rail/topbar/command/context/shortcut — `:1093`), IAF-01 (one palette, M01-3.7 / M01-13.1 / M09-A3.5-6 in `capability-preservation.md:88,182,1113-1114`), IAF-09 (M09-A3.38 ⌘K in the media library, `:1146`), SC-2, SC-3, SC-6, SC-12, SC-14, SC-15, SC-17, SC-18, SC-20, SC-21, SC-22. Panels 01 §6/§10 (⋯ menu Help & tools; ⌘K button stays removed), 02 §5/§8 (rail Help popover), 12 RT-09 (task keys), 16 §4.5 (Help content).

---

## 1. Purpose and boundary

Three surfaces answer one question: **"How do I get to it, and what keys does it have?"**

Job: S supporting — serves all three jobs, J1 Build most (00-STRATEGY §3) *(R-1018)*
- **Command palette (⌘K)** — find and run any action, area, page, element, component, record, page template, asset or setting the user may access, from anywhere.
- **Keyboard shortcuts sheet** — the full, true list of keys for this user's platform, generated from the SC-12 table; home of the single-key toggle (WCAG 2.1.4).
- **Help popover** (rail bottom) — exactly two rows: Keyboard shortcuts, Getting started (Panel 02 §5, Panel 16 §4.5). No new help content.

Out (owned elsewhere): the actions themselves (SC-3 registry, panels 03–15), the Getting started checklist (Panel 16), per-panel search fields (Add, Layers, Assets, CMS, Templates), AI task (Panel 12), docs/learning content (none exists; not invented here).

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)
Paths under `packages/editor/src/`. **CP** = `editor/shell/modals/CommandPalette.tsx`, **KR** = `editor/canvas/controls/keyboardSheetRows.ts`.

| ID | Area | Today |
|---|---|---|
| CP-01 | Doors | ⌘K/Ctrl+K document listener toggles (`StudioHeader.tsx:329-347`); ⌘⇧P alias (`useEditorShortcuts.ts:137-141`); ⋯ menu row "Command palette ⌘K" (`SiteMenu.tsx:84,189-193`); "Search everywhere for …" no-result hand-offs from Pages, Layers, Settings open it on the query (`PagesTab.tsx:470`, `panels/layers/index.tsx:508`, `SettingsTab.tsx:961`, `StudioHeader.tsx:357-361`). No visible topbar button (Panel 01 §10 "removed deliberately") |
| CP-02 | Guards | Never opens in read-only view or while a modal is open (`StudioHeader.tsx:336-339,355-356`) |
| CP-03 | Frame | Card 640w, 48 from top, max-h 800, no dim, transparent click-catcher closes; `role=dialog aria-modal`, chrome-ui focus trap, Esc closes (CP:526,598-609) |
| CP-04 | Input | "Search pages, layers, assets and actions…"; combobox → listbox with `aria-activedescendant` (CP:617-637); Clear ✕ (CP:638-651); **static** chip "Scope: everything" (CP:652-657) |
| CP-05 | Opening list | Recent (last 5 run, localStorage `buildrick:command-recents`, not per user — `commandRecents.ts:11-12`; CP:506-514) + bands Pages · Navigate · Edit · View · Add · Tools (CP:70,530). Pages band = "New page" + **one "Go to {page}" row per page** (`usePageCommands.ts:94-98`) |
| CP-06 | Index (typed) | 18 area/task doors (CP:120-146), Permissions (CP:163-169), Undo/Duplicate/Replace media, Zoom 50%/Preview, Add text/container, Generate a block with AI, Manage CMS records, Save page as template, History, Search stock photos, Redo, zooms, Clear history, Start collaboration (flag), page templates (CP:323-331), **layers of the active page only** (CP:337-356), assets (CP:357-368), rest of the registry under "More" (CP:374-393), Properties = inspector "Jump to property" (`inspector/ProInspector.tsx:302`), CMS records loaded per collection on every open (CP:464-494). **Not indexed:** components, Site settings screens (only "Open analytics settings", "Open export settings" — `defaultCommands.ts:722-739`) |
| CP-07 | Matching | Substring over label + **band name** + keywords (CP:531-533); no ranking — order is band order (CP:68,555-567); typing "more" returns the whole More band |
| CP-08 | Disabled | Reasons computed per open (CP:180-186,212-213,269-270): "select two or more", "select a group", "nothing copied", "Select an element first", "No changes to undo", "nothing to redo" (mixed case); whole row at 50% opacity "Label · reason" (CP:716,722); Enter/click does nothing, nothing announced (CP:497) |
| CP-09 | Permissions | Viewer rows **hidden**, not disabled (CP:148-156); Review row only when reviews on (CP:140); collab behind flag (CP:307). `viewerChrome = readOnlyView && VIEWER` (`useEditorRole.ts:34-38`) but the palette never opens in read-only view (CP-02) → **viewers have no palette and the viewer filter never runs** |
| CP-10 | No match | "Nothing matches 'q'." + "Search stock photos for 'q'" + "Ask AI instead ›" (opens the AI tab, query not passed); Enter with no rows = Ask AI (CP:537-540,585,668-683); not gated by role or AI availability |
| CP-11 | Chords | Shown on actions, not doors (CP:699); some hard-coded ("Ctrl+Z", "Ctrl+Y", "Ctrl+P", "Ctrl+1/2/0", CP:211,228,268,276-282); platform via `navigator.platform` (CP:405) |
| CP-12 | Footer | "Click a command · Esc Close … Current editor" (CP:735-749); no ↑↓/↵ hint |
| CP-13 | Nested | None — every row is flat |
| CP-14 | Assets conflict | Asset library binds ⌘K on `window` to focus its search (`media/LibraryManager.tsx:163-166`); StudioHeader binds ⌘K on `document`; neither stops propagation, so both handlers run (visible result NOT RUN) |
| CP-15 | Write gate | `CommandCenter.run` refuses `MUTATING_COMMANDS` when read-only (`engine/commands/CommandCenter.ts:67-73,142-148`); `add-text/heading/image/button/container` are not in that set and insert via `ELEMENT_QUICK_ADD` → `addElement` (`defaultCommands.ts:657-691`, `shell/hooks/useEditorEventListeners.ts:246-258`) |
| CP-16 | Clear history | `window.confirm`, then `history.clear()` (CP:292-298) |
| CP-17 | Components | Component list exists only once loaded: `components.isLoaded() ? getAllComponents() : null` (`engine/Composer.ts:237`) |
| KS-01 | Sheet doors | `?` and ⌘/ (`useEditorShortcuts.ts:143-148,196-199`), palette row (CP:145), ⋯ menu row (`SiteMenu.tsx:200-204`), legend "All shortcuts ›"; `?` toggles closed (`KeyboardCheatSheet.tsx:95-107`) |
| KS-02 | Sheet body | Modal size "table", search, "Nothing matches"; one column, groups Selection · Edit · View · Panels · Regions (KR:47; `KeyboardCheatSheet.tsx:109-169`) |
| KS-03 | Sheet rows | Registry rows with a `shortcut` + a hand-written `CHROME_CHORDS` list (KR:109-161) carrying SC-12's **"Was"** keys (⌘0/1/2, ⌘B, ⌘R, ⌘⇧X, ⌘H; registry ⌘⇧]/[ `defaultCommands.ts:472-484`) |
| KS-04 | Platform | ⌘/Ctrl, ⇧/Shift, ⌥/Alt mapping (KR:56-81); `delete` → "Del" on macOS; detected by `navigator.platform` (`KeyboardCheatSheet.tsx:35-36`) |
| KS-05 | Truth | R listed while reviews are off (`useSidebarKeyboard.ts:17-20`); C listed always, bound only with reviews on (`useEditorShortcuts.ts:117-125`); **I** (AI) bound (`useSidebarKeyboard.ts:53-58`) but not listed; no scope column |
| KS-06 | Single keys | No on/off setting exists anywhere |
| LG-01 | Rail Help | Opens the Keyboard legend card (`sidebar/LeftSidebar.tsx:451-462`); tooltip "Keyboard shortcuts · ?" although `?` opens the sheet, not the card |
| LG-02 | Legend card | 280w, top 64, right 16; 10 hand-written rows + "Also:" line (`KeyboardLegend.tsx:20-31,93-94`), macOS glyphs on every platform; says "⌘K … scope follows the open panel" (false, CP-04) and "⌃H opens History" |
| LG-03 | Legend door | "All shortcuts ›" is a separate `fixed` button at the viewport's bottom-right, outside the card (`KeyboardLegend.tsx:98-107`) |
| LG-04 | Legend a11y | `role=dialog` with no focus move or trap; Esc on `document` without a topmost check (`KeyboardLegend.tsx:45-52,64-69`) |
| HP-01 | Getting started | ⋯ menu row only (`SiteMenu.tsx:215-219`); not reachable from rail Help |

## 3. Problems this design solves (00-STRATEGY §3 — all three jobs; "Build fast" most)
1. **No one finds the palette.** The only visible door is a ⋯ menu row; the topbar button was removed (CP-01).
2. **Search returns lists, not answers.** No ranking; band names match; the opening list grows with every page (CP-05, CP-07).
3. **Missing things:** components, Site settings screens, layers on other pages (CP-06).
4. **Permission rules disagree with SC-6/SC-18:** rows are hidden instead of disabled with reason, and viewers get no palette at all (CP-09); no-match offers AI to people who can't use it (CP-10).
5. **Disabled rows are dead ends:** Enter does nothing and says nothing; the reason is faded with the row (CP-08).
6. **Two meanings for ⌘K** in Assets (CP-14).
7. **The sheet and the legend print keys that are wrong** for the platform, the feature state or SC-12 (KS-03, KS-05, LG-02); no single-key off switch (KS-06, WCAG 2.1.4).
8. **Help is a keyboard card,** not a Help menu; Getting started is hidden in ⋯ (LG-01, HP-01).

## 4. Target layout

**Canonical palette group order** (one order, used by the opening list, typed results and Show all): Top result · Recent · For {selection} · Actions · Areas & tasks · Pages · Layers · Components · Records · Settings · Page templates · Assets · Properties · Help. A group with no rows is not drawn. **Canonical sheet group order:** Basics · Selection · Edit · Text · View · Areas & tasks · Regions *(DS)*.

### 4.1 Command palette — opening state (640, no dim, as today)
```
┌───────────────────────────────────────────────────────────────┐ 640
│ ⌕  Search actions, pages, layers, records…        [In Assets ✕]│ input 48 · scope chip only when scoped
├───────────────────────────────────────────────────────────────┤
│ RECENT                                                         │ ≤5; hidden on first use
│   Duplicate                                              ⌘D    │ row 32
│   Go to Menu                                                   │
│ FOR "HEADING"                                                  │ selection actions ≤5
│   Lock                                                  ⌘⇧L    │
│   Show in Layers                                         ⇧L    │
│   Group — Select two or more elements                    ⌘G    │ aria-disabled, reason inline
│ AREAS & TASKS                                                  │
│   Editor · CMS · Assets · Brand · Site settings · Templates ·  │ one row each
│   Components · Go to page › · Publish · History                │ › = nested level
│ HELP                                                           │
│   Keyboard shortcuts                                    ?      │
├───────────────────────────────────────────────────────────────┤
│ ↑↓ Move   ↵ Run   → Open   Esc Close                 ? Keys    │ footer 32
└───────────────────────────────────────────────────────────────┘
```
Change from CP-05: pages no longer flood the opening list — "Go to page ›" opens a nested page list *(DS)*. The selection group is named after the selection ("For "Heading"", "For 3 elements") and is not drawn when nothing is selected.

### 4.2 Typed query — ranked results (canonical order)
```
│ ⌕  set                                                    ✕   │
│ TOP RESULT                                                    │
│   Site settings                                               │ no shortcut (Q4) *(R-1018b)*
│ ACTIONS                                                       │
│   Reset style — Select an element first                       │
│ PAGES                                         Show all 6 ›    │ ≤5 per group
│   Settings page                                               │
│ SETTINGS                                                      │ NEW: settings screens
│   SEO · Site settings                                         │
│   Custom code · Site settings      Pro · included in your trial│ SC-20 copy
│ 12 results                                       (live region) │
```

### 4.3 Nested level (e.g. "Move to page ›", "Go to page ›", "Show all ›")
```
│ ‹ Move to page   ⌕ filter pages…                              │ breadcrumb chip in the input
│   Home (current)  — Already on this page                      │
│   Menu                                                        │
```

### 4.4 Keyboard shortcuts sheet (720 bounded, IAF-21 F)
```
┌ Keyboard shortcuts ─────────────────────── Search commands ⌘K ── ✕ ┐ header 56
│ [⌕ Search shortcuts…]                 Show keys for: (macOS | Windows)│
│ Single-key shortcuts   [● On]                                        │
│   A, L, M, D, B, P, T, U, H, R, C, ? and / work without              │ S removed (Q4) *(R-1018b)*
│   ⌘/Ctrl. Turn off if you use speech input or switch control.        │
│ BASICS     Tab  moves inside a region · F6 / ⌃`  next region ·       │ from the retired legend (§9)
│            Esc  steps back one level · ⌘K  search everything          │
│ SELECTION · EDIT · TEXT · VIEW · AREAS & TASKS · REGIONS              │
│   Duplicate                                    ⌘D        Canvas      │ row 32: label · key chip · scope
│   Focus mode — hide all panels                 ⌘\        Global      │ VIEW group; ⌘\ again restores (Q5) *(R-1018b)*
│   History                                      H         Global · single key │
│   Review                                       R         — Reviews are off for this site │ muted, not hidden
└──────────────────────────────────────────────────────────────────────┘ max-h 80vh, body scrolls
```

### 4.5 Help popover (Panel 02 §5 — 240, anchored to rail Help, bottom-aligned)
```
┌ Help ──────────────────┐
│ Keyboard shortcuts   ? │
│ Getting started        │  hidden in view mode (Panel 01 §6)
└────────────────────────┘
```
Rail item tooltip: **"Help"** — this is the only tooltip text (Fix LG-01). The legend card is retired (§9, IAF-21 K amendment).

## 5. Flows

### 5.1 Open
- **Keys:** ⌘K / Ctrl+K in **Global incl. Field and Text scope** (declared SC-12 exception, like F6; §11 SC-12 rows) — ⌘K has no text or field meaning in the editor; ⌘⇧P stays an alias. **Ctrl+K on Windows Chrome and Firefox is the browser's address-bar search**: the key ships only after it passes the SC-12 three-browser acceptance (page intercepts it); if a browser does not pass it, that browser's documented key is Ctrl+Shift+P.
- **Field / inline text open (SC-17):** pressing ⌘K in an uncommitted field or inline text first **commits** the field (as Enter/blur — one Undo step), then opens. A field that fails validation stays as it is with its error, and the palette does not open.
- **Visible doors:** ⋯ menu header entry **"Search  ⌘K"** — it **replaces** Panel 01 §6's "Command palette ⌘K" row (one door, not two; SC-10 row in §11). **The header has a single occupant** — this entry; the Panel 23 plan chip is the first row directly under the header *(R-1018, D3-5)*; the sheet header "Search commands ⌘K"; panel "Search everywhere for …" hand-offs (open unscoped, query filled). Second ⌘K closes. While a modal is open: refused (CP-02 modal guard kept; IAF-21 F one focus owner). The CP-02 **read-only-view guard is removed** (`StudioHeader.tsx:336`, and the same check in the event door `:355`) — OD-18-2 decided (SC-22).
- **Scope:** opened from an area other than Editor (CMS, Assets, Brand, Site settings, Templates, Components), the chip **"In {Area}"** is pre-applied: that area's items, plus Areas & tasks. ✕ removes it → everything *(DS; makes the legend's old promise true)*.
- **First use:** no Recent group; the list starts at Areas & tasks.

### 5.2 Index (target; ✓ = today, NEW = added)
| Type | Source | Row | Note |
|---|---|---|---|
| Actions ✓ | SC-3 registry + `defaultCommands.ts` | label, chord, reason | selection-aware; one label per SC-3/SC-11. **AI rows (Generate a section / "Generate a block with AI…", Ask AI, Open AI assistant, Improve with AI) hidden (SC-21)** |
| Areas & tasks ✓ | CP:120-146 | "Brand", "Publish" | label = SC-11 noun; "Open" prefix dropped *(DS)*, kept as keyword |
| Pages ✓ | `usePageCommands.ts` | "Menu", "Home" + Home badge | nested under "Go to page ›" when idle |
| Layers ✓ | CP:337-356 | name · page | current page today; **other pages NEW after K-7** (switches page, then selects); fallback = current page only |
| Components **NEW** | `composer.components` (`engine/Composer.ts:237`) + library (K-4) | name · "Main" / "Library" | Enter = select main in Components area; ⌥↵ = insert an instance after the selection; not loaded yet → "Loading components…" |
| Records ✓ → **Fix** | CP:464-494 → server search (K-5) | title · collection | hidden for roles without CMS (resource not accessible, IAF-20) |
| Page templates ✓ | CP:323-331 | name · Pro chip | opens its preview (Panel 15) |
| Assets ✓ | CP:357-368 | name · type | opens Assets on it |
| Settings **NEW** | `SETTINGS_SCREENS` (module-local at `SettingsTab.tsx:116` — must be exported) | "SEO · Site settings" | so Settings' own "Search everywhere" hand-off finds settings |
| Properties ✓ | `inspector/hooks/usePropertyJump.ts` | "Font size · Typography" | only with a selection |
| Permissions ✓ *(R-1018, T1-29 — index row only)* | CP:163-169 | "Permissions" (Areas & tasks group) | opens today's Permissions dialog; its content contract is **not** designed here (open, see §14) |
| Help ✓ | CP:145 | Keyboard shortcuts, Getting started | Getting started NEW here |

### 5.3 Ranking *(DS)*
Never match on group names (Fix CP-07). Per item, best tier wins: **1** exact label · **2** label starts with query · **3** a word starts with query · **4** initials ("ss" → Site settings) · **5** substring in label · **6** keyword/alias. Ties: in-scope / selection-relevant first → in Recent → shorter label → alphabetical. Output: **Top result** (one row, best tier 1–3 hit), then groups in the canonical order (§4), **≤5 rows each + "Show all N ›"** (nested). Result count announced (polite).

### 5.4 Keys inside the palette
- ↑/↓ move the highlight (disabled rows included); Enter runs; **→ opens a nested level only when the highlighted row has › and the caret is at the end of the input** — otherwise → moves the caret.
- **Backspace on an empty field:** first leaves the nested level (one level per press); at the root it removes the scope chip; otherwise nothing.
- **Esc closes the palette at any level** (SC-2 step 2, unchanged — no new exception). Focus returns to the invoking control.

### 5.5 Run and outcome
- Enter / click runs and closes; **focus goes to the destination** (area's local nav or first field, task header, selected element on the canvas); areas follow SC-1 (direct entry → "‹ Back to Editor · {page}"), tasks follow Panel 12. The run is recorded in Recent (keyed per user and site *(DS)*; Fix CP-05).
- **Action fails after Run** (server error, conflict): the palette is already closed; the action's own error appears where it lands — toast "Couldn't {action} — {reason} · Retry" — and nothing is recorded in Recent.
- Destructive actions use Undo, never a confirm (SC-15). **Clear history** clears at once with toast **"History cleared · Undo"**; Undo restores the cleared stack — after K-8; until then chrome-ui confirm (E-5).
- **⌥↵ insert into a locked target** (SC-14): the row is disabled "Locked — unlock to edit" when the insert point is inside a locked element; nothing is inserted.

### 5.6 Disabled with reason (SC-6, SC-18, IAF-20)
Every row reads one **capability result** (K-2): enabled · disabled (role, lock, selection, offline, plan) · hidden (feature off by policy, resource the user cannot access). Disabled rows stay reachable by arrows, `aria-disabled`, reason inline after an em dash. **Enter on a disabled row** keeps the palette open and announces the reason (assertive) — Fix CP-08. The label is muted; the **reason text keeps ≥4.5:1 contrast** (the row is not faded as a whole, Fix CP-08). Plan rows use SC-18/SC-20: during the trial "Pro · included in your trial"; after it "Available on Pro · Upgrade" (Upgrade runs) / "Ask the workspace owner to upgrade".

### 5.7 No match
"No results for 'q'" + rows the user may actually run: "Ask AI ›" — **not in this version (SC-21); returns with the AI Build tab**. **"Search stock photos for 'q' ›"** (only if Assets is writable), **"Search everywhere ›"** (only while scoped). Enter = first of these; none available → Enter does nothing and the line adds "Check the spelling or try a shorter word" (Fix CP-10).

### 5.8 Assets ⌘K (resolves CP-14 / M09-A3.38)
⌘K has one meaning: the palette, **scoped "In Assets"** when opened from the Assets area, so it still searches assets first. **/** focuses the search field of the current area or panel (Add, Layers, Assets, CMS, Templates) — a new single-key (SC-12 row, §11), off with the toggle. LibraryManager stops binding ⌘K.

### 5.9 Shortcuts sheet
Opens from `?`, ⌘/, Help › Keyboard shortcuts, palette, ⋯ menu. Rows are **generated from one shortcut table** = SC-12 + registry chords (K-1); a test checks printed key = bound key, **except browser-native Text rows** (⌘B bold, ⌘I italic, ⌘⇧V paste as plain text, field ⌘Z), which are printed for reference and owned by the browser. Platform toggle defaults to the detected platform (`navigator.userAgentData.platform`, fallback user agent) and changes only the printout. Condition-aware rows: feature off → muted with reason ("Reviews are off for this site"); role cannot → "Editing needs Editor access". ****Canvas modifiers** *(R-1018, T2-37 — existing gestures, listed so they stay discoverable after the legend card is retired)*: the sheet's BASICS group carries reference rows (no binding check, like the browser-native Text rows): "Hold ⌥ / Alt while hovering — show parent and element" (INV 5.2) · "Hold ⌘ / Ctrl and drag — duplicate" (INV 5.4) · "Drag the grip left of an element — move it" (INV 5.6) · "While resizing: ⇧ keep ratio · ⌥ / Alt from centre · Ctrl toggle grid snap" (INV 6.7; the printed key follows the platform toggle once the binding is read from the K-1 table). **Single-key toggle** off → every single-key binding (SC-12 list incl. `?`, `/` and type-ahead) stops at once and rows show "off"; ⌘/ still opens the sheet; stored per user (K-3), default on. Search matches label, displayed chord and scope. `?` closes the sheet only when the search field is not focused (today's rule kept).

### 5.10 Help popover
Rail Help click / Enter → popover; ↑↓ moves; Esc closes and returns focus to rail Help. "Keyboard shortcuts" opens the sheet (popover closes first); "Getting started" shows/replays the checklist (Panel 16 §5) — hidden in view mode.

## 6. States and permissions

| Who / state | Palette | Sheet | Help |
|---|---|---|---|
| Owner / Admin / Editor | full index, per-row capability | full | both rows |
| Viewer (SC-6) | **opens** (Change CP-09): Layers, Assets (read-only), pages, History, Review/Activity (read-only), Preview, Help; area rows CMS, Brand, Components disabled **"{Area} needs Editor access"** (rail wording), Site settings **"Site settings needs Editor access"** (SC-28 pattern *(R-1018)*); edit actions disabled "Editing needs Editor access"; records/components hidden | full, edit rows muted "Editing needs Editor access" | Keyboard shortcuts only |
| Owner read-only view mode | Viewer set + "Exit view mode" row (OD-18-2, decided SC-22) | full | Keyboard shortcuts only |
| Site locked (over the Free limit, SC-20) | Viewer set; edit rows disabled "Over the Free limit — Upgrade to edit" (owner) / "Ask the workspace owner to upgrade"; Delete allowed (OD-PL-7) | edit rows muted with the same reason | both rows |
| Offline | navigation runs; writes needing the server disabled **"Needs a connection"** (Panel 22 §5.3 list and string; the offline announcement is Panel 22's, the palette adds none) *(R-1018, CS-10, D3-17; was "Can't do this while offline")* | — | — |
| ⌘K in an uncommitted field / inline text | commit per SC-17, then open; invalid field → stays, no palette | — | — |
| Components not loaded yet (`isLoaded()` false) | Components group shows "Loading components…"; rows arrive when loaded | — | — |
| Loading records | "Loading records…" (no flash under 300 ms) | — | — |
| Index fetch failed | group line "Couldn't load records · Retry" | — | — |
| First use | no Recent group | — | — |
| Action failed after Run | toast at destination (§5.5); not added to Recent | — | — |
| Modal open | refuses to open | refuses | — |
| Session expired | SC-18 re-sign-in dialog wins (IAF-21 F priority) | — | — |

## 7. Content and copy
- Placeholder: "Search actions, pages, layers, records…" (Change — names what is searched first).
- Reasons, sentence case, one wording everywhere (Fix CP-08): "Select an element first" · "Select two or more elements" · "Select a group" · "Nothing copied" · "Nothing to undo" · "Nothing to redo" · "Locked — unlock to edit" (SC-14) · "{Area} needs Editor access" (incl. "Site settings needs Editor access" — SC-28, no special case *(R-1018)*) · "Editing needs Editor access" · "Over the Free limit — Upgrade to edit" · "Needs a connection" *(R-1018)* · "Pro · included in your trial" · "Available on Pro · Upgrade" / "Ask the workspace owner to upgrade" · "Reviews are off for this site".
- Nouns per SC-11 ("Page template", "Release", "Brand", "Record"); no "Open …" prefixes on area rows.
- Footer: "↑↓ Move · ↵ Run · → Open · Esc Close · ? Keys" (Fix CP-12).
- Toasts: "History cleared · Undo" (after K-8; until then chrome-ui confirm, E-5); "Couldn't {action} — {reason} · Retry".
- Sheet toggle hint: "A, L, M, D, B, P, T, S, U, H, R, C, ? and / work without ⌘/Ctrl. Turn off if you use speech input or switch control."
- Help: tooltip "Help"; rows "Keyboard shortcuts", "Getting started".

## 8. Geometry and accessibility (NOT MEASURED)
| Element | Value |
|---|---|
| Palette | 640w (`max-w: 100vw−32`), top 48, max-h `min(800, 100vh−96)`; input 48; rows 32; group label 24; footer 32 |
| Sheet | 720w bounded, header 56, max-h 80vh, body scrolls; rows 32, key chip 24h mono |
| Help popover | 240w, rows 32, 8 from rail edge |
- Palette: combobox + listbox; **options are not Tab stops** (today each row is a `Button`, CP:701-725) — Tab moves input → footer links; `aria-expanded` reflects whether rows exist (today always true, CP:627); groups `role=group` + `aria-labelledby`; result count and disabled reasons via live region; reason text ≥4.5:1.
- Platform glyphs carry text alternatives ("Command K"); 200% text: rows wrap to 2 lines, chips stay right.
- Focus: on close via Esc → invoking control; after Run → destination (§5.5). No motion except a **100 ms** fade (DS §2.10 motion token; was 120 ms) — under reduced motion the palette appears and closes with no fade *(R-1018, V5 / CS-19)*.
- Every key in the sheet passes the SC-12 browser acceptance; a key a browser does not pass is removed for that browser (SC-12).

## 9. Preservation map
| Old | New | Disposition |
|---|---|---|
| CP-01 ⌘K, ⌘⇧P, Search-everywhere hand-offs | Same + sheet header link | Keep + extend |
| CP-01 ⋯ row "Command palette ⌘K" | ⋯ menu header entry "Search ⌘K" (replaces the row) | Move (Panel 01 §6 amended) |
| CP-04 static "Scope: everything" chip | "In {Area}" scope chip, removable | Redesign |
| CP-05 Recent (5) | Same, per user + site | Keep + Fix |
| CP-05 opening bands incl. every page | Recent · For {selection} · Areas & tasks · Help; pages under "Go to page ›" | Redesign (same rows reachable) |
| CP-06 every indexed type | Same + components, settings screens; layers on other pages after K-7 | Keep + extend |
| CP-07 substring + band order | Ranked tiers, Top result, 5 per group + Show all, one canonical order | Redesign |
| CP-08 disabled rows + reasons | Same, consistent copy, readable reason, Enter announces | Keep + Fix |
| CP-09 viewer hiding | Disabled with reason; viewers get the palette | Change (SC-6/SC-18) |
| CP-10 stock + Ask AI on no match | Stock only for Assets writers; + Search everywhere; Ask AI hidden while SC-21 | Keep + Fix (AI deferred, SC-21) |
| CP-14 ⌘K focuses Assets search | Palette scoped to Assets; area search on `/` | Change |
| CP-16 Clear history behind `window.confirm` | chrome-ui confirm until K-8; then clears at once, "History cleared · Undo" (SC-15) | Change (conditional on K-8) |
| KS-01…04 sheet, doors, search, platform | Same, generated from one table, platform toggle, scope column | Keep + Fix |
| KS-05 untrue rows | Condition-aware rows; I not listed while SC-21 | Fix |
| — single-key toggle | NEW in the sheet (SC-12) | NEW |
| HP-01 Getting started in ⋯ | ⋯ row kept + Help popover row | Keep + extend |
| **LG-01…04 Keyboard legend card** (`KeyboardLegend.tsx`, board 4418:126882) | **Removed as a surface.** Its rows move, corrected to SC-12, into the sheet's BASICS group; its door is replaced by the Help popover; "All shortcuts ›" becomes the popover's "Keyboard shortcuts" row | **Removal — IAF-21 K amendment** (IAF-21 K said "Keep … help/legend/replay"; Panel 02 LR-07 "Keep + extend" is superseded for the card) |

**One removal: the Keyboard legend card** (row above; content kept in the sheet). No other capability removed.

## 10. Owner decisions and planned
Decided 2026-10-17 (no longer open): Esc closes at any level (SC-2 unchanged); Clear history uses Undo after K-8, until then chrome-ui confirm (E-5); ⌘K Global incl. Field; `/` new single-key; legend card retired as an IAF-21 K amendment; ⋯ header "Search ⌘K" replaces the menu row.
**Decided (SC-22):** **OD-18-2** — the palette opens in the owner's read-only view mode with the Viewer set + an "Exit view mode" row; the CP-02 read-only guard (`StudioHeader.tsx:336`) is removed. **OD-18-3** — no topbar ⌘K button; visibility comes from the ⋯ menu header entry, the sheet header and the palette footer; rail Help tooltip stays "Help".
- Reserved, not designed: actions with parameters beyond page pickers ("Set width 640"), natural-language AI commands inside the palette, user-customisable shortcuts.

## 11. Engineering dependencies and register text

**SC-9 rows (add):**
| ID | Dependency | Fallback until shipped |
|---|---|---|
| K-1 | One **shortcut table as data** (SC-12 rows: id, keys per platform, scope, single-key flag, condition) used by key handlers, sheet and palette | Sheet keeps registry + `CHROME_CHORDS` (KR:109-161) updated by hand to SC-12 "Now"; a test asserts every printed key is bound (browser-native Text rows exempt) |
| K-2 | **Capability resolver** (IAF-20 E: role, site flag, plan, lock, selection, offline → enabled / disabled + reason / hidden) shared by rail, menus, palette, shortcuts | Palette computes reasons locally (today's `guard`, CP:180-186) + role and plan checks; never hides a row it could disable |
| K-3 | Per-user server **preference** "single-key shortcuts" (cross-device) | localStorage keyed by user id; default on |
| K-4 | Library component query incl. current-site-only (= existing SC-9 row "Library revisions + library query") | Current-site components only, no "Library" rows |
| K-5 | **Record search endpoint** (display field, paginated, ACL-filtered) | Today's per-collection client load (CP:464-494), capped at 200 records per collection, then "Search in CMS ›" |
| K-6 | Read-only gate covers quick-add commands (§13.2) | Palette disables Add rows itself when read-only |
| K-7 | **Cross-page layer index** (element names of every page without loading each page onto the canvas) | Layers group searches the current page only (today) |
| K-8 | `history.clear()` keeps the cleared stack restorable while the Undo toast is shown | **Until K-8 the existing confirm stays** (chrome-ui dialog replacing `window.confirm`, declared SC-15 exception — clearing would otherwise be irreversible with no warning); row stays under typed search only |
| ⛔ P-TRIAL | (existing, SC-20) effective-plan resolver + `trialEndsAt` | Plan chips as today (Free/Pro, no trial copy); T-CP-07 BLOCKED |

**SC-12 rows (add to the table):**
| Action | Was | Now | Scope | Why |
|---|---|---|---|---|
| Command palette | ⌘K / ⌘⇧P (any focus except read-only view) | **⌘K** + ⌘⇧P alias | **Global incl. Field and Text** (declared exception, like F6) — an uncommitted field commits first (SC-17) | ⌘K has no text/field meaning in the editor. **Ctrl+K on Windows Chrome/Firefox is address-bar search** — must pass the three-browser acceptance; where it doesn't, that browser documents Ctrl+Shift+P |
| Focus area search | ⌘K (Asset library only) | **/** | Global (single key; off with the toggle) | gives ⌘K one meaning; `/` is the web search convention |

**SC-12 single-key bullet (replace):** "**Single-key shortcuts** (A L M D B P T U H R C ? / and type-ahead — S removed, owner Q4 *(R-1018b)*; I inactive while SC-21) can be turned off: **Shortcuts dialog › "Single-key shortcuts" on/off** (WCAG 2.1.4). Default on. ⌘/ always opens the dialog."

**SC-10 rows (add):**
| Amendment | Source | Panel |
|---|---|---|
| Keyboard legend card retired; rows → shortcuts sheet BASICS; rail Help → Help popover (removal) | IAF-21 K / Panel 02 LR-07 | 18, 02, 16 |
| ⋯ menu "Command palette ⌘K" row → menu header entry "Search ⌘K" | SC-18 / Panel 01 §6 | 18, 01 |
| Viewers get the palette, disabled-with-reason rows | SC-6 / SC-18 / IAF-20 E | 18, 00 |
| ⌘K in Assets opens the palette scoped "In Assets"; `/` focuses area search | IAF-09 M09-A3.38 | 18, 08 |
| Clear history: no confirm, "History cleared · Undo" — after K-8; until then chrome-ui confirm (E-5) | SC-15 | 18 |

**IAF-21 amendment note (insert under §K):**
> **Amended 2026-10-17 by Panel 18 §9:** the Keyboard legend card (`KeyboardLegend.tsx`, board 4418:126882) is **removed** as a separate surface. Its rows move, corrected to SC-12 and the user's platform, into the Keyboard shortcuts sheet's BASICS group; rail Help opens the Help popover (Keyboard shortcuts · Getting started). Help dialog, replay, dismiss, achievement and the seven step IDs are unchanged.

## 12. Acceptance (specified, NOT RUN)
| ID | Case |
|---|---|
| T-CP-01 | ⌘K opens from canvas, Layers, an Inspector field and inline text; ⌘⇧P opens the same palette; ⌘K again closes; with a confirm dialog open nothing opens |
| T-CP-02 | Empty palette on a 40-page site shows ≤5 Recent, the selection group, Areas & tasks, Help — no per-page rows; "Go to page ›" lists all 40. Fresh user: no Recent group |
| T-CP-03 | "set" puts "Site settings" as Top result; groups follow the canonical order; "more" returns no "More" group |
| T-CP-04 | "seo" returns "SEO · Site settings"; Enter opens Site settings › SEO with focus in its first field; Back reads "‹ Back to Editor · {page}" |
| T-CP-05 | With nothing selected, "group" shows "Group — Select two or more elements"; Enter keeps the palette open and the reason is announced; reason text measures ≥4.5:1 |
| T-CP-06 | Viewer: ⌘K opens; "Brand" row reads "Brand needs Editor access"; no record rows; Enter on "Duplicate" announces "Editing needs Editor access" |
| T-CP-07 | **BLOCKED by P-TRIAL.** During trial "Custom code" row shows "Pro · included in your trial"; on Free after trial "Available on Pro · Upgrade" |
| T-CP-08 | No match shows no "Ask AI ›" for any role (SC-21); stock row only for Assets writers |
| T-CP-09 | From Assets, ⌘K opens scoped "In Assets"; Backspace on the empty field clears the scope; the Assets search field does not react to ⌘K; / focuses it; with single keys off, / does nothing |
| T-CP-10 | A component name returns its row; Enter selects the main in Components; before components load the group shows "Loading components…"; ⌥↵ with a locked element selected is disabled "Locked — unlock to edit" |
| T-CP-11 | In "Move to page ›": Backspace on the empty field returns to the root list (scope chip, if any, still present); a second Backspace removes the scope; Esc at the nested level closes the palette and focus returns to the invoker |
| T-CP-12 | → on a highlighted "Go to page ›" with the caret at the end opens the level; with the caret mid-text, → moves the caret |
| T-CP-13 | Screen reader: arrows announce the active option; Tab does not walk the rows; result count announced after typing |
| T-CP-14 | Typing in a width field then ⌘K: the value commits as one Undo step and the palette opens; an invalid value stays with its error and no palette |
| T-CP-15 | Before K-8: "Clear history" asks a chrome-ui confirm (no `window.confirm`). After K-8: clears at once, toast "History cleared · Undo", Undo restores ⌘Z steps |
| T-CP-16 | An action that fails after Run shows "Couldn't {action} — {reason} · Retry" and is not added to Recent; Recent differs per user and per site |
| T-CP-18 | Owner view mode: ⌘K opens the Viewer set; "Exit view mode" runs. Site over the Free limit: edit rows read "Over the Free limit — Upgrade to edit" (owner) / "Ask the workspace owner to upgrade"; Delete runs |
| T-CP-17 | Ctrl+K on Windows Chrome, Firefox, Edge opens the palette, not address-bar search (SC-12 acceptance) — else documented as Ctrl+Shift+P for that browser |
| T-CP-19 *(R-1018b, Q4, Q5)* | The sheet lists no Site settings key and no S single key; it lists "Focus mode — hide all panels ⌘\" under VIEW; pressing ⌘\ twice restores the same panels; Esc in focus mode does not show the panels |
| T-KS-01 | Every non-Text row in the sheet is bound to the printed key on the shown platform (automated cross-check, K-1) |
| T-KS-02 | Windows: sheet shows Ctrl/Alt, Time Travel Alt+Shift+T, Zoom to fit ⇧1 (SC-12 "Now") |
| T-KS-03 | Reviews off: R and C rows muted "Reviews are off for this site" and the keys do nothing; I is not listed and does nothing (SC-21) |
| T-KS-04 | Single-key off: A, L, H, ?, C, / do nothing; ⌘/ still opens the sheet; the setting survives reload (and another device after K-3) |
| T-HP-01 | Rail Help shows exactly Keyboard shortcuts + Getting started; tooltip "Help"; Esc returns focus to rail Help; view mode hides Getting started; no legend card exists |

## 13. Code defects found during this inventory (engineering, not design)
1. **Viewer filter is dead code:** the palette never mounts in read-only view (`StudioHeader.tsx:336`), but `viewerChrome` is true only in read-only view (`useEditorRole.ts:34-38`), so `isTabAllowedForViewer` in the palette (CP:148-156,449) never hides anything.
2. **Quick-add escapes the read-only gate:** `add-text/heading/image/button/container` are not in `MUTATING_COMMANDS` (`CommandCenter.ts:67-73`) and insert through `ELEMENT_QUICK_ADD` (`defaultCommands.ts:657-691` → `useEditorEventListeners.ts:246-258`); any read-only caller of `commands.run("add-text")` writes.
3. **⌘K bound twice in the Asset library** (`StudioHeader.tsx:329-347` on document, `LibraryManager.tsx:163-166` on window; no `stopPropagation`).
4. **Legend "All shortcuts ›" is detached** from its card — fixed at the viewport's bottom-right (`KeyboardLegend.tsx:98-107`).
5. **Legend copy is untrue:** "scope follows the open panel" (`KeyboardLegend.tsx:24`) vs the static chip (CP:652-657); macOS glyphs on every platform (`:20-31,93`).
6. **Sheet rows disagree with bindings:** R and C listed when reviews are off, I bound but missing — now moot while SC-21 hides AI (I does nothing) (KR:100-107,157; `useSidebarKeyboard.ts:53-58`; `useEditorShortcuts.ts:117-125`).
7. **Rail Help tooltip** says "Keyboard shortcuts · ?" but the click opens the legend and `?` opens the sheet (`LeftSidebar.tsx:451-455`).
8. **Disabled row Enter is silent** (CP:497); the reason is faded with the row at 50% opacity (CP:716).
9. **No-match actions ignore permissions:** "Ask AI" / "Search stock photos" for any role; Enter falls to Ask AI (CP:537-544,585).
10. **Opening list floods:** one "Go to" row per page in the opening bands (`usePageCommands.ts:94-98` + CP:70).
11. **Records reloaded on every open** for every collection (CP:464-494).
12. **Listbox a11y:** `aria-expanded` always true (CP:627); options are tabbable `Button`s (CP:701-725); legend `role=dialog` without focus management (`KeyboardLegend.tsx:64-69`).
13. `navigator.platform` (deprecated) used for platform detection (CP:405, `KeyboardCheatSheet.tsx:35-36`, `SiteMenu.tsx:84`).
14. `Clear history` uses `window.confirm` (CP:292-298), outside the chrome-ui dialog system and SC-15.

## 14. Review and not verified
Independent `design-qa-critic` review: pass 1 PROPOSAL (B1–B4 + N1–N14) — all fixed 2026-10-17 (B1 Esc closes at any level; B2 Clear history → Undo; B3 SC-12 rows written in §11; B4 legend card named as a removal and an IAF-21 K amendment); pass 2: 4 blocking fixed 2026-10-17 (SC-21 no AI rows/key I; OD-18-2/3 decided per SC-22; over-limit locked-site state).
*(R-1018)* **Not applied (needs a decision):** T1-29 Permissions dialog contract (content, roles, Delete site door) — only the palette index row is added; T3-19 Saves filter and Session keys j/k/g/G (list them or Defer); ~~T1-11 ⌘\ Inspector toggle~~ — **decided by owner Q5** *(R-1018b)*: ⌘\ = focus mode (hide all panels), SC-12 row + this sheet's VIEW group; exit = ⌘\ again (Esc keeps its SC-2 meaning).
**Drift found in other panels (not edited here):** Panel 01 §8 line 199 still lists ⌘H as an unchanged shortcut, and Panel 12 RT-09 (line 31) says "H / ⌘H History" — both conflict with SC-12 (⌘H removed; H + "Versions ›"). Panel 01 §6 "Command palette ⌘K" row and Panel 02 LR-07 "Keep + extend" are superseded by the SC-10 rows above.
Not verified: runtime behaviour of any door or of the CP-14 double binding, palette/sheet geometry, contrast values, screen-reader output, which SC-12 "Now" keys browsers pass (incl. Ctrl+K on Windows), record-search performance on large collections. No Figma board exists for the target states; the as-built boards cited in code (4418:141220 palette, 7575:195538 sheet, 4418:126882 legend) were not opened in this pass. Code facts are from a source read on 2026-10-17 (file:line above), not from running the app.
