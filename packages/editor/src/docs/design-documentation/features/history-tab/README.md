---
title: History Tab — Undo/Redo & Activity Log
description: Design specification for the history panel with version timeline, hover-to-preview, and activity feed
feature: history-tab
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../canvas/README.md
  - ../collaboration/README.md
dependencies:
  - Canvas (preview and jump-to-version render here)
  - Collaboration (per-user activity filtering)
status: approved
---

# History Tab — Undo/Redo & Activity Log

## Overview

The History Tab provides two views: Versions (the undo/redo stack with hover-to-preview and click-to-jump) and Activity (a chronological per-user activity log). The undo system uses JSON patches with a 500ms coalesce window (rapid edits become a single entry) and creates checkpoints every 10 patches for fast random-access jumping.

**Primary User Goal:** Revert mistakes instantly and understand what changed and when.
**Success Criteria:** Hover-to-preview appears in < 300ms; jumping to any version takes < 500ms.
**Key Pain Points Addressed:** Users can see the exact visual impact of each change before committing to a revert.

---

## Layout Architecture

```
┌──────────────────────────────┐ 280px
│ History                      │ Header
├──────────────────────────────┤
│ [Versions] [Activity]        │ 2-tab toggle
├──────────────────────────────┤
│ ── Now ──────────────────── │ Current state marker
│                              │
│ ○ Changed heading color      │ 2:34 PM
│ │ Style · Heading            │
│ │                            │
│ ○ Added CTA button           │ 2:32 PM
│ │ Insert · Button            │
│ │                            │
│ ● Resized hero image ←──────│ Active (jumped-to)
│ │ Layout · Image             │
│ │                            │
│ ○ Moved section up           │ 2:28 PM
│ │ Reorder · Section          │
│ │                            │
│ ○ Template applied           │ 2:15 PM
│ │ ★ Checkpoint               │ Checkpoint badge
│ │                            │
│ ── Start ───────────────── │
├──────────────────────────────┤
│ [Clear History]              │ Danger action
└──────────────────────────────┘
```

---

## Screen States

### State 1: Versions View (Default)

- **Timeline:** Vertical line, 1px, `--aqb-chrome-border`, left-aligned at 12px.
- **Version nodes:** 8px circles on the timeline. Default: `--aqb-chrome-border` fill. Active (current): `--aqb-primary` fill, 12px.
- **Entries:** 48px min-height. Action description in `--aqb-body-sm`, `--aqb-text-primary`. Category + element type in `--aqb-caption`, `--aqb-text-tertiary`. Timestamp right-aligned, `--aqb-caption`.
- **Future entries (after undo):** Dimmed, 50% opacity. These are redo-able states.
- **Checkpoint badge:** Star icon + "Checkpoint" in `--aqb-warning` text on every 10th entry.

### State 2: Hover-to-Preview

- **Trigger:** Mouse hovers over a version entry for 300ms.
- **Canvas:** Shows a ghost preview of the page at that version state. Semi-transparent overlay (50% opacity) over current canvas content.
- **Badge on canvas:** "Preview: [action description]" pill at top of canvas, `--aqb-warning` bg.
- **Leave hover:** Preview fades out in 150ms, current state restores.

### State 3: Jumped-to-Version

- **Trigger:** Click a version entry.
- **Canvas:** Fully renders the page at that version state (not a preview — this is now the active state).
- **Timeline:** Clicked node becomes solid `--aqb-primary`. All entries above it are "future" (dimmed).
- **Redo available:** User can click entries above to move forward again.
- **New edits:** If user makes changes while jumped-back, future entries are discarded (standard undo tree behavior).

### State 4: Activity View

- **Log entries:** Chronological, most recent first. Each entry shows: avatar (24px circle), user name, action, timestamp.
- **Per-user filter:** Dropdown at top showing all collaborators. Select one to filter.
- **Entry format:** "[Avatar] Sarah changed heading color — 2:34 PM"
- **Clickable:** Activity entries that correspond to version changes are clickable (jump to that version).
- **Non-version entries:** Login/logout, page navigation, comments — shown but not clickable.

### State 5: Clear History Confirmation

- **Trigger:** Click "Clear History" button.
- **Modal:** "Clear all history? This cannot be undone. Current page state will be preserved but all undo/redo history will be lost."
- **Buttons:** [Cancel] ghost + [Clear History] destructive (red).

### State 6: Empty History

- **Visual:** "No changes yet. Start editing to build history." Centered, `--aqb-text-tertiary`.

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Hover version (300ms) | Ghost preview on canvas | Fade-in 150ms overlay |
| Click version | Jump to that state | Canvas re-renders, < 500ms |
| Ctrl+Z | Undo (move one step back on timeline) | Active node moves down |
| Ctrl+Shift+Z | Redo (move one step forward) | Active node moves up |
| Click Activity tab | Shows chronological log | Tab switch, 100ms |
| Filter by user | Shows only that user's activity | List fade-transition, 150ms |
| Click Clear History | Confirmation modal | Modal fade-in 150ms |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Undo/redo (single step) | < 50ms |
| Jump to checkpoint | < 200ms (direct restore from snapshot) |
| Jump to non-checkpoint | < 500ms (replay patches from nearest checkpoint) |
| Hover preview render | < 300ms |
| History list render (100 entries) | < 100ms (virtualized) |
| Patch coalesce window | 500ms |
| Checkpoint interval | Every 10 patches |

---

## Accessibility

- **Version timeline:** `role="listbox"`, `role="option"` per entry. Arrow keys navigate. Enter to jump.
- **Active version:** `aria-selected="true"`, announced as "Current version"
- **Hover preview:** Not keyboard-triggered (keyboard users jump directly via Enter)
- **Activity filter:** `aria-label="Filter activity by user"`, standard dropdown
- **Clear History:** Confirmation modal focus-trapped, auto-focus on Cancel
- **Timestamps:** `<time>` elements with `datetime` attribute for screen readers

---

## Implementation Notes

- Undo system uses JSON Patch (RFC 6902) for compact diffs
- 500ms coalesce: rapid style changes (e.g., dragging a slider) merge into one patch
- Checkpoints are full state snapshots stored every 10 patches for fast random access
- Jump-to-version: find nearest checkpoint, replay patches forward/backward
- Activity log sourced from `Composer.collaboration.getActivityLog()` — includes all user events
- History stored in memory with configurable max depth (default: 200 entries)

---

## Related Documentation
- [Canvas](../canvas/README.md) — Preview and jump-to render here
- [Collaboration](../collaboration/README.md) — Activity log per-user filtering
- [Templates Tab](../templates-tab/README.md) — Template apply is a single history entry
- [Style Guide](../../design-system/style-guide.md) — Timeline and badge specs
