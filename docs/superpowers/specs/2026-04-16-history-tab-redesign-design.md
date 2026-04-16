# History Tab Redesign — Design Specification

**Date:** 2026-04-16
**Status:** Draft — Pending CEO Review
**Author:** Claude

---

## 1. Problem Statement

The History Tab has accumulated several bottlenecks across performance, architecture, and UX:

1. **Storage ceiling** — localStorage hits ~5MB limit with large projects
2. **Main thread blocking** — `deepClone(exportProject())` runs synchronously
3. **Event system overload** — Multiple independent subscriptions cause redundant rebuilds
4. **Broken compare feature** — Duck-typing reflection is fragile and fails silently
5. **UX confusion** — "Activity" vs "Versions" naming is unclear
6. **No virtualization** — All items rendered at once, degrading performance with large history

---

## 2. Design Decisions

### 2.1 Storage: IndexedDB Migration

**Decision:** Replace localStorage with IndexedDB via existing storage abstraction layer.

**Rationale:**
- 10MB+ capacity (vs localStorage's ~5MB)
- Async operations don't block main thread
- Existing `VersionHistoryStorage` abstraction makes migration straightforward
- IndexedDB has good browser support

**Implementation:**
- Add IndexedDB adapter to `engine/storage/VersionHistoryStorage.ts`
- Keep existing API surface, swap underlying storage mechanism
- Add `isIndexedDBAvailable()` check with localStorage fallback

### 2.2 Snapshot Capture: Chunked Async

**Decision:** Implement chunked async snapshot capture using `requestIdleCallback`.

**Rationale:**
- Non-blocking for large projects
- Simpler than Web Workers
- `requestIdleCallback` with fallback for Safari

**Implementation:**
```typescript
async function captureSnapshotAsync(project: ProjectData): Promise<ProjectData> {
  return new Promise((resolve) => {
    requestIdleCallback(() => {
      resolve(deepClone(project));
    });
  });
}
```
- For projects < 100 elements, capture synchronously (fast path)
- For projects > 100 elements, chunk across idle callbacks
- Add `captureSnapshotAsync()` to both `HistoryManager` and `VersionHistoryManager`

### 2.3 Event System: React Context + useReducer

**Decision:** Replace scattered event subscriptions with centralized React Context.

**Rationale:**
- Single source of truth for history state
- Components subscribe to state, not events
- Aligns with React patterns
- Easier to reason about

**Implementation:**
```
HistoryContext (Provider)
├── historyStack: HistoryDisplayEntry[]
├── versions: NamedVersion[]
├── compareResult: CompareResult | null
├── canUndo: boolean
├── canRedo: boolean
└── actions: { undo, redo, clear, createVersion, restoreVersion, ... }
```

- Single `HistoryProvider` wraps `HistoryTab`
- `useHistoryContext()` hook exposes state + actions
- Components: `ActivityView`, `VersionHistoryPanel` consume context
- Events still used internally in engine, but UI only reacts to context

### 2.4 Compare: Semantic Diff

**Decision:** Implement proper semantic diff with grouped changes.

**Rationale:**
- More useful than JSON patch display
- Aligns with existing `HistoryChange` type structure
- Cleaner UI: "3 style changes" vs raw diff

**Implementation:**
```typescript
interface CompareResult {
  elementName: string;
  changes: {
    type: 'style' | 'text' | 'layout' | 'content' | 'other';
    property: string;
    description: string;
    before: string;
    after: string;
  }[];
  summary: {
    style: number;
    text: number;
    layout: number;
    content: number;
    other: number;
  };
}
```

- Add `compareVersions(currentId: string, targetId: string)` to `VersionHistoryManager`
- Group changes by element, then by change type
- Show summary counts in UI

### 2.5 UX Clarity: Clearer Labeling

**Decision:** Rename views and add explanatory text.

**Changes:**
| Before | After |
|--------|-------|
| Activity | Changes |
| Versions | Saves |
| "checkpoint" badge | "auto-save" badge |

**Helper text:**
- **Changes view:** "Your recent edits. Use Ctrl+Z to undo."
- **Saves view:** "Named milestones you've saved. Compare or restore anytime."

### 2.6 Virtualization: react-window

**Decision:** Full virtualization for both lists.

**Rationale:**
- Handles any list size gracefully
- Lightweight library (~7KB)
- Cleaner than pagination logic

**Implementation:**
- Add `react-window` dependency
- `VariableSizeList` for ActivityView (expandable rows)
- `FixedSizeList` for VersionHistoryPanel
- Overscan count of 5 for smooth scrolling

---

## 3. Architecture

### 3.1 Context Structure

```
editor/sidebar/tabs/history/
├── contexts/
│   ├── HistoryContext.tsx      # React context definition
│   └── HistoryProvider.tsx     # Provider + useReducer
├── hooks/
│   └── useHistoryContext.ts    # Consumer hook
```

### 3.2 Data Flow

```
Engine Events → HistoryProvider (reducer) → HistoryContext (state) → Components
     ↓
VersionHistoryStorage (IndexedDB)
```

### 3.3 File Changes

| File | Action |
|------|--------|
| `editor/sidebar/tabs/history/contexts/HistoryContext.tsx` | **NEW** |
| `editor/sidebar/tabs/history/contexts/HistoryProvider.tsx` | **NEW** |
| `editor/sidebar/tabs/history/hooks/useHistoryContext.ts` | **NEW** |
| `engine/storage/VersionHistoryStorage.ts` | **MODIFY** — Add IndexedDB |
| `engine/VersionHistoryManager.ts` | **MODIFY** — async capture, compareVersions |
| `engine/HistoryManager.ts` | **MODIFY** — async snapshot |
| `editor/sidebar/tabs/history/HistoryTab.tsx` | **MODIFY** — Use context, rename |
| `editor/sidebar/tabs/history/components/ActivityView.tsx` | **MODIFY** — Virtualized, context |
| `editor/sidebar/tabs/history/components/VersionHistoryPanel.tsx` | **MODIFY** — Virtualized, context |
| `editor/sidebar/tabs/history/components/DiffRow.tsx` | **MODIFY** — Semantic diff |
| `editor/sidebar/tabs/history/components/VersionRow.tsx` | **MODIFY** — Virtualized row |
| `editor/sidebar/shared/ViewSwitcher.tsx` | **MODIFY** — Update labels |
| `shared/types/versions.ts` | **MODIFY** — CompareResult type |
| `engine/historyTypes.ts` | **MODIFY** — ChangeType enum |

---

## 4. Component Specifications

### 4.1 HistoryProvider

```typescript
interface HistoryState {
  historyStack: HistoryDisplayEntry[];
  versions: NamedVersion[];
  compareResult: CompareResult | null;
  canUndo: boolean;
  canRedo: boolean;
  isLoading: boolean;
}

type HistoryAction =
  | { type: 'SET_HISTORY'; payload: HistoryDisplayEntry[] }
  | { type: 'SET_VERSIONS'; payload: NamedVersion[] }
  | { type: 'SET_COMPARE'; payload: CompareResult | null }
  | { type: 'SET_CAN_UNDO'; payload: boolean }
  | { type: 'SET_CAN_REDO'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean };
```

### 4.2 ActivityView (Changes)

- Virtualized list using `VariableSizeList`
- Expandable rows for diff details
- Groups by date (Today, Yesterday, older)
- Empty state when no history

### 4.3 VersionHistoryPanel (Saves)

- Virtualized list using `FixedSizeList`
- Save Version inline form
- Compare button with semantic diff
- Restore with confirmation
- Delete with confirmation

### 4.4 Semantic Diff Display

```typescript
// In VersionRow, after clicking Compare:
const result = await composer.versionHistory.compareVersions(currentId, version.id);

// Display:
{
  "3 style changes": [
    { property: "color", before: "#fff", after: "#000" },
    { property: "fontSize", before: "14px", after: "16px" },
  ],
  "1 text change": [
    { property: "content", before: "Hello", after: "Hello!" },
  ]
}
```

---

## 5. Storage Schema

### 5.1 IndexedDB Structure

```typescript
// Database: BuildrikHistory
// Object Store: versions
{
  id: string;           // "v-{timestamp}-{random}"
  name: string;
  description?: string;
  snapshot: ProjectData;
  createdAt: number;
  isAutoCheckpoint: boolean;
  projectId: string;
}

// Object Store: settings
{
  key: string;
  value: any;
}
```

### 5.2 Migration Path

1. Check if IndexedDB available
2. If yes, use IndexedDB directly
3. If no, fall back to localStorage (with warning)
4. Future: one-time migration from localStorage to IndexedDB

---

## 6. Performance Targets

| Metric | Before | After |
|--------|--------|-------|
| Initial load (100 history items) | ~200ms | ~50ms |
| Expand diff row | ~16ms | ~8ms |
| Version save (1000 elements) | ~500ms blocking | ~50ms async |
| Scroll performance (500 items) | janky | 60fps |

---

## 7. Testing Strategy

- Unit tests for `HistoryManager` and `VersionHistoryManager`
- Integration tests for context state transitions
- Visual regression for ActivityView and VersionHistoryPanel
- Performance benchmarks for snapshot capture

---

## 8. Out of Scope (Future)

- Visual screenshot snapshots for version comparison
- Cloud sync for versions
- Collaborative editing of version names
- Version branching/forking

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| IndexedDB quota exceeded | Graceful fallback to localStorage with pruning |
| react-window + expandable rows | VariableSizeList with dynamic height measurement |
| Async snapshot capture race conditions | Cancellation token pattern |
| Context re-render cascade | Memoized selectors via useMemo |

---

## 10. Dependencies

```json
{
  "react-window": "^1.8.10",
  "idb": "^8.0.0"
}
```

- `react-window` — virtualization
- `idb` — IndexedDB wrapper (cleaner API than raw IndexedDB)
