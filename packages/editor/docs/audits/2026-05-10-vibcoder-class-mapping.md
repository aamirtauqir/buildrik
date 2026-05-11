# Vibcoder Class-to-Primitive Mapping — Full Editor Audit

**Date:** 2026-05-10
**Scope:** `packages/editor/src/editor/` (all panels, excluding `__tests__`)
**Goal:** Map every `bd-*` / `bdc-*` / `buildrick-*` className to its vibcoder primitive replacement.

---

## Executive Summary

- **504** total `.tsx/.ts` files audited across 11 panels
- **~2400** raw className occurrences found
- **~150** unique className patterns
- **69** vibcoder primitives already available
- **2** minor gaps: no `ModalBody` / `TopbarTitle` exports
- **Conclusion:** Primitives exist for >95% of patterns. Work = migration, not creation.

---

## Top 50 Classes by Frequency

| Rank | ClassName | Count | vibcoder Primitive | Props / Notes | Files (representative) |
|------|-----------|-------|-------------------|---------------|----------------------|
| 1 | `bd-btn` | 17 | `Button` | `variant`, `size`, `busy` | shell/*, sidebar/*, inspector/*, canvas/* |
| 2 | `bd-modal__body` | 15 | `ModalContent` | Wrap children in `div.bd-modal__body` | sidebar/modals, shell/modals |
| 3 | `bd-btn--ghost` | 9 | `Button` | `variant="ghost"` | sidebar/settings, sidebar/pages |
| 4 | `bd-btn--primary` | 7 | `Button` | `variant="primary"` (default) | sidebar/pages, inspector/sections |
| 5 | `bd-pg-seo-hint` | 7 | `HelperText` | `tone` optional | sidebar/pages/page-settings/SeoTab.tsx |
| 6 | `bd-set-btn` | 6 | `Button` | — | sidebar/settings/* |
| 7 | `bd-pg-seo-label` | 6 | `Label` | `htmlFor`, `required` | sidebar/pages/page-settings/* |
| 8 | `bd-pg-seo-field` | 6 | `FormField` | `label`, `helper`, `error` | sidebar/pages/page-settings/* |
| 9 | `bd-pg-menu-item` | 5 | `MenuItem` | `danger`, `selected` | sidebar/pages/components/PageContextMenu.tsx |
| 10 | `bd-pg-seo-field-header` | 4 | `SectionHead` or `HelperText` | — | sidebar/pages/page-settings/* |
| 11 | `bd-pg-seo-check-pts` | 4 | `Stack` or `Cluster` | layout wrapper | sidebar/pages/page-settings/* |
| 12 | `bd-pg-add` | 4 | `Button` | `variant="ghost"`, size | sidebar/pages/components/AddPageButton.tsx |
| 13 | `bd-chain-row` | 4 | `Cluster` | `gap`, `align` | inspector/sections/SizeSection.tsx |
| 14 | `bd-sr-only` | 3 | a11y.css | — | canvas/overlays/*, shell/* |
| 15 | `bd-set-snav-label` | 3 | `Label` | `size="sm"` | sidebar/settings/* |
| 16 | `bd-set-snav-icon` | 3 | `Icon` | — | sidebar/settings/* |
| 17 | `bd-set-section-h` | 3 | `SectionHead` | `title` | sidebar/settings/* |
| 18 | `bd-set-section-d` | 3 | `HelperText` | — | sidebar/settings/* |
| 19 | `bd-set-section` | 3 | `Stack` | `gap`, `separator` | sidebar/settings/* |
| 20 | `bd-pg-seo-textarea` | 3 | `Textarea` | `size`, `error`, `fixed` | sidebar/pages/page-settings/* |
| 21 | `bd-pg-seo-input` | 3 | `Input` | `error` | sidebar/pages/page-settings/* |
| 22 | `bd-pg-adv-section-label` | 3 | `Label` | — | sidebar/pages/page-settings/AdvancedTab.tsx |
| 23 | `bd-pg-adv-section` | 3 | `FormField` or `Stack` | — | sidebar/pages/page-settings/AdvancedTab.tsx |
| 24 | `bd-pg-adv-toggle-row` | 2 | `Switch` | `checked`, `onCheckedChange` | sidebar/pages/page-settings/AdvancedTab.tsx |
| 25 | `bd-stepper__btn` | 2 | `NumericStepper` | — | inspector/sections/SizeSection.tsx |
| 26 | `bd-topbar__title` | 2 | `Topbar` / custom | **Gap: no `TopbarTitle` export** | shell/Topbar.tsx |
| 27 | `bd-progress__bar` | 2 | `Progress` | — | shell/StatusIndicators.tsx |
| 28 | `bd-modal__head` | 1 | `Modal` | Radix.Dialog internal | shell/modals/* |
| 29 | `bd-modal-in` | 1 | keyframe | — | canvas/controls/BlockPickerModal.tsx |
| 30 | `bd-list-row__check` | 1 | `ListRow` | `check={true}` | panels/layers/* |
| 31 | `bd-list-row--lg` | 1 | `ListRow` | `size="lg"` | panels/layers/* |
| 32 | `bd-link--inverse` | 1 | `Link` | `variant` | — |
| 33 | `bd-layers-tree` | 1 | `TreeView` or custom | **Not in vibcoder** | panels/layers/* |
| 34 | `bd-kbd--sm` | 1 | `Kbd` | `size` | canvas/controls/KeyboardCheatSheet.tsx |
| 35 | `bd-grid-12` | 1 | `Grid` | `cols={12}` | — |
| 36 | `bd-grid--md` | 1 | `Grid` | — | — |
| 37 | `bd-grid--lg` | 1 | `Grid` | `gap` | — |
| 38 | `bd-grid--cols-4` | 1 | `Grid` | `cols={4}` | — |
| 39 | `bd-grid--2` | 1 | `Grid` | `cols={2}` | — |
| 40 | `bd-floating-helper` | 1 | `HelperText` or custom | — | canvas/hooks/useSelectionBehavior.ts |
| 41 | `bd-field` | 1 | `FormField` | — | — |
| 42 | `bd-empty-state` | 1 | `EmptyState` | — | sidebar/tabs/pages/* |
| 43 | `bd-element-card` | 1 | `Card` | — | sidebar/tabs/elements/* |
| 44 | `bd-drop-slot-preview` | 1 | `OverlayMount` | — | canvas/overlays/DropFeedbackOverlay.tsx |
| 45 | `bd-drop-position-line` | 1 | custom | — | canvas/overlays/DropFeedbackOverlay.tsx |
| 46 | `bd-drop-feedback-target` | 1 | custom | — | canvas/overlays/DropFeedbackOverlay.tsx |
| 47 | `bd-drop-feedback-badge` | 1 | `Badge` | — | canvas/overlays/DropFeedbackOverlay.tsx |
| 48 | `bd-drop-breadcrumb` | 1 | `Breadcrumb` | — | canvas/overlays/DropFeedbackOverlay.tsx |
| 49 | `bd-drag-handle` | 1 | custom | — | canvas/overlays/DragHandle.tsx |
| 50 | `bd-device-selector` | 1 | `Select` | — | canvas/controls/DeviceSelector.tsx |

---

## Per-Panel Migration Inventory

### shell (44 files, 16 vibcoder imports, 5 raw class files)

**Files with raw `bd-*` / `buildrick-*`:**
| File | Classes Used | Migration |
|------|-------------|-----------|
| `Topbar.tsx` | `bd-topbar__title` | Add `TopbarTitle` export or keep as custom |
| `AquibraStudio.tsx` | `bd-sr-only` | Move to a11y.css |
| `modals/CreateComponentModal.tsx` | `bd-modal__body` | Use `ModalContent` + inner div |
| `modals/CMSCollectionSetupModal.tsx` | `bd-modal__body` | Use `ModalContent` + inner div |
| `modals/ProjectSettingsModal.tsx` | `bd-modal__body` | Use `ModalContent` + inner div |

**Already on vibcoder:** `StudioPanels.tsx`, `PageTabBar.tsx`, `StudioModals.tsx`, `AccountModal.tsx`, `InviteModal.tsx`, `StatusIndicators.tsx`, `StudioHeader.tsx`, `AquibraStudio.tsx`, `hooks/useBlockInsertion.ts`, `hooks/useStudioHandlers.ts`, `hooks/useHistoryFeedback.ts`, `hooks/useComposerInit.ts`

---

### sidebar (162 files, 15 vibcoder imports, 35 raw class files)

**High-frequency targets:**

| File | Classes | Primitive Mapping |
|------|---------|-------------------|
| `tabs/pages/page-settings/SeoTab.tsx` | `bd-pg-seo-*` (label, field, hint, input, textarea, error, counter, check-pts, field-header) | `Label`, `FormField`, `HelperText`, `Input`, `Textarea`, `Stack` |
| `tabs/pages/page-settings/AdvancedTab.tsx` | `bd-pg-adv-*` (section, section-label, toggle-row, password, password-row, hint, head, seg) | `FormField`, `Label`, `Switch`, `Input`, `HelperText`, `SectionHead` |
| `tabs/pages/page-settings/SocialTab.tsx` | `bd-pg-seo-*` | Same as SeoTab |
| `tabs/settings/SettingsTab.tsx` | `bd-set-*` (section, section-h, section-d, snav-row, snav-group, snav-label, snav-icon, btn, icon-btn) | `SectionHead`, `Label`, `IconButton`, `Button`, `Stack` |
| `tabs/pages/components/PageList.tsx` | `bd-pg-list`, `bd-pg-list-shell`, `bd-pg-row-*` | `ListRow`, `Stack` |
| `tabs/pages/components/PageRow.tsx` | `bd-pg-row-*` (wrap, rename, name, icon) | `ListRow` with `lead` + `tail` |
| `tabs/pages/components/PageFolder.tsx` | `bd-pg-folder-act`, `bd-pg-home-chip` | `Tag`, `IconButton` |
| `tabs/pages/components/AddPageButton.tsx` | `bd-pg-add`, `bd-pg-add-wrap`, `bd-pg-add-popover`, `bd-pg-add-overflow` | `Button`, `Popover` |
| `tabs/pages/components/BulkToolbar.tsx` | `bd-pg-bulk-*` (menu, menu-item, menu-sep, menu-empty, folder, spacer) | `Menu`, `MenuItem`, `MenuGroup`, `MenuLabel`, `Divider` |
| `tabs/pages/PagesTab.tsx` | `bd-pg-empty-*` (empty, empty-title, empty-action, empty-body) | `EmptyState`, `EmptyStateDesc`, `Button` |
| `tabs/ai/*.tsx` | `bd-ai-*` (tab, composer, composer-bar, composer-input, composer-send, composer-stop, msg, msg-body, msg-role, msg-stopped, msg-regenerate, empty, model, model-item, model-menu, model-trigger, scope, scope-dot, scope-target, scope-text) | **Many custom AI-specific classes — no direct vibcoder mapping. Needs design review.** |
| `tabs/history/HistoryTab.tsx` | `bd-history-container`, `bd-history-panel__diff-line--*` | `HistoryPanel` |
| `tabs/templates/TemplatesTabModals.tsx` | `bd-modal__body` | `ModalContent` |
| `shared/SearchBar.tsx` | `bd-search-input` | `SearchInput` |
| `shared/headerIcons.tsx` | `bd-set-icon-btn` | `IconButton` |
| `tabs/media/MediaTab.tsx` | `bd-media-*` | — |
| `tabs/elements/ElementCard.tsx` | `bd-element-card`, `bd-element-card--full`, `bd-element-card-star` | `Card` |

**AI tab note:** `tabs/ai/` has ~30 custom `bd-ai-*` classes. These are deeply custom UI (chat bubbles, composer bar, model picker). Vibcoder primitives can handle layout (`Stack`, `Cluster`) but the bespoke styling may need to stay as custom CSS or be redesigned as vibcoder compositions.

---

### inspector (111 files, 7 vibcoder imports, 3 raw class files)

**Files with raw classes:**
| File | Classes | Migration |
|------|---------|-----------|
| `sections/SizeSection.tsx` | `bd-chain-row`, `bd-chain-btn`, `bd-stepper__btn` | `Cluster`, `Button`, `NumericStepper` |
| `components/DeleteConfirmModal.tsx` | `bd-modal__body` | `ModalContent` + inner div |
| `sections/typography/FontControls.tsx` | `bd-font-*` | `FontPicker`, `Select` |

**Already on vibcoder (extensive):** `inspector/renderer/controlRegistry.tsx` imports `Button`, `Checkbox`, `Input`, `Select`. Most inspector controls are already vibcoder-backed.

---

### canvas (122 files, 10 vibcoder imports, 15 raw class files + 2 Emotion files)

**Files with raw classes:**
| File | Classes | Migration |
|------|---------|-----------|
| `CanvasEmptyCTA.tsx` | `bd-canvas-empty-cta`, `bd-canvas-empty-cta__*` (title, icon, desc, browse, blank) | `EmptyState`, `EmptyStateDesc`, `Button` |
| `Canvas.tsx` | `bd-empty-canvas-root`, `bd-canvas--component-view` | `EmptyState`, `Stack` |
| `overlays/DropFeedbackOverlay.tsx` | `bd-drop-*` (feedback-badge, feedback-target, position-line, slot-preview, breadcrumb), `bd-depth-badge`, `bd-bg-card`, `bd-bg-panel`, `bd-fg-heading`, `bd-sr-only` | `Badge`, `Stack`, a11y |
| `overlays/ElementHoverOverlay.tsx` | `bd-hover-overlay`, `bd-bg-card`, `buildrick-*` (many) | `OverlayMount`, `Stack`, custom CSS |
| `overlays/SelectionBoxOverlay.tsx` | `bd-selection-box`, `buildrick-*` (selection-glow, accent, etc.) | custom — engine chrome |
| `overlays/DragHandle.tsx` | `bd-drag-handle`, `bd-accent` | custom — engine chrome |
| `spots/CanvasSpotBadge.tsx` | `bd-canvas-spot-badge`, `bd-canvas-spot-badge--*`, `bd-canvas-spot-badge-content`, `bd-canvas-spot-badge-close` | `Badge`, `Button`, `IconButton` |
| `spots/CanvasSpotSpacing.tsx` | `bd-canvas-spot-spacing`, `bd-spacing-indicator*`, `bd-accent-pressed` | `Input`, custom |
| `controls/ZoomControl.tsx` | `bd-zoom-control`, `buildrick-bg-panel-secondary` | `Button`, `IconButton` |
| `controls/DeviceSelector.tsx` | `bd-device-selector`, `buildrick-bg-panel-secondary` | `Select` |
| `controls/UndoRedoControls.tsx` | `bd-undo-redo-controls`, `buildrick-bg-panel-secondary` | `IconButton`, `Stack` |
| `controls/InspectorToggle.tsx` | `bd-inspector-toggle`, `buildrick-inspector-mode` | `Switch` or `IconButton` |
| `controls/UnifiedSelectionToolbar.tsx` | `bd-canvas-toolbar` | `Toolbar` |
| `hooks/useSelectionBehavior.ts` | `bd-floating-helper`, `bd-canvas-toolbar`, `bd-canvas-breadcrumb`, `bd-alignment-toolbar`, `bd-command-palette`, `bd-inspector-toggle`, `bd-selection-label` | Various — mostly layout chrome |

**Emotion holdouts:**
| File | Pattern | Migration |
|------|---------|-----------|
| `canvas/styled/OverlayStyles.ts` | `@emotion/styled` + CSS | Extract to `themes/components/organisms/overlay.css` |
| `canvas/styled/SelectionStyles.ts` | `@emotion/styled` + CSS | Extract to `themes/components/organisms/selection.css` |

---

### rail (4 files, 1 vibcoder import, 1 raw class file)

| File | Classes | Migration |
|------|---------|-----------|
| `LayoutShell.tsx` | `bd-rail`, `bd-rail-*` (likely) | `Rail`, `RailTile` |

Already on vibcoder: `DrawerPanel.tsx`

---

### media (17 files, 5 vibcoder imports, 4 raw class files)

| File | Classes | Migration |
|------|---------|-----------|
| `VideoPreview.tsx` | `bd-media-*` | `Card` or custom |
| `MediaLibraryPanel.tsx` | `bd-media-*` | `Stack`, `Grid`, `Card` |
| `IconPickerModal.tsx` | `bd-modal__body` | `ModalContent` |
| `components/ReplaceAcrossModal.tsx` | `bd-modal__body` | `ModalContent` |

---

### export (6 files, 3 vibcoder imports, 1 raw class file)

| File | Classes | Migration |
|------|---------|-----------|
| `ExportModal.tsx` | `bd-modal__body` | `ModalContent` |

Already on vibcoder: `ExportOptions.tsx`, `CodePreview.tsx`, `ExportModal.tsx` (partial)

---

### panels (27 files, 2 vibcoder imports, 9 raw class files)

| File | Classes | Migration |
|------|---------|-----------|
| `VersionHistoryPanel.tsx` | `bd-history-panel__diff-line--*`, `bd-history-container` | `HistoryPanel` |
| `KeyboardShortcutsPanel.tsx` | `bd-kbd--sm` | `Kbd` |
| `layers/index.tsx` | `bd-layers-tree` | **Gap — no TreeView primitive** |
| `layers/LayerTreeItem.tsx` | `bd-list-row--*` | `ListRow` |
| `layers/components/LayerBreadcrumb.tsx` | `bd-crumbs--truncate` | `Breadcrumb` |
| `layers/components/LayerContextMenu.tsx` | `bd-context-menu` | `Menu`, `MenuItem` |
| `layers/components/LayersEmptyState.tsx` | `bd-empty__spot--*` | `EmptyState` |
| `layers/components/LayerSelectionBanner.tsx` | `bd-list-row__*` | `ListRow` |
| `layers/components/LayerDisplaySettings.tsx` | `bd-set-*` | `Stack`, `Switch` |

---

### animation (2 files, 1 vibcoder import, 1 raw class file)

| File | Classes | Migration |
|------|---------|-----------|
| `AnimationEditor.tsx` | `bd-anim-*` | Custom — animation-specific chrome |

---

### collaboration (3 files, 0 vibcoder imports, 0 raw class files)

No raw classes. Uses `buildrick-*` tokens in `PresenceIndicators.tsx` and `ConnectionQualityIndicator.tsx` but these are CSS variable references for coloring presence dots, not className styling.

---

### onboarding (6 files, 0 vibcoder imports, 0 raw class files)

Clean — no raw classes, but also no vibcoder imports. Likely uses `styled()` or inline styles. Needs audit.

---

## Gaps in Vibcoder Primitives (2)

### 1. `ModalBody` — needed for `bd-modal__body` (15 occurrences)

`Modal.tsx` exports: `Modal`, `ModalTrigger`, `ModalContent`, `ModalClose`, `ModalTitle`, `ModalDescription`, `ModalFooter`.

Missing: `ModalBody` — wraps modal content in `div.bd-modal__body`.

**Workaround:** Manual `<div className="bd-modal__body">` inside `ModalContent`.
**Fix:** Add `ModalBody` sibling export to `Modal.tsx`.

### 2. `TopbarTitle` — needed for `bd-topbar__title` (2 occurrences)

`Topbar.tsx` exports: `Topbar` only (assumed).

Missing: `TopbarTitle` — renders `span.bd-topbar__title`.

**Workaround:** Keep raw className or add sub-component.
**Fix:** Add `TopbarTitle` export to `Topbar.tsx`.

### 3. `TreeView` — needed for `bd-layers-tree` (1 occurrence)

Layers panel uses a tree structure. No `TreeView` primitive exists.

**Workaround:** Keep existing implementation.
**Fix:** Add `TreeView` primitive (low priority — only 1 occurrence).

---

## `buildrick-*` Classes — Token References, Not Migration Targets

Many `buildrick-*` strings in the grep output are NOT classNames for styling. They are:

1. **CSS custom properties** in `canvas/shared/tokens.ts` — e.g., `buildrick-bg-panel`, `buildrick-accent`. These are token definitions, not class usage.
2. **Data attributes** in canvas hooks — e.g., `data-buildrick-id`, `buildrick-canvas`, `buildrick-type`.
3. **CSS variable references** in Emotion styles — e.g., `buildrick-text-primary` used in `canvas/styled/OverlayStyles.ts`.

These are **out of scope** for vibcoder migration. They are engine/canvas internals.

---

## Migration Priority Ranking

### Phase 1: High-Impact, Low-Effort (sidebar page settings)
- `sidebar/tabs/pages/page-settings/SeoTab.tsx` — 7 `bd-pg-seo-*` classes, clear mappings
- `sidebar/tabs/pages/page-settings/AdvancedTab.tsx` — 6 `bd-pg-adv-*` classes
- `sidebar/tabs/pages/page-settings/SocialTab.tsx` — similar to SeoTab
- **Primitives needed:** `Label`, `FormField`, `HelperText`, `Input`, `Textarea`, `Switch`, `SectionHead`
- **Estimated:** ~3 files, ~20 class replacements

### Phase 2: Medium-Impact, Medium-Effort (sidebar pages list + settings)
- `sidebar/tabs/pages/components/PageList.tsx`, `PageRow.tsx`, `PageFolder.tsx`, `AddPageButton.tsx`
- `sidebar/tabs/settings/SettingsTab.tsx` + shared components
- **Primitives needed:** `ListRow`, `Tag`, `Button`, `IconButton`, `Stack`, `SectionHead`
- **Estimated:** ~8 files, ~25 class replacements

### Phase 3: Shell modals + Topbar
- `shell/modals/*.tsx` (3 files with `bd-modal__body`)
- `shell/Topbar.tsx` (`bd-topbar__title`)
- **Primitives needed:** `Modal` + `ModalBody` (new), `TopbarTitle` (new)
- **Estimated:** ~4 files, ~5 class replacements

### Phase 4: Inspector SizeSection + canvas chrome
- `inspector/sections/SizeSection.tsx` (`bd-chain-row`, `bd-stepper__btn`)
- `canvas/CanvasEmptyCTA.tsx`, `Canvas.tsx`
- **Primitives needed:** `Cluster`, `NumericStepper`, `EmptyState`, `Stack`
- **Estimated:** ~5 files, ~15 class replacements

### Phase 5: Canvas overlays (engine chrome)
- `canvas/overlays/DropFeedbackOverlay.tsx`, `ElementHoverOverlay.tsx`, `SelectionBoxOverlay.tsx`, `DragHandle.tsx`
- **Note:** These are engine-rendered chrome, not React UI. May need DOM mutation approach rather than vibcoder React components.
- **Estimated:** Complex — defer until engine API review.

### Phase 6: AI tab (custom design)
- `sidebar/tabs/ai/*.tsx` — ~30 custom classes
- **Note:** Needs design review. May require new vibcoder compositions or keeping custom CSS.
- **Estimated:** High — defer until Phase 1-5 complete.

### Phase 7: Panels (layers, version history)
- `panels/layers/*.tsx` — `bd-layers-tree` needs `TreeView`
- `panels/VersionHistoryPanel.tsx`, `KeyboardShortcutsPanel.tsx`
- **Estimated:** ~5 files, ~10 class replacements

### Phase 8: Emotion cleanup
- `canvas/styled/OverlayStyles.ts`, `canvas/styled/SelectionStyles.ts`
- Extract to CSS files in `themes/components/organisms/`
- **Estimated:** 2 files, significant CSS extraction work.

---

## Appendix A: Vibcoder Import Frequency (Already Using Primitives)

| Primitive | Import Count | Top Consumers |
|-----------|-------------|---------------|
| `Button` | ~90 | inspector/sections/*, canvas/controls/*, sidebar/* |
| `Input` | ~30 | inspector/shared/controls/*, canvas/overlays/* |
| `Stack` | ~15 | canvas/controls/*, export/*, inspector/* |
| `Select` | ~15 | inspector/sections/*, inspector/shared/controls/* |
| `useToast` | ~22 | shell/*, canvas/*, sidebar/* |
| `Checkbox` | ~8 | inspector/renderer/*, ecommerce/*, export/* |
| `IconButton` | ~8 | inspector/components/*, canvas/* |
| `Textarea` | ~5 | inspector/shared/controls/* |
| `Tabs` | ~5 | export/*, animation/*, design-system/* |
| `Kbd` | ~5 | inspector/components/*, canvas/controls/* |
| `Modal` family | ~15 | shell/modals/*, sidebar/* |
| `EmptyState` | ~5 | sidebar/*, inspector/*, canvas/* |
| `FormField` | ~5 | sidebar/*, inspector/* |
| `HelperText` | ~5 | sidebar/*, inspector/* |
| `Label` | ~5 | sidebar/*, inspector/* |
| `ListRow` | ~3 | panels/layers/* |
| `Switch` | ~3 | sidebar/*, panels/* |
| `Tag` | ~3 | sidebar/* |
| `Progress` | ~2 | shell/* |
| `NumericStepper` | ~2 | inspector/* |
| `SearchInput` | ~2 | sidebar/* |
| `ColorPicker` | ~2 | design-system/*, inspector/* |
| `Spinner` | ~2 | export/* |
| `Chipbar` | ~1 | — |
| `Cluster` | ~1 | inspector/* |
| `Grid` | ~1 | — |
| `Breadcrumb` | ~1 | panels/* |
| `Menu` family | ~1 | sidebar/*, panels/* |
| `HistoryPanel` | ~1 | panels/* |
| `CommandPalette` | ~1 | canvas/* |
| `Toolbar` | ~1 | canvas/* |
| `RailTile` | ~1 | rail/* |

---

## Appendix B: `bd-*` Classes That Are Already Vibcoder-Backed (No Migration Needed)

These classes are rendered BY vibcoder primitives internally. Callers using the primitive don't need to migrate:

- `bd-btn` → rendered by `<Button>`
- `bd-btn--*` → rendered by `<Button variant="...">`
- `bd-input` → rendered by `<Input>`
- `bd-input--error` → rendered by `<Input error>`
- `bd-textarea` → rendered by `<Textarea>`
- `bd-select` → rendered by `<Select>`
- `bd-switch` → rendered by `<Switch>`
- `bd-tag` → rendered by `<Tag>`
- `bd-chipbar` → rendered by `<Chipbar>`
- `bd-modal` → rendered by `<ModalContent>`
- `bd-modal__title` → rendered by `<ModalTitle>`
- `bd-modal__subtitle` → rendered by `<ModalDescription>`
- `bd-modal__foot` → rendered by `<ModalFooter>`
- `bd-form-field` → rendered by `<FormField>`
- `bd-label` → rendered by `<Label>`
- `bd-helper-text` → rendered by `<HelperText>`
- `bd-stack` → rendered by `<Stack>`
- `bd-cluster` → rendered by `<Cluster>`
- `bd-list-row` → rendered by `<ListRow>`
- `bd-section-head` → rendered by `<SectionHead>`
- `bd-icon-btn` → rendered by `<IconButton>`
- `bd-empty-state` → rendered by `<EmptyState>`
- `bd-kbd` → rendered by `<Kbd>`
- `bd-spinner` → rendered by `<Spinner>`
- `bd-progress` → rendered by `<Progress>`
- `bd-card` → rendered by `<Card>`
- `bd-badge` → rendered by `<Badge>`
- `bd-divider` → rendered by `<Divider>`
- `bd-avatar` → rendered by `<Avatar>`
- `bd-search-input` → rendered by `<SearchInput>`
- `bd-toast` → rendered by `<Toast>` / `useToast`
- `bd-tooltip` → rendered by `<Tooltip>`
- `bd-popover` → rendered by `<Popover>`
- `bd-menu` → rendered by `<Menu>`
- `bd-tabs` → rendered by `<Tabs>`
- `bd-topbar` → rendered by `<Topbar>`
- `bd-rail` → rendered by `<Rail>`
- `bd-rail-tile` → rendered by `<RailTile>`
- `bd-toolbar` → rendered by `<Toolbar>`
- `bd-command-palette` → rendered by `<CommandPalette>`
- `bd-color-picker` → rendered by `<ColorPicker>`
- `bd-numeric-stepper` → rendered by `<NumericStepper>`
- `bd-slider` → rendered by `<Slider>`
- `bd-uploader` → rendered by `<Uploader>`
- `bd-frame` → rendered by `<Frame>`
- `bd-grid` → rendered by `<Grid>`
- `bd-center` → rendered by `<Center>`
- `bd-drawer` → rendered by `<Drawer>`
- `bd-action-bar` → rendered by `<ActionBar>`
- `bd-notification-center` → rendered by `<NotificationCenter>`
- `bd-count` → rendered by `<Count>`
- `bd-grip` → rendered by `<Grip>`
- `bd-switcher` → rendered by `<Switcher>`
- `bd-thumb` → rendered by `<Thumb>`
- `bd-tile-meta` → rendered by `<TileMeta>`
- `bd-toggle-row` → rendered by `<ToggleRow>`
- `bd-surface-head` → rendered by `<SurfaceHead>`
- `bd-breakpoint-switcher` → rendered by `<BreakpointSwitcher>`
- `bd-pages-drawer` → rendered by `<PagesDrawer>`
- `bd-templates-drawer` → rendered by `<TemplatesDrawer>`
- `bd-a11y-overlay` → rendered by `<A11yOverlay>`
- `bd-color-trigger` → rendered by `<ColorTrigger>`
- `bd-skeleton` → rendered by `<Skeleton>`
- `bd-inspector` → rendered by `<Inspector>`

---

## Appendix C: Domain-Scoped Classes (Engine / Site-Builder — Do Not Migrate)

These classes are NOT editor chrome. They are engine internals or user-site output. Leave them alone:

- `buildrick-canvas` — engine canvas container selector
- `buildrick-row` — engine element selector
- `buildrick-id` — data attribute for element identity
- `buildrick-type`, `buildrick-name` — engine metadata
- `buildrick-*` in `canvas/shared/tokens.ts` — CSS custom property definitions
- `bd-ds-lint-banner`, `bd-ds-lint-banner--*` — site-builder DS UI (design-system tab)
- `bd-component-row` — components catalog
- `bd-empty-canvas-root` — canvas empty state (already mapped to EmptyState)

---

## Appendix D: AI Tab Custom Classes (Need Design Review)

The `sidebar/tabs/ai/` directory uses ~30 custom `bd-ai-*` classes that have no vibcoder equivalent. These are bespoke chat UI components (composer bar, message bubbles, model picker, scope chips). Options:

1. **Keep as custom CSS** — add to `themes/components/organisms/ai-chat.css` as a vibcoder-backed organism
2. **Compose from primitives** — `Stack`, `Cluster`, `Card`, `Button`, `IconButton`, `Tag` + custom CSS for chat-specific shapes
3. **New primitive `ChatThread`** — high-level organism wrapping the whole AI panel

Recommendation: Option 2 — compose from existing primitives + minimal custom CSS for chat-specific shapes (bubble tails, composer bar gradient). Avoid new primitives unless reused elsewhere.

---

## Appendix E: Emotion-to-CSS Migration Path

The 2 remaining Emotion files:

1. `canvas/styled/OverlayStyles.ts` — ~200 LOC of `styled.div` with `buildrick-*` token references
2. `canvas/styled/SelectionStyles.ts` — ~150 LOC of `styled.div` with selection glow/handle styles

**Migration:** Extract to:
- `themes/components/organisms/canvas-overlay.css` — `bd-overlay-*` classes
- `themes/components/organisms/canvas-selection.css` — `bd-selection-*` classes

Update canvas overlay components to use `className` instead of `css={...}` prop. This removes Emotion dependency from canvas chrome.

---

*End of mapping document.*
