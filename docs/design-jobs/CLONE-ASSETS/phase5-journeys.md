# Assets · Clone Phase 5 — Site fonts — walk log

Brief: `phase5-brief.md` (the decided model: uploaded → added). Graph:
`reactions-p5.json`. Shots: `shots/3686-42317.png`, `3695-45594.png`,
`3695-45606.png`, `3721-43084.png`, `3721-44821.png`. Figma calls this phase:
1 census/graph + 1 graph + 5 shots (≈136 today).

## Live env

Same as Phase 3 (`phase3-journeys.md` § Live env). Site `scratch-ver` holds two
library files both named `Inter-Var.woff2` (Phase 1's uploads) — which is how
the file-name collision below was found.

## Work split

| agent | journey | files owned |
|---|---|---|
| F | Site fonts · Font added · No fonts found · the `siteFont` model · the doors (rail Manage font, drawer Aa Fonts, `ui:site-fonts` mounted in StudioPanels) | `SiteFontsModal.tsx`, `StudioPanels.tsx`, `AssetDetailsPanel.tsx`, `SlimLauncher.tsx`, `Composer.ts`, `MediaManager.ts`, `shared/types/media.ts` |
| P | Typography picker (Uploaded group + Manage site fonts foot) · Brand font-family token picker | `FontPicker*.tsx`, `FontFamilyPicker.tsx` (new), `TokenDetailView.tsx` |
| E | export `@font-face` (both paths, ZIP), Google kept off site-provided families | `ExportEngine.ts`, `ExportHelpers.ts` |
| main | merges, Quick-preview head + sanitizer, live walk, boards.json, BLOCKERS C4, report | — |

## Drift table

| screen | verdict | note |
|---|---|---|
| 3686:42317 Site fonts | drift-fixed | 640; title · body · search · `Uploaded fonts` · cards `Inter Var · Inter-Var.woff2` with the sample sentence set in a preview FontFace (loaded, measured) · Add font / Added + Remove · Cancel; the door's file highlighted (accent border). FOUND: the not-added duplicate file unregistered the added family (keyed by file name); concurrent registrations stacked two FontFaces — both fixed; live-3686-42317 |
| 3695:45594 Font added | drift-fixed | copy per brief; Done closes all; Manage site fonts returns with the card reading Added + Remove; `media.updateAsset` 200, `listAssets` row `siteFont:true`, registers after reload; live-3695-45594 |
| 3695:45606 No fonts found | drift-fixed | Enter over a no-match query swaps the dialog; Clear search returns with the query cleared; live-3695-45606 |
| 3721:43084 Typography · Choose heading family | drift-fixed | dropdown kept (code contract); Uploaded group with the added font in its own face + `UPLOADED` slot, `Manage site fonts` foot → dialog; pick → heading `"Inter Var", sans-serif`, trigger `data-font-source=uploaded`; survives reload. FOUND: panel opened 165px above the trigger (abspos static position in a centred flex row) → `top-full`; live-3721-43084 |
| 3721:44821 Typography · Brand inspector font | drift-fixed | Pro mode → Tokens → type → Heading Font: the same panel above the text field; pick writes `Inter Var` (bare family) to the token, separate from the Typography selection. FOUND: the panel took the 163px value column and clipped its category tabs → 240 floor off the column's right edge; live-3721-44821 |
| 3696:21550 / 3705:21059 Manage font (rail) | drift-fixed (closed) | `Manage font · Rename · Delete`, meta `Site font · added · WOFF2` / `Uploaded · not added · WOFF2`; Manage font → dialog with the file highlighted; Remove → `Uploaded · not added`, the picker's Uploaded group gone (`getAllFonts custom = 0`); live-3696-21550 |
| 3437:36027 drawer footer | drift-fixed | `↑ Upload · Stock · Icons · Aa Fonts` on one row (61–338 measured, no overflow); Aa Fonts → dialog |
| C4 export | drift-fixed (code) | `exportHTML().combined` carries `@font-face{font-family:"Inter Var";src:url("https://…blob…woff2") format("woff2")…}`; Quick preview's sandboxed frame fetched the Blob `.woff2` (200 in the network log) with the face and the full stylesheet in its srcdoc. FOUND: the preview sanitizer dropped the WHOLE sheet over the face's `url()`; the family scan stopped at the `;` inside `&quot;` — both fixed |
| 3721:43423 QA reference | out-of-scope | text in the brief |

## Notes

- **Contradictions decided:** Done is primary and the copy says "font pickers" (both pickers offer the font) — brief over the shot's grey Done / "heading font picker"; the search line is a real field; the prototype's 3-button picker dialogs are stand-ins, the dropdown stays (what it offers conforms); a card border so several files separate and the door's file can carry the highlight; straight quotes.
- **Found on the walk, fixed (7):** file-name collision unregistering the added family; stacked FontFaces; Quick preview sheet dropped by the sanitizer; `&quot;`-quoted inline families never scanned; picker panel above its trigger; Brand token panel clipped; Google links for a family the site's own font provides (E's flag).
- **Open / known:** Remove leaves the session's FontFace in `document.fonts` (`deleteFont` never removed faces — pre-existing; the pickers and the export read the FontManager, not `document.fonts`); no Escape/outside-click close on the pickers (parity with before); `cssStyle: "inline"` export drops every `<style>` (pre-existing); a second browser that cached the row before `siteFont` was set keeps the stale row (same limit as tags/name).
- **Not verified:** a real cPanel deploy serving a page with an added font (same `exportAllPages` output as the ZIP/publish path); the Brand token pick was not saved (Save bar left unsaved on the scratch site).
- Tests: 258 files / 3082 green across `src/engine`, `src/editor/export`, typography, design-system (+ the media/shell/services suites: 408 files / 4789 at merge); `tsc --noEmit` clean; `verify:ds` exit 0.
