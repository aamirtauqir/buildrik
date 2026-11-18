# Phase 4 — current AS-IS frames 01–10 fidelity corrections

Date: 2026-10-10. Scope: existing native Figma frames on page `8280:2`, in file `g4GzQFqzNYz5sosz1QtZXC`. This pass corrects evidenced reconstruction errors. It makes no application changes, proposes no redesign, and does not close Gate 4.

The subsequent scoped pass is documented separately in [frames 11–35 fidelity report](FIGMA-FRAMES-11-35-FIDELITY-REPORT.md). Its broader comparison range and additional fixes do not retroactively expand the first-ten verification stated here.

## Scope and verification

| Frame | Current state | Source layout snapshot |
|---|---|---|
| `8281:2` | 01 Review / empty | `/tmp/buildrick-review-layout.json` |
| `8283:2` | 02 Heading / Style | `/tmp/buildrick-heading-layout.json` |
| `8283:299` | 03 Selected element actions | `/tmp/buildrick-heading-menu-layout.json` |
| `8283:610` | 04 Layers | `/tmp/buildrick-layers-layout.json` |
| `8283:935` | 05 Pages | `/tmp/buildrick-pages-layout.json` |
| `8283:1249` | 06 Add catalog | `/tmp/buildrick-add-layout.json` |
| `8283:1654` | 07 Saved components | `/tmp/buildrick-components-layout.json` |
| `8283:1998` | 08 Assets quick chooser | `/tmp/buildrick-assets-layout.json` |
| `8283:2325` | 09 Full Media | `/tmp/buildrick-media-layout.json` |
| `8283:2523` | 10 CMS records | `/tmp/buildrick-cms-records-layout.json` |

Readback confirms all ten frames remain 1280 × 720 under page `8280:2`. Node verification reports no failures for the five primary correction classes below. The additional glyph/stacking operation returned no errors. Only descendants of these ten frames were changed; later screens and the reusable control library were outside this pass. Browser captures were reused without browser interaction.

[Open the AS-IS page](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8280-2).

## Corrections and source evidence

| Correction | Applied | Evidence and boundary |
|---|---:|---|
| Hide the visible “Heading selected” extraction artifact | 14 text nodes | `src/editor/inspector/styles/inspector.css:948` defines `.bdi-sr-only` as a clipped 1px live region. Native nodes were hidden, preserving the application’s accessible text. |
| Restore measured monospace font | 47 text nodes | Recorded `font` fields specify Geist Mono/SF Mono/Menlo/Consolas. Native text now uses available Geist Mono Regular or Medium according to recorded weight; artificial renderer letter spacing was cleared. Values were retained. |
| Restore CMS uppercase and tracking | 4 text nodes | `chrome-ui/SectionHeader.tsx:17` uses uppercase and 0.08em tracking; `cms/RecordsTable.tsx:43,48` uses uppercase and 0.88px tracking. Collections, Data, Title and Updated now reproduce those CSS transforms at 11px. |
| Restore clipped page-tab ellipsis | 18 text nodes | `shell/PageTabBar.tsx:155` sets max-width 120px, hidden overflow and text ellipsis. Text was measured natively and shortened to fit that width; full source labels remain in capture evidence/node names. |
| Restore recorded box shadows | 106 box nodes | Snapshot CSS shadows were translated into native inner/drop shadows with recorded color, opacity, offset, blur and spread. This includes the selected H2 inset outline, Review pill and floating controls. Twenty-one transparent shadow stacks were skipped. Browser/Figma blur raster equivalence is not asserted. |
| Restore empty-image glyph | 9 native SVG nodes | Exact 32px SVG geometry/color from `canvas/Canvas.css:89–104`, centered in the existing 120 × 80 empty-image area. No missing media raster was invented. |
| Restore search icon paint order | 6 existing SVG nodes | Captured icon geometry and `chrome-ui/PanelSearch.tsx` support the visible search glyph. Flattened paint order had placed these SVGs beneath opaque input backgrounds. Existing icons now sit immediately after the corresponding input box within the same parent; coordinates were retained. |

Source paths in the table are relative to `src/editor/` unless already prefixed. These are corrections to the design reconstruction, not fixes to the product findings recorded elsewhere.

## Screenshot comparison

Each row links the original browser reference, pre-correction Figma render and final Figma render. All are 1280 × 720. Review, Heading and CMS were visually compared; the remaining seven frames received scoped node checks, not a full screenshot comparison.

| State | Browser | Before | After | Assessed result |
|---|---|---|---|---|
| Review / empty | [Reference](evidence/figma-first10-review-browser.png) | [Before](evidence/figma-first10-review-before.png) | [After](evidence/figma-first10-review-after.png) | Page-tab ellipsis, missing-image glyph and shadows restored. Empty-state copy, button and canvas placement retained. |
| Heading / Style | [Reference](evidence/figma-first10-heading-browser.png) | [Before](evidence/figma-first10-heading-before.png) | [After](evidence/figma-first10-heading-after.png) | Ghost live-region text removed; measured mono fields, H2 inset outline, ellipsis and empty-image glyph restored. Captured values remain 36px, line height 1.2, weight 700, color `1a1a1a`; no alignment choice is invented. |
| CMS records | [Reference](evidence/figma-first10-cms-browser.png) | [Before](evidence/figma-first10-cms-before.png) | [After](evidence/figma-first10-cms-after.png) | Uppercase/tracked section and column headings, mono counts and visible search magnifier restored. Captured records, status and time labels retained. |

The Review browser reference is the existing `/tmp/buildrick-current-canvas.png`, verified to contain the Review empty state. Heading and CMS use `/tmp/buildrick-heading.png` and `/tmp/buildrick-cms-records.png`.

## Remaining fidelity limits

- Review description wrapping still differs: the browser’s first line ends “a link”; the Figma render’s first line ends “a”. The text and measured layout were preserved rather than tuning typography without evidence.
- CMS search placeholder tone remains darker in the reconstruction. Native font rendering and some wrapping differ from browser rendering; these frames are not pixel-perfect replicas.
- The browser’s development-only “1 Issue” pill is absent because the original reader excludes `NEXTJS-PORTAL`. A transient site-crumb focus treatment is also not reconstructed. These exclusions are not product fixes.
- The old reader could clip fixed descendants through overflow-hidden ancestors. Parent-owned later Page Settings captures were corrected separately. This pass does not certify comprehensive popover/modal, focus or stacking coverage for the first ten screens; the selected-element-menu frame exists, but no new browser interaction was performed to exhaust its states.
- Assets/Full Media raster completeness was not newly verified. Restoring the source-defined empty-image glyph does not establish that all media thumbnails were reproduced.
- App bugs, unsupported controls, clipped content and captured field values remain AS-IS. This report verifies these reconstruction changes only; overall Phase 4 acceptance remains with the central audit.

## Machine-readable evidence

- [Primary change ledger](evidence/figma-first10-fidelity-changes.json): frame/node/action IDs and changed labels.
- [Measured correction inputs](evidence/figma-first10-fidelity-inputs.json): source capture metadata and recorded CSS values.
- [Glyph and stacking ledger](evidence/figma-first10-fidelity-extra.json): added native SVG IDs and reordered icon IDs.
- [Readback](evidence/figma-first10-fidelity-readback.json): correction counts, failures and unchanged frame dimensions/parents.

No application or test files were edited and no application test suite was rerun for this Figma-only correction pass. Pre-existing local source changes were preserved.
