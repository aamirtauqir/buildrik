# Flowbite big-bang — stage-0 inventory (2026-07-30)

## (a) @/editor/ui importers
src/editor/animation/AnimationEditor.tsx
src/editor/canvas/Canvas.tsx
src/editor/canvas/CanvasEmptyCTA.tsx
src/editor/canvas/CanvasFooterToolbar.tsx
src/editor/canvas/DeviceFramePreview.tsx
src/editor/canvas/ZoomControls.tsx
src/editor/canvas/comments/CommentLayer.tsx
src/editor/canvas/comments/__tests__/CommentLayer.test.tsx
src/editor/canvas/controls/AiPromptPopover.tsx
src/editor/canvas/controls/BlockPickerModal.tsx
src/editor/canvas/controls/CommandPalette.tsx
src/editor/canvas/controls/KeyboardCheatSheet.tsx
src/editor/canvas/controls/QuickAddBar.tsx
src/editor/canvas/controls/SmartSuggestions.tsx
src/editor/canvas/controls/UnifiedSelectionToolbar.tsx
src/editor/canvas/controls/ZoomControl.tsx
src/editor/canvas/controls/toolbar/ToolbarActionsSection.tsx
src/editor/canvas/controls/toolbar/ToolbarNavSection.tsx
src/editor/canvas/hooks/useCanvasKeyboard.ts
src/editor/canvas/hooks/useCanvasToolbarActions.ts
src/editor/canvas/hooks/useSelectionBehavior.ts
src/editor/canvas/menus/MenuItem.tsx
src/editor/canvas/menus/contextMenuRegistry.ts
src/editor/canvas/overlays/ElementHoverOverlaySubComponents.tsx
src/editor/canvas/overlays/MediaQuickActions.tsx
src/editor/canvas/overlays/SelectionLabel.tsx
src/editor/canvas/overlays/TemplatePreviewPanel.tsx
src/editor/canvas/shared/CanvasButton.tsx
src/editor/canvas/spots/CanvasSpotBadge.tsx
src/editor/canvas/spots/CanvasSpotSpacing.tsx
src/editor/canvas/toolbars/AlignmentToolbar.tsx
src/editor/collaboration/PresenceIndicators.tsx
src/editor/components-catalog/ui/ComponentsPanelV2.tsx
src/editor/components-catalog/ui/DetachInstanceButton.tsx
src/editor/components-catalog/ui/__tests__/ComponentsPanelV2.test.tsx
src/editor/design-system/ui/AIPromptModal.tsx
src/editor/design-system/ui/ColorModeToggle.tsx
src/editor/design-system/ui/DSLintBanner.tsx
src/editor/design-system/ui/DSModeToggle.tsx
src/editor/design-system/ui/DesignSystemTab.tsx
src/editor/design-system/ui/DesignTabFooter.tsx
src/editor/design-system/ui/ExportDropdown.tsx
src/editor/design-system/ui/MigrationProgressModal.tsx
src/editor/design-system/ui/StarterGalleryModal.tsx
src/editor/design-system/ui/__tests__/DesignSystemTab.a11y.test.tsx
src/editor/design-system/ui/__tests__/DesignSystemTab.aggregation.test.tsx
src/editor/design-system/ui/__tests__/DesignSystemTab.ai-entry.test.tsx
src/editor/design-system/ui/__tests__/DesignSystemTab.dark-preview.test.tsx
src/editor/design-system/ui/__tests__/DesignSystemTab.export-section.test.tsx
src/editor/design-system/ui/__tests__/DesignSystemTab.guard-apply.test.tsx
src/editor/design-system/ui/__tests__/DesignSystemTab.panel-mode.test.tsx
src/editor/design-system/ui/__tests__/DesignSystemTab.styles-section.test.tsx
src/editor/design-system/ui/colors/ColorPicker.tsx
src/editor/design-system/ui/colors/ColorTokenList.tsx
src/editor/design-system/ui/colors/ColorTokenRow.tsx
src/editor/design-system/ui/modals/AddTokenModal.tsx
src/editor/design-system/ui/modals/ReviewModal.tsx
src/editor/design-system/ui/modals/TabGuardModal.tsx
src/editor/design-system/ui/presets/BindingRow.tsx
src/editor/design-system/ui/sections/ComponentsSection.tsx
src/editor/design-system/ui/sections/ExportSection.tsx
src/editor/design-system/ui/sections/ImportCard.tsx
src/editor/design-system/ui/sections/PresetDetailPane.tsx
src/editor/design-system/ui/sections/StyleCategoryRow.tsx
src/editor/design-system/ui/sections/StylesRouter.tsx
src/editor/design-system/ui/sections/TokenDetailView.tsx
src/editor/design-system/ui/sections/TokenKindCard.tsx
src/editor/design-system/ui/sections/TokenReplaceModal.tsx
src/editor/design-system/ui/sections/__tests__/BeginnerHint.test.tsx
src/editor/design-system/ui/sections/__tests__/ExportSection.test.tsx
src/editor/design-system/ui/sections/__tests__/ImportCard.test.tsx
src/editor/design-system/ui/sections/__tests__/TokensSection.test.tsx
src/editor/design-system/ui/spacing/SpacingTokenList.tsx
src/editor/design-system/ui/tokens/GenericTokenList.tsx
src/editor/design-system/ui/type/TypeTokenList.tsx
src/editor/ecommerce/CollectionSetupModal.tsx
src/editor/ecommerce/__tests__/CollectionSetupModal.test.tsx
src/editor/export/CodePreview.tsx
src/editor/export/ExportModal.tsx
src/editor/export/ExportOptions.tsx
src/editor/export/__tests__/CodePreview.test.tsx
src/editor/export/__tests__/ExportModal.test.tsx
src/editor/inspector/ProInspector.tsx
src/editor/inspector/components/BindingPopover.tsx
src/editor/inspector/components/BreakpointPill.tsx
src/editor/inspector/components/DeleteConfirmModal.tsx
src/editor/inspector/components/InspectorElementMenu.tsx
src/editor/inspector/components/InspectorEmptyState.tsx
src/editor/inspector/components/InspectorErrorBoundary.tsx
src/editor/inspector/components/MultiSelectToolbar.tsx
src/editor/inspector/components/ScopeDropdown.tsx
src/editor/inspector/components/StateDropdown.tsx
src/editor/inspector/renderer/InspectorRenderer.tsx
src/editor/inspector/renderer/controlRegistry.tsx
src/editor/inspector/sections/AllCSSSection.tsx
src/editor/inspector/sections/AnimationSection.tsx
src/editor/inspector/sections/BackgroundSection.tsx
src/editor/inspector/sections/CSSClassesSection.tsx
src/editor/inspector/sections/DSBindingChip.tsx
src/editor/inspector/sections/QuickActionsSection.tsx
src/editor/inspector/sections/SizeSection.tsx
src/editor/inspector/sections/SpacingSection.tsx
src/editor/inspector/sections/VariantSection.tsx
src/editor/inspector/sections/VisibilitySection.tsx
src/editor/inspector/sections/elementProperties/DataAttributeEditor.tsx
src/editor/inspector/sections/elementProperties/PropertyField.tsx
src/editor/inspector/sections/elementProperties/index.tsx
src/editor/inspector/sections/flexbox/AlignmentSection.tsx
src/editor/inspector/sections/flexbox/DirectionControls.tsx
src/editor/inspector/sections/flexbox/EnableFlexPrompt.tsx
src/editor/inspector/sections/flexbox/FlexItemControls.tsx
src/editor/inspector/sections/flexbox/controls.tsx
src/editor/inspector/sections/flexbox/index.tsx
src/editor/inspector/sections/interactions/AddInteractionPanel.tsx
src/editor/inspector/sections/interactions/InteractionEditor.tsx
src/editor/inspector/sections/interactions/index.tsx
src/editor/inspector/sections/layout/ConstraintControl.tsx
src/editor/inspector/sections/layout/DisplayControls.tsx
src/editor/inspector/sections/layout/OverflowVisibilityControls.tsx
src/editor/inspector/sections/layout/PositionControls.tsx
src/editor/inspector/sections/layout/previews.tsx
src/editor/inspector/sections/typography/FontControls.tsx
src/editor/inspector/sections/typography/FontPicker.tsx
src/editor/inspector/sections/typography/FontPickerDropdown.tsx
src/editor/inspector/shared/TokenPickerPopover.tsx
src/editor/inspector/shared/controls/AlignmentGrid.tsx
src/editor/inspector/shared/controls/ButtonControls.tsx
src/editor/inspector/shared/controls/ColorInput.tsx
src/editor/inspector/shared/controls/ControlRow.tsx
src/editor/inspector/shared/controls/InputControls.tsx
src/editor/inspector/shared/controls/LinkedGapInput.tsx
src/editor/inspector/shared/controls/MoreSettingsToggle.tsx
src/editor/inspector/shared/controls/PresetGrids.tsx
src/editor/inspector/shared/controls/SliderControls.tsx
src/editor/inspector/shared/controls/SpacingControls.tsx
src/editor/inspector/shared/controls/TextControls.tsx
src/editor/inspector/tabs/InspectorTabContent.tsx
src/editor/media/AssetCard.tsx
src/editor/media/CropOverlay.tsx
src/editor/media/IconPickerModal.tsx
src/editor/media/ImageEditorModal.tsx
src/editor/media/LibraryManager.tsx
src/editor/media/MediaLibraryPanel.tsx
src/editor/media/OptimizationPanel.tsx
src/editor/media/SliderControl.tsx
src/editor/media/VideoPreview.tsx
src/editor/media/__tests__/LibraryManager.test.tsx
src/editor/media/components/AssetDetailsPanel.tsx
src/editor/media/components/AssetGrid.tsx
src/editor/media/components/FolderTree.tsx
src/editor/media/components/ReplaceAcrossModal.tsx
src/editor/onboarding/AchievementPrompt.tsx
src/editor/onboarding/OnboardingChecklist.tsx
src/editor/panels/KeyboardShortcutsPanel.tsx
src/editor/panels/RichTextEditor.tsx
src/editor/panels/VersionHistoryPanel.tsx
src/editor/panels/layers/LayerTreeItem.tsx
src/editor/panels/layers/components/LayerBreadcrumb.tsx
src/editor/panels/layers/components/LayerContextMenu.tsx
src/editor/panels/layers/components/LayerDisplaySettings.tsx
src/editor/panels/layers/components/LayerSelectionBanner.tsx
src/editor/panels/layers/components/LayersEmptyState.tsx
src/editor/panels/layers/index.tsx
src/editor/panels/version-history/AIPanel.tsx
src/editor/panels/version-history/ApprovedCompareView.tsx
src/editor/panels/version-history/CompareView.tsx
src/editor/panels/version-history/VersionList.tsx
src/editor/rail/DrawerPanel.tsx
src/editor/shell/AquibraStudio.tsx
src/editor/shell/IssuesPanel.tsx
src/editor/shell/LoadErrorBanner.tsx
src/editor/shell/NotificationPanel.tsx
src/editor/shell/PageTabBar.tsx
src/editor/shell/PreviewOverlay.tsx
src/editor/shell/PublishHistory.tsx
src/editor/shell/RecoveryBanner.tsx
src/editor/shell/SendForReview.tsx
src/editor/shell/SiteMenu.tsx
src/editor/shell/StructurePopover.tsx
src/editor/shell/StudioFooter.tsx
src/editor/shell/StudioHeader.tsx
src/editor/shell/StudioModals.tsx
src/editor/shell/StudioPanels.tsx
src/editor/shell/__tests__/PageTabBar.test.tsx
src/editor/shell/__tests__/StudioModals.test.tsx
src/editor/shell/hooks/__tests__/useBlockInsertion.test.tsx
src/editor/shell/hooks/useBlockInsertion.ts
src/editor/shell/hooks/useCmsSync.ts
src/editor/shell/hooks/useComponentSync.ts
src/editor/shell/hooks/useComposerInit.ts
src/editor/shell/hooks/useEditorShortcuts.ts
src/editor/shell/hooks/useExportHandlers.ts
src/editor/shell/hooks/useHistoryFeedback.ts
src/editor/shell/hooks/useSaveCallback.ts
src/editor/shell/hooks/useStudioHandlers.ts
src/editor/shell/hooks/useVersionSync.ts
src/editor/shell/modals/CMSCollectionSetupModal.tsx
src/editor/shell/modals/CMSRecordsModal.tsx
src/editor/shell/modals/CommandPalette.tsx
src/editor/shell/modals/ConflictModal.tsx
src/editor/shell/modals/CreateComponentModal.tsx
src/editor/shell/modals/ProjectSettingsModal.tsx
src/editor/shell/modals/StaleApprovalModal.tsx
src/editor/shell/modals/__tests__/CreateComponentModal.test.tsx
src/editor/shell/modals/__tests__/StaleApprovalModal.test.tsx
src/editor/sidebar/LeftSidebar.tsx
src/editor/sidebar/SidebarFallbacks.tsx
src/editor/sidebar/shared/DrillInHeader.tsx
src/editor/sidebar/shared/EmptyStates.tsx
src/editor/sidebar/shared/FeatureCard.tsx
src/editor/sidebar/shared/FilterChips.tsx
src/editor/sidebar/shared/PanelErrorState.tsx
src/editor/sidebar/shared/SearchBar.tsx
src/editor/sidebar/shared/StickyFooter.tsx
src/editor/sidebar/shared/ViewSwitcher.tsx
src/editor/sidebar/tabs/ComponentsTab.tsx
src/editor/sidebar/tabs/ElementsTab.tsx
src/editor/sidebar/tabs/ai/AITab.tsx
src/editor/sidebar/tabs/ai/AgentPlan.tsx
src/editor/sidebar/tabs/ai/ChatMessage.tsx
src/editor/sidebar/tabs/ai/Composer.tsx
src/editor/sidebar/tabs/ai/__tests__/AITab.test.tsx
src/editor/sidebar/tabs/ai/hooks/__tests__/useAiActionGate.test.ts
src/editor/sidebar/tabs/ai/hooks/useAiActionGate.ts
src/editor/sidebar/tabs/build/BuildTab.tsx
src/editor/sidebar/tabs/build/components/SearchResults.tsx
src/editor/sidebar/tabs/build/components/TipsFooter.tsx
src/editor/sidebar/tabs/build/hooks/useBuildTab.test.ts
src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx
src/editor/sidebar/tabs/component-library/ComponentRow.tsx
src/editor/sidebar/tabs/component-library/CreateComponentModal.tsx
src/editor/sidebar/tabs/component-library/DetachConfirmModal.tsx
src/editor/sidebar/tabs/component-library/__tests__/ComponentDetailScreen.pro-gate.test.tsx
src/editor/sidebar/tabs/content/ContentTab.tsx
src/editor/sidebar/tabs/content/ContentViews.tsx
src/editor/sidebar/tabs/elements/ElementCard.tsx
src/editor/sidebar/tabs/elements/__tests__/useElementsState.test.tsx
src/editor/sidebar/tabs/elements/useElementsState.ts
src/editor/sidebar/tabs/history/HistoryTab.tsx
src/editor/sidebar/tabs/history/components/ActivityView.tsx
src/editor/sidebar/tabs/history/components/MilestoneSuggestionBanner.tsx
src/editor/sidebar/tabs/history/components/TimeTravelScrubber.tsx
src/editor/sidebar/tabs/layers/LayersTab.tsx
src/editor/sidebar/tabs/layers/components/LayerContextMenu.tsx
src/editor/sidebar/tabs/media/MediaTab.tsx
src/editor/sidebar/tabs/media/__tests__/test-utils/renderMediaTab.tsx
src/editor/sidebar/tabs/media/components/AssetCell.tsx
src/editor/sidebar/tabs/media/components/AssetDetailOverlay.tsx
src/editor/sidebar/tabs/media/components/ConfirmDeleteModal.tsx
src/editor/sidebar/tabs/media/components/EmptyFolderDropZone.tsx
src/editor/sidebar/tabs/media/components/ExpandedMediaPanel.tsx
src/editor/sidebar/tabs/media/components/FolderBreadcrumb.tsx
src/editor/sidebar/tabs/media/components/FolderContextMenu.tsx
src/editor/sidebar/tabs/media/components/LibraryView.tsx
src/editor/sidebar/tabs/media/components/MediaContextMenu.tsx
src/editor/sidebar/tabs/media/components/MoveToFolderPopover.tsx
src/editor/sidebar/tabs/media/components/MultiSelectBanner.tsx
src/editor/sidebar/tabs/media/components/OnboardingEmptyState.tsx
src/editor/sidebar/tabs/media/components/ReplaceAcrossDialog.tsx
src/editor/sidebar/tabs/media/components/SelectionBanner.tsx
src/editor/sidebar/tabs/media/components/SelectionContextBar.tsx
src/editor/sidebar/tabs/media/components/SlimLauncher.tsx
src/editor/sidebar/tabs/media/components/StockSourceModal.tsx
src/editor/sidebar/tabs/media/components/TypePills.tsx
src/editor/sidebar/tabs/media/components/UploadZone.tsx
src/editor/sidebar/tabs/media/components/__tests__/Section12.test.tsx
src/editor/sidebar/tabs/media/components/__tests__/Section13_breadcrumb.test.tsx
src/editor/sidebar/tabs/media/components/__tests__/Section13_context_menu.test.tsx
src/editor/sidebar/tabs/media/components/__tests__/Section13_drag.test.tsx
src/editor/sidebar/tabs/media/components/__tests__/Section13_empty_folder.test.tsx
src/editor/sidebar/tabs/media/components/__tests__/Section14.integration.test.tsx
src/editor/sidebar/tabs/media/components/__tests__/Section15_alt_text.test.tsx
src/editor/sidebar/tabs/media/components/__tests__/Section15_replace.test.tsx
src/editor/sidebar/tabs/media/hooks/__tests__/useMediaState.panelExpanded.test.ts
src/editor/sidebar/tabs/media/hooks/__tests__/useMediaState.usageMap.test.tsx
src/editor/sidebar/tabs/media/hooks/useMediaState.ts
src/editor/sidebar/tabs/pages/PagesTab.tsx
src/editor/sidebar/tabs/pages/__tests__/PagesTab.test.tsx
src/editor/sidebar/tabs/pages/__tests__/usePages.test.tsx
src/editor/sidebar/tabs/pages/components/AddPageButton.tsx
src/editor/sidebar/tabs/pages/components/BulkToolbar.tsx
src/editor/sidebar/tabs/pages/components/PageCommandPalette.tsx
src/editor/sidebar/tabs/pages/components/PageContextMenu.tsx
src/editor/sidebar/tabs/pages/components/PageFolder.tsx
src/editor/sidebar/tabs/pages/components/PageList.tsx
src/editor/sidebar/tabs/pages/components/PageRow.tsx
src/editor/sidebar/tabs/pages/page-settings/AdvancedTab.tsx
src/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx
src/editor/sidebar/tabs/pages/page-settings/SeoTab.tsx
src/editor/sidebar/tabs/pages/page-settings/SettingsErrorBoundary.tsx
src/editor/sidebar/tabs/pages/page-settings/SocialTab.tsx
src/editor/sidebar/tabs/pages/page-settings/UnsavedWarningModal.tsx
src/editor/sidebar/tabs/pages/page-settings/__tests__/usePageSettings.test.tsx
src/editor/sidebar/tabs/pages/page-settings/usePageSettings.ts
src/editor/sidebar/tabs/pages/usePages.ts
src/editor/sidebar/tabs/publish/PublishTab.tsx
src/editor/sidebar/tabs/publish/__tests__/PublishTab.checks.test.tsx
src/editor/sidebar/tabs/publish/__tests__/PublishTab.test.tsx
src/editor/sidebar/tabs/review/ReviewTab.tsx
src/editor/sidebar/tabs/settings/SettingsTab.tsx
src/editor/sidebar/tabs/settings/screens/DomainsScreen.tsx
src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx
src/editor/sidebar/tabs/settings/screens/HeadersScreen.tsx
src/editor/sidebar/tabs/settings/screens/IntegrationsScreen.tsx
src/editor/sidebar/tabs/settings/screens/LocalizationScreen.tsx
src/editor/sidebar/tabs/settings/screens/LockedScreen.tsx
src/editor/sidebar/tabs/settings/screens/RedirectsScreen.tsx
src/editor/sidebar/tabs/settings/screens/SiteSettingsScreen.tsx
src/editor/sidebar/tabs/settings/screens/WebhooksScreen.tsx
src/editor/sidebar/tabs/settings/shared.tsx
src/editor/sidebar/tabs/templates/ApplyProgressOverlay.tsx
src/editor/sidebar/tabs/templates/TemplatePreviewModal.tsx
src/editor/sidebar/tabs/templates/TemplatesTab.tsx
src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx
src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.ia.test.tsx
src/editor/sidebar/tabs/templates/__tests__/TemplatesTab.layout.test.tsx
src/editor/sidebar/tabs/templates/components/TemplateDetail.tsx
src/editor/sidebar/tabs/templates/components/TemplatePagination.tsx
src/editor/sidebar/tabs/templates/components/TemplateUsageDrawer.tsx
src/engine/__tests__/autofix-history.integration.test.tsx
src/shared/forms/ColorField.tsx
src/shared/forms/FormSettingsSection.tsx
src/shared/forms/FormStateOverlay.tsx
src/shared/forms/InputField.tsx
src/shared/forms/NumberField.tsx
src/shared/forms/SelectField.tsx
src/shared/forms/SliderField.tsx
src/shared/forms/TextareaField.tsx
src/templates/MyTemplates.tsx
src/templates/SaveTemplate.tsx
src/templates/TemplatePreview.tsx

## (b) --bk-* consumers outside editor/ui (MUST KEEP WORKING)
src/blocks/Components/Accordion.tsx
src/blocks/Components/Modal.tsx
src/blocks/Components/PricingTable.tsx
src/blocks/Components/Slider.tsx
src/blocks/Components/SocialIcons.tsx
src/blocks/Components/Stack.tsx
src/blocks/Components/Switch.tsx
src/blocks/Components/Table.tsx
src/blocks/Components/Tabs.tsx
src/blocks/Media/Icon.tsx
src/blocks/Sections/HeroSection.tsx
src/editor/animation/AnimationEditor.tsx
src/editor/canvas/Canvas.css
src/editor/canvas/CanvasFooterToolbar.tsx
src/editor/canvas/DeviceFramePreview.tsx
src/editor/canvas/ZoomControls.tsx
src/editor/canvas/__tests__/CanvasFooterToolbar.containment.test.tsx
src/editor/canvas/canvasStyles.ts
src/editor/canvas/comments/CommentLayer.tsx
src/editor/canvas/controls/AiPromptPopover.css
src/editor/canvas/controls/BlockPickerModal.tsx
src/editor/canvas/controls/DeviceSelector.tsx
src/editor/canvas/controls/QuickAddBar.tsx
src/editor/canvas/controls/SmartSuggestions.tsx
src/editor/canvas/controls/UndoRedoControls.tsx
src/editor/canvas/controls/ZoomControl.tsx
src/editor/canvas/controls/toolbar/toolbarStyles.ts
src/editor/canvas/hooks/useCanvasElementDrag.ts
src/editor/canvas/overlays/DragHandle.tsx
src/editor/canvas/overlays/DropFeedbackOverlay.tsx
src/editor/canvas/overlays/ElementHoverOverlay.tsx
src/editor/canvas/overlays/ElementHoverOverlaySubComponents.tsx
src/editor/canvas/overlays/MediaQuickActions.tsx
src/editor/canvas/overlays/RemoteCursorsOverlay.tsx
src/editor/canvas/overlays/RulersOverlay.tsx
src/editor/canvas/overlays/SectionReorderHandles.tsx
src/editor/canvas/overlays/SelectionBoxOverlay.tsx
src/editor/canvas/overlays/SelectionHandles.tsx
src/editor/canvas/overlays/SpacingLabels.tsx
src/editor/canvas/overlays/TemplatePreviewPanel.tsx
src/editor/canvas/shared/CanvasButton.tsx
src/editor/canvas/shared/tokens.ts
src/editor/canvas/spots/CanvasSpot.tsx
src/editor/canvas/spots/CanvasSpotBadge.css
src/editor/canvas/spots/CanvasSpotBadge.tsx
src/editor/canvas/spots/CanvasSpotSpacing.css
src/editor/canvas/spots/CanvasSpotSpacing.tsx
src/editor/canvas/styled/OverlayStyles.ts
src/editor/canvas/styled/SelectionStyles.ts
src/editor/collaboration/PresenceIndicators.tsx
src/editor/components-catalog/ui/CatalogCard.tsx
src/editor/components-catalog/ui/CatalogSection.tsx
src/editor/components-catalog/ui/ComponentsPanelV2.tsx
src/editor/components-catalog/ui/DSStatusChip.tsx
src/editor/components-catalog/ui/DetachInstanceButton.tsx
src/editor/components-catalog/ui/UserSavedSection.tsx
src/editor/design-system/styles/design-tokens.css
src/editor/design-system/ui/AIPromptModal.tsx
src/editor/design-system/ui/ColorModeToggle.tsx
src/editor/design-system/ui/DSLintBanner.tsx
src/editor/design-system/ui/DSModeToggle.tsx
src/editor/design-system/ui/DesignSystemTab.tsx
src/editor/design-system/ui/DesignTabFooter.tsx
src/editor/design-system/ui/DraftChip.tsx
src/editor/design-system/ui/ExportDropdown.tsx
src/editor/design-system/ui/MigrationProgressModal.tsx
src/editor/design-system/ui/StarterGalleryModal.tsx
src/editor/design-system/ui/colors/ColorTokenList.tsx
src/editor/design-system/ui/colors/ColorTokenRow.tsx
src/editor/design-system/ui/modals/AddTokenModal.tsx
src/editor/design-system/ui/modals/ReviewModal.tsx
src/editor/design-system/ui/modals/TabGuardModal.tsx
src/editor/design-system/ui/presets/BindingRow.tsx
src/editor/design-system/ui/sections/ComponentsSection.tsx
src/editor/design-system/ui/sections/ExportSection.tsx
src/editor/design-system/ui/sections/ImportCard.tsx
src/editor/design-system/ui/sections/PresetBindingRow.tsx
src/editor/design-system/ui/sections/PresetDetailPane.tsx
src/editor/design-system/ui/sections/StyleCategoryRow.tsx
src/editor/design-system/ui/sections/StylesRouter.tsx
src/editor/design-system/ui/sections/TokenDetailView.tsx
src/editor/design-system/ui/sections/TokenKindCard.tsx
src/editor/design-system/ui/sections/TokenReplaceModal.tsx
src/editor/design-system/ui/sections/TokenRow.tsx
src/editor/design-system/ui/sections/TokenUsageChip.tsx
src/editor/design-system/ui/sections/TokensSection.tsx
src/editor/design-system/ui/sections/__tests__/TokenKindCard.test.tsx
src/editor/design-system/ui/sections/__tests__/TokensSection.test.tsx
src/editor/design-system/ui/spacing/SpacingTokenList.tsx
src/editor/design-system/ui/tokens/GenericTokenList.tsx
src/editor/design-system/ui/type/TypeTokenList.tsx
src/editor/ecommerce/CollectionSetupModal.tsx
src/editor/export/CodePreview.tsx
src/editor/export/ExportModal.tsx
src/editor/export/ExportOptions.tsx
src/editor/export/PreviewFrame.tsx
src/editor/inspector/ProInspector.tsx
src/editor/inspector/components/BatchStylePanel.tsx
src/editor/inspector/components/BindingPopover.tsx
src/editor/inspector/components/BreakpointPill.tsx
src/editor/inspector/components/DeleteConfirmModal.tsx
src/editor/inspector/components/InspectorElementMenu.tsx
src/editor/inspector/components/InspectorEmptyState.tsx
src/editor/inspector/components/InspectorErrorBoundary.tsx
src/editor/inspector/components/MultiSelectToolbar.tsx
src/editor/inspector/components/ScopeDropdown.tsx
src/editor/inspector/components/StateDropdown.tsx
src/editor/inspector/renderer/InspectorRenderer.tsx
src/editor/inspector/renderer/controlRegistry.tsx
src/editor/inspector/sections/AllCSSSection.tsx
src/editor/inspector/sections/AnimationSection.tsx
src/editor/inspector/sections/BackgroundSection.tsx
src/editor/inspector/sections/BorderSection.tsx
src/editor/inspector/sections/DSBindingChip.tsx
src/editor/inspector/sections/EffectsSection.tsx
src/editor/inspector/sections/GridSection.tsx
src/editor/inspector/sections/LinkSection.tsx
src/editor/inspector/sections/SizeSection.tsx
src/editor/inspector/sections/VariantSection.tsx
src/editor/inspector/sections/VisibilitySection.tsx
src/editor/inspector/sections/__tests__/BackgroundSection.controls.test.tsx
src/editor/inspector/sections/elementProperties/DataAttributeEditor.tsx
src/editor/inspector/sections/elementProperties/PropertyField.tsx
src/editor/inspector/sections/elementProperties/index.tsx
src/editor/inspector/sections/flexbox/AlignmentSection.tsx
src/editor/inspector/sections/flexbox/DirectionControls.tsx
src/editor/inspector/sections/flexbox/EnableFlexPrompt.tsx
src/editor/inspector/sections/flexbox/FlexItemControls.tsx
src/editor/inspector/sections/flexbox/GapControls.tsx
src/editor/inspector/sections/flexbox/controls.tsx
src/editor/inspector/sections/flexbox/index.tsx
src/editor/inspector/sections/interactions/AddInteractionPanel.tsx
src/editor/inspector/sections/interactions/InteractionEditor.tsx
src/editor/inspector/sections/interactions/InteractionItem.tsx
src/editor/inspector/sections/interactions/index.tsx
src/editor/inspector/sections/layout/ConstraintControl.tsx
src/editor/inspector/sections/layout/DisplayControls.tsx
src/editor/inspector/sections/layout/OverflowVisibilityControls.tsx
src/editor/inspector/sections/layout/PositionControls.tsx
src/editor/inspector/sections/layout/index.tsx
src/editor/inspector/sections/layout/previews.tsx
src/editor/inspector/sections/layout/styles.ts
src/editor/inspector/sections/typography/FontControls.tsx
src/editor/inspector/sections/typography/FontPicker.tsx
src/editor/inspector/sections/typography/FontPickerDropdown.tsx
src/editor/inspector/sections/typography/index.tsx
src/editor/inspector/shared/MixedValueBadge.tsx
src/editor/inspector/shared/TokenPickerPopover.tsx
src/editor/inspector/shared/__tests__/tokenBindingDetection.test.ts
src/editor/inspector/shared/controls/ColorInput.tsx
src/editor/inspector/shared/controls/ControlRow.tsx
src/editor/inspector/shared/controls/InputControls.tsx
src/editor/inspector/shared/controls/LinkedGapInput.tsx
src/editor/inspector/shared/controls/MoreSettingsToggle.tsx
src/editor/inspector/shared/controls/SliderControls.tsx
src/editor/inspector/shared/controls/SpacingControls.tsx
src/editor/inspector/shared/controls/TextControls.tsx
src/editor/inspector/shared/controls/controlStyles.ts
src/editor/inspector/styles/inspector.css
src/editor/media/AssetCard.tsx
src/editor/media/CropOverlay.tsx
src/editor/media/IconPickerModal.tsx
src/editor/media/ImageEditorModal.css
src/editor/media/ImageEditorModal.tsx
src/editor/media/ImageEditorStyles.ts
src/editor/media/LibraryManager.css
src/editor/media/LibraryManager.tsx
src/editor/media/MediaLibraryPanel.tsx
src/editor/media/MediaLibraryStyles.ts
src/editor/media/OptimizationPanel.tsx
src/editor/media/VideoPreview.tsx
src/editor/media/components/AssetDetailsPanel.tsx
src/editor/media/components/AssetGrid.tsx
src/editor/media/components/FolderTree.tsx
src/editor/media/components/ReplaceAcrossModal.tsx
src/editor/onboarding/AchievementPrompt.tsx
src/editor/onboarding/OnboardingChecklist.tsx
src/editor/panels/KeyboardShortcutsPanel.tsx
src/editor/panels/RichTextEditor.tsx
src/editor/panels/__tests__/RichTextEditor.test.tsx
src/editor/panels/layers/styles/layers-v2.css
src/editor/panels/version-history/ApprovedCompareView.tsx
src/editor/panels/version-history/CompareView.tsx
src/editor/panels/version-history/Toasts.tsx
src/editor/panels/version-history/VersionList.tsx
src/editor/rail/DrawerPanel.css
src/editor/rail/LayoutShell.css
src/editor/shell/AquibraStudio.tsx
src/editor/shell/IssuesPanel.tsx
src/editor/shell/LoadErrorBanner.tsx
src/editor/shell/PageTabBar.tsx
src/editor/shell/PreviewOverlay.tsx
src/editor/shell/PublishHistory.tsx
src/editor/shell/RecoveryBanner.tsx
src/editor/shell/StructurePopover.tsx
src/editor/shell/StudioFooter.tsx
src/editor/shell/StudioPanels.tsx
src/editor/shell/chrome.css
src/editor/shell/header.css
src/editor/shell/modals/CMSCollectionSetupModal.tsx
src/editor/shell/modals/CMSRecordsModal.tsx
src/editor/shell/modals/CommandPalette.tsx
src/editor/shell/modals/CreateComponentModal.tsx
src/editor/shell/modals/ProjectSettingsModal.tsx
src/editor/shell/modals/StaleApprovalModal.tsx
src/editor/sidebar/LeftSidebar.css
src/editor/sidebar/LeftSidebar.tsx
src/editor/sidebar/SidebarFallbacks.tsx
src/editor/sidebar/shared/DrillInHeader.tsx
src/editor/sidebar/shared/EmptyStates.css
src/editor/sidebar/shared/FeatureCard.tsx
src/editor/sidebar/shared/FilterChips.tsx
src/editor/sidebar/shared/SearchBar.tsx
src/editor/sidebar/shared/SkeletonStates.css
src/editor/sidebar/shared/StickyFooter.tsx
src/editor/sidebar/shared/ViewSwitcher.tsx
src/editor/sidebar/shared/headerIcons.tsx
src/editor/sidebar/shared/headerStyles.ts
src/editor/sidebar/tabs/ComponentsTab.tsx
src/editor/sidebar/tabs/ai/AITab.css
src/editor/sidebar/tabs/build/BuildTab.css
src/editor/sidebar/tabs/build/components/TipsFooter.tsx
src/editor/sidebar/tabs/component-library/ComponentsTab.css
src/editor/sidebar/tabs/component-library/CreateComponentModal.tsx
src/editor/sidebar/tabs/component-library/DetachConfirmModal.tsx
src/editor/sidebar/tabs/component-library/styles.ts
src/editor/sidebar/tabs/content/ContentViews.tsx
src/editor/sidebar/tabs/history/components/ActivityView.tsx
src/editor/sidebar/tabs/history/components/DiffRow.tsx
src/editor/sidebar/tabs/history/components/MilestoneSuggestionBanner.tsx
src/editor/sidebar/tabs/history/components/TimeTravelScrubber.tsx
src/editor/sidebar/tabs/history/styles/history.css
src/editor/sidebar/tabs/layers/components/LayerContextMenu.tsx
src/editor/sidebar/tabs/layers/components/__tests__/LayerContextMenu.test.tsx
src/editor/sidebar/tabs/media/MediaTab.css
src/editor/sidebar/tabs/media/MediaTab.tsx
src/editor/sidebar/tabs/media/components/AssetDetailOverlay.tsx
src/editor/sidebar/tabs/media/components/ExpandedMediaPanel.css
src/editor/sidebar/tabs/media/components/OnboardingEmptyState.tsx
src/editor/sidebar/tabs/media/components/SlimLauncher.css
src/editor/sidebar/tabs/media/components/StockSourceModal.tsx
src/editor/sidebar/tabs/pages/PagesTab.css
src/editor/sidebar/tabs/pages/PagesTab.tsx
src/editor/sidebar/tabs/pages/components/PageFolder.tsx
src/editor/sidebar/tabs/pages/components/SearchListingsTable.tsx
src/editor/sidebar/tabs/pages/page-settings/AdvancedTab.tsx
src/editor/sidebar/tabs/pages/page-settings/SeoTab.tsx
src/editor/sidebar/tabs/pages/page-settings/SettingsErrorBoundary.tsx
src/editor/sidebar/tabs/pages/page-settings/SocialTab.tsx
src/editor/sidebar/tabs/pages/page-settings/UnsavedWarningModal.tsx
src/editor/sidebar/tabs/publish/PublishTab.tsx
src/editor/sidebar/tabs/review/ReviewTab.tsx
src/editor/sidebar/tabs/settings/screens/AdvancedScreen.tsx
src/editor/sidebar/tabs/settings/screens/AnalyticsScreen.tsx
src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx
src/editor/sidebar/tabs/settings/screens/HeadersScreen.tsx
src/editor/sidebar/tabs/settings/screens/IntegrationsHub.tsx
src/editor/sidebar/tabs/settings/screens/IntegrationsScreen.tsx
src/editor/sidebar/tabs/settings/screens/LocalizationScreen.tsx
src/editor/sidebar/tabs/settings/screens/RedirectsScreen.tsx
src/editor/sidebar/tabs/settings/screens/SeoScreen.tsx
src/editor/sidebar/tabs/settings/screens/SiteSettingsScreen.tsx
src/editor/sidebar/tabs/settings/settings.css
src/editor/sidebar/tabs/settings/shared.tsx
src/editor/sidebar/tabs/settings/styles/index.ts
src/editor/sidebar/tabs/templates/ApplyProgressOverlay.css
src/editor/sidebar/tabs/templates/ApplyProgressOverlay.tsx
src/editor/sidebar/tabs/templates/TemplatePreviewModal.css
src/editor/sidebar/tabs/templates/TemplatesTab.css
src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx
src/editor/sidebar/tabs/templates/components/TemplateDetail.tsx
src/editor/sidebar/tabs/templates/components/TemplateUsageDrawer.tsx
src/engine/canvas/constants.ts
src/engine/elements/__tests__/ElementDataSchema.test.ts
src/shared/constants/canvas.ts
src/shared/constants/uiStyles.ts
src/shared/forms/ColorField.tsx
src/shared/forms/FileField.tsx
src/shared/forms/FormSettingsSection.tsx
src/shared/forms/FormStateOverlay.tsx
src/shared/forms/InputField.tsx
src/shared/forms/NumberField.tsx
src/shared/forms/SelectField.tsx
src/styles/tokens/canvas.tokens.ts
src/templates/MyTemplates.tsx
src/templates/TemplatePreview.tsx
src/themes/__tests__/badge.contrast.test.ts
src/themes/design-system/a11y.css
src/themes/legacy-components.css
src/themes/tokens.generated.css
src/themes/ux-fixes.css

## (c) CSS targeting bk- classes outside ui.css
src/editor/shell/header.css

## (d) overlay/portal call sites
src/editor/canvas/hooks/useCanvasElementDrag.ts:320:      document.body.appendChild(dragGhost); <!-- ALLOWLIST: drag-ghost DOM node (pre-seeded, spec §7) -->
src/editor/export/ExportModal.tsx:115:      document.body.appendChild(a); <!-- ALLOWLIST: transient download anchor (pre-seeded, spec §7) -->
src/editor/export/ExportModal.tsx:136:      document.body.appendChild(a); <!-- ALLOWLIST: transient download anchor, same pattern as :115 (new hit, not pre-seeded — second download handler in same file) -->
src/editor/export/ExportUtils.ts:64:  targetWindow.document.body.appendChild(iframe); <!-- ALLOWLIST: iframe injected into a separate popup window's document, not the app's own body (new hit) -->
src/editor/export/ExportUtils.ts:81:  document.body.appendChild(a); <!-- ALLOWLIST: transient download anchor (new hit, same downloadFile() pattern) -->
src/editor/media/AssetCard.tsx:149:    document.body.appendChild(ghost); <!-- ALLOWLIST: drag-ghost DOM node (pre-seeded, spec §7) -->
src/editor/shell/PageTabBar.tsx:335:        createPortal( <!-- OVERLAY: pre-seeded spec §4.4 site #1 -->
src/editor/shell/captureThumbnail.ts:49:    document.body.appendChild(frame); <!-- ALLOWLIST: off-screen capture frame (pre-seeded, spec §7) -->
src/editor/sidebar/tabs/elements/ElementCard.tsx:143:    document.body.appendChild(ghost); <!-- ALLOWLIST: drag-ghost DOM node (pre-seeded, spec §7) -->
src/editor/sidebar/tabs/elements/useElementsState.ts:180:      document.body.appendChild(ghost); <!-- ALLOWLIST: drag-ghost DOM node (pre-seeded, spec §7) -->
src/editor/sidebar/tabs/media/components/FolderContextMenu.tsx:103:  return createPortal(menu, document.body); <!-- OVERLAY: pre-seeded spec §4.4 site #3 -->
src/editor/sidebar/tabs/pages/components/PageContextMenu.tsx:167:  return createPortal(menu, document.body); <!-- OVERLAY: pre-seeded spec §4.4 site #2 -->
src/editor/sidebar/tabs/pages/components/PageContextMenu.tsx:5: * - Renders via createPortal(menu, document.body) <!-- ALLOWLIST: JSDoc comment text, not executable code — real call site is :167 above (new hit, grep noise) -->
src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx:194:      document.body.appendChild(a); <!-- ALLOWLIST: transient download anchor, CSV export (new hit) -->
src/editor/sidebar/tabs/templates/ApplyProgressOverlay.tsx:72:  return createPortal( <!-- OVERLAY: pre-seeded spec §4.4 site #5 -->
src/editor/sidebar/tabs/templates/TemplatePreviewModal.tsx:155:  return createPortal( <!-- OVERLAY: pre-seeded spec §4.4 site #4 -->
src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx:113:  createPortal( <!-- OVERLAY: ProModal, same file/pattern as pre-seeded :40 (new hit — file has 5 modal exports, only 1 was pre-seeded) -->
src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx:183:  createPortal( <!-- OVERLAY: CreatePageConfirmModal, same file/pattern (new hit) -->
src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx:216:  createPortal( <!-- OVERLAY: CreatePageSuccessModal, same file/pattern (new hit) -->
src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx:249:  createPortal( <!-- OVERLAY: CreatePageErrorModal, same file/pattern (new hit) -->
src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx:40:  createPortal( <!-- OVERLAY: ReplaceModal, pre-seeded spec §4.4 site #6 -->
src/editor/ui/OverlayMount.tsx:32:  return createPortal( <!-- OVERLAY: current Gate-22-exempt scrim/focus-trap primitive — portals straight to document.body today; itself must retarget to the new single overlay root under §4.4 policy -->
src/editor/ui/Portal.tsx:22:    document.body.appendChild(root); <!-- ALLOWLIST: creates the current `#bk-overlay-root` container div (one-time infra), the direct predecessor §4.4 names as "successor of #bk-overlay-root" — superseded by the shell-owned single root at teardown, not a floating-UI call site itself -->
src/editor/ui/Portal.tsx:33:  return createPortal(children, root); <!-- OVERLAY: portals consumer surfaces into today's `#bk-overlay-root`, the target §4.4 replaces with the new single shell-owned root -->
src/editor/ui/Toast.tsx:115:  return createPortal( <!-- OVERLAY: pre-seeded spec §4.4 site #7 -->
src/engine/components/ComponentStorage.ts:280:  document.body.appendChild(link); <!-- ALLOWLIST: transient download anchor, component JSON export (new hit) -->
src/engine/export/ExportEngine.ts:847:    document.body.appendChild(a); <!-- ALLOWLIST: transient download anchor, ZIP export (new hit) -->
src/engine/export/ExportHelpers.ts:126:  document.body.appendChild(a); <!-- ALLOWLIST: transient download anchor (new hit) -->
src/engine/storage/VersionHistoryStorage.ts:312:  document.body.appendChild(a); <!-- ALLOWLIST: transient download anchor, version-history JSON export (new hit) -->
src/shared/utils/html/accessibility.ts:125:  document.body.appendChild(el); <!-- ALLOWLIST: visually-hidden aria-live screen-reader announcer node, not a rendered overlay (new hit) -->

## Test parity baseline (step 3)

`npx vitest run src/editor/ui/__tests__` (run from `packages/editor`):

```
 Test Files  9 passed (9)
      Tests  145 passed (145)
```

Matches the spec-recorded baseline of 145 as of 2026-07-30.

## @source set (step 4)

Unique top-level dirs of list (a), mechanically derived (`awk -F/ '{print $1"/"$2}'` over
section (a), deduped):

```
src/editor
src/engine
src/shared
src/templates
```

Reconciled against spec's expected set (`src/editor/**`, `src/shared/forms/**`,
`src/templates/**`):

- `src/editor/**` — confirmed, matches.
- `src/shared/forms/**` — confirmed at the expected 3rd-level granularity (only
  `src/shared/forms/*.tsx` files import `@/editor/ui`; no other `src/shared/*`
  subdir does).
- `src/templates/**` — confirmed (`MyTemplates.tsx`, `SaveTemplate.tsx`,
  `TemplatePreview.tsx`).
- `src/engine/**` — **NOT in spec's expected set.** Mechanical grep found one hit:
  `src/engine/__tests__/autofix-history.integration.test.tsx:27` imports
  `ToastProvider` from `@/editor/ui`. This is a single test-only file (a
  pre-existing violation of the "engine/ never imports editor/" architecture
  rule, not introduced by this task) and is not part of the production build
  Tailwind needs to scan. Recommend Task 2 exclude test-only leaf imports from
  the actual `@source` glob set (keep the spec's 3-entry list for the real
  `@source` directives) but this file still needs its `@/editor/ui` import
  migrated in the sweep since list (a) is also "Tasks 6-12 sweep scope" per the
  brief's interface contract — flagging here so it isn't missed.

## Behavior parity verdicts (Task 4)

Evaluated flowbite-react 0.12.17 against the shipped `editor/ui`/`chrome-ui`
contracts by rendering each flowbite component and inspecting real DOM output
(jsdom + `@testing-library/react`), cross-checked against
`node_modules/flowbite-react/dist/**` and `@floating-ui/react` source. Suite:
`src/editor/chrome-ui/__tests__/flowbite-parity.test.tsx`, 16/16 green
(assertions document ACTUAL observed behavior, not aspirational behavior — a
failing block would have been a KEEP verdict; every block here converged to a
documenting assertion of what flowbite really does).

Tasks 5-12 obey these verdicts. Per the Task 4 scope amendment, moving KEEP
primitives into `chrome-ui/` and restyling them is Tasks 5/6's job, not this
step's — this table is the decision record only.

| Component | Verdict | Decisive evidence |
|---|---|---|
| **Modal** | **KEEP** | `root?: HTMLElement` exists (`Modal.d.ts`) so portal-targeting `#bk-overlay-root` (spec §4.4) works — that alone would read SWAP. Decisive evidence #1: `aria-modal` is **never emitted**. Grepping the entire `@floating-ui/react` package for `"aria-modal"` returns zero matches; `useRole`'s floating props are only `{ id, role: 'dialog' }` (`floating-ui.react.mjs:3861-3866`). Live-rendered: `document.querySelector('[role="dialog"]').getAttribute('aria-modal')` is `null`. `isModalOpen()` (`src/editor/chrome-ui/focus.ts:78`) is `document.querySelector('[role="dialog"][aria-modal="true"]')` — the sole enforcement point for the ff230492 fix ("an open modal owns the keyboard — everywhere, not just ⌘K"), consumed by `src/editor/shell/StudioHeader.tsx:248`, `src/editor/shell/hooks/useEditorShortcuts.ts:75`, and `src/editor/canvas/comments/CommentLayer.tsx:213`. Our own `OverlayMount` stamps both attributes together (`src/editor/ui/OverlayMount.tsx:39`) — proof the pairing is load-bearing. A caller *can* pass `aria-modal="true"` manually (verified: it lands via the `restProps → getFloatingProps` spread onto the dialog div) but nothing requires it — the prop is optional, TypeScript won't flag its absence, and omitting it silently reproduces the exact production bug ff230492 fixed. **Decisive evidence #2** (fix round 1, reviewer finding): even with `dismissible` set AND `aria-modal="true"` manually added, Escape still **leaks to a bubble-phase `document` keydown listener** — verified live: a `vi.fn()` registered via `document.addEventListener("keydown", ...)` (default bubble phase) IS called when Escape closes the modal. `@floating-ui/react`'s `useDismiss` registers its own Escape handler on `document` in the bubble phase and never calls `stopPropagation` (`floating-ui.react.mjs:2772-2773`), unlike our `useFocusTrap`, whose capture-phase handler (`chrome-ui/focus.ts:57`) calls `e.stopPropagation()` (`chrome-ui/focus.ts:39`) before any bubble-phase listener — including a global shortcut handler — gets a chance to run. This means adopting flowbite's Modal as-is would let a stray app-level `keydown` listener double-react to the same Escape a modal just consumed. Secondary findings: Escape-to-close is opt-in via `dismissible` (default `false` — `useDismiss(context, { enabled: dismissible })` in `Modal.js`; verified Escape is a no-op without it, fires `onClose` with it); focus-trap-on-open does work but only after an async flush (`document.activeElement` is still `document.body` synchronously after `render()`), not synchronously like `useFocusTrap` (`chrome-ui/focus.ts:16-30`). |
| **Dropdown / Menu** | **KEEP** | Not a portalling problem — `Dropdown.js` never calls `createPortal`/`FloatingPortal` (zero matches), it renders inline in the React tree, already matching "anchored, not portalled" (`ui/Popover.tsx:4`) — spec §4.4's portal-target requirement doesn't even apply. Roving arrow-key focus and return-focus-to-trigger-on-Escape **do** work (`@floating-ui/react` `useListNavigation` + `FloatingFocusManager`, `Dropdown.js:100,154`) — verified, though only after an async flush, not synchronously. Decisive gap is API shape: `DropdownItemProps` (`DropdownItem.d.ts`) has no checked/selected field and `DropdownItem` always renders `role="menuitem"` (`DropdownItem.js:41`) — never `menuitemcheckbox` — while our `Menu`'s roving-focus selector explicitly includes both roles (`ITEM_SELECTOR`, `src/editor/ui/Popover.tsx:86`) because `MenuItem` supports a checkable variant (`selected` prop, `Popover.tsx` MenuItemProps). Any caller using a checkable menu item has no flowbite equivalent without a rewrite. |
| **Popover** | **KEEP** | Structurally already matches "anchored, not portalled" — `Popover.js` has no `createPortal`/`FloatingPortal` call (same inline `Fragment` pattern as Tooltip), so §4.4 doesn't apply. Decisive gaps are behavioral: (1) `Popover.js` always wraps its panel in `FloatingFocusManager({ context, modal: true })` — an **unconditional** focus trap, verified: opening a Popover renders floating-ui focus-guard elements (`[data-floating-ui-focus-guard]`) AND marks the trigger `aria-hidden="true"` + `data-floating-ui-inert=""` (the rest of the page goes inert while it's open) — while our Popover intentionally traps nothing, only closing on Escape/outside pointer-down (`src/editor/ui/Popover.tsx:1-11`), so e.g. a filter popover next to other toolbar buttons stays reachable. (2) `PopoverProps.content` (`Popover.d.ts`) is a single fixed `ReactNode` slot, while ours takes `trigger` + arbitrary composed `children` as the panel body (`PopoverProps`, `ui/Popover.tsx:18-29`) — real callers composing our `Menu` inside a Popover would need restructuring independent of the trap question. |
| **Tooltip** | **SWAP** | `Floating.js` (Tooltip's primitive) never calls `createPortal` (zero matches) — trigger and floating content render as plain sibling `<div>`s in React's own tree, already satisfying "anchored, not portalled" with no `root` prop needed since there's nothing to aim. `TooltipProps.trigger` is typed `"hover" \| "click"` (`Tooltip.d.ts`) with no explicit `"focus"` option, but this reads narrower than it behaves: `hooks/use-floating.js`'s `useFloatingInteractions` unconditionally includes `useFocus(context)` regardless of the `trigger` prop (`Floating.js` always builds `interactions: [focus]`) — verified: a Tooltip shows on keyboard focus even with the default `trigger="hover"`. No behavior gap found against the shipped contract. |
| **Toast** | **KEEP** | `Toast.js` is a single static container: no queue/store, no auto-dismiss timer (`duration` only selects a CSS transition-duration class via the `durationClasses` map — nothing calls `setTimeout`; verified with fake timers: content survives a 5s advance past a 75ms `duration`), no built-in action-button slot, no `aria-live` viewport (`role="alert"` only). Every one of those is load-bearing in ours: the module-level `store` (`src/editor/ui/Toast.tsx:49`) feeds every `useToast().addToast()` call site, `ToastItem` self-dismisses via a real timer (`ui/Toast.tsx:135`), and `ToastViewport` sets `aria-live` polite/assertive by tone (`ui/Toast.tsx:119`). flowbite-react gives a styled shell to build that lifecycle on top of, not the lifecycle itself. |

**Net for Tasks 5-12**: only **Tooltip** swaps to flowbite-react directly.
Modal, Dropdown/Menu, Popover, and Toast all move to `chrome-ui/` as kept
primitives, restyled with Tailwind (`tw:*` utility classes, `ui.css` blocks
retired) but keeping their current React implementation and behavior
contracts intact — that move + restyle is Task 5/6 scope, not this task's.

## Task 5 — component swap API mappings

Color-fidelity method: every mapping below was checked against real hex
values — `src/themes/tokens.generated.css` (our `--bk-*`) vs
`node_modules/flowbite-react/dist/plugin/tailwindcss/index.css` (flowbite's
`--primary-*`/`--blue-*`/`--gray-*`/`--red-*`/`--green-*` ramps), not
eyeballed. Confirmed exact hex matches (post-07-28 Figma rebase to
`#1A56DB`):

| `--bk-*` token | hex | flowbite ramp step | hex |
|---|---|---|---|
| `--bk-accent` | `#1A56DB` | `blue-700` / `primary-700` (default color) | `#1A56DB` |
| `--bk-accent-hover` | `#1E429F` | `blue-800` | `#1E429F` |
| `--bk-accent-pressed` | `#233876` | `blue-900` | `#233876` |
| `--bk-bg-card` | `#FFFFFF` | `light` color's `bg-white` | `#FFFFFF` |
| `--bk-ink` | `#111827` | `gray-900` | `#111827` |
| `--bk-ink-soft` | `#4B5563` | `gray-600` | `#4B5563` |
| `--bk-bg-subtle` | `#F3F4F6` | `gray-100` | `#F3F4F6` |
| `--bk-border-medium` | `#D1D5DB` | `gray-300` (`light` color's border) | `#D1D5DB` |
| `--bk-error-text` | `#C81E1E` | `red-700` (`red` color's base bg) | `#C81E1E` |
| `--bk-success-tint` | `#DEF7EC` | `green-100` | `#DEF7EC` |
| `--bk-success-text` | `#057A55` | `green-600` | `#057A55` |

### Button → `flowbite-react` `Button`

`src/editor/ui/Button.tsx` (`kind`, `size`, `loading`) →
`node_modules/flowbite-react/dist/components/Button/Button.d.ts` (`color`,
`size`, `outline`, `pill`).

| Our prop | Flowbite prop | Notes |
|---|---|---|
| `kind="primary"` (default) | *(omit `color`)* | flowbite's own default color (`bg-primary-700`) already **is** `--bk-accent` — exact hex match, zero override needed. |
| `kind="secondary"` | `color="light"` | `bg-white`/`text-gray-900`/`hover:bg-gray-100` all exact `--bk-*` matches; border resolves to `gray-300` (`--bk-border-medium`, not `--bk-border`) — accepted, still an exact token, just the adjacent step. |
| `kind="ghost"` | `color="light"` + `className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"` | flowbite has no borderless/transparent color preset; built one from exact-match utilities (`gray-600`=`--bk-ink-soft`, `gray-100` hover bg from the unmodified `light` theme, `gray-900`=`--bk-ink` hover text). `className` merges through flowbite's own `twMerge` call, so this reliably wins over the theme's `border-gray-300 bg-white` regardless of prop order. |
| `kind="destructive"` | `color="red"` | flowbite's `red` base is `red-700` (`#C81E1E`, exact match to `--bk-error-text`) rather than our old `--bk-error`/`red-600` (`#E02424`) base — one ramp step off; accepted as the closest predefined color rather than a bespoke hex override, since `red-700` is itself one of our real token hex values (just the "text" variant, not "base"). |
| `size="sm"` | `size="xs"` | brief's own worked example; `xs` (32px) is flowbite's closest compact step. |
| `size="md"` / omitted | *(omit `size`)* | flowbite's default size is already `"md"`. |
| `loading={x}` | `disabled={x}` (or `disabled={existingDisabled || x}` if both were present) + `aria-busy={x || undefined}` | flowbite `Button` has no `loading` prop; translated to the same disable-while-busy behavior our `loading` produced, `aria-busy` reproduced explicitly (`|| undefined` so React omits the attribute rather than rendering `aria-busy="false"`, matching the old component's own `loading || undefined`). |
| `type`, `ref`, `disabled`, `onClick`, `aria-*`, `data-*`, `style`, `className` (non-ghost) | unchanged, pass through | `ButtonBase` (`ButtonBase.js`) spreads all rest props onto the underlying `<button>`/`<a>` and defaults `type="button"` itself — identical default to ours. |

**Cascade-layer finding (load-bearing for every remaining swap, not just
Button):** `src/themes/default.css` declares `@layer reset, components,
overrides;` then imports `tw.css` (which declares `@layer tw-theme,
tw-utilities;`) *before* importing `ui.css` `layer(components)`. Global layer
order ends up `reset < components < overrides < tw-theme < tw-utilities`.
Any `ui.css` rule (i.e. anything in the `components` layer, e.g.
`.bk-topbar__published:disabled`, `.bk-toast__close`) is **weaker** than a
flowbite component's own theme classes and can no longer be trusted to
override them by specificity — it will silently lose. By contrast, CSS files
imported directly by a `.tsx` file via a plain `import "./X.css"` (e.g.
`MediaTab.css`, `AITab.css`, `LeftSidebar.css`, `CanvasFooterToolbar`'s inline
`style`) are genuinely **unlayered** and still win over anything layered,
regardless of layer order — verified case by case (below) before leaving
those className-merge sites untouched.

Found and fixed 2 real instances of the layer trap: `Topbar.tsx`'s
`.bk-topbar__published:disabled` (green "✓ Published" success tint) and
confirmed `.bk-toast__close` had no bg/color rule to lose (`flex: none` only,
so no risk). `Topbar.tsx`'s published-state Button now bakes the look
directly into `tw:` utilities on the element (`tw:bg-green-100
tw:text-green-600` — exact hex matches to `--bk-success-tint`/`-text` — plus
`tw:opacity-100` to beat flowbite's own `disabled` class's `opacity-50`)
instead of relying on the now-too-weak `components`-layer selector.

**Consumers swept:** 237 files via `@/editor/ui` import (per
`import_map.json`, built by scanning every file in list (a) for its actual
named imports — see Task 5 sweep methodology below) + 5 more found only by
`tsc`/grep because they import `./Button` relatively from inside
`src/editor/ui/` itself (`ConfirmDialog.tsx`, `HelpTooltip.tsx`, `Toast.tsx`,
`Topbar.tsx`, `UpgradeModal.tsx` — none of these matched the `@/editor/ui`
alias scan since they're siblings of `Button.tsx`) + `PanelHeader.tsx` /
`PanelFrame.tsx`, which never imported the `Button` *component* at all but
used raw `<button className="bk-btn bk-btn--ghost bk-btn--sm">` directly —
caught only by grepping for `bk-btn` before deleting its `ui.css` block, and
converted to flowbite `Button` too for consistency (Gate 24 exempts
`editor/ui/` from the raw-native-element ban, but there is no other owner of
that visual contract now that `.bk-btn` is gone) + 4 test files
(`field-popover.test.tsx`, `molecules.test.tsx`, `organisms.test.tsx`,
`toast.test.tsx`) that import `Button` from `../index` as a generic click
target in test harnesses.

**Sweep methodology note:** a naive `rg -l "Button" $(rg -l "@/editor/ui"
src)` over-matches badly for a name this generic (`kind=`/`size=` collide
with `Badge`, `ConfirmDialog`, `Row`, `TreeRow`, etc.). Built
`scripts` (scratch, not committed) that (1) parsed every file's actual
`import { ... } from "@/editor/ui"` statement(s) to get a precise
component→consumer-file map, then (2) ran a `ts-morph` codemod that only
touches JSX elements whose tag name is literally `Button` — immune to the
`kind=`/`size=` false-positive problem entirely, since it operates on the
AST, not text. One caveat found the hard way: a file with **two separate**
`@/editor/ui` import statements (13 such files) can have `Button` in the
*second* one; the first codemod pass used `.find()` and only checked the
first import declaration, silently skipping `src/editor/sidebar/LeftSidebar.tsx`
entirely (`ConfirmDialog` was in its first import, `Button`/`Tooltip` in its
second) — caught by the post-delete `tsc` pass, fixed by hand. `tsc --noEmit`
after deleting `Button.tsx` is the real safety net regardless of sweep
method: 0 errors is the only trustworthy proof nothing was missed.

**Dynamic `kind=` sites** (9, across 6 files — ternaries between two of our
four kind values, e.g. `kind={mode === m ? "primary" : "ghost"}`): the
codemod flagged these (can't statically resolve a ternary) rather than
guess; fixed by hand as `color={cond ? undefined : "light"}` +
`className={cond ? undefined : GHOST_CLASS}` (or just `color={cond ?
undefined : "light"}` alone when neither branch was ghost).

**Ghost-Button-with-non-literal-`className`** (9 sites, 6 files — template
literals or props the codemod couldn't safely string-concat): each verified
individually against its CSS source before deciding no `tw:` override was
needed — every one resolved to either (a) a bespoke unlayered custom class
(`.med-type-pill`, `.med-detail-tab`, `.bd-ai-mode-btn`, `.ls-btn`,
`.med-asset-cell`, `.med-folder-breadcrumb__seg` — all imported via plain
`import "./X.css"`, none routed through `default.css`'s `@layer`) that fully
repaints background/border/color and therefore wins regardless of the
`components`-vs-`tw-utilities` layer gap, or (b) a full inline `style` prop
on the same element (higher specificity than any class, layered or not) that
already sets `background`/`border`/`color` unconditionally
(`CanvasFooterToolbar.tsx`'s `zoomBtnStyles`/`zoomPctStyles`, its
`OverlayButton`'s own `style`).

### Badge → `flowbite-react` `Badge`

`src/editor/ui/Badge.tsx` (`kind`) →
`node_modules/flowbite-react/dist/components/Badge/Badge.d.ts` (`color`,
`size`, `icon`). Default flowbite color is `"info"` (cyan) — every kind
below needs an explicit `color`, unlike Button's primary/default overlap.

| Our `kind` | Flowbite `color` | `className` override | Why |
|---|---|---|---|
| `neutral` | `gray` | *(none)* | `bg-gray-100`/`text-gray-800` are exact hex matches to `--bk-gray-100`/`--bk-gray-800`. |
| `success` | `success` (≡ `green`) | `tw:text-green-600` | bg `green-100` exact match to `--bk-success-tint`; flowbite's preset text is `green-800` (`#03543F`) but `--bk-success-text` is `green-600` (`#057A55`) — one ramp step off, overridden. |
| `warning` | `warning` (≡ `yellow`) | `tw:bg-yellow-50` | flowbite's preset text `yellow-800` (`#723B13`) already exact-matches `--bk-warning-text` — no text override needed. Its bg `yellow-100` (`#FDF6B2`) does NOT match `--bk-warning-tint` (`#FDFDEA` = `yellow-50`) — overridden. |
| `danger` | `failure` (≡ `red`) | `tw:text-red-700` | bg `red-100` exact match to `--bk-error-tint`; flowbite's preset text `red-800` (`#9B1C1C`) vs `--bk-error-text` `red-700` (`#C81E1E`) — overridden. |
| `pro` | `purple` | *(none)* | `bg-purple-100`/`text-purple-800` exact hex matches to `--bk-purple-100`/`--bk-purple-800` (this one pre-existing purple usage is a deliberate Figma-generated "premium" semantic token, not a new accent-color choice — DESIGN.md's purple ban is about the brand accent, left as-is, not introduced by this task). |

**Border dropped.** `.bk-badge` always had a 1px kind-colored border;
flowbite's `Badge` theme has no border class at all (`root.base` has none,
neither does `icon.off`/`icon.on`). Accepted as a shape difference (pill vs.
bordered chip) rather than reproduced via a `tw:border-*` add-on — consistent
with letting flowbite's own visual language stand for structural properties,
reserving exact-hex-match effort for color only.

**Adapter judgment call:** the kind→{color,className} mapping is genuine
prop transformation (not pass-through) and is duplicated identically across
9 consumer files (`ReviewTab.tsx`, `IntegrationRow.tsx`, `MediaCard.tsx`,
plus 6 more with a single literal kind). Did **not** promote it to a shared
utility/wrapper: each of the 5 kind→props pairs is inlined at its call site
(literal `color="gray"`, or a small local `Record` when the kind is dynamic
— `ReviewTab.tsx`'s `BADGE_KIND`, `IntegrationRow.tsx`'s `STATUS`,
`MediaCard.tsx`'s `BADGE_KIND_PROPS`). A one-function shared file for 5
literal prop pairs would violate CLAUDE.md's "don't create utility files
with one function" and add a lookup indirection for something this small;
same precedent as Button's ghost-class string, which is also just repeated
inline rather than centralized.

**Consumers swept:** 5 via `@/editor/ui` (`PublishHistory.tsx`,
`ReviewTab.tsx`, `LockedScreen.tsx`, `MyTemplates.tsx`,
`TemplatePreview.tsx`) + 4 relative-import siblings inside `editor/ui/`
(`IntegrationRow.tsx`, `MediaCard.tsx`, `UpgradeModal.tsx`,
`VersionRow.tsx` — same blind spot as Button's internal consumers) + 1 test
file (`atoms.test.tsx`, `describe("Badge", ...)` block deleted — its
`bk-badge--${kind}` class assertions have no flowbite equivalent worth
re-testing, coverage now lives in the 9 consumer files' own tests).
`MediaCard.tsx`'s exported `BadgeKind` type (used by its own `badgeKind`
prop, zero external consumers per the import scan) redefined locally in the
same file rather than re-sourced from the deleted `Badge.tsx`.
`src/themes/__tests__/badge.contrast.test.ts` left untouched — pre-existing
failure unrelated to this component (reads a `themes/components/atoms/
badge.css` path deleted years ago in the vibcoder cleanup, tracked
separately per `progress.md`, not `editor/ui/Badge.tsx`).

Verified: `tsc --noEmit` clean; 251 tests green across `ui/__tests__`,
`sidebar/tabs/review`, `sidebar/tabs/settings/screens`, `templates/`, plus
`shell/__tests__/PublishHistory.test.tsx` (8/8).

### Avatar → `flowbite-react` `Avatar`

`src/editor/ui/Avatar.tsx` (`size`, `tone`, `self`, `name`, `src`) →
`node_modules/flowbite-react/dist/components/Avatar/Avatar.d.ts` (`size`,
`color`, `bordered`, `rounded`, `img`, `alt`, `placeholderInitials`).

| Our prop | Flowbite prop | Notes |
|---|---|---|
| `name` (required, auto-derives initials) | `placeholderInitials` | flowbite never derives initials itself — moved the derivation into a small shared `avatarInitials()` helper (`editor/ui/avatarTone.ts`), called at each of the 2 call sites. |
| `src` | `img` | rename only. |
| *(implicit — ours is always circular)* | `rounded` (now required at every call site) | flowbite defaults to **square** (`rounded` defaults `false`) — every call site now passes `rounded` explicitly. |
| `size="sm"` (default) | `size="xs"` | flowbite's smallest preset (24px) is still bigger than our 20px default; no exact size match exists, same "closest step down" precedent as Button. Both real consumers only ever use the default, so `size="md"` was never exercised — not mapped. |
| `tone` | *(no direct prop — see below)* | **Structural gap, not a simple rename.** |
| `self` | *(no direct prop — see below)* | **Structural gap, not a simple rename.** |
| `role="img"`, `aria-label={name}`, `title={name}` | unchanged, pass through | flowbite's `Avatar` root is a plain unstyled `<div>` — no `role`/`aria-label` of its own (verified: zero occurrences in `Avatar.js`) — these land via the `...restProps` spread onto the same element exactly as before. |

**Structural gap — `color` doesn't reach the initials bubble.** Verified via
`Avatar.js`/`theme.js`: flowbite's `color` prop only recolors the
`bordered` ring (`theme.root.color[color]`, applied only when
`bordered={true}`); the initials-placeholder background/text
(`theme.root.img.off` / `theme.root.initials.text`) are **hardcoded**
`bg-gray-100`/`text-gray-600` regardless of `color`. Since `Presence.tsx`'s
whole point is recoloring each collaborator's avatar by a hash of their id
(`toneFor()`), this is not a cosmetic nice-to-have — it's the feature.
Fixed via flowbite's per-instance `theme` prop (`ThemingProps<AvatarTheme>`,
deep-merged through flowbite's own `twMerge` in `resolve-theme.js` — a
`tw:bg-*`/`tw:text-*` override there correctly *replaces* the default
rather than concatenating alongside it, verified by reading
`resolveTheme()`'s `deepMergeStrings(twMerge)` call). `self`'s accent-ring
outline has no flowbite equivalent either (`bordered`+`color` produces a
`ring-*` box-shadow that isn't `--bk-accent`-colorable per-tone
independent of the initials color) — replicated instead as a plain
`tw:outline tw:outline-2 tw:outline-blue-700 tw:outline-offset-2`
className on the outer wrapper (`blue-700` = exact hex match to
`--bk-accent`).

| Our tone | flowbite `theme` override | Hex check |
|---|---|---|
| `neutral` | `tw:bg-gray-200` / `tw:text-gray-700` | exact match to `--bk-gray-200`/`--bk-gray-700` (flowbite's own untouched default is `gray-100`/`gray-600` — one step lighter, so `neutral` needs an override too, not just the 4 named tones). |
| `blue` | `tw:bg-blue-100` / `tw:text-blue-800` | exact match to `--bk-blue-100`/`--bk-blue-800`. |
| `green` | `tw:bg-green-100` / `tw:text-green-800` | exact match to `--bk-green-100`/`--bk-green-800`. |
| `purple` | `tw:bg-purple-100` / `tw:text-purple-800` | exact match to `--bk-purple-100`/`--bk-purple-800`. |
| `amber` | `tw:bg-yellow-100` / `tw:text-yellow-800` | exact match to `--bk-yellow-100`/`--bk-yellow-800`. |

**Adapter judgment call (justification per Task 5 brief):** created
`src/editor/ui/avatarTone.ts` — a plain data/function module (`avatarInitials()`
+ the `AVATAR_TONE_THEME` table above), **not** a React component wrapper
around `Avatar`. Both of Avatar's 2 real consumers (`CommentRow.tsx`,
`Presence.tsx`) need the identical initials algorithm and identical 5-tone
table; duplicating a `for`-loop-derived initials function and a 5-entry
nested-object theme table across 2 files is exactly the "same concept, same
calculation" case CLAUDE.md rule 3 (no duplicate logic) targets, so it was
extracted rather than repeated (unlike Button's ghost-class string or
Badge's kind→color table, which stayed inlined because those really are
just literal prop values, not an algorithm or a structurally-necessary
`theme`-prop object). Consumers still import `Avatar` from `flowbite-react`
directly — the helper module exports no component, only data and a pure
function, so it doesn't reintroduce the pass-through-wrapper pattern this
task drains.

**Consumers swept:** 0 external (`Avatar` was never imported via the
`@/editor/ui` alias — confirmed via the import-map scan) — its only 2 real
consumers, `CommentRow.tsx` and `Presence.tsx`, import `./Avatar` relatively
from inside `editor/ui/` itself (the same blind spot Button's and Badge's
sweeps hit). A third `catalog.ts` "Avatar" hit is a component-picker
display-name string, not an import. `atoms.test.tsx`'s `describe("Avatar",
...)` block rewritten (not deleted) to test `avatarInitials()` directly
plus flowbite's own image/initials rendering, since those are genuine
behavior worth covering and neither had a home in `CommentRow`/`Presence`
(neither has its own dedicated test file).
`collaboration/__tests__/PresenceIndicators.test.tsx` — 2 assertions
rewritten from `bk-avatar--self`/`bk-avatar--{tone}` class-string matches to
`tw:outline-blue-700` and a `tw:bg-*` match on the initials-bubble testid
(`role`/`aria-label` assertions elsewhere in the same file needed no
change, since those attributes pass through unchanged).

Verified: `tsc --noEmit` clean; `ui/__tests__` 136/136,
`collaboration/__tests__/PresenceIndicators.test.tsx` 11/11,
`canvas/comments/__tests__/CommentLayer.test.tsx` 10/10 (renders
`CommentRow` transitively).

### Tooltip + TooltipParts + HelpTooltip → `flowbite-react` `Tooltip`

Per the Task 4 verdict table above, Tooltip is the only KEEP/SWAP candidate
that came back **SWAP** — treated as one unit since `HelpTooltip` rode the
same `bk-tooltip` surface and `TooltipParts` only existed as a
Radix-shaped adapter in front of the same `Tooltip`.

`src/editor/ui/Tooltip.tsx` (`label`, `placement`, `id`) →
`node_modules/flowbite-react/dist/components/Tooltip/Tooltip.d.ts`
(`content`, `placement`, `arrow`, `trigger`, `style`).

| Our prop | Flowbite prop | Notes |
|---|---|---|
| `label` (string) | `content` (ReactNode) | rename + widened type — flowbite's slot takes any node, which is what let `HelpTooltip`'s docs-link composition drop its own controlled-open state entirely (see below). |
| `placement="bottom"` (our default) \| `"bottom-end"` \| `"top"` | `placement` | same 3 string values are valid `@floating-ui/core` `Placement`s, so no value-translation table needed — but flowbite's own default is `"top"`, not `"bottom"`, so every call site that relied on the old default now passes `placement="bottom"` explicitly to hold position parity. |
| *(no equivalent — trigger was always hover+focus+Escape)* | `trigger="hover"` (default) | left at default: `Floating.js` unconditionally adds `useFocus(context)` regardless of `trigger` (verified live in `flowbite-parity.test.tsx`, Task 4), and `useDismiss(context)` (always included) closes on Escape — so hover, focus-open and Escape-to-close all still hold with zero prop needed. |
| `id` | *(dropped)* | flowbite generates its own floating id internally (`useRole`'s `floatingId`) and wires `aria-describedby` onto the wrapping reference `<div>` itself — no caller ever consumed the old `id` prop for anything external, confirmed via the consumer sweep below. |
| *(never had one)* | `arrow` (default `true`) | our Figma-sourced tooltip (`Tooltip — Figma 14:43`) never drew a pointer triangle — `arrow={false}` added at every call site to hold that shape. |
| *(bg/text were exact hex matches already)* | `style="dark"` (default) | left at default — `bg-gray-900`/`text-white` is byte-exact to `--bk-gray-900` (`#111827`) / `--bk-accent-on` (`#FFFFFF`), the same "omit the prop, default already matches" pattern as Button's `color`. |

**Shape differences accepted (no override), same tier as Button/Badge's
accepted diffs:** border-radius (flowbite `rounded-lg` 8px vs our
`--bk-radius-md` 6px), horizontal padding (`px-3` 12px vs our
`--bk-space-8` 8px — vertical `py-2`/`--bk-space-4`+`--bk-space-8` both
land at 8px, matches), font-size (flowbite `text-sm` 14px vs our
`--bk-text-12` 12px), box-shadow (`shadow-sm` vs `--bk-shadow-drag`).

**Wrapping behavior fixed, not accepted as shape drift.** The old
`.bk-tooltip` CSS set `max-width: 280px; white-space: normal` globally —
without it, flowbite's floating `<div>` has no width constraint at all
(only `theme.target`'s `w-fit` applies, and that's on the *reference*
wrapper, not the floating content), so a long dynamic string (e.g.
`disabledReason`, `publishBlockedReason`) would render as one
unconstrained-width line instead of wrapping — a real overflow risk, not
a cosmetic one. Every call site now carries
`className="tw:max-w-[280px] tw:whitespace-normal"` (HelpTooltip uses its
own prior `220px`/`1.4` values instead, preserved as
`tw:max-w-[220px] tw:whitespace-normal tw:leading-[1.4]`).

**Structural shape change, accepted per the Task 4 SWAP verdict itself:**
flowbite's `Floating.js` wraps `children` in its own reference `<div
className="w-fit">` rather than cloning props onto the child element (our
old implementation used `React.cloneElement`). Every call site now renders
one extra DOM node per tooltip trigger; none of the 13 real call sites
target the trigger via a parent-child CSS combinator (all styling is
`className`/`style` on the child itself), so this is invisible in
practice — confirmed by the full targeted test run below, all green.

**`TooltipParts.tsx` — deleted outright, not swapped.** Zero real
consumers: grepped `TooltipRoot`/`TooltipTrigger`/`TooltipContent`/
`TooltipProvider`/`TooltipPortal` across all of `src` (including tests) and
the only hits were the file's own definitions and its `index.ts` export
line. The file's own header comment ("kept so the 24 surfaces... migrate
without being restructured") was stale — those surfaces had already all
moved off the Radix-shaped API by the time this task started, leaving a
dead Fragment-returning shim consuming nothing. Confirmed via `tsc
--noEmit` after deletion: 0 errors.

**`HelpTooltip.tsx` — rewritten, not just re-pointed.** It used to
hand-roll the exact same hover/focus/Escape/aria-describedby bookkeeping
`Tooltip.tsx` did (predates the extraction), rendering its own
`<span role="tooltip" className="bk-tooltip">` conditionally on local
`open` state. Now composes flowbite's `Tooltip` directly: the manual
`open` state, `tipId`, and all 5 event handlers are gone, replaced by
`<Tooltip content={<>...docs link...</>}>`. The docs-link anchor's color
(`var(--bk-accent)`) carried forward as the exact-hex `tw:text-[#1A56DB]`
per the standing hex-parity rule. One accepted behavior note: the old
implementation never applied a placement modifier class at all (a
pre-existing shape quirk, not something introduced here — `bk-tooltip`
had no default top/left/bottom/right without `--bottom`/`--top`/
`--bottom-end`), so there was no "old default" to preserve; the new
version lets flowbite's own default (`placement="top"`) apply. The
`position` prop stays "accepted and ignored" exactly as documented before
(2 consumers pass `position="right"`; flowbite could now honor arbitrary
placements, but wiring that up is a behavior change beyond this swap's
scope, not requested).

**Consumers swept:** 11 files via `@/editor/ui` (`LeftSidebar.tsx` ×2,
`SeoTab.tsx`, `InputControls.tsx`, `MultiSelectToolbar.tsx` ×8,
`SendForReview.tsx`, `RichTextEditor.tsx` ×2, `ZoomControls.tsx` ×3,
`CanvasFooterToolbar.tsx` ×4, `ToolbarNavSection.tsx`,
`ToolbarActionsSection.tsx` ×4, `DrawerPanel.tsx` ×2) + 1 relative-import
sibling inside `editor/ui/` itself (`Topbar.tsx`) — 21 JSX call sites
total across 12 files. All 12 already had `import { Button } from
"flowbite-react"` from the Button-swap commit, so the edit was `import {
Tooltip } from "@/editor/ui"` deleted and merged into the existing
`flowbite-react` import line, not a new import line. `HelpTooltip`'s own
2 consumers (`DisplayControls.tsx`, `PositionControls.tsx`) needed no
changes — its public prop API (`content`, `docsLink`, `position`, `size`)
is unchanged. Several `rg` hits for the bare string "Tooltip" were
confirmed false positives before editing anything: `deleteTooltip` (local
variable in `PageContextMenu.tsx`), `useTooltipPresets`/`tooltipPresets`
(`DesignSystemTab.tsx`), a code comment in `AquibraStudio.tsx`, and
`DragTooltip` (`LayerContextMenu.tsx` — an unrelated component that only
shares a name).

**Test-time gotcha found and documented (applies to every future
component that renders conditionally on hover/focus):** flowbite's
`Floating.js` always renders `theme.content` in the DOM — the open/hidden
toggle is a CSS class (`tw:invisible tw:opacity-0`) on the floating
wrapper, not conditional rendering. `screen.getByRole("tooltip")` and
`screen.getByText(...)` therefore find the tooltip **regardless of open
state** in jsdom (which doesn't compute Tailwind's cascade, so the
`invisible` class has no effect on the accessibility-tree visibility
check testing-library relies on) — asserting presence/absence of tooltip
text is vacuous post-swap. Task 4's own `flowbite-parity.test.tsx` had
already found and documented this; `molecules.test.tsx`'s `Tooltip`
`describe` block (open/Escape/placement-class assertions) was deleted
outright rather than patched, since flowbite's own behavior is now the
contract and `flowbite-parity.test.tsx` already documents it — no
information would have survived a rewrite. `HelpTooltip.test.tsx`'s
focus-opens-content test was rewritten to assert the
`[data-testid="flowbite-tooltip"]` wrapper's `className` toggle (mirroring
`flowbite-parity.test.tsx`'s own pattern) instead of relying on text
presence, so it still actually tests something.

**`.bk-tooltip` CSS block deleted** from `ui.css` (base rule + 3 placement
modifier classes). `--bk-z-tooltip`/`--bk-gray-900`/`--bk-accent-on` etc.
are generated tokens (`tokens.generated.css`), untouched — deleting a
consumer of a token is not grounds to delete the token itself.

**Class-list regen:** `pnpm flowbite:classlist` produced a byte-identical
`class-list.json` (0 diff) — `Tooltip`'s theme classes (`tw:invisible`,
`tw:opacity-0`, etc.) were already present from the Task 5 round-1 run,
because `src/editor/chrome-ui/__tests__/flowbite-parity.test.tsx` (written
during Task 4, predates any real consumer) already had `import { ...,
Tooltip, ... } from "flowbite-react"` — the CLI's `extractComponentImports`
scans all matching import lines project-wide, test files included, so
Tooltip was inadvertently pre-compiled a full task early. Confirmed by
reading `build.js`/`extract-component-imports.js` directly rather than
assuming. `.flowbite-react/init.tsx` regenerated itself on this run too
(same duplicate-mechanism issue as fix round 1) — deleted again, same
justification (CLAUDE.md rule 3, one source of truth for the prefix pair).

Verified: `tsc --noEmit` clean; 193 tests green across
`ui/__tests__/molecules.test.tsx`, `ui/__tests__/HelpTooltip.test.tsx`,
`chrome-ui/__tests__/flowbite-parity.test.tsx`, `SeoTab.test.tsx`,
`MultiSelectToolbar.test.tsx`, `SendForReview.test.tsx`,
`RichTextEditor.test.tsx`, `ZoomControls.test.tsx`,
`CanvasFooterToolbar.test.tsx`, `DrawerPanel.test.tsx`, `topbar.test.tsx`,
`DisplayControls.test.tsx`, `PositionControls.test.tsx`,
`LeftSidebarRailClick.test.tsx`, `InputWithUnit.test.tsx`; plus full
`ui/__tests__` 130/130.

### Checkbox → `flowbite-react` `Checkbox`

`src/editor/ui/Checkbox.tsx` (`indeterminate`, native input props) →
`node_modules/flowbite-react/dist/components/Checkbox/Checkbox.d.ts`
(`color`, `indeterminate`, native input props).

| Our (implicit) | Flowbite prop | Notes |
|---|---|---|
| always accent-colored | `color="blue"` | **not** the default. Flowbite's `color="default"` (the implicit value if omitted) uses `text-primary-600` (`#1c64f2`) for the checked fill — a real color mismatch against `--bk-accent` (`#1A56DB`). `color="blue"` uses `text-blue-700` (`#1A56DB`), the exact match — same "closest named ramp step" lookup as Badge, but here the *default* is wrong, unlike Button where omitting `color` already matched. Added explicitly at all 19 call sites. |
| `background: var(--bk-bg-card)` (white, unchecked) | `className="tw:bg-white"` | flowbite's own unchecked fill is `bg-gray-100` (`#F3F4F6`) — a real visible mismatch, not shape drift, so fixed at every call site that renders as an actual checkbox (16 of 19 — see the 3-site carve-out below). |
| `border-color: var(--bk-border-medium)` | *(default, no override)* | flowbite's `border-gray-300` is `#D1D5DB` — exact match to `--bk-border-medium`, confirmed via `tokens.generated.css`. |
| `border-radius: var(--bk-radius-sm)` (4px) | *(default, no override)* | flowbite's `rounded` utility is 4px — exact match. |
| `width/height: var(--bk-space-16)` (16px) | *(default, no override)* | flowbite's `h-4 w-4` is 16px — exact match. |
| `indeterminate` (real DOM property, set via ref+`useEffect`) | `indeterminate` (CSS-class-only) | **Structural gap, accepted and documented rather than adapted — see below.** |

**3-site carve-out for the `tw:bg-white` fix:** `LayerDisplaySettings.tsx`'s
3 call sites pass `className="bdc-switch"` — a pre-existing, fully custom
toggle-switch visual (pill + thumb, `layers-v2.css`) that already
overrides `background` outright via the CSS `background` **shorthand**
(clearing whatever `background-image`/`background-color` flowbite's own
theme classes set, since `layers-v2.css` is imported as a plain
`import "./styles/layers-v2.css"` — unlayered CSS, confirmed via the same
"unlayered always wins" rule Button's fix round 1 established). Adding
`tw:bg-white` there would be dead: verified by reading the cascade, not
assumed. Those 3 sites get `color="blue"` only (still real — it governs
the focus-ring color, `focus:ring-blue-600` vs the unwanted default
`focus:ring-primary-600`, independent of the background question).

**Structural gap, accepted not adapted: `indeterminate` is CSS-only in
flowbite.** Our old `Checkbox.tsx` set the real DOM property
(`inner.current.indeterminate = indeterminate`) via a ref + `useEffect`,
because `indeterminate` has never been a settable HTML attribute — reading
`Checkbox.js` directly confirms flowbite's version only uses the prop to
switch a `bg-dash-icon` CSS class (`theme.indeterminate`), never touches
`ref.current.indeterminate`. This means `:indeterminate` CSS matching and
the native tri-state accessibility semantics don't fire on a flowbite
Checkbox, even though `CheckboxProps.indeterminate` still type-checks as
accepted. Checked the actual impact before deciding whether to build an
adapter: a full-repo sweep found **zero** real consumers ever pass
`indeterminate` (only the old component's own contract test exercised it).
Per the "don't add features/wrappers beyond what's asked" rule, no adapter
was built for a capability nothing depends on today — the gap is
documented instead, in both this doc and a rewritten test assertion (see
below), so a future consumer that needs real indeterminate semantics has
a paper trail instead of a silent surprise.

**Consumers swept:** 15 files via `@/editor/ui`, 19 JSX call sites total —
`WebhooksScreen.tsx`, `ContentViews.tsx`, `CreateComponentModal.tsx` (×2,
two different files sharing a name: `sidebar/tabs/component-library/` and
`shell/modals/`, the latter with 2 call sites), `AgentPlan.tsx`,
`TemplatesTabModals.tsx` (×2), `ReplaceAcrossDialog.tsx`,
`CollectionSetupModal.tsx`, `PropertyField.tsx`, `controlRegistry.tsx`,
`ProjectSettingsModal.tsx`, `CMSRecordsModal.tsx`,
`LayerDisplaySettings.tsx` (×3), `ExportOptions.tsx`,
`ReplaceAcrossModal.tsx`. 2 of those (`component-library/
CreateComponentModal.tsx`, `CMSRecordsModal.tsx`) hid their `Checkbox`
import inside a multi-line `{ ... } from "@/editor/ui"` block that a
single-line-only grep missed on the first pass — caught by re-checking
every file the alias-sweep flagged, not just the ones an `import.*Checkbox`
single-line grep matched (the same "second import statement" class of trap
as Button's `LeftSidebar.tsx` miss, one line-wrapping variant of it). No
consumer passes `ref`, `color`, or `disabled` on `Checkbox` — confirmed via
grep before relying on that to skip building any disabled-state override
(flowbite's `checkboxTheme.base` has no `disabled:opacity-*` styling at
all, unlike ours — a latent gap, undocumented further since nothing
exercises it).

**Contract test rewritten, not deleted:** `ui/__tests__/atoms.test.tsx`'s
`describe("Checkbox", ...)` block asserted `indeterminate` sets the real
DOM property — now asserts the opposite (`false`) with a comment
explaining the structural gap above, so the test suite documents actual
behavior instead of either lying (old assertion, now false) or going
silent (deletion, matching `Tooltip`'s treatment) — deletion was right for
`Tooltip` because `flowbite-parity.test.tsx` already carried the same
information; nothing else in the repo documents the indeterminate gap, so
here a rewrite was the correct call instead.

**Class-list regen:** `pnpm flowbite:classlist` added 35 new prefixed
entries (`tw:appearance-none`, `tw:checked:bg-check-icon`, etc.) — this
time a real diff, unlike Tooltip's accidental early compile.
`.flowbite-react/init.tsx` regenerated and deleted again (3rd occurrence
of the same CLI side-effect, same fix each time).

Verified: `tsc --noEmit` clean; 243 tests green (28 files: `atoms.test.tsx`
+ both `CreateComponentModal.test.tsx` + `StudioModals.test.tsx` +
`Section21_per_page.test.tsx` + `CollectionSetupModal.test.tsx` +
`CMSCollectionSetupModal.dynamicPages.test.tsx` +
`CMSRecordsModal.publish.test.tsx` + `ExportOptions.test.tsx` +
`ReplaceAcrossModal.test.tsx` + `ContentTab.test.tsx` + all
`settings/screens/__tests__` + `SchemaDrivenSection.test.tsx` +
`InspectorRenderer.test.tsx` + `ElementPropertiesSection.test.tsx` + all
`sidebar/tabs/ai/__tests__`); plus 314 more green across
`panels/layers`, `sidebar/tabs/settings`, `sidebar/tabs/templates`,
`inspector/sections/elementProperties` full test directories (broader
sweep for the 4 consumer files — `WebhooksScreen.tsx`,
`LayerDisplaySettings.tsx`, `PropertyField.tsx`, `TemplatesTabModals.tsx`
— with no component-specific dedicated test file).

### Radio → `flowbite-react` `Radio`

`src/editor/ui/Radio.tsx` (thin native-input wrapper, no extra props) →
`node_modules/flowbite-react/dist/components/Radio/Radio.d.ts` (`color`,
native input props). Same shape and same 2 real gaps as Checkbox, since
`radioTheme` is structurally the Checkbox theme with `rounded-full` instead
of `rounded`: `color="blue"` (flowbite's default `color` is `primary-600`,
not the exact `--bk-accent` match) + `className="tw:bg-white"` (flowbite's
unchecked fill is `bg-gray-100`, ours is white) added at every call site.
`border-gray-300`/`h-4 w-4`/`rounded-full` all matched our
`--bk-border-medium`/16px/`--bk-radius-full` exactly, no override needed.
No `indeterminate` concept for radio inputs, so no equivalent gap to
document.

**Consumers swept:** 1 real file via `@/editor/ui`
(`design-system/ui/sections/ExportSection.tsx`, 2 call sites: export-format
picker, dark-mode-strategy picker) — **plus a raw-element trap found only
by grepping `bk-radio` after deleting the CSS** (same class of miss as
Button's `PanelHeader.tsx`/`PanelFrame.tsx` in fix round 1):
`src/editor/ui/FormatRow.tsx` rendered a raw `<input type="radio"
className="bk-radio">` that never imported the `Radio` component at all —
it has zero real consumers anywhere in the app (only its own contract test
in `molecules.test.tsx`, role-based, so it would have kept passing green
while silently rendering fully unstyled). Fixed by swapping the raw
`<input>` for flowbite's `Radio` with the same `color="blue"`/
`tw:bg-white` treatment, even though nothing in the live app currently
renders `FormatRow` — it's still exported from the public `editor/ui` API
surface, so a de-facto CSS dependency left dangling there is exactly the
kind of orphan-CSS trap this task exists to close, not a "no consumers,
skip it" case.

**Class-list regen:** 2 new prefixed entries (`radioTheme`'s own
`bg-dot-icon` + `rounded-full`; the rest of its class list overlaps with
Checkbox's, already compiled).

Verified: `tsc --noEmit` clean; 58 tests green (`atoms.test.tsx`,
`molecules.test.tsx`, `ExportSection.test.tsx`) + full `ui/__tests__` +
`design-system` sweep, 718 passed / 1 skipped / 1 todo, 84 files.

### Toggle → `flowbite-react` `ToggleSwitch`

`src/editor/ui/Toggle.tsx` (native `<input type="checkbox" role="switch">`,
extends `InputHTMLAttributes`) →
`node_modules/flowbite-react/dist/components/ToggleSwitch/ToggleSwitch.d.ts`
— a structurally different component, not a same-shape swap.

**API shape change, not a rename.** flowbite's `ToggleSwitch` renders a
`<button role="switch">` (plus a hidden `sr-only` checkbox purely for form
semantics) instead of a real interactive `<input type="checkbox">`. Two
consequences, checked against real usage before assuming either was safe:

1. `onChange` is `(checked: boolean) => void`, not a `ChangeEvent` handler
   — a real signature change from ours. **Turned out to be a non-issue for
   every real call site**: all 5 existing `onChange` bodies were already
   `() => setX(!x)` (unconditional flip, ignoring the callback argument
   entirely) — confirmed by reading each one before relying on it, not
   assumed from the pattern looking common.
2. `checked` + `onChange` are **both required** (controlled-only, no
   `defaultChecked`/uncontrolled mode) — `ReviewTab.tsx`'s call site only
   had `onClick={() => setShowResolved((v) => !v)}` with no `onChange` at
   all, which would have failed to typecheck. flowbite's own `handleClick`
   is what calls `onChange(!checked)` internally and is assigned to the
   button's `onClick` before `...restProps` spreads — so simply adding
   `onChange` *alongside* a leftover `onClick` would have been actively
   dangerous: a consumer `onClick` in `restProps` overrides flowbite's own
   `handleClick` in the object-literal spread order (verified by reading
   `ToggleSwitch.js`), silently breaking the whole change-notification
   path while looking like a normal working toggle. `onClick` was
   converted to `onChange` outright, not kept alongside a new `onChange`.

**Color/size — nothing to override, unlike Checkbox/Radio.** Checked hex
values before assuming this differed from Checkbox/Radio's pattern: for
`ToggleSwitch` specifically, `color`'s **default** entry is
`bg-primary-700` (`#1A56DB`, exact `--bk-accent` match) — unlike
Checkbox/Radio's default (`primary-600`, a real mismatch). Unchecked fill
`bg-gray-200` (`#E5E7EB`) is an exact match to `--bk-border`; thumb
`bg-white` matches `--bk-bg-card` exactly. Size: default `sizing="md"` is
`h-6 w-11` (24×44) with a `h-5 w-5` (20px) thumb inset `left-0.5 top-0.5`
(2px) — byte-identical to the deleted `.bk-toggle`'s 44×24 pill / 20px
thumb / 2px inset. Every real call site needed zero props beyond
`checked`/`onChange`/`aria-label` — no `color`, no `className`.

**Accessible-name gap checked empirically, not assumed from source.**
`ToggleSwitch` always sets `aria-labelledby` pointing at its own internal
`<span id="{id}-flowbite-toggleswitch-label">`, but that span only renders
when a `label` prop is passed (`!!label?.length`) — every real call site
here uses an *external* adjacent label (a sibling `<span>` in
`ContentViews.tsx`, a wrapping `<span>` in `ReviewTab.tsx`, an external
`<Label>` in `AdvancedTab.tsx`), so passing `label=` would have doubled
the visible text. That leaves `aria-labelledby` dangling (pointing at a
nonexistent id) with `aria-label` set alongside it via `...restProps`.
Rather than trust the accname spec's fallback behavior from reading it,
wrote and ran a throwaway probe test rendering `<ToggleSwitch aria-label="Force HTTPS" .../>` and querying
`getByRole("switch", { name: "Force HTTPS" })` — it resolved correctly
(testing-library's accessible-name computation falls back to `aria-label`
when `aria-labelledby` doesn't resolve to any element), so no `label` prop
needed anywhere. Deleted the probe file after confirming.

**Consumers swept:** 3 real files via `@/editor/ui`, 5 JSX call sites —
`ContentViews.tsx` (×2), `ReviewTab.tsx` (×1, the `onClick`→`onChange`
site), `AdvancedTab.tsx` (×2). 4 more files matched the alias sweep
(`PageRow.tsx`, `FontPicker.tsx`, `shell/modals/CreateComponentModal.tsx`,
`TypeTokenList.tsx`) but on inspection had zero real `<Toggle` JSX — all
false positives from comments/unrelated identifiers (`onToggleSelect`,
"Toggle Button" comment, a `GAP-FIX: Toggle variant` comment, a local
`StyleToggle` component). `ExportOptions.tsx`'s `<ToggleOption>` JSX
matched the bare-word sweep too, but that's a locally-defined component in
the same file built on the already-swapped flowbite `Checkbox` — visually
a checkbox row, unrelated to the shared `Toggle`/`ToggleSwitch` primitive,
not touched.

**Test fix (real regression, not vacuous):** `AdvancedTab.test.tsx`'s
`"reflects allowIndex / allowFollow as switch checked state"` cast the
`getByRole("switch", ...)` result to `HTMLInputElement` and read `.checked`
— that property doesn't exist on a `<button>` (returns `undefined`, caught
by the targeted run, not preemptively guessed). Rewritten to read
`aria-checked` off the element directly. The sibling "toggles ... to the
opposite" tests already used `fireEvent.click` + asserted on the mock
callback, so they needed no change — further confirmation the
`onClick`→`handleClick`→`onChange` wiring works as intended.
`atoms.test.tsx`'s own `Toggle` contract test rewritten the same way
(`defaultChecked` doesn't exist on `ToggleSwitch` either — swapped for
`checked` + `onChange={() => {}}`, `.checked` swapped for `aria-checked`).

**Class-list regen:** 55 new prefixed entries (`ToggleSwitch` is
structurally its own theme, no overlap with Checkbox/Radio's).

Verified: `tsc --noEmit` clean; 47 tests green
(`atoms.test.tsx`/`ReviewTab.test.tsx`/`ContentTab.test.tsx`/
`AdvancedTab.test.tsx`) + full `ui/__tests__` 130/130.

### Select → `flowbite-react` `Select`

`src/editor/ui/Select.tsx` (bare `<select className="bk-select">`) →
`node_modules/flowbite-react/dist/components/Select/Select.js`/`theme.js`.

**Structural finding, load-bearing for every remaining swap that reads
`className` for box-level styling:** flowbite's `Select` renders TWO
wrapper elements — an outer `<div className={twMerge(theme.base,
className)}>` and an inner `<div className={theme.field.base}>` — around
the real `<select>`. Confirmed by reading `Select.js` line by line: the
consumer's `className` prop is destructured and applied **only to the
outer div**; the `<select>` itself only ever receives classes resolved
from `theme.field.select.*`. There is no code path by which a plain
`className` prop can change the select's own border/background/focus-ring
— `style` (an ordinary prop that isn't destructured, so it flows through
`...restProps` onto the real `<select>`) still works fine, but any
consumer that previously relied on `className` to restyle the box itself
needs the per-instance `theme` prop instead (same mechanism `avatarTone.ts`
established for `Avatar`, `resolve-theme.js` deep-merges custom theme
strings via `twMerge`, confirmed **empirically** via a throwaway
render+className probe, not just source-reading, because getting this
wrong would have broken every Select silently).

**`src/editor/ui/selectTheme.ts` created** (adapter, not a component
wrapper — same justification class as `avatarTone.ts`, CLAUDE.md rule 3):

- `BK_SELECT_BASE_THEME` — the fix every plain form-row `<Select>` needs
  identically: flowbite's default `color="gray"` background (`bg-gray-50`)
  is one ramp step off `--bk-bg-card` (#FFFFFF), and its default focus
  ring/border (`primary-500` / #3F83F8) is not the exact `--bk-accent`
  (#1A56DB = `primary-700`/`blue-700`). `SelectColors` has **no `"blue"`
  entry** the way Checkbox/Radio do (`Pick<FlowbiteColors, "gray" | "info"
  | "failure" | "warning" | "success">`) — there is no `color` prop escape
  hatch here, the fix has to override `field.select.colors.gray` itself.
  Override string: `tw:bg-white tw:focus:border-primary-700
  tw:focus:ring-primary-700`. Applied at every "plain" call site (13 of
  the 15 real call sites below).
- `BK_SELECT_BARE_THEME` — for the 2 `InputControls.tsx` sites (`.bdi-u`
  unit select, `.bdi-ddn .bdi-v` type select with its own `.bdi-c` chevron
  span) that embed the select inside custom pill chrome supplying its own
  border/background via a class landing on the (harmless-to-reuse) outer
  div — `.bdi-fld .bdi-u` / `.bdi-ddn .bdi-v` are descendant selectors,
  indifferent to whether the matched element is a `<select>` or the outer
  `<div>`. Without a bare theme, the real `<select>` nested inside would
  render flowbite's own full boxed chrome (border, `bg-gray-50`, arrow
  icon) *inside* the pill — a double-box, double-arrow regression.
  Override needed in **two** leaves, verified empirically because getting
  the leaf wrong silently drops the override: `colors.gray` (border/bg/
  shadow/focus-ring resets) **and** `sizes.md` (padding reset to
  `tw:p-0`) — `sizes.md`'s `p-2.5` only loses to a later-merged `p-0`
  because Select.js's own `twMerge(base, colors[c], sizes[s], ...)` call
  puts `sizes` *after* `colors`, so a padding override placed only in
  `colors.gray` loses that final merge. Residual `border-gray-300` /
  `focus:border-primary-500` / `focus:ring-primary-500` classes survive in
  the resolved string — they're *color* utilities, not the *width*
  utilities (`border-0`/`ring-0`) doing the actual visual suppression, so
  they're inert once width is zeroed. Confirmed by reading the merged
  output, not assumed.

**A third, one-off theme lives inline in `shared.tsx`** (settings tab),
not in `selectTheme.ts` — `SETTINGS_SELECT_THEME` reproduces
`.bd-set-input`'s exact box (`settings.css:240`: 7×9px padding, 5px
radius, 11.5px/500 font, `--bk-border` #E5E7EB border, focus
`--bk-accent`/`--bk-accent-tint` ring) via `tw:` arbitrary-value classes.
Not shared with `BK_SELECT_BASE_THEME`/`BK_SELECT_BARE_THEME` because the
visual spec is genuinely different (a different local design token, not
the same correction) — CLAUDE.md's "don't extract things that merely look
similar" line. **Second empirically-found merge-order trap here:**
flowbite's `rounded-lg` (the default corner radius) does **not** come from
`colors` or `sizes` at all — it comes from `theme.field.select.withAddon.off`
(`"off"` = no `addon` prop, the always-true case here), which sits *after*
`sizes` in Select.js's own twMerge call. A `rounded-[5px]` placed in
`colors.gray` silently loses to it; the override has to live in
`withAddon.off` instead.

**Widespread arrow-loss regression found and fixed, not part of the
original mapping — a byproduct of React inline `style`, not a flowbite
bug.** ~9 of the 15 real call sites pass an inline `style` object with a
`background` **shorthand** (e.g. `background: "var(--bk-gray-900)"`).
`style` always wins the cascade over any class (correctly reaching the
real `<select>`, per the structural finding above) — but setting the
`background` *shorthand* resets `background-image` to its initial value
too, silently killing flowbite's own drawn arrow (`bg-arrow-down-icon`,
also class-based, also loses to `style`). The **old** `.bk-select` never
had this failure mode — it never set `appearance: none` at all, so the
browser's native OS arrow always rendered regardless of any `background`
override. Fixed by adding `appearance: "auto"` to each affected style
object/call site (restores the native arrow, matching old behavior
exactly, rather than inventing a new drawn-arrow look nobody asked for) —
touched both call-site-local style literals and 3 shared style objects
reused by non-Select controls too (`inputStyle` in `controlRegistry.tsx`,
`dialogInputStyles` in `component-library/styles.ts`, `s.select`/
`fieldTypeSelect` in `CMSCollectionSetupModal.tsx`) — harmless there since
`appearance: auto` is already an `<input>`'s default UA value, so it's a
no-op on every non-select consumer of those shared objects, confirmed by
checking each one's other usages before touching the shared object.
`OverflowVisibilityControls.tsx`'s 2 sites reuse `baseStyles.input`, not
the already-arrow-aware `baseStyles.select` sibling in the same shared
module — a pre-existing minor inconsistency, left alone (out of scope to
"fix" a pre-existing design choice); patched locally at the 2 JSX call
sites instead of touching the shared `baseStyles.input` object, which has
many non-Select consumers elsewhere.

**Consumers swept:** precise import-based sweep (not the brief's literal
`rg -l "Select"`, which over-matches worse than `Button` did — collides
with `selectedItem`, `handleSelect`, `useSelectionBehavior`,
`SelectionToolbar`, and dozens more). Multiline `-U` sweep for `Select`
inside `@/editor/ui` import blocks (catches the same "second import
statement" trap Button/Checkbox hit) found **13 files**, 2 only visible
with `-U` (`CMSRecordsModal.tsx`, `component-library/CreateComponentModal.tsx`
— both had `Select` inside a multi-line `{ ... }` import block a
single-line grep would miss). `shared.tsx` (settings tab) matched the
sweep but had zero real `<Select` JSX — it's a local wrapper re-exporting
its own `Select` built on `@/editor/ui`'s (now rewritten to wrap
flowbite's directly, see above). `grep -rn "bk-select" src` after deleting
the CSS block found zero orphan raw-element usages (no `FormatRow`-style
trap this round). Total: **15 real `<Select` JSX call sites** across 12
consumer files + the 1 local-wrapper file (`shared.tsx`).

**Consumer files touched:** `RichTextEditor.tsx` (×2),
`ApprovedCompareView.tsx` (×1), `CMSRecordsModal.tsx` (×2),
`CMSCollectionSetupModal.tsx` (×2), `InputControls.tsx` (×2, bare theme),
`shared/forms/SelectField.tsx` (×1), `TypeTokenList.tsx` (×1),
`controlRegistry.tsx` (×1), `ContentViews.tsx` (×2), `SizeSection.tsx`
(×1), `component-library/CreateComponentModal.tsx` (×1),
`OverflowVisibilityControls.tsx` (×2), plus the local-wrapper rewrite in
`settings/shared.tsx`.

**Debt item folded into this commit** (per the task instructions): added
an Escape-dismiss assertion to the Tooltip block in
`flowbite-parity.test.tsx` — `useDismiss(context)` is unconditionally
wired into `useFloatingInteractions` (`hooks/use-floating.js`), independent
of the `trigger` prop, confirmed by reading the source and then by a
passing render-level assertion (focus opens it via `useFocus`, an Escape
keydown on the same focused element closes it).

**Class-list regen:** 43 new prefixed entries.

Verified: `tsc --noEmit` clean; targeted run across all touched consumer
tests + `atoms.test.tsx` + `flowbite-parity.test.tsx` + every inspector
section test that renders `SelectRow`/`SelectControl` transitively — 28
files, 253 tests, all green.

**Fix round 1 (reviewer finding, post-commit):** `BK_SELECT_BARE_THEME` split
into `BK_SELECT_BARE_UNIT_THEME` / `BK_SELECT_BARE_VALUE_THEME` —
`sizes.md`'s `tw:p-0` neutralized the default `p-2.5` but left flowbite's
`text-sm` (also in `sizes.md`) unneutralized, since `text-inherit` (this
theme's color reset) and `text-sm` are different tailwind-merge conflict
groups. Full mechanism + fix documented in `selectTheme.ts`'s own header
comment (kept as the single source, not duplicated here). See
`task-5-report.md`'s "Fix round 1" section for verification evidence.

### Textarea → `flowbite-react` `Textarea`

`src/editor/ui/Textarea.tsx` (bare `<textarea className="bk-textarea">`, with
`error`/`fixed`/`mono` boolean props) →
`node_modules/flowbite-react/dist/components/Textarea/Textarea.js`/`theme.js`.

**Structural finding — the opposite of Select's gap:** flowbite's `Textarea`
applies the consumer's `className` **directly to the real `<textarea>`**
(`Textarea.js` has no wrapper div at all, unlike `Select.js`'s two-div
nesting). No `theme` prop or adapter file was needed anywhere — every call
site's existing `className`/`style` reaches the actual form control the same
way the deleted `bk-textarea` class did.

**API mapping:**

| Our prop | Flowbite equivalent |
|---|---|
| `error` (boolean, drove `aria-invalid` + a `.bk-textarea[aria-invalid="true"]` CSS attribute selector) | No `error` prop exists. `aria-invalid` itself still carries correct a11y semantics unchanged (ordinary DOM attribute, passes through `...restProps`); only the *visual* red-border state needed reproducing, done locally in `TextareaField.tsx` via a `BASE_CLASS`/`ERROR_CLASS` className swap (`tw:border-red-600 tw:focus:border-red-600 tw:focus:ring-red-600` when `error`). |
| `fixed` (boolean, `resize: none`) | Not passed by any real call site (checked every JSX call site's props before deleting) — no adapter needed for an unused capability, per "don't add features beyond what's asked." |
| `mono` (boolean, `font-family: var(--bk-font-mono)`) | Same — zero real consumers pass it. `ContentViews.tsx`'s monospace JSON textarea already used an inline `style={{ fontFamily: "var(--bk-font-mono)" }}` object, not the deleted component's `mono` prop, so it needed no change. |

**Color/box override, checked against `theme.js` per the standing rule (never
assume from a prior component's default):** flowbite's `Textarea` default
`color="gray"` is `border-gray-300 bg-gray-50` — one ramp step off
`--bk-bg-card` (#FFFFFF) and `--bk-border`, and its focus ring
(`primary-500`) is not the exact `--bk-accent` match (`primary-700`). Same
`SelectColors`-shaped gap as Select: `TextareaColors` has no `"blue"` entry
either, so the fix is a literal className override, not a `color=` prop:
`tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700`, applied
inline at every plain call site (10 of 15 real sites) rather than centralized
— CLAUDE.md rule 3 territory only when the *rule* differs per site (see
below), and here it's the same literal string reused verbatim, so it stayed
an inlined className string rather than a new adapter file, consistent with
Button/Badge's precedent of not extracting single reused literals into a
utility module.

**3 sites skipped the override, each for a distinct, checked reason (not
assumed):**
- `InputControls.tsx` — `className="bdi-text"`. `inspector.css` has no
  `@layer` wrapper (confirmed by grep), so its rules are unlayered and beat
  any of flowbite's own `tw-utilities`-layer classes regardless of Tailwind's
  layer order — same precedent Checkbox's `LayerDisplaySettings.tsx` (round
  2) established for `bdc-switch`. `.bdi-text`/`textarea.bdi-text` already
  fully specify background/border/color/focus.
- `CreateComponentModal.tsx`, `CMSCollectionSetupModal.tsx`,
  `ImportCard.tsx` — all pass an inline `style` object
  (`textareaStyles`/`s.textarea`/`pasteAreaStyle`) that already sets
  `background`/`border`/`color` explicitly. Inline `style` always wins the
  cascade over any class (highest specificity short of `!important`), and
  each object was read line-by-line to confirm it actually sets all three
  properties rather than assumed from the pattern.
- `settings/shared.tsx`'s local `Textarea` wrapper — `.bd-set-input`
  (`settings.css`, also unlayered, no `@layer` wrapper) already fully styles
  the box; wrapper now imports flowbite's `Textarea` as `FlowbiteTextarea`
  and forwards `className={\`bd-set-input...\`}` unchanged, same shape as the
  pre-swap `VibcoderTextarea` forwarding.

**Consumers swept:** import-based sweep for `Textarea` inside `@/editor/ui`
import blocks (checked for the two-statement trap on every match) plus a
full-repo `<Textarea` JSX grep to catch relative-import siblings and confirm
no site was missed. Found **1 file** still on the old import after this
round picked up an in-flight WIP state (`settings/shared.tsx`, its local
wrapper's `VibcoderTextarea` → `FlowbiteTextarea`); the other 15 real call
sites across 15 files (`TextareaField.tsx`, `CommentLayer.tsx`,
`Composer.tsx`, `AIPromptModal.tsx`, `ReviewTab.tsx`, `AiPromptPopover.tsx`,
`AdvancedTab.tsx`, `SocialTab.tsx`, `SeoTab.tsx`, `ImportCard.tsx`,
`ContentViews.tsx` ×2, `SendForReview.tsx`, `CreateComponentModal.tsx`,
`CMSCollectionSetupModal.tsx`, `CMSRecordsModal.tsx`, `InputControls.tsx`,
`AssetDetailsPanel.tsx`) had already been converted before this session
picked up the branch. `grep -rn "bk-textarea" src` after deleting the CSS
block found zero orphan raw-element usages (no `FormatRow`-style trap this
round — the only `bk-textarea` references left were the ones inside
`Textarea.tsx` itself and a code comment in `TextareaField.tsx`, both
removed/harmless).

**Class-list regen:** zero-diff — `Textarea`'s prefixed theme classes were
already compiled during this same in-flight session's earlier work (its
import already existed in multiple consumer files before this round's
commit), same "already covered by an earlier partial run" case Tooltip hit
in round 2.

Verified: `tsc --noEmit` clean; targeted run across every touched consumer's
test file (`CommentLayer`, `AiPromptPopover`, `AIPromptModal`, `ImportCard`,
`AssetDetailsPanel` ×2, `SendForReview`, `CMSCollectionSetupModal`,
`CMSRecordsModal`, `CreateComponentModal` ×2, `Composer`, `AdvancedTab`,
`SeoTab`, `SocialTab`, `ReviewTab`, `ContentTab`, settings-tab tests,
`ui/__tests__`, `flowbite-parity.test.tsx`, `chrome-reset.test.ts`) — 26 test
files / 285 tests + 20 more, all green.

### Input → `flowbite-react` `TextInput`

`src/editor/ui/Input.tsx` (bare `<input className="bk-input">`, with a single
`error?: boolean` prop) → `node_modules/flowbite-react/dist/components/TextInput/TextInput.js`/`theme.js`.

**Structural finding, same shape as Select's:** `TextInput.js`'s consumer
`className` is destructured and applied ONLY to an outer wrapper
`<div className={twMerge(theme.base, className)}>` (`theme.base = "flex"`);
the real `<input>` only ever receives classes resolved from
`theme.field.input.*`. Confirmed by reading the component source, not
assumed from Select's precedent. `ref` forwards correctly to the real
`<input>` (`ForwardRefExoticComponent<TextInputProps & RefAttributes<HTMLInputElement>>`),
unaffected by the wrapper.

**`src/editor/ui/textInputTheme.ts` created** (adapter, same justification
class as `selectTheme.ts`/`avatarTone.ts` — CLAUDE.md rule 3, not a
component wrapper):

- `BK_TEXT_INPUT_THEME` — every plain call site's fix: `TextInputColors` has
  no `"blue"` entry the way Checkbox/Radio do
  (`Pick<FlowbiteColors, "gray" | "info" | "failure" | "warning" | "success">`),
  so the color correction is a `field.input.colors.gray` override, not a
  `color` prop swap: `tw:bg-white tw:focus:border-primary-700
  tw:focus:ring-primary-700` (flowbite's default `bg-gray-50`/`primary-500`
  focus is one ramp step off `--bk-bg-card`/`--bk-accent`) — same shallow
  "fix color, accept flowbite's own `p-2.5 text-sm` box" precedent Select
  and Textarea already established (checked `withAddon.off` — TextInput's
  default already resolves to `rounded-lg`, unlike the false read during
  investigation; no radius fix needed here, verified against the raw
  `theme.js` source directly with `sed`, not the first `cat` pass which
  mis-rendered it). Also bakes the deleted `.bk-input[aria-invalid="true"]`
  rule's error-border behavior in as Tailwind's built-in `aria-invalid:`
  variant (`tw:aria-invalid:border-[var(--bk-error)]` +
  `tw:aria-invalid:focus:border/ring-[var(--bk-error)]`, the compound
  focus+invalid variant reproducing the old CSS's "invalid wins over focus
  on equal specificity by source order" behavior via a higher-specificity
  compound selector instead) — every plain call site gets correct error
  styling for free just by passing `aria-invalid` through; no per-site
  branching needed.
- `SETTINGS_TEXT_INPUT_THEME` (inline in `settings/shared.tsx`, not
  `textInputTheme.ts` — a different local design token, same non-extraction
  reasoning as `SETTINGS_SELECT_THEME`) — reproduces `.bd-set-input`'s exact
  box (`settings.css:240`) for the settings tab's local `Input` wrapper.
  Same `withAddon.off` radius-override requirement Select's
  `SETTINGS_SELECT_THEME` already documented (flowbite's own `rounded-lg`
  lives there, positioned after `colors`/`sizes` in the component's own
  `twMerge` call).
- A third, one-off **inline dynamic theme** (not a named export — a single
  call site, not shared) at `InputControls.tsx`'s `InputWithUnit`: the old
  `className={isKeywordUnit ? "auto" : ""}` toggled `.bdi-fld input.auto`
  (an unlayered unit-select-adjacent CSS rule keyed off a class on the real
  `<input>`) — since `className` can't reach the real input, the toggle
  moved to `theme={{ field: { input: { base: isKeywordUnit ? "auto" : "" } } }}`.

**Consumer-shape finding, much larger blast radius than Select/Textarea
hit:** a full AST sweep (`ts-morph`, not the brief's literal `rg` command —
same over-match problem `Button` already documented) found **128 real
`<Input` JSX call sites across 74 files** via the `@/editor/ui` import path.
Of those, **26 sites across 18 files** passed a bespoke local CSS
`className` (`bdi-text`, `ie-slider`, `bd-pg-row-rename`, `search-input`,
etc.) doing FULL custom re-skinning (search bars, inline-rename fields,
range sliders styled as custom tracks, hex swatches) — verified against
each class's own CSS that none of them relied on `.bk-input`'s box at all
(fully self-sufficient: own width/height/padding/border/background/font).
Since `Input.tsx` was itself just `<input ref className aria-invalid
{...rest}>` — literally nothing beyond a className merge + aria-invalid
computation + ref forwarding — and flowbite's `TextInput` cannot route a
`className` prop to the real `<input>` at all, converting **25** of those
26 sites to plain **raw native `<input>`** was a byte-identical-behavior,
zero-regression swap (not a new "KEEP" carve-out; `Input` was contributing
zero value at these sites once its `className`-forwarding path is
structurally gone) — the 26th (`InputControls.tsx`'s `InputWithUnit`,
toggling a conditional `"auto"`/`""` class) needed the class to be dynamic
per-render, so it went the `theme`-prop route instead (documented above),
not the raw-element route. This is the same class of move as Button's
`PanelHeader.tsx`/`PanelFrame.tsx` raw-`<button>` sites and Radio's orphan
`FormatRow.tsx` — except here the sites are live, heavily-used UI (search
bars, inline rename), not orphans; the shared reasoning is "the wrapper
component was a thin className-forwarding shell, and this call site no
longer benefits from it," not "unused code."

**Fix round 1 (reviewer finding, post-commit): one-owner discipline for
Gate 24.** The 25 raw `<input>` conversions above were real inline lowercase
JSX in `editor/` — Gate 24 (`scripts/jsx-inline-element-scanner.ts`, AST-based,
zero-tolerance, baseline 0) caught all 25 as new violations, confirmed by
running the scanner directly (`find packages/editor/src/editor -name
'*.tsx' -not -path '*/__tests__/*' -not -path '*/editor/ui/*' | xargs npx
tsx packages/editor/scripts/jsx-inline-element-scanner.ts` → 25 hits across
18 files, matching exactly). `editor/ui/` was already Gate 24's one sanctioned
native-element owner; scattering 25 more raw `<input>`s outside it broke
that discipline even though each one was individually correct. Fixed by
creating `src/editor/chrome-ui/TextField.tsx` — the deleted `Input.tsx`
ported verbatim (same className-merge + `aria-invalid` + ref-forwarding
contract, not a redesign) as the ONE sanctioned raw-`<input>` owner outside
`editor/ui/` and outside flowbite. All 25 sites repointed to import
`TextField` from `@/editor/chrome-ui` instead of rendering a bare `<input>`
directly. `scripts/ds-grep-gates.sh`'s Gate 24 block gained a
`-not -path '*/editor/chrome-ui/*'` exclusion (both the file-count guard and
the hit-count scan, mirroring the existing `editor/ui/` exclusion) — this is
the T13-planned owner change (`editor/ui` → `editor/chrome-ui` as the
flowbite migration's native-element home) pulled forward one line, per the
controller. Re-ran the scanner over `src/editor` minus `editor/ui` AND minus
`editor/chrome-ui`: **0 hits** — Gate 24 back to baseline.

**Range-input caveat, checked not assumed:** several `type="range"` sites
(`ZoomControls.tsx`, `SliderControls.tsx` ×2, `SliderControl.tsx`,
`OptimizationPanel.tsx`, `flexbox/controls.tsx`'s `GapSlider`) had no
`className` (routed through the `theme`-bucket, not raw) but DO need a
custom flat-track look, achieved via a complete inline `style` object
(`appearance: "none"`, explicit `background`/`height`/`border-radius`) —
`style` always reaches the real `<input>` under `TextInput` (flows through
`...restProps`, unlike `className`), so these render identically to the old
`bk-input` + same-`style` combination. 3 range sites
(`BackgroundSection.tsx`'s gradient angle, `VideoPreview.tsx`'s volume,
`IconPickerModal.tsx`'s stroke width) pass only a partial `style` (no
track re-skin) — same category of "boxed native range slider" look under
old `bk-input` styling too (not a new regression, `bk-input` never had
range-specific styling either); left as `TextInput` + `BK_TEXT_INPUT_THEME`,
not treated as a `className`-bucket case.

**Sites needing hand judgment (not the blanket codemod path), each
individually resolved:** `shared/forms/InputField.tsx`,
`shared/forms/NumberField.tsx`, `shared/forms/ColorField.tsx` (the
sanctioned `shared/forms/` → `@/editor/ui` edge — `FormField`'s
render-prop `wiring` already supplies correct `aria-invalid`, so no
extra per-site error handling needed once `error={...}` was dropped in
favor of the wiring/explicit-aria-invalid path); `AddTokenModal.tsx` (×2)
and `SeoTab.tsx` (×2) (`error={!!x}` → `aria-invalid={!!x || undefined}`,
exactly reproducing old `Input.tsx`'s own `aria-invalid={error ||
undefined}` computation; `SeoTab.tsx`'s slug input already had a
**separately, redundantly** passed `aria-invalid` prop pre-migration —
verified the duplicate and just deleted the now-meaningless `error=` line
rather than doubling up); `settings/shared.tsx`'s local `Input` wrapper
(theme adapter above); `InputControls.tsx` (1 raw `bdi-text` site + 1
dynamic-theme site, both above); `ImageEditorModal.tsx` /
`SpacingControls.tsx` (the two files whose `<Input>` sites split across
BOTH buckets — 6 raw + 2 themed, and 1 raw + 1 themed, respectively).

**Remaining ~91 plain sites across 51 files:** mechanical
tag-rename + theme-prop + import swap via a `ts-morph` codemod (scratch,
not committed). **Codemod correctness trap, found and fixed, worth
recording:** `JsxSelfClosingElement#insertAttribute(0, text)` silently
failed to insert the attribute text in this ts-morph version (28.0.0) —
verified via an isolated repro (a lone `<Foo bar="1" baz="2" />` fixture);
the call reported success and `saveSync()` wrote *something* (a stray
space) but never the actual `theme={...}` text. A **second** ts-morph
attempt via `tagNameNode.replaceWithText(...)` worked for a single target
per file but threw a tree-diff `ManipulationError` on the second target in
the same file (processing multiple manipulations against the same
`SourceFile` object invalidates other live node references, regardless of
processing order — reversing the target list did not help). The reliable
fix: use `ts-morph` in **read-only** mode only (to get accurate character
offsets via `tagNameNode.getEnd()`), then splice the insertion string
directly into the raw file text via plain `fs` read/write, processing
offsets in descending order per file so earlier insertions don't shift
already-computed offsets. Caught by a **positive** verification, not an
absence-of-error check — a second AST-based "does this `<TextInput>` element
have a `theme` attribute" pass (independent script, real query not a text
heuristic) confirmed 91/91 fixed only after the `fs`-splice rewrite; the
`insertAttribute`-based first pass had reported "sites touched: 91" and
`tsc --noEmit` clean (since a missing `theme` prop is not a type error —
`theme` is optional) while having silently fixed **zero** of them, which a
naive "no exception + tsc clean" check would have missed entirely.

**Consumer sweep totals:** 128 `@/editor/ui`-aliased sites (26 raw + 91
`TextInput`+theme via codemod + 11 hand-edited `TextInput`+theme in
special-case files, roughly) + 2 test-file sites (`atoms.test.tsx`,
`field-popover.test.tsx`, both rewritten — see below) + 1 local wrapper
(`settings/shared.tsx`). `grep -rn "bk-input" src` after deleting the CSS
block found zero orphan raw-element usages.

**Test files:** `atoms.test.tsx`'s old `describe("Input")` block (asserted
`aria-invalid` wiring against the deleted component) replaced with a
`describe("TextInput")` block: one new test matching the Select precedent's
"`className` lands on the OUTER wrapper, `theme` is the only way to
restyle the field" structural-gap assertion, one asserting
`BK_TEXT_INPUT_THEME`'s `aria-invalid:` variant is actually present in the
resolved className (real positive assertion, not just "no error"), one
"healthy" no-`aria-invalid` case. `field-popover.test.tsx`'s `FormField`
block (tests `FormField`'s own label/hint/error wiring, not `Input`
specifically) rewritten to render a plain native `<input {...p} />` in the
render-prop slot — decouples the `FormField` contract test from whichever
control implementation happens to fill it.

**Class-list regen:** `pnpm flowbite:classlist` — new prefixed
`TextInput` theme entries present; `.flowbite-react/init.tsx` byproduct
deleted again (same standing reason every prior round gives).

Verified: `npx tsc --noEmit` clean. `npx vitest run src/editor/ui/__tests__
src/shared/forms` — 11 files / 148 tests green (run before the
`insertAttribute` codemod bug above was caught and fixed). Full re-run
after the `theme`-prop fix, across every touched top-level directory plus
`ui/__tests__` and `shared/forms` (`inspector`, `media`, `sidebar`,
`canvas`, `panels`, `shell`, `design-system`, `export`,
`components-catalog`) — **414 test files / 3539 tests green, 1 skipped,
1 todo** (pre-existing, unrelated to this change).

### Field.tsx (Cluster/Label/HelperText/FormField/Tag) + FieldRow

Executes the controller's locked decision (progress.md: "Input→TextInput,
Label/HelperText→flowbite; Cluster→dissolve (layout, like Stack/Row);
Tag→chrome-ui custom (no flowbite target); FormField→chrome-ui
composition") — with two corrections the live-consumer sweep (Step 2 of
the brief's cycle) forced, both recorded here rather than silently
overridden:

**FormField stayed in `editor/ui/`, not `chrome-ui/`.** 4 of its 5 real
consumers (`shared/forms/{Input,Select,Textarea,Number}Field.tsx`) live in
`shared/forms/`, and `packages/editor/CLAUDE.md`'s import-direction rules
grant `shared/forms/` exactly **one** intentional `shared/→editor` edge —
`@/editor/ui` — explicitly, by name, not `@/editor/chrome-ui`. Moving
`FormField` to `chrome-ui/` would have created a second, undocumented edge
across the majority of its own consumers. `editor/ui/` already composes
concrete `flowbite-react` components directly in several files
(`Topbar.tsx`, `Toast.tsx`, `ConfirmDialog.tsx`, `HelpTooltip.tsx`,
`IntegrationRow.tsx`, `MediaCard.tsx`, `Presence.tsx`, `PanelHeader.tsx`,
`PanelFrame.tsx`, `VersionRow.tsx`), so there's no boundary reason `Label`/
`HelperText` composition needs to leave `editor/ui/` either — the file was
moved from `Field.tsx` to a new `editor/ui/FormField.tsx`, same render-prop
API, same id/`aria-describedby` wiring, only the internals changed (flowbite
`Label`+`HelperText` instead of the deleted bespoke ones).

**T13 RESOLUTION REQUIRED (forward collision, deferred, not silent):**
this decision — `FormField` (and `FieldRow`, and any other `editor/ui/`
survivor still standing when that task runs) staying in `editor/ui/` —
collides with plan Task 13, which deletes `editor/ui/` wholesale and locks
`gate:editor-ui-gone` to fail any `@/editor/ui` import. `shared/forms/`'s
*only* sanctioned `shared/→editor` edge is `@/editor/ui` (CLAUDE.md,
verbatim) — so at T13 teardown, the one edge target `shared/forms/`'s 4
real `FormField` consumers (`InputField.tsx`, `SelectField.tsx`,
`TextareaField.tsx`, `NumberField.tsx`) are allowed to use disappears out
from under them. This is not resolved here — T13 hasn't run yet, and
moving `FormField` to `chrome-ui/` now would just relocate today's
collision one file earlier for no benefit — but it must be resolved **in
the same commit** as the T13 teardown: (1) move the surviving `editor/ui/`
primitives to `chrome-ui/`, and (2) update CLAUDE.md's `shared/forms/`
exception line from `@/editor/ui` to `@/editor/chrome-ui` in that same
commit (a one-line doc change — same edge, new target, not a new
exception). Whoever executes T13 should treat this paragraph as the
trigger for that pairing, not discover the gate failure cold.

**Tag deleted outright, not ported to `chrome-ui/`.** A fresh consumer
sweep (JSX-tag grep across all of `src`, not just files matching a text
search for the word "Tag") found **zero** real consumers — the only two
non-test hits (`DSBindingChip.tsx`, `DSStatusChip.tsx`) are both local
`const Tag: "button" | "span" = ...` polymorphic-element variables,
unrelated to `editor/ui`'s `Tag` component; the only real reference left
was `Tag`'s own contract test. The locked decision's origin (Round 3's
report) had already flagged this as unresolved — "their consumers (7 and 1
respectively) need checking before assuming they're in scope at all" — and
the "1" turns out to have been one of those two false positives. Porting a
component with 0 live consumers into a brand-new `chrome-ui/Tag.tsx` file
would be authoring dead code on arrival, directly against CLAUDE.md's
"no dead code: unused exports — DELETE it, git history has it if needed"
rule; deleted instead (`.bk-tag*` CSS block, its test `describe` block, its
`index.ts` export, all drained together). This is the same
"inventory-reality-wins" class of correction Round 4 already made twice
(Input's 26/18 vs 26/24 site-count correction; the raw-input Gate 24 fix).

**FieldRow verdict: KEEP, unchanged.** Same live-consumer-count surprise:
its only "real" consumer found by a naive text search
(`SearchListingsTable.tsx`) turned out to be a **local** `function
FieldRow({ label, children })` with a different signature, unrelated to
`editor/ui`'s `FieldRow`. The real component's only reference anywhere is
its own contract test (`molecules.test.tsx`). Left untouched rather than
deleted, for a different reason than Tag's: `FieldRow` doesn't depend on
anything this round touched (no `Cluster`/`Label`/`HelperText`/`FormField`
import, confirmed in Round 3 already, reconfirmed here), it has no flowbite
analog (Inspector-only label+control layout, `.bk-field-row*` CSS wasn't
touched), and it's a genuine `editor/ui`-canonical primitive per its own
header comment (documents an intended future consolidation target for
Border/Link/Effects/Grid inspector sections that never happened) — nothing
in this task's scope forces a decision on its 0-consumer status one way or
the other, and deleting an exported, documented, tested component as a side
effect of an unrelated flowbite-swap task would be its own kind of
unrequested scope creep. Recorded explicitly per the brief's own
instruction, not left ambiguous.

**Cluster → dissolved to `tw:flex` at 11 real call sites across 5 files**
(`SocialTab.tsx` ×2, `SeoTab.tsx` ×3 incl. one nested pair, `AdvancedTab.tsx`
×3, `AlignmentSection.tsx` ×2, `RichTextEditor.tsx` ×1) — mapping:
`.bk-cluster` (`flex-wrap; align-items:center; gap:8px`) →
`tw:flex tw:flex-wrap tw:items-center tw:gap-2`; `justify="between"` →
`+tw:justify-between`; `nowrap` → `tw:flex-nowrap` in place of
`tw:flex-wrap`; `gap="xs"` → `tw:gap-1` in place of `tw:gap-2`
(`--bk-space-4`/`--bk-space-8` map 1:1 onto Tailwind's default 4px scale,
so no arbitrary values needed). Each site's per-instance modifiers
(`justify`/`nowrap`/`gap`) were read individually before dissolving, not
pattern-matched from a prior site — same discipline the brief calls for on
the later, larger Stack/Row dissolve.

**Label / HelperText → flowbite, color+font-family fixed, font-size mostly
kept exact (new adapter `editor/ui/labelTheme.ts`).** Both apply
`className` directly to the real `<label>`/`<p>` (`Label.js`/
`HelperText.js`: `twMerge(theme.root.base, ..., className)`, no
wrapper-div gap) — a plain className override is enough, no `theme`-prop
adapter needed the way `TextInput`/`Select` required. Real finding, not
assumed: **this codebase has no global `body`/`:root` font-family reset
anywhere** — every single text-bearing rule in `ui.css` sets
`font-family: var(--bk-font-ui)` on itself, with zero exceptions (verified
by grep across all of `ui.css` and every panel CSS file) — so leaving
flowbite's `Label`/`HelperText` font-family unset would fall back to the
browser's UA-default font, a real regression, not an acceptable "shape
difference" the way `TextInput`/`Select`/`Textarea`'s `p-2.5 text-sm` box
was accepted for plain form-row controls (that precedent was specifically
about form-control *geometry*, not a font ever silently going unset).
- `BK_LABEL_CLASS`: flowbite default `text-sm font-medium text-gray-900`
  (14px / `#111827`, exact match to `--bk-ink`, one step darker than
  labels have ever rendered here) → overridden to `tw:text-xs
  tw:text-gray-600 tw:[font-family:var(--bk-font-ui)]` (`text-xs`=12px=
  `--bk-text-12` exactly, `gray-600`=`#4B5563`=`--bk-ink-soft` exactly,
  both plain Tailwind ramp steps, no arbitrary value needed for either;
  `font-medium` already correct, left alone).
- `BK_HELPER_CLASS`: flowbite default `color="gray"` is `mt-2 text-sm
  text-gray-500` — `gray-500` (`#6B7280`) already equals `--bk-ink-muted`
  exactly, so the base case needs **no color override at all**; the real
  gaps are `mt-2` (8px top margin new to every call site — all sit inside
  a `Stack`/flex column that supplies its own gap already, so the extra
  margin would double-space every hint — neutralized via `tw:mt-0`) and
  size (`--bk-text-11`=11px has no default Tailwind step, hence
  `tw:text-[11px]`, plus the same `tw:[font-family:...]` fix as Label).
- `BK_HELPER_ERROR_CLASS` = `${BK_HELPER_CLASS} tw:text-[var(--bk-error-text)]`
  — flowbite's `color="failure"` gives `text-red-600` (`#DC2626`), one ramp
  step off `--bk-error-text` (`#C81E1E`), same arbitrary-value-CSS-var
  pattern `textInputTheme.ts` already established for `--bk-error`.

Consumers: 8 `Label` sites (`SocialTab.tsx` ×3, `SeoTab.tsx` ×3,
`AdvancedTab.tsx` ×2) + 1 in `shared/forms/SliderField.tsx` (imports
`Label` from `flowbite-react` directly — already precedented in
`shared/forms/`, which imports concrete `flowbite-react` components in
6 of its 8 files; the CLAUDE.md `shared/→editor` restriction is about the
internal `editor/` layer, not the third-party npm package) = 9 total.
12 `HelperText` sites across the same 3 page-settings files (`SeoTab.tsx`
×4, `SocialTab.tsx` ×2, `AdvancedTab.tsx` ×6) + 1 in
`InspectorTabContent.tsx` = 13 total (2 of the 12 page-settings sites are
the `error`/`color="failure"` variant: `SeoTab.tsx`'s slug error,
`AdvancedTab.tsx`'s head-code error).
None of the real call sites pass `required` to `FormField` today (grepped
every site) — kept working regardless, since it's part of the component's
declared public API, not a newly-invented capability.

**Consumer sweep totals:** Cluster 11, Label 9, HelperText 13 (12 across
the 3 page-settings files + the `InspectorTabContent.tsx` one, 2
error-variant), FormField 7 call
sites across 5 files (`InputField.tsx`, `SelectField.tsx`,
`TextareaField.tsx`, `NumberField.tsx` ×1 each, `SendForReview.tsx` ×3 —
none needed an import-path change since `FormField` stayed in
`editor/ui/`), Tag 0, FieldRow 0 (both left/handled per the verdicts
above). `grep -rn "bk-cluster\|bk-label\|bk-helper\|bk-field\b\|bk-tag" src`
after deleting the CSS block found zero orphan raw-element usages (checked
separately from `bk-field-row`, which stays — `FieldRow` untouched).

**Test files:** `field-popover.test.tsx` — `FormField`'s existing
label/hint/error-wiring tests kept (still exercise the real component, now
composing flowbite internally); "marks required fields" rewritten from a
`.bk-label__required` class-string match to a `label
[aria-hidden="true"]` structural query (same real-positive-assertion
spirit, since the class no longer exists). `Tag` `describe` block deleted
(component deleted). The old "Cluster / HelperText" combined block (tested
`.bk-cluster--between` + `.bk-helper--error` class strings, both now gone)
replaced with a new "Label / HelperText overrides (labelTheme.ts)" block —
3 real positive assertions on the *resolved* className (matching the
Select bare-theme fix-round's evidence bar): `BK_LABEL_CLASS` present +
flowbite's default `text-gray-900` absent; `BK_HELPER_CLASS`'s `tw:mt-0`
present + flowbite's default `mt-2` absent; `BK_HELPER_ERROR_CLASS`'s
arbitrary-value red present + flowbite's default `text-red-600` absent.
Verified the underlying merge mechanism before writing these (not
assumed): `resolveTheme()` prefixes flowbite's own base/color strings with
the same global `tw` prefix *before* `Label.js`/`HelperText.js`'s own
`twMerge(...)` call runs, so our pre-prefixed override and flowbite's
now-prefixed default land in the same tailwind-merge conflict group and
correctly evict one another — same mechanism the Select bare-theme fix
already relied on, re-verified against `resolve-theme.js` source rather
than assumed to still hold.

**Class-list regen:** `pnpm flowbite:classlist` — class-list grew from 307
(round 1) to 448 entries; spot-checked `tw:text-sm`, `tw:font-medium`,
`tw:text-gray-900`, `tw:mt-2`, `tw:text-gray-500`, `tw:text-red-600` all
present and correctly `tw:`-prefixed (flowbite's own `Label`/`HelperText`
base/color classes, needed so the *default* values our overrides evict are
themselves compiled — the class-list only reaches `node_modules`; the
arbitrary-value overrides in `labelTheme.ts` are first-party source, already
covered by `tw.css`'s own `@source "../editor"` glob). `.flowbite-react/init.tsx`
byproduct deleted again (same standing reason every prior round gives).

Verified: `npx tsc --noEmit` clean. Targeted run across every touched
top-level directory (`ui/__tests__`, `atoms.test.tsx`, `molecules.test.tsx`,
`chrome-ui/__tests__`, `shared/forms`, `sidebar/tabs/pages`, `inspector`,
`panels`, `shell`) — **157 test files / 1347 tests green**.

### Slider → `flowbite-react` `RangeSlider` (composition, KEEP the wrapper)

Confirmed via a fresh JSX-tag sweep (not text search) before touching
anything: exactly 2 real consumers of `<Slider` from `@/editor/ui` —
`shared/forms/SliderField.tsx` and
`editor/panels/version-history/ApprovedCompareView.tsx`. Several other
files matched a bare `Slider` text grep (`SliderControls.tsx`,
`SliderControl.tsx`, `ZoomControls.tsx`'s `handleSliderChange`,
`GapSlider`, lucide's `SlidersHorizontal` icon) — all false positives,
none import the component.

**Genuine structural swap, not a prop-rename**, confirmed by reading
`RangeSlider.js`/`theme.js` in full before designing anything: flowbite's
`RangeSlider` renders only `<div><div><input type="range" class="w-full
cursor-pointer appearance-none rounded-lg bg-gray-200 h-2" /></div></div>`
— a bare unfilled track. Nothing in the library provides: (1) the
`--bk-slider-fill`-percentage accent fill bar, (2) the drag-grow
14px→16px thumb, (3) a numeric field, (4) a unit suffix. `className` on
`RangeSlider` lands on the OUTER wrapper div only (same structural gap as
`TextInput`/`Select` — confirmed in source, not assumed); the real
`<input>`'s class must come through `theme.field.input.base`.

**Decision: kept `editor/ui/Slider.tsx` as a composition wrapper** around
flowbite's `RangeSlider` (for the range-input semantics: focus, keyboard,
native drag, ARIA) + a plain raw `<input type="number">` for the value
readout — not extracted to `chrome-ui/`. Two reasons: (1) `SliderField.tsx`
lives in `shared/forms/`, which per `CLAUDE.md` may only take the one
sanctioned `shared/→editor` edge, `@/editor/ui` — same constraint
`FormField` hit one round earlier; (2) `editor/ui/` is itself the
sanctioned Gate-24 owner of native elements (confirmed directly in
`scripts/ds-grep-gates.sh`'s `GATE24_HITS`/`GATE24_FILE_COUNT` find
commands — both exclude `*/editor/ui/*` and `*/editor/chrome-ui/*`), so
the raw number `<input>` needs no `chrome-ui/TextField` indirection; a
pass-through around `TextField` would have been exactly the kind of
wrapper CLAUDE.md rule 1 bars. `SliderProps`'s public API is byte-identical
to the pre-swap version (`value`, `onChange`, `min`, `max`, `step`,
`disabled`, `label`, `unit`, `withField`, `id`, `className`) — zero changes
needed at either of the 2 call sites.

**Fill-bar / thumb / numeric-field look reproduced via a new unlayered
stylesheet, `src/editor/ui/slider.css`**, imported directly by
`Slider.tsx` (`import "./slider.css"`) rather than routed through
`themes/default.css`'s `@layer` chain — same precedent as
`layers-v2.css`/`inspector.css`/`settings.css`: a plain-CSS file outside
the layer system beats any `tw-utilities`-layer class regardless of
specificity. This meant the old `.bk-slider*` block could move to the new
file **verbatim** (same selectors, same declarations — a relocation, not
a redesign) without needing to fight tailwind-merge or express the
percentage-driven gradient as an arbitrary Tailwind value: passed
`theme={{ field: { input: { base: "bk-slider__range" } } }}` to
`RangeSlider` (the only way to land a class on the real `<input>`), and
`--bk-slider-fill` continues to be set via a plain `style` prop (spread
onto the real input by `RangeSlider`'s own `...restProps`). Verified the
merge behavior empirically rather than assumed: since `bk-slider__range`
isn't a recognized Tailwind utility, tailwind-merge doesn't evict any of
flowbite's defaults (`bg-gray-200`, `h-2`, `rounded-lg`, `w-full` all
remain in the class list) — irrelevant, because the unlayered rule wins
on every property it declares regardless of what layered classes are
still present.

**Compiled-CSS proof** (established evidence bar for this task, not just
class-list presence): ran `npx vite build`, grepped the emitted CSS —
`.bk-slider__range{...background:linear-gradient(...)...}`,
`.bk-slider__range::-webkit-slider-thumb{...}`,
`.bk-slider--disabled .bk-slider__range{...}` all present, unlayered
(no `@layer` wrapper in the compiled output); flowbite's own prefixed
defaults (`.tw\:bg-gray-200`, `.tw\:h-2`, `.tw\:appearance-none`) also
present and correctly compiled (harmless — beaten per-property by the
unlayered rule, not absent). `dist/` is gitignored, removed after the
check.

**Class-list regen:** `pnpm flowbite:classlist` — one new entry
(`tw:h-1`, picked up incidentally from another already-imported flowbite
component's size variant scan, not from anything Slider added — Slider's
own overrides are first-party arbitrary values already covered by
`tw.css`'s `@source "../editor"` glob). `.flowbite-react/init.tsx`
byproduct deleted again (same standing reason every prior round gives).

**Orphan check:** `grep -rn "bk-slider" src` after the move found exactly
one remaining reference outside `Slider.tsx`/`slider.css` —
`AnimationEditor.test.tsx`'s `.bk-slider__num` selector query, still valid
since the class name itself didn't change, only its file location.

Verified: `npx tsc --noEmit` clean. Targeted run: `ui/__tests__` +
`shared/forms` + `editor/animation` + `editor/panels/version-history` —
14 test files / 175 tests green.

### Tabs — **KEEP** (never run through the Task 4 process; structural mismatch found this round)

`Tabs` wasn't in the Task 4 "Behavior parity verdicts" table above (that
table only covers Modal/Dropdown/Popover/Tooltip/Toast) — same gap the
Round-4 report already flagged for Input/Field ("apparently was never run
through that same process"). No existing verdict to execute; this is a
fresh judgment call, made under the same authority the controller granted
Slider's round ("if composition proves genuinely worse than keeping ours…
record KEEP — reason… parity-of-outcome beats forced swap").

**Consumer sweep first** (JSX-tag, not text grep — `Tabs`/`tabs` collide
with `tabsConfig`, `getTabsByZone`, a hand-rolled unrelated tab bar in
`ProjectSettingsModal.tsx` built from `Button`s, and others): exactly 4
real consumers of `<Tabs` from `@/editor/ui` —
`editor/animation/AnimationEditor.tsx`, `editor/export/ExportModal.tsx`,
`editor/export/CodePreview.tsx`, `editor/media/MediaLibraryPanel.tsx`.
Every one uses the identical shape: `const [activeTab, setActiveTab] =
useState(...)`, `<Tabs tabs={[...]} value={activeTab}
onChange={setActiveTab} />`, then the active panel's content rendered as
a **sibling**, conditionally, sometimes visually and structurally distant
from the `<Tabs>` element itself (`MediaLibraryPanel.tsx`'s tab content
lives in a separate `<div style={styles.container}>` after the Tabs;
`ExportModal.tsx`'s Tabs sit in one wrapper div, its content in a
different one 8 lines later). No consumer switches tabs from outside the
`onChange` handler (checked every file for a second `setActiveTab(...)`
call site — none found).

**Read `Tabs.js`/`TabItem.js`/`theme.js` in full before judging** (same
discipline every prior component's "map the API first" step used) and
found a structural mismatch bigger than any prior SWAP candidate's:

1. **flowbite's `Tabs` bundles trigger + panel ownership.** Panel content
   must be passed as `<TabItem title="…">{content}</TabItem>` *children*
   of `<Tabs>` itself — `Tabs.js` reads `Children.toArray(children)` to
   build both the tablist buttons AND the panel `<div>`s
   (`tab.children` rendered inside `role="tabpanel"` divs it owns). Our
   `Tabs` is deliberately headless — it renders `role="tablist"` and
   nothing else; every real consumer's panel content lives completely
   outside it. Adopting flowbite's `Tabs` as-is would force every one of
   the 4 consumers to physically relocate its panel JSX inside `<TabItem>`
   children — a real structural rewrite of each file's render tree, not a
   prop-mapping exercise.
2. **No externally-controlled `value` prop exists at all.** `activeTab`
   is `useState(Math.max(0, tabs.findIndex(tab => tab.active)))` —
   evaluated **once**, at mount, from the initial `active` prop on each
   `TabItem`. After mount, the only way to change it from outside a click
   is the imperative `ref.setActiveTab(index)` exposed via
   `useImperativeHandle` — there is no prop that keeps `activeTab` in
   sync with external state the way our `value` does. Every real consumer
   here relies on ordinary React controlled-component semantics
   (`value={activeTab}`); porting to flowbite's `Tabs` would mean either
   accepting one-way-uncontrolled behavior after the first click, or
   wiring a `useEffect` that calls a ref method on every external state
   change — a strictly worse pattern than the prop we'd be deleting, for
   a component whose whole existence in this codebase is 47 lines of
   plain ARIA-tablist keyboard handling.
3. **Index-identity, not id-identity.** `TabItem`s are matched by array
   position (`index === activeTab`); our `Tab.id` string-keyed API would
   need an id→index translation layer at every call site for zero
   behavioral gain.
4. **Even the visual match needs work, not a freebie.** `tabsTheme`'s
   active-tab color for every variant (`default`, `underline`, `pills`,
   `fullWidth`) is keyed to `primary-600`/`primary-500` — the same
   one-ramp-step-off-`#1A56DB` gap `Checkbox`/`Radio` hit (`text-primary-600`
   vs the exact-match `text-blue-700`; flowbite's Tabs has no `color` prop
   at all to reach it, only a full `theme` override) — so even a
   from-scratch composition would need the same per-call-site `theme`
   surgery already documented for those two components, on top of the
   structural rewrite above.

**Cost/benefit:** swapping would require restructuring the render tree of
all 4 consumer files (relocating conditionally-rendered, sometimes
visually distant panel JSX into `TabItem` children), replacing a clean
`value`-controlled API with an imperative-ref workaround, translating
id-keyed tab state to index-keyed, and still writing a `theme` override
for the color match — against a KEEP baseline that is 47 lines of
standard WAI-ARIA tablist behavior (arrow-key roving focus, Home/End,
`aria-selected`) with a 12-line CSS block, zero bespoke visual tricks
(no fill-bar/gradient/CSS-var complexity like Slider's), and already
byte-exact on `--bk-accent`. No visual or UX improvement would result —
only a larger, more coupled component in every consumer for the same
rendered outcome. Per the same "parity-of-outcome beats forced swap"
standard the controller set for Slider: **`src/editor/ui/Tabs.tsx` and
its `ui.css` block are unchanged.** No commit for this component (no code
touched) — this entry is the decision record, so the verdict isn't left
implicit or silently skipped.
