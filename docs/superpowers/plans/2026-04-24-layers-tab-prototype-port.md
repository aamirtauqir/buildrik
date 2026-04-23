# Layers Tab — Prototype Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Layers sidebar tab to match `/Users/shahg/Desktop/design-system/project/left-panel/tab-layers.html` at ≥90% visual fidelity. Zero change to business logic, hooks, composer calls, or localStorage keys.

**Architecture:** Class + CSS rewrite only. `LayersTab.tsx` gains the panel frame (prototype `panel-h` + `psearch`), `LayersPanel/index.tsx` becomes the tree body, `LayerTreeItem.tsx` adopts `.bdc-lr*` classes. One new stylesheet (`layers-v2.css`), all other styles (`styles.ts`, `styles/layers.css`) deleted in the final commit. All `--bd-*` bridge tokens (already bridged in `editor/shell/chrome.css`).

**Tech Stack:** React 18 + TypeScript + plain CSS. No Emotion. No Tailwind. Vite dev server on port 5050.

**Source of truth:** `docs/superpowers/specs/2026-04-24-layers-tab-prototype-port-design.md` (commit `ac0c912`).

**Mode:** HOLD SCOPE (no business logic changes).

---

## File map (lock decomposition)

| Action | Path | Role |
|---|---|---|
| CREATE | `packages/editor/src/editor/panels/layers/styles/layers-v2.css` | Only stylesheet for Layers tab |
| MODIFY | `packages/editor/src/editor/sidebar/tabs/layers/LayersTab.tsx` | Panel frame owner: renders `.bdc-panel` + `.bdc-panel-h` + `.bdc-psearch` + `.bdc-pbody` shell |
| MODIFY | `packages/editor/src/editor/panels/layers/index.tsx` | Tree body owner: removes internal header + search, adds 3 composer event listeners (`layers:expand-all`, `layers:collapse-all`, `layers:stats-change` emit), accepts `search` prop |
| MODIFY | `packages/editor/src/editor/panels/layers/LayerTreeItem.tsx` | Row rewrite: `.bdc-lr*` classes, drop `isHovered` / `isLayerHovered` reveal state, prototype indent math (`6 + depth * 14`) |
| MODIFY | `packages/editor/src/editor/panels/layers/components/LayerBreadcrumb.tsx` | Classname swap → `.bdc-layers-crumb*` |
| MODIFY | `packages/editor/src/editor/panels/layers/components/LayerContextMenu.tsx` | Classname swap → `.bdc-menu*`, `.bdc-menu-danger` for destructive items |
| MODIFY | `packages/editor/src/editor/panels/layers/components/LayerDisplaySettings.tsx` | Classname swap → `.bdc-popover.bdc-layers-settings` |
| MODIFY | `packages/editor/src/editor/panels/layers/components/LayerSelectionBanner.tsx` | Classname swap → `.bdc-layers-banner`, buttons become `.bdc-icon-btn` with `aria-label` |
| MODIFY | `packages/editor/src/editor/panels/layers/components/LayersEmptyState.tsx` | Classname swap → `.bdc-layers-empty`, CTA uses `.bdc-btn.bdc-primary` |
| MODIFY | `packages/editor/src/editor/sidebar/tabs/layers/__tests__/LayersTab.test.tsx` | Delete 3 sync-banner tests + 2 `PanelHeader` mocks; update 5 `LayerSelectionBanner` text assertions to `getByRole` |
| DELETE | `packages/editor/src/editor/panels/layers/styles.ts` | Dead after commit 3 |
| DELETE | `packages/editor/src/editor/panels/layers/styles/layers.css` | Dead after commit 4 |

**Out of scope (explicit):** `engine/**`, all hooks under `editor/panels/layers/hooks/**`, `data/layerUtils.ts`, `types.ts`, `shared/constants/events.ts`, `themes/components.css`, `themes/ux-fixes.css`. Legacy global CSS rules become dead selectors once JSX stops emitting the matching classnames; physical removal deferred to a future cross-tab "legacy CSS purge" spec.

---

## Phase 0 — Pre-flight (tree hygiene)

The current working tree has unrelated staged deletes from `code-to-prd-output/`, `docs/design-documentation/`, etc. Starting Layers commits without handling them would bundle them into a Layers commit and confuse reviewers.

### Task 0.1: Handle unrelated staged deletes

**Files:**
- None modified by this task.

- [ ] **Step 1: Inspect the tree**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && git status --short | head -30
```

Expected: 70+ deleted files and one modified `.claude/scheduled_tasks.lock`.

- [ ] **Step 2: Decide outcome with user**

Present two options to the user:

1. **Keep the deletes.** Commit them as a single `chore: remove stale generated artifacts` commit *before* commit 1 of Layers work.
2. **Discard the deletes.** Run `git restore .` (or selectively restore the deleted paths) so the tree is clean.

Do not auto-decide. Wait for explicit user instruction.

- [ ] **Step 3: Execute user's decision**

If keep:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && git add -A && git commit -m "chore: remove stale generated artifacts"
```

If discard:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && git restore .
```

- [ ] **Step 4: Verify clean tree**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && git status --short
```

Expected: empty output or only `.claude/scheduled_tasks.lock` (session-local, ignore).

---

## Phase 1 — Commit 1: add `layers-v2.css`

New CSS file, JSX untouched. App behavior unchanged. This commit alone is a no-op visually; it only becomes active when commits 2+ start emitting `.bdc-lr*` classnames.

### Task 1.1: Create `layers-v2.css`

**Files:**
- Create: `packages/editor/src/editor/panels/layers/styles/layers-v2.css`

- [ ] **Step 1: Write the stylesheet**

```css
/**
 * layers-v2.css — Layers tab styles (prototype port 2026-04-24).
 *
 * Scope: everything rendered by LayersTab + LayersPanel + LayerTreeItem +
 * all sub-components under editor/panels/layers/components/.
 *
 * Tokens: --bd-* only (bridged in editor/shell/chrome.css).
 * Namespace: .bdc-lr* for tree rows, .bdc-layers-* for panel-scoped bits,
 *            .bdc-menu*, .bdc-popover for generic floating surfaces that
 *            may later be promoted to chrome.css.
 */

/* ==========================================================================
   Tree row (.bdc-lr)
   ========================================================================== */

.bdc-lr {
  position: relative;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  border-radius: 4px;
  font: 500 11px var(--bd-font);
  color: var(--bd-fg-primary);
  cursor: pointer;
  user-select: none;
}

.bdc-lr:hover { background: var(--bd-bg-subtle); }

.bdc-lr.bdc-sel {
  background: var(--bd-accent-tint);
  color: var(--bd-accent);
  font-weight: 600;
}

.bdc-lr.bdc-hidden .bdc-lr-nm {
  color: var(--bd-fg-muted);
  font-style: italic;
}

.bdc-lr-chev {
  width: 12px;
  height: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--bd-fg-muted);
  transition: transform 120ms;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.bdc-lr.bdc-closed .bdc-lr-chev { transform: rotate(-90deg); }
.bdc-lr.bdc-leaf .bdc-lr-chev { visibility: hidden; }

.bdc-lr-ic {
  color: var(--bd-fg-secondary);
  display: inline-flex;
  flex-shrink: 0;
}

.bdc-lr.bdc-sel .bdc-lr-ic { color: var(--bd-accent); }

.bdc-lr-ic svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.bdc-lr-nm {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bdc-lr-edit {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--bd-accent);
  outline: none;
  font: 500 11px var(--bd-font);
  color: var(--bd-fg-primary);
  padding: 0;
}

/* Inline tag/id/class/component/bp badges (display-settings controlled) */
.bdc-lr-tag,
.bdc-lr-id,
.bdc-lr-cls {
  font: 500 9.5px var(--bd-mono);
  color: var(--bd-fg-muted);
  padding: 0 3px;
  border-radius: 3px;
  background: var(--bd-bg-subtle);
  letter-spacing: -0.01em;
  flex-shrink: 0;
}

.bdc-lr-cmp {
  font-size: 10px;
  color: var(--bd-accent);
  flex-shrink: 0;
}

.bdc-lr-bp {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font: 600 8.5px var(--bd-mono);
  color: var(--bd-fg-muted);
  border: 1px solid var(--bd-border);
  border-radius: 3px;
  flex-shrink: 0;
}

/* Eye + lock (hover-reveal, warning color on lock) */
.bdc-lr-eye,
.bdc-lr-lock {
  color: var(--bd-fg-muted);
  display: inline-flex;
  padding: 2px;
  opacity: 0;
  transition: opacity 120ms;
  background: transparent;
  border: none;
  cursor: pointer;
}

.bdc-lr-eye svg,
.bdc-lr-lock svg {
  width: 11px;
  height: 11px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.bdc-lr:hover .bdc-lr-eye,
.bdc-lr.bdc-sel .bdc-lr-eye,
.bdc-lr-eye.bdc-off { opacity: 1; }

.bdc-lr-eye.bdc-off { opacity: 0.6; }
.bdc-lr-eye:hover { color: var(--bd-fg-primary); }

.bdc-lr:hover .bdc-lr-lock,
.bdc-lr-lock.bdc-on { opacity: 1; }
.bdc-lr-lock.bdc-on { color: var(--bd-warning); }

/* Drag indicators */
.bdc-lr[data-drop="before"]::before,
.bdc-lr[data-drop="after"]::after {
  content: "";
  position: absolute;
  left: 6px;
  right: 6px;
  height: 2px;
  background: var(--bd-accent);
  border-radius: 2px;
  pointer-events: none;
}
.bdc-lr[data-drop="before"]::before { top: -1px; }
.bdc-lr[data-drop="after"]::after { bottom: -1px; }
.bdc-lr[data-drop="inside"] {
  box-shadow: inset 0 0 0 1.5px var(--bd-accent);
  background: var(--bd-accent-tint);
}
.bdc-lr.is-dragging { opacity: 0.5; }

/* Focus ring */
.bdc-lr:focus-visible {
  outline: 2px solid var(--bd-accent);
  outline-offset: -2px;
  z-index: 1;
}

/* ==========================================================================
   Tree container + compact density
   ========================================================================== */

.bdc-layers-tree {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 10px 10px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.bdc-layers-tree.bdc-layers-tree-compact .bdc-lr {
  padding: 2px 6px;
}

/* ==========================================================================
   Selection banner (multi-select action bar)
   ========================================================================== */

.bdc-layers-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--bd-bg-subtle);
  border-bottom: 1px solid var(--bd-border);
}

.bdc-layers-banner-count {
  font: 500 10px var(--bd-mono);
  color: var(--bd-fg-secondary);
  flex: 1;
}

.bdc-layers-banner .bdc-icon-btn {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 5px;
  color: var(--bd-fg-secondary);
  cursor: pointer;
}
.bdc-layers-banner .bdc-icon-btn:hover {
  background: #fff;
  color: var(--bd-fg-primary);
}
.bdc-layers-banner .bdc-icon-btn svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ==========================================================================
   Breadcrumb (single-select ancestor chain)
   ========================================================================== */

.bdc-layers-crumb {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  overflow-x: auto;
  border-bottom: 1px solid var(--bd-border);
  font: 500 9.5px var(--bd-mono);
}

.bdc-layers-crumb button {
  background: transparent;
  border: none;
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--bd-fg-muted);
  font: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.bdc-layers-crumb button:hover {
  color: var(--bd-fg-primary);
  background: var(--bd-bg-subtle);
}
.bdc-layers-crumb button.bdc-on {
  color: var(--bd-accent);
  font-weight: 600;
}

.bdc-layers-crumb-sep {
  color: var(--bd-fg-muted);
  flex-shrink: 0;
}

/* ==========================================================================
   Context menu
   ========================================================================== */

.bdc-menu {
  position: fixed;
  z-index: 1000;
  background: #fff;
  border: 1px solid var(--bd-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px -6px rgba(15, 23, 42, 0.18);
  padding: 4px;
  min-width: 180px;
  font: 500 11px var(--bd-font);
}

.bdc-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 5px;
  background: transparent;
  border: none;
  color: var(--bd-fg-primary);
  font: inherit;
  cursor: pointer;
  width: 100%;
  text-align: left;
}
.bdc-menu-item:hover { background: var(--bd-bg-subtle); }
.bdc-menu-item:disabled { color: var(--bd-fg-muted); cursor: not-allowed; }

.bdc-menu-ic {
  width: 13px;
  height: 13px;
  color: var(--bd-fg-muted);
  flex-shrink: 0;
}
.bdc-menu-ic svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.bdc-menu-lbl { flex: 1; }

.bdc-menu-kbd {
  font: 500 9.5px var(--bd-mono);
  color: var(--bd-fg-muted);
  background: var(--bd-bg-subtle);
  padding: 1px 4px;
  border-radius: 3px;
  flex-shrink: 0;
}

.bdc-menu-sep {
  height: 1px;
  background: var(--bd-border);
  margin: 4px 0;
}

.bdc-menu-item.bdc-menu-danger:hover {
  color: var(--bd-error);
}

/* ==========================================================================
   Display settings popover
   ========================================================================== */

.bdc-popover {
  position: absolute;
  z-index: 1000;
  background: #fff;
  border: 1px solid var(--bd-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px -6px rgba(15, 23, 42, 0.18);
  padding: 10px 12px;
  min-width: 220px;
}

.bdc-layers-settings .bdc-popover-h {
  font: 600 10px var(--bd-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bd-fg-muted);
  padding-bottom: 6px;
}

.bdc-layers-settings .bdc-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 0;
  font: 500 11px var(--bd-font);
  color: var(--bd-fg-primary);
  cursor: pointer;
}

.bdc-switch {
  appearance: none;
  position: relative;
  width: 18px;
  height: 10px;
  background: var(--bd-border);
  border-radius: 999px;
  cursor: pointer;
  transition: background 120ms;
}
.bdc-switch::after {
  content: "";
  position: absolute;
  top: 1px;
  left: 1px;
  width: 8px;
  height: 8px;
  background: #fff;
  border-radius: 50%;
  transition: transform 120ms;
}
.bdc-switch:checked { background: var(--bd-accent); }
.bdc-switch:checked::after { transform: translateX(8px); }

/* ==========================================================================
   Empty state
   ========================================================================== */

.bdc-layers-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  gap: 8px;
  color: var(--bd-fg-muted);
}
.bdc-layers-empty h3 {
  margin: 0;
  font: 600 13px var(--bd-font);
  color: var(--bd-fg-heading);
}
.bdc-layers-empty p {
  margin: 0;
  font: 500 11.5px var(--bd-font);
  color: var(--bd-fg-secondary);
}

/* ==========================================================================
   Drop feedback alert
   ========================================================================== */

.bdc-layers-drop-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  margin: 6px 10px 0;
  background: rgba(220, 38, 38, 0.08);
  border-left: 2px solid var(--bd-error);
  border-radius: 4px;
  font: 500 11px var(--bd-font);
  color: var(--bd-error);
}

/* ==========================================================================
   Inline delete-confirm
   ========================================================================== */

.bdc-layers-confirm {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  margin: 6px 10px 0;
  background: rgba(217, 119, 6, 0.08);
  border-left: 2px solid var(--bd-warning);
  border-radius: 4px;
  font: 500 11px var(--bd-font);
  color: var(--bd-fg-primary);
}
.bdc-layers-confirm span { flex: 1; }

.bdc-layers-confirm .bdc-btn {
  padding: 4px 10px;
  font: 500 10.5px var(--bd-font);
  border-radius: 5px;
  border: 1px solid transparent;
  cursor: pointer;
}

.bdc-layers-confirm .bdc-btn-danger {
  background: var(--bd-error);
  color: #fff;
  border-color: var(--bd-error);
}
.bdc-layers-confirm .bdc-btn-danger:hover {
  filter: brightness(1.05);
}

.bdc-layers-confirm .bdc-btn-ghost {
  background: transparent;
  color: var(--bd-fg-secondary);
  border-color: transparent;
}
.bdc-layers-confirm .bdc-btn-ghost:hover {
  background: var(--bd-bg-subtle);
  color: var(--bd-fg-primary);
}

/* ==========================================================================
   Screen-reader only
   ========================================================================== */

.bdc-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 2: Verify file exists**

Run:
```bash
ls -la /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/panels/layers/styles/layers-v2.css
```

Expected: file listed, size > 7 KB.

- [ ] **Step 3: Typecheck passes (no imports yet → nothing to break)**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: exit 0, no errors.

- [ ] **Step 4: Unit tests pass (CSS doesn't affect tests)**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/panels/layers src/editor/sidebar/tabs/layers
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git add packages/editor/src/editor/panels/layers/styles/layers-v2.css && git commit -m "$(cat <<'EOF'
feat(layers): add layers-v2.css and bdc-layers tokens

New stylesheet for the Layers tab prototype port. Uses only --bd-*
bridge tokens from chrome.css. Namespace: .bdc-lr* for rows, .bdc-
layers-* for panel-scoped, .bdc-menu* / .bdc-popover for floating
surfaces that may later migrate to chrome.css. No JSX changes in
this commit -- app behavior unchanged. First of 5 atomic commits.

Spec: docs/superpowers/specs/2026-04-24-layers-tab-prototype-port-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — Commit 2: port `LayerTreeItem` to `.bdc-lr*`

Tree rows flip to the new visual. Panel header still legacy. `LayerTreeItem` sheds its `isHovered` local state (CSS `:hover` takes over) and its 3 internal `<div class="buildrick-drop-indicator">` children (attribute `data-drop` on the row drives drop feedback).

### Task 2.1: Import stylesheet from `LayersPanel/index.tsx`

**Files:**
- Modify: `packages/editor/src/editor/panels/layers/index.tsx:1-20`

- [ ] **Step 1: Add the import at the top of `index.tsx`**

Insert the line below directly after the existing `import * as React from "react";` import (around line 6):

```ts
import "./styles/layers-v2.css";
```

- [ ] **Step 2: Typecheck**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: exit 0.

### Task 2.2: Rewrite `LayerTreeItem` render output

**Files:**
- Modify: `packages/editor/src/editor/panels/layers/LayerTreeItem.tsx:100-330`

- [ ] **Step 1: Replace the className + style blocks near line 101**

Find this block (currently around lines 101-123):

```ts
  const rowStyle = {
    "--layer-depth": layer.depth,
    paddingLeft: `${8 + layer.depth * 16}px`,
    opacity: isDragging ? 0.5 : isHidden ? 0.5 : 1,
  } as React.CSSProperties;

  const rowClassNames = [
    "buildrick-layer-row",
    hasChildren ? "has-children" : "",
    isSelected ? "is-selected" : "",
    isDragging ? "is-dragging" : "",
    isDropTarget ? "is-drop-target" : "",
    dropPosition ? `drop-${dropPosition}` : "",
    isHidden ? "is-hidden" : "",
    isLocked ? "is-locked" : "",
    isEditing ? "is-editing" : "",
    isCanvasHovered ? "is-canvas-hovered" : "",
    isLayerHovered ? "is-layer-hovered" : "",
    selectedIds.has(layer.id) && layer.id !== selectedElementId ? "is-multi-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
```

Replace with:

```ts
  const rowStyle: React.CSSProperties = {
    paddingLeft: `${6 + layer.depth * 14}px`,
  };

  const rowClassNames = [
    "bdc-lr",
    isSelected ? "bdc-sel" : "",
    isHidden ? "bdc-hidden" : "",
    isLocked ? "bdc-locked" : "",
    isEditing ? "bdc-editing" : "",
    isDragging ? "is-dragging" : "",
    hasChildren ? "" : "bdc-leaf",
    hasChildren && !isExpanded ? "bdc-closed" : "",
  ]
    .filter(Boolean)
    .join(" ");
```

- [ ] **Step 2: Replace the JSX `return` block**

Find the `return (` block (currently line 152) and replace the entire return expression with:

```tsx
  return (
    <div
      className={rowClassNames}
      role="treeitem"
      tabIndex={0}
      draggable={canDrag}
      aria-selected={isSelected}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-label={`${displayName}, ${layer.type} element${isHidden ? ", hidden" : ""}${isLocked ? ", locked" : ""}`}
      aria-level={layer.depth + 1}
      title={`${displayName}${isHidden ? " (Hidden)" : ""}${isLocked ? " (Locked)" : ""}`}
      style={rowStyle}
      data-drop={dropPosition ?? undefined}
      onMouseEnter={() => onMouseEnter(layer.id)}
      onMouseLeave={onMouseLeave}
      onDragStart={canDrag ? (e) => onDragStart(e, layer.id, layer.type) : undefined}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, layer.id, layer.type)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, layer.id)}
      onClick={(e) => {
        onSelect(layer.id, { shift: e.shiftKey, meta: e.metaKey || e.ctrlKey });
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, layer.id);
      }}
      onDoubleClick={(e) => {
        if (!isLocked) onStartEditing(layer.id, displayName, e);
      }}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="bdc-lr-chev"
        aria-label={hasChildren ? (isExpanded ? "Collapse children" : "Expand children") : undefined}
        aria-hidden={!hasChildren}
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) onToggleExpand(layer.id);
        }}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <span className="bdc-lr-ic" aria-hidden>
        <IconComponent size="sm" />
      </span>

      {isEditing ? (
        <input
          ref={editInputRef}
          type="text"
          className="bdc-lr-edit"
          value={editingName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          onBlur={onSaveEditedName}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveEditedName();
            else if (e.key === "Escape") onCancelEditing();
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="bdc-lr-nm">{displayName}</span>
          {displayPrefs.showHtmlBadges && (
            <span className="bdc-lr-tag" aria-hidden>{layer.tagName}</span>
          )}
          {displayPrefs.showElementIds && (
            <span className="bdc-lr-id" aria-hidden>#{layer.id.slice(0, 8)}</span>
          )}
          {layer.isComponent && (
            <span className="bdc-lr-cmp" title="Component instance" aria-label="Component instance">⚡</span>
          )}
          {layer.breakpointOverrides?.mobile?.hidden && (
            <span className="bdc-lr-bp" title="Hidden on mobile" role="img" aria-label="Hidden on mobile">M</span>
          )}
          {layer.breakpointOverrides?.tablet?.hidden && (
            <span className="bdc-lr-bp" title="Hidden on tablet" role="img" aria-label="Hidden on tablet">T</span>
          )}
        </>
      )}

      <button
        type="button"
        className={`bdc-lr-lock${isLocked ? " bdc-on" : ""}`}
        title={isLocked ? "Unlock element" : "Lock element"}
        aria-label={isLocked ? "Unlock element" : "Lock element"}
        onClick={(e) => onToggleLock(layer.id, e)}
      >
        <svg viewBox="0 0 24 24">
          {isLocked ? (
            <>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 018 0v4" />
            </>
          ) : (
            <>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 018 0" />
            </>
          )}
        </svg>
      </button>

      <button
        type="button"
        className={`bdc-lr-eye${isHidden ? " bdc-off" : ""}`}
        title={isHidden ? "Show element" : "Hide element"}
        aria-label={isHidden ? "Show element" : "Hide element"}
        onClick={(e) => onToggleVisibility(layer.id, e)}
      >
        <svg viewBox="0 0 24 24">
          {isHidden ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 002.8 2.8" />
              <path d="M9.9 5.1A9.5 9.5 0 0121 12a9.5 9.5 0 01-2.1 3" />
            </>
          ) : (
            <>
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="2.5" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
```

- [ ] **Step 3: Delete the outer `.buildrick-layer-node` wrapper**

The current code wraps the row in `<div className="buildrick-layer-node">…</div>` (line 153). The replacement above has no outer wrapper. If the existing return had the wrapper, the replacement already drops it.

- [ ] **Step 4: Remove unused references to `isLayerHovered` and `isCanvasHovered`**

Search `LayerTreeItem.tsx` for `isLayerHovered` and `isCanvasHovered`. Delete the local const definitions at lines 97–98 (`const isCanvasHovered = …;` and `const isLayerHovered = …;`). They become unused after the className swap. The `hoveredLayerId` and `canvasHoveredId` props on the component interface stay — only the local consts go.

### Task 2.3: Typecheck + tests + browser verify

- [ ] **Step 1: Typecheck**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: exit 0. Any error about unused `isCanvasHovered` / `isLayerHovered` → delete the const definitions.

- [ ] **Step 2: Unit tests**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/panels/layers src/editor/sidebar/tabs/layers
```

Expected: all pass. `LayerSelectionBanner` + `LayersTab` tests assert text labels that still render in this commit (banner + component text untouched).

- [ ] **Step 3: Browser verify**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npm run dev
```

Open http://localhost:5050, load a project with nested elements, open the Layers tab. Verify:

1. Tree rows render at 11px Inter Tight with 4/6 padding.
2. Selected row shows cobalt tint + cobalt foreground + 600 weight.
3. Hidden row shows italic muted name.
4. Hover reveals eye + lock icons.
5. Locked row shows warning-colored lock icon.
6. Chevron rotates -90° when collapsed, 0° when expanded.
7. Drag shows cobalt line before/after or inset highlight for "inside".
8. Double-click name opens inline input, Enter commits, Esc cancels.

Panel header still shows the legacy two-row chrome. That's expected — header port is commit 4.

### Task 2.4: Commit

- [ ] **Step 1: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git add packages/editor/src/editor/panels/layers/LayerTreeItem.tsx packages/editor/src/editor/panels/layers/index.tsx && git commit -m "$(cat <<'EOF'
feat(layers): port LayerTreeItem to bdc-lr classes

Tree row rewrite to new-design .bdc-lr* class set:
- Drop `buildrick-layer-row` + all `is-*` state modifiers.
- Drop `.buildrick-layer-node` outer wrapper.
- Drop `.buildrick-layer-toggle` / `-icon` / `-meta` / `-actions`
  inner wrappers -- flatten to span children per prototype.
- Drop local `isCanvasHovered` + `isLayerHovered` consts; CSS
  `:hover` + `.bdc-sel` cover all visual states.
- Swap inline drop-indicator <div>s for `data-drop` attribute
  read by CSS ::before/::after.
- Indent math 8 + depth*16 -> 6 + depth*14 (prototype value).
- Inline <input> for rename uses .bdc-lr-edit.
- Import layers-v2.css from LayersPanel/index.tsx.

Hooks, composer calls, keyboard handlers, drag-drop logic: unchanged.

2 of 5 atomic commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Commit 3: port sub-components + update 5 banner tests

Five components flip classnames. Internal `<style>` blocks (if any) are deleted — all rules now live in `layers-v2.css`. `LayerSelectionBanner` loses its text labels on buttons (icons only per §8.1), so 5 tests switch from `getByText` to `getByRole({ name })`.

### Task 3.1: Port `LayerBreadcrumb`

**Files:**
- Modify: `packages/editor/src/editor/panels/layers/components/LayerBreadcrumb.tsx`

- [ ] **Step 1: Read the file**

Run:
```bash
cat /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/panels/layers/components/LayerBreadcrumb.tsx
```

- [ ] **Step 2: Swap classnames and delete any inline `<style>` block**

Replace every `className="buildrick-breadcrumb*"` / `className="buildrick-crumb*"` with the matching `.bdc-layers-crumb*` class from the table below:

| Legacy class | New class |
|---|---|
| `buildrick-breadcrumb` / `buildrick-layer-breadcrumb` | `bdc-layers-crumb` |
| `buildrick-crumb-sep` / `buildrick-breadcrumb-sep` | `bdc-layers-crumb-sep` |
| (active crumb modifier) `is-active` / `buildrick-on` | `bdc-on` |

If the file has an inline `<style>{...}</style>` node at the bottom of the JSX, delete it. Ensure the component still receives and calls `onSelect(id)` identically.

- [ ] **Step 3: Typecheck**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: exit 0.

### Task 3.2: Port `LayerContextMenu`

**Files:**
- Modify: `packages/editor/src/editor/panels/layers/components/LayerContextMenu.tsx`

- [ ] **Step 1: Classname swap**

| Legacy | New |
|---|---|
| `buildrick-context-menu` / `buildrick-ctx-menu` | `bdc-menu` |
| `buildrick-menu-item` / `buildrick-ctx-item` | `bdc-menu-item` |
| `buildrick-menu-icon` / `buildrick-ctx-icon` | `bdc-menu-ic` |
| `buildrick-menu-label` / `buildrick-ctx-label` | `bdc-menu-lbl` |
| `buildrick-menu-kbd` / `buildrick-ctx-shortcut` | `bdc-menu-kbd` |
| `buildrick-menu-separator` / `buildrick-ctx-sep` | `bdc-menu-sep` |
| destructive item: any `buildrick-*-danger` / `is-danger` | `bdc-menu-danger` |

- [ ] **Step 2: Delete any inline `<style>` block.**

- [ ] **Step 3: Typecheck.**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

### Task 3.3: Port `LayerDisplaySettings`

**Files:**
- Modify: `packages/editor/src/editor/panels/layers/components/LayerDisplaySettings.tsx`

- [ ] **Step 1: Wrap the popover in `.bdc-popover.bdc-layers-settings`.**

Replace the outer wrapper div's `className` with `bdc-popover bdc-layers-settings`.

- [ ] **Step 2: Classname swap for section header + toggle rows.**

| Legacy | New |
|---|---|
| outer wrapper | `bdc-popover bdc-layers-settings` |
| section header `<h3>` / `<div>` | `bdc-popover-h` |
| each toggle row `<label>` | `bdc-toggle-row` |
| checkbox `<input type="checkbox">` | add `className="bdc-switch"` |

- [ ] **Step 3: Delete any inline `<style>` block.**

- [ ] **Step 4: Typecheck.**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

### Task 3.4: Port `LayerSelectionBanner` + update its 5 tests

**Files:**
- Modify: `packages/editor/src/editor/panels/layers/components/LayerSelectionBanner.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/layers/__tests__/LayersTab.test.tsx:159-229`

- [ ] **Step 1: Rewrite the banner JSX**

Replace the component's return expression with:

```tsx
export const LayerSelectionBanner: React.FC<LayerSelectionBannerProps> = ({
  count,
  onGroup,
  onHide,
  onDelete,
  onExit,
}) => {
  if (count < 2) return null;
  return (
    <div className="bdc-layers-banner" role="toolbar" aria-label="Selection actions">
      <span className="bdc-layers-banner-count">{count} selected</span>
      <button className="bdc-icon-btn" title="Group" aria-label="Group" onClick={onGroup}>
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      </button>
      <button className="bdc-icon-btn" title="Hide" aria-label="Hide" onClick={onHide}>
        <svg viewBox="0 0 24 24">
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      </button>
      <button className="bdc-icon-btn" title="Delete" aria-label="Delete" onClick={onDelete}>
        <svg viewBox="0 0 24 24">
          <path d="M4 7h16 M6 7v13a2 2 0 002 2h8a2 2 0 002-2V7 M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
        </svg>
      </button>
      <button className="bdc-icon-btn" title="Done" aria-label="Done" onClick={onExit}>
        <svg viewBox="0 0 24 24">
          <path d="M6 6l12 12 M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
};
```

Make sure the imports at the top of the file still include React and the `LayerSelectionBannerProps` type (keep the existing type import).

- [ ] **Step 2: Delete any inline `<style>` block.**

- [ ] **Step 3: Update 5 test assertions**

In `LayersTab.test.tsx`, find the `describe("LayerSelectionBanner", …)` block (around line 159). Update the 5 inner `it(...)` tests:

Replace:
```ts
expect(screen.getByText("3 selected")).toBeTruthy();
```
Keep as-is (count pill text stays visible).

Replace:
```ts
screen.getByText("Group").click();
```
with:
```ts
screen.getByRole("button", { name: "Group" }).click();
```

Replace:
```ts
screen.getByText("Delete").click();
```
with:
```ts
screen.getByRole("button", { name: "Delete" }).click();
```

Replace:
```ts
screen.getByText("Done").click();
```
with:
```ts
screen.getByRole("button", { name: "Done" }).click();
```

(Do the same for any `Hide` button test if present.)

- [ ] **Step 4: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/sidebar/tabs/layers/__tests__/LayersTab.test.tsx
```

Expected: all green. The `describe("LayersTab selection synced banner", …)` block still passes in this commit — its removal is in commit 4.

### Task 3.5: Port `LayersEmptyState`

**Files:**
- Modify: `packages/editor/src/editor/panels/layers/components/LayersEmptyState.tsx`

- [ ] **Step 1: Rewrite the return JSX**

Replace the component's return with:

```tsx
  return (
    <div className="bdc-layers-empty">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4" width="14" height="4" rx="1" />
        <rect x="7" y="10" width="14" height="4" rx="1" />
        <rect x="3" y="16" width="14" height="4" rx="1" />
      </svg>
      <h3>No layers yet</h3>
      <p>Drop in a block to get started.</p>
      {onAddBlockClick && (
        <button className="bdc-btn bdc-primary" onClick={onAddBlockClick}>
          Browse blocks
        </button>
      )}
    </div>
  );
```

The `onAddBlockClick` prop is optional (existing interface). Preserve the conditional render.

- [ ] **Step 2: Delete any inline `<style>` block.**

### Task 3.6: Delete the inline `<style>{layersPanelStyles}</style>` tag in `LayersPanel/index.tsx`

**Files:**
- Modify: `packages/editor/src/editor/panels/layers/index.tsx`

- [ ] **Step 1: Find and remove**

Near the bottom of `LayersPanel` return JSX there is:

```tsx
      <style>{layersPanelStyles}</style>
    </div>
```

Remove the `<style>` tag. Keep the closing `</div>`.

- [ ] **Step 2: Remove the now-unused import**

Delete the import:

```ts
import { layersPanelStyles, SR_ONLY_STYLE, getDropFeedbackStyle } from "./styles";
```

Replace with (keeping only what's still used — `SR_ONLY_STYLE` and `getDropFeedbackStyle` are still used below):

```ts
import { SR_ONLY_STYLE, getDropFeedbackStyle } from "./styles";
```

(These constants stay in `styles.ts` for now; full `styles.ts` deletion is commit 5.)

### Task 3.7: Typecheck + tests + browser verify

- [ ] **Step 1: Typecheck**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 2: Tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/panels/layers src/editor/sidebar/tabs/layers
```

Expected: all green.

- [ ] **Step 3: Browser verify**

With dev server running, verify:

1. Right-click a layer → context menu renders with new-design pill icons + `--bd-border` + shadow.
2. Multi-select (shift-click two rows) → banner appears with 4 icon buttons (Group / Hide / Delete / Done), tooltips on hover.
3. Single-select deep node → breadcrumb renders with slash separators + cobalt "on" state.
4. Gear icon (still in legacy header for this commit) → popover still works.
5. Empty project → empty-state renders with cobalt "Browse blocks" button.

### Task 3.8: Commit

- [ ] **Step 1: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git add packages/editor/src/editor/panels/layers/components/ packages/editor/src/editor/panels/layers/index.tsx packages/editor/src/editor/sidebar/tabs/layers/__tests__/LayersTab.test.tsx && git commit -m "$(cat <<'EOF'
feat(layers): port sub-components to bdc-layers-*

Classname swap + <style> block deletion across five sub-components:
- LayerBreadcrumb     -> .bdc-layers-crumb*
- LayerContextMenu    -> .bdc-menu* + .bdc-menu-danger (destructive)
- LayerDisplaySettings-> .bdc-popover.bdc-layers-settings + .bdc-switch
- LayerSelectionBanner-> .bdc-layers-banner + 4 .bdc-icon-btn icon-only
                         buttons (aria-label); 5 tests updated
                         getByText -> getByRole({name}).
- LayersEmptyState    -> .bdc-layers-empty + .bdc-btn.bdc-primary CTA.

Remove inline <style>{layersPanelStyles}</style> + unused import in
LayersPanel/index.tsx; styles.ts retains SR_ONLY_STYLE +
getDropFeedbackStyle for one more commit.

Hooks + composer calls + all action dispatches unchanged. 3 of 5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Commit 4: lift header into `LayersTab`, drop `PanelShell` + sync banner, wire events

`LayersTab` becomes the frame owner. Prototype `panel-h` + `psearch` render at the outer level. `LayersPanel` sheds its internal header row + search bar, accepts `search` prop, emits 1 new event + listens for 2 new events. `LayersTab` loses the "Selection synced from canvas" banner (spec §9 "Explicitly removed behavior"). Three tests in `LayersTab.test.tsx` get deleted.

### Task 4.1: Rewrite `LayersTab` to own the panel frame

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/layers/LayersTab.tsx` (full rewrite)

- [ ] **Step 1: Replace the file contents**

Full replacement for `LayersTab.tsx`:

```tsx
/**
 * LayersTab - Layers sidebar tab.
 *
 * Owns the panel frame (prototype panel-h + psearch). Delegates the
 * tree body to LayersPanel via a thin controlled-props interface.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useComposerSelection } from "../../../canvas/hooks/useComposerSelection";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { LayersPanel } from "../../../panels/layers/index";
import type { SelectedElementInfo } from "../../../panels/layers/types";

export interface LayersTabProps {
  composer: Composer | null;
  onElementSelect?: (elementId: string) => void;
  canvasHoveredId?: string | null;
  onAddBlockClick?: () => void;
  /** Retained for call-site compat. Unused in the new-design Layers tab. */
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}

export const LayersTab: React.FC<LayersTabProps> = ({
  composer,
  onElementSelect,
  canvasHoveredId,
  onAddBlockClick,
}) => {
  const { selectedElement: selectedEl, selectedId } = useComposerSelection({ composer });

  const selectedElement: SelectedElementInfo | null = React.useMemo(() => {
    if (!selectedEl) return null;
    return {
      id: selectedId || "",
      type: selectedEl.getType?.() || "element",
      tagName: selectedEl.getTagName?.() || "div",
    };
  }, [selectedEl, selectedId]);

  React.useEffect(() => {
    if (selectedId) onElementSelect?.(selectedId);
  }, [selectedId, onElementSelect]);

  // Local state (lifted from LayersPanel per spec §6)
  const [search, setSearch] = React.useState("");
  const [displaySettingsOpen, setDisplaySettingsOpen] = React.useState(false);
  const [stats, setStats] = React.useState<{ total: number; selected: number }>({ total: 0, selected: 0 });

  // Subscribe to stats event from LayersPanel
  React.useEffect(() => {
    if (!composer) return;
    const onStats = (data: unknown) => {
      const d = data as { total: number; selected: number };
      if (typeof d?.total === "number" && typeof d?.selected === "number") {
        setStats({ total: d.total, selected: d.selected });
      }
    };
    composer.on("layers:stats-change", onStats);
    return () => {
      composer.off("layers:stats-change", onStats);
    };
  }, [composer]);

  const handleLayerHover = React.useCallback(
    (id: string | null) => {
      if (composer) composer.emit(EVENTS.LAYER_HOVER, { id });
    },
    [composer]
  );

  const handleExpandAll = React.useCallback(() => {
    composer?.emit("layers:expand-all", {});
  }, [composer]);

  const handleCollapseAll = React.useCallback(() => {
    composer?.emit("layers:collapse-all", {});
  }, [composer]);

  const subText = `${stats.total} node${stats.total === 1 ? "" : "s"} · ${stats.selected} selected`;

  return (
    <section className="bdc-panel bdc-layers" aria-label="Layers">
      <div className="bdc-panel-h">
        <div className="bdc-panel-h-ttl">
          <h2>Layers</h2>
          <div className="bdc-panel-sub" aria-live="polite">{subText}</div>
        </div>
        <div className="bdc-panel-h-acts">
          <button className="bdc-icon-btn" title="Expand all" aria-label="Expand all layers" onClick={handleExpandAll}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3 M16 3v3 M8 21v-3 M16 21v-3 M3 8h3 M21 8h-3 M3 16h3 M21 16h-3" />
            </svg>
          </button>
          <button className="bdc-icon-btn" title="Collapse all" aria-label="Collapse all layers" onClick={handleCollapseAll}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="2" rx="1" />
            </svg>
          </button>
          <button className="bdc-icon-btn" title="Display settings" aria-label="Layer display settings" aria-expanded={displaySettingsOpen} onClick={() => setDisplaySettingsOpen((v) => !v)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" />
            </svg>
          </button>
        </div>
      </div>

      <label className="bdc-psearch">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Find a layer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search layers"
        />
      </label>

      <div className="bdc-pbody bdc-pbody-scroll">
        {composer ? (
          <LayersPanel
            composer={composer}
            selectedElement={selectedElement}
            onLayerHover={handleLayerHover}
            canvasHoveredId={canvasHoveredId}
            onAddBlockClick={onAddBlockClick}
            search={search}
            displaySettingsOpen={displaySettingsOpen}
            onDisplaySettingsToggle={() => setDisplaySettingsOpen((v) => !v)}
          />
        ) : (
          <div className="bdc-layers-empty">
            <p>Loading layers…</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default LayersTab;
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: errors about `LayersPanel` missing the new props (`search`, `displaySettingsOpen`, `onDisplaySettingsToggle`). That is the next task's job.

### Task 4.2: Accept new props in `LayersPanel` and wire stats + event listeners

**Files:**
- Modify: `packages/editor/src/editor/panels/layers/index.tsx`
- Modify: `packages/editor/src/editor/panels/layers/types.ts` (extend `LayersPanelProps`)

- [ ] **Step 1: Extend `LayersPanelProps`**

Open `packages/editor/src/editor/panels/layers/types.ts`. Find the `LayersPanelProps` interface and add three new optional props:

```ts
  /** Controlled search value lifted to LayersTab (prototype panel-h shape). */
  search?: string;
  /** Lifted display-settings popover open state. */
  displaySettingsOpen?: boolean;
  /** Lifted display-settings popover toggle callback. */
  onDisplaySettingsToggle?: () => void;
```

- [ ] **Step 2: Use the controlled search prop inside `LayersPanel`**

In `packages/editor/src/editor/panels/layers/index.tsx`, inside the `LayersPanel` component, add:

```ts
  // Sync controlled search prop -> internal useLayerSearch state
  React.useEffect(() => {
    if (typeof search === "string" && search !== state.search) {
      state.setSearch(search);
    }
  }, [search, state]);
```

Place the effect directly after the existing `state` hook assignment (`const state = useLayersState({ composer, canvasHoveredId });`).

`state.search` and `state.setSearch` already exist via `useLayersState`.

- [ ] **Step 3: Add the 2 composer event listeners inside `LayersPanel`**

Add this `useEffect` near the existing `layers:scroll-to-selection` effect:

```ts
  // Expand/collapse-all from LayersTab
  React.useEffect(() => {
    if (!composer) return;
    const onExpand = () => state.treeHook.expandAll();
    const onCollapse = () => state.treeHook.collapseAll();
    composer.on("layers:expand-all", onExpand);
    composer.on("layers:collapse-all", onCollapse);
    return () => {
      composer.off("layers:expand-all", onExpand);
      composer.off("layers:collapse-all", onCollapse);
    };
  }, [composer, state.treeHook]);
```

- [ ] **Step 4: Emit `layers:stats-change`**

Add below the previous effect:

```ts
  // Emit stats to LayersTab
  const totalCount = state.treeHook.totalCount;
  const selectedCount = state.selectionHook.selectedIds.size;
  React.useEffect(() => {
    if (!composer) return;
    composer.emit("layers:stats-change", { total: totalCount, selected: selectedCount });
  }, [composer, totalCount, selectedCount]);
```

- [ ] **Step 5: Remove the internal header row + search bar JSX**

In `LayersPanel`'s return, delete the entire `<div className="buildrick-layers-search-row">…</div>` block (the one containing the expand/collapse icon buttons, search input, and gear). That block becomes ~80 lines lighter.

The gear-button-with-popover block that contains `<LayerDisplaySettings …>` stays as-is BUT moves to be rendered where the parent wants. Simplest change: keep `<LayerDisplaySettings>` inside `LayersPanel` but control its visibility from the `displaySettingsOpen` prop rather than local `state.displaySettingsOpen`:

Replace the existing rendering block (currently wrapped in the deleted header) with a standalone block near the tree container:

```tsx
      {displaySettingsOpen && (
        <LayerDisplaySettings
          prefs={state.displayPrefs}
          onChange={state.updateDisplayPrefs}
          onClose={() => onDisplaySettingsToggle?.()}
        />
      )}
```

Delete the now-unused `state.displaySettingsOpen` and `state.setDisplaySettingsOpen` references inside `LayersPanel`. The hook `useLayersState` still exposes them — leaving them unused is fine; do NOT edit the hook.

- [ ] **Step 6: Drop dead imports**

Remove `IconSearch, IconSettings` from the `shared/ui/Icons` import if they become unused after deleting the header row.

- [ ] **Step 7: Typecheck**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: exit 0.

### Task 4.3: Delete the 3 sync-banner tests + the 2 dead `PanelHeader` mocks

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/layers/__tests__/LayersTab.test.tsx:13-31,80-155`

- [ ] **Step 1: Delete both `vi.mock(...)` blocks for `PanelHeader`**

Find and delete:

```ts
vi.mock("@shared/ui/PanelHeader", () => ({ ... }));

vi.mock("@/editor/sidebar/shared/PanelHeader", () => ({ ... }));
```

Both full `vi.mock(...)` calls (lines 13–31 in the current file). `LayersTab` no longer imports `PanelHeader` / `PanelShell`, so the mocks are dead.

- [ ] **Step 2: Delete the `describe("LayersTab selection synced banner", …)` block**

Find the block starting at `describe("LayersTab selection synced banner", () => {` (around line 82) and delete the entire `describe(...)` call including all three inner `it(...)` tests and the `beforeEach`/`afterEach` they share. End of block is the matching closing `});` before the next `describe(...)`.

- [ ] **Step 3: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/sidebar/tabs/layers/__tests__/LayersTab.test.tsx
```

Expected: all green. `LayersTab (no composer)` tests still pass — `screen.getByText("Layers")` matches the new `<h2>Layers</h2>` in the rewritten component.

### Task 4.4: Typecheck + full test run + browser verify

- [ ] **Step 1: Typecheck**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 2: Full test run**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/panels/layers src/editor/sidebar/tabs/layers
```

Expected: all green.

- [ ] **Step 3: Browser verify**

With dev server running, verify:

1. Panel header shows single row: "Layers" title + "N nodes · N selected" sub + 3 icon buttons (expand-all, collapse-all, gear).
2. No pin / help / close buttons visible.
3. Search input below header filters tree as you type; clearing restores tree.
4. Expand-all button expands every group; collapse-all collapses every group.
5. Gear opens display-settings popover; toggling compact density compacts rows; persists on reload.
6. Clicking a layer in canvas highlights the corresponding row in the tree. No "Selection synced from canvas" banner ever appears — confirmed dropped.
7. Side-by-side with `file:///Users/shahg/Desktop/design-system/project/left-panel/tab-layers.html` at 280px width: header + search + first few tree rows visually indistinguishable.

### Task 4.5: Commit

- [ ] **Step 1: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git add packages/editor/src/editor/sidebar/tabs/layers/ packages/editor/src/editor/panels/layers/index.tsx packages/editor/src/editor/panels/layers/types.ts && git commit -m "$(cat <<'EOF'
feat(layers): lift header into LayersTab, drop PanelShell wrapper

LayersTab rewrite -- frame owner per prototype panel-h + psearch:
- Drop `PanelShell.Header` + pin/help/close buttons.
- Drop `selectionSynced` transient banner + `syncTimerRef` (spec §9).
- New DOM: <section .bdc-panel .bdc-layers> <.bdc-panel-h>
  (h2 + sub + 3 icon-btn) </> <label .bdc-psearch> <input> </label>
  <div .bdc-pbody.bdc-pbody-scroll> <LayersPanel/> </div>.
- Lift `search` + `displaySettingsOpen` into LayersTab local state.
- Subscribe to `layers:stats-change` for count sub text.
- Emit `layers:expand-all` / `layers:collapse-all` on button click.

LayersPanel additions (index.tsx only -- hooks untouched):
- Accept `search` / `displaySettingsOpen` / `onDisplaySettingsToggle`
  props (types.ts).
- useEffect syncs controlled `search` -> `state.setSearch`.
- 2 new composer listeners: `layers:expand-all` -> `treeHook.expandAll()`,
  `layers:collapse-all` -> `treeHook.collapseAll()`.
- Emit `layers:stats-change` when totalCount / selectedCount change.
- Delete internal 80-line search+header row block.

Tests (LayersTab.test.tsx):
- Delete 2 PanelHeader vi.mock blocks (dead after PanelShell drop).
- Delete `describe("LayersTab selection synced banner", …)` (banner
  removed).

4 of 5 atomic commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Commit 5: delete legacy `styles.ts` + `styles/layers.css`

Final cleanup. After commit 4 nothing in the Layers subtree imports from `styles.ts` or `styles/layers.css` except two constants (`SR_ONLY_STYLE`, `getDropFeedbackStyle`) still used by `LayersPanel/index.tsx`. Inline them into `layers-v2.css` and `index.tsx`, then delete the legacy files.

### Task 5.1: Inline the two remaining constants

**Files:**
- Modify: `packages/editor/src/editor/panels/layers/index.tsx`

- [ ] **Step 1: Replace `SR_ONLY_STYLE` with a className**

`SR_ONLY_STYLE` is a CSS object for screen-reader-only text. `layers-v2.css` already defines `.bdc-sr-only`. Find the JSX usage:

```tsx
<div aria-live="polite" aria-atomic="true" className="buildrick-sr-only" style={SR_ONLY_STYLE}>
```

Replace with:

```tsx
<div aria-live="polite" aria-atomic="true" className="bdc-sr-only">
```

Remove `SR_ONLY_STYLE` from the import at the top of the file.

- [ ] **Step 2: Replace `getDropFeedbackStyle(type)` call**

Find:

```tsx
{dropFeedback && (
  <div role="alert" aria-live="assertive" style={getDropFeedbackStyle(dropFeedback.type)}>
    <span aria-hidden>{dropFeedback.type === "error" ? "⚠️" : "ℹ️"}</span>
    {dropFeedback.message}
  </div>
)}
```

Replace with:

```tsx
{dropFeedback && (
  <div className="bdc-layers-drop-alert" role="alert" aria-live="assertive">
    <span aria-hidden>{dropFeedback.type === "error" ? "⚠️" : "ℹ️"}</span>
    {dropFeedback.message}
  </div>
)}
```

Remove `getDropFeedbackStyle` from the import.

The entire import line should now be:

```ts
// (delete the line entirely — nothing left to import from ./styles)
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: exit 0.

### Task 5.2: Delete legacy files

**Files:**
- Delete: `packages/editor/src/editor/panels/layers/styles.ts`
- Delete: `packages/editor/src/editor/panels/layers/styles/layers.css`

- [ ] **Step 1: Grep confirms no remaining imports**

```bash
grep -rn "from \"./styles\"\|from \"\./styles/layers\"\|styles\.ts\|styles/layers\.css" /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/panels/layers/ 2>&1
```

Expected: no matches (empty output) or only references inside the two files being deleted.

- [ ] **Step 2: Grep confirms no surviving `buildrick-layer*` or `--buildrick-*` references in Layers subtree**

```bash
grep -rn "buildrick-layer\|--buildrick-" /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/panels/layers/ /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/sidebar/tabs/layers/ 2>&1
```

Expected: no matches. If any hit remains, port it before deletion.

- [ ] **Step 3: Delete the files**

```bash
rm /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/panels/layers/styles.ts
rm /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/panels/layers/styles/layers.css
```

- [ ] **Step 4: Typecheck**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 5: Full test run**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/panels/layers src/editor/sidebar/tabs/layers
```

Expected: all green.

- [ ] **Step 6: Production build smoke check**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vite build
```

Expected: build succeeds, `dist/` populated. Any missing-module error → a stray import to the deleted files; fix before continuing.

- [ ] **Step 7: Browser verify final**

With dev server running, do a final walkthrough of all 13 invariants from spec §9:

1. Click row → canvas highlight + inspector opens.
2. Shift-click → multi-select banner.
3. Eye → hide/show on canvas; row fades + italic.
4. Lock → warning icon; drop-into-locked shows red drop alert.
5. Double-click → rename input; Enter commits, Esc cancels.
6. Search → filters tree, ancestors auto-expand.
7. Chevron / Alt+←→ → expand/collapse.
8. Drag → cobalt indicators before/after/inside, reorder works.
9. Right-click → context menu, all 11 actions work.
10. Canvas click → tree scrolls + ancestors expand.
11. Gear → display-settings popover; compact toggle; persists.
12. Empty project → empty state CTA.
13. Arrow / Space / F2 / Del → keyboard nav works.

### Task 5.3: Commit

- [ ] **Step 1: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git add -A packages/editor/src/editor/panels/layers/ && git commit -m "$(cat <<'EOF'
chore(layers): delete legacy layers.css and styles.ts

Final cleanup of the prototype port:
- Inline SR_ONLY_STYLE usage -> .bdc-sr-only class.
- Inline getDropFeedbackStyle() call -> .bdc-layers-drop-alert class.
- Delete packages/editor/src/editor/panels/layers/styles.ts.
- Delete packages/editor/src/editor/panels/layers/styles/layers.css.

Zero remaining --buildrick-* token references or .buildrick-layer*
classnames inside the Layers subtree. Dead legacy selectors in
themes/components.css + themes/ux-fixes.css are explicit out of
scope (spec §12) and will be swept in a future cross-tab spec.

5 of 5 atomic commits. Port complete.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Post-port verification

After commit 5 lands, run once more end-to-end:

1. `cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit` — exit 0.
2. `cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run` — full test suite green.
3. `cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vite build` — production build green.
4. Side-by-side visual diff of the Layers tab against `file:///Users/shahg/Desktop/design-system/project/left-panel/tab-layers.html` at 280 px panel width. Target ≥90% visual match.
5. Confirm three downstream TODOS.md items are now unblocked:
   - Playwright visual regression infra
   - CI grep rule for banned indigo/violet hex
   - Post-migration hardcoded indigo audit

Nothing else runs as part of this spec.

---

## Self-review notes

- **Spec coverage.** Each spec section maps to at least one task: §4 file map → Task 0–5 roster; §5 tokens → Task 1.1 CSS; §6 state lift → Task 4.1–4.2; §7 tree row → Task 2.2; §8 sub-components → Task 3.1–3.6; §9 logic contract → invariants verified in Task 5.2 step 7; §10 rollout → phases 0–5; §11 risk register → called out in task-level verifications.
- **Placeholder scan.** No "TBD", "implement later", or "similar to Task N" wording. Every code block is concrete.
- **Type consistency.** Event names consistent: `layers:expand-all`, `layers:collapse-all`, `layers:stats-change` used identically in Task 4.1 (emitter) and Task 4.2 (listener). Prop names `search` / `displaySettingsOpen` / `onDisplaySettingsToggle` declared in Task 4.2 step 1 match usage in Task 4.1 step 1.
- **Test-sync discipline.** Phase 3 updates `LayerSelectionBanner` tests in the same commit as the JSX change. Phase 4 deletes banner tests in the same commit as banner removal. Green at every commit.
