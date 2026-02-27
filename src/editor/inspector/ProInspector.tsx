/**
 * Aquibra Pro Inspector Panel
 * Professional page builder inspector with visual controls
 * Elementor-style UI with comprehensive CSS property support
 *
 * Section expansion logic is in hooks/useInspectorSections.ts
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { isValidBreakpoint } from "../../shared/constants/breakpoints";
import type { DeviceType } from "../../shared/types";
import type { BreakpointId } from "../../shared/types/breakpoints";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../shared/types/media";
import { getElementIcon } from "../../shared/ui/Icons";
import { Modal } from "../../shared/ui/Modal";
import { useComposerSelection } from "../canvas/hooks/useComposerSelection";
import { ElementBreadcrumb } from "./components/ElementBreadcrumb";
import { InspectorControls } from "./components/InspectorControls";
import { InspectorEmptyState } from "./components/InspectorEmptyState";
import { InspectorErrorBoundary } from "./components/InspectorErrorBoundary";
import { MultiSelectToolbar } from "./components/MultiSelectToolbar";
import { useInspectorState, useStyleHandlers, useInspectorSections, TOTAL_SECTIONS } from "./hooks";
import { KeyboardHintsSection } from "./sections/KeyboardHintsSection";
import { VariantSection } from "./sections/VariantSection";
// AISuggestionSection moved to SettingsTab only (IA Redesign 2026 - Task 0.10)
import { deriveCssContext, getPropertyStates } from "./shared/cssContext";
import { DevModeToggle } from "./shared/DevModeToggle";
import { panelStyles, renderPseudoStateSelector, renderBreakpointIndicator } from "./styles";
import { LayoutTab, DesignTab, SettingsTab } from "./tabs";

// ============================================================================
// TYPES
// ============================================================================

export interface ProInspectorProps {
  selectedElement: {
    id: string;
    type: string;
    tagName?: string;
  } | null;
  composer?: Composer | null;
  currentBreakpoint?: DeviceType;
  onDelete?: (id: string) => void;
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  /** Opens the Build panel in the left sidebar */
  onOpenBuildPanel?: () => void;
  /** Opens the Templates browser */
  onBrowseTemplates?: () => void;
  /** Phase 7: Opens the Design/Global Styles panel */
  onOpenDesignPanel?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ProInspector: React.FC<ProInspectorProps> = ({
  selectedElement,
  composer,
  currentBreakpoint: currentBreakpointProp = "desktop",
  onDelete,
  onOpenMediaLibrary,
  onOpenIconPicker,
  onOpenBuildPanel,
  onBrowseTemplates,
  onOpenDesignPanel,
}) => {
  // Convert DeviceType to BreakpointId
  const currentBreakpoint: BreakpointId = isValidBreakpoint(currentBreakpointProp)
    ? currentBreakpointProp
    : "mobile";

  const {
    activeTab,
    currentPseudoState,
    autoExpandSection,
    devMode,
    setActiveTab,
    setCurrentPseudoState,
    setDevMode,
  } = useInspectorState(selectedElement);

  const {
    styles: styles_state,
    handleStyleChange,
    handleBatchStyleChange,
    overriddenProperties,
  } = useStyleHandlers(selectedElement, composer, currentBreakpoint, currentPseudoState);

  // Section expand/collapse — extracted to useInspectorSections
  const { expandedSections, expandedCount, collapseAll, expandAll } = useInspectorSections({
    selectedElement,
    composer,
  });
  void expandedSections; // consumed by child sections when they support controlled expansion

  const [searchQuery, setSearchQuery] = React.useState("");
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Scroll position persistence (Gap 2 fix - UX Strategy)
  const scrollPositionsRef = React.useRef<Map<string, number>>(new Map());
  const previousElementIdRef = React.useRef<string | null>(null);

  // P0 Fix: Delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // Multi-select detection via same hook as Canvas (proven to work)
  const { selectedIds, isMultiSelect } = useComposerSelection({ composer: composer ?? null });

  // CSS context for rule-based UI
  const [contextState, setContextState] = React.useState(() =>
    deriveCssContext(selectedElement, composer, devMode)
  );
  const propertyStates = getPropertyStates(contextState);

  // Phase 5: Inject override indicators
  if (overriddenProperties) {
    overriddenProperties.forEach((prop) => {
      if (!propertyStates[prop]) propertyStates[prop] = {};
      propertyStates[prop].isOverridden = true;
    });
  }

  React.useEffect(() => {
    setContextState(deriveCssContext(selectedElement, composer, devMode));
  }, [selectedElement, composer, styles_state, devMode]);

  // ── Scroll position persistence ────────────────────────────────────────────
  React.useEffect(() => {
    const container = contentRef.current;
    const prevId = previousElementIdRef.current;

    if (prevId && container) {
      scrollPositionsRef.current.set(prevId, container.scrollTop);
    }
    previousElementIdRef.current = selectedElement?.id ?? null;

    if (selectedElement?.id && container) {
      const savedPosition = scrollPositionsRef.current.get(selectedElement.id);
      if (savedPosition !== undefined) {
        requestAnimationFrame(() => {
          container.scrollTop = savedPosition;
        });
      } else {
        requestAnimationFrame(() => {
          container.scrollTop = 0;
        });
      }
    }
  }, [selectedElement?.id]);

  React.useEffect(() => {
    const container = contentRef.current;
    if (!container || !selectedElement?.id) return;

    const handleScroll = () => {
      scrollPositionsRef.current.set(selectedElement.id, container.scrollTop);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [selectedElement?.id]);

  // Element info lookup
  const ElementIcon = selectedElement
    ? getElementIcon(selectedElement.type)
    : getElementIcon("default");
  const elementLabel = selectedElement?.type
    ? selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)
    : "Element";

  // ============================================================================
  // RENDER: Multi-Select State
  // ============================================================================
  const hasMultipleSelected = selectedIds.length > 1 || isMultiSelect;

  if (hasMultipleSelected) {
    return (
      <div style={panelStyles.panel}>
        <MultiSelectToolbar selectedIds={selectedIds} composer={composer ?? null} />
      </div>
    );
  }

  // ============================================================================
  // RENDER: No Selection
  // ============================================================================
  if (!selectedElement) {
    return (
      <InspectorEmptyState
        onOpenBuildPanel={onOpenBuildPanel}
        onBrowseTemplates={onBrowseTemplates}
        onOpenDesignPanel={onOpenDesignPanel}
      />
    );
  }

  // ============================================================================
  // RENDER: Inspector
  // ============================================================================
  return (
    <div style={panelStyles.panel}>
      {/* Header */}
      <div style={{ ...panelStyles.header, position: "relative" as const }}>
        <div style={panelStyles.elementInfo}>
          <div style={panelStyles.elementIcon}>
            <ElementIcon size="lg" />
          </div>
          <div>
            <div style={panelStyles.elementName}>{elementLabel}</div>
            <div style={panelStyles.elementId}>
              #{selectedElement.id.slice(-8)}
              {selectedElement.tagName && (
                <span style={panelStyles.tagBadge}>
                  &lt;{selectedElement.tagName.toLowerCase()}&gt;
                </span>
              )}
            </div>
          </div>
        </div>

        {onDelete && (
          <button
            style={panelStyles.deleteBtn}
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete element"
            aria-label="Delete selected element"
          >
            🗑️
          </button>
        )}

        {/* P0 Fix: Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Element?"
          size="sm"
        >
          <div style={{ padding: "var(--aqb-space-4)" }}>
            <p
              style={{
                margin: "0 0 var(--aqb-space-4)",
                color: "var(--aqb-text-secondary)",
                fontSize: "var(--aqb-text-md)",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete <strong>{elementLabel}</strong>? This action cannot be
              undone.
            </p>
            <div style={{ display: "flex", gap: "var(--aqb-space-3)", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: "8px 16px",
                  background: "var(--aqb-surface-4)",
                  border: "1px solid var(--aqb-border)",
                  borderRadius: "var(--aqb-radius-md)",
                  color: "var(--aqb-text-primary)",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete?.(selectedElement.id);
                  setShowDeleteConfirm(false);
                }}
                style={{
                  padding: "8px 16px",
                  background: "var(--aqb-error)",
                  border: "none",
                  borderRadius: "var(--aqb-radius-md)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>

        <ElementBreadcrumb selectedElement={selectedElement} composer={composer} />
        {renderBreakpointIndicator(currentBreakpoint)}
        {renderPseudoStateSelector(currentPseudoState, setCurrentPseudoState)}
      </div>

      {/* Phase 7: Inspector Controls - Search, Collapse/Expand, Dev Mode */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--aqb-space-2)",
          padding: "0 var(--aqb-space-3)",
          marginBottom: "var(--aqb-space-2)",
        }}
      >
        <div style={{ flex: 1 }}>
          <InspectorControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            expandedCount={expandedCount}
            totalCount={TOTAL_SECTIONS}
            onCollapseAll={collapseAll}
            onExpandAll={expandAll}
          />
        </div>
        <DevModeToggle enabled={devMode} onToggle={setDevMode} />
      </div>

      {/* Tabs - Layout / Design / Settings */}
      <div style={panelStyles.tabs}>
        {(["layout", "design", "settings"] as const).map((tab) => {
          const sectionCounts = { layout: 6, design: 6, settings: 6 };
          return (
            <button
              key={tab}
              style={panelStyles.tab(activeTab === tab)}
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              aria-label={
                tab === "layout"
                  ? "Layout & Size tab - Position, Display, Spacing, Flexbox, Grid"
                  : tab === "design"
                    ? "Style tab - Typography, Colors, Background, Border, Effects"
                    : "Advanced tab - Element Properties, Bindings, Interactions"
              }
            >
              <span>
                {tab === "layout" && "Layout & Size"}
                {tab === "design" && "Style"}
                {tab === "settings" && "Advanced"}
              </span>
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 10,
                  background:
                    activeTab === tab ? "var(--aqb-accent-blue-alpha)" : "var(--aqb-surface-3)",
                  color: activeTab === tab ? "var(--aqb-accent-blue)" : "var(--aqb-text-tertiary)",
                }}
              >
                {sectionCounts[tab]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Section summary for current tab */}
      <div
        style={{
          padding: "6px 12px",
          fontSize: 10,
          color: "var(--aqb-text-tertiary)",
          borderBottom: "1px solid var(--aqb-border-subtle)",
          background: "var(--aqb-surface-2)",
        }}
      >
        {activeTab === "layout" && "Position • Display • Spacing • Flexbox • Grid • Visibility"}
        {activeTab === "design" &&
          "Typography • Background • Border • Effects • Animation • Interactions"}
        {activeTab === "settings" &&
          "Properties • Navigation • Form • Classes • CSS • AI Suggestions"}
      </div>

      {/* Content */}
      <div ref={contentRef} style={panelStyles.content}>
        <InspectorErrorBoundary>
          {activeTab === "layout" && (
            <>
              <LayoutTab
                composer={composer}
                selectedElement={selectedElement}
                currentPseudoState={currentPseudoState}
                styles={styles_state}
                onChange={handleStyleChange}
                onBatchChange={handleBatchStyleChange}
                propertyStates={propertyStates}
                autoExpandSection={autoExpandSection as "layout" | "size" | null}
                cssContext={contextState}
                searchQuery={searchQuery}
              />
              <VariantSection
                composer={composer ?? null}
                elementId={selectedElement?.id ?? null}
                isOpen={autoExpandSection === "variants"}
              />
            </>
          )}

          {activeTab === "design" && (
            <DesignTab
              composer={composer}
              selectedElement={selectedElement}
              currentPseudoState={currentPseudoState}
              styles={styles_state}
              onChange={handleStyleChange}
              onBatchChange={handleBatchStyleChange}
              onOpenMediaLibrary={onOpenMediaLibrary}
              autoExpandSection={autoExpandSection as "typography" | null}
              searchQuery={searchQuery}
              cssContext={contextState}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              composer={composer}
              selectedElement={selectedElement}
              currentPseudoState={currentPseudoState}
              autoExpandSection={autoExpandSection as "elementProperties" | null}
              onOpenMediaLibrary={onOpenMediaLibrary}
              onOpenIconPicker={onOpenIconPicker}
              searchQuery={searchQuery}
              devMode={devMode}
            />
          )}

          <KeyboardHintsSection selectedElement={selectedElement} />
        </InspectorErrorBoundary>
      </div>
    </div>
  );
};

export default ProInspector;
