# Module 06 — Collaboration

## Problem

The engine has a complete collaboration system: CollaborationManager (790 LOC) with OT engine (450 LOC) for real-time operational transformation. PresenceIndicators UI exists showing connected user avatars. ConnectionQualityIndicator shows network status.

But: there's no way to invite collaborators. No permission model. No live cursor visualization on canvas. No visual indication of what other users have selected. Conflict resolution is toast-only — no UI for structural conflicts. The collaboration infrastructure is production-ready with nowhere to surface it.

## Requirements

### Invite & Access
- Share button/action to invite collaborators (link or email)
- Permission levels: Editor (full access), Viewer (read-only)
- Active collaborator list with current activity status
- Ability to remove collaborators

### Presence (Top Bar)
- Avatar stack showing connected users (max 3 + overflow count)
- Each avatar: user initial or profile image + unique color
- Hover: shows user name + what they're currently doing ("Editing Hero Section")
- Online indicator dot per avatar
- Overflow click: full user list with activities

### Live Cursors (Canvas)
- Other users' cursor positions shown as colored arrows on canvas
- Name label attached to each cursor
- Fade behavior: active → idle (3s) → hidden (10s) → reappear on movement
- Cursor position broadcast throttled to 60fps

### Selection Awareness (Canvas)
- When another user selects an element: show colored outline (their unique color) + name badge
- When another user is inline editing: animated "editing..." indicator
- Local selection (indigo) takes visual priority over remote selections

### Conflict Resolution
- OT handles conflicts automatically — no user action required
- Toast notification when a conflict was auto-resolved: "Your change was rebased to sync with [Name]'s edit"
- Edge case — concurrent delete: warning toast "[Element] was deleted by [Name]. Your changes were discarded."
- Edge case — same property conflict: last-writer-wins, toast if local change was overwritten

### Connection Quality
- Status indicator near save status: green (good), amber (degraded), red (poor), gray (offline)
- Offline mode: changes saved locally, sync on reconnect
- Click indicator: shows latency, last sync time, reconnect button

## Flows

### Start Collaborating
1. Click share action (top bar or command palette)
2. Copy invite link OR enter collaborator email
3. Set permission: Editor or Viewer
4. Collaborator opens link → sees editor with your project
5. Their avatar appears in your top bar
6. Their cursor appears on your canvas

### Editing Together
1. You select Hero Section → indigo outline on your screen
2. Collaborator sees your selection as a colored outline + your name
3. Collaborator selects a different element → you see their colored outline + their name
4. Both edit simultaneously → OT merges changes automatically
5. If conflict: toast notification, latest state shown

### Going Offline
1. Connection drops → indicator turns red/gray
2. User continues editing (changes saved locally)
3. Connection restores → auto-sync, indicator turns green
4. If conflicts from offline period: resolved via OT, toasts shown

## Engine APIs

| Surface | API | Key Methods |
|---------|-----|------------|
| Presence | `composer.collaboration` | getPresence(), onUserJoin(), onUserLeave() |
| Cursors | `composer.collaboration` | broadcastCursor(), onCursorUpdate() |
| Selection sync | `composer.collaboration` | broadcastSelection(), onSelectionUpdate() |
| OT operations | `composer.collaboration` (OTEngine) | applyRemoteOperation(), resolveConflict() |
| Connection | `composer.collaboration` | getConnectionState(), reconnect() |
| Element locks | `composer.collaboration` | lockElement(), unlockElement() |

## Constraints

- Cursor broadcast must not exceed 60fps (16ms throttle)
- Presence must work even if cursor sync is disabled
- Offline editing must not lose data — everything queued for sync
- Maximum latency for OT resolution: < 200ms for good UX
- All collaboration UI must gracefully degrade when collaboration is disabled (single-user mode)

## Reference

- **Figma:** Multiplayer — the gold standard for collaborative design tools
- **Google Docs:** Cursor colors, presence awareness, conflict-free editing
- **Linear:** Presence indicators — minimal, non-intrusive
