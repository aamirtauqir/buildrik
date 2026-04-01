# Wireframe Design Fixes — Hold Scope

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 18 identified design issues in `editer.pen` so every frame is implementable without guessing.

**Architecture:** All changes are pencil.dev wireframe edits (batch_design operations). No code changes. No new frames added.

**Tech Stack:** pencil MCP tools (batch_get, batch_design, get_screenshot)

**File:** `/Users/shahg/Desktop/pencil/editer.pen`

---

## Phase 1 — Critical: Broken Flows & Dead Ends (5 fixes)

### Task 1: Delete deprecated Frame 06

**Frame:** `Vv8n3` (06 — Publish Flow DEPRECATED)

This frame contradicts the newer publish flow (frames 31/32). An implementer reading top-to-bottom will see two competing publish modals.

- [ ] Delete frame `Vv8n3` entirely using `D("Vv8n3")`
- [ ] Verify deletion with batch_get — node should not exist

---

### Task 2: Fix Frame 19 — Breakpoint Editing (dead end)

**Frame:** `Znv6u` (19 — Breakpoint Editing)

Currently shows a mobile-sized canvas with no controls. User has no visible way to switch breakpoints or return to desktop. Need to add:
- Breakpoint switcher bar in topbar (Desktop / Tablet / Mobile chips, Mobile active)
- Canvas shows mobile-width (375px) white frame centered on gray bg (already there)

- [ ] Read `Znv6u` children to find topbar node
- [ ] Insert breakpoint chips in topbar: `[Desktop] [Tablet] [Mobile•]` — Mobile chip should be active (blue fill)
- [ ] Screenshot and verify breakpoint controls are visible

---

### Task 3: Fix Frame 11 — AI Generating (dead end)

**Frame:** `zSiUu` (11 — AI Generating)

Skeleton loader with no user actions. Need:
- Progress text below skeleton: "Generating your page... This usually takes 10–20 seconds"
- Cancel button: "Cancel" ghost button below progress text

- [ ] Read `zSiUu` children to find canvas area
- [ ] Insert progress text centered below skeleton placeholder
- [ ] Insert "Cancel" ghost button below progress text
- [ ] Screenshot and verify text + button visible

---

### Task 4: Fix Frame 10 — AI Entry Point (no exit path)

**Frame:** `bNn49` (10 — AI Entry Point)

"What would you like to create?" has 3 tiles but no way to dismiss. Need a "Skip →" link or close button.

- [ ] Read `bNn49` to find the tile container
- [ ] Insert "Skip →" text link (ghost style, #6B7280) below the tiles or top-right of the container
- [ ] Screenshot and verify skip option is visible

---

### Task 5: Add inspector tab header to frames 23, 24, 26

**Frames:** `Mk1L2` (23 — Inspector: Image), `YBoj8` (24 — Inspector: Box), `1qeGh` (26 — Canvas: Selection Handles)

These 3 frames still show the OLD inspector format without Layout/Appearance/Effects tabs. Frames 02, 03, and 20 already have the updated tab row. The inspector must be consistent across ALL frames that show it.

- [ ] Read each frame's inspector panel node
- [ ] Insert the same 3-tab row (Layout / Appearance / Effects) at index 1 in each inspector, matching the format used in frame 03 (`5qjkQ`)
- [ ] Screenshot all 3 frames and verify tabs appear

---

## Phase 2 — High: Visual Bugs & Spec Violations (6 fixes)

### Task 6: Fix Frame 40 — Publish Settings layout

**Frame:** `cUVnH` (40 — Publish Settings)

Layout is broken — canvas content and publish settings panels overlap in a confusing way. This should match the pattern of Settings: Navigation (`VSDXS`) — a clean full-page settings layout with left nav + right content area.

- [ ] Read `cUVnH` structure to understand current layout
- [ ] Restructure to match VSDXS pattern: full-page layout, settings content centered
- [ ] Screenshot and verify clean layout

---

### Task 7: Fix Frame 49 — Inspector Empty State tabs

**Frame:** `otRcF` (49 — Inspector: Empty State)

Inspector tabs show as active, spec says they should be greyed-out when nothing is selected.

- [ ] Read `otRcF` inspector to find tab nodes
- [ ] Update tab text fills to muted color (#9CA3AF) and remove any active-state blue fill
- [ ] Ensure "Select an element" empty state text is visible and centered
- [ ] Screenshot and verify greyed tabs

---

### Task 8: Fix section frame 50 (Typography) — Align chips

**Frame:** `EczLD` (50 — Section: Typography)

Align row shows only 2 generic "A B" chips. Spec calls for 4 text alignment options.

- [ ] Find the Align chip group in EczLD
- [ ] Update to show 4 chips with labels: "L" "C" "R" "J" (or text-align icons)
- [ ] Screenshot and verify 4 alignment options visible

---

### Task 9: Fix section frames 51, 52 — placeholder chips/inputs

**Frames:** `yzZi1` (51 — Flexbox), `VasUA` (52 — Grid)

Flexbox Direction/Wrap/Justify/Align all show "A B" placeholder chips. Grid fields show "Search..." instead of input values.

- [ ] Frame 51: Update Direction to show 4 chips (→ ↓ ← ↑ or "Row" "Col" "Row-R" "Col-R")
- [ ] Frame 51: Update Wrap to show 2 chips ("No wrap" "Wrap")
- [ ] Frame 51: Update Justify to show 5 chips ("Start" "Center" "End" "Between" "Around")
- [ ] Frame 51: Update Align to show 4 chips ("Start" "Center" "End" "Stretch")
- [ ] Frame 52: Update Columns input placeholder to "1fr 1fr 1fr"
- [ ] Frame 52: Update Rows input placeholder to "auto auto"
- [ ] Frame 52: Update Col/Row gap to "16 px"
- [ ] Frame 52: Update Auto flow chips to "Row" "Column" "Dense"
- [ ] Screenshot both frames

---

### Task 10: Fix section frame 53 (Background) — missing controls

**Frame:** `0DMJA` (53 — Section: Background)

Missing alpha bar and Solid/Gradient/Image/None type selector.

- [ ] Read 0DMJA structure
- [ ] Add type selector chip row at top: "Solid" (active) / "Gradient" / "Image" / "None"
- [ ] Add alpha/opacity bar below the hue bar
- [ ] Add "Opacity" label + input field: "100%"
- [ ] Screenshot and verify

---

### Task 11: Fix Frame 27 — Components Panel dark footer

**Frame:** `zvcio` (27 — Components Panel)

Canvas shows a dark "© 2025 Buildrik" footer bar. This is theme-inconsistent with the light canvas.

- [ ] Read zvcio to find the dark footer rectangle
- [ ] Update the footer background to light theme (#1F2937 → #F3F4F6) and text color to dark (#E2E8F0 → #374151)
- [ ] Update copyright year text from "2025" to "2026"
- [ ] Screenshot and verify light footer

---

## Phase 3 — Medium: Structural/Navigation Fixes (5 fixes)

### Task 12: Fix duplicate frame number "31"

**Frames:** `Fmw5T` (31 — Design System: Colors), `szUXT` (31 — Publish: Pre-launch Checklist)

Two frames both numbered 31. Looking at the existing numbering (S6Yog = "41 — Design System: Colors"), `Fmw5T` appears to be a duplicate. `szUXT` has the publish content.

- [ ] Rename `Fmw5T` from "31 — Design System: Colors" to "31A — Design System: Colors (Detail)"
  OR if Fmw5T and S6Yog are the same content, delete Fmw5T
- [ ] Read both Fmw5T and S6Yog to compare — decide if one is redundant
- [ ] Screenshot and verify

---

### Task 13: Clarify settings UI relationship

**Frames:** `hcxlF` (22 — Settings Panel), `VSDXS` (39 — Settings: Navigation), `LVzth` (45 — Settings: Domain)

Sidebar settings panel (hcxlF) and full-page settings (VSDXS, LVzth) show overlapping content (Site Name appears in both). Need to clarify the relationship.

- [ ] Add annotation to hcxlF: "Quick settings — opens full settings via gear icon →"
- [ ] Add a "Full Settings →" link/button at the bottom of hcxlF sidebar
- [ ] This makes it clear: sidebar = quick access, full page = complete settings
- [ ] Screenshot hcxlF with the annotation

---

### Task 14: Fix Frame 04 — Templates Panel count

**Frame:** `eHMi7` (04 — Templates Panel)

Shows 4 templates but the picker modal (`zfHWo`) shows 6. These should match.

- [ ] Read eHMi7 to find template grid
- [ ] Add 2 more template thumbnails: "Services" and "Link in Bio" (matching zfHWo colors)
- [ ] Add "Blank" card with + icon
- [ ] Screenshot and verify 6 templates visible

---

### Task 15: Fix Frame 14 — rename

**Frame:** `gXzzP` (14 — Publish Error Modal)

The modal content shows pre-publish warnings ("Before you publish..."), not a publish error. The name should match the content.

- [ ] Rename frame from "14 — Publish Error Modal" to "14 — Pre-publish Warnings Modal"
- [ ] Verify with batch_get

---

### Task 16: Reconcile Mobile Gate frames 21 and 05

**Frames:** `x27ZA` (21 — Mobile Gate), `O3NI7` (05 — Mobile Gate Banner)

Both show the same mobile warning concept.

- [ ] Read both frames to compare content
- [ ] If identical: add annotation to O3NI7 "See also Frame 21 (full context)" and to x27ZA "Close-up: Frame 05"
- [ ] If different states: rename to clarify (e.g. "21 — Mobile Gate: Full Editor" vs "05 — Mobile Gate: Banner Only")
- [ ] Screenshot and verify

---

## Phase 4 — Low: Polish (2 fixes)

### Task 17: Fix border section 54 — placeholder chips

**Frame:** `LiumT` (54 — Section: Border + Radius)

Style row shows generic "A B" chips instead of border style options.

- [ ] Update Style chips to show: "Solid" "Dashed" "Dotted" "None" (4 chips)
- [ ] Update Width placeholder from "Search..." to "1 px"
- [ ] Screenshot and verify

---

### Task 18: Fix Frame 33 status bar text

**Frame:** `Ql3YU` (33 — AI Result: Edit Mode)

Bottom status says "Saving in progress" which is misleading — the user is editing AI-generated content, not saving.

- [ ] Read Ql3YU to find the bottom status text
- [ ] Update text to "AI generated · Editing" or "Unsaved changes"
- [ ] Screenshot and verify

---

## Success Criteria

- All 18 tasks verified via get_screenshot
- No deprecated frames remain in file
- Every inspector frame shows consistent 3-tab header
- All section close-ups (50–57) show actual control labels, not placeholders
- Frame numbering has no duplicates
- Every frame has a clear user action path (no dead ends)
