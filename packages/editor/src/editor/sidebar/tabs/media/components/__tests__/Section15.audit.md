# §15 AssetDetailOverlay audit (prototype-v3 §15)

## Prototype intent

Drawer with 5 tabs + footer:
1. Preview — full-size thumb + name input + Size/Dimensions/Type/Added metadata rows
2. Where used — list elements using this asset on current page
3. Versions — sibling LibraryItems sharing base-name; "Restore" via click-to-open
4. Edit — rename + **alt-text** + (tags) inputs (and image-editor launch for images)
5. Optimize — compress/convert inline (§18)
6. Footer — Add to page · **Replace** · Delete

## Current state (AssetDetailOverlay.tsx, 351 LOC)

### Tab structure
- All 5 tabs present and switchable via `setTab(<id>)`
- Tab order in JSX: `preview` / `used` / `versions` / `edit` / `optimize`
- Visibility:
  - `showEdit = item.type === "img" && !!onEditImage` — Edit hidden for non-images
  - Optimize image-only via similar guard
  - Preview / used / versions always shown

### Preview tab — SHIPPED
- File name input with rename-commit on Enter/blur (`AssetDetailOverlay.tsx:220-232`)
- Metadata rows: Size · Dimensions · Duration · Type · Added (lines 233-258)
- Thumb image rendered above input via existing template (not shown in grep)
- Gap: NONE

### Where used tab — SHIPPED
- `usedElements` computed via `composer.elements.findByMediaSrc(item.src)` (lines 75-77)
- Renders `<ul>` of element rows with type label + id (lines 262-278)
- Empty state "Not used on this page yet" (line 264)
- Gap: NONE (single-page scope is intentional per code comment)

### Versions tab — SHIPPED
- Sibling LibraryItems matched by stripped base-name (lines 85+, derived `versions`)
- Click row to open as detail item via `onOpenItem?.(v)` (line 291)
- Current row disabled + "current" badge (lines 290-298)
- Empty state "No prior versions" (line 283)
- Gap: NONE

### Edit tab — PARTIAL (alt-text + tags missing per plan)
- Image-only tab (line 144 `showEdit` guard)
- Content: blurb + "Open image editor…" button delegating to `onEditImage` (lines 305-310)
- Plan Task 35: "Edit tab — rename + tags + alt-text inputs"
- Rename already lives in Preview (input above metadata). Move-or-duplicate decision: keep Preview rename; add alt-text input to Edit tab.
- Tags: `LibraryItem` type at `mediaTypes.ts:43-66` has NO `tags` field. Engine schema extension required. **OUT OF SCOPE for Phase 6.** Defer to future schema arc.
- Gap (in-scope): add altText input + "Open image editor…" continues to launch ImageEditorModal.

### Optimize tab — SHIPPED
- Embeds `<OptimizationPanel>` inline (folded from §18 standalone modal per file header comment)
- Image-only
- Gap: NONE

### Footer — PARTIAL (Replace missing)
- Lines 331-348: shown when `tab !== "edit" && tab !== "optimize"` (those have inline CTAs)
- Buttons: "Add to page" (primary) · "Delete" (danger)
- Plan calls for footer Replace too (Task 37). Existing engine path: `onReplaceAcross?(item)` callback (line 36 ExpandedMediaPanel passes this; ConfirmAssetDetailOverlay receives via prop)
- Wait — AssetDetailOverlay does NOT currently accept onReplaceAcross. Need to add prop + button.
- Gap: add Replace button between Add-to-page and Delete; wire to onReplaceAcross prop (caller-supplied).

## Gaps

- **Task 32** (Preview): SHIPPED → skip
- **Task 33** (Where used): SHIPPED → skip
- **Task 34** (Versions): SHIPPED → skip
- **Task 35** (Edit alt-text): MISSING — implement. Tags deferred.
- **Task 36** (Optimize): SHIPPED → skip
- **Task 37** (Footer Replace): MISSING — implement.

**Net work:** Tasks 35 + 37 only. Plan over-scoped vs shipped reality.

## Implementation hints

- `state.updateItem(key, updates: Partial<LibraryItem>)` handles altText (see `useLibraryState.ts:209-217`)
- `onReplaceAcross` prop already exists on ExpandedMediaPanel level — thread through to AssetDetailOverlay
- For Replace footer button: trigger file input → on file selected → call `onReplaceAcross(item)` with the new file (matches MediaContextMenu pattern at `MediaContextMenu.tsx:81-88`)
