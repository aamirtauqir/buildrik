# Media Replace-Across (S21) — Implementation Plan

**Date:** 2026-05-08
**Source:** prototype-v3.html §21
**CEO plan ref:** P8 (replace-across diff preview)
**Goal:** Per-page selectable bulk asset replacement. Reuses P6 foundation just shipped (S9 §9 hook pattern).

**Tech:** vibcoder Modal compound + per-page checkbox list. Engine: extend MediaCommandLayer with per-page selective replace.

---

## Inventory

- `composer.mediaOps.replaceAcross(oldSrc, newSrc)` exists (transactional, all-or-nothing)
- `composer.mediaOps.getUsages(src)` returns flat `{count, elements}` (cross-page)
- `composer.elements.findByMediaSrc(src)` walks `elements.values()` flat Map
- Element has no `pageId` — must walk each page's tree via `page.root` + `getAllDescendants`
- `composer.elements.getAllPages()` returns PageData[]
- Existing engine event: MEDIA_EVENTS.REPLACE_COMMITTED / REPLACE_PARTIAL

---

## File Structure

**Create:**
- `packages/editor/src/engine/media/MediaUsageHelpers.ts` — pure helper for per-page traversal
- `packages/editor/src/editor/media/components/ReplaceAcrossModal.tsx` — UI
- `packages/editor/src/editor/media/components/__tests__/ReplaceAcrossModal.test.tsx` — UI tests
- `packages/editor/src/engine/media/__tests__/MediaCommandLayer.replaceAcrossSelective.test.ts` — engine tests

**Modify:**
- `packages/editor/src/engine/media/MediaCommandLayer.ts` — add `getUsagesByPage` + `replaceAcrossSelective`

---

## Task 1: Engine — getUsagesByPage + replaceAcrossSelective

### Step 1.1 — Add getUsagesByPage method

```ts
/**
 * S21 — Group usage by page. Walks each page's element tree (root +
 * descendants) so the result keys cleanly by pageId. Returns an empty
 * map when src is empty / unmatched.
 */
getUsagesByPage(src: string): Map<string, Element[]> {
  const out = new Map<string, Element[]>();
  if (!src) return out;
  const pages = this.composer.elements.getAllPages?.() ?? [];
  for (const page of pages) {
    const root = this.composer.elements.get?.(page.root.id);
    if (!root) continue;
    const tree = [root, ...this.composer.elements.getAllDescendants(root)];
    const matches = tree.filter((el) => {
      const elSrc = el.getAttribute?.("src");
      if (elSrc === src) return true;
      const bg = el.getStyle?.("background-image");
      return Boolean(bg && bg.includes(src));
    });
    if (matches.length > 0) out.set(page.id, matches);
  }
  return out;
}
```

### Step 1.2 — Add replaceAcrossSelective

```ts
/**
 * S21 — replaceAcross variant that only touches a chosen subset of
 * pageIds. Same transactional + partial-success semantics as
 * replaceAcross. Pages not in pageIds are skipped silently.
 */
replaceAcrossSelective(
  oldSrc: string,
  newSrc: string,
  pageIds: ReadonlyArray<string>
): ReplaceAcrossResult {
  const byPage = this.getUsagesByPage(oldSrc);
  const targetSet = new Set(pageIds);
  const elements: Element[] = [];
  for (const [pageId, pageElements] of byPage) {
    if (targetSet.has(pageId)) elements.push(...pageElements);
  }
  // Reuse the existing replaceAcross implementation contract by
  // delegating directly to the same logic on the filtered set. The
  // transactional + event-emit code paths are identical.
  return this.runReplaceBatch(oldSrc, newSrc, elements);
}
```

Refactor existing `replaceAcross` to call a new private `runReplaceBatch` (transaction logic shared between the two).

### Step 1.3 — Tests

```ts
// MediaCommandLayer.replaceAcrossSelective.test.ts
describe("replaceAcrossSelective", () => {
  it("only replaces elements whose page is in the selection set");
  it("returns clean=true when partial subset replaces succeed");
  it("rolls back when the entire chosen subset fails");
  it("getUsagesByPage groups one entry per page with matching elements");
  it("getUsagesByPage handles background-image url() match");
});
```

### Step 1.4 — Commit

```bash
git add packages/editor/src/engine/media/MediaCommandLayer.ts packages/editor/src/engine/media/__tests__/
git commit -m "feat(media-s21): MediaCommandLayer.getUsagesByPage + replaceAcrossSelective"
```

---

## Task 2: UI — ReplaceAcrossModal

### Step 2.1 — Test (TDD)

States to cover:
- Renders nothing when not open
- Header shows old asset name + count of pages
- Per-page row list with checkbox, before/after thumbs, place count
- Default selection: all matching pages checked
- Unchecking row dims it + removes from count
- Footer "Replace on N pages" updates with selection
- Cancel calls onOpenChange(false)
- Confirm calls onConfirm with selected pageIds

### Step 2.2 — Implement

Modal compound from `@/editor/shared/vibcoder`. Layout:
- Header: title + subtitle ("Used in N pages · review before applying") + close button
- Replacing/With strip: two 56×56 thumbs separated by → arrow
- Per-page list: checkbox + before/after thumb pair + page name + place count
- Footer: count text + Cancel + primary Confirm

### Step 2.3 — Commit

---

## Task 3: Wiring — invoke from media library asset detail

Existing `AssetDetailsPanel.tsx` has actions area. Add "Replace across pages" button that opens ReplaceAcrossModal preloaded with current asset src + a target asset picker (Phase 1: simple file picker + prompt for new src OR pre-supplied `replacementSrc`).

Phase 1 trigger: button shown when `usageMap.has(src) && getUsagesByPage(src).size > 0`. Picker uses native file input; uploads via existing media upload path; on success, invokes `replaceAcrossSelective(oldSrc, uploadedNewSrc, selectedPageIds)`.

Out of scope for this slice: dragging an existing asset into the "with" slot (Phase 2 polish).

---

## Self-review

- ☐ Per-page granularity: yes, via getUsagesByPage walking each page tree
- ☐ Transactional: replaceAcrossSelective reuses runReplaceBatch
- ☐ TDD: engine tests + UI tests written before implementation
- ☐ Reuse over rebuild: P6 hook pattern shared with §9
- ☐ Soft-deprecation respected: no TemplateManager touches; no asset-side deprecations
