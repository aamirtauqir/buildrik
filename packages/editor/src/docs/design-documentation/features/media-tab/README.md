---
title: Media Tab — Team-Synced Asset Library
description: Design specification for the media library with uploads, stock discovery, image editor, and team sync
feature: media-tab
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../design-system-tab/README.md
  - ../canvas/README.md
dependencies:
  - Canvas (drag media to canvas)
  - SyncManager (team asset sync)
  - Design System Tab (font uploads auto-register)
status: approved
---

# Media Tab — Team-Synced Asset Library

## Overview

The Media Tab is the central asset library for all project media. It has two primary tabs: My Library (uploaded project assets) and Discovery (stock photos/icons). Users can upload via drag-drop, edit images with a built-in editor (crop, resize, filters), and share assets across the team via SyncManager. Font uploads auto-register in the Design System typography palette.

**Primary User Goal:** Find or upload the right asset and place it on canvas in under 15 seconds.
**Success Criteria:** Upload completes and asset is usable in < 3 seconds for a 2MB image.
**Key Pain Points Addressed:** No more switching to external tools for basic image editing; team members see shared assets instantly.

---

## Layout Architecture

```
┌──────────────────────────────┐ 280px
│ [My Library] [Discovery]     │ Dual tabs
├──────────────────────────────┤
│ 🔍 Search assets...          │
├──────────────────────────────┤
│ [All] [Images] [Videos]      │
│ [Fonts] [Icons]              │ Type filters
├──────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │     │ │     │ │     │    │ 3-column masonry
│ │ img │ │ img │ │ img │    │ grid
│ │     │ │     │ │     │    │
│ └─────┘ └─────┘ └─────┘    │
│ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │ img │ │ img │ │ img │    │
│ └─────┘ └─────┘ └─────┘    │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │  + Drop files to upload  │ │ Upload drop zone
│ │    or click to browse    │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

---

## Screen States

### State 1: My Library (Default)

- **Tab bar:** My Library active (`--buildrick-accent` text + underline), Discovery inactive.
- **Type filters:** Pill buttons, horizontally scrollable. Active: `--buildrick-accent` bg.
- **Asset grid:** 3-column masonry layout. Thumbnails: `--buildrick-design-radius-sm`, aspect-ratio preserved.
- **Hover:** Dark overlay (40% black) with action icons: Edit, Delete, Copy URL. `--aqb-elevation-1`.
- **Upload zone:** 64px height, dashed `--aqb-chrome-border` border, `--aqb-chrome-surface` bg. "+" icon centered.

### State 2: Discovery Tab (Stock)

- **Search prominent:** Larger search bar with "Search free photos..." placeholder.
- **Results:** Same masonry grid. Attribution badge on each image ("Photo by [author]").
- **Click to add:** Downloads to My Library first, then available for canvas use.
- **Categories:** Curated category chips below search: Nature, Business, Technology, People, Abstract.

### State 3: Upload in Progress

- **Drop zone active:** Dashed border becomes solid `--buildrick-accent`, bg becomes `--buildrick-accent-tint`.
- **Progress:** Each uploading file shows as a card with progress bar. File name + size + percentage.
- **Validation errors:** Red border, error message below. Limits: Images 10MB, Videos 50MB, Fonts 5MB.
- **Complete:** Card transforms into standard thumbnail with green checkmark flash (300ms).

### State 4: Image Editor

- **Trigger:** Click Edit icon on image hover overlay
- **View:** Full-panel overlay (replaces media grid). Toolbar at top: Crop, Resize, Rotate, Flip, Filters.
- **Canvas:** Image centered with manipulation handles.
- **Filters:** Horizontal scrollable strip of named presets with thumbnail previews.
- **Actions:** [Cancel] ghost + [Save] primary + [Save As Copy] secondary.

### State 5: Font Upload

- **Detection:** File type `.ttf`, `.otf`, `.woff`, `.woff2` triggers font-specific flow.
- **Preview:** Font name + sample text "The quick brown fox..." rendered in the uploaded font.
- **Auto-register:** Font added to Design System Tab typography palette automatically.
- **Confirmation:** Toast "Font [name] added to Design System".

### State 6: Empty Library

- **Visual:** Upload illustration + "Upload your first asset" + drag-drop zone prominent. "Or browse stock photos" link.

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Drag file from OS to panel | Upload starts immediately | Drop zone highlights, progress bar appears |
| Drag asset to canvas | Creates image/video element at drop point | Ghost preview follows cursor |
| Click asset | Inserts at canvas cursor position | Element fades in, 150ms |
| Click Edit on image | Opens built-in image editor | Slide-up overlay, 200ms |
| Click Discovery result | Downloads to My Library, then inserts | Download progress → insert |
| Delete asset | Confirmation if asset is used on any page | Modal with usage count |
| Team sync | New uploads from teammates appear in real-time | Fade-in at top of grid, 200ms |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Library load (100 assets) | < 200ms (thumbnails lazy-loaded) |
| Upload start → progress visible | < 100ms |
| Image editor open | < 300ms |
| Stock search results | < 500ms |
| Team sync (new asset appears) | < 1s |
| Thumbnail generation | Server-side, < 2s per upload |

---

## Accessibility

- **Upload zone:** `role="button"`, `aria-label="Upload files. Drag and drop or click to browse."`, keyboard activatable
- **Asset grid:** `role="grid"`, arrow keys navigate between thumbnails
- **Image actions:** Visible on focus (not just hover), `aria-label` for each action
- **Image editor:** All tools keyboard accessible, Tab order follows toolbar left-to-right
- **File type errors:** Announced via `aria-live="polite"` region

---

## Implementation Notes

- Upload handled by `Composer.media.upload()` with progress callback
- Team sync via `SyncManager.media` channel — assets stored in shared project storage
- Image editor uses `<canvas>` element for manipulation, outputs optimized WebP
- Font uploads call `Composer.designSystem.registerFont()` which updates typography tokens
- Discovery tab integrates with stock photo API (Unsplash/Pexels) via `services/` layer
- File size limits enforced client-side before upload starts

---

## Related Documentation
- [Canvas](../canvas/README.md) — Media assets dragged here
- [Design System Tab](../design-system-tab/README.md) — Font uploads auto-register
- [Collaboration](../collaboration/README.md) — Team sync for shared assets
- [Style Guide](../../design-system/style-guide.md) — Grid and overlay specs
