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
