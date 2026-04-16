# History Tab 10x Redesign — Design Specification

**Date:** 2026-04-16
**Status:** Draft — Post CEO Review
**Author:** Claude
**Mode:** EXPANSION

---

## 1. Problem Statement

The History Tab has accumulated several bottlenecks across performance, architecture, and UX:

1. **Main thread blocking** — `deepClone(exportProject())` runs synchronously
2. **Event system overload** — Multiple independent subscriptions cause redundant rebuilds
3. **Broken compare feature** — Duck-typing reflection is fragile and fails silently
4. **UX confusion** — "Activity" vs "Versions" naming is unclear
5. **No visualization** — No visual snapshots, no time-travel, history is text-only
6. **No intelligence** — History tells WHAT changed, not WHAT it MEANS

---

## 2. Design Decisions

### 2.0 Storage: Already IndexedDB (No Change Needed)

**Correction:** The spec originally said "migrate to IndexedDB" but `engine/storage/VersionHistoryStorage.ts` already uses IndexedDB. No storage migration needed.

### 2.1 Snapshot Capture: Chunked Async

**Decision:** Implement chunked async snapshot capture using `requestIdleCallback` with `structuredClone()`.

**Rationale:**
- `structuredClone()` is faster than custom `deepClone()` for large objects
- `requestIdleCallback` defers work to idle time for large projects
- Non-blocking is the goal, not specific timing guarantees

**Implementation:**
```typescript
async function captureSnapshotAsync(project: ProjectData): Promise<ProjectData> {
  // Fast path for small projects (< 100 elements)
  if (project.elements?.length < 100) {
    try {
      return structuredClone(project);
    } catch {
      return JSON.parse(JSON.stringify(project)); // fallback for non-serializable data
    }
  }
  // For large projects: defer to idle time
  return new Promise((resolve) => {
    const id = requestIdleCallback(() => {
      try {
        resolve(structuredClone(project));
      } catch {
        resolve(JSON.parse(JSON.stringify(project)));
      }
    }, { timeout: 2000 }); // 2s max wait
    // Safety: if idle callback hasn't fired in 2s, force resolve
    setTimeout(() => {
      cancelIdleCallback(id);
      try {
        resolve(structuredClone(project));
      } catch {
        resolve(JSON.parse(JSON.stringify(project)));
      }
    }, 2000);
  });
}
```
- For projects < 100 elements: `structuredClone()` synchronously (fast)
- For projects > 100 elements: `requestIdleCallback` with 2s timeout fallback
- Performance target: "non-blocking" — main thread yields, operation completes within 2s
- **Known limitation:** `requestIdleCallback` is throttled to ~1fps when tab is backgrounded. The 2s `setTimeout` fallback ensures snapshot completes even in backgrounded tabs.

### 2.2 Event System: Custom Hooks (not React Context)

**Decision:** Replace scattered event subscriptions with centralized custom hooks.

**Rationale:**
- React Context couples the engine to React patterns (violates architecture rules)
- Custom hooks follow existing patterns in the codebase
- Single source of truth without the coupling

**Implementation:**
```
shared/hooks/
├── useHistoryState.ts     # Subscribes to engine events, exposes history state
├── useVersionHistory.ts   # Wraps VersionHistoryManager
└── useSemanticDiff.ts    # Computes diff on-demand
```

- `useHistoryState()` — subscribes to HISTORY_RECORDED/UNDO/REDO/CLEARED events, exposes history stack + canUndo/canRedo
- `useVersionHistory()` — wraps VersionHistoryManager, exposes versions + CRUD actions
- `useSemanticDiff(versionId)` — computes and caches semantic diff on-demand
- Events still used internally in engine, hooks bridge to React state

### 2.3 Compare: Semantic Diff

**Decision:** Implement proper semantic diff with grouped changes by element and type.

**Rationale:**
- More useful than JSON patch display
- Aligns with existing `HistoryChange` type structure
- Cleaner UI: "3 style changes" vs raw diff

**ChangeType classification algorithm:**
```typescript
type ChangeType = 'style' | 'text' | 'layout' | 'content' | 'other';

// Classification rules (order matters — first match wins):
function classifyChange(property: string): ChangeType {
  const styleProps = ['color', 'backgroundColor', 'background', 'border', 'borderRadius',
    'boxShadow', 'opacity', 'transform', 'fontSize', 'fontFamily', 'fontWeight',
    'lineHeight', 'textAlign', 'padding', 'margin', 'width', 'height', 'display',
    'flexDirection', 'justifyContent', 'alignItems', 'gap', 'position', 'top',
    'left', 'right', 'bottom', 'zIndex', 'overflow', 'cursor', 'visibility'];
  const textProps = ['content', 'innerText', 'textContent', 'placeholder'];
  const layoutProps = ['gridTemplateColumns', 'gridTemplateRows', 'flexGrow',
    'flexShrink', 'flexBasis', 'alignSelf', 'order'];
  const contentProps = ['src', 'href', 'alt', 'title', 'ariaLabel', 'role', 'data-id'];

  const prop = property.toLowerCase();
  if (styleProps.some(p => prop === p || prop.endsWith(p))) return 'style';
  if (textProps.some(p => prop === p || prop.endsWith(p))) return 'text';
  if (layoutProps.some(p => prop === p || prop.endsWith(p))) return 'layout';
  if (contentProps.some(p => prop === p || prop.endsWith(p))) return 'content';
  return 'other';
}
```

**Note:** `display`, `margin`, `padding`, `position` are classified as `style` (not `layout`) to avoid overlap. If a property matches multiple categories, `style` takes precedence over `layout`.

**Implementation:**
```typescript
interface CompareResult {
  elementName: string;
  changes: {
    type: ChangeType;
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
    pagesAdded: number;    // NEW: pages in target not in source
    pagesDeleted: number;   // NEW: pages in source not in target
  };
}
```

- Add `compareVersions(currentId: string, targetId: string)` to `VersionHistoryManager`
- Group changes by element, then by change type using `classifyChange()`
- Show summary counts in UI
- Include page-level diff: `pagesAdded: number`, `pagesDeleted: number` in summary

### 2.4 UX Clarity: Clearer Labeling

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

### 2.5 Virtualization: react-window

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

**VariableSizeList resize handling:**
- When a row expands/collapses, call `list.resetMeasurements()` to invalidate cached sizes
- Use `useCallback` to memoize the `getItemSize` function
- Estimated row heights: collapsed = 48px, expanded = 48px + (numChanges × 24px)
- If rows frequently resize, consider `DynamicSizeList` instead

### 2.6 Visual Version Snapshots

**Decision:** Pre-compute canvas screenshot on version save. Store as blob. Show on hover.

**Rationale:**
- Visual comparison is 10x more useful than text diffs
- Pre-compute on save avoids synchronous canvas jank on hover

**Implementation:**
- On `createVersion()` / `autoCheckpoint()`, capture the main editor canvas via `document.getElementById('editor-canvas').toDataURL('image/jpeg', 0.6)` (60% quality)
- **Source canvas ID:** `'editor-canvas'` — the canonical editing canvas element
- **Pre-computed on save, not on hover** — avoids blocking the main thread
- Store as `visualSnapshot: string | null` in `NamedVersion`
- On hover in VersionHistoryPanel: show `SnapshotPreview` tooltip with pre-computed blob (instant)
- `SnapshotPreview` is a hover tooltip component (not a full page) — positioned near cursor, shows thumbnail at 120px width
- Compare view: side-by-side in sidebar panel (not canvas overlay)

**Canvas capture failure triggers:**
- Cross-origin images (CORS blocked)
- SVG with external references
- Shadow DOM elements
- Browser doesn't support `canvas.toDataURL`
- Canvas was drawn using `drawImage` with another canvas element (tainted canvas)
- Memory pressure causing allocation failure
On failure: catch exception, set `visualSnapshot = null`, show text-only

### 2.7 Time-Travel Scrubber

**Decision:** Canvas overlay timeline for live preview without restore.

**Rationale:**
- Users can scrub through history and see preview in real-time
- Doesn't mutate state — read-only exploration mode

**Preview layer architecture:**
- Create a second canvas element (`<canvas id="tt-preview">`) positioned absolutely over the main editor canvas
- The preview canvas has `pointer-events: none` so it doesn't block interaction with the live canvas
- On scrub: load historical snapshot into a temporary Composer instance (not the live one), render to the preview canvas
- **Memory management:** The temp Composer is disposed after each scrub frame using a `cleanup()` function that destroys managers, clears caches, and removes event listeners
- Preview canvas has 40% opacity to allow seeing the "gap" between live and historical
- On exit: explicitly call `tempComposer.destroy()` and remove preview canvas from DOM

**Implementation:**
- New component: `TimeTravelScrubber`
- When activated: create preview canvas, insert into DOM above editor canvas
- Dragging slider: load snapshot at slider position into temp Composer, render to preview canvas
- "Restore this point" button: call `composer.history.restoreEntry(entryId)`, then exit time-travel
- "Exit time travel" button: dispose temp Composer, remove preview canvas, return to live editing
- **Esc is NOT used** — avoiding conflict with editor's existing Esc shortcuts

**Keyboard shortcuts for time-travel:**
- `Left/Right arrows` — step through history entries
- `Enter` — restore to selected point
- `Ctrl+Shift+T` — exit time-travel mode (less likely to conflict with browser tab-close)

**Glossary of terms:**
- **checkpoint:** A saved state in the undo history. Created automatically every N operations. Not user-visible as a "save."
- **auto-save (autoCheckpoint):** An automatic version save triggered by a significant change event. User-visible in Saves list with "auto-save" badge. Distinguishable from manual saves.
- **manual save:** User-initiated version save via "Save Version" button. User-named. Never auto-pruned.
- **checkpoint badge → auto-save badge:** The badge on entries in the Saves list. Shows "auto-save" for autoCheckpoint=true, nothing for manual saves.
- **entryId:** The `id` field of `NamedVersion` (format: `v-{timestamp}-{random}`). Used by `restoreEntry(entryId)` as the lookup key.

**Performance:**
- Pre-load nearest checkpoint snapshot when entering time-travel mode (reduce scrub latency)
- Debounce scrub updates to max 30fps (every ~33ms)
- If scrub latency exceeds 100ms, reduce preview fidelity (lower resolution rendering)
- Temp Composer is reused across scrubs — not recreated on each frame — only state is reset

### 2.8 AI Change Summaries

**Decision:** On-demand natural language summaries, rate-limited.

**Rationale:**
- "47 style changes, 12 text changes" doesn't tell the story
- AI can narrate: "You redesigned the hero section"

**Implementation:**
- On-demand only (button: "Get AI summary" in compare view)
- Rate-limited: max 1 AI call per version per 60 seconds (tracked in memory)
- Structured change data sent to AI endpoint: `POST /api/ai/summarize`
- Request body: `{ changes: CompareResult }`
- Response: `{ summary: string }` — natural language description
- Result cached in `version.aiSummary: string | null`
- Graceful degradation: if AI unavailable, show structured diff

**AI endpoint contract:**
```typescript
// Auth: uses existing session cookie (validated server-side)
// No bearer token needed — server validates session on each request

// Request
interface AISummarizeRequest {
  versionName: string;
  changes: CompareResult;
}
// Response
interface AISummarizeResponse {
  summary: string; // e.g., "Redesigned the hero section: increased headline font size, changed background from blue to gradient, added CTA button"
}
```

### 2.9 Automatic Milestones

**Decision:** AI suggests version names when significant changes detected.

**Rationale:**
- Users forget to save versions at meaningful moments
- AI can detect when work is "complete" and suggest a save

**Significant change detection (triggers milestone check):**
- A new page is added (page count increases)
- An element is deleted (was present, now absent in current state)
- A page is deleted
- >50% of an element's properties changed in a single operation
  - Formula: `changedPropertyCount / elementSchemaPropertyCount >= 0.5`
  - Element schema property count is predefined per element type (e.g., div=20, img=15, text=10)
- Auto-checkpoint count reaches 10 since last manual save
  - Counter persisted in IndexedDB: `{ key: "autoCheckpointCount", value: number }`
  - Reset to 0 on manual save

**Implementation:**
- On each significant change, queue a milestone check
- Debounce: only fire suggestion if >30 seconds since last suggestion
- AI endpoint: `POST /api/ai/milestone-suggest`
- Request body: `{ recentChanges: HistoryDisplayEntry[], pageStructure: PageData }`
- Response: `{ suggestedName: string, reasoning: string }`
- Toast: "Looks like you finished the pricing page. Save as 'Pricing page v1'? [Save] [Edit] [Dismiss]"
- User action: Save (uses suggested name), Edit (edit name), Dismiss (ignore)

### 2.10 Team Attribution

**Decision:** Store userId on history entries, display attribution.

**Rationale:**
- In multi-user projects, users want to know WHO made each change
- Attribution builds accountability and helps collaboration

**Implementation:**
- Add `userId: string | null` to `HistoryDisplayEntry` and `NamedVersion`
- `HistoryManager.record()` accepts optional `userId` from session
- Activity view shows user avatar/name next to each entry
- Version view shows who saved each version

---

## 3. Architecture

### 3.1 Hooks Structure

```
shared/hooks/
├── useHistoryState.ts     # Engine events → React state bridge
├── useVersionHistory.ts   # VersionHistoryManager wrapper
└── useSemanticDiff.ts    # On-demand diff computation

editor/sidebar/tabs/history/
├── TimeTravelScrubber.tsx    # Canvas overlay timeline
└── SnapshotPreview.tsx       # Hover thumbnail
```

### 3.2 Data Flow

```
Engine Events → useHistoryState (hook) → Components
     ↓
VersionHistoryStorage (IndexedDB) → useVersionHistory (hook) → Components

Canvas → TimeTravelScrubber → Preview Layer (non-destructive)
```

### 3.3 File Changes

| File | Action |
|------|--------|
| `shared/hooks/useHistoryState.ts` | **NEW** — engine events to React state |
| `shared/hooks/useVersionHistory.ts` | **NEW** — VersionHistoryManager wrapper |
| `shared/hooks/useSemanticDiff.ts` | **NEW** — diff computation hook |
| `engine/HistoryManager.ts` | **MODIFY** — async snapshot, userId support |
| `engine/VersionHistoryManager.ts` | **MODIFY** — async capture, compareVersions(), visual snapshot |
| `engine/historyTypes.ts` | **MODIFY** — ChangeType enum, userId on entries |
| `shared/types/versions.ts` | **MODIFY** — VisualSnapshot, CompareResult, userId |
| `editor/sidebar/tabs/history/HistoryTab.tsx` | **MODIFY** — use hooks, rename views |
| `editor/sidebar/tabs/history/components/ActivityView.tsx` | **MODIFY** — virtualized, keyboard nav, grouping |
| `editor/sidebar/tabs/history/components/VersionHistoryPanel.tsx` | **MODIFY** — virtualized, visual snapshots |
| `editor/sidebar/tabs/history/components/DiffRow.tsx` | **MODIFY** — semantic diff, color-coded |
| `editor/sidebar/tabs/history/components/VersionRow.tsx` | **MODIFY** — hover preview, compare |
| `editor/sidebar/tabs/history/components/TimeTravelScrubber.tsx` | **NEW** — canvas overlay |
| `editor/sidebar/tabs/history/components/SnapshotPreview.tsx` | **NEW** — thumbnail |
| `editor/sidebar/shared/ViewSwitcher.tsx` | **MODIFY** — rename labels |
| `engine/storage/VersionHistoryStorage.ts` | **MODIFY** — visual snapshot storage |

---

## 4. Component Specifications

### 4.1 Custom Hooks

```typescript
// useHistoryState.ts
function useHistoryState(): {
  historyStack: HistoryDisplayEntry[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

// useVersionHistory.ts
function useVersionHistory(): {
  versions: NamedVersion[];
  createVersion: (name: string) => Promise<void>;
  restoreVersion: (id: string) => Promise<void>;
  deleteVersion: (id: string) => Promise<void>;
  getVersion: (id: string) => Promise<NamedVersion | null>;
}

// useSemanticDiff.ts
function useSemanticDiff(versionId: string | null): {
  diff: CompareResult | null;
  isLoading: boolean;
  error: string | null;
}
```

### 4.2 DiffRow Component

```typescript
interface DiffRowProps {
  change: {
    type: ChangeType;
    property: string;
    before: string;
    after: string;
  };
  onClick?: () => void; // optional: for highlighting the changed element
}

// Render:
// + (green #10B981) for additions (before is empty/null)
// - (red #EF4444) for deletions (after is empty/null) with strikethrough
// ~ (cobalt #2D6DFF) for replacements
// Badge color by type: style=cobalt, text=teal, layout=amber, content=rose, other=gray
```

### 4.2 ActivityView (Changes)

- Virtualized list using `VariableSizeList`
- Keyboard navigation: j/k (up/down), Enter (expand), Esc (collapse), g/G (start/end)
- Expandable rows for diff details
- Groups by date (Today, Yesterday, older)
- Color-coded diff: green (+), red (-), yellow (~)
- Activity grouping: collapse identical changes ("12 style changes")
  - Grouping key: `elementId + property + changeType` — changes are grouped if they share the same element ID, same property name, and same change type
  - Within a group, show the most recent value change with count of collapsed items
- Empty state when no history
- Undo to any entry: click timestamp to jump to that moment

### 4.3 VersionHistoryPanel (Saves)

- Virtualized list using `FixedSizeList`
- Save Version inline form with auto-save suggestions
- Visual snapshot thumbnail on hover
- Compare button with side-by-side visual diff
- Semantic diff view available as alternative
- Restore with confirmation
- Delete with confirmation
- User attribution (who saved)

### 4.4 TimeTravelScrubber

- Canvas overlay with horizontal timeline slider
- Semi-transparent preview layer over live canvas
- Drag to scrub through history in real-time
- "Restore this point" button to commit
- Esc or "Exit time travel" to return to live
- Timestamp display showing current scrub position

### 4.5 Semantic Diff Display

```typescript
// In VersionRow, after clicking Compare:
const result = await composer.versionHistory.compareVersions(currentId, version.id);

// Display:
{
  summary: { style: 3, text: 1, layout: 0, content: 0, other: 0 },
  changes: [
    { type: 'style', property: 'color', before: '#fff', after: '#000' },
    { type: 'style', property: 'fontSize', before: '14px', after: '16px' },
    { type: 'style', property: 'backgroundColor', before: 'blue', after: 'red' },
    { type: 'text', property: 'content', before: 'Hello', after: 'Hello!' },
  ]
}

// Color coding (per DESIGN.md — cobalt accent only, no purple/indigo):
// style changes: cobalt badge (#2D6DFF)
// text changes: teal badge (#14B8A6)
// layout changes: amber badge (#F59E0B)
// content changes: rose badge (#F43F5E)
// additions: green text (#10B981)
// deletions: red text (#EF4444) with strikethrough
```

---

## 5. Storage Schema (Already Implemented)

### 5.1 IndexedDB Structure

Storage is already implemented in `engine/storage/VersionHistoryStorage.ts`:

```typescript
// Database: aquibra-versions
// Object Store: versions
{
  id: string;           // "v-{timestamp}-{random}"
  name: string;
  description?: string;
  snapshot: ProjectData;
  createdAt: number;
  isAutoCheckpoint: boolean;
  projectId: string;
  visualSnapshot?: string;  // NEW: base64 JPEG blob
  aiSummary?: string;       // NEW: cached AI summary
  userId?: string;          // NEW: attribution
}
```

### 5.2 New Storage Fields + Error Handling

For the new features, add to the schema:
- `visualSnapshot: string | null` — base64 JPEG, compressed 0.6 quality
- `aiSummary: string | null` — cached AI-generated description
- `userId: string | null` — for team attribution

**Storage error handling:**
```typescript
try {
  await saveVersion(version);
} catch (error) {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    // Prune oldest auto-saves first
    await pruneVersions(projectId, maxVersions - 1);
    await saveVersion(version); // retry after prune
  } else {
    throw error; // re-throw unexpected errors
  }
}
```

**Pruning policy:**
- Keep last 50 auto-saves per project (configurable)
- Manual saves are never auto-pruned
- On `QuotaExceededError`: prune oldest auto-saves first, retry save
- Pruning batch size: 10 oldest auto-saves at a time

---

## 6. Performance Targets

| Metric | Before | After |
|--------|--------|-------|
| Initial load (100 history items) | ~200ms | ~50ms |
| Expand diff row | ~16ms | ~8ms |
| Version save (1000 elements) | ~500ms blocking | non-blocking |
| Scroll performance (500 items) | janky | 60fps |
| Visual snapshot capture | N/A | ~100ms (async, on save) |
| Time-travel preview | N/A | dependent on state size |

**Note:** Time-travel scrub performance is dependent on snapshot state size. For large histories (>500 entries), scrub may drop frames. Mitigation: pre-load nearest checkpoint state for faster preview.

---

## 7. Phased Delivery

### Phase 1: Core Performance (MVP)
- Chunked async snapshot capture
- react-window virtualization for both lists
- Custom hooks (useHistoryState, useVersionHistory)
- Rename Activity→Changes, Versions→Saves

### Phase 2: Compare & Diff
- Semantic diff implementation with ChangeType classification
- Color-coded diff display
- Activity grouping
- Keyboard navigation

### Phase 3: Visual Features
- Visual version snapshots (pre-computed on save)
- Hover preview thumbnails
- Side-by-side visual compare view

### Phase 4: Intelligence
- AI change summaries (on-demand, rate-limited)
- Automatic milestone suggestions
- Team attribution

### Phase 5: Time-Travel
- Canvas overlay timeline
- Preview layer scrubbing
- Restore from scrub position

---

## 7. Testing Strategy

- Unit tests for `HistoryManager` and `VersionHistoryManager`
- Integration tests for context state transitions
- Visual regression for ActivityView and VersionHistoryPanel
- Performance benchmarks for snapshot capture

---

## 8. Out of Scope (Future)

- Cloud sync for versions
- Collaborative editing of version names
- Version branching/forking
- Visual diff overlay directly on canvas (compare view uses sidebar panel, not canvas overlay)
- AI milestone suggestions on mobile (desktop-only editor per CLAUDE.md)

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Canvas snapshot capture fails on complex elements | Graceful degradation — set `visualSnapshot = null`, show text-only |
| AI service unavailable or rate-limited | Show structured diff as fallback, queue request |
| Visual snapshot storage bloat | Compress images (JPEG 0.6), limit to 1 per version, prune oldest auto-saves first |
| Time-travel conflicts with live edits | Time-travel is read-only preview mode, no state mutation |
| AI milestone suggestions noisy | Only suggest on defined significant events, user must confirm |
| Keyboard nav conflicts with screen readers | `aria-live` regions, respect `prefers-reduced-motion` |

---

## 10. Dependencies

```json
{
  "react-window": "^1.8.10"
}
```

- `react-window` — virtualization for ActivityView and VersionHistoryPanel lists

**Note:** IndexedDB is already implemented in the codebase via `idb` or raw IndexedDB API. No additional storage library needed.
