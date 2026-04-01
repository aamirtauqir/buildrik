# Collaboration

> **Module:** Collaboration
> **Source:** `src/editor/collaboration/` + `src/engine/collaboration/`
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

Real-time collaboration enables multiple users to edit the same project simultaneously. The system tracks user presence, broadcasts cursor positions, shows remote element selections, manages element-level locking with **15-second auto-release**, and resolves conflicts using Operational Transformation (OT) with **visual side-by-side diffs** for structural conflicts.

## UI Components

### Presence Indicators (`PresenceIndicators.tsx`)
| Element | Behavior |
|---------|----------|
| Avatar circles | Show in header; each active collaborator gets a colored avatar |
| Overflow badge | "+N" when more than 3 collaborators |
| Tooltip | Hover avatar to see user name and editing status |

### Remote Cursors (Canvas Overlay)
| Element | Behavior |
|---------|----------|
| Colored cursor | Each collaborator gets a unique color |
| Name label | Username shown next to cursor |
| Position sync | Updates in near-real-time |

### Remote Selections (Canvas Overlay)
| Element | Behavior |
|---------|----------|
| Selection outline | Colored bounding box matching collaborator's assigned color |
| Selection label | "User is editing [Element Name]" |

### Connection Quality Indicator (`ConnectionQualityIndicator.tsx`)
| State | Display |
|-------|---------|
| Connected | Green dot |
| Syncing | Blue pulsing dot |
| Offline | Gray dot with "Offline" label |
| Reconnecting | Yellow with spinner |

## Engine Architecture

### CollaborationManager
| Method | Purpose |
|--------|---------|
| `joinRoom(roomId)` | Join a collaboration session |
| `leaveRoom()` | Leave current session |
| `broadcastCursor(position)` | Send cursor position to peers |
| `updateSelection(elementIds)` | Broadcast current selection |
| `acquireLock(elementId)` | Request exclusive edit lock on element |
| `releaseLock(elementId)` | Release edit lock |
| `setEditingState(elementId)` | Indicate active editing |

### Operational Transformation (OTEngine)
- Transforms concurrent operations to maintain consistency
- Resolves conflicts when two users edit the same element simultaneously
- Operations: insert, delete, retain

### Element Locking
| Type | Behavior |
|------|----------|
| Soft lock | Visual indicator that another user is editing; doesn't prevent local edits |
| Edit state | Shows "User is editing this element" badge |
| **"I'm done" button** | Explicit release: user can click "Done editing" on the lock badge to release early |
| Auto-release | Locks auto-release after **15 seconds of no mouse/keyboard activity** (not 3-5s — designers pause to think) |

## Interactions

### Join Session
- **Trigger:** Open project that has collaboration enabled
- **Behavior:** User assigned unique color → presence indicator appears for all participants → cursor tracking begins

### See Remote Activity
- **Trigger:** Other user moves cursor, selects element, or edits
- **Behavior:** Remote cursor moves on canvas → selection highlights appear → editing indicators show in real-time

### Release Lock Early
- **Trigger:** Click "Done editing" button on the soft lock badge
- **Behavior:** Lock released immediately → lock badge disappears → element becomes available for other team members
- **Rationale:** Explicit "I'm done" is clearer than waiting for auto-release timeout

### Conflict Resolution (Visual Diff)
- **Trigger:** Two users edit the same property simultaneously
- **Behavior for style properties:** OT engine transforms operations → last write wins (auto-resolved, no modal)
- **Behavior for structural changes** (delete/move/reparent): Conflict modal appears with **visual side-by-side diff**:

```
+--------------------------------------------+
| Conflict: Hero Section                      |
+--------------------------------------------+
| Your version:     | Their version:          |
| [Visual preview   | [Visual preview         |
|  showing your     |  showing their          |
|  changes]         |  changes]               |
+--------------------------------------------+
| [Keep Mine] [Keep Theirs] [Keep Both]       |
+--------------------------------------------+
```

- **Visual diff shows rendered previews**, not text descriptions of what changed. Designers need to SEE the difference, not read about it.

### Go Offline
- **Trigger:** Network connection lost
- **Behavior:** Connection indicator turns gray → operations queued locally (OfflineQueue) → on reconnect, queued ops replayed and merged

## Events

| Event | When |
|-------|------|
| `user:joined` | New collaborator enters the session |
| `user:left` | Collaborator disconnects |
| `cursor:moved` | Remote cursor position update |
| `editing:started` | User begins editing an element |
| `lock:acquired` | Element lock granted |
| `lock:released` | Element lock released (auto or manual "Done editing") |

## Business Rules

1. Each collaborator gets a unique color (assigned on join)
2. Cursor broadcasting is throttled to ~60fps equivalent for performance
3. **Soft locks auto-release after 15 seconds of inactivity** (mouse/keyboard idle). This gives designers thinking time without creating stale locks.
4. **Explicit "Done editing" button** allows early lock release — clearer than relying solely on timeout
5. Offline operations are queued and replayed on reconnect
6. OT ensures eventual consistency — no data loss even with concurrent edits
7. Collaboration requires a shared backend (via SyncManager) — local-only projects are single-user
8. Presence data is ephemeral — not persisted after session ends. **But editing history (Activity view) persists** across sessions via SyncManager for team attribution.
9. **Conflict modal shows visual side-by-side diffs** for structural conflicts. Style conflicts auto-resolve via last-write-wins (no modal needed).

## Screen Relationships
- **Visible on:** Header (presence avatars), Canvas (cursors, selections, locks)
- **Data coupling:** CollaborationManager events drive all UI updates; SyncManager handles persistence; HistoryManager integrates remote operations via `applyRemoteOperation()`
