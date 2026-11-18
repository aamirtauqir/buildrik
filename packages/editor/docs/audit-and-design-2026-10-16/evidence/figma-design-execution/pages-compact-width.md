# BD-25 — Compact Pages manager

Date: 2026-10-18. Mode: design only. Canonical decision: PRODUCT-DESIGN-BRIEF.md BD-25.

## Decision and evidence

User requested the Pages manager be small like the other left panels, after the recorded284px Add/Layers width was explained. Normal Pages is now284px instead of560px. With the existing56px rail, the left region is340px. The right Inspector remains300px; the desktop canvas column stays800px at1440px. Webflow was a direction for compactness; no claim is made to have measured or copied its current dimensions.

Inspected current native manager/header/body/footer/row anatomy, existing rename and recovery branches, the source-backed P11 inventory, and the preceding BD-24 placement correction. Reused existing RailItem, Search, Input, Button, IconButton and PageResourceRow instances. No new component family, property serialization or application-code changes.

The chosen approach uses the existing left-panel width and reflows its contents. A560px normal sheet would still obscure the canvas; uniformly shrinking text/buttons would make the controls harder to use. Detailed Listings keeps its existing explicit720px expanded view; ordinary Pages, Structure and recovery stay284px.

## Delivered specification

- 13 existing normal manager states are284px; existing Listings remains720px. Anchored x56/y56, to the bottom bar. Normal panel is square-edged with no floating-card shadow.
- Header56px and footer48px stay fixed. Body alone scrolls vertically; search/views scroll with it. Rows use260px inner width and40px height; ordinary title/URL lines truncate with ellipsis, preserving full underlying text. Full labels/tooltips/accessibility remain implementation acceptance.
- Pages/Listings/Structure controls are60/68/80px wide with32px height; More remains32px. Footer actions retain32px targets and4px gaps.
- Rename remains inline at260px with236px inputs/actions. Keep URL and Update URL stack vertically, followed by Cancel rename. Existing prototype reactions remain on the same controls.
- Recently deleted metadata wraps in the identity column. Its row grows to80px in the284px compact view, an explicit exception to the previous48px recovery specimen; this prevents hiding deletion metadata. Restore stays visible. The footer explanation wraps when needed.
- Deep collection structure uses the concise existing vocabulary20 pages, making room for Blog post and its URL. Collection identity and generated-record ownership are unchanged.
- Row actions anchor beside the compact panel atx340; the More menu is clamped within the left region atx56. Existing permissions, drafts, URL branches, active Home selection and created-page bottom tabs remain.
- Added two geometry specimens in Figma Journey review:78:19785 (1440×600) and78:20392 (1024×768). Their panel heights are512/680px and body heights405/573px. Footer and Help remain visible; content below the fold scrolls. These are design specimens, not complete interactive journeys.

## Verification

Native measurements confirm13 normal panels at284px, one expanded Listings at720px, and retained manager/menu/branch-control IDs. Visual inspection covers normal Pages, rename, Recently deleted, Structure, and open-manager short/narrow specimens. No label-size reduction was used.

Evidence images: [normal](pages-compact-main.png), [rename](pages-compact-rename.png), [recovery](pages-compact-recovery.png), [Structure](pages-compact-structure.png), [short](pages-compact-short.png), [narrow](pages-compact-narrow.png). Previous560px comparison remains in pages-placement-manager.png. Authoring: pages-compact-width.js; batch/viewport IDs: pages-compact-width-ledger.json.

Independent [review](pages-compact-width-review.md) found no blocking visual/geometry defect in the sampled compact states and short/narrow managers. The80px recovery-row exception is recorded here and in P11. Overall status remains PARTIALLY VERIFIED. Actual prototype scrolling/keyboard focus, long-name tooltip behavior, persistence/Undo and production interaction tests NOT RUN. This change completes the bounded visual-width correction, not B3 or the application implementation.
