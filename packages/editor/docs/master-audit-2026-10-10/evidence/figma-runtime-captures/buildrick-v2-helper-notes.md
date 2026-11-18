# DOM to native Figma helper v2

This is audit/reconstruction tooling only. It does not modify application files or the captured DOM, perform network requests, or execute Figma operations until the root agent explicitly submits the renderer through its authorized tool.

## Files and usage

- `/tmp/buildrick-read-layout-v2.js`: evaluate as one browser expression; returns a JSON string. Same entry shape as the previous reader.
- `/tmp/buildrick-render-asis-v2.js`: readable async function body.
- `/tmp/buildrick-render-asis-v2.min.js`: equivalent 12,972-byte async function body, minified with already installed Terser 5.48.0.
- `/tmp/buildrick-v2-helper-tests.cjs`: local synthetic-DOM and mocked-native-node checks. Run with `node /tmp/buildrick-v2-helper-tests.cjs`. No browser/Figma interaction.

Renderer inputs: `DATA`, `TITLE`, `POSITION` (`{x,y}`), `NOTE`; optional `PAGE_ID` defaults to `8280:2`. Do not add a `FONT` dependency; fonts are selected/loaded from the actual available list.

Large captures can be split into contiguous slices of `DATA.items` in paint order. Preserve full `DATA.contexts`, viewport, capture time, and warnings in every slice. First call omits `EXISTING_SCREEN_ID`. Later calls set it to the first returned `id`, and set `INDEX_OFFSET` to the number of items already rendered. Later calls reuse native stacking frames and produce no duplicate evidence note. Collect warnings/errors across all responses; the first note describes the first batch only. Do not retry a successful append batch without removing its already-created nodes: append is intentionally not idempotent.

## Verified contracts

2026-10-10 local fixtures passed:

- Header z100 paints above modal z91 and scrim z90; nested z999 inside z1 stays below those siblings.
- Same-origin iframe text is translated into outer viewport coordinates; a zero-height iframe body still produces its viewport background.
- Source `text-overflow:ellipsis` plus clipped nowrap controls truncation; ordinary labels use disabled truncation and measured natural single-line width.
- Source 32px text under scale .875 is captured as 28px. A 32px CSS SVG background under the same transform is captured as 28px and positioned correctly.
- Gradients remain source metadata; source positioned empty pseudo-element thumb supports percentage offsets.
- Renderer parses, generates native gradient and canvas-model records, and appends a second batch into existing context frames without a second note.
- Root's actual `/tmp/buildrick-color-picker-v2-layout.json` (209 items) executes through the mocked renderer with zero item errors and all three Shade/Hue/Opacity canvas models. Root independently confirmed the reader executed in the browser with no capture warnings.
- The minified renderer executes the same actual-data mock with zero item errors.

These are logic/schema-shaped mock checks, not live Plugin API acceptance or visual parity. Root still needs to render and compare screenshots.

## Fidelity boundaries

Native boxes, editable text, inline/data-URI SVGs, supported linear/radial gradients, and source-specific ColorPicker canvas models are reconstructed. Multiple CSS paint layers become explicitly ordered native rectangles. Context groups preserve opacity and nested z-order.

Warnings report unavailable font substitution, unsupported external/raster backgrounds, arbitrary canvas, cross-origin iframes, repeated SVG backgrounds, unsupported pseudo layout, conic/repeating gradients, gradient size/interpolation syntax, top-layer ordering, filters/blending/3D, floats and clip paths. Pseudo support is limited to empty absolute/fixed boxes with declared pixel dimensions and translation transforms. CSS background SVGs with mixed gradient layers, rounded ancestor clipping, arbitrary rotations/skews, native-control appearance, and complex inline/float paint ordering require manual comparison. The helper is not a browser rendering engine and makes no pixel-perfect claim.

ColorPicker models are source-specific: they use measured live knobs and the existing Hue/Shade/Opacity implementation. Unsupported canvases are not guessed or rasterized. No image UI is flattened into screenshots.

Official Plugin API references: https://developers.figma.com/docs/plugins/api/Paint/ ; https://developers.figma.com/docs/plugins/api/TextNode/ ; https://developers.figma.com/docs/plugins/api/properties/nodes-fills/ .

## React text-node correction

Root's Brand capture showed `Live preview` and ` · Home` as two source text nodes in one nowrap ellipsis span. Earlier v2 expanded both ranges to the same parent box. The reader now selects the complete text content once for text-only ellipsis containers (no element children, React comments permitted). A regression fixture asserts one `Live preview · Home` record with source ellipsis retained. Existing captures require recapture or the root's documented correction; updating the helper does not rewrite old JSON or native frames. Mixed element/text ellipsis containers are outside this consolidation rule and still require visual review.

Renderer font selection now tries available `Tinos` for `Times New Roman`/`Times`, and available `Arimo` for `Arial`, before the generic fallback. Exact available source fonts retain precedence. Substitutions are still warnings, not claims of exact font identity. Mock checks cover aliases present and absent. Root reported eight live Brand renders accepted with zero errors before this narrow correction; this helper agent made no live Figma call.
