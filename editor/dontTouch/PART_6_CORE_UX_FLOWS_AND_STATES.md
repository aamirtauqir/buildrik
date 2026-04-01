# PART 6 — CORE UX FLOWS AND STATES

> Extracted from `prd_final.md` — Sections §18, §19, §20, §21, §24, §25, §26, §29, §5G, and state tables scattered across §9–§16.
> Anti-downgrade rule: **Current capability is the FLOOR, not the ceiling.**

---

## Table of Contents

1. [Primary Workflows](#1-primary-workflows)
2. [Navigation Flows](#2-navigation-flows)
3. [Add / Create / Insert Flows](#3-add--create--insert-flows)
4. [Select / Edit Flows](#4-select--edit-flows)
5. [Responsive Design Flows](#5-responsive-design-flows)
6. [History / Restore Flows](#6-history--restore-flows)
7. [Preview / Publish / Export Flows](#7-preview--publish--export-flows)
8. [AI and Collaboration Flow Logic](#8-ai-and-collaboration-flow-logic)
9. [Panel State Machine](#9-panel-state-machine)
10. [Selection State Machine](#10-selection-state-machine)
11. [Save / Sync State Machine](#11-save--sync-state-machine)
12. [Empty / Loading / Error / Success States](#12-empty--loading--error--success-states)
13. [Accessibility Flows](#13-accessibility-flows)
14. [Edge Cases and Fallback Behavior](#14-edge-cases-and-fallback-behavior)
15. [Anti-Confusion Rules](#15-anti-confusion-rules)
16. [Motion Principles](#16-motion-principles)
17. [Default Canvas Content States](#17-default-canvas-content-states)
18. [Anti-Regression Warnings (Flows & States)](#18-anti-regression-warnings-flows--states)
19. [Source Notes and Unclear Items](#19-source-notes-and-unclear-items)

---

## 1. Primary Workflows

> Source: §18.1–18.4

### 1.1 New User First Session (target: < 10 min to publish)

| Step | User Action | UI Surface | Result | Onboarding Step |
|------|------------|-----------|--------|----------------|
| 1 | First visit → editor loads | WelcomeModal (§5G) | Modal: `"Welcome to Buildrik!"` with name input + `[Browse Templates]` primary + `[Start Blank]` ghost | — |
| 2 | Clicks `[Browse Templates]` | Templates tab opens in sidebar | Template grid visible, 12+ templates with category pills | — |
| 3 | Clicks template card → preview | TemplatePreviewModal | Full-screen preview with `[Use This Template]` primary + `[Cancel]` | — |
| 4 | Clicks `[Use This Template]` | ApplyProgressOverlay | Modal: `"Applying template..."` progress bar → canvas populated with template content | Step 1 (`add-element`) auto-completes |
| 5 | Presses `A` or clicks Build rail icon | Build tab opens | Element catalog visible. OnboardingChecklist appears bottom-right: step 2 highlighted `"Drag an element to canvas"` | Step 2 active |
| 6 | Drags element card to canvas | Canvas CS-7 → drop → CS-4 | Element inserted, selected. SpotlightOverlay may highlight inspector. | Step 2 complete → AchievementPrompt `"Element added!"` |
| 7 | Double-clicks text element | Canvas CS-6 (inline editing) | Blinking cursor inside text. Inline formatting toolbar visible. | Step 3 active: `"Edit some text"` |
| 8 | Types new text, clicks outside | Canvas CS-4 | Text committed. Inspector shows element properties. | Step 3 complete → AchievementPrompt `"Text edited!"` |
| 9 | Inspector → Style tab → Typography → Color swatch | Color picker popover | User picks new color → live update on canvas | Step 4 active: `"Change a style"` |
| 10 | Closes color picker | Inspector | Style applied. | Step 4 complete → AchievementPrompt |
| 11 | Presses Ctrl+P | New browser tab opens | Preview of site | Step 5 active: `"Preview your site"` → auto-complete |
| 12 | Returns to editor, presses `U` | Publish tab opens | Pre-publish checklist visible. `[Publish Site]` primary button | Step 6 active: `"Publish your site"` |
| 13 | Clicks `[Publish Site]` | Publish tab → publishing state | Button: `"Publishing..."` → success → URL shown | Step 6 complete |
| 14 | Publication succeeds | Toast + AchievementPrompt | Toast: `"Site published!"` + AchievementPrompt: `"Your site is live!"` with confetti animation + link to open | Checklist 100% complete |

### 1.2 Power User Daily Session

| Step | User Action | UI Surface | Result |
|------|------------|-----------|--------|
| 1 | Opens editor URL | Shell loads | Auto-save loaded from last session. Canvas shows last state. Top bar: `"Auto-saved 2m ago"` |
| 2 | Presses Ctrl+K | Command Palette | Palette opens. Types `"layers"` → `"Open Layers"` highlighted |
| 3 | Presses Enter | Layers tab opens | Element tree visible. Canvas shows element outlines |
| 4 | Clicks element in Layers tree | Canvas CS-4 | Element selected on canvas. Inspector populates. Canvas scrolls/zooms to show element |
| 5 | Inspector detects flex container | Inspector Layout tab | Auto-scrolls to Flexbox section (expanded). Flex controls visible |
| 6 | Changes `gap` value to `24px` | Inspector → Flexbox → gap input | Canvas live-updates: gap between flex children changes in real-time |
| 7 | Presses `D` | Design System tab opens | Color tokens section visible |
| 8 | Clicks color token → edits value | Color picker → new value | DraftChip appears: `"1 draft"` pulsing amber |
| 9 | Clicks `[Review Changes]` | Review modal | Modal shows diff: old color → new color, affected elements count |
| 10 | Clicks `[Apply All]` | Review modal closes | Canvas updates all elements using that token. Toast: `"1 token applied to 12 elements"` |
| 11 | Presses `H` | History tab opens | Versions view visible |
| 12 | Clicks `[Save current version]` | Inline version name input | Types `"v1.2 — color system update"` → Enter |
| 13 | Version saved | History tab | New version row appears with name + timestamp + `"Current"` badge |
| 14 | Presses Ctrl+P → reviews → closes tab | Preview | Site preview in new tab |
| 15 | Presses `U` → clicks `[Update Site]` | Publish tab | Publishing → success → Toast `"Site updated!"` |

### 1.3 CMS Data-Driven Page

| Step | User Action | UI Surface | Result |
|------|------------|-----------|--------|
| 1 | Presses `A` → Build tab → Data category | Build tab | Scrolls to "Data" category accordion |
| 2 | Drags `"CMS List"` element to canvas | Canvas CS-7 → drop | Element dropped → Collection Setup modal auto-opens |
| 3 | Names collection `"Blog Posts"`, adds fields | Collection Setup modal | Fields: Title (Text, required), Body (Richtext), Cover (Image), Published (Date) |
| 4 | Clicks `[Create Collection]` | Modal closes | CMS List element on canvas bound to `"Blog Posts"` collection. Preview data loaded |
| 5 | Clicks text element inside CMS List item | Canvas CS-4 → Inspector | Inspector shows text element. Style tab → Typography section |
| 6 | Clicks chain icon next to text content field | Binding dropdown | `"Blog Posts"` group → `Title`, `Body` fields listed |
| 7 | Selects `"Blog Posts.Title"` | Binding applied | Field shows `"BlogPosts.title"` in indigo. Canvas shows actual title from record 1 |
| 8 | Clicks image element → chain icon on `src` | Binding dropdown (image fields only) | Selects `"Blog Posts.Cover"` → image shows record 1 cover image |
| 9 | CMS preview navigator appears | Canvas above CMS List | `"Record 1 of 24"` with prev/next arrows |
| 10 | Clicks next arrow several times | Canvas | Content updates to show records 2, 3, 4... |
| 11 | Publishes | Publish tab | All CMS records rendered → site live with dynamic data |

> **⚠️ CODE-VERIFIED NOTE:** The CMS engine is fully implemented (CollectionManager, CMSBindingManager, 14 field types), but **no frontend UI entry points exist**: there is no "Data" category in the Build catalog (`catalog.ts` has 7 categories: basic, layout, forms, media, sections, ecom, advanced), no chain icon binding UI in the inspector, and no CMS card in Settings. This flow is aspirational — the engine supports it but the UI to trigger it is not wired.

### 1.4 Responsive Design Workflow

| Step | User Action | UI Surface | Result |
|------|------------|-----------|--------|
| 1 | Designs on Desktop (default) | Canvas at 1440px width | Full desktop layout |
| 2 | Clicks `Tablet` in top bar device switcher (or Ctrl+2) | Device switcher + Canvas | Canvas resizes to `768px` width. Device indicator: "Tablet" active pill |
| 3 | Selects flex container element | Inspector → Layout tab | Flexbox section expanded. BreakpointIndicator ROW 5: "Tablet" pill active |
| 4 | Changes `flex-direction` from `row` to `column` | Inspector → Flexbox → direction control | Canvas live-updates: children stack vertically. Indigo override dot (`--aqb-primary`) appears next to `flex-direction` label |
| 5 | Adjusts `font-size` from `48px` to `32px` for heading | Inspector → Style tab → Typography | Indigo override dot (`--aqb-primary`) appears. Hover on dot: `"Overridden at tablet. Desktop value: 48px"` |
| 6 | Clicks `Mobile` in device switcher (or Ctrl+3) | Canvas resizes to `375px` | BreakpointIndicator: "Mobile" active. Inherited tablet overrides shown in italic/dimmed |
| 7 | Makes mobile-specific adjustments | Inspector | Additional indigo override dots for mobile overrides |
| ~~8~~ | ~~Clicks `Watch` in device switcher (or Ctrl+4)~~ | ~~Canvas resizes to `184px`~~ | **REMOVED — Watch breakpoint does not exist. Only 3 breakpoints: Desktop (1440px), Tablet (768px), Mobile (375px).** |
| 9 | Returns to `Desktop` (Ctrl+1) to verify | Canvas at 1440px | All changes preserved per breakpoint. No blue dots (desktop is base) |
| 10 | Ctrl+P → Preview in new tab, resizes browser | Preview tab | Responsive CSS applied. Layout adapts at breakpoint boundaries |

---

## 2. Navigation Flows

### 2.1 Panel Opening via Rail

**Trigger:** Click rail icon, or press keyboard shortcut (A, T, Z, P, Shift+A, J, D, S, U, H).

**Flow:**
1. Rail icon receives click or shortcut fires
2. If panel is `closed` → transition P1: panel slides in from left (`150ms ease`)
3. If panel is `open-unpinned` with same tab → transition P2: panel slides out
4. If panel is `open-unpinned` with different tab → transition P3: tab content swaps instantly, panel stays open
5. Focus moves to panel header on open

### 2.2 Panel Switching

**Flow (switching from Tab A to Tab B while panel is open):**
1. User clicks different rail icon (or presses shortcut)
2. Tab content swaps instantly (no animation — 0ms)
3. Rail: previous icon deactivates, new icon activates
4. Panel header: title changes to new tab name
5. Panel body: new tab content renders
6. Focus: moves to panel header of new tab

### 2.3 Command Palette Navigation

**Flow:**
1. Ctrl+K from anywhere
2. Palette appears (`150ms ease-out` entry)
3. Search input auto-focused
4. User types query → substring match (`.includes()`) → results update immediately (no debounce)
5. Arrow Down/Up to navigate results
6. Enter to execute → palette closes → command executes → focus returns to previous element
7. Escape to close without action

---

## 3. Add / Create / Insert Flows

### 3.1 Drag from Sidebar to Canvas

**Flow:**
1. User mousedown on element card in Build tab
2. Drag ghost appears: element card thumbnail (`opacity: 0.8; pointer-events: none; z-index: 2000`)
3. Canvas enters CS-7 (Drag from sidebar) state
4. Drop zones appear on canvas:
   - Valid drop zone: `border: 2px dashed #14b8a6; background: rgba(20,184,166,0.06)` (teal)
   - Invalid drop zone: `border: 2px dashed #ef4444; background: rgba(239,68,68,0.06)` (red)
   - Slot indicator: `height: 2px; background: #14b8a6` between siblings
5. User drops on valid zone → element created at drop position
6. Canvas transitions to CS-4 (element selected)
7. New element: indigo outline + resize handles + floating toolbar
8. Inspector: IS-2 (full inspector for new element)
9. `aria-live` announces: `"[Element type] added to canvas"`

### 3.2 Click to Insert

**Flow:**
1. User single-clicks element card in Build tab (instead of dragging)
2. Element inserted at canvas center (or after currently selected element if one is selected)
3. Same post-insert behavior as drag: CS-4, inspector populates, aria announcement

### 3.3 Create Component from Selection

**Flow:**
1. User selects element(s) on canvas
2. Right-click → "Create Component" from context menu
3. CreateComponent modal opens:
   - Name input (required)
   - Preview frame showing selected element(s)
   - [Create] primary + [Cancel] ghost
4. On create: element(s) wrapped in component instance. Component added to Components tab library.
5. Toast: `"Component '[name]' created"`

---

## 4. Select / Edit Flows

### 4.1 Single Selection Flow

**Flow:**
1. Click element on canvas (or click in Layers tree, or select via context menu)
2. Element gets: `2px solid #6366f1` outline + 8 resize handles + floating toolbar
3. Inspector: IS-2 (populates with element properties)
4. Layers tree: corresponding node highlighted, auto-scrolls if offscreen
5. `aria-live`: `"[Element type] selected"`
6. If element is outside viewport: canvas auto-scrolls to center it

### 4.2 Inline Text Editing Flow

**Flow:**
1. Double-click text element (or press Enter with text element selected)
2. Element enters `contenteditable` mode
3. Outline changes to `#818cf8` (lighter indigo)
4. Floating toolbar → text formatting toolbar (bold, italic, underline, etc.)
5. Blinking cursor inside text
6. Inspector Typography section auto-expands
7. User types/edits text
8. Escape or click outside: text committed, element returns to `single` selected state

### 4.3 Multi-Select Flow

**Method 1 — Shift+click:**
- From single: Shift+click another → both selected
- From multi: Shift+click selected → removes (toggle)
- From multi: Shift+click unselected → adds
- Order preserved (first selected = primary for alignment)

**Method 2 — Marquee select (CS-9):**
- Mousedown on empty canvas + drag
- Marquee: `border: 1px dashed #6366f1; background: rgba(99,102,241,0.08)` with animated dash offset
- All elements whose bounding box **intersects** marquee are selected on release
- Zero intersection → selection cleared

**Method 3 — Ctrl+A (Select All):**
- All elements on current page selected
- Inspector: IS-3 (MultiSelectToolbar)

**Multi-select canvas visuals:**
- Each element: `2px solid #6366f1` outline (no individual resize handles)
- Group bounding box: `1px dashed rgba(99,102,241,0.4)` around all
- MultiSelectToolbar replaces floating toolbar
- Drag any selected element → all move together (maintaining relative positions)

### 4.4 Context Menu → Select from Stack

**Flow:**
1. User right-clicks on overlapping elements
2. Context menu opens → "Select from stack" submenu
3. Submenu lists all elements at click coordinates (topmost first)
4. Each entry: type icon + element name
5. Hover: teal highlight outline on canvas for hovered entry
6. Click: selects that element, closes entire menu
7. Uses `document.elementsFromPoint(clientX, clientY)`, filtered to canvas-managed elements

---

## 5. Responsive Design Flows

### 5.1 Breakpoint Switching

**3 supported breakpoints:**
- Desktop: 1440px (Ctrl+1) — base breakpoint, no override dots
- Tablet: 768px (Ctrl+2)
- Mobile: 375px (Ctrl+3)

**Flow:**
1. User clicks breakpoint in device switcher (or shortcut)
2. Canvas width animates to target width
3. Inspector ROW 5 (BreakpointIndicator): new breakpoint pill active
4. Properties that have overrides at this breakpoint: show indigo dot (`var(--aqb-primary, #6366f1)`, 6px)
5. Properties that inherit from wider breakpoint: show value in italic/dimmed
6. `aria-live`: `"Switched to [breakpoint] view"`

### 5.2 Breakpoint Override Editing

**Flow:**
1. Switch to non-desktop breakpoint
2. Change a property value in inspector
3. Indigo dot (`6px`, `var(--aqb-primary, #6366f1)`) appears next to property label
4. Hover dot → tooltip: `"Overridden at [breakpoint]. Desktop value: [value]"`
5. Right-click blue dot → "Reset to desktop value" option
6. Canvas live-updates with override applied

### 5.3 Pseudo-State Editing

**Flow:**
1. Select element → Inspector ROW 6 shows: Normal | Hover | Focus | Active | Disabled
2. Click "Hover" button
3. Inspector shows element's hover-state properties
4. Change a property (e.g., color, transform)
5. Amber dot (`#f59e0b`, 6px) appears on "Hover" button indicating overrides exist
6. Canvas preview: element renders in hover state while editing
7. Click "Normal" to return to base state
8. All hover overrides preserved

---

## 6. History / Restore Flows

### 6.1 Save Named Version

**Flow:**
1. Press `H` to open History tab
2. Click `[Save current version]` button
3. Inline dialog: version name input + [Save] + [Cancel]
4. Type name (required, max 64 chars) → Enter or click [Save]
5. New version row appears with name + timestamp + `"Current"` badge
6. Toast: `"Version saved: [name]"`

### 6.2 Restore Version

**Flow:**
1. Hover version row → `[Restore]` button appears
2. Click `[Restore]`
3. ConfirmDialog: `"Restore to [version name]? Your current changes will be saved as an auto-save first."`
4. Click `[Restore]`:
   - Current state auto-saved first
   - Canvas transitions (150ms overlay → content swap)
   - Canvas loads restored state
   - Toast: `"Restored to [version name]"` + `[Undo]` action button
   - Inspector: IS-1 (no selection)
   - History tab: restored version marked `"Current"`

### 6.3 Compare Versions

> **⚠️ CODE-VERIFIED NOTE:** Compare Versions is **NOT implemented**. No compare methods exist in `VersionHistoryManager.ts`, no split-view comparison component exists, and no `[Compare]` button is rendered in the History panel. This entire flow is aspirational.

**Flow (ASPIRATIONAL — not yet built):**
1. Hover version A → click `[Compare]`
2. Version A row highlights indigo
3. Panel shows: `"Select another version to compare"`
4. Click version B row
5. Canvas splits into two columns (draggable divider)
6. Diff colors: amber (changed), green (added), red (removed)
7. Footer: `"[N] changes between versions"` + `[Close Comparison]` + `[Restore Version A]` + `[Restore Version B]`
8. Click `[Close Comparison]` → canvas returns to current state

---

## 7. Preview / Publish / Export Flows

### 7.1 Preview Flow

1. Ctrl+P or click Preview button (Lucide `eye` in top bar)
2. `composer.exportHTML().combined` generates full HTML
3. HTML → Blob URL → `window.open(blobUrl, '_blank')`
4. Toast: `"Preview opened in new tab"` — info, 3000ms
5. If export fails: Toast error, no tab opened

### 7.2 Publish Flow

1. Press `U` to open Publish tab
2. Pre-publish checklist shown (hasContent, hasSeoTitle, hasMetaDesc, hasSocialImg)
3. Click `[Publish Site]` (or `[Update Site]` if already published)
4. Button → `"Publishing..."` with spinner
5. Success: Toast `"Site published!"` with `[Open site →]` link. Published URL shown in panel with copy button.
6. Failure: Toast error with `[Retry]` button. Error details shown in panel.

### 7.3 Export Flow

1. Ctrl+Shift+E opens Export modal
2. Select pages to export (checkbox list, all checked by default)
3. Click `[Download HTML + CSS]`
4. Button → `"Preparing download..."` with spinner
5. `ExportEngine.exportAllPages()` called
6. Browser auto-downloads ZIP
7. Button → `"✓ Download complete"` (3s) → reverts
8. Toast: `"Download complete — [filename].zip"`

---

## 8. AI and Collaboration Flow Logic

### 8.1 AIAssistantBar Flow

1. Ctrl+J → bar slides up from bottom (`200ms ease-out`)
2. Input auto-focused, placeholder varies by context
3. Quick suggestion chips shown below input (hidden when user types)
4. User types prompt → clicks Generate (or Enter)
5. Generating state: spinner, input disabled, border pulses
6. Result: bar expands, canvas shows preview overlay
7. User clicks:
   - **Apply** → changes committed, toast `"AI changes applied"` + [Undo], bar closes
   - **Reject** → preview reverted, bar returns to idle
   - **Edit** → prompt refilled for iteration
8. Error: red border, retry message

### 8.2 AI Copilot Flow

1. Copilot modal opens via `openCopilot()` in `useStudioModals` (`200ms ease-out`) — **Note:** No `Ctrl+Shift+J` keyboard shortcut is wired in the codebase, and no overflow menu exists. Trigger mechanism is programmatic only (no discoverable UI shortcut).
2. User types description or clicks template chip
3. Clicks `[Generate Full Page]` or `[Generate Section]`
4. Generating: disabled UI, animated progress with cycling sub-text
5. Result: iframe preview shown
6. User clicks:
   - **Accept and replace page** → ConfirmDialog → replaces current page (auto-saved first)
   - **Accept as new page** → creates new page, navigates to it
   - **Reject** → returns to idle

### 8.3 Collaboration Cursor Flow

1. User connects → presence avatar appears in top bar
2. Cursor broadcast: `{x, y, userId}` on mousemove, throttled 50ms (~20fps) — `useCursorSync.ts` default `throttleMs = 50`
3. Remote cursors rendered: SVG arrow + name label in user color
4. Idle 3s → cursor fades to 0.4 opacity
5. Idle 10s → cursor fades to 0 (hidden)
6. Movement resumes → instant opacity 1
7. Disconnect → cursor fades out 300ms then removed

### 8.4 Collaboration Conflict Flow

1. Both users edit simultaneously → OT resolves automatically
2. If local change rebased: info toast `"Your change was rebased to sync with Sarah's edit"` (5000ms)
3. If another user deletes element you're editing: warning toast, inspector → IS-1, element removed
4. Same property conflict: last-writer-wins. Toast only if local change overwritten.

---

## 9. Panel State Machine

> Source: §19.1

**States:** `closed`, `open-unpinned`, `open-pinned`, `expanded`

**Default width:** `320px` (all states except expanded). Expanded max: `400px`.

| # | Current State | Trigger | Next State | Side Effects |
|---|--------------|---------|-----------|-------------|
| P1 | `closed` | Rail icon click | `open-unpinned` | Panel slides in from left (`150ms ease`). Focus moves to panel header. Keyboard shortcut also triggers this. |
| P2 | `open-unpinned` | Same rail icon click | `closed` | Panel slides out (`150ms ease`). Focus returns to canvas. |
| P3 | `open-unpinned` | Different rail icon click | `open-unpinned` | Tab content swaps (instant, no animation). Panel stays open. |
| P4 | `open-unpinned` | Pin icon click | `open-pinned` | Pin icon: Lucide `pin` → `pin-off`. Panel border changes: adds `border-right: 2px solid var(--aqb-primary)` to indicate pinned. Canvas area width reduces by panel width. |
| P5 | `open-pinned` | Pin icon click | `open-unpinned` | Reverse of P4. Canvas width restores. |
| P6 | `open-unpinned` | Click outside panel (canvas or inspector) | `closed` | Panel closes. |
| P7 | `open-pinned` | Click outside panel | `open-pinned` | No change — pinned panels stay open. |
| P8 | `open-pinned` | Close icon (×) click | `closed` | Panel closes and unpins. |
| P9 | `open-unpinned` | Close icon (×) click | `closed` | Panel closes. |
| P10 | `open-unpinned` or `open-pinned` | Drag panel right edge | `expanded` | Panel width increases up to `400px`. Cursor: `ew-resize`. Min width: `280px`. |
| P11 | `expanded` | Release drag | `expanded` | Width persists at dragged value. |
| P12 | `expanded` | Double-click resize handle | `open-pinned` | Width resets to default `320px`. |
| P13 | Any open state | Escape key (panel focused) | `closed` | Panel closes. |

**Persistence:** Panel state (which tab, pinned/unpinned, width) persisted in `localStorage` per user. Restored on next session.

---

## 10. Selection State Machine

> Source: §19.2, §21.1–21.3

**States:** `none`, `single`, `multi`, `inline-edit`, `context-menu`

| # | Current State | Trigger | Next State | Side Effects |
|---|--------------|---------|-----------|-------------|
| S1 | `none` | Click element on canvas | `single` | Element: indigo outline + resize handles + floating toolbar. Inspector: IS-2. Layers: scroll to + highlight. aria-live: `"[type] selected"` |
| S2 | `none` | Click element in Layers tree | `single` | Same as S1 + canvas scrolls/zooms to show element. |
| S3 | `single` | Click same element | `single` | No change. |
| S4 | `single` | Click different element | `single` | Previous element deselected. New element selected. Inspector updates. |
| S5 | `single` | Click empty canvas area | `none` | Element deselected. Inspector: IS-1. Floating toolbar hidden. |
| S6 | `single` | Shift+click another element | `multi` | Both elements selected. Inspector: IS-3 (MultiSelectToolbar). Group bounding box visible. |
| S7 | `single` | Escape | `none` | Element deselected. |
| S8 | `single` | Double-click (text element) | `inline-edit` | Element enters contenteditable. Outline changes to `#818cf8`. Floating toolbar → text formatting toolbar. Inspector Typography auto-expands. |
| S9 | `single` | Double-click (non-text element) | `single` | No state change. (Only text elements support inline edit.) |
| S10 | `single` | Right-click | `context-menu` | Context menu opens at cursor. Selection preserved. |
| S11 | `single` | Drag on empty canvas | `none` → `marquee` | Marquee rectangle begins (CS-9). Previous selection cleared. |
| S12 | `multi` | Click single element (no Shift) | `single` | Multi-selection cleared. Only clicked element selected. |
| S13 | `multi` | Shift+click selected element | `multi` or `single` | Element removed from selection. If 1 remains → `single`. |
| S14 | `multi` | Shift+click unselected element | `multi` | Element added to selection. Count updates. |
| S15 | `multi` | Escape | `none` | All deselected. Inspector: IS-1. |
| S16 | `multi` | Delete | `none` | All selected elements deleted (with ConfirmDialog if > 3 elements). |
| S17 | `inline-edit` | Escape | `single` | Text committed. Element returns to selected state (indigo outline + handles). |
| S18 | `inline-edit` | Click outside element | `single` or `none` | Text committed. If clicked another element → S4. If clicked empty → S5. |
| S19 | `inline-edit` | Tab | `single` (next element) | Text committed. Next sibling element selected (if exists). |
| S20 | `context-menu` | Click menu item | varies | Action executed. Menu closes. State depends on action (Delete → `none`; others → `single`). |
| S21 | `context-menu` | Escape | `single` or `multi` | Menu closes. Previous selection preserved. |
| S22 | `context-menu` | Click outside menu | `single` or `multi` | Menu closes. Previous selection preserved. |
| S23 | `none` | Ctrl+A | `multi` | All elements selected. Inspector: IS-3. |
| S24 | marquee | Mouse release | `none`, `single`, or `multi` | 0 elements in marquee → `none`. 1 → `single`. 2+ → `multi`. |

### 10.1 Selection Visual Spec

**Single selection:**
- Outline: `2px solid #6366f1` on bounding box
- 8 resize handles (corner + midpoint)
- Floating toolbar above element (7 buttons)
- Layers tree: node highlighted `background: rgba(99,102,241,0.12)`, auto-scroll

**Multi-selection:**
- Each element: `2px solid #6366f1` (no individual handles)
- Group bounding box: `1px dashed rgba(99,102,241,0.4)`
- MultiSelectToolbar replaces floating toolbar

**Select from Stack submenu:**
- Same container style as parent context menu
- Each entry: type icon (14px) + element name + optional sub-label
- Hover: `background: var(--aqb-surface-3)` + teal canvas highlight on hovered element
- Stack order: topmost (highest z-index) first

---

## 11. Save / Sync State Machine

> Source: §19.3

**States:** `idle`, `dirty`, `saving`, `auto-saving`, `error`

| # | Current State | Trigger | Next State | UI Change |
|---|--------------|---------|-----------|-----------|
| SV1 | `idle` | User makes any change (element add/move/style/delete/text edit) | `dirty` | Top bar save indicator: text changes to `"Unsaved changes"`. **Note:** There is no distinct amber dot — `StatusIndicators.tsx` only renders 3 visual dot states: idle (green `#22c55e`), saving (blue `#4b8dff`), error (red `#ef4444`). The "dirty" state is internal only. Auto-save timer starts (5000ms). |
| SV2 | `dirty` | Ctrl+S | `saving` | Save indicator: `"Saving..."` + Lucide `loader-2` spinning. Dot: blue `#4b8dff`. `composer.save()` called. |
| SV3 | `saving` | Success response | `idle` | Save indicator: `"Saved"` + timestamp (`"Saved at 2:45 PM"`). Dot: green `#22c55e`. Auto-save timer cleared. |
| SV4 | `saving` | Failure response | `error` | Save indicator: `"Save failed"` in `#ef4444`. Toast: `"Could not save — check your connection and try again"` — error variant with `[Retry]` button. |
| SV5 | `error` | User clicks `[Retry]` or Ctrl+S | `saving` | Same as SV2. |
| SV6 | `error` | User makes another change | `error` (stays) | Changes queued. Dirty flag still set. Error message persists. |
| SV7 | `dirty` | Auto-save timer fires (5000ms of inactivity) | `auto-saving` | Save indicator: subtle spinner (no text change). `composer.autoSave()` called. |
| SV8 | `auto-saving` | Success | `dirty` | Auto-save does NOT reset dirty flag (only explicit Ctrl+S does). Indicator: `"Auto-saved [timestamp]"` in muted text. History tab: new auto-save entry created. |
| SV9 | `auto-saving` | Failure | `dirty` | Silent failure — no toast for auto-save failure. Retries on next timer fire. Console warning logged. |
| SV10 | `dirty` | User makes more changes (resets timer) | `dirty` | Auto-save timer restarts at 5000ms from last change. Ensures no save during active editing. |
| SV11 | Any state | Browser beforeunload (close/navigate) | — | If `dirty` or `error`: browser shows `"You have unsaved changes. Leave anyway?"` confirmation dialog. |

---

## 12. Empty / Loading / Error / Success States

### 12.1 Canvas States

| State | Condition | Visual |
|-------|-----------|--------|
| CS-1 Empty (new project, blank) | No content, first visit | `CanvasEmptyCTA` centered on `#ffffff` background (`--aqb-bg-canvas: #ffffff`). No white content area. |
| CS-1 Empty (after "Start Blank") | User dismissed CTA | White `<body>` rendered (`min-height: 100vh`). No elements. |
| CS-2 Default content | Content exists | White content area with elements rendered. |
| CS-4 Element selected | Single element clicked | Indigo outline + handles + floating toolbar. |
| CS-6 Inline editing | Double-click text | `contenteditable`, lighter indigo outline, formatting toolbar. |
| CS-7 Drag from sidebar | Dragging element card | Drop zones visible (teal/red), slot indicators. |
| CS-9 Marquee | Dragging on empty canvas | Dashed indigo rectangle selecting intersecting elements. |
| CS-11 X-Ray | X-Ray toggle on | Wireframe view: `1px solid rgba(255,255,255,0.3)` outlines, `#1a1a2e` bg, JetBrains Mono labels. |
| CS-12 Dev Mode | DevModeToggle on | All CSS properties visible in inspector format. |

### 12.2 Inspector States

| State | Condition | Content |
|-------|-----------|---------|
| IS-1 | No element selected | InspectorEmptyState: page-level properties (page title, meta, favicon) |
| IS-2 | Single element selected | Full inspector: header (8 rows) + 3 tabs + sections |
| IS-3 | Multiple elements selected | MultiSelectToolbar: align (6) + distribute (2) + size (2) + actions (3) |
| IS-4 | Pseudo-state editing active | Amber tint on inspector indicating non-normal state editing |
| IS-5 | Dev Mode active | Raw CSS view of element properties |

### 12.3 Loading States

| Surface | Loading Visual |
|---------|---------------|
| Template apply | ApplyProgressOverlay: spinner + progress bar + cycling text ("Applying template..." → stages) |
| Save | Top bar: `"Saving..."` + Lucide `loader-2` spinning |
| Publish | Publish button: `"Publishing..."` + spinner |
| Export download | Export button: `"Preparing download..."` + spinner |
| AI generate | AIAssistantBar: `"Generating..."` + spinner. Copilot: animated progress bar with cycling sub-text |
| Upload | Upload card: filename + `%` progress bar |
| AI Suggestions | 3 shimmer skeleton rows at bottom of Inspector panel (standalone `AISuggestionSection`, below all tabs — NOT inside Effects/Behavior tab) |

### 12.4 Error States

| Surface | Error Visual | Recovery |
|---------|-------------|----------|
| Save failed | Red dot + `"Save failed"` in top bar. Toast: `"Could not save — check your connection"` | `[Retry]` button in toast + Ctrl+S |
| Publish failed | Error message in Publish tab + Toast | `[Retry]` button |
| Export failed | Preview: Toast `"Preview failed — could not generate HTML"`. No tab opened. | Retry Ctrl+P |
| AI error | Bar: red border + `"AI couldn't generate a result"` | Rephrase prompt |
| AI unavailable (503) | All AI surfaces: `"AI temporarily unavailable"` + muted icon | `[Retry]` button. Surfaces visible but disabled. |
| Upload too large | Toast: `"Image exceeds 10 MB limit. Resize or compress."` | Upload smaller file |
| Upload wrong format | Toast: `"Unsupported format. Use JPEG, PNG, SVG, GIF, WebP, or AVIF."` | Upload correct format |
| Error boundary | Full-screen: `"Something went wrong"` + `"Your work was auto-saved. Reload."` | `[Reload]` button |

### 12.5 Success States

| Surface | Success Visual | Duration |
|---------|---------------|----------|
| Save | Green dot (`#22c55e`) + `"Saved at [time]"` | Persistent until next change |
| Publish | Toast: `"Site published!"` + `[Open site →]` link | 3000ms |
| Export | Toast: `"Download complete — [file].zip"` + auto-download | 3000ms |
| Version saved | Toast: `"Version saved: [name]"` + row in History | 3000ms |
| AI applied | Toast: `"AI changes applied"` + `[Undo]` | 3000ms |
| Upload | Toast: `"Upload complete"` + asset in library | 3000ms |
| Template applied | Toast: `"Template applied"` + canvas populated | 3000ms |

---

## 13. Accessibility Flows

> Source: §20.1–20.4

### 13.1 WCAG 2.1 AA Requirements

| # | WCAG Criterion | Requirement | Implementation | Verification |
|---|---------------|-------------|----------------|-------------|
| A1 | 1.1.1 Non-text Content | Alt text for all images | Lucide icons: `aria-hidden="true"` + text labels or `aria-label` on parent. Element thumbnails: `alt="[type] element"` | axe-core scan |
| A2 | 1.3.1 Info and Relationships | Programmatic structure | Inspector sections: `role="region"` + `aria-labelledby`. Accordion: `aria-expanded`. Tab bar: `role="tablist"` + `role="tab"` + `role="tabpanel"` + `aria-selected` | Screen reader test |
| A3 | 1.3.2 Meaningful Sequence | DOM matches visual | Tab order: Rail → Sidebar → Canvas → Inspector | Tab key test |
| A4 | 1.4.3 Contrast (Minimum) | 4.5:1 normal, 3:1 large | Primary `#F5F5F0` on `#0f0f14` = 15.4:1. Secondary `#B8B5AD` = 9.8:1. Muted `#908D85` = 5.9:1. All pass. | Contrast checker |
| A5 | 1.4.11 Non-text Contrast | 3:1 for UI components | Border `rgba(255,255,255,0.08)` = 1.3:1 — **AT RISK**. Focus ring `#6366f1` = 4.6:1 — passes. | Consider `rgba(255,255,255,0.12)` for interactive borders |
| A6 | 2.1.1 Keyboard | All functionality via keyboard | All 30+ shortcuts. All controls via Tab/Arrow/Enter/Space. | Full keyboard session test |
| A7 | 2.1.2 No Keyboard Trap | Focus always movable | Modals: focus trap + Escape. Canvas inline edit: Escape exits. | Tab through all UI |
| A8 | 2.4.1 Bypass Blocks | Skip to main content | `"Skip to canvas"` link: visually hidden, appears on focus | First Tab press |
| A9 | 2.4.3 Focus Order | Logical order | Skip link → Rail → Sidebar → Canvas → Inspector → cycle | Tab order test |
| A10 | 2.4.7 Focus Visible | Visible focus indicator | `outline: 2px solid #6366f1; outline-offset: 2px` on all focusable elements | Visual check |
| A11 | 4.1.2 Name, Role, Value | ARIA on custom controls | All custom controls have `role`, `aria-label`, `aria-valuenow`/`min`/`max` | axe-core |
| A12 | 4.1.3 Status Messages | Status without focus change | Save: `aria-live="polite"`. Toasts: `role="status"` (info) or `role="alert"` (error). Selection: `aria-live="polite"` | Screen reader |

### 13.2 Keyboard Navigation Map

**Global navigation (Tab order):**

```
[Skip to canvas link] → Rail → Sidebar → Canvas → Inspector → (cycle)
```

| Zone | Key | Behavior |
|------|-----|----------|
| Global | Tab | Next zone (Rail → Sidebar → Canvas → Inspector) |
| Global | Shift+Tab | Previous zone |
| Global | Escape | Close modal → close context menu → deselect → close panel (priority order) |
| Global | Ctrl+K | Open command palette |
| Global | Ctrl+S | Save |
| Global | Ctrl+Z | Undo (except text input focused) |
| Global | Ctrl+Y | Redo (except text input focused) |

**Rail zone:**

| Key | Behavior |
|-----|----------|
| Arrow Up | Focus previous rail icon |
| Arrow Down | Focus next rail icon |
| Enter / Space | Activate rail icon |
| Home | Focus first rail icon |
| End | Focus last rail icon |

**Sidebar zone:**

| Key | Behavior |
|-----|----------|
| Tab | Move between focusable elements within panel |
| Arrow Up/Down | Navigate within lists |
| Enter | Activate item |
| Escape | Close panel (if unpinned) |

**Canvas zone:**

| Key | Behavior |
|-----|----------|
| Arrow keys | Nudge selected element `1px` |
| Shift+Arrow | Nudge `10px` |
| Enter | Enter inline edit (text elements) |
| Delete / Backspace | Delete selected element(s) |
| Ctrl+A | Select all |
| Ctrl+D | Duplicate |
| Ctrl+C / Ctrl+X / Ctrl+V | Copy / Cut / Paste |
| Ctrl+] / Ctrl+[ | Move up / down in sibling order |
| Ctrl+Shift+] / Ctrl+Shift+[ | Bring to front / Send to back |

**Inspector zone:**

| Key | Behavior |
|-----|----------|
| Tab | Move between controls within section |
| Arrow Left/Right | Switch tabs (when tab bar focused) |
| Space | Toggle checkboxes, toggles, segmented controls |
| Enter | Confirm edit in text/number input |
| Escape | Revert input + blur |
| Arrow Up/Down (number input) | Increment/decrement by 1 |
| Shift+Arrow Up/Down (number input) | Increment/decrement by 10 |

### 13.3 Focus Management Rules

| Event | Focus behavior |
|-------|---------------|
| Modal opens | Focus to first focusable element. Focus trapped via `inert`. |
| Modal closes | Focus returns to trigger element (`previousFocusRef`). |
| Panel opens | Focus to panel header. |
| Panel closes | Focus to deactivated rail icon. |
| Tab switch (inspector) | Focus to first control in new tab's first expanded section. |
| Element selected | Focus to canvas region. `aria-live` announces. Inspector updates but no focus steal. |
| Inline edit entered | Focus to contenteditable element. |
| Context menu opens | Focus to first menu item. |
| Context menu closes | Focus to selected element (canvas). |
| Toast appears | No focus change. Screen reader via `role="alert"` or `aria-live`. |
| Drag starts | Focus stays on source. `aria-live`: `"Dragging [type]"`. |
| Drag ends | Focus to dropped element (success) or source (cancel). `aria-live`: `"[type] dropped"` or `"Drag cancelled"`. |

### 13.4 Screen Reader Announcements

| Event | aria-live | Text | Priority |
|-------|-----------|------|----------|
| Element selected | `polite` | `"[Element type] selected"` | — |
| Multi-select | `polite` | `"[N] elements selected"` | — |
| Element deselected | `polite` | `"No selection"` | — |
| Save success | `polite` | `"Project saved"` | — |
| Save failure | `assertive` | `"Save failed. Check connection and retry."` | High |
| Publish success | `polite` | `"Site published successfully"` | — |
| Publish failure | `assertive` | `"Publish failed. [reason]"` | High |
| Element added | `polite` | `"[Element type] added to canvas"` | — |
| Element deleted | `polite` | `"[Element type] deleted"` | — |
| Undo | `polite` | `"Undo: [action description]"` | — |
| Redo | `polite` | `"Redo: [action description]"` | — |
| Panel opened | `polite` | `"[Tab name] panel opened"` | — |
| Panel closed | `polite` | `"Panel closed"` | — |
| Toast (error) | `assertive` (`role="alert"`) | Toast message text | High |
| Toast (info/success) | `polite` (`role="status"`) | Toast message text | — |
| Drag start | `polite` | `"Dragging [type]. Use arrow keys to position, Enter to drop, Escape to cancel."` | — |
| Breakpoint change | `polite` | `"Switched to [breakpoint] view"` | — |

### 13.5 ARIA Landmarks

| Region | ARIA | Label |
|--------|------|-------|
| Rail | `role="navigation"` | `aria-label="Editor panels"` |
| Sidebar panel | `role="complementary"` | `aria-label="[Tab name] panel"` |
| Canvas | `role="application"` | `aria-label="Canvas editing area"` (custom keyboard handling) |
| Inspector | `role="complementary"` | `aria-label="Element properties"` |
| Top bar | `role="toolbar"` | `aria-label="Editor toolbar"` |
| Canvas footer | `role="toolbar"` | `aria-label="Canvas controls"` |

---

## 14. Edge Cases and Fallback Behavior

> Source: §29.1–29.3

### 14.1 Fully Supported Features

| # | Feature | Scope |
|---|---------|-------|
| SUP-1 | 3 device breakpoints | Desktop (1440px), Tablet (768px), Mobile (375px) — **No Watch breakpoint exists in `BreakpointDropdown.tsx` or `DEVICE_PRESETS`** |
| SUP-2 | 10 sidebar tabs | Add, Templates, Layers, Pages, Components, Media, Design, Settings, Publish, History |
| SUP-3 | 30+ keyboard shortcuts | Full table in §5B, §17.2 |
| SUP-4 | Inspector: 3 tabs, 14 sections + shared footer | Layout (7), Style (3: Typography, Background, Border), Behavior (4: Effects, Animation, Interactions, Visibility) + shared `ElementSettingsFooter` (Link, Classes, Properties, AllCSS) below all tabs |
| SUP-5 | Pseudo-state editing | 4 states: hover, focus, active, disabled |
| SUP-6 | CMS binding: 3 types | Text binding, image binding, style binding |
| SUP-7 | Collaboration: OT + presence + cursors | Real-time multi-user editing |
| SUP-8 | Export: HTML + CSS | Multi-page, minified ZIP download |
| SUP-9 | Version history | Named versions + auto-saves + restore — **compare is NOT implemented** |
| SUP-10 | AI: assistant + copilot + suggestions | All 3 AI surfaces |
| SUP-11 | Canvas overlays: 5 footer toggles | Snap Guides, Spacing, Grid, Badges, X-Ray — **No Rulers toggle in `CanvasFooterToolbar.tsx`**. Snap lines are a separate drag-time overlay, not a footer toggle. |
| SUP-12 | Command palette | Substring search (`.includes()`), keyboard nav — **not fuzzy search** |
| SUP-13 | Onboarding flow | WelcomeModal + checklist + spotlight + achievement |
| SUP-14 | Design token system | Color/typography/spacing tokens, draft/review/apply, export |
| SUP-15 | Context menu with stack selection | Right-click + "Select from stack" submenu |

### 14.2 Fallback Behavior

| # | Trigger | Fallback | User UI |
|---|---------|----------|---------|
| FB-1 | Connection lost | Offline editing, local queue, OT syncs on reconnect | Gray "Offline" dot. `"Offline — changes saved locally, will sync on reconnect"`. No editing interruption. |
| FB-2 | Auto-save storage fails | Retries on next timer (5000ms). 3 consecutive failures → warning. | Toast (warning): `"Auto-save is having trouble. Try Ctrl+S."` Amber dot. |
| FB-3 | Manual save API fails | SV4 error state. Retry available. | Toast (error) + `[Retry]`. Red `"Save failed"`. |
| FB-4 | AI service 503 | All AI surfaces → "unavailable" state. Non-AI unaffected. | `"AI temporarily unavailable"` + disabled inputs + `[Retry]`. |
| FB-5 | Export React/Vue/Next.js | "Coming Soon" badge + email capture. | `[Notify me →]` → email input inline. |
| FB-6 | Settings: Domains (planned) | LockedScreen with "Coming Soon". | Feature description + `[Notify me]` + ETA. |
| FB-7 | Settings: Analytics (planned) | Same as FB-6. | Same LockedScreen. |
| FB-8 | Image too large | Upload rejected. | Toast: `"Image exceeds 10 MB limit."` |
| FB-9 | Unsupported format | Upload rejected. | Toast: `"Unsupported format. Use JPEG, PNG, SVG, GIF, WebP, or AVIF."` |
| FB-10 | Clipboard API unavailable | Falls back to `document.execCommand`. | No visible change. |

### 14.3 Explicit Non-Goals

| # | Feature | Reason | User Messaging |
|---|---------|--------|---------------|
| NS-1 | Mobile editor | Canvas requires desktop pointing device. Min 1280px. | Full-screen: `"Buildrik is designed for desktop."` |
| NS-2 | IE11 / legacy browsers | Modern CSS required. | Redirect to upgrade page. |
| NS-3 | Offline-first | Connectivity expected for save/publish/collab/AI. | Offline banner (FB-1). |
| NS-4 | Plugin store UI | Engine exists, no UI marketplace designed. | No UI surface. |
| NS-5 | Multi-page preview | Preview shows current page only. | Ctrl+P always shows active page. |
| NS-6 | Canvas comments | Collaboration supports cursors/selection, not threads. | No comment UI. |

---

## 15. Anti-Confusion Rules

### 15.1 Microcopy Rules

From §25.1:

1. **Say what will happen** — "Publish Site" not "Submit"
2. **Errors explain why + what to do** — "Could not save — check your connection" not "Save failed"
3. **Destructive = confirmation** — always state consequence
4. **Progress = status** — never silent loading
5. **Success = next action** — show what to do next

### 15.2 State Transition Visibility

Every state transition must be communicated visually:

| Transition type | Communication method |
|-----------------|---------------------|
| Save state change | Top bar dot color (green `#22c55e` / blue `#4b8dff` / red `#ef4444`) + text change — no distinct dirty dot color |
| Selection change | Canvas outline + inspector swap + aria-live |
| Panel open/close | Slide animation + rail icon state |
| Breakpoint switch | Canvas width animation + BreakpointIndicator pill |
| Mode enter (X-Ray, Dev) | Canvas visual change + toggle state (X-Ray toggle is in CanvasFooterToolbar) |
| Error | Red indicators + toast with recovery action |
| Success | Green indicators + toast with next action |

### 15.3 Escape Priority Chain

When Escape is pressed, the highest-priority open surface closes first:

```
Modal (z-index 4000, `Z_LAYERS.modal`) → Context menu → Deselect element → Close unpinned panel
```

Only one thing closes per Escape press. User must press Escape multiple times to dismiss nested states.

---

## 16. Motion Principles

> Source: §24.1–24.4

### 16.1 Duration Scale

| # | Token | Duration | CSS variable | Usage |
|---|-------|---------|-------------|-------|
| D1 | instant | `50ms` | `--aqb-duration-instant` | State toggles, checkbox, radio, segmented control, tab content swap |
| D2 | fast | `100ms` | `--aqb-duration-fast` | Tooltip fade, hover background, toast appear/dismiss, hover outline |
| D3 | normal | `150ms` | `--aqb-duration-normal` | Panel slide in/out, modal scale+fade, accordion expand/collapse |
| D4 | moderate | `200ms` | `--aqb-duration-moderate` | Sidebar slide, overlay fade, AIAssistantBar slide up |
| D5 | slow | `300ms` | `--aqb-duration-slow` | Copilot modal, full-screen overlays, X-Ray mode transition |
| D6 | slower | `400ms` | `--aqb-duration-slower` | Complex multi-step transitions |

### 16.2 Easing Curves

| # | Name | CSS Value | Usage |
|---|------|----------|-------|
| E1 | Default (ease-in-out) | `cubic-bezier(0.4, 0, 0.2, 1)` | Most transitions — panel open/close, modal, accordion |
| E2 | Enter (decelerate) | `cubic-bezier(0, 0, 0.2, 1)` | Elements appearing — toast slide in, modal enter, dropdown open |
| E3 | Exit (accelerate) | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving — toast dismiss, modal exit, panel close |
| E4 | Spring | GSAP `elastic.out(1, 0.5)` | Canvas element interactions only — drag snap-back, resize bounce. Not in UI chrome. |
| E5 | Linear | `linear` | Progress bars, continuous animations |

### 16.3 Reduced Motion

**Media query:** `@media (prefers-reduced-motion: reduce)`

| Behavior | Normal | Reduced Motion |
|----------|--------|---------------|
| CSS transitions | Per duration scale | `transition-duration: 0ms !important` |
| CSS animations | Keyframe animations run | `animation-duration: 0ms !important; animation-iteration-count: 1 !important` |
| GSAP animations | Full animation | `gsap.globalTimeline.timeScale(999)` (instant) |
| Panel open/close | Slide animation | Instant show/hide |
| Modal enter/exit | Scale + fade | Instant show/hide |
| Toast enter/exit | Slide up + fade out | Instant show/hide |
| Marquee dash | Animated offset | Static dashed border |
| AI sparkle pulse | Opacity pulse | Static opacity |
| Loading spinner | Rotation | Static icon |

### 16.4 Complete Animation Table

| # | Interaction | Property | From | To | Duration | Easing |
|---|-----------|----------|------|-----|---------|--------|
| M1 | Panel open | `transform` | `translateX(-100%)` | `translateX(0)` | 150ms | E1 |
| M2 | Panel close | `transform` | `translateX(0)` | `translateX(-100%)` | 150ms | E3 |
| M3 | Modal enter | `opacity`, `transform` | `0`, `scale(0.96)` | `1`, `scale(1)` | 150ms | E2 |
| M4 | Modal exit | `opacity`, `transform` | `1`, `scale(1)` | `0`, `scale(0.96)` | 100ms | E3 |
| M5 | Modal backdrop enter | `opacity` | `0` | `1` | 150ms | E1 |
| M6 | Toast enter | `transform`, `opacity` | `translateY(16px)`, `0` | `translateY(0)`, `1` | 100ms | E2 |
| M7 | Toast dismiss | `opacity` | `1` | `0` | 100ms | E3 |
| M8 | Element selected | `outline-color` | `transparent` | `#6366f1` | 0ms | — |
| M9 | Element hover outline | `opacity` | `0` | `1` | 100ms | E1 |
| M10 | Accordion expand | `max-height` | `0` | `auto` (measured) | 150ms | E1 |
| M11 | Accordion collapse | `max-height` | measured | `0` | 150ms | E1 |
| M12 | Tab content switch | — | — | — | 0ms | — |
| M13 | Tooltip enter | `opacity` | `0` | `1` | 100ms | E2 |
| M14 | Tooltip exit | `opacity` | `1` | `0` | 100ms | E3 |
| M15 | Dropdown open | `opacity`, `transform` | `0`, `translateY(-4px)` | `1`, `translateY(0)` | 100ms | E2 |
| M16 | Dropdown close | `opacity` | `1` | `0` | 100ms | E3 |
| M17 | AIAssistantBar enter | `transform` | `translateY(100%)` | `translateY(0)` | 200ms | E2 |
| M18 | AIAssistantBar exit | `transform` | `translateY(0)` | `translateY(100%)` | 150ms | E3 |
| M19 | Color swatch change | `background-color` | old color | new color | 100ms | E1 |
| M20 | Toggle switch | `transform` (thumb) | `translateX(0)` | `translateX(16px)` | 100ms | E1 |
| M21 | Progress bar (indeterminate) | `transform` | `translateX(-100%)` | `translateX(100%)` | 2000ms | E5 |
| M22 | Cursor fade (collab idle) | `opacity` | `1` | `0.4` then `0` | 500ms | E3 |
| M23 | Command palette enter | `opacity`, `transform` | `0`, `translateY(-8px)` | `1`, `translateY(0)` | 150ms | E2 |

---

## 17. Default Canvas Content States

> Source: §26.1–26.3

### 17.1 New Project — Blank Canvas

| Property | Value |
|----------|-------|
| Canvas background | `#ffffff` (`--aqb-bg-canvas`) |
| Canvas content area | Not rendered (no white area until content exists) |
| CanvasEmptyCTA | Visible, centered |
| Sidebar | Closed (no panel open) |
| Inspector | IS-1 (InspectorEmptyState) |
| Top bar | All controls available. Save status: `"New project"`. Device: Desktop. |
| Zoom | 100% |
| Overlays | All off (Snap Guides, Spacing, Grid, Badges, X-Ray) — 5 footer toggles |
| Selection | None |
| OnboardingChecklist | Visible if first-ever visit (floating bottom-right) |

**After user clicks "Start Blank":**

| Property | Value |
|----------|-------|
| CanvasEmptyCTA | Dismissed (hidden) |
| Canvas content area | Empty white `<body>` — `background: #FFFFFF; min-height: 100vh; width: [device width]` |
| OnboardingChecklist | If present: step 1 highlighted `"Drag an element to start"` with pulsing arrow toward rail |
| Sidebar | Build tab auto-opens (if checklist active). Otherwise stays closed. |

### 17.2 New Project — Template Applied

| Property | Value |
|----------|-------|
| CanvasEmptyCTA | Hidden (never shown) |
| Canvas content area | Template HTML structure rendered |
| OnboardingChecklist | Step 1 auto-completed. Step 2 highlighted: `"Edit some text"` |
| Sidebar | Closed (user explores canvas) |
| Inspector | IS-1 (no selection) |
| Selection | None |
| Zoom | Auto-fit: `composer.canvas.zoomToFit()` |

### 17.3 Returning User — Session Restore

| Property | Value |
|----------|-------|
| Canvas content | Restored from last save |
| Selection | None (not persisted) |
| Sidebar | Restored from `localStorage` (which tab, pinned/unpinned) |
| Inspector | IS-1 (no selection on load) |
| Zoom | Restored from `localStorage` |
| Overlays | Restored from `localStorage` |
| Save status | `"Auto-saved [time]"` or `"Saved at [time]"` |
| OnboardingChecklist | Hidden if complete. Visible if incomplete. |

---

## 18. Anti-Regression Warnings (Flows & States)

> Source: §30, Output E

### 18.1 Critical Anti-Regression Items for Flows & States

| # | Risk | Pass criteria |
|---|------|--------------|
| AR7 | Keyboard shortcuts changed/removed | All 30+ shortcuts produce correct action |
| AR8 | Multi-select inspector not implemented | Shift+click 2 elements → MultiSelectToolbar shows align (6) + distribute (2) + size (2) + actions (3) |
| AR9 | Canvas overlays reduced | Footer toolbar has 5 overlay toggles: Snap Guides, Spacing, Grid, Badges, X-Ray — **no Rulers toggle in `CanvasFooterToolbar.tsx`** |
| AR14 | Context menu "Select from stack" removed | Right-click overlapping → submenu lists all elements in z-order |
| AR18 | Canvas empty state missing | New blank project → CanvasEmptyCTA centered with "Browse Templates" + "Start Blank" |
| AR19 | Snap lines not implemented | Drag near another element → teal snap lines at 6px threshold with distance labels |
| AR20 | Floating toolbar missing | Click element → 7-button toolbar above element |
| AR21 | Confirm dialog missing on destructive actions | Delete → ConfirmDialog with consequence text |
| AR24 | Toast notifications not appearing | Save/publish/delete → toast bottom-center with correct variant + duration |
| AR25 | Accessibility focus ring removed | Tab through all UI → `2px solid #6366f1, offset 2px` visible on every focusable element |

### 18.2 State Machine Integrity Checks

| State Machine | Min Transitions | Key invariant |
|--------------|----------------|---------------|
| Panel (§9) | 13 (P1–P13) | Pinned panels survive outside clicks (P7) |
| Selection (§10) | 24 (S1–S24) | Inline edit only for text elements (S8 vs S9) |
| Save (§11) | 11 (SV1–SV11) | Auto-save does NOT reset dirty flag (SV8). **Note:** No distinct amber "dirty" dot — only 3 visual dot states exist (idle/green, saving/blue, error/red). |

---

## 19. Source Notes and Unclear Items

### 19.1 Source Traceability

| Part 6 Section | PRD Source |
|---------------|-----------|
| §1 Primary Workflows | §18.1–18.4 |
| §2 Navigation Flows | §19.1 (P1–P13), §17.1 |
| §3 Add/Create/Insert | §10.6, §10.1 (CS-7), §9.8 |
| §4 Select/Edit | §21.1–21.3, §19.2 (S1–S24), §10.1 |
| §5 Responsive | §18.4, §11.5 |
| §6 History/Restore | §15.2–15.3 |
| §7 Preview/Publish/Export | §16.1–16.3, §9.12 |
| §8 AI & Collaboration | §14.1–14.2, §13.2–13.4 |
| §9 Panel State Machine | §19.1 |
| §10 Selection State Machine | §19.2 |
| §11 Save State Machine | §19.3 |
| §12 States | §10.1–10.2, §11.7, §25.1–25.2 |
| §13 Accessibility | §20.1–20.4 |
| §14 Edge Cases | §29.1–29.3 |
| §15 Anti-Confusion | §25.1 |
| §16 Motion | §24.1–24.4 |
| §17 Default Canvas | §26.1–26.3 |
| §18 Anti-Regression | §30 |

### 19.2 Unclear / Ambiguous Items

1. **Onboarding step count — RESOLVED:** `onboardingSteps.ts` defines **7 steps**: name-project, pick-start, add-element, edit-text, change-style, preview, publish. This is the authoritative count.

2. **Panel expanded state and pin** — P10 says dragging the right edge transitions to `expanded` from either `open-unpinned` or `open-pinned`. But P12 says double-click on resize handle goes to `open-pinned`. What if the panel was unpinned before expanding? Does it auto-pin?

3. **S11 Drag on empty canvas from single state** — Transition says `single` → `none` → `marquee`. This implies the current selection is cleared before marquee begins. Is this intentional? Could lead to unexpected deselection if user accidentally starts a drag.

4. **SV8 auto-save does NOT reset dirty flag** — This means explicit Ctrl+S is needed to return to clean "idle" state. **Note:** `StatusIndicators.tsx` only renders 3 visual dot states (idle/green, saving/blue, error/red) — there is no distinct amber "dirty" dot as described in the original PRD. The "dirty" state is text-only (`"Unsaved changes"`).

5. **WCAG A5 border contrast AT RISK** — `rgba(255,255,255,0.08)` on `#0f0f14` only achieves ~1.3:1 contrast. PRD notes this but does not commit to a fix. Interactive borders should use `rgba(255,255,255,0.12)` minimum, but this change is not formally mandated.

6. **Canvas `role="application"`** — PRD specifies this because canvas has custom keyboard handling. This disables most screen reader shortcuts within the canvas zone. PRD does not specify an escape mechanism for screen reader users to exit `role="application"` mode.

7. **Tooltip hover delay** — M13 says tooltip enter after `300ms hover delay` but this 300ms delay is only mentioned in the animation table, not in the tooltip spec itself. Is 300ms the standard for all tooltips?

8. **beforeunload (SV11)** — Modern browsers limit customization of the beforeunload dialog. PRD specifies dialog text but browsers may show generic text instead. This is a browser limitation, not a design ambiguity.

---

*End of PART_6_CORE_UX_FLOWS_AND_STATES.md*
*Extracted from prd_final.md — no content invented, all specs traced to source sections*
