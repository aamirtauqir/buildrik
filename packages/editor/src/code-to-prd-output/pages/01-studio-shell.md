# Studio Shell & Top Bar

> **Module:** Shell
> **Source:** `src/editor/shell/`
> **Generated:** 2026-03-25

## Overview

The Studio Shell is the root orchestrator of the entire editor. It wraps all other UI modules (canvas, sidebar, inspector) and provides the top header bar with project-level controls: save status, undo/redo, device preview, zoom, AI assistant toggle, preview mode, and export.

## Layout

```
+----------------------------------------------------------------+
| [Logo]  [File▾]  [Undo] [Redo]  [Save Status]  [Device: Desktop ▾]  [Zoom: 100%]  [AI] [Preview] [Export] |
+-------+----------+----------------------------+----------------+
| Rail  | Sidebar  |         Canvas             |   Inspector    |
| 56px  | 280px    |       (flexible)           |    280px       |
+-------+----------+----------------------------+----------------+
|                  | [Page Tab Bar: Home | About | Contact]      |
+------------------+--------------------------------------------+
```

## Components

### Top Bar (`StudioHeader.tsx` / `Topbar.tsx`)

| Element | Type | Behavior |
|---------|------|----------|
| Logo / App name | Static | Displays "Aquibra Studio" branding |
| File menu | Dropdown | New project, open, save, save as, export, settings |
| Undo button | Icon button | Reverts last action; disabled when nothing to undo |
| Redo button | Icon button | Re-applies undone action; disabled when nothing to redo |
| Save status | Badge | Shows: Idle (no indicator), Saving (spinner), Saved (checkmark), Error (red dot) |
| Device selector | Dropdown | Desktop (1280px), Tablet (768px), Mobile (375px) |
| Zoom control | Input + buttons | Range 10%–500%; zoom-in (+), zoom-out (-), fit-to-screen, percentage input |
| AI toggle | Icon button | Opens/closes AI assistant sidebar |
| Preview button | Icon button | Toggles preview mode (enables interaction runtime, hides editing UI) |
| Export button | Primary button | Opens export modal |

### Page Tab Bar (`PageTabBar.tsx`)

| Element | Type | Behavior |
|---------|------|----------|
| Page tabs | Tab list | One tab per project page; click to switch active page |
| Active indicator | Visual | Highlighted/underlined active page tab |
| Add page button | Icon (+) | Creates new blank page and switches to it |

### Status Indicators (`StatusIndicators.tsx`)

| Indicator | Condition | Display |
|-----------|-----------|---------|
| Save status | Auto-tracked | "Saving..." spinner, "All changes saved" checkmark, "Save failed" error |
| Sync status | When cloud sync enabled | Connected (green), Syncing (blue pulse), Offline (gray) |
| Collaboration presence | When collaborators present | Avatar circles showing active users (max 3 + "+N" overflow) |

### CMS Preview Bar (`CMSPreviewBar.tsx`)

| Element | Type | Behavior |
|---------|------|----------|
| CMS preview toggle | Bar overlay | Appears when CMS bindings exist; shows live content preview from collection data |
| Content selector | Dropdown | Switch between CMS content items to preview different data |

## Interactions

### Page Load (Initialization)
- **Trigger:** Application mount
- **Behavior:** Composer engine initializes with project config → loads project data from storage → emits `COMPOSER_READY` → UI renders with loaded state
- **Auto-load:** If `autoLoad` config is true, last project loads automatically
- **Recovery:** If crash detected, RecoveryManager validates and repairs state
- **Onboarding:** First-time users see WelcomeModal before editor loads

### Save Project
- **Trigger:** Ctrl+S or auto-save (debounced after changes)
- **Behavior:** Save indicator shows "Saving..." → Composer serializes project → StorageAdapter persists → indicator shows "Saved"
- **On failure:** Indicator shows error state, toast notification with retry option
- **Dirty tracking:** `isDirty()` flag tracks unsaved changes; unsaved-changes warning on page unload

### Undo / Redo
- **Trigger:** Ctrl+Z (undo), Ctrl+Shift+Z (redo), or toolbar buttons
- **Behavior:** HistoryManager applies reverse/forward JSON patch → UI updates → toast shows action description ("Undo: delete element")
- **Special:** Rapid changes are coalesced (500ms debounce) into single history entries

### Device Preview
- **Trigger:** Select device from dropdown
- **Behavior:** Canvas viewport resizes to device width → Composer emits `BREAKPOINT_CHANGED` → breakpoint-specific styles apply → Inspector shows current breakpoint indicator
- **Devices:** Desktop 1280px, Tablet 768px, Mobile 375px

### Zoom
- **Trigger:** Zoom buttons, Ctrl+scroll, or direct percentage input
- **Behavior:** Canvas scales between 10%–500% → Composer emits `VIEWPORT_ZOOM` → all overlays recalculate positions
- **Special:** "Fit to screen" auto-calculates zoom to show entire canvas

### Preview Mode
- **Trigger:** Preview button or keyboard shortcut
- **Behavior:** Editing UI hides (selection handles, overlays, inspector) → InteractionManager starts runtime → animations and click handlers become active → user can interact with the design as end-users would
- **Exit:** Click preview button again or press Escape

## Engine Dependencies

| Manager | Role in Shell |
|---------|--------------|
| Composer | Central orchestrator; all shell actions go through it |
| HistoryManager | Undo/redo state and operations |
| StorageAdapter | Project save/load |
| Viewport | Device preview and zoom |
| RecoveryManager | Crash recovery on load |
| SyncManager | Cloud sync status |
| CollaborationManager | Presence indicators |
| InteractionManager | Preview mode runtime |

## Keyboard Shortcuts (Shell-Level)

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save project |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+0 | Reset zoom to 100% |
| Ctrl++ / Ctrl+- | Zoom in / out |

## Screen Relationships
- **Contains:** Canvas, Left Sidebar (10 tabs), Right Inspector, all modals
- **Data coupling:** Save status reflects Composer dirty state; device selector affects Canvas and Inspector breakpoint display
