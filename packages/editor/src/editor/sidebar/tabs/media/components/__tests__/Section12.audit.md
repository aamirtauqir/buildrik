# §12 ExpandedMediaPanel audit (prototype-v3 §12)

## Prototype intent
- Trigger: panel expansion 320 → 560px on upload
- Inner layout: folder tree (180px) + library area (380px) flex/grid split
- Library area: sort + format + grid-size controls + asset grid
- "Compact" button collapses back to 320

## Current state
- File: `ExpandedMediaPanel.tsx` (LOC: 358) + co-located `ExpandedMediaPanel.css` (LOC: 170)
- Inner layout: `<div class="exp-panel">` → `<header class="exp-panel__header">` + `<div class="exp-panel__body">` where `.exp-panel__body` is `display: flex; flex: 1; min-height: 0` (CSS line 83-87). Body contains the folder rail + library area side-by-side via flexbox row (no `grid-template-columns`).
- Folder tree present: **Y** — `<nav class="exp-panel__folders" aria-label="Folders">` at JSX line 216. CSS rule `.exp-panel__folders { width: 180px; ... flex-shrink: 0 }` (CSS line 91-97). Class is `exp-panel__folders`, NOT `med-folder-tree`.
- Library area present: **Y** — `<div class="exp-panel__library">` at JSX line 243, containing `<TypePills>` + `<LibraryView>` (which renders the sort/format/grid-size controls + asset grid). CSS rule `.exp-panel__library { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden }` (CSS line 164-170). Width is computed as remainder (560 outer − 180 rail − borders ≈ 380px), not hardcoded. Class is `exp-panel__library`, NOT `med-library-area`.
- Compact button present: **Y** — `<Button class="exp-panel__compact-btn">` at JSX line 181-190, label "Compact", `Minimize2` icon, `onClick={onCompact}`. Class is `exp-panel__compact-btn`, NOT `med-compact-btn`.
- CSS selectors for med-expanded-panel / med-folder-tree / med-library-area in `MediaTab.css`: **NONE** — `grep "med-folder-tree\|med-library-area\|med-compact-btn\|med-expanded-panel" MediaTab.css` returned zero matches. The §12 expanded panel uses the `exp-panel__*` namespace (BEM-style scoped to `ExpandedMediaPanel.css`), not `med-*`. `MediaTab.css` does contain `.exp-panel .med-type-pills` / `.exp-panel .med-sort-lbl` etc. (CSS line 525+) — these are overrides that re-skin the shared `.med-*` controls when rendered inside the expanded panel.
- 560px outer width: set externally by `LeftSidebar.tsx` (line 279, "§12 — assets tab supports runtime width override (320 ↔ 560)"), not by `.exp-panel` CSS itself. The component just fills its host.

## Gap

No gap. Task 19 test should pass on existing implementation; Task 20 may be skipped.

The prototype-v3 §12 intent — 320→560 expansion, 180px folder rail + ~380px library area inner split, Compact button collapse — is fully satisfied by the shipped `ExpandedMediaPanel.tsx` + `ExpandedMediaPanel.css`. The only deviation from the planning task's hypothetical naming is namespace: the spec guessed `med-folder-tree` / `med-library-area` / `med-compact-btn` / `med-expanded-panel`, but the actual implementation uses BEM-scoped `exp-panel__folders` / `exp-panel__library` / `exp-panel__compact-btn` / `.exp-panel` co-located in `ExpandedMediaPanel.css`. This is consistent with the Phase 0 SSOT extraction pattern (component owns its own CSS) and is preferable to scattering selectors back into `MediaTab.css`.

Task 19 (failing test) should assert against the **actual** selectors (`.exp-panel__folders`, `.exp-panel__library`, `.exp-panel__compact-btn`), with `getComputedStyle().width === '180px'` on `.exp-panel__folders` and presence checks on the library area + Compact button. The test will pass on first run, confirming §12 is shipped; no implementation work needed in Task 20.
