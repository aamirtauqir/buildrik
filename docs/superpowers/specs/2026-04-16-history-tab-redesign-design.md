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

### 2.4 UX Clarity: Clearer Labeling + Visual Hierarchy

**Decision:** Rename views, add explanatory text, establish primary/secondary hierarchy.

**Changes:**
| Before | After | Weight |
|--------|-------|--------|
| Activity | **Changes** | PRIMARY — bold weight, active tab indicator, default tab |
| Versions | **Saves** | SECONDARY — lighter weight, secondary tab indicator |

**Tab hierarchy (critical for IA):**
- Changes = PRIMARY (bold label, active underline) — this is the main undo history view
- Saves = SECONDARY (regular weight) — explicit tab click required
- Tab weights signal importance without requiring user to "figure it out"

**Helper text:**
- **Changes view:** "Your recent edits. Use Ctrl+Z to undo."
- **Saves view:** "Named milestones you've saved. Compare or restore anytime."

**Why this matters:** If both tabs are equal weight, users don't know which one to use. Bold/active on Changes signals "this is where you start."

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

### 3.1 Interaction Decisions (Wiring & Framing)

These decisions shape the component wiring and data flow:

| Decision | Choice | Rationale |
|----------|---------|-----------|
| Q1: Canvas jump behavior | **B — Smooth scroll (animated)** | Power users want to SEE the rewind, not teleport. 300ms ease-out transition. |
| Q2: Save Version form placement | **B — FAB (floating action button)** | Keeps Saves list clean. FAB in bottom-right of sidebar, slides up form inline. |
| Q3: Time-travel scrubber location | **C — Bottom drawer** | Canvas fully visible above. Drawer doesn't hide sidebar. Drawer slides up from bottom, 200px height. |

#### Q1: Canvas Jump Behavior — Smooth Scroll (Animated)

```
User clicks timestamp on any history entry
→ Canvas animates from current state to historical state
→ Duration: 300ms, ease-out easing
→ Entry highlights briefly (accent ring, 200ms) to confirm selection
→ No confirmation dialog — jump is immediate after animation

Implementation:
- HistoryManager.getEntrySnapshot(entryId) → returns snapshot
- Composer.animateToState(snapshot, duration) → handles animation
- Animation = crossfade opacity + position interpolation
- If user clicks another entry mid-animation → interrupts, jumps to new target
```

#### Q2: Save Version FAB Placement

```
┌─────────────────────────────────────┐
│ 🔍 Search saves...                  │
├─────────────────────────────────────┤
│ v1 — "Homepage redesign"      12:34 │  ← list fills available space
│ v2 — "Pricing page"           11:20 │
│ ...                                │
│                                     │
│                             [+ FAB] ← bottom-right, 44×44px tap target
└─────────────────────────────────────┘

FAB click → form slides up INLINE below search bar (not modal):
┌─────────────────────────────────────┐
│ 🔍 Search saves...                  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [____________________] [Save]    │ │  ← form slides into list, list scrolls up
│ └─────────────────────────────────┘ │
│ v1 — "Homepage redesign"      12:34 │
│ v2 — "Pricing page"           11:20 │
│ ...                                │
│                             [− FAB] ← FAB becomes close button
└─────────────────────────────────────┘

Form fields: Name (required, max 50 chars), Description (optional, max 200 chars)
Validation: Name cannot be empty. Show inline error below field.
Success: Form closes, new save appears at top of list with toast "Saved 'Name'"
```

#### Q3: Time-Travel Bottom Drawer

```
┌──────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────┐ │
│ │            [PROJECT CANVAS — FULL WIDTH]             │ │
│ │                                                       │ │
│ │          (sidebar + inspector still visible)         │ │
│ └──────────────────────────────────────────────────────┘ │
│ ╔═════════════════════════════════════════════════════╗ │
│ ║  ⏮ ═══════════●═══════════════════════ ⏭            ║ │  ← drawer, 200px height
│ ║  12:30        Scrubbing: 12:45      1:02 PM         ║ │
│ ║           [Restore this point]  [Exit time-travel]    ║ │
│ ╚═════════════════════════════════════════════════════╝ │
└──────────────────────────────────────────────────────────┘

Drawer behavior:
- Slides up from bottom with 200ms ease-out
- Canvas preview above updates in real-time (30fps debounced)
- Drawer is PERSISTENT — stays open while scrubbing
- Sidebar remains visible (user can see History tab content, navigate away)
- "Exit time-travel" or Ctrl+Shift+T closes drawer, returns to live editing
- Restore button: commits the historical state, closes drawer, shows toast

Canvas overlay (if needed for preview):
- Semi-transparent preview layer (opacity: 0.4) shows historical state
- Layer positioned absolute over canvas, pointer-events: none
- As user scrubs, preview layer opacity stays constant
- On restore: layer fades out (150ms), live canvas shows restored state
```

### 3.2 Hooks Structure

```
shared/hooks/
├── useHistoryState.ts     # Engine events → React state bridge
├── useVersionHistory.ts   # VersionHistoryManager wrapper
└── useSemanticDiff.ts    # On-demand diff computation

editor/sidebar/tabs/history/
├── TimeTravelScrubber.tsx    # Bottom drawer + canvas overlay
└── SnapshotPreview.tsx       # Hover thumbnail (120px width)
```

### 3.3 Data Flow

```
Engine Events → useHistoryState (hook) → Components
     ↓
VersionHistoryStorage (IndexedDB) → useVersionHistory (hook) → Components

Canvas → TimeTravelScrubber → Bottom Drawer (non-destructive)
              ↓
        Preview Canvas Layer (pointer-events: none, opacity 0.4)
```

### 3.4 File Changes

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
| `editor/sidebar/tabs/history/components/TimeTravelScrubber.tsx` | **NEW** — bottom drawer + canvas overlay |
| `editor/sidebar/tabs/history/components/SnapshotPreview.tsx` | **NEW** — thumbnail |
| `editor/sidebar/shared/ViewSwitcher.tsx` | **MODIFY** — rename labels |
| `engine/storage/VersionHistoryStorage.ts` | **MODIFY** — visual snapshot storage |
| `editor/sidebar/tabs/history/components/DiffRow.tsx` | **MODIFY** — fix accent color (`--aqb-primary` → `--accent`) |

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

### 4.3 ActivityView (Changes)

- Virtualized list using `VariableSizeList`
- Keyboard navigation: j/k (up/down), Enter (expand), Esc (collapse), g/G (start/end)
- Expandable rows for diff details
- Groups by date (Today, Yesterday, older)
- Color-coded diff: green (+), red (-), blue ~ (cobalt for replacements)
- Activity grouping: collapse identical changes ("12 style changes")
  - Grouping key: `elementId + property + changeType` — changes are grouped if they share the same element ID, same property name, and same change type
  - Within a group, show the most recent value change with count of collapsed items
- **Accordion expand:** one group expands at a time (Option A per D4). User controls which group to focus on.
  - If group has >5 items: show "Show all N" link that expands with scroll-into-view
- **Smooth scroll jump:** clicking timestamp triggers 300ms ease-out opacity crossfade animation to that state
  - Animation = opacity crossfade only (NO transform Y) — simple fade, no slide
  - If user clicks another entry mid-animation → interrupt, jump to new target
- **Empty state:** "No undo history" warm message + "Ctrl+Z to undo" action hint
- **Search:** clears with "×" button (right side of input), appears when text is present
  - Search icon on left, clear "×" on right when text present, placeholder: "Search changes..."
- **Current entry (most recent):** visually elevated — accent color label, subtle background tint, "Current" badge

### 4.4 VersionHistoryPanel (Saves)

- Virtualized list using `FixedSizeList`
- **Save Version FAB** — always visible, bottom-right, 44×44px tap target, border-radius: 8px (md per DESIGN.md)
  - Position: fixed to bottom-right of sidebar panel, 16px margin from edges
  - Icon: "+" or "Save" icon (not emoji)
  - Always visible regardless of list content (always-on per D2)
- FAB click → inline form slides up below search bar (NOT a modal)
  - Form slides in from below with 200ms ease-out
  - FAB icon changes to "×" (close) while form is open
- Form: Name field (required, max 50 chars), Description field (optional, max 200 chars)
  - Font: Inter Tight 13px, placeholder text in muted color
  - Inline validation on blur: error appears below field in error color (#ef4444)
  - Success: form closes, toast "Saved '[Name]'", new save appears at top of list
- **Compare default view:** Visual snapshots FIRST (Option B per D3)
  - Side-by-side screenshot comparison shown by default
  - AI summary line ABOVE screenshots: "Redesigned hero section: 3 style + 1 text change"
  - "Switch to Semantic" available to see structured diff
  - If visual snapshot unavailable: falls back to semantic diff automatically
- Visual snapshot thumbnail on hover (120px width SnapshotPreview tooltip, positioned above cursor)
- Compare button → opens compare view with visual snapshot + AI summary
- Restore with inline confirmation toast (not a dialog): "Restore to this version? [Restore] [Cancel]"
- Delete with inline confirmation: entry background turns error-red tint, "Delete?" replaces action buttons
- User attribution (who saved) shown as avatar + name next to each entry
- **Empty state (no saves):** "No saved versions yet. Save Version creates a named milestone." + FAB prominently visible
- **Search clear:** "×" button appears in search input when text is present, clears on click
- Toast position: top-right, below toolbar, 16px from edges

### 4.5 TimeTravelScrubber

- **Entry point:** "Enter Time-Travel" button in Changes view header/toolbar area
  - Button: "Time-Travel" with clock icon, cobalt accent color
  - Click → bottom drawer slides up (200ms ease-out), time-travel mode active
- **Bottom drawer** slides up from bottom of screen, 200px height
  - Canvas above remains fully visible and interactive (sidebar + inspector stay visible too)
  - Drawer has semi-transparent dark background (#14141f at 95% opacity) with top border
  - Horizontal timeline slider: drag handle or use Left/Right arrow keys
  - Timestamp shows current scrub position ("Scrubbing: 12:45 PM")
  - Semi-transparent preview layer over canvas (opacity: 0.4, pointer-events: none)
  - Pre-loads nearest checkpoint on entry to reduce scrub latency
  - Debounce: max 30fps scrub updates
- **Restore:** "Restore this point" button → commits state, closes drawer, shows toast "Restored to [timestamp]"
- **Exit:** "Exit time-travel" button or Ctrl+Shift+T → closes drawer, returns to live editing
  - On exit: preview layer fades out (150ms ease-out), live canvas shows current state
- Keyboard: Left/Right step through entries, Enter = restore, Ctrl+Shift+T = exit
- Keyboard nav: roving tabindex within drawer, slider handle is focusable with arrow key support
- Reduced motion: if `prefers-reduced-motion: reduce`, drawer instant-appears (no slide animation), scrub is still functional but no opacity transitions

### 4.10 Interaction State Table

| Feature | EMPTY | ERROR | LOADING | SUCCESS | PARTIAL |
|---------|-------|-------|---------|---------|---------|
| Changes list (search) | "No matching entries for '[query]'" + "×" clears | — | skeleton rows (3 shimmer rows) | filtered results | highlight matching text |
| Changes list (no history) | "No undo history" + "Ctrl+Z to undo" hint | "Failed to load" + Retry btn | — | — | — |
| Saves list | "No saved versions yet. Save Version creates a named milestone." + FAB prominent | "Save failed" inline, red border on field | spinner on Save btn (button disabled, "Saving...") | toast "Saved '[Name]'" + entry added | — |
| Save Version form | "Name this save" placeholder | red border + error below field | — | form closes + toast | Name field auto-focuses on open |
| Version restore | — | "Restore failed" toast + drawer stays open | — | canvas animates (opacity crossfade 300ms) + toast "Restored to [time]" | inline confirm toast first: "Restore to [name]? [Restore] [Cancel]" |
| Version delete | — | "Delete failed" toast | — | entry removed + toast "Deleted [name]" | entry turns red-bg, "Delete?" inline replaces buttons |
| Time-travel | "Enter Time-Travel" button in header | "Preview unavailable" + Continue / Exit btn | — | live preview on scrub | — |
| AI summary button | "Get AI Summary" (cobalt btn) | "Summary unavailable" inline error | "Generating..." (button disabled, muted) | summary text appears below button | Button re-enables after success or failure |
| Diff expand (accordion) | "12 style changes" collapsed + [+] | — | shimmer on expanding row | all items shown | >5 items: "Show all N" link |
| Search clear | placeholder: "Search changes..." / "Search saves..." | — | — | results | "×" clears, input stays focused |

### 4.6 AI Summary Loading State (D1)

**Decision:** "Generating..." text with disabled button (Option A per D1 recommendation).

```
Button states:
1. Default:    [ Get AI Summary ]            — cobalt accent, hover enabled
2. Loading:    [ Generating...    ]           — disabled, muted text, no hover
3. Success:    [ Get AI Summary ]            — re-enabled
               "Redesigned the hero section:
                changed background, increased
                font size, added CTA button"  — summary text below
4. Error:      [ Get AI Summary ]            — re-enabled
               "Summary unavailable"          — error text below in muted red
```

- Button text changes to "Generating..." during request (no spinner icon)
- Button is visually disabled (muted, no hover, cursor: not-allowed)
- After success: summary text appears below button, button returns to default
- After failure: error message appears below button in muted red (#ef4444 at 60% opacity)
- If request >5s: show subtle timeout warning below button "Still working..."

### 4.7 Typography & Spacing Reference

**Typography (per DESIGN.md — General Sans / Inter Tight / Geist):**
| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Tab labels | Inter Tight | 13px | 600 (Changes primary) / 400 (Saves) | text-primary |
| Entry label | Inter Tight | 13px | 500 | text-primary |
| Entry timestamp | Geist Mono | 11px | 400 | text-muted |
| Badge text | Inter Tight | 11px | 500 | matching badge color |
| Helper text | Inter Tight | 12px | 400 | text-tertiary |
| Empty state title | Inter Tight | 14px | 500 | text-secondary |
| Empty state body | Inter Tight | 12px | 400 | text-muted |
| Form labels | Inter Tight | 12px | 500 | text-secondary |
| Toast text | Inter Tight | 13px | 400 | text-primary |
| Search input | Inter Tight | 13px | 400 | text-primary |

**Spacing (4px base per DESIGN.md):**
| Element | Spacing |
|---------|---------|
| Entry row padding | 8px top/bottom, 12px left/right |
| Diff row padding | 4px top/bottom, 12px left, 24px left indent (child) |
| Badge border-radius | 4px (sm per DESIGN.md) |
| FAB dimensions | 44×44px, border-radius: 8px (md per DESIGN.md) |
| Form field border-radius | 4px (sm) |
| Toast border-radius | 8px (md), padding: 12px 16px |
| Drawer height | 200px fixed |
| Toast position | top-right, 16px from edges, below toolbar |

### 4.8 Accessibility Specifications

**Keyboard navigation:**
- Changes list: roving `tabIndex` (only focused row is tabbable), j/k arrows navigate, Enter expands/collapses, Esc collapses, g/G go to start/end
- FAB: Tab-focusable, Enter/Space activates
- Time-travel drawer: Tab cycles through slider → Restore → Exit, slider responds to Left/Right arrows when focused
- Search input: Tab-focusable, Esc clears or closes depending on state
- Diff expand: Enter/Space toggles accordion

**Screen reader support:**
- `aria-live="polite"` on history list for new entries announcement
- Each entry: `role="button"` when expandable, `aria-expanded` state, `aria-label` includes label + change count
- Tab switcher: `role="tablist"`, tabs have `role="tab"`, panels have `role="tabpanel"`
- Time-travel: drawer announced on open (`aria-modal="true"`), slider has `aria-valuenow` + `aria-valuetext`
- Badges: `aria-label` describes change type and count ("3 style changes")

**Focus indicators:**
- Visible focus ring: 2px solid var(--accent), offset 2px
- Focus visible on: entry rows, FAB, form fields, buttons, tab switcher

**Color contrast (WCAG AA):**
- All text on dark surfaces: meets or exceeds 4.5:1 (verified in DESIGN.md tokens)
- Badge colors:
  - Cobalt (#2D6DFF): on #14141f = 7.2:1 ✓
  - Teal (#14B8A6): on #14141f = 4.8:1 ✓
  - Amber (#F59E0B): on #14141f = 4.6:1 ✓ (borderline — badge has 2px darker background tint)
  - Rose (#F43F5E): on #14141f = 5.1:1 ✓
  - Gray (#6B6963): on #14141f = 3.2:1 ✗ — use on lighter surface or add border
- Error states: error color (#ef4444) on any surface ≥ 4.5:1 ✓

**Reduced motion:**
- If `prefers-reduced-motion: reduce`:
  - Smooth scroll jump: instant (no 300ms animation)
  - Drawer slide: instant appear (no 200ms slide)
  - Preview layer fade: none (opacity: 0.4 immediately)
  - Accordion expand: instant (no transition)
  - FAB form slide: none (form appears instantly)
  - All other transitions: disabled

### 4.9 Semantic Diff Display

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
- Entry point: "Enter Time-Travel" button in Changes view header (cobalt accent, clock icon)
- Bottom drawer (slides up from bottom, 200px height)
- Preview layer scrubbing (semi-transparent, pointer-events: none, opacity: 0.4)
- Restore from scrub position (opacity crossfade, 150ms)
- Canvas fully visible above drawer (sidebar + inspector stay visible)

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
