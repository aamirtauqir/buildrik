# Phase 4 — AS-IS frames 11–35 fidelity pass

Date: 2026-10-10. Completed the assigned correction pass on the existing 25 frames, preserving captured application states. No app, test, browser, prior design page, or frame 36+ was changed during this pass. This report supports central Phase 4 review; it does not independently certify the whole gate or pixel equality.

## Verified scope

All frames remain 1280 × 720 on [AS-IS page 8280:2](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8280-2). All 25 received source-layout inspection, native typography correction and final node readback. Eighteen Figma renders were visually inspected. Seven had a direct saved-browser comparison: Brand colors, color picker, template gallery, template preview, New page, Export and Keyboard shortcuts.

| Frames | IDs | Evidence level |
|---|---|---|
| 11 CMS record; 12 CMS fields | `8286:2`, `8286:272` | Both source/native checked; record render inspected |
| 13 Brand colors; 14 picker; 15 typography; 16 spacing | `8286:511`, `8286:733`, `8286:985`, `8286:1160` | All source/native checked; colors and picker browser/render compared |
| 17 Site menu; 18 Settings General | `8286:1357`, `8286:1613` | Both renders inspected; Site menu stacking restored |
| 19 History Session; 20 Saves | `8290:2`, `8290:178` | Both source/native checked; Session render inspected |
| 21 Notifications; 22 Issues; 23 Activity; 24 Command palette | `8290:364`, `8290:660`, `8290:862`, `8290:1033` | All source/native checked; Notifications, Issues and Command renders inspected |
| 25 Publish; 26 selected-heading AI | `8290:1233`, `8290:1463` | Both renders inspected; existing clipping/content retained |
| 27 Templates gallery; 28 template preview | `8290:1629`, `8290:1811` | Both browser/render compared; existing eight gallery image fills preserved |
| 29 Components manager; 30 Desktop preview; 31 Mobile preview; 32 Page Inspector | `8290:1952`, `8290:2250`, `8290:2518`, `8290:2797` | All source/native checked; both preview renders inspected |
| 33 New page; 34 Export; 35 Keyboard shortcuts | `8290:3051`, `8290:3332`, `8290:3619` | All browser/render compared; modal content/geometry present |

## What changed

- Removed blanket native `ENDING` truncation from 1,843 captured text nodes. Single-line browser labels then needed native intrinsic-width measurement: 741 widths were adjusted to prevent invented wrapping. Source positions, font sizes, recorded tracking and multi-line constraints remain. Genuine page tabs retain their source-defined 120px ellipsis limit (`shell/PageTabBar.tsx:155`). This corrects examples such as “Templat…”, “Page templat…” and “⌘…” without changing their labels.
- Reapplied 196 nontransparent measured CSS shadow stacks, including focus/selected borders, popovers and floating panels. Source values are retained in the input evidence. Transparent stacks were not made visible.
- Corrected paint order for four overlays: Brand picker, Notifications, Command palette and Site menu. Their content existed in the native tree but was painted underneath later canvas/panel nodes. The complete captured overlay ranges now sit above that content with the original positions and clipping.
- Restored five search SVGs above their input fills and 18 source-defined empty-image SVG glyphs. The latter use the exact placeholder geometry from `canvas/Canvas.css:89–104` and do not replace missing user media.
- Added the missing white small-toggle thumbs in New page (on) and CMS record (off). Existing 36 × 20 tracks and state colors are unchanged; 16 × 16 thumbs follow the installed Flowbite `ToggleSwitch` small-size theme, including its 2px inset and checked translation.
- Restored native iframe content in four Brand states at 50% and Export at one-third scale: yellow page background, two headings and paragraph. Fresh parent-owned iframe geometry exactly matches the original frame coordinates. Original iframe/ancestor clipping is retained.
- Restored the template hero’s measured 135° gradient with native gradient vectors, preserving the 976 × 531 iframe viewport and clipping the full section at its actual viewport boundary. White text is visible again.
- Recreated the picker Shade, Hue and Opacity canvases as native gradient vectors at their measured bounds. `design-system/ui/colors/ColorPicker.tsx:39–94` supplies the drawing algorithm; the measured shade is 248 × 120, hue 248 × 8, and opacity display 204 × 8 from a 248 × 8 canvas. Checkerboard scaling and existing knob positions are preserved. The captured token remains `#1A56DB`.

Paths above are relative to `src/editor/`. No unsupported controls or new behaviors were added.

## Browser comparisons and limits

| State | Browser evidence | Corrected native render | Assessment |
|---|---|---|---|
| Brand colors | [Reference](evidence/figma-11-35-brand-browser.png) | [Render](evidence/figma-11-35-brand-after.png) | Current live preview restored; observed awkward header button wrapping retained |
| Color picker | [Reference](evidence/figma-11-35-color-picker-browser.png) | [Render](evidence/figma-11-35-color-picker-after.png) | Gradient canvases, clipping, token value, knob positions and overlay order reproduced |
| Gallery | [Reference](evidence/figma-runtime-captures/buildrick-template-gallery-reference.png) | [Render](evidence/figma-11-35-templates-after.png) | Full titles/count restored; eight thumbnails retained; small body-wrap differences remain |
| Template preview | [Reference](evidence/figma-11-35-template-preview-browser.png) | [Render](evidence/figma-11-35-template-preview-after.png) | Gradient and serif/sans distinction restored; font fallback and baseline differences remain |
| New page | [Reference](evidence/figma-11-35-new-page-dialog-browser.png) | [Render](evidence/figma-11-35-new-page-after.png) | Dialog bounds, options and on-toggle match; fresh selected-input text/focus treatment differs from original capture |
| Export | [Reference](evidence/figma-11-35-export-browser.png) | [Render](evidence/figma-11-35-export-after.png) | Current iframe preview restored; disabled-option tone remains an ancestor-opacity reconstruction limit |
| Shortcuts | [Reference](evidence/figma-11-35-shortcuts-browser.png) | [Render](evidence/figma-11-35-shortcuts-after.png) | Shortcut labels remain complete and monospace; bottom rows retain captured viewport clipping |

Fresh modal references have a changed underlying canvas zoom (88% versus the original 100%) and page-padding state. Those underlying application values were not copied into the older frames; comparisons assess the unchanged dialogs. The current source fonts Times New Roman/Times and Arial are unavailable in Figma, confirmed by failed direct font loading. Ten template-iframe text nodes use explicitly documented Tinos/Arimo fallbacks; these are not represented as exact font matches.

The original reader did not serialize all CSS overflow, inherited opacity, pseudo-elements or stacking contexts. Long Publish/Issues text and some narrow multi-line descriptions still warrant comparison using the newer reader; this pass does not claim every overflow is pixel matched. Saved render checks for [Notifications](evidence/figma-11-35-notifications-after.png), [Command palette](evidence/figma-11-35-command-after.png) and [Site menu](evidence/figma-11-35-site-menu-after.png) confirm the restored overlays are visible, but these three did not receive new browser screenshots in this pass.

Development-only Next.js indicators and the Agentation feedback toolbar are not consistently reconstructed across the old full-workspace captures. The floating black sparkle control identified by `data-feedback-toolbar` is development feedback UI, not the product AI panel. These exclusions must not be described as missing product AI functionality.

## Durable evidence

- [Source correction inputs](evidence/figma-11-35-fidelity-inputs.json), [typography ledger](evidence/figma-11-35-typography-ledger.json), [single-line measurements](evidence/figma-11-35-single-line-ledger.json).
- [Shadows and toggle ledger](evidence/figma-11-35-shadows-thumbs.json), [content/overlay node ledger](evidence/figma-11-35-content-ledger.json).
- [Font availability](evidence/figma-11-35-font-availability.json), [explicit fallbacks](evidence/figma-11-35-font-fallback.json).
- [Final 25-frame readback](evidence/figma-11-35-final-readback.json): all frame parents/dimensions preserved, zero native `ENDING` nodes, existing gallery image fills retained. The typography operations returned zero errors.
- Captured iframe/gradient geometry and five fresh browser PNG references are saved under `evidence/figma-11-35-*`; six pre-correction screenshots are retained alongside final renders.

The scoped correction work is complete. Remaining fidelity limits above are disclosed for central review; application defects and Phase 5 design decisions remain separate.
