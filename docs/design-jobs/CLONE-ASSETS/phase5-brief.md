# Assets · Clone Phase 5 — Site fonts — agent brief

Source: Figma page `Editor v1 Clone` (3397:13062): the QA reference `3721:43423`
"Fonts round trip" (section `3721:43068`), and five overlays in the scrimmed-dialog
section `4184:26629` — `3686:42317` Site fonts · `3695:45594` Font added ·
`3695:45606` No fonts found · `3721:43084` Typography · Choose heading family ·
`3721:44821` Typography · Brand inspector font picker. Plus the two Phase-1/2 rows
left `drift-open` for this phase: `3696:21550` (rail: Manage font) and `3705:21059`
(list · font checked: Manage font). Everything is CACHED — **never call Figma**
(≈136 calls spent today of the 200 shared cap):

- Prototype edges: `docs/design-jobs/CLONE-ASSETS/reactions-p5.json` (`sizes` = frames
  by index, `sigs` = `"control|TRIGGER|action @indices"`).
- Screenshots (1024-wide renders of 1440×900 frames): `docs/design-jobs/CLONE-ASSETS/shots/`
  `3686-42317.png`, `3695-45594.png`, `3695-45606.png`, `3721-43084.png`,
  `3721-44821.png`, and Phase 1's `3696-21550.png` (the rail for a woff2).
- The QA text (verbatim from the file):
  > Prototype fixture: built-in Inter is always available. Enabling Inter-Var.woff2
  > adds a separate uploaded source; it does not replace the built-in family.
  > Test: heading Family → Manage site fonts → Add font → Done → choose Uploaded
  > Inter → reopen Family. The selected source and uploaded availability persist
  > during the prototype session. … Brand inspector uses a separate font-source
  > variable. Choose Uploaded here, reopen and check it persists; the Heading
  > inspector retains its own selection.

## Ground rules (founder decisions, grilling 2026-09-13 — same as Phases 1–4)

- **Clone wins** over the V1 board it re-draws; where two Clone frames disagree the
  LATER section wins. **Behaviour → code contract; visual/copy → the board.** The
  Clone's "Heading font" / "Brand inspector font" dialogs are the PROTOTYPE'S stand-in
  for a picker (three buttons and Cancel); the code's Typography picker is a dropdown
  with groups and stays one — what conforms is what it OFFERS and the door it carries.
- **Density 32**; modals: title 16/600, body 13 ink-soft, buttons 32, gap 8, radius
  token, width 640 (the shots' 455px at 0.711). `components/libraryModal.ts` holds the
  shared modal sizing — reuse it (`MoveAssetsModal.tsx`, `StockSavedModal.tsx`,
  `ImportResultModal.tsx` are finished Clone-style modals to copy the shape of).
- **No backend.** `media.updateAsset` accepts `userMetadata: record` and `listAssets`
  returns the row — Phase 3's tags ride on it (`MediaManager.updateAsset` mirrors
  `tags` → `userMetadata.tags`; `BuildrikSyncProvider` reads it back). The site-font
  flag rides the SAME slot: `userMetadata.siteFont`. **Merge, never replace** — the
  server writes `userMetadata` wholesale, so the patch must carry `{ tags, siteFont }`
  together (read the current asset's tags when writing siteFont and vice versa).
- Chrome rules: `@/editor/chrome-ui` only (`ModalRoot` / `ModalContent` / `ModalTitle` /
  `ModalBody`, `Button`, `TextInput`/`TextField`); no raw form elements (Gate 24);
  no hex / raw shadow; `tw:` utilities not new CSS (the styling ratchet refuses
  growth); `--bk-*` tokens; two-class selectors when overriding a flowbite Button.
- Tests: Vitest + RTL, co-located `__tests__/`; fixtures in
  `packages/editor/src/editor/media/__tests__/libraryFixture.tsx`. Failing test first.
  Rewrite any test protecting displaced copy in the same commit, naming the Clone node.
- Run before every commit: `npx vitest run <your suites> && npx tsc --noEmit` from
  `packages/editor`, plus `pnpm run gate:styling-ratchet` and the Gate-24 script.
  Commit per journey: `J-<nodeId>: implemented — <what>`. No dev servers, no browser.
- Never touch `packages/editor/src/editor/shell/AquibraStudio.tsx` (the founder's
  uncommitted edits — new plumbing goes through `StudioPanels.tsx` or a composer
  event) or `packages/editor/scripts/baselines/ssot.json` (a gate rewrites it — restore,
  never commit).

## The model (decided — build to this)

Today every font file in the library is auto-registered with the `FontManager`
(`Composer.initialize`, Phase 1) and the Typography picker offers it. The Clone's
model is two-step: **uploaded** (the file is in the library) → **added** (it is a site
font the pickers offer). `Add font` in Site fonts is the step; "Existing text is
unchanged until you choose this font."

- `MediaAsset.siteFont?: boolean` (shared type) — true once added. Persisted locally
  (IndexedDB, like every asset field) and mirrored as `userMetadata.siteFont` with the
  same `updateAsset` patch Phase 3 gave tags; read back on import.
- `Composer.initialize` registers ONLY fonts with `siteFont === true` (at init, on
  add/update when the flag turns on, unregister when it turns off or the asset is
  deleted). `composer.fonts.getAllFonts({ source: "custom" })` is therefore the
  list of ADDED site fonts — the pickers and the export read that, nothing else.
- The doors into Site fonts all emit one composer event `ui:site-fonts` with an
  optional `{ assetId }` (the font to scroll to / highlight). The modal is mounted
  ONCE in `StudioPanels.tsx` and listens; nothing new threads through AquibraStudio.

## Copy on the shots (shape = contract)

- **Site fonts** (3686:42317, 640): title `Site fonts` · `Manage this site's fonts.
  Built-in Inter stays available.` · a search field (`Search fonts`) · section label
  `Uploaded fonts` · one card per font FILE in the library: `<Family> · <file.woff2>`
  (13/600) · sample `The quick brown fox jumps over the lazy dog.` rendered IN that
  font (so the file must be loadable for the sample — load it for preview even before
  it is added, e.g. a scoped FontFace the modal owns and drops on close) · `Add font`
  (primary) — for a font already added the card reads `Added` (muted) with a
  secondary `Remove` (the code's undo; the Clone draws none) · footer `Cancel`. Empty
  library: `No uploaded fonts yet. Upload a .woff2, .woff, .ttf or .otf file to the
  Asset library to add it here.` (the code's own accepted list — say the real one).
- **Font added** (3695:45594, 640): title `Font added` · `Uploaded <Family> is now
  available in the font pickers. Existing text is unchanged until you choose this
  font.` · `Done` (primary, closes everything) · `Manage site fonts` (back to the
  Site fonts dialog).
- **No fonts found** (3695:45606, 640): the search's no-match state is its own
  dialog: title `No fonts found` · `No fonts match "<query>". Clear the search to
  browse available fonts.` · `Cancel` · `Clear search` (primary → Site fonts with the
  query cleared). Type-ahead: switching to this dialog happens when a query has no
  match (debounce or on Enter — say which).
- **Typography · heading family** (3721:43084) — what the picker OFFERS: the built-in
  families (`Inter · Built in` in the prototype; the code's preset groups), an
  **`Uploaded`** group listing the ADDED site fonts (`Inter Variable · Uploaded`), and
  a `Manage site fonts` row at the foot of the dropdown (→ `ui:site-fonts`). Choosing
  an uploaded family applies it like any other and the dropdown reads it back.
- **Brand inspector font** (3721:44821): the Brand panel's font-family TOKEN
  (`TokenDetailView.tsx`, `token.type === "font-family"`, today a free text field)
  gets the same picker (presets + Uploaded + Manage site fonts) — the text field stays
  for a custom stack, the picker sits beside/above it. The chosen family is the
  token's value; the Typography picker keeps its own (they are separate variables —
  the QA's point).
- **Rail · woff2** (3696:21550 / 3705:21059): the actions read `Manage font · Rename
  · Delete` — `Manage font` opens Site fonts with THIS file highlighted; the rail's
  meta line gains the state: `Site font · added` / `Uploaded · not added`.
- **Drawer footer** (3437:36027): the `Aa Fonts` door after `Icons` → `ui:site-fonts`.
- **Export** (BLOCKERS C4, second half): a published/exported page whose CSS or site
  font tokens use an ADDED site font's family carries a `@font-face { font-family:
  "<Family>"; src: url("<server url>") format("woff2"|"woff"|"truetype"|"opentype");
  font-display: swap; }` block in `<style>`/`styles.css`, before the Google links; a
  font whose only URL is a session `blob:` (never reached the server) is skipped with a
  console warning the export surfaces the way it surfaces other asset problems (read
  `ExportEngine.ts` / `ExportHelpers.ts` `googleFontsHeadLinks` and follow the same
  shape). `AssetBundler` already collects `@font-face url()`s for the ZIP.

## Work split (files owned — stay inside yours; a shared file gets the smallest edit)

| agent | journey | owns |
|---|---|---|
| F | Site fonts · Font added · No fonts found · the model · the doors | new `media/components/SiteFontsModal.tsx` (+ the Font added / No fonts found states or sibling files), `shell/StudioPanels.tsx` (mount + `ui:site-fonts`), `media/components/AssetDetailsPanel.tsx` (Manage font, state line), `sidebar/tabs/media/components/SlimLauncher.tsx` (Aa Fonts), `shared/types/media.ts` (`siteFont`), `engine/media/MediaManager.ts` (mirror `{tags, siteFont}`), `services/AssetUploadService.ts` + `services/BuildrikSyncProvider.ts` (patch / read-back), `engine/Composer.ts` (gate registration on `siteFont`), `sidebar/tabs/media/hooks/useLibraryState.ts` + `data/mediaTypes.ts` (`setSiteFont(key, on)`), `media/LibraryManager.tsx` (wiring only) |
| P | the two pickers | `inspector/sections/typography/FontPicker.tsx`, `FontPickerDropdown.tsx`, `index.tsx`, `design-system/ui/sections/TokenDetailView.tsx` (+ a small `FontFamilyPicker` if the dropdown needs a token-shaped host), their tests |
| E | export `@font-face` | `engine/export/ExportEngine.ts`, `ExportHelpers.ts`, `engine/fonts/FontManager.ts` (a `fontFaceCSS(families)` reader if one is needed — pure, no registration change), their tests |
| main | Figma cache, merges, live walk, boards.json, BLOCKERS C4, report | — |

Contracts between you (do not wait on each other — build to these):
- `composer.fonts.getAllFonts({ source: "custom" })` → `CustomFont[]` with
  `family`, `variants[0].url` (the file's url), `id = "library-<slug>"`. That list is
  the ADDED site fonts (F gates it; P and E read it).
- `composer.emit("ui:site-fonts", { assetId?: string })` opens Site fonts (F listens
  in StudioPanels; P's `Manage site fonts` rows and F's own doors emit it).
- `MediaAsset.siteFont?: boolean` (F adds it to `shared/types/media.ts`).

## Report format (end of your work)

```
Branch: <name>   Commits: <n>
Screens: <id> match | drift-fixed | drift-open (<why>) | blocked:<reason>
Contradictions decided: <which frame won, why>
Tests: <files> green, tsc clean
data-testids added: <list — the live walk drives them>
Not done / needs the live walk: <list>
```
