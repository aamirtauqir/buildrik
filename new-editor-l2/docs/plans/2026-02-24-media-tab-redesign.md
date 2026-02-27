# Media Tab Redesign — Design Document

**Date:** 2026-02-24
**Status:** Approved
**Reference:** `Downloads/media_tab_v20.html` (HTML prototype)
**Replaces:** `src/editor/sidebar/tabs/media/` (old 12-file implementation)

---

## 1. Problem Statement

The existing MediaTab has a single-view architecture (4 sub-tabs: Images / Videos / Docs / Fonts) with no discovery of stock media. The new design introduces a two-view mental model:

- **My Library** — user's uploaded files (images, videos, icons, fonts)
- **Discovery** — browse free stock media (Unsplash photos, Pexels videos, built-in icons, Google Fonts)

Type filter pills are shared between both views but behave differently:

- In Library: filter which asset type section is visible
- In Discovery: toggle which stock section is shown

---

## 2. Design Decisions

### Why Full Replace (not extend)

The new architecture is structurally incompatible with the old. The old design's `MediaSubTabs` component (the 4 top tabs) is replaced entirely by the `SourceBar` (My Library / Discovery) + `TypePills` pattern. Keeping old files would create dead code, competing state hooks, and naming confusion.

### Why Flat Module (not over-componentized)

The user explicitly flagged these anti-patterns to avoid:

- Pass-through wrapper functions
- Middle-man classes
- Over-fragmented flow
- High coupling / low cohesion

Splitting `LibraryView` into `MediaGrid` + `VideoGrid` + `IconGrid` + `FontList` + ... creates pass-through wrappers where each file just re-passes props downward. Instead, `LibraryView.tsx` renders all type sections inline — each section is a function inside the file, not a standalone component, until the file approaches 500 lines.

### Why Single State Hook (no SSOT violations)

All state lives in `useMediaState`. Child components receive typed prop subsets. No child calls `composer.media` directly. This preserves the SSOT contract from `CLAUDE.md`:

> Components MUST NOT hold authoritative state. Mutations MUST go through Composer managers.

---

## 3. Folder Structure (Approach A — Flat Module)

```
src/editor/sidebar/tabs/media/          ← replaces existing 12-file folder
  MediaTab.tsx        ~180 lines        Shell: 5 fixed zones, composes children
  useMediaState.ts    ~280 lines        SSOT state hook (ALL state + actions)
  LibraryView.tsx     ~280 lines        My Library view (all 4 type sections)
  DiscoveryView.tsx   ~280 lines        Discovery view (Photos/Videos/Icons/Fonts)
  TypePills.tsx        ~60 lines        Shared type filter (extracted: shared by both views)
  UploadZone.tsx       ~80 lines        Upload button + storage bar (visible in Library only)
  mediaTypes.ts        ~80 lines        TypeScript interfaces
  mediaData.ts         ~80 lines        Static data (font list, icon library, tips, labels)
  mediaUtils.ts        ~40 lines        Pure helpers: fmtSize, fmtDur, extStyle
  media.css           ~380 lines        All styles (--aqb-* + --media-* vars only)
  index.ts             ~15 lines        Barrel export
```

**11 files total. Max ~280 lines each. No file exceeds 500 lines.**

---

## 4. Data Flow

```
composer.media (engine SSOT)
    │
    ├── getAssets({ type, search })     My Library items
    ├── uploadFile(file)                Upload
    ├── deleteAsset(id)
    ├── updateAsset(id, updates)
    ├── searchStock(type, query)        NEW stub → Discovery photos/videos
    ├── getIcons(category)              NEW stub → Discovery icons
    └── getFonts(query)                 NEW stub → Discovery fonts
         │
         ▼
    useMediaState(composer)             SSOT for ALL UI state
    Subscribes to: MEDIA_EVENTS.*
    Returns: MediaStateResult (typed interface)
         │
         ▼ (typed prop slices — no raw passthrough)
    MediaTab.tsx                        Shell: zones + navigation state
    ├── PanelHeader                     shared component (pin/help/close)
    ├── SourceBar (inline)              My Library | Discovery buttons
    ├── TypePills                       All | Images | Videos | Icons | Fonts
    ├── LibraryView (if source=mine)    receives LibraryViewProps slice only
    ├── DiscoveryView (if source=disc)  receives DiscoveryViewProps slice only
    ├── UploadZone (if source=mine)     Upload + storage (hidden in Discovery)
    └── Tip footer (inline)             dismissible tips
```

---

## 5. State Model (`useMediaState` interface)

```typescript
interface MediaStateResult {
  // Navigation
  source: "mine" | "disc";
  activeType: "all" | "img" | "vid" | "ico" | "fnt";
  setSource: (src: "mine" | "disc") => void;
  setType: (t: "all" | "img" | "vid" | "ico" | "fnt") => void;

  // Library
  libraryItems: LibraryItem[];
  uploadQueue: UploadProgress[];
  counts: TypeCounts; // { all, img, vid, ico, fnt }
  sort: MediaSortBy;
  sortDir: SortDirection;
  gridN: 2 | 3 | 4;
  fmtFilter: string;
  selMode: boolean;
  selectedKeys: Set<string>;
  setSort(by: MediaSortBy, dir: SortDirection): void;
  setGridN(n: 2 | 3 | 4): void;
  setFmtFilter(f: string): void;
  toggleSelMode(): void;
  toggleSelect(key: string): void;
  selectAll(): void;
  upload(files: File[]): void;
  deleteItem(key: string): void;
  bulkDelete(): void;
  insertToCanvas(key: string): void;
  renameItem(key: string, name: string): void;

  // Discovery
  stockPhotos: StockPhoto[];
  stockVideos: StockVideo[];
  discIcons: DiscIcon[];
  discFonts: DiscFont[];
  discLoading: Record<"img" | "vid" | "ico" | "fnt", boolean>;
  discSearchAll(query: string): void;
  loadMoreDisc(type: "img" | "vid"): void;
  saveToLibrary(type: "img" | "vid", item: StockPhoto | StockVideo): void;

  // Shared
  searchQuery: string;
  setSearch(q: string): void;
  storage: { used: number; total: number };

  // Overlays
  ctxMenu: CtxMenuState | null;
  openCtxMenu(e: React.MouseEvent, item: LibraryItem): void;
  closeCtxMenu(): void;
  detailItem: LibraryItem | null;
  openDetail(item: LibraryItem): void;
  closeDetail(): void;

  // Tips
  tipIdx: number;
  tipDismissed: boolean;
  dismissTips(): void;
}
```

---

## 6. Component Props (typed slices)

```typescript
// TypePills.tsx
interface TypePillsProps {
  activeType: MediaTypeFilter;
  counts: TypeCounts; // hidden in Discovery via CSS .disc-mode class
  discMode: boolean;
  onTypeChange(t: MediaTypeFilter): void;
}

// LibraryView.tsx
interface LibraryViewProps {
  items: LibraryItem[];
  uploadQueue: UploadProgress[];
  activeType: MediaTypeFilter;
  counts: TypeCounts;
  sort: MediaSortBy;
  sortDir: SortDirection;
  gridN: 2 | 3 | 4;
  fmtFilter: string;
  selMode: boolean;
  selectedKeys: Set<string>;
  searchQuery: string;
  onSort(by: MediaSortBy, dir: SortDirection): void;
  onGridN(n: 2 | 3 | 4): void;
  onFmt(f: string): void;
  onSelToggle(): void;
  onSelect(key: string): void;
  onSelectAll(): void;
  onBulkDelete(): void;
  onDelete(key: string): void;
  onInsert(key: string): void;
  onRename(key: string, name: string): void;
  onCtxMenu(e: React.MouseEvent, item: LibraryItem): void;
  onDetail(item: LibraryItem): void;
}

// DiscoveryView.tsx
interface DiscoveryViewProps {
  activeType: MediaTypeFilter;
  photos: StockPhoto[];
  videos: StockVideo[];
  icons: DiscIcon[];
  fonts: DiscFont[];
  loading: Record<"img" | "vid" | "ico" | "fnt", boolean>;
  searchQuery: string;
  onSearch(q: string): void;
  onLoadMore(type: "img" | "vid"): void;
  onSave(type: "img" | "vid", item: StockPhoto | StockVideo): void;
  onInsert(filename: string): void;
}
```

---

## 7. Engine Additions

### `engine/media/media.ts` — add `"font"` to MediaAssetType

```typescript
// Before:
type MediaAssetType = "image" | "video" | "audio" | "icon" | "svg";
// After:
type MediaAssetType = "image" | "video" | "audio" | "icon" | "svg" | "font";
```

### `engine/media/MediaManager.ts` — add Discovery stub methods

```typescript
/** Search stock photos (Unsplash) or videos (Pexels). Stub — wire to real API later. */
async searchStock(
  type: 'img' | 'vid',
  query: string
): Promise<StockPhoto[] | StockVideo[]>;

/** Get built-in icon library filtered by category. */
getIcons(category?: string): DiscIcon[];

/** Get Google Fonts list filtered by query. Stub — wire to real API later. */
async getFonts(query?: string): Promise<DiscFont[]>;
```

---

## 8. CSS System

`media.css` uses:

- `--aqb-*` variables for panel-level tokens (surface, text, border, radius)
- `--media-img: #3b82f6` (images — blue)
- `--media-vid: #f97316` (videos — orange)
- `--media-ico: #f59e0b` (icons — amber)
- `--media-fnt: #10b981` (fonts — green)

These 4 `--media-*` vars are added to `LeftSidebar.css` (already the right location per existing pattern).

No hardcoded hex values in component CSS.

---

## 9. Delete List (old files)

All 12 files in current `tabs/media/` folder are replaced:

```
DELETED:
  MediaTab.tsx              → replaced
  MediaBulkBar.tsx          → functionality merged into LibraryView.tsx
  MediaContextMenu.tsx      → merged into useMediaState.ts + LibraryView.tsx
  MediaDetailPanel.tsx      → merged into LibraryView.tsx
  MediaGrid.tsx             → merged into LibraryView.tsx
  MediaLightbox.tsx         → removed (detail overlay replaces lightbox)
  MediaSearchSort.tsx       → merged into LibraryView.tsx toolbar section
  MediaStorageBar.tsx       → merged into UploadZone.tsx
  MediaSubTabs.tsx          → replaced by TypePills.tsx + SourceBar (inline)
  MediaUploadZone.tsx       → replaced by UploadZone.tsx
  mediaData.ts              → replaced by new mediaData.ts
  mediaIcons.tsx            → merged into mediaData.ts
  useMediaTabState.ts       → replaced by useMediaState.ts
  index.ts                  → replaced by new index.ts
  styles/media.css          → replaced by media.css
```

---

## 10. Anti-Pattern Prevention

| Anti-Pattern          | Prevention                                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Pass-through wrappers | No component just re-passes props. TypePills and UploadZone are extracted because they have real independent rendering logic. |
| Middle-man functions  | No `handleFoo = (x) => onFoo(x)` wrappers. Callbacks passed directly.                                                         |
| Duplicate logic       | `fmtSize`, `fmtDur`, `extStyle` live ONLY in `mediaUtils.ts`. Never duplicated.                                               |
| SSOT violations       | All state in `useMediaState`. No `useState` in children for shared state.                                                     |
| Mixed responsibility  | `MediaTab.tsx` = layout only. `useMediaState.ts` = state only. `mediaData.ts` = data only.                                    |
| Dead code             | All 14 old files deleted. `index.ts` exports only what `LeftSidebar.tsx` needs.                                               |
| Over-fragmented flow  | 11 files. No sub-folder nesting. Execution path: MediaTab → LibraryView → render sections.                                    |
| Hidden side effects   | No `useEffect` in children. All subscriptions live in `useMediaState`.                                                        |
| High coupling         | Children receive typed prop slices. No child imports from sibling components.                                                 |

---

## 11. Verification Checklist

After implementation:

- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] `J` keyboard shortcut opens Media tab
- [ ] My Library → Upload image → ghost card appears → completes → file in grid
- [ ] My Library → type pill filter → correct sections show/hide
- [ ] Discovery → type pill filter → correct sections show/hide
- [ ] Discovery → Search → stock results update with debounce
- [ ] Discovery → Save to Library → item appears in My Library
- [ ] Select mode → multi-select → bulk delete with undo
- [ ] Context menu → Insert / Copy name / Delete
- [ ] Detail overlay → rename inline
- [ ] `git status` — no untracked files
