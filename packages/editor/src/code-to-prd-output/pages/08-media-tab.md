# Media Tab

> **Module:** Sidebar — Tab 6
> **Source:** `src/editor/sidebar/tabs/media/` + `src/editor/media/`
> **Keyboard Shortcut:** J
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

The Media tab is the **team-shared** asset library for managing uploaded images, videos, and fonts. It supports dual-source browsing (user uploads + stock discovery), drag-and-drop upload, in-place image editing (crop, resize, filter), and direct insertion onto the canvas. **For collaborative projects, the media library syncs across all team members by default via SyncManager.**

## Layout

```
+---------------------------+
| Media Library             |
+---------------------------+
| [My Library] [Discovery]  |
+---------------------------+
| [Search: "Find assets"]   |
| [Type: All|Images|Videos| |
|  Fonts]                   |
+---------------------------+
| +------+ +------+        |
| |[img] | |[img] |        |
| |beach | |logo  |        |
| +------+ +------+        |
| +------+ +------+        |
| |[img] | |[vid] |        |
| |hero  | |intro |        |
| +------+ +------+        |
+---------------------------+
| [Drop files here to       |
|  upload, or click to       |
|  browse]                   |
+---------------------------+
| [N assets selected]       |
+---------------------------+
```

## Fields

### Tab Switcher
| Tab | Content |
|-----|---------|
| My Library | Team-shared uploaded assets (synced for collaborative projects) |
| Discovery | Stock images/videos (external search) |

### Filters
| Field | Type | Options | Default |
|-------|------|---------|---------|
| Search | Text input | — | Empty |
| Type filter | Chip group | All, Images, Videos, Fonts | All |

### Asset Card
| Element | Type | Behavior |
|---------|------|----------|
| Thumbnail | Image/Video | Preview of the asset |
| File name | Text | Truncated if too long |
| Hover overlay | Action menu | Edit, Delete, Insert, Copy URL |
| Select checkbox | Checkbox | Multi-select for bulk operations |

### Upload Zone
| Element | Type | Behavior |
|---------|------|----------|
| Drop zone | Drag target | Drag files from OS to upload |
| Browse button | File picker | Opens OS file dialog |
| Progress bar | Progress | Shows upload progress per file |

## Interactions

### Upload Assets
- **Trigger:** Drag files onto drop zone, or click to browse
- **Behavior:** File validation (type, size) → upload progress bar → thumbnail generated → asset appears in library → synced to team
- **Accepted types:** Images (JPEG, PNG, GIF, SVG, WEBP), Videos (MP4, WEBM), Fonts (WOFF, WOFF2, TTF, OTF)
- **Size limits:** Images: 10 MB, Videos: 50 MB, Fonts: 5 MB
- **Error handling:** Oversized files show clear error: "File exceeds 10 MB limit. Compress or resize before uploading."
- **Storage:** IndexedDB via MediaStorage + SyncManager for team sync

### Browse Stock Images (Discovery)
- **Trigger:** Switch to "Discovery" tab
- **Behavior:** Search bar queries stock photo API → results displayed in grid → click to add to My Library

### Insert Asset onto Canvas
- **Trigger:** Drag asset toward canvas, or click "Insert" in hover menu
- **Behavior:** Creates image/video element at drop position on canvas → asset URL set as source
- **Alternative:** Click inserts inside currently selected element

### Edit Image
- **Trigger:** Click "Edit" in asset hover menu
- **Behavior:** Image editor modal opens → tools: Crop, Resize, Rotate, Flip, Filters (brightness, contrast, saturation) → "Save" applies changes → "Cancel" discards

### Delete Asset
- **Trigger:** Click "Delete" in hover menu or bulk action
- **Behavior:** Confirmation modal → on confirm, asset removed from library
- **Warning:** If asset is used on canvas, warning lists affected elements with page names

### Bulk Select
- **Trigger:** Shift+click or checkbox on multiple assets
- **Behavior:** Selection banner shows count → bulk actions available: Delete, Download, Tag

### Image Optimization
- **Trigger:** Optimization panel in image editor
- **Behavior:** Compress image with quality slider → format selection (JPEG, PNG, WEBP) → shows file size comparison before/after

## Business Rules

1. **Media library syncs via SyncManager by default for collaborative projects** — all team members see the same asset library. Solo projects fall back to IndexedDB-only.
2. Discovery tab assets are fetched from external API; must be "added" before use
3. Deleting an asset does NOT automatically remove it from canvas elements — warns with list of affected elements and page names
4. Font uploads automatically register the font for use in the Design System
5. Image thumbnails are auto-generated on upload for performance
6. **Upload limits:** Images 10 MB, Videos 50 MB, Fonts 5 MB. Files exceeding limits are rejected with a clear error message.
7. Maximum storage per project: 500 MB total (warn at 80% usage)

## Screen Relationships
- **To:** Canvas (insert image/video elements), Design System tab (uploaded fonts appear in font list)
- **Data coupling:** MediaManager events trigger UI updates; asset deletion warning checks ElementManager for usage; SyncManager propagates changes to team
