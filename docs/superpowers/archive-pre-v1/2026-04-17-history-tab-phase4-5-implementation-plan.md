# History Tab Phase 4-5 — Implementation Plan

**Date:** 2026-04-17
**Status:** READY FOR IMPLEMENTATION
**Based on:** `history-tab-redesign-design.md` + `history-tab-implementation-plan.md`

---

## What Phase 1-3 Delivered

- [x] `HistoryTab.tsx` with Saves/Changes view switcher
- [x] `ActivityView.tsx` — undo history list with keyboard nav, accordion expand, "Show all N"
- [x] `VersionHistoryPanel.tsx` — saves list with FAB, restore/delete, inline confirmations
- [x] Custom hooks: `useHistoryState`, `useVersionHistory`
- [x] `DiffRow` — semantic diff with color-coded change types
- [x] CSS: `history.css` with `aqb-ht-*` class names

---

## What's Still Missing (Phase 4-5)

### Phase 4: Visual Features

| # | Feature | Files |
|---|---------|-------|
| 4.1 | **Time-Travel button** in Activity header | `HistoryTab.tsx` |
| 4.2 | **CSS class name normalization** to prototype names | `history.css` |
| 4.3 | **SnapshotPreview** hover thumbnail | `SnapshotPreview.tsx` (NEW) |
| 4.4 | **Visual snapshot capture** on save | `VersionHistoryManager.ts`, `useVersionHistory` |
| 4.5 | **Compare view** with side-by-side screenshots | `VersionHistoryPanel.tsx` |

### Phase 5: Intelligence + Polish

| # | Feature | Files |
|---|---------|-------|
| 5.1 | **AI Summary button** + `/api/ai/summarize` | `VersionHistoryPanel.tsx`, API route |
| 5.2 | **Delete legacy file** | `components/Panels/LeftSidebar/tabs/HistoryTab.tsx` |

---

## Phase 4 Tasks

### 4.1 — Time-Travel Button in Activity Header

**File:** `editor/sidebar/tabs/history/HistoryTab.tsx`

Add a "Time-Travel" button next to the "Clear history" button in the Activity view header.

```tsx
// In HistoryTab.tsx — inside the "changes" view section:
<button
  className="tt-btn"
  onClick={() => setTimeTravelOpen(true)}
  title="Explore history without restoring"
>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
  Time-Travel
</button>
```

State needed:
```tsx
const [timeTravelOpen, setTimeTravelOpen] = React.useState(false);
```

When `timeTravelOpen` is true, render the `TimeTravelScrubber` (see 4.3).

---

### 4.2 — CSS Class Name Normalization

**File:** `editor/sidebar/tabs/history/styles/history.css`

Rename CSS classes from `aqb-ht-*` to the prototype's names. This ensures visual parity with the prototype.

| Current | Prototype | Used On |
|---------|-----------|---------|
| `aqb-ht-controls` | `list-container` | Outer content wrapper |
| `aqb-ht-undo-row` | `activity-header` | Header row with controls |
| `aqb-ht-clear-btn` | `action-btn` | Clear/undo buttons |
| `aqb-ht-empty` | `empty-state` | Empty list state |
| `aqb-ht-entry` | `entry-row` | History entry row |
| `aqb-ht-entry__row` | `entry-row-main` | Entry main content |
| `aqb-ht-entry__expand` | `expand-icon` | Expand chevron |
| `aqb-ht-entry__info` | same | Entry text info |
| `aqb-ht-entry__label` | `entry-label` | Entry label text |
| `aqb-ht-entry__meta` | `entry-meta` | Time + badge meta |
| `aqb-ht-entry__current` | `current-badge` | "Current" badge |
| `aqb-ht-entry__dot` | (remove) | Dot for no-changes entries |
| `aqb-ht-diff` | `diff-preview` | Expanded diff |
| `aqb-ht-diff__row` | `diff-item` | Individual diff row |
| `aqb-ht-diff__op` | `diff-op` | + / - / ~ operator |
| `aqb-ht-diff__property` | `diff-prop` | Property name |
| `aqb-ht-diff__desc` | same | Change description |
| `aqb-ht-keyboard-hints` | `keyboard-hints` | Keyboard hint bar |
| `aqb-ht-kbd` | `kbd` | Keyboard key |
| `aqb-ht-show-all` | same | "Show all N" button |
| `aqb-ht-skeleton` | same | Loading skeleton |
| `aqb-ht-version-panel` | `saves-view` | Saves view container |
| `aqb-ht-version-list` | `version-list` | Version rows list |
| `aqb-ht-version-row` | `version-row` | Version row |
| `aqb-ht-version-row__info` | `version-row-main` | Version row main |
| `aqb-ht-version-row__name` | `version-name` | Version name |
| `aqb-ht-version-row__meta` | `version-meta` | Time + badge meta |
| `aqb-ht-badge` | `entry-badge` | Badge component |
| `aqb-ht-badge--count` | `entry-badge.checkpoint` | Checkpoint badge |
| `aqb-ht-badge--auto` | `entry-badge.auto-save` | Auto-save badge |
| `aqb-ht-btn--primary` | `action-btn.primary` | Primary button |
| `aqb-ht-btn--restore` | `action-btn` | Restore button |
| `aqb-ht-btn--danger` | `action-btn.danger` | Delete/danger button |
| `aqb-ht-inline-confirm` | `restore-confirm` / `delete-confirm` | Inline confirm |
| `aqb-ht-fab` | `fab` | Floating action button |
| `aqb-ht-save-form` | `save-form` | Save version form |
| `aqb-ht-save-form__input` | `form-input` | Form input |
| `aqb-ht-save-form__actions` | same | Form action row |

**Also add missing prototype classes not yet in CSS:**

```css
/* Tab helper text */
.tab-helper {
  display: block;
  font-size: 11px;
  font-weight: 400;
  color: var(--aqb-text-muted);
  margin-top: 1px;
}

/* View switcher */
.view-switcher {
  display: flex;
  border-bottom: 1px solid var(--aqb-border);
  padding: 0 12px;
}

.view-tab {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 400;
  color: var(--aqb-text-secondary);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.view-tab:hover { color: var(--aqb-text-primary); }
.view-tab.active { font-weight: 600; color: var(--aqb-text-primary); border-bottom-color: var(--aqb-primary); }

/* Search bar */
.search-bar {
  padding: 8px 12px;
  border-bottom: 1px solid var(--aqb-border);
  position: relative;
}

/* Diff summary badges (compare view) */
.diff-summary-badge {
  padding: 3px 8px;
  border-radius: var(--aqb-radius-full);
  font-size: 11px;
  font-weight: 500;
}

.diff-summary-badge.style { background: var(--aqb-primary-light); color: var(--aqb-primary); }
.diff-summary-badge.text { background: var(--aqb-success-light); color: var(--aqb-success); }
.diff-summary-badge.layout { background: var(--aqb-warning-light); color: var(--aqb-warning); }
.diff-summary-badge.content { background: var(--aqb-error-light); color: var(--aqb-error); }

/* Compare view */
.compare-view {
  padding: 12px;
  background: var(--surface-1);
  border-radius: var(--aqb-radius-md);
  margin-top: 8px;
}

.ai-summary {
  padding: 10px 12px;
  background: var(--aqb-primary-subtle);
  border-radius: var(--aqb-radius-sm);
  font-size: 12px;
  color: var(--aqb-text-primary);
  margin-bottom: 10px;
  line-height: 1.5;
}

.screenshot-thumb {
  aspect-ratio: 16/10;
  background: var(--surface-3);
  border-radius: var(--aqb-radius-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.diff-change {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid var(--aqb-border);
}

.diff-change:last-child { border-bottom: none; }
.diff-change-op { font-size: 12px; font-weight: 700; width: 14px; flex-shrink: 0; }
.diff-change-prop { font-size: 12px; color: var(--aqb-text-secondary); flex: 1; }
.diff-change-val { font-size: 11px; font-family: var(--font-mono); color: var(--aqb-text-muted); max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.diff-change-val.before { color: var(--aqb-error); text-decoration: line-through; opacity: 0.7; }
.diff-change-val.after { color: var(--aqb-success); }

.ai-summary-btn {
  width: 100%;
  padding: 8px;
  background: var(--aqb-primary-light);
  color: var(--aqb-primary);
  border-radius: var(--aqb-radius-sm);
  font-size: 12px;
  font-weight: 500;
  transition: background var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.ai-summary-btn:hover { background: var(--aqb-primary-subtle); }
.ai-summary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ai-summary-btn.loading { opacity: 0.6; }
.ai-summary-result { margin-top: 8px; padding: 10px; background: var(--surface-2); border-radius: var(--aqb-radius-sm); font-size: 12px; color: var(--aqb-text-primary); line-height: 1.5; }
.ai-summary-error { font-size: 11px; color: var(--aqb-error); margin-top: 6px; opacity: 0.8; }

/* Snapshot preview tooltip */
.snapshot-preview {
  position: absolute;
  z-index: 100;
  width: 160px;
  pointer-events: none;
  animation: fadeIn 150ms ease-out;
}

.snapshot-preview img {
  width: 100%;
  border-radius: var(--aqb-radius-md);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* Time-Travel Drawer */
.tt-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  pointer-events: none;
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.tt-overlay.active { opacity: 1; pointer-events: all; }

.tt-drawer {
  position: fixed;
  bottom: 0;
  left: 344px;
  right: 320px;
  height: 200px;
  background: rgba(20,20,31,0.97);
  border-top: 1px solid var(--aqb-border);
  transform: translateY(100%);
  transition: transform 200ms ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 32px;
  z-index: 201;
}

.tt-drawer.active { transform: translateY(0); }

.tt-slider-container { width: 100%; max-width: 600px; }
.tt-slider-label { font-size: 12px; color: var(--aqb-text-muted); margin-bottom: 12px; text-align: center; }
.tt-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  background: var(--surface-4);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.tt-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--aqb-primary);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(45,109,255,0.4);
}

.tt-time-display {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--aqb-text-muted);
  margin-top: 8px;
}

.tt-time-current { color: var(--aqb-primary); font-weight: 500; }
.tt-actions { display: flex; gap: 12px; margin-top: 16px; }

.tt-restore-btn {
  padding: 8px 20px;
  background: var(--aqb-primary);
  color: #fff;
  border-radius: var(--aqb-radius-sm);
  font-size: 13px;
  font-weight: 500;
  transition: background var(--transition-fast);
}

.tt-restore-btn:hover { background: var(--aqb-primary-hover); }
.tt-exit-btn {
  padding: 8px 16px;
  background: var(--surface-4);
  color: var(--aqb-text-secondary);
  border-radius: var(--aqb-radius-sm);
  font-size: 13px;
  transition: background var(--transition-fast);
}

.tt-exit-btn:hover { background: var(--surface-5); color: var(--aqb-text-primary); }

.tt-canvas-preview {
  position: fixed;
  top: 48px;
  left: 344px;
  width: calc(100vw - 344px - 320px);
  height: calc(100vh - 48px - 200px);
  pointer-events: none;
  z-index: 199;
  opacity: 0;
  transition: opacity 150ms ease-out;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #aaa;
}

.tt-canvas-preview.active { opacity: 0.4; }
```

---

### 4.3 — SnapshotPreview Component

**New file:** `editor/sidebar/tabs/history/components/SnapshotPreview.tsx`

```tsx
import * as React from "react";

interface SnapshotPreviewProps {
  snapshotUrl: string | null;
  versionName: string;
  anchorRect: DOMRect;
}

export const SnapshotPreview: React.FC<SnapshotPreviewProps> = ({
  snapshotUrl,
  versionName,
  anchorRect,
}) => {
  if (!snapshotUrl) return null;

  const style: React.CSSProperties = {
    position: "fixed",
    left: anchorRect.right + 8,
    top: anchorRect.top,
    zIndex: 100,
    width: 160,
    pointerEvents: "none",
    animation: "fadeIn 150ms ease-out",
  };

  return (
    <div className="snapshot-preview" style={style}>
      <img src={snapshotUrl} alt={versionName} />
    </div>
  );
};
```

Add to `VersionHistoryPanel.tsx` — show on version row hover:

```tsx
const [previewInfo, setPreviewInfo] = React.useState<{
  snapshotUrl: string | null;
  versionName: string;
  anchorRect: DOMRect;
} | null>(null);

// In version row onMouseEnter:
{entry.visualSnapshot && (
  <div
    className="version-row__snapshot-trigger"
    onMouseEnter={(e) => {
      setPreviewInfo({
        snapshotUrl: entry.visualSnapshot,
        versionName: entry.name,
        anchorRect: e.currentTarget.getBoundingClientRect(),
      });
    }}
    onMouseLeave={() => setPreviewInfo(null)}
  />
)}

{previewInfo && (
  <SnapshotPreview
    snapshotUrl={previewInfo.snapshotUrl}
    versionName={previewInfo.versionName}
    anchorRect={previewInfo.anchorRect}
  />
)}
```

---

### 4.4 — Visual Snapshot Capture on Save

**Files:** `engine/VersionHistoryManager.ts`, `shared/hooks/useVersionHistory.ts`

On `createVersion()` / `autoCheckpoint()`:

```typescript
// Capture canvas screenshot as JPEG blob (60% quality)
function captureVisualSnapshot(): string | null {
  try {
    const canvas = document.getElementById('editor-canvas') as HTMLCanvasElement | null;
    if (!canvas) return null;
    return canvas.toDataURL('image/jpeg', 0.6);
  } catch {
    return null; // graceful degradation on capture failure
  }
}
```

Store in version record:
```typescript
interface NamedVersion {
  // ...existing fields
  visualSnapshot?: string | null;
}
```

Update `createVersion()` in `useVersionHistory.ts`:
```tsx
const createVersion = async (name: string, description?: string) => {
  const snapshot = await composer.versionHistory.createSnapshot();
  const visualSnapshot = captureVisualSnapshot();
  // ... save version with visualSnapshot
};
```

---

### 4.5 — Compare View with Side-by-Side Screenshots

**File:** `editor/panels/VersionHistoryPanel.tsx`

When user clicks "Compare" on a version row, expand the row and show:

```tsx
{expanded && (
  <div className="compare-view">
    {/* AI Summary */}
    {version.aiSummary && (
      <div className="ai-summary">{version.aiSummary}</div>
    )}

    {/* Screenshots side-by-side */}
    {version.visualSnapshot && (
      <div className="compare-screenshots">
        <div className="screenshot-thumb">
          <img src={currentVisualSnapshot} alt="Current" />
          <span className="screenshot-label">Current</span>
        </div>
        <div className="screenshot-thumb">
          <img src={version.visualSnapshot} alt={version.name} />
          <span className="screenshot-label">{version.name}</span>
        </div>
      </div>
    )}

    {/* Change summary badges */}
    <div className="diff-summary-badges">
      {diffSummary.style > 0 && <span className="diff-summary-badge style">{diffSummary.style} style</span>}
      {diffSummary.text > 0 && <span className="diff-summary-badge text">{diffSummary.text} text</span>}
      {diffSummary.layout > 0 && <span className="diff-summary-badge layout">{diffSummary.layout} layout</span>}
      {diffSummary.content > 0 && <span className="diff-summary-badge content">{diffSummary.content} content</span>}
    </div>

    {/* Change list */}
    <div className="diff-change-list">
      {diff.changes.map((change, i) => (
        <div key={i} className="diff-change">
          <span className={`diff-op ${change.operation}`}>
            {change.operation === 'add' ? '+' : change.operation === 'remove' ? '−' : '~'}
          </span>
          <span className="diff-change-prop">{change.property}</span>
          {change.before && <span className="diff-change-val before">{change.before}</span>}
          {change.after && <span className="diff-change-val after">{change.after}</span>}
        </div>
      ))}
    </div>

    {/* AI Summary button */}
    <button
      className="ai-summary-btn"
      onClick={() => handleGetAiSummary(version.id)}
      disabled={aiSummaryLoading}
    >
      {aiSummaryLoading ? "Generating..." : "Get AI Summary"}
    </button>
    {aiSummaryError && <p className="ai-summary-error">{aiSummaryError}</p>}
    {aiSummaryResult && <div className="ai-summary-result">{aiSummaryResult}</div>}
  </div>
)}
```

---

## Phase 5 Tasks

### 5.1 — AI Summary Button + API Endpoint

**Frontend:** `editor/panels/VersionHistoryPanel.tsx`

```tsx
const [aiSummaryState, setAiSummaryState] = React.useState<{
  [versionId: string]: {
    loading: boolean;
    result: string | null;
    error: string | null;
  };
}>({});

const handleGetAiSummary = async (versionId: string) => {
  setAiSummaryState((prev) => ({
    ...prev,
    [versionId]: { loading: true, result: null, error: null },
  }));

  try {
    const response = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionName: version.name,
        changes: diff,
      }),
    });

    if (!response.ok) throw new Error("AI summary unavailable");
    const { summary } = await response.json();

    // Cache in version record (via useVersionHistory)
    await updateVersionAiSummary(versionId, summary);

    setAiSummaryState((prev) => ({
      ...prev,
      [versionId]: { loading: false, result: summary, error: null },
    }));
  } catch (err) {
    setAiSummaryState((prev) => ({
      ...prev,
      [versionId]: { loading: false, result: null, error: "Summary unavailable" },
    }));
  }
};
```

**API endpoint:** `pages/api/ai/summarize.ts` (or tRPC router)

```typescript
// POST /api/ai/summarize
// Request: { versionName: string, changes: CompareResult }
// Response: { summary: string }

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  // Call AI service with structured diff, return natural language summary
}
```

---

### 5.2 — Delete Legacy File

**File:** `components/Panels/LeftSidebar/tabs/HistoryTab.tsx`

Delete this legacy file — it was the old History tab implementation before the redesign. The new implementation is in `editor/sidebar/tabs/history/HistoryTab.tsx`.

```bash
rm components/Panels/LeftSidebar/tabs/HistoryTab.tsx
```

---

## Implementation Order

1. **4.2** — CSS class normalization (affects all visual output, do first)
2. **4.1** — Time-Travel button (small addition to HistoryTab.tsx)
3. **4.3** — SnapshotPreview component (standalone, no dependencies)
4. **4.4** — Visual snapshot capture (engine + hook change)
5. **4.5** — Compare view (uses 4.3 and 4.4)
6. **5.1** — AI Summary button + API (independent)
7. **5.2** — Delete legacy file (trivial, do last)

---

## Files to Modify

| File | Change |
|------|--------|
| `editor/sidebar/tabs/history/styles/history.css` | Rename classes + add missing ones |
| `editor/sidebar/tabs/history/HistoryTab.tsx` | Add Time-Travel button state + render TimeTravelScrubber |
| `editor/sidebar/tabs/history/components/ActivityView.tsx` | Update class names |
| `editor/panels/VersionHistoryPanel.tsx` | Update class names, add Compare view, add SnapshotPreview |
| `editor/sidebar/tabs/history/components/SnapshotPreview.tsx` | NEW |
| `editor/sidebar/tabs/history/components/TimeTravelScrubber.tsx` | NEW |
| `shared/hooks/useVersionHistory.ts` | Add visual snapshot capture |
| `engine/VersionHistoryManager.ts` | Add capture method |
| `pages/api/ai/summarize.ts` | NEW (or tRPC router) |
| `components/Panels/LeftSidebar/tabs/HistoryTab.tsx` | DELETE |

---

## Estimated Effort

| Task | Complexity |
|------|------------|
| 4.2 CSS normalization | Medium (many class renames, no logic) |
| 4.1 Time-Travel button | Low (button + state) |
| 4.3 SnapshotPreview | Low (simple tooltip component) |
| 4.4 Visual snapshot capture | Medium (canvas API + storage) |
| 4.5 Compare view | Medium (UI expansion, diff display) |
| 5.1 AI Summary | Medium (API endpoint + frontend wiring) |
| 5.2 Delete legacy | Trivial |
