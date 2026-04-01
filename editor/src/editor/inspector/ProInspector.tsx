/**
 * Aquibra Pro Inspector Panel
 * Professional page builder inspector with visual controls
 * Elementor-style UI with comprehensive CSS property support
 *
 * Section expansion logic is in hooks/useInspectorSections.ts
 * @license BSD-3-Clause
 */

import { ArrowLeft, Trash2 } from "lucide-react";
import { BindingPopover } from "./components/BindingPopover";
import * as React from "react";
import type { Composer } from "../../engine";
import { isValidBreakpoint } from "../../shared/constants/breakpoints";
import type { DeviceType } from "../../shared/types";
import type { BreakpointId } from "../../shared/types/breakpoints";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../shared/types/media";
import { getElementIcon } from "../../shared/ui/Icons";
import { useComposerSelection } from "../canvas/hooks/useComposerSelection";
import { BreakpointIndicator } from "./components/BreakpointIndicator";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { ElementBreadcrumb } from "./components/ElementBreadcrumb";
import { InspectorControls } from "./components/InspectorControls";
import { InspectorEmptyState } from "./components/InspectorEmptyState";
import { InspectorErrorBoundary } from "./components/InspectorErrorBoundary";
import { InspectorSubNav } from "./components/InspectorSubNav";
import { MultiSelectToolbar } from "./components/MultiSelectToolbar";
import { PseudoStateSelector } from "./components/PseudoStateSelector";
import { useInspectorState, useStyleHandlers, useInspectorSections, TOTAL_SECTIONS } from "./hooks";
import { VariantSection } from "./sections/VariantSection";
import { deriveCssContext, getPropertyStates } from "./config/cssContext";
import { DevModeToggle } from "./shared/DevModeToggle";
import { panelStyles } from "./styles";
import { LayoutTab, AppearanceTab, EffectsTab } from "./tabs";

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
  /** Opens the CMS collection setup modal (for BindingPopover create link) */
  onOpenCreateCollection?: () => void;
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
  onOpenCreateCollection,
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

  // Detect which pseudo-states have at least one overridden style
  const statesWithOverrides = React.useMemo<Set<import("../../shared/types").PseudoStateId>>(
    () => {
      if (!selectedElement?.id || !composer?.styles) return new Set();
      const pseudoStates = ["hover", "focus", "active", "disabled"] as const;
      const withOverrides = new Set<import("../../shared/types").PseudoStateId>();
      pseudoStates.forEach((state) => {
        const rule = composer.styles.getRule(`[data-aqb-id="${selectedElement.id}"]:${state}`);
        if (rule && Object.keys(rule.properties ?? {}).length > 0) {
          withOverrides.add(state);
        }
      });
      return withOverrides;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedElement?.id, composer, styles_state]
  );

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
  const [idCopied, setIdCopied] = React.useState(false);

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
      <InspectorEmptyState composer={composer} />
    );
  }

  // ============================================================================
  // RENDER: Inspector
  // ============================================================================
  return (
    <div style={panelStyles.panel}>
      {/* IS6: Visually-hidden live region — announces element selection to screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
        }}
      >
        {elementLabel} selected
      </div>
      {/* Page settings link — visible when element is selected */}
      <button
        type="button"
        onClick={() => composer?.selection?.clear()}
        aria-label="Switch to page settings"
        style={{
          background: "none",
          border: "none",
          padding: "5px 14px",
          fontSize: 11,
          color: "var(--aqb-text-muted)",
          cursor: "pointer",
          textAlign: "left",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 4,
          opacity: 0.5,
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.5"; }}
      >
        <ArrowLeft size={10} aria-hidden="true" />
        Page settings
      </button>
      {/* Header */}
      <div style={{ ...panelStyles.header, position: "relative" as const }}>
        <div style={panelStyles.elementInfo}>
          <div style={panelStyles.elementIcon}>
            <ElementIcon size="lg" />
          </div>
          <div>
            <div style={panelStyles.elementName}>{elementLabel}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`#${selectedElement.id}`);
                    setIdCopied(true);
                    setTimeout(() => setIdCopied(false), 1500);
                  } catch {
                    // clipboard API not available — silently skip
                  }
                }}
                aria-label="Copy element ID"
                title={idCopied ? "Copied!" : "Click to copy element ID"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "var(--aqb-font-mono)",
                  fontSize: "var(--aqb-text-sm)",
                  color: idCopied ? "var(--aqb-success)" : "var(--aqb-text-tertiary)",
                  transition: "color 0.2s",
                }}
              >
                #{selectedElement.id.slice(-8)}
              </button>
              {selectedElement.tagName && (
                <span style={panelStyles.tagBadge}>
                  &lt;{selectedElement.tagName.toLowerCase()}&gt;
                </span>
              )}
              {idCopied && (
                <span
                  aria-live="polite"
                  style={{
                    fontSize: 12,
                    color: "var(--aqb-success)",
                    fontWeight: 600,
                  }}
                >
                  Copied!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Binding popover — link element to CMS field (WS-14b) */}
        <BindingPopover
          elementId={selectedElement?.id ?? null}
          composer={composer ?? null}
          onOpenCreateCollection={onOpenCreateCollection}
        />

        {onDelete && (
          <button
            style={panelStyles.deleteBtn}
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete element"
            aria-label="Delete selected element"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        )}

        {/* P0 Fix: Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            onDelete?.(selectedElement.id);
            setShowDeleteConfirm(false);
          }}
          elementLabel={elementLabel}
        />

        <ElementBreadcrumb selectedElement={selectedElement} composer={composer} />
        <BreakpointIndicator currentBreakpoint={currentBreakpoint} />
        <PseudoStateSelector
          currentPseudoState={currentPseudoState}
          onChange={setCurrentPseudoState}
          statesWithOverrides={statesWithOverrides}
        />
      </div>

      {/* Inspector Controls - Search, Collapse/Expand, Dev Mode */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--aqb-space-2)",
          padding: "6px var(--aqb-space-3)",
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

      {/* Tabs - Layout / Appearance / Effects (pill segment control) */}
      <div
        style={panelStyles.tabs}
        onKeyDown={(e) => {
          const tabIds = ["layout", "appearance", "effects"] as const;
          const tabButtons = (e.currentTarget as HTMLDivElement).querySelectorAll('[role="tab"]');
          const focusedIndex = Array.from(tabButtons).indexOf(e.target as HTMLButtonElement);
          if (focusedIndex === -1) return;
          if (e.key === "ArrowRight") {
            e.preventDefault();
            const nextIndex = (focusedIndex + 1) % tabIds.length;
            setActiveTab(tabIds[nextIndex]);
            (tabButtons[nextIndex] as HTMLButtonElement)?.focus();
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            const prevIndex = (focusedIndex - 1 + tabIds.length) % tabIds.length;
            setActiveTab(tabIds[prevIndex]);
            (tabButtons[prevIndex] as HTMLButtonElement)?.focus();
          }
        }}
      >
        <div
          role="tablist"
          aria-label="Inspector sections"
          style={panelStyles.tabGroup}
        >
          {(["layout", "appearance", "effects"] as const).map((tab) => {
            const tabLabels = {
              layout: "Layout",
              appearance: "Style",
              effects: "Effects",
            };
            const tabAriaLabels = {
              layout: "Layout tab — Position, Display, Spacing, Flexbox, Grid",
              appearance: "Style tab — Typography, Background, Border",
              effects: "Effects tab — Shadows, Transforms, Animation, Interactions",
            };
            return (
              <button
                key={tab}
                role="tab"
                id={`inspector-tab-${tab}`}
                aria-selected={activeTab === tab}
                aria-controls={`inspector-tabpanel-${tab}`}
                tabIndex={activeTab === tab ? 0 : -1}
                style={panelStyles.tab(activeTab === tab)}
                onClick={() => setActiveTab(tab)}
                aria-label={tabAriaLabels[tab]}
              >
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-nav — clickable section jump links (H-02 fix) */}
      <InspectorSubNav activeTab={activeTab} contentRef={contentRef} />

      {/* Content */}
      <div
        ref={contentRef}
        role="tabpanel"
        id={`inspector-tabpanel-${activeTab}`}
        aria-labelledby={`inspector-tab-${activeTab}`}
        style={panelStyles.content}
      >
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
                onOpenMediaLibrary={onOpenMediaLibrary}
                onOpenIconPicker={onOpenIconPicker}
                devMode={devMode}
              />
              <VariantSection
                composer={composer ?? null}
                elementId={selectedElement?.id ?? null}
                isOpen={autoExpandSection === "variants"}
              />
            </>
          )}

          {activeTab === "appearance" && (
            <AppearanceTab
              composer={composer}
              selectedElement={selectedElement}
              currentPseudoState={currentPseudoState}
              styles={styles_state}
              onChange={handleStyleChange}
              onBatchChange={handleBatchStyleChange}
              onOpenMediaLibrary={onOpenMediaLibrary}
              onOpenIconPicker={onOpenIconPicker}
              autoExpandSection={autoExpandSection as "typography" | null}
              searchQuery={searchQuery}
              cssContext={contextState}
              devMode={devMode}
            />
          )}

          {activeTab === "effects" && (
            <EffectsTab
              composer={composer}
              selectedElement={selectedElement}
              currentPseudoState={currentPseudoState}
              styles={styles_state}
              onChange={handleStyleChange}
              onBatchChange={handleBatchStyleChange}
              searchQuery={searchQuery}
              onOpenMediaLibrary={onOpenMediaLibrary}
              onOpenIconPicker={onOpenIconPicker}
              devMode={devMode}
            />
          )}

        </InspectorErrorBoundary>
      </div>
    </div>
  );
};

export default ProInspector;
