# SlimLauncher §10 audit (prototype-v3)

## Current state (pre-rewrite — captured 2026-05-13)

- **TSX LOC:** 287
- **CSS LOC:** 245
- **Renders today:**
  - Optional `med-selection-bar` (§11 cobalt selection-context strip, all inline styles, no `.sl-*` class)
  - `.sl-header` with `<h3>Media</h3>` title + 3 icon buttons (Upload, Maximize2, X-close-when-onClose)
  - Ghost search row `.sl-search` (faux-input opening full library on focus; shows Search icon + ghost text + `⌘K` Kbd)
  - `.sl-strip` "Recent" section: small-caps label + "View all" link + 3-col grid of up to 12 `.sl-tile` thumbs (click insert, drag spatial drop)
  - Empty-state alternative (`.sl-empty`) with title, body, and single "Open library" CTA when no library items
  - Footer `.sl-open-library` outline button (only when `recent.length > 0`) — uses `margin: auto ... ...` to push self to bottom
  - Hidden `<Input type="file" multiple>` ref'd by Quick-upload icon button
  - Fullscreen `.sl-drag-overlay` shown during file drag-over

- **Missing per prototype §10:**
  - TypePills filter row (image / video / svg / font count chips)
  - Real `<Input>` search wired to `searchQuery` / `onSearchChange` (currently a ghost button that bails to full library)
  - 3-col asset grid with usage pips overlay + applied-asset highlight
  - UploadZone footer with quota progress bar (currently just a plain "Open library" button — no quota, no upload-queue surface)
  - Stock-library entry point (`onOpenStock`)
  - Type-segmented counts driving filter active state

## Current SlimLauncherProps

- `composer: Composer` — engine handle; used only for `composer.media.emitEvent("media:library:opened", ...)` telemetry on mount.
- `libraryItems: LibraryItem[]` — full library list; sliced top-12 for the Recent strip.
- `onInsert(key: string): void` — Path 1: insert tile at cursor (matches `useMediaState.insertToCanvas`).
- `onOpenLibrary(opts?: { searchQuery?: string; folderId?: string | null }): void` — Paths 3 & 4: expand to full manager, with optional prefill.
- `onUpload(files: File[]): void` — Paths 5a / 5b: hidden file input + drop overlay.
- `onClose?(): void` — optional X-button close handler.
- `selectionContext?: { elementId: string; label?: string } | null` — §11 snap-back mode banner data.
- `onCancelSelection?(): void` — §11 cancel handler, surfaces "Cancel" pill inside selection bar.

## Current CSS classes

- `.sl-launcher` — root vertical flex column, 100% height, drag-over outline modifier `.sl-launcher--drag-over`.
- `.sl-header` — 48px sticky chrome row, bottom border, title + actions.
- `.sl-title` — 18/600 panel title.
- `.sl-header-actions` — 6px gap row for icon buttons.
- `.sl-icon-btn` — 28×28 ghost icon button (matches TemplatesTab chrome).
- `.sl-search` / `.sl-search__icon` / `.sl-search__ghost` / `.sl-search__kbd` — 36px faux-input row that opens full library on focus.
- `.sl-strip` / `.sl-strip__header` / `.sl-strip__label` / `.sl-strip__more` — Recent section header bar.
- `.sl-tiles` — 3-col grid, 8px gap.
- `.sl-tile` / `.sl-tile__img` / `.sl-tile__placeholder` — square draggable thumbnail.
- `.sl-empty` / `.sl-empty__title` / `.sl-empty__body` / `.sl-empty__cta` — empty-state stack.
- `.sl-open-library` — footer outline "Open library" CTA (recents-present branch).
- `.sl-drag-overlay` / `.sl-drag-overlay__label` — fullscreen drop hint during file drag.

## Composer / state usage

- `React.useState<boolean>(dragOver)` — toggled by `handleDragOver` / `handleDragLeave` / `handleDrop`.
- `React.useRef<HTMLInputElement>(fileInputRef)` — drives hidden file picker for Quick-upload button.
- `React.useEffect(..., [composer])` — single mount-time emit of `composer.media.emitEvent("media:library:opened", { source: "slim_launcher" })`. No subscriptions; no other engine reads.
- Derived: `const recent = libraryItems.slice(0, RECENT_LIMIT)` — first-12 of upstream-sorted list.
- No `composer.on(...)`, no `composer.media.*` reads, no element-store wiring — selection-context data is fully prop-driven.

## Rewrite plan (post-Task 11)

- **Props to keep:** `composer`, `libraryItems`, `onInsert`, `onUpload`, `onClose`, `selectionContext`, `onCancelSelection`
- **Props to deprecate (kept for back-compat):** `onOpenLibrary` (ExpandedMediaPanel still triggers maximize; faux-search ghost path goes away)
- **Props to add:** `onOpenStock`, `activeType`, `counts`, `onTypeChange`, `searchQuery`, `onSearchChange`, `storage`, `uploadQueue`, `usageMap`, `appliedAssetKey`
- **CSS classes to remove:** `.sl-search__ghost`, `.sl-search__kbd`, `.sl-strip`, `.sl-strip__header`, `.sl-strip__label`, `.sl-strip__more`, `.sl-tiles` (replaced by Task-11 grid), `.sl-empty*`, `.sl-open-library` (footer replaced by UploadZone with quota progress)
- **CSS classes to add:** see Task 11's SlimLauncher.css rewrite (TypePills row, real `<Input>` search, 3-col AssetCell grid with usage pips, UploadZone footer with `StorageQuotaBar`)
