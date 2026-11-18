# BD-24 — Pages placement correction

> **BD-25 — compact Pages width, 2026-10-18:** normal Pages/Structure/rename/recovery manager is284px, matching Add/Layers. Rail56px + panel284px =340px. Supersedes earlier560px normal manager width; expanded Listings remains720px. See the canonical brief and `pages-compact-width.md` evidence.

Date: 2026-10-18. Scope: Figma and design records only. Authority: explicit user correction; canonical decision remains in PRODUCT-DESIGN-BRIEF.md.

The earlier composition confused the page manager with the created-page strip. Pages management is a left-rail tool after Layers. Bottom bar shows the created pages and save status. Source `src/editor/rail/tabsConfig.ts` already registers Pages after Layers; this is source evidence for the existing tool, not runtime verification of the proposed bottom strip.

## Delivered correction

- Existing RailItem and file icon reused: Add, Layers, Pages, Assets, CMS, Brand; Help remains pinned below.
- Removed bottom management button. Preserved its four existing prototype links on the corresponding rail entry, including changed-URL, kept-URL and deleted-page branches.
- Bottom strip uses existing 28px navigation buttons inside a 32px horizontal scrolling frame. Status and Details remain outside that frame. One shared illustrative site fixture: Home, About, Work, Contact, Legal and Blog post collection template. These are existing B3 fixture pages, not pages created in production.
- Rename branches show Our story; deleted/recently-deleted branches omit About; restored branch brings it back. Home remains active throughout these off-page management examples.
- Manager anchors at x56/y56, width560 (Listings720), height812 at1440×900. Header56/footer48 remain fixed with one body scroll region. Row and header menus move with their anchors. This is an overlay beside the rail; it does not resize the authored page or change breakpoint.
- Updated56 existing shells:38 Editor,8 Recovery/access,10 Journey review. Preview/focus-only views remain as previously specified.

## Interaction and geometry contract

Pages/P opens management without switching the active page. Close/Esc returns to the rail Pages entry and restores previous editor context. Choosing a created-page tab runs the existing draft guard and opens that page; focus alone never navigates. Rename/delete/restore act on the same page identity and update the strip. One collection-template tab represents its generated pages. Existing viewer restrictions apply to the rail entry; strip navigation remains available. Offline and unsaved-draft rules are unchanged.

At desktop widths the overlay occupies560px beside56px rail (720px for Listings), below56px topbar and above32px bottom bar. Narrow fallback uses the available work area beside the rail; do not overlap topbar/status or shrink controls. A short shell at1440×600 leaves512px rail height. Manager narrow/short variants still require separate prototype/runtime validation; no claim is made from the desktop example alone.

## Evidence and limits

Mutation/read-back records: `pages-placement-ledger.json`; repeatable parameterized authoring script: `pages-placement-correction.js`. Visual samples: [main editor](pages-placement-editor.png), [Pages manager](pages-placement-manager.png), [1440×600 short shell](pages-placement-short.png), [1024×768 narrow shell](pages-placement-narrow.png). Independent reviewer checks representative normal/narrow/short geometry and renamed/deleted branch links. Final review is recorded separately when returned.

Independent [scoped review](pages-placement-review.md) found no blocking defect in sampled rail/tab placement, manager/menu geometry, preserved return branches or short/narrow Help fit.

Status: PARTIALLY VERIFIED — native Figma composition and selected structural routes checked. Browser implementation, keyboard playback, page creation/persistence, save/undo execution, and complete prototype traversal NOT RUN. Existing unwired page destinations and broader B3 coverage remain pending; this placement correction does not mark B3 complete. No application code, data model, production pages or deployment changed.
