# History Tab

> **Module:** Sidebar — Tab 10
> **Source:** `src/editor/sidebar/tabs/history/`
> **Keyboard Shortcut:** H
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

The History tab provides a visual timeline of all project changes. It has two view modes: **Versions** (undo/redo stack with hover-to-preview, click-to-jump states) and **Activity** (chronological log of edits by all collaborators with **per-user filtering**).

## Layout

### Versions View
```
+---------------------------+
| History                   |
| [Versions] [Activity]    |
+---------------------------+
| Current State        NOW  |
+---------------------------+
| ↺ Added "Hero Section"   |
|   2 min ago               |
|   [▶ Expand diff]         |
+---------------------------+
| ↺ Changed text color      |
|   5 min ago               |
+---------------------------+
| ↺ Deleted "Old Header"   |
|   8 min ago               |
+---------------------------+
| ↺ Applied template        |
|   12 min ago              |
+---------------------------+
| ... (scrollable)          |
+---------------------------+
| [Undo] [Redo]             |
| [Clear History ⚠]        |
+---------------------------+
```

### Activity View
```
+---------------------------+
| History                   |
| [Versions] [Activity]    |
+---------------------------+
| Filter: [All Users ▾]    |
|  [Shah] [Sarah] [Tom]    |
+---------------------------+
| Today                     |
|  👤 Shah edited "Hero"   |
|     3:45 PM               |
|  👤 Sarah added section   |
|     3:30 PM               |
|  👤 Shah added page       |
|     3:15 PM               |
+---------------------------+
| Yesterday                 |
|  👤 Tom resized image     |
|     5:12 PM               |
|  👤 Sarah changed colors  |
|     4:30 PM               |
+---------------------------+
```

## Fields

### Version Entry
| Element | Type | Behavior |
|---------|------|----------|
| Action label | Text | Human-readable description ("Added element", "Changed style", etc.) |
| Timestamp | Text | Relative time ("2 min ago") |
| Expand diff button | Icon | Shows what changed (property-level diff) |
| **Hover** | Preview | Hovering over a version entry shows a lightweight preview of that state (no commit). Allows browsing history without losing current work |
| **Click** | Jump | Clicking jumps to this version state (equivalent to multiple undos) |

### Activity Entry
| Element | Type | Behavior |
|---------|------|----------|
| User avatar | Icon (colored) | Collaborator who made the change, with their assigned collaboration color |
| Action description | Text | What they did |
| Timestamp | Text | Absolute time |

### Activity User Filter
| Element | Type | Behavior |
|---------|------|----------|
| Filter dropdown | Multi-select | Default: "All Users". Can select individual team members to show only their changes |
| User chips | Chip group | Quick toggle: click a user's chip to filter activity to only their entries |

### Footer Actions
| Element | Type | Behavior |
|---------|------|----------|
| Undo button | Button | Same as Ctrl+Z |
| Redo button | Button | Same as Ctrl+Shift+Z |
| Clear History | Danger button | Removes all history entries (cannot be undone) |

## Interactions

### Hover to Preview Version
- **Trigger:** Hover over a version entry for > 300ms
- **Behavior:** Canvas shows a lightweight preview of that version state (semi-transparent overlay or split-view) without actually committing to the jump. Moving the mouse away restores current state.
- **Rationale:** Design teams need to browse history visually ("which version had the old hero?") without committing to destructive jumps.

### Click to Jump to Version
- **Trigger:** Click a version entry
- **Behavior:** Project state reverts to that point in time → canvas updates → all subsequent entries become "redo" candidates
- **Note:** This is equivalent to multiple undo operations

### Expand Diff
- **Trigger:** Click expand button on version entry
- **Behavior:** Shows property-level changes: element added/removed, style property changed (from → to), content changed

### Filter Activity by User
- **Trigger:** Select user(s) in filter dropdown or click user chip
- **Behavior:** Activity list filtered to show only selected user's changes. "All Users" restores full view.
- **Use case:** Team lead asking "what did Sarah change today?" — single click to see only Sarah's edits.

### Switch View Mode
- **Trigger:** Click "Versions" or "Activity" tab
- **Behavior:** List content switches between undo/redo stack and chronological activity log

### Clear History
- **Trigger:** Click "Clear History"
- **Behavior:** Confirmation modal ("This cannot be undone. All undo history will be lost.") → on confirm, history stack cleared → only current state remains

## Business Rules

1. History uses JSON patches (diffs), not full snapshots — memory efficient
2. Rapid changes within 500ms are coalesced into a single entry (debounced)
3. Full checkpoint snapshots are created every 10 patches for faster jump-to-version
4. Transaction groups (e.g., template apply) appear as single entries
5. History is session-scoped — cleared on page refresh unless VersionHistoryManager saves to IndexedDB
6. Named version snapshots (from VersionHistoryManager) persist across sessions
7. **Activity view persists across sessions** (stored via CollaborationManager + SyncManager) even though presence is ephemeral. This gives teams historical attribution.
8. History descriptions are formatted by HistoryFormatter from raw patch data
9. **Per-user filtering in Activity view** allows team leads to isolate individual team members' changes
10. **Hover-to-preview** allows non-destructive browsing of version history before committing to a jump

## Screen Relationships
- **Bidirectional with:** Canvas (version jump/hover updates canvas), all sidebar tabs (state changes reflected)
- **Data coupling:** HistoryManager is the source of truth for Versions view; CollaborationManager + SyncManager for Activity view attribution
