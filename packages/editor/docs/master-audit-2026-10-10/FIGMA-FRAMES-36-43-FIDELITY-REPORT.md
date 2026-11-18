# Phase 4 — AS-IS frames 36–43 fidelity pass

Date: 2026-10-10. Scope is the eight existing `8293:*` AS-IS screens on page `8280:2`. All eight saved browser screenshots were visually compared with their native Figma renders. Application state, values and observed product defects were preserved. No application/browser changes, later-frame edits or TO-BE design changes were made.

## Corrections

- Corrected 659 text nodes that had blanket native `ENDING` truncation. Applied measured source tracking and line heights, retained real 120px page-tab ellipsis, and accommodated intrinsic native width on 269 single-line labels to prevent new wrapping.
- Reapplied 99 nontransparent recorded shadow stacks, restored eight source-defined empty-image SVG glyphs, and placed eight captured search icons above their input fills.
- In SEO, Social and Advanced, moved only the recorded topbar node range above the modal backdrop. Browser references show a white topbar while the application body is dimmed. The modal stays visible and its original 560 × 520 position, clipping and content remain.
- Restored the two invisible placeholders: the old color parser did not support recorded `oklab(0.210081 -0.00294439 -0.0316202 / 0.5)` and emitted fully transparent paint. Native paint now represents its equivalent `#111827` at 50% opacity. The Advanced textarea placeholder is positioned at the source-defined top padding, correcting the old generic-input vertical-center calculation. Labels remain “One sentence about this page” and `<!-- analytics, meta tags, fonts -->`.
- Restored two Advanced indexing-toggle thumbs, following the installed Flowbite medium theme: 44 × 24 track, 20 × 20 white thumb, 2px inset and checked translation. Both captured controls remain on.
- Restored the three white checked glyphs in Image Behaviour. Their checked states are directly visible in the browser reference; the native vector paths are an explicitly recorded visual approximation, not an exact extraction of the CSS background SVG.

Source evidence: `src/editor/canvas/Canvas.css:89–104`; `src/editor/shell/PageTabBar.tsx:155`; `src/editor/sidebar/tabs/pages/page-settings/SeoTab.tsx:365–370`; `AdvancedTab.tsx:60–94`; installed `node_modules/flowbite-react/dist/components/ToggleSwitch/theme.js` and `Textarea/theme.js`; measured `/tmp/buildrick-*-layout.json` records. Original viewport captures are retained in the audit evidence directory.

## Comparisons

Every pair below is 1440 × 900. The table states the captured state, not a runtime correctness claim.

| Frame | Browser reference | Corrected native render | Preserved state / comparison |
|---|---|---|---|
| 36 `8293:2` Heading Style | [Browser](evidence/figma-36-43-heading-wide-browser.png) | [Figma](evidence/figma-36-43-heading-wide-after.png) | Heading controls, 36px / 1.2 / 700, selected H2, spacing values preserved |
| 37 `8293:373` Image Style | [Browser](evidence/figma-36-43-image-wide-browser.png) | [Figma](evidence/figma-36-43-image-wide-after.png) | “No file yet”, image placeholder, 80px height and 100% maximum width preserved |
| 38 `8293:734` Image Behaviour | [Browser](evidence/figma-36-43-behaviour-wide-browser.png) | [Figma](evidence/figma-36-43-behaviour-wide-after.png) | Static binding and Desktop/Tablet/Mobile checked; interaction and CSS-class controls retained |
| 39 `8293:994` Image Effects | [Browser](evidence/figma-36-43-effects-wide-browser.png) | [Figma](evidence/figma-36-43-effects-wide-after.png) | Collapsed effects groups and current Cursor/Blend summary retained |
| 40 `8293:1239` Page Inspector | [Browser](evidence/figma-36-43-page-wide-browser.png) | [Figma](evidence/figma-36-43-page-wide-after.png) | Page fill, selected root, empty max-width, typography and spacing retained |
| 41 `8293:1528` Page SEO | [Browser](evidence/figma-36-43-page-seo-browser.png) | [Figma](evidence/figma-36-43-page-seo-after.png) | White topbar, Home slug/title, 4/60 too-short indicator, description placeholder and indexed state |
| 42 `8293:1858` Page Social | [Browser](evidence/figma-36-43-page-social-browser.png) | [Figma](evidence/figma-36-43-page-social-after.png) | White topbar, 1200 × 630 empty preview, Home card and clipped lower form retained |
| 43 `8293:2168` Page Advanced | [Browser](evidence/figma-36-43-page-advanced-browser.png) | [Figma](evidence/figma-36-43-page-advanced-after.png) | White topbar, Live visibility, both indexing switches on, custom-head placeholder retained |

## Remaining reconstruction limits

Small native font-baseline/wrapping differences remain. Some transient browser focus outlines and native select chevrons are absent from the older source extraction. The green spacing-token diamond is represented by its unrotated source rectangle, and small overlapping selection-tag text differs from browser compositing. These differences are not application changes. Development-only Next.js issue indicators are excluded; the floating Agentation feedback control is development UI, not the product AI panel.

No unsupported inspector state or design improvement was introduced. The report does not assert pixel equality or independently close the central Phase 4 gate.

## Readback and ledgers

- [Measured correction inputs](evidence/figma-36-43-inputs.json).
- [Primary change/readback ledger](evidence/figma-36-43-ledger.json): eight frames remain 1440 × 900 on `8280:2`; zero native `ENDING` nodes and zero operation errors.
- [Placeholder/toggle ledger](evidence/figma-36-43-extra-ledger.json).
- [Visibility-check ledger](evidence/figma-36-43-checks.json).
- [Final readback after all additions](evidence/figma-36-43-final-readback.json).
- Before renders retained for Heading, SEO, Social and Advanced alongside the final images.

This extends the comparison coverage documented in [frames 11–35](FIGMA-FRAMES-11-35-FIDELITY-REPORT.md). No application tests were run for this native Figma-only pass.
