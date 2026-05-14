# §16 MediaContextMenu audit (prototype-v3 §16)

## Prototype intent

Right-click menu organized into 4 logical groups separated by dividers:
1. **Primary actions** — Insert · Edit image · (Replace across)
2. **Organize** — Select · Rename · Move to ▸
3. **Copy** — Copy URL · Copy alt-text
4. **Danger** — Delete

Move submenu: nested folder picker showing parent / child hierarchy.

## Current state (MediaContextMenu.tsx, 152 LOC)

### Item order (top → bottom)
1. Select (line 73) — enters multi-select mode w/ item pre-selected
2. Rename (line 76)
3. Edit image (line 80) — img only
4. Copy URL (line 84)
5. Replace across pages (line 87) — img/vid + onReplaceAcross
6. Copy alt text (line 96) — img + altText non-empty
7. Move to ▸ submenu (line 112) — flat list of folders, root entry "(Root)"
8. SEPARATOR (line 141)
9. Delete (line 142) — danger styling

### Groups
- Current: 1 separator total (before Delete)
- Plan calls for 3 separators (between 4 groups)

### Missing items
- **Insert** — no Add-to-canvas entry exists on the menu. Plan calls for it as Group 1 primary action.

### Move submenu
- Uses `folders` prop (not `allFolders`) — per Phase 4 audit `composer.media.getFolders()` returns roots only
- Renders FLAT list — no depth indentation, no nested hierarchy
- Plan calls for "nested folder picker"

## Gaps

- **Task 39 (reorder groups):** REQUIRED — move items into 4-group layout w/ 3 separators
- **Task 40 (Insert action):** REQUIRED — add Insert menuitem to Group 1; new `onInsert` prop; wired at 3 mount sites to state.insertToCanvas
- **Task 41 (nested move submenu):** REQUIRED — accept `allFolders` instead of `folders`; render with depth-based indentation (parentId chain walked to compute depth)
- **Task 42 (live verify):** test-only close acceptable per Phase 2 precedent

## Target final order

```
[Group 1 — primary]
  Insert                          (always)
  Edit image                      (img only)
  Replace across pages…           (img/vid + onReplaceAcross)
[separator]
[Group 2 — organize]
  Select                          (always)
  Rename                          (always)
  Move to ▸                       (always; submenu w/ allFolders indented)
[separator]
[Group 3 — copy]
  Copy URL                        (always)
  Copy alt text                   (img + altText)
[separator]
[Group 4 — danger]
  Delete                          (always)
```

## Implementation hints

- Use `<div className="med-ctx-sep" role="separator" />` per existing pattern at line 141
- New `onInsert` prop signature: `onInsert(item: LibraryItem): void`
- 3 mount sites: MediaTab.tsx, ExpandedMediaPanel.tsx, LibraryManager.tsx
- For nested move submenu: walk `parentId` chain on each folder to compute depth; render with `paddingLeft: depth * 12 + 8` or similar
- Switch submenu prop from `folders` to `allFolders` — same prop name allowed; just swap data source at mount sites
