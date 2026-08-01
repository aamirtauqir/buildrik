# Editor styling audit — how much is actually on flowbite/chrome-ui

Generated 2026-08-01, branch `main`. Every number below is reproducible with the
commands in the last section. Question asked: "sara editor kya ab flowbite use kar raha hai?"

Short answer: **no**. Flowbite won many controls. The rest of the chrome is still
style-prop driven — and not only for layout: borders, backgrounds, typography, hover
states, badges, pills, shadows and modal shells are still inline too.

This document was reviewed by Codex, which corrected four of the original numbers. The
corrections are marked inline; the largest was a 40% undercount of inline styling.

---

## 1. The component library itself

| | count | |
|---|---:|---|
| `src/editor/chrome-ui/*.tsx` total | 47 | |
| compose a flowbite-react primitive | 18 | 38% |
| hand-built, no flowbite at all | 29 | 62% |

Flowbite re-exported through the barrel: 14 names. Rendered across the app **936 times**,
but **802 of those are `Button`**. `Progress`, `Card`, `AvatarGroup`: zero uses.

## 2. Editor files (352 `.tsx`, excluding chrome-ui itself)

| | files | share |
|---|---:|---:|
| library only, no inline styles | 64 | 21% |
| library **and** inline styles | 186 | 61% |
| inline styles only, no library | 53 | 17% |
| no UI (logic/hooks) | 49 | — |

## 3. The inline-style question — this is the real finding

**Corrected after Codex review.** A first pass counted only literal `style={{ }}`
and reported 1573. That missed the hoisted pattern entirely:
`const rowStyles: React.CSSProperties = {...}` fed back through `style={rowStyles}`.

| | count |
|---|---:|
| literal `style={{ }}` | 1573 |
| **hoisted `style={ident}`** (missed by the first pass) | **1053** |
| **real total** | **2626** |

125 files declare `React.CSSProperties` consts. Codex independently produced 1053
for the hoisted count; a separate grep here matched it exactly.

Of the 1573 literal blocks, split by whether values are computed:

| | count | share | verdict |
|---|---:|---:|---|
| **dynamic** (drag position, measured size, conditional) | 472 | 30% | **correct** — CLAUDE.md explicitly allows this |
| **static** (literal values only) | 1101 | 70% | migratable to `tw:` utilities |

Spread over **191 files**. But note what is inside them: **5780 `var(--bk-*)` references**
against raw hex. Scope note: that 5780 conflated `.tsx` and `.css`. Correct split is
**2471 in `.tsx`** and **3075 in `.css`**.

But "token-driven" was too generous, and Codex was right to push back. Counting only hex
misses the other hardcoding: **216 `rgba()`/`rgb()` literals** and **120 `fontFamily:`
declarations** sit in editor `.tsx`. Font stacks and translucent overlays never went
through the token layer at all.

## 4. CSS files still styling chrome

30 files, **12,949 lines**, **3,075 `var(--bk-*)` refs**, only **44 hex literals**.
Same story: tokenized, just not Tailwind.

Largest: `sidebar/tabs/media/MediaTab.css` (1792), `inspector/styles/inspector.css` (1228),
`sidebar/tabs/history/styles/history.css` (1240), `sidebar/tabs/templates/TemplatesTab.css` (874),
`sidebar/tabs/pages/PagesTab.css` (830), `canvas/Canvas.css` (800).

## 5. Per-file table — top 60 by static-inline count

| static | dynamic | uses lib | tw: | file |
|---:|---:|:---:|---:|---|
| 34 | 1 | **NO** | 0 | `src/editor/components-catalog/ui/CatalogCard.tsx` |
| 28 | 4 | yes | 8 | `src/editor/design-system/ui/colors/ColorTokenList.tsx` |
| 25 | 3 | yes | 12 | `src/editor/sidebar/tabs/templates/components/TemplateUsageDrawer.tsx` |
| 24 | 1 | yes | 2 | `src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx` |
| 23 | 0 | yes | 3 | `src/editor/media/components/AssetDetailsPanel.tsx` |
| 21 | 18 | yes | 45 | `src/editor/sidebar/tabs/content/ContentViews.tsx` |
| 21 | 3 | yes | 0 | `src/editor/inspector/sections/SizeSection.tsx` |
| 21 | 4 | yes | 13 | `src/editor/export/ExportOptions.tsx` |
| 20 | 6 | yes | 43 | `src/editor/sidebar/tabs/pages/page-settings/SeoTab.tsx` |
| 20 | 2 | yes | 0 | `src/editor/design-system/ui/MigrationProgressModal.tsx` |
| 20 | 10 | yes | 20 | `src/editor/design-system/ui/type/TypeTokenList.tsx` |
| 20 | 2 | yes | 24 | `src/editor/design-system/ui/spacing/SpacingTokenList.tsx` |
| 20 | 1 | yes | 9 | `src/editor/media/VideoPreview.tsx` |
| 20 | 5 | yes | 5 | `src/editor/media/components/ReplaceAcrossModal.tsx` |
| 19 | 1 | yes | 3 | `src/editor/shell/modals/CommandPalette.tsx` |
| 19 | 2 | yes | 4 | `src/editor/design-system/ui/modals/ReviewModal.tsx` |
| 18 | 1 | yes | 0 | `src/editor/inspector/sections/BackgroundSection.tsx` |
| 16 | 2 | yes | 12 | `src/editor/design-system/ui/DesignSystemTab.tsx` |
| 15 | 6 | yes | 16 | `src/editor/design-system/ui/colors/ColorTokenRow.tsx` |
| 14 | 3 | **NO** | 0 | `src/editor/sidebar/tabs/pages/components/SearchListingsTable.tsx` |
| 14 | 1 | yes | 20 | `src/editor/shell/modals/CMSRecordsModal.tsx` |
| 14 | 2 | yes | 19 | `src/editor/export/ExportModal.tsx` |
| 13 | 2 | yes | 11 | `src/editor/shell/modals/CMSCollectionSetupModal.tsx` |
| 12 | 1 | yes | 0 | `src/editor/inspector/sections/typography/FontControls.tsx` |
| 12 | 10 | yes | 4 | `src/editor/inspector/shared/TokenPickerPopover.tsx` |
| 12 | 4 | yes | 0 | `src/editor/onboarding/AchievementPrompt.tsx` |
| 11 | 3 | yes | 0 | `src/editor/canvas/overlays/MediaQuickActions.tsx` |
| 11 | 3 | yes | 0 | `src/editor/design-system/ui/modals/AddTokenModal.tsx` |
| 10 | 3 | yes | 4 | `src/editor/sidebar/tabs/media/components/StockSourceModal.tsx` |
| 10 | 2 | yes | 0 | `src/editor/inspector/sections/layout/OverflowVisibilityControls.tsx` |
| 9 | 0 | yes | 0 | `src/editor/sidebar/tabs/history/components/MilestoneSuggestionBanner.tsx` |
| 9 | 1 | yes | 0 | `src/editor/sidebar/tabs/pages/components/PageFolder.tsx` |
| 9 | 0 | yes | 30 | `src/editor/sidebar/tabs/pages/page-settings/SocialTab.tsx` |
| 9 | 0 | **NO** | 0 | `src/editor/inspector/sections/GridSection.tsx` |
| 9 | 5 | yes | 0 | `src/editor/inspector/sections/flexbox/FlexItemControls.tsx` |
| 9 | 2 | yes | 32 | `src/editor/panels/RichTextEditor.tsx` |
| 9 | 1 | yes | 3 | `src/editor/animation/AnimationEditor.tsx` |
| 9 | 0 | yes | 12 | `src/editor/design-system/ui/ExportDropdown.tsx` |
| 9 | 2 | yes | 8 | `src/editor/design-system/ui/StarterGalleryModal.tsx` |
| 9 | 2 | yes | 4 | `src/editor/design-system/ui/sections/PresetDetailPane.tsx` |
| 9 | 1 | yes | 8 | `src/editor/media/MediaLibraryPanel.tsx` |
| 8 | 2 | yes | 0 | `src/editor/sidebar/tabs/media/components/LibraryView.tsx` |
| 8 | 0 | yes | 4 | `src/editor/inspector/ProInspector.tsx` |
| 8 | 0 | **NO** | 0 | `src/editor/inspector/sections/EffectsSection.tsx` |
| 8 | 0 | **NO** | 0 | `src/editor/inspector/sections/BorderSection.tsx` |
| 8 | 1 | yes | 0 | `src/editor/inspector/sections/layout/PositionControls.tsx` |
| 8 | 0 | yes | 0 | `src/editor/shell/modals/StaleApprovalModal.tsx` |
| 8 | 1 | yes | 23 | `src/editor/design-system/ui/AIPromptModal.tsx` |
| 7 | 6 | yes | 3 | `src/editor/sidebar/tabs/publish/PublishTab.tsx` |
| 7 | 1 | yes | 39 | `src/editor/sidebar/tabs/pages/page-settings/AdvancedTab.tsx` |
| 7 | 1 | yes | 0 | `src/editor/inspector/components/StateDropdown.tsx` |
| 7 | 2 | yes | 16 | `src/editor/inspector/components/ScopeDropdown.tsx` |
| 7 | 13 | **NO** | 3 | `src/editor/canvas/overlays/ElementHoverOverlaySubComponents.tsx` |
| 7 | 9 | yes | 0 | `src/editor/canvas/controls/KeyboardCheatSheet.tsx` |
| 7 | 3 | yes | 4 | `src/editor/design-system/ui/sections/ImportCard.tsx` |
| 7 | 0 | yes | 4 | `src/editor/design-system/ui/modals/TabGuardModal.tsx` |
| 6 | 0 | yes | 3 | `src/editor/sidebar/SidebarFallbacks.tsx` |
| 6 | 0 | yes | 8 | `src/editor/inspector/sections/SpacingSection.tsx` |
| 6 | 19 | **NO** | 4 | `src/editor/inspector/sections/layout/previews.tsx` |
| 6 | 0 | yes | 8 | `src/editor/inspector/sections/flexbox/AlignmentSection.tsx` |

totals: static=1101 dynamic=472 files=246

## 6. The 53 files that never import the library

Many are canvas overlays (`SelectionBoxOverlay`, `GuidesOverlay`, `RulersOverlay`,
`SelectionHandles`, `SpacingLabels`, `DragHandle`, `SmartGuidesOverlay`,
`RemoteCursorsOverlay`, `DropFeedbackOverlay`, `ElementHoverOverlay`). Those position
themselves from live drag/selection coordinates, so inline styles are correct there and
they have no controls to draw. They are not debt.

The ones that genuinely look unmigrated:

- `src/editor/components-catalog/ui/CatalogCard.tsx` — 34 static blocks, 0 `tw:`
- `src/editor/inspector/sections/layout/previews.tsx`
- `src/editor/sidebar/tabs/pages/components/SearchListingsTable.tsx`
- `src/editor/inspector/sections/GridSection.tsx`, `EffectsSection.tsx`, `BorderSection.tsx`
- `src/editor/export/PreviewFrame.tsx`

## 7. Reproduce these numbers

```bash
cd packages/editor
# library composition
ls src/editor/chrome-ui/*.tsx | grep -vc index
grep -l 'from "flowbite-react"' src/editor/chrome-ui/*.tsx | wc -l
# inline styles + tokens
rg -o 'style=\{\{' src/editor --glob '!**/__tests__/**' | wc -l
rg -o 'var\(--bk-' src/editor --glob '!**/__tests__/**' | wc -l
rg -o '#[0-9a-fA-F]{6}\b' src/editor --glob '!**/__tests__/**' | wc -l
# css
find src/editor -name '*.css' -exec cat {} + | wc -l
```
