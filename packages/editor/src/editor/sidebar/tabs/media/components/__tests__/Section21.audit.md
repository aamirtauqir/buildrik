# §21 ReplaceAcrossDialog audit (prototype-v3 §21)

## Prototype intent
- Per-page diff: thumbs of before / after grouped by page where asset is used
- Per-page checkbox: user opts in/out of replacement per page
- Live count: "Replace N uses on M pages"
- Commit only selected pages

## Current state (ReplaceAcrossDialog.tsx, 229 LOC)

### Preview phase — SHIPPED but ASSET-LEVEL ONLY
- Single before/after thumb pair (lines 96-108) — global, not per page
- Total usageCount via `composer.mediaOps.getUsages(oldSrc).count` (line 50)
- Commit button shows total count, no per-page breakdown

### Commit — SHIPPED via `replaceAcross(oldSrc, newSrc)`
- Replaces ALL uses, no opt-out

### Result phase — SHIPPED
- Replaced count, retry failed, clean state handling

## Engine surface — READY for selective replace
- `composer.mediaOps.getUsagesByPage(oldSrc)` → `Map<pageId, Element[]>`
- `composer.mediaOps.replaceAcrossSelective(oldSrc, newSrc, pageIds[])` → same ReplaceAcrossResult
- `composer.elements.getAllPages()` → PageData[] with id + name

## Gaps

- **Per-page diff thumbnails:** MISSING
- **Per-page checkbox:** MISSING
- **Live count update (uses + pages):** PARTIAL — total only

## Implementation hints

- Replace single before/after with a per-page list
- Each row: page name + use count + checkbox + small before/after thumb pair
- Default: all pages checked
- Commit button: "Replace N uses on M pages" updates live based on selection
- Disabled when no pages selected
- Commit via `composer.mediaOps.replaceAcrossSelective(oldSrc, newSrc, selectedPageIds)`

## Plan tasks mapping

- Task 65 (audit): this doc
- Tasks 66-68 (3 implementation tasks): collapse to single rewrite of preview phase
