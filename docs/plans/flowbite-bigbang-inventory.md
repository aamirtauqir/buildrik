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
