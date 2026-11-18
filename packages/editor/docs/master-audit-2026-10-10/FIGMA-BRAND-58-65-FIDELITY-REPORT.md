# Brand 58–65: independent AS-IS fidelity review

Reviewed 2026-10-10. All eight Brand views were compared at **1440 × 900** against the supplied running-app PNGs and layout JSONs, then screenshot-checked after their final relevant correction. These native frames are on AS-IS page `8280:2`, file `g4GzQFqzNYz5sosz1QtZXC`. No application code, browser state, original Figma pages, frames 66 onward, or same-origin preview iframe content were changed.

The final structural read confirms eight clipped 1440 × 900 frames with **zero image fills**. Native content remains editable. This review addresses the eight captured Brand states; it does not certify all Brand dialogs, responsive states, prototype behavior, or the complete Phase 4 gate.

## Frame evidence

| Frame | Native ID | Captured state and comparison | Final native screenshot |
|---|---|---|---|
| 58 | `8304:74` | Colour mode: Dark mode Off; disabled Dark preview; missing dark token values; live page at 50%; explanatory card | [Colour mode](evidence/brand-58-65-validation/figma-colour-mode.png) |
| 59 | `8304:308` | Styles: reusable list, type and component styles, current wrapped action controls, live page | [Styles](evidence/brand-58-65-validation/figma-styles.png) |
| 60 | `8304:505` | Component styles: Hero through Navbar, default appearances, live page | [Component styles](evidence/brand-58-65-validation/figma-component-styles.png) |
| 61 | `8304:690` | Classes: empty explanation and Add class action, live page | [Classes](evidence/brand-58-65-validation/figma-classes.png) |
| 62 | `8304:836` | Presets: category/variant-count list, complete subtitle, live page | [Presets](evidence/brand-58-65-validation/figma-presets.png) |
| 63 | `8304:1034` | Brand checks: 0 issues, Nothing to fix, Connect to tokens row, live page | [Brand checks](evidence/brand-58-65-validation/figma-brand-checks.png) |
| 64 | `8304:1184` | Starters: six presets with font/color descriptions, complete subtitle, live page | [Starters](evidence/brand-58-65-validation/figma-starters.png) |
| 65 | `8304:1357` | Import/export: dark strategy; CSS/JSON/Tailwind actions; dashed import target; token counts; clipped CSS preview | [Import/export](evidence/brand-58-65-validation/figma-export.png) |

Corresponding browser images and layout JSONs are retained in [brand-58-65-validation](evidence/brand-58-65-validation/), named `buildrick-brand-{state}-v2.png` and `buildrick-brand-{state}-v2-layout.json`. [Final structural/mutation evidence](evidence/brand-58-65-validation/native-final-structure.json) records exact affected IDs. The supplied browser captures were read only; this reviewer did not drive the browser.

## Evidence-backed reconstruction corrections

1. **Seven overlapping live-preview captions.** The extraction gave `Live preview` and ` · Home` the same parent-span bounds and origin. Native Figma therefore overprinted both strings. Combined each into `Live preview · Home` and hid the duplicate text node without deleting it. The source uses one caption span in `src/editor/design-system/ui/BrandLivePreview.tsx:181–186`, supporting the screenshot. The iframe's yellow page background, two headings, and body text were already represented and were preserved.
2. **Two AI action wraps.** Styles and Component styles now show the captured first line `✦ Generate with` and second line `AI`, centered in the existing button. The current runtime action is visibly taller than its button; that awkward state is preserved rather than redesigned. Review changes and Restore points also retain the captured wrap.
3. **Two incorrect subtitle ellipses.** Presets and Starters had complete underlying text but native bounds truncated it sooner than the browser. Restored intrinsic text width without changing copy. The complete subtitles fit the available header space in both captures.
4. **Export outer card/title geometry.** The browser PNG shows card top **8**, title top approximately **24**, and close icon top **25**. The matching layout JSON records card top **40**, title top **56**, and close icon top **57**, while the dark-strategy row and all following export/import/preview rows agree with the PNG. Matched the visible screenshot by extending only the outer card upward and moving only title/close upward 32 pixels. The card bottom stays approximately 622. This is a recorded disagreement between evidence artifacts; animation or capture timing was not proven and is not asserted as the cause.
5. **Export code clipping and blank line.** The native code had its leading newline rendered as an extra blank line and was clipped to the whole outer card rather than its `pre` viewport. Removed that leading layout-only blank line in the Figma text, retained the generated CSS content, and narrowed the existing clip frame to the code box interior: x499, y513.5, 698 × 77.63. The screenshot now shows the two visible code lines within the code panel. Source `ExportSection.tsx:60–63` explicitly uses `overflow-auto` and `whitespace-pre`; horizontal overflow is intentionally represented by clipping, not wrapping or deleting the CSS.
6. **Export dashed import boundary.** Restored a native `[3,3]` dash pattern for the import target; the captured computed borders are 1-pixel `dashed`. Exact browser dash distribution/rasterization can differ slightly.
7. **Export select chevron.** Restored the exact Flowbite SVG path from the captured `Preview format` background image (`m1 1 4 4 4-4`, stroke `#6B7280`, width2). Its native size and placement follow the captured 9 × 9 CSS background, right12px/center. The capture's warning explicitly says four-value SVG background positioning was unsupported; the missing caret was an extraction limitation.

Total: **24 existing nodes changed**, including seven duplicate caption nodes hidden; **two native nodes created** for the select SVG (`8306:241556`, child `8306:241557`). No nodes were deleted. Before screenshots for Brand checks, Starters, and Export remain in the evidence folder.

## Preserved conditions and limits

- All eight final screenshots preserve the measured navigation rail, list/card geometry, selected states, current text, empty Classes state, zero-checks result, disabled dark preview, and live page content. The review does not prove the checks are semantically exhaustive or that disabled controls become available correctly.
- The black lower-right Agentation control remains a captured development-tool overlay, not a proposed product feature. The Next.js development badge remains omitted under the existing reconstruction policy.
- Small browser/Figma glyph baselines, font rasterization, chevron rendering, and border rasterization differ. No pixel-perfect claim is made. The visible export/header discrepancy is resolved to the PNG for this snapshot; an independent future runtime capture may settle its cause.
- Frames 58–65 are static current-state reconstructions. No import, download, clipboard action, AI generation, style application, Starter application, dark-mode mutation, check execution, or save operation was run during this review. No live interaction or durable persistence result is inferred from a screenshot.
- Native editability and zero image fills do not by themselves establish reusable components or responsive Auto Layout. Those requirements remain in the separate component-library and Phase 4 acceptance evidence.
