# Editor PRD · Ch.08 — Media, Export, Preview

> Part of BUILDRIK-PRD-EDITOR v2.0 · `main` @ `e5624ca1` · 2026-07-07 · base `packages/editor/src/`

**Framing correction**: `preview/` (69 files) = dev-only **Vibcoder component gallery** (24 atoms + 18 molecules + 16 organisms, `preview/vibcoder-index.html:16-17`) — NOT product preview. Product export-preview lives in `editor/export/`; `vibcoder-topbar.tsx` = gallery demo of the Topbar organism.

## 8.1 Media

**Two parallel library UIs**: LibraryManager (full-page 3-column: folders 240 | grid | details 320, shortcut J, `editor/media/LibraryManager.tsx:6-9,303-379`) + MediaLibraryPanel (modal, 4 tabs Library/Upload/From URL/Optimize — ⚠ From-URL tab "coming soon" stub while LibraryManager HAS working URL import via window.prompt, `MediaLibraryPanel.tsx:225`, `LibraryManager.tsx:161-177`).

**Upload pipeline** (`engine/media/MediaManager.ts:684-903`): validate → dataURL → **MIME magic-byte sniff** (spoofed ext) → **SVG DOMPurify sanitize** (FORBID xlink:href/href; reject non-svg root) → auto-WebP convert → thumbnail → IndexedDB local → best-effort server mirror. **Local-first**: server CUID replaces local id on mirror success; failure → `localOnly=true` + retryQueue (rebuilt on init — survives reload); delete-during-upload tombstone (`:804-880,219-254`).

**Image editing**: ImageEditorModal crop/adjust/resize (react-easy-crop), filter presets ×6, output always WebP q0.92, saves as version `_v{n}` (`ImageEditorModal.tsx:64-179`, `LibraryManager.tsx:216-228`). OptimizationPanel: WebP/AVIF/JPEG/PNG + support probe, quality 10-100 (default 85), max-dimension clamp, live savings, 300ms debounce (`OptimizationPanel.tsx:159-304`). Alt-text ≤125 chars + AI generate w/ provenance (`AssetDetailsPanel.tsx:28-29,431-524`). **Replace-across** all usages atomically (+ per-page selective modal, `:311-384`). Icons: Lucide only, recents ×12 (`IconPickerModal.tsx:47-48,315`).

**Rules**: image 10MB / video 100MB / audio 50MB / SVG 1MB / max dim 4096 (`shared/constants/media.ts:16-29`); quota 1GB local SSOT, server overrides, -1 unlimited, pre-check blocks (`media.ts:129`, `useUploadState.ts:110-126`); audio = local-only by design, no server schema (`MediaManager.ts:881-882`).

**Upload FSM**: pending(0) → uploading(25-50) → optimizing → processing(75) → complete(100) | error (`media.ts:709`); queue rows auto-clear 1.5s; failed retained w/ Retry (`useUploadState.ts:31-98,157-166`).

## 8.2 Export

Formats: type allows html|zip|json|react|vue|nextjs (`shared/types/export.ts:16`) — **implemented: HTML, ZIP, React**; Vue/Next = coming-soon; JSON unsurfaced (`ExportOptions.tsx:20-23,113-176`). ZIP = JSZip index.html+styles.css+assets (`engine/export/ExportEngine.ts:730-767`); React = components/*.tsx + package.json, no in-modal preview (`ReactExporter.ts:68-125`). Options: cssStyle inline/embedded/external, minify, meta/viewport/reset, pageTitle default "Aquibra Export" ⚠, cssPrefix `buildrick-`, analytics+Stripe injection (`export.ts:26-70`). CMS export none/static/template (handlebars|liquid) when bindings exist. Preview sanitized hard (strips script/iframe/handlers/js-urls) + sandboxed iframe (`ExportUtils.ts:11-63`).

## 8.3 Preview & share

Device preview: desktop 1440×900 / tablet 768×1024 / mobile 375×667, scale-to-fit + device chrome, relative→absolute URL fix BUG-006 (`export.ts:129-147`, `PreviewFrame.tsx:37-166`). **"Preview as client" = `?view=client` URL param (full reload) — NO shareable/tokenized link exists in editor** (`shell/Topbar.tsx:614-623`; grep confirms) — ties to v1.0 finding that ShareLink model exists server-side only.

## 8.4 Defects (feeds §13)

1. MediaLibraryPanel From-URL stub vs LibraryManager working import — two inconsistent library UIs
2. Trash "coming soon" toast (`LibraryManager.tsx:318-319`)
3. ImageEditor Before/After compare missing (own audit `Section17.audit.md:54-71`)
4. Vue/Next export placeholders; JSON declared-unsurfaced
5. AssetGrid virtualization deferred (documented trigger: 1000+ assets)
6. fmtBytes deliberately not unified with shared formatBytes (1 vs 2 decimals)
7. Process defect noted in own audit: prototype-v3 plan tasks written without re-grepping — 6 phases already shipped (`Section20.audit.md:61-66`)

## 8.5 Integration

Blob = **Vercel Blob** client-token flow via `POST ${DASHBOARD_URL}/api/asset-upload` (clientPayload bytes/type/mime/filename/folderId/siteId → server validates session+quota+size → scoped token → direct browser upload) (`AssetUploadService.ts:50-92`). Metadata via tRPC media router (createAsset idempotent on URL). Server asset types image|video|icon|font (no audio, `:75`). Alt-text `media.generateAltText` (claude-haiku-4-5). Stock Unsplash/Pexels/Pixabay server-proxied. IndexedDB "aquibra-media" 3 stores. Drag payload `application/x-aquibra-media-*`.
