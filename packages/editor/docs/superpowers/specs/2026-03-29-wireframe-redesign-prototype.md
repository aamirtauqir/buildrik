# Buildrik Wireframe Redesign + Prototype — Design Spec

**File:** `/Users/shahg/Desktop/pencil/editer.pen`
**Date:** 2026-03-29
**Approach:** Option B — Flow-by-flow (fix → new frames → prototype links per flow)
**Scope:** Canvas reorganization + 18 pending wireframe fixes + ~37 new missing-state frames + prototype connections

---

## Overview

The wireframe has 80+ frames, 22 reusable components, and two pending workstreams:
- **18 wireframe-design-fixes** (structural/visual fixes already specced in `2026-03-28-wireframe-design-fixes.md`)
- **New missing states** not yet represented in any frame

This spec describes executing both in 6 user-flow increments, each producing a demoable clickable prototype by the end of its pass. The result is ~117 fully connected frames organized into labeled swim lanes.

---

## Phase 0 — Canvas Reorganization

**Do this before any flow work.** Move all existing frames into 7 labeled swim lanes on the canvas.

### Swim Lane Layout (top → bottom, left → right within each lane)

| Lane | Label | Contents |
|------|-------|----------|
| 1 | `FLOW 1 · Canvas Edit` | Frames: 01, 02, 25, 26, 46–49 + new canvas states |
| 2 | `FLOW 2 · Publish` | Frames: 13, 14, 31(publish), 32 + new publish states |
| 3 | `FLOW 3 · CMS` | Frames: 08, 44A–44C + new CMS states |
| 4 | `FLOW 4 · AI` | Frames: 10, 11, 33 + new AI states |
| 5 | `FLOW 5 · Settings` | Frames: 22, 39, 40, 45 + new settings pages |
| 6 | `FLOW 6 · Collaboration` | Frames: new collab frames |
| 7 | `DEPRECATED` | Frames: 5qjkQ, niyiH, Mk1L2, YBoj8, nkopD, jPkOS, l6Cy5 (old inspector set from B-01) |

All remaining frames not assigned to a flow lane (sidebar panels, templates, media, history, pages, layers, design system, mobile gate, breakpoints, sections 50–57, components panel, etc.) stay on canvas in a **`PANELS & COMPONENTS`** lane between Flow 1 and Flow 2.

### Deprecated frame handling
The 7 old inspector frames are moved to lane 7 with a red "DEPRECATED — See Frames 46–49" annotation overlay. They are NOT deleted — they serve as design history.

---

## Flow 1 — Canvas Edit

**User story:** User clicks an element on canvas → inspector opens → they change a style → undo → element deselects.

### Existing frames in this flow
- `BBjUx` (01 — Add Elements) — sidebar entry point
- `ENFlg` (02 — Layers Panel)
- `26XuR` (46 — Inspector: Layout tab) — canonical inspector
- `ebEVP` (47 — Inspector: Style tab)
- `gR1na` (48 — Inspector: Effects tab)
- `otRcF` (49 — Inspector: Empty State)
- `Mk1L2` (23 — Inspector: Image) — needs fix (Task 5 from wireframe-design-fixes)
- `1qeGh` (26 — Canvas: Selection Handles)

### Fixes to apply (from wireframe-design-fixes plan)
- **Task 5:** Add 3-tab inspector header (Layout/Appearance/Effects) to frames 23, 24, 26
- **Task 7:** Fix frame 49 — grey out inspector tabs in empty state
- **Task 9:** Fix section frames 51/52 — replace "A B" chips with real control labels
- **Task 8:** Fix frame 50 — update align chips to L/C/R/J

### New frames to add
| Frame ID (new) | Name | Description |
|----------------|------|-------------|
| F1-NEW-01 | Canvas: Multi-select | 3 elements selected, blue bounding box around all, inspector shows "3 elements selected" with shared-property controls |
| F1-NEW-02 | Canvas: Inline Text Edit | Double-click on text element, cursor visible inside text, text toolbar appears above element |
| F1-NEW-03 | Canvas: Drag in Progress | Element being dragged, ghost/shadow under cursor, snap guides visible (blue lines) |
| F1-NEW-04 | Canvas: Context Menu | Right-click on element shows 10-item context menu (Cut/Copy/Paste/Duplicate/Delete/Group/Lock/Hide/Bring Forward/Send Back) |
| F1-NEW-05 | Canvas: Element Hover | Hover over element shows blue outline + cursor changes to move cursor |
| F1-NEW-06 | Command Palette | Ctrl+K overlay — search input + recent commands list |

### Prototype links for Flow 1
```
01 (Add Elements) → click element in sidebar → canvas with element selected (26)
26 (Selection Handles) → click Inspector icon in rail → 46 (Inspector: Layout)
46 (Inspector: Layout) → click Style tab → 47 (Inspector: Style)
47 (Inspector: Style) → click Effects tab → 48 (Inspector: Effects)
48 (Inspector: Effects) → click outside/deselect → 49 (Inspector: Empty State)
49 (Inspector: Empty State) → click element on canvas → 46 (Inspector: Layout)
26 (Selection Handles) → right-click → F1-NEW-04 (Context Menu)
26 (Selection Handles) → double-click text element → F1-NEW-02 (Inline Text Edit)
26 (Selection Handles) → drag element → F1-NEW-03 (Drag in Progress)
Ctrl+K anywhere → F1-NEW-06 (Command Palette)
```

---

## Flow 2 — Publish

**User story:** User clicks "Publish" in topbar → pre-launch checklist → resolves warnings → publishes → success state.

### Existing frames in this flow
- `gXzzP` (14 — Pre-publish Warnings Modal) — needs rename fix
- `szUXT` (31 — Publish: Pre-launch Checklist)
- `K928D` (32 — Publishing: In Progress) — needs Export vs Publish label fix
- `KBELS` (13 — Publish Success) — needs B-02 ambiguity fix
- `Ql3YU` (33 — AI Result: Edit Mode) — moved to Flow 4 (AI), not Publish

### Fixes to apply
- **B-02:** Split frame 13 into 13A (editor view with success toast) and 13B (live site preview)
- **B-03:** Rename modal in frame 32 from "Export Project" to "Publishing..."
- **Task 12:** Resolve duplicate frame number "31" (rename `Fmw5T` to "31A — Design System: Colors (Detail)")
- **Task 14:** Fix frame 15 — rename from "Publish Error Modal" to "Pre-publish Warnings Modal"
- **Task 18:** Fix frame 33 status bar text → "AI generated · Editing"

### New frames to add
| Frame ID (new) | Name | Description |
|----------------|------|-------------|
| F2-NEW-01 | Publish: Error State | Publishing failed — red error modal with "Retry" button and error detail |
| F2-NEW-02 | Publish: Domain Conflict | Domain already taken — yellow warning with "Choose different domain" CTA |
| F2-NEW-03 | Export Modal | Separate from Publish — "Export Project" modal with format selector (HTML/ZIP/React/JSON) |

### Prototype links for Flow 2
```
TopBar "Publish" button → 31 (Pre-launch Checklist)
31 → "Fix Issues" → 14 (Pre-publish Warnings)
31 → "Publish Now" → 32 (Publishing: In Progress)
32 (success) → 13A (Publish Success — editor view)
13A → "View Site" → 13B (Publish Success — live preview)
32 (failure) → F2-NEW-01 (Publish Error)
F2-NEW-01 → "Retry" → 32 (Publishing: In Progress)
TopBar "Export" → F2-NEW-03 (Export Modal)
```

---

## Flow 3 — CMS

**User story:** User opens CMS panel → creates a collection → adds an entry → binds a field to a canvas element → previews.

### Existing frames in this flow
- `11bGl` (08 — CMS Panel) — needs B-06 overflow fix
- `uN3tF` (44C — CMS: Edit Entry) — needs B-05 missing fields fix
- Any existing CMS collection/binding frames (44A, 44B if present)

### Fixes to apply
- **B-05:** Add Featured Image, URL Slug, Published Date, Author fields to frame 44C
- **B-06:** Fix CMS panel entry overflow — truncate with ellipsis, add tooltip on hover annotation

### New frames to add
| Frame ID (new) | Name | Description |
|----------------|------|-------------|
| F3-NEW-01 | CMS: Create Collection | Modal — collection name input, field type picker (text/image/date/number/boolean) |
| F3-NEW-02 | CMS: Field Type Picker | Dropdown expanded showing 8 field types with icons |
| F3-NEW-03 | CMS: Binding Mode | Canvas enters "binding mode" — elements have chain-link icons, inspector shows "Bind to field" dropdown |
| F3-NEW-04 | CMS: Binding Confirmation | Toast — "Title bound to H1 element" with undo link |
| F3-NEW-05 | CMS: Preview Mode | Canvas shows live data from first CMS entry, topbar shows "Preview Mode" chip with exit button |

### Prototype links for Flow 3
```
Rail CMS icon → 08 (CMS Panel)
08 → "+" (New Collection) → F3-NEW-01 (Create Collection)
F3-NEW-01 → field type input → F3-NEW-02 (Field Type Picker)
F3-NEW-01 → "Create" → 08 (CMS Panel, collection added)
08 → click entry → 44C (Edit Entry)
44C → "Save" → 08 (CMS Panel)
08 → "Bind to page" → F3-NEW-03 (Binding Mode)
F3-NEW-03 → click element → F3-NEW-04 (Binding Confirmation)
TopBar "Preview" → F3-NEW-05 (CMS Preview Mode)
F3-NEW-05 → "Exit Preview" → normal canvas
```

---

## Flow 4 — AI

**User story:** User opens AI bar → types a prompt → AI generates → user reviews → accepts or refines.

### Existing frames in this flow
- `bNn49` (10 — AI Entry Point) — needs Task 4 fix (no skip/exit)
- `zSiUu` (11 — AI Generating) — needs Task 3 fix (no cancel)

### Fixes to apply
- **Task 3:** Add progress text + "Cancel" button to frame 11
- **Task 4:** Add "Skip →" link to frame 10

### New frames to add
| Frame ID (new) | Name | Description |
|----------------|------|-------------|
| F4-NEW-01 | AI: Prompt Bar Active | Bottom-of-canvas prompt bar expanded — text input focused, suggested prompts shown |
| F4-NEW-02 | AI: Result — Accept/Reject | Generated content on canvas with floating "Keep it" / "Try again" / "Edit prompt" action bar |
| F4-NEW-03 | AI: Refine Modal | Refinement prompt with original result shown as preview, "Make it more minimal", etc. |
| F4-NEW-04 | AI: Inspector Suggestions | Inspector panel with "AI Suggestions" section — 3 style suggestions with apply buttons |

### Prototype links for Flow 4
```
TopBar AI icon → 10 (AI Entry Point)
10 → "Skip →" → normal canvas (01 or 26)
10 → tile click → F4-NEW-01 (Prompt Bar Active)
F4-NEW-01 → Submit → 11 (AI Generating)
11 → "Cancel" → 10 (AI Entry Point)
11 (complete) → F4-NEW-02 (AI Result)
F4-NEW-02 → "Keep it" → 26 (canvas, element selected)
F4-NEW-02 → "Try again" → F4-NEW-03 (Refine Modal)
F4-NEW-03 → Submit → 11 (AI Generating)
Inspector (26/46) → AI Suggestions section → F4-NEW-04
```

---

## Flow 5 — Settings

**User story:** User opens Settings panel → sees quick settings → navigates to full settings page → changes domain.

### Existing frames in this flow
- `hcxlF` (22 — Settings Panel) — quick sidebar panel
- `VSDXS` (39 — Settings: Navigation)
- `cUVnH` (40 — Publish Settings) — needs Task 6 layout fix
- `LVzth` (45 — Settings: Domain)

### Fixes to apply
- **Task 6:** Fix frame 40 — restructure Publish Settings to match VSDXS pattern
- **Task 13:** Add "Full Settings →" link to frame 22 + annotation clarifying quick vs full settings
- **Task 11:** Fix dark footer in frame 27 (Components Panel) — light theme

### New frames to add
| Frame ID (new) | Name | Description |
|----------------|------|-------------|
| F5-NEW-01 | Settings: Billing & Plan | Plan card (current plan), upgrade CTA, billing history table |
| F5-NEW-02 | Settings: Integrations | Grid of integration tiles (GA, Hotjar, Mailchimp, etc.) with connected/disconnected states |
| F5-NEW-03 | Settings: Team Members | Table of team members with role dropdown, invite button, remove action |

### Prototype links for Flow 5
```
Rail gear icon → 22 (Settings Panel)
22 → "Full Settings →" → 39 (Settings: Navigation)
39 → "Domain" nav item → 45 (Settings: Domain)
39 → "Publish" nav item → 40 (Publish Settings)
39 → "Billing" nav item → F5-NEW-01 (Billing & Plan)
39 → "Integrations" nav item → F5-NEW-02 (Integrations)
39 → "Team" nav item → F5-NEW-03 (Team Members)
```

---

## Flow 6 — Collaboration

**User story:** User invites a collaborator → collaborator joins → both see live cursors → conflict resolved.

### Existing frames
None — collaboration frames don't exist yet.

### New frames to add
| Frame ID (new) | Name | Description |
|----------------|------|-------------|
| F6-NEW-01 | Collab: Share Panel | Topbar "Share" click → slide-down panel with email invite input, role selector, copy link button |
| F6-NEW-02 | Collab: Invite Sent | Share panel + success state — "Invite sent to jane@..." toast |
| F6-NEW-03 | Collab: Live Cursors | Canvas with 2 colored cursors (red "Jane", blue "Marcus") + presence avatars in topbar |
| F6-NEW-04 | Collab: Conflict Toast | Toast — "Jane is editing this element" with "View" and "Take over" actions |
| F6-NEW-05 | Collab: Connection Lost | Banner — "Connection lost · Reconnecting..." amber bar at top |
| F6-NEW-06 | Collab: Reconnected | Banner → "Back online · All changes saved" green flash |

### Prototype links for Flow 6
```
TopBar "Share" → F6-NEW-01 (Share Panel)
F6-NEW-01 → "Send invite" → F6-NEW-02 (Invite Sent)
F6-NEW-01 → "Copy link" → F6-NEW-01 (link copied state)
Canvas (with collaborator) → F6-NEW-03 (Live Cursors)
F6-NEW-03 → same element click → F6-NEW-04 (Conflict Toast)
Network drop → F6-NEW-05 (Connection Lost)
F6-NEW-05 → reconnect → F6-NEW-06 (Reconnected)
```

---

## Component Library Additions

New reusable components to create alongside the flows that need them:

| Component | Created in Flow | Purpose |
|-----------|-----------------|---------|
| `ContextMenu` | Flow 1 | Right-click menu shell — used in canvas, layers panel |
| `Toast/success` | Flow 2 | Green success notification |
| `Toast/error` | Flow 2 | Red error notification |
| `Toast/warning` | Flow 3 | Amber warning notification |
| `Modal/base` | Flow 2 | Base modal shell with header + close + content slot |
| `ProgressBar` | Flow 2 | Used in publish in-progress and AI generating |
| `CMSFieldRow` | Flow 3 | CMS entry field row — label + input type |
| `BindingChip` | Flow 3 | Chain-link chip showing bound field name |
| `AIPromptBar` | Flow 4 | Bottom prompt bar component |
| `AISuggestionCard` | Flow 4 | Inspector suggestion card with apply button |
| `SettingsNavItem` | Flow 5 | Left nav item for full settings page |
| `Avatar/presence` | Flow 6 | Collab avatar with color ring + initials |
| `LiveCursor` | Flow 6 | Colored cursor with name label |

---

## Deprecated Frames

Move to bottom swim lane labeled `DEPRECATED — Do Not Implement`:

| Frame ID | Name | Reason |
|----------|------|--------|
| `5qjkQ` | 03 — Inspector (Selected) | Superseded by frames 46–49 (B-01) |
| `niyiH` | 20 — Inspector (old) | Superseded by frames 46–49 (B-01) |
| `Mk1L2` | 23 — Inspector: Image | Superseded by frames 46–49 (B-01) |
| `YBoj8` | 24 — Inspector: Box | Superseded by frames 46–49 (B-01) |
| `nkopD` | 34 — Inspector (old) | Superseded by frames 46–49 (B-01) |
| `jPkOS` | 35 — Inspector (old) | Superseded by frames 46–49 (B-01) |
| `l6Cy5` | 42 — Inspector (old) | Superseded by frames 46–49 (B-01) |

Each deprecated frame gets a red annotation overlay: `"DEPRECATED — See Frames 46–49 for canonical inspector design"`

---

## Success Criteria

- [ ] All 80+ existing frames organized into labeled swim lanes
- [ ] 7 deprecated inspector frames moved to DEPRECATED lane with annotation
- [ ] All 18 wireframe-design-fixes tasks applied (from `2026-03-28-wireframe-design-fixes.md`)
- [ ] ~37 new missing-state frames added across 6 flows
- [ ] ~13 new reusable components created in component library
- [ ] Every flow has complete prototype links — no dead ends, no orphan frames
- [ ] Every frame has at least one entry point and one exit path
- [ ] Final frame count: ~117 frames
- [ ] `get_screenshot` verified for every new and modified frame

---

## Out of Scope

- Code changes to `src/editor/` (covered by `2026-03-22-editor-redesign-v2.md`)
- Design token changes (no new colors/spacing beyond existing tokens)
- Animations or micro-interactions (prototype links only, no motion design)
- Mobile/responsive variants (desktop editor only)
