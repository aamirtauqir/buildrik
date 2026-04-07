---
title: Collaboration — Real-Time Multi-User Editing
description: Design specification for presence, remote cursors, soft locks, conflict resolution, and offline queue
feature: collaboration
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../canvas/README.md
  - ../history-tab/README.md
dependencies:
  - Canvas (remote cursors and selections render here)
  - History Tab (activity log per user)
status: approved
---

# Collaboration — Real-Time Multi-User Editing

## Overview

Collaboration enables multiple users to edit the same project simultaneously. Presence avatars appear in the header (max 3 visible + overflow count), remote cursors follow each collaborator's mouse, and remote selections highlight which elements others are editing. Soft locks prevent conflicting edits on the same element, with a 15-second auto-release and a "Done editing" button. OT (Operational Transform) auto-resolves style conflicts, while structural conflicts show a visual side-by-side diff. A connection quality indicator and offline queue ensure reliability.

**Primary User Goal:** Edit alongside teammates without conflicts or data loss.
**Success Criteria:** Two users editing different elements experience zero interference; same-element conflicts resolve in < 2 seconds.
**Key Pain Points Addressed:** No more "who overwrote my changes"; real-time awareness of team activity.

---

## Layout Architecture

```
┌──────────────────────────────────────────────────────┐
│ Header:   [...] [👤A] [👤B] [👤C] [+2]  [🟢 Connected]│
├──────────────────────────────────────────────────────┤
│                                                      │
│                    CANVAS                            │
│                                                      │
│     ↗ Sarah (teal cursor)                            │
│          ┌─[teal]──────────────┐                     │
│          │ Sarah is editing    │                      │
│          │ (Heading element)   │ Soft lock indicator  │
│          └─────────────────────┘                     │
│                                                      │
│              ↗ Alex (purple cursor)                   │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Screen States

### State 1: Presence Avatars (Header)

- **Avatars:** 28px circles, user's profile photo or initials on colored bg. Max 3 visible.
- **Overflow:** "+2" badge in `--aqb-chrome-surface`, `--aqb-text-secondary` if > 3 collaborators.
- **Hover avatar:** Tooltip with full name + role (Owner/Editor/Viewer).
- **Online ring:** 2px `--aqb-success` border on active users. Gray border for idle (> 5 min).
- **Color assignment:** Each user gets a unique color from a preset palette (teal, purple, orange, pink, lime, cyan). Persists per session.

### State 2: Remote Cursors

- **Cursor:** 12px arrow icon in the user's assigned color, rendered on canvas overlay.
- **Label:** User's first name in a pill next to cursor, same color bg, white text, `--aqb-caption`.
- **Movement:** Smooth interpolation at 30fps (not raw position updates — reduces jitter).
- **Fade:** Cursor fades to 30% opacity after 10 seconds of no movement. Returns to 100% on move.
- **Z-index:** 200-299 range (above selection overlays, below menus).

### State 3: Remote Selections

- **Visual:** Colored bounding box (user's color, 1px solid) around elements other users have selected.
- **Label:** User name + element type as badge at top-left of bounding box, in user's color.
- **No handles:** Remote selections show outline only (no resize handles — only the selecting user can resize).

### State 4: Soft Locks

- **Trigger:** When a user starts editing an element (typing, resizing, style changing).
- **Visual:** Lock badge on element: "[Name] is editing" in user's color, small banner above the element.
- **Behavior:** Other users can select the element (read) but cannot edit it (inputs disabled).
- **Release:** Auto-releases after 15 seconds of inactivity, or user clicks "Done editing" button.
- **Done button:** Appears in Inspector header when user has an active lock. `--aqb-primary` text.

### State 5: Style Conflict (OT Auto-Resolve)

- **Scenario:** Two users edit different CSS properties on the same element simultaneously.
- **Resolution:** OT merges both changes. Both users see both changes applied.
- **Visual feedback:** Brief yellow flash (200ms, `--aqb-warning-subtle`) on the element, toast: "Merged changes from [Name]".

### State 6: Structural Conflict (Side-by-Side Diff)

- **Scenario:** Two users make conflicting structural changes (e.g., both reparent the same element).
- **Modal:** Side-by-side diff showing "Your Change" vs "[Name]'s Change" with visual previews.
- **Actions:** [Keep Mine] [Keep Theirs] [Keep Both]. The second user to commit sees the modal.
- **Visual:** Left panel highlighted in user's color, right panel in other user's color.

### State 7: Connection Quality Indicator

- **Position:** Header, next to presence avatars.
- **States:**
  - Green dot + "Connected": Stable WebSocket connection
  - Yellow dot + "Slow": Latency > 500ms
  - Red dot + "Reconnecting...": Connection lost, attempting reconnect
  - Gray dot + "Offline": No connection, changes queued locally

### State 8: Offline Queue

- **Banner:** Below header, `--aqb-warning-subtle` bg: "You're offline. Changes are saved locally and will sync when reconnected."
- **Queue indicator:** "[N] changes pending sync" counter.
- **Reconnect:** Auto-sync on reconnection. Conflicts resolved via OT or diff modal.

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| User joins project | Avatar appears in header, cursor appears on canvas | Fade-in, 200ms |
| User leaves | Avatar removed, cursor fades out | Fade-out, 300ms |
| User selects element | Remote selection box appears for others | Instant outline |
| User starts editing | Soft lock activates for that element | Lock badge fade-in, 150ms |
| Click "Done editing" | Releases soft lock immediately | Lock badge fade-out, 150ms |
| 15s inactivity on locked element | Auto-release lock | Lock badge fade-out, 300ms |
| Style conflict detected | OT auto-merge | Element yellow flash, 200ms |
| Structural conflict detected | Diff modal appears for second user | Modal fade-in, 150ms |
| Connection lost | Indicator turns red, offline banner appears | Instant state change |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Cursor position broadcast | < 50ms latency |
| Selection sync | < 100ms |
| Soft lock acquisition | < 100ms |
| OT merge (style conflict) | < 200ms |
| Structural diff modal render | < 300ms |
| Reconnection after disconnect | < 5s (exponential backoff) |
| Offline queue capacity | 500 operations |

---

## Accessibility

- **Presence avatars:** `aria-label="[Name], [role], [online/idle]"` on each avatar
- **Remote cursors:** Not announced by screen reader (visual-only, non-blocking)
- **Soft locks:** Inspector announces "Element locked by [Name]" when user focuses a locked element
- **Conflict modal:** Focus trapped, `role="alertdialog"`, auto-focus on first action button
- **Connection indicator:** `aria-live="assertive"` announces connection state changes
- **Offline banner:** `role="alert"`, announced immediately

---

## Implementation Notes

- WebSocket connection via `Composer.collaboration.connect()` — single persistent connection per session
- Cursor positions debounced to 30fps before broadcast to reduce bandwidth
- OT engine handles concurrent style changes using transform functions on CSS property paths
- Structural conflicts detected by comparing operation targets (same element, incompatible operations)
- Soft locks stored server-side with TTL (15s), refreshed on each edit action
- Offline queue uses IndexedDB for persistence; replayed on reconnect in order
- Color assignment: server assigns from palette, persists per user per project

---

## Related Documentation
- [Canvas](../canvas/README.md) — Remote cursors and selections render here
- [History Tab](../history-tab/README.md) — Activity log shows per-user actions
- [Publish Tab](../publish-tab/README.md) — Role-based publish permissions
- [Style Guide](../../design-system/style-guide.md) — Avatar, cursor, and badge specs
