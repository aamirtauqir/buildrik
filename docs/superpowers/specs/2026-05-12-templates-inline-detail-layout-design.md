# Templates Inline Detail Layout — Design Spec

**Date:** 2026-05-12
**Status:** Approved
**Scope:** `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.{tsx,css}`
**Author:** Brainstorm session with Daisy

---

## Problem

When user clicks any template card in the Templates fullpage tab, the detail
content opens as a full-width block that **replaces** the grid, instead of
rendering **beside** the grid as a 2-column split. This does not match
prototype-v3 §2.

### Current behavior (bug)

- Click card → grid hidden via `display: none`
- Detail panel takes full container width
- Header swaps title for "‹ Back to grid › Category" breadcrumb
- A separate in-panel breadcrumb (added earlier this session) also renders
  inside `TemplateDetail`, creating **two breadcrumbs**

### Expected behavior (prototype-v3 §2)

- Click card → layout splits 50/50
- Grid stays visible on left, detail panel appears on right
- Each column scrolls independently — detail card stays "sticky" while grid
  scrolls
- Header always shows "Templates" (no breadcrumb)
- Breadcrumb lives **inside** the detail card top (`‹ Back  Category › Name  ✕`)
- Action buttons in detail: `Apply to current page (PageName)` +
  `Add as new page` + `Preview full-screen`
- Preview button opens existing full-screen modal (Section 3) — unchanged

---

## Architecture

Two files touched. Layout restructure + CSS cleanup. Zero changes to any
component except `TemplatesTab.tsx` + `TemplatesTab.css`.

### Files

| File | Change |
|---|---|
| `TemplatesTab.tsx` | Remove header breadcrumb JSX; rename wrapper class; pull `TemplateUsageDrawer` outside layout wrapper |
| `TemplatesTab.css` | Add `.tpl-detail-layout` family; delete `.tpl-content-inner--with-detail`, `.tpl-grid-area--dimmed` rules |

### Files explicitly NOT touched

- `TemplateDetail.tsx` — already has correct in-panel breadcrumb + meta pills + action buttons + info note (shipped earlier this session)
- `TemplatePreviewModal.tsx` — Section 3 modal already works
- `TemplatesTabModals.tsx` — Replace/Pro/Create modals untouched
- `TemplateUsageDrawer.tsx` — content unchanged (mount location moves only)
- `TemplateCard.tsx` — unchanged
- All `hooks/`, `utils/` under templates folder — unchanged

---

## Component design

### 1. Header simplification

**File:** `TemplatesTab.tsx` (~lines 248-289)

Remove the conditional breadcrumb branch. Header renders one of two things only:

- New-page mode: `<div className="tpl-newpage-header">...</div>`
- Default: `<h2 className="tpl-header-title">Templates</h2>`

Detail mode no longer modifies the header. Breadcrumb lives inside
`TemplateDetail` only.

### 2. Content wrapper restructure

**File:** `TemplatesTab.tsx` (~lines 378-409)

Replace the conditional class concat pattern with a single `.tpl-detail-layout`
wrapper whose CSS modifier toggles single-column vs split layout:

```jsx
<div className={`tpl-detail-layout${detailTemplate ? " tpl-detail-layout--split" : ""}`}>
  <div className="tpl-grid-area">
    {sel.searchQ.trim() && (
      <div className="tpl-search-results-count">{...}</div>
    )}
    <div className="tpl-grid">{...cards}</div>
  </div>
  {detailTemplate && (
    <TemplateDetail
      template={detailTemplate}
      onApplyToCurrent={handleApplyToCurrent}
      onAddAsNewPage={handleAddAsNewPage}
      onPreview={(id) => sel.setPreviewId(id)}
      onCancel={() => sel.setDetailId(null)}
      usageCount={detailUsage.length}
      onShowUsage={() => setUsageDrawerOpen(true)}
      currentPageName={activePageInfo?.name}
      appliedToCurrentPage={detailAppliedToCurrent}
    />
  )}
</div>
{detailTemplate && (
  <TemplateUsageDrawer
    open={usageDrawerOpen}
    onOpenChange={setUsageDrawerOpen}
    templateId={detailTemplate.id}
    templateName={detailTemplate.name}
    usage={detailUsage}
    onJumpToPage={handleJumpToPage}
    currentVersion={detailTemplate.version ?? DEFAULT_TEMPLATE_VERSION}
    onOpenPreview={() => {
      setUsageDrawerOpen(false);
      sel.setPreviewId(detailTemplate.id);
    }}
  />
)}
```

Key changes:
- Wrapper renamed `tpl-content-inner` → `tpl-detail-layout` (B2 pattern:
  always-present wrapper, CSS modifier toggles split).
- `tpl-grid-area--dimmed` class no longer applied. Grid stays bright +
  clickable in detail mode.
- `TemplateUsageDrawer` rendered as a sibling of the layout wrapper, not a
  child — it's a portal/overlay, doesn't belong inside the 2-col flow.

### 3. CSS — new layout family

**File:** `TemplatesTab.css`

Add this block (replacing the deleted rules from section 4 below):

```css
/* ── Detail layout: single-column default, 2-col in split mode (prototype-v3 §2) ── */
.tpl-detail-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.tpl-detail-layout > .tpl-grid-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.tpl-detail-layout--split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--bd-space-4);
  padding: var(--bd-space-4);
  overflow: hidden;
}
.tpl-detail-layout--split > .tpl-grid-area {
  padding: 0;
  overflow-y: auto;
  min-height: 0;
}
.tpl-detail-layout--split > .tpl-detail {
  overflow-y: auto;
  min-height: 0;
  align-self: stretch;
}
```

Independent column scroll mechanism: parent `overflow: hidden` kills the
parent scrollbar, each child gets its own scroll via `overflow-y: auto`.
The `min-height: 0` on flex/grid children is required or CSS computes the
intrinsic content height instead of honoring the parent's height — known
flex-item overflow gotcha.

### 4. CSS — deletions (cleanup)

**File:** `TemplatesTab.css`

Delete these rules (currently lines 182-208):

```css
/* DELETE: */
.tpl-content-inner {
  display: flex;
  height: 100%;
}
.tpl-content-inner--with-detail {
  padding: var(--bd-space-4);
}
.tpl-content-inner--with-detail .tpl-grid-area {
  display: none;
}
.tpl-content-inner--with-detail .tpl-detail {
  width: 100%;
  max-width: 100%;
}
.tpl-grid-area--dimmed {
  opacity: 0.4;
  pointer-events: none;
  padding: 0;
}
```

Keep `.tpl-grid-area` base rule (still used as flex/grid child); only the
`--dimmed` modifier is deleted.

---

## Data flow

Unchanged. `sel.detailId` from `useTemplateSelection` drives detail visibility.
Card `onClick` calls `sel.setDetailId(...)`. State logic and event channels
untouched.

---

## Error handling

Empty state path (`sel.filteredTemplates.length === 0`) is unchanged — renders
before the `.tpl-detail-layout` wrapper. No new error paths introduced.

---

## Edge cases

| Case | Behavior |
|---|---|
| Window narrows to <720px | 50/50 split makes detail card cramped. Acceptable — Buildrik editor is desktop-only per CLAUDE.md, minimum viable 1280px viewport leaves 610px per column. |
| User clicks card while detail open | `setDetailId` switches detail content. `TemplateDetail` doesn't unmount/remount, only the `template` prop changes. Smooth swap. |
| Click same card again | Existing toggle: `sel.setDetailId(sel.detailId === id ? null : id)`. Detail collapses, grid expands to full width via `.tpl-detail-layout` (non-split) styles. |
| Pagination footer | Lives outside `.tpl-detail-layout` (already does, no change). |
| New-page mode + detail panel | Both can be active. Grid+detail split applies; header shows "Choose a template..." regardless. |
| Search query active in detail mode | `tpl-search-results-count` row renders inside grid column (already does). No change. |

---

## Testing

### Existing tests

160 templates tests should pass unchanged. The selectors they reference
(`.tpl-card`, `.tpl-detail-title`, `.tpl-detail-btn--primary`, etc.) all
survive. The classes being deleted (`.tpl-content-inner--with-detail`,
`.tpl-grid-area--dimmed`) are not referenced in any test file — verified via
grep before this design.

### New tests (optional, may defer to plan phase)

- `tpl-detail-layout--split` class is applied when `sel.detailId` is truthy
- `tpl-grid-area` remains in the DOM (not removed) when detail is open —
  regression guard against the `display: none` bug returning
- Header element does not contain `tpl-breadcrumb` class when detail is open

---

## Scope explicitly NOT in this design

| Excluded | Reason |
|---|---|
| Slide-in animation for detail card | DESIGN.md mandates minimal motion. `grid-template-columns` transitions have poor Safari support. Animation requires reduced-motion fallback. YAGNI for a layout bug fix. |
| Resizable column splitter | Prototype shows fixed 50/50. No existing splitter primitive in vibcoder layer. Accessibility (keyboard nudge, ARIA `role="separator"`) is a tarpit. No user demand. |
| Responsive single-column collapse | Editor is desktop-only (CLAUDE.md). Minimum viable viewport (1280px) leaves comfortable column widths. Container queries would be net-new pattern for Buildrik. |
| Changes to other template components | TemplateDetail/PreviewModal/Modals/UsageDrawer/Card are already prototype-aligned from prior sessions. Scope discipline locks blast radius. |

Each cut is a future backlog item, not a deleted idea. If product demand
emerges, file a separate brainstorm spec for that scope.

---

## Implementation outline (for writing-plans handoff)

1. Edit `TemplatesTab.tsx` header — remove the conditional breadcrumb branch
2. Edit `TemplatesTab.tsx` content wrapper — rename class, drop dimmed modifier, move drawer outside wrapper
3. Edit `TemplatesTab.css` — add `.tpl-detail-layout` family rules
4. Edit `TemplatesTab.css` — delete `.tpl-content-inner*` and `.tpl-grid-area--dimmed` rules
5. Run vitest on templates folder — confirm 160 tests pass
6. Run `npx tsc --noEmit` — confirm zero TS errors in touched files
7. Manual verify in browser at http://localhost:5050/ — click a template card, confirm 50/50 split, independent scroll, single in-panel breadcrumb
8. Commit

---

## Approval

- Approach: B (structural 2-col wrapper) — locked
- Width split: 50/50 fluid — locked
- Scroll: independent column scroll (detail sticky, grid scrolls) — locked
- Breadcrumb: in-panel only (header breadcrumb removed) — locked
- Scope cuts: 4 items excluded, documented above — locked
