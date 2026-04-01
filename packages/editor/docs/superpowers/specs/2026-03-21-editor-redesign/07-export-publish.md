# Module 07 — Export & Publish

## Problem

ExportEngine (662 LOC) supports HTML, React, Vue, Next.js, and ZIP — all implemented with 8 modular injectors (Analytics, SEO, Assets, Stripe, Formspree, Sitemap, etc.). The publish flow exists but has a broken checklist (3 of 4 items hardcoded to `false` with TODO comments). The export modal shows 4 formats as "Coming Soon" that actually work in the engine. Users think the product can only export HTML when it can do much more.

## Requirements

### Publish Tab (Sidebar)
- Status badge: Published (green) or Draft (amber)
- Last published timestamp
- Published URL (clickable + copy to clipboard)
- Pre-publish checklist — ALL items wired to real data:
  - Has content: `composer.elements.getAll().length > 0`
  - Has SEO title: wired to page SEO data
  - Has meta description: wired to page SEO data
  - Has social image: wired to page social data
- Each incomplete item has a navigation hint ("Set in Pages → SEO tab") that takes user there
- Publish / Update button with progress state
- Unpublish option with confirmation
- Trust badge (security indicator)
- Error state with retry

### Export Modal (Ctrl+Shift+E)
- Show ALL available formats (not "Coming Soon" for formats that work):
  - HTML + CSS — multi-page, minified
  - React — component-based
  - Vue — Vue 3 SFC
  - Next.js — full app
  - ZIP — all assets bundled
- Per-format: page selection (checkboxes), download button
- Code preview option: see generated code before downloading
- Download flow: button → progress → auto-download ZIP → success toast

### Preview (Ctrl+P)
- Opens published-equivalent view in new browser tab
- Full page rendered as it would appear live
- No editor UI visible in preview
- Toast in editor: "Preview opened in new tab"

## Flows

### First Publish
1. User clicks Publish in top bar → Publish tab opens in sidebar
2. Sees Draft status + checklist with incomplete items
3. Clicks "Set in Pages → SEO tab" link → navigates to Pages tab → SEO settings
4. Fills in title + meta description → navigates back to Publish tab
5. Checklist items now green ✓
6. Clicks "Publish Site" → progress state → success → Published URL shown
7. Clicks URL → opens published site in new tab

### Export Code
1. Press Ctrl+Shift+E OR find via Ctrl+K → "Export"
2. Export modal opens → see 5 format cards
3. Click "React" → select pages to include
4. Click "Preview Code" → see generated React components
5. Click "Download" → progress → ZIP auto-downloads → success toast

### Update Published Site
1. Make changes to published site
2. Publish tab shows "Update Site" button (replaces "Publish Site")
3. Click Update → progress → success → timestamp updates

## Engine APIs

| Surface | API | Key Methods |
|---------|-----|------------|
| Export | `composer.export` (ExportEngine) | exportAllPages(), toHTML(), toReact(), toVue() |
| Analytics injection | AnalyticsInjector | inject GA/Meta Pixel scripts |
| SEO injection | SEOInjector | inject meta tags, og:tags |
| Asset bundling | AssetBundler | bundle images, fonts, assets into ZIP |
| Form injection | FormspreeInjector | inject form submission handlers |
| Sitemap | SitemapGenerator | generate XML sitemap |
| Preview | `composer.export` | exportHTML().combined → Blob URL → new tab |
| Publish checklist | `composer.elements`, page SEO data | getAll(), getSeoData() |

## Constraints

- Publish checklist items must be wired to real data — no hardcoded false values
- Export must handle multi-page projects (all pages or selected pages)
- Preview must match published output exactly (P2: canvas never lies)
- Download triggers browser native download — no custom download UI
- Export progress visible for large projects (many pages, many assets)

## Reference

- **Webflow:** Publish flow (status badge, checklist, URL display)
- **Framer:** Deploy experience (clean, fast, one-click)
- **CodeSandbox:** Code preview before export

## States (Loading, Error)

- **Export loading:** Download button shows "Preparing download..." with a spinner, per-format. Other format cards remain interactive.
- **Export error:** Toast notification: "Export failed — [reason]" with a "Retry" action button. Reason examples: "too many assets", "generation timeout", "unknown error".
- **Publish loading:** Publish/Update button becomes disabled, text changes to "Publishing..." with a spinner. All other publish tab controls remain visible but non-interactive.
- **Publish error:** Alert box with red left border (4px, #E53935) appears below the publish button. Contains error message, "Retry" button, and "Dismiss" link. Error persists until dismissed or retry succeeds.
