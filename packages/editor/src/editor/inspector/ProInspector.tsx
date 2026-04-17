/**
 * Aquibra Pro Inspector Panel
 * Professional page builder inspector with visual controls
 * Elementor-style UI with comprehensive CSS property support
 *
 * Section expansion logic is in hooks/useInspectorSections.ts
 * @license BSD-3-Clause
 */

import { ArrowLeft } from "lucide-react";
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
import { InspectorElementMenu } from "./components/InspectorElementMenu";
import { InspectorEmptyState } from "./components/InspectorEmptyState";
import { InspectorErrorBoundary } from "./components/InspectorErrorBoundary";
import { MultiSelectToolbar } from "./components/MultiSelectToolbar";
import { PropertySearchResults } from "./components/PropertySearchResults";
import { PseudoStateSelector } from "./components/PseudoStateSelector";
import { useInspectorState, useStyleHandlers, useInspectorSections } from "./hooks";
import { useAdvancedSettings } from "./hooks/useAdvancedSettings";
import { VariantSection } from "./sections/VariantSection";
import { buildAdvancedPropsMapFromRegistry, SECTION_REGISTRY } from "./sections/registry";
import { deriveCssContext, getPropertyStates } from "./config/cssContext";
import { detectMixedValues } from "./shared/detectMixedValues";
import type { Element } from "../../engine";
import { DevModeToggle } from "./shared/DevModeToggle";
import { panelStyles } from "./styles";
import { InspectorTabContent } from "./tabs/InspectorTabContent";

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
  /** Called when the user switches breakpoint from the inspector header */
  onBreakpointChange?: (bp: BreakpointId) => void;
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
  onBreakpointChange,
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

  // Detect whether the current breakpoint has any element-specific style overrides
  const breakpointHasOverride = React.useMemo<boolean>(() => {
    if (!selectedElement?.id || !composer?.styles || currentBreakpoint === "desktop") return false;
    const bpStyles = composer.styles.getBreakpointStyle(selectedElement.id, currentBreakpoint);
    return Object.keys(bpStyles).length > 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElement?.id, composer, currentBreakpoint, styles_state]);

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
  const { expandedSections, collapseAll, expandAll, toggleSection } = useInspectorSections({
    selectedElement,
    composer,
  });

  const [searchQuery, setSearchQuery] = React.useState("");

  // Advanced-disclosure state lifted to ProInspector so the registry-driven
  // InspectorTabContent can share a single UseAdvancedSettingsReturn across
  // every section. The prop map is derived from the registry — any section
  // that declares an `advancedKey` is automatically part of the union.
  const advancedPropsMap = React.useMemo(() => buildAdvancedPropsMapFromRegistry(), []);
  const advancedState = useAdvancedSettings({
    advancedPropsMap,
    searchQuery,
    styles: styles_state,
    elementId: selectedElement?.id ?? null,
  });
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Scroll position persistence (Gap 2 fix - UX Strategy)
  const scrollPositionsRef = React.useRef<Map<string, number>>(new Map());
  const previousElementIdRef = React.useRef<string | null>(null);

  // P0 Fix: Delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [idCopied, setIdCopied] = React.useState(false);

  // Pseudo-state selector visibility — hide unless the user is actively editing
  // a non-normal state or has an existing override on this element. Users can
  // still opt in via the "+ state override" affordance. Reset per selection.
  const [stateSelectorManuallyShown, setStateSelectorManuallyShown] = React.useState(false);
  React.useEffect(() => {
    setStateSelectorManuallyShown(false);
  }, [selectedElement?.id]);

  // Global "/" shortcut: focus the inspector search. Only fires when focus is
  // not already inside an input/textarea/contentEditable so it doesn't steal
  // keystrokes from any form the user is actively typing in.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      const inTypingContext =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
      if (inTypingContext) return;
      const input = document.getElementById("inspector-search-input") as HTMLInputElement | null;
      if (!input) return;
      e.preventDefault();
      input.focus();
      input.select();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

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

  // Multi-select: resolve element instances for all selected ids
  const selectedElements = React.useMemo<readonly Element[]>(() => {
    if (!composer || selectedIds.length === 0) return [];
    return selectedIds
      .map((id) => composer.elements.getElement(id))
      .filter((el): el is Element => !!el);
  }, [composer, selectedIds]);

  // Union of every section's styleKeys — used to compute mixed-value set once
  const allStyleKeys = React.useMemo<readonly string[]>(() => {
    return Array.from(
      new Set(
        Object.values(SECTION_REGISTRY).flatMap((entry) => entry.styleKeys as string[])
      )
    );
  }, []);

  const mixedKeys = React.useMemo(
    () => detectMixedValues(selectedElements, allStyleKeys),
    [selectedElements, allStyleKeys]
  );

  // Enrich the CSS context with multi-select data before passing to sections
  const enrichedContext = React.useMemo(
    () => ({ ...contextState, selectedElements, mixedKeys }),
    [contextState, selectedElements, mixedKeys]
  );

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
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={panelStyles.elementName}>{elementLabel}</div>
            {/* Compact meta row — tag and ID live inline as a single mono-font
                line. Click copies the id. Keeps header tight on narrow panels. */}
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
                fontSize: 11,
                color: idCopied ? "var(--aqb-success)" : "var(--aqb-text-tertiary)",
                transition: "color 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 4,
                maxWidth: "100%",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {selectedElement.tagName && (
                <span style={{ opacity: 0.7 }}>
                  &lt;{selectedElement.tagName.toLowerCase()}&gt;
                </span>
              )}
              <span>#{selectedElement.id.slice(-6)}</span>
              {idCopied && (
                <span
                  aria-live="polite"
                  style={{
                    color: "var(--aqb-success)",
                    fontWeight: 600,
                  }}
                >
                  · Copied
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Binding popover — link element to CMS field (WS-14b) */}
        <BindingPopover
          elementId={selectedElement?.id ?? null}
          composer={composer ?? null}
          onOpenCreateCollection={onOpenCreateCollection}
        />

        {/* Element actions overflow menu — Duplicate / Copy styles / Paste styles / Delete.
            Replaces the standalone delete button. */}
        {onDelete && (
          <InspectorElementMenu
            composer={composer}
            selectedElementId={selectedElement.id}
            onRequestDelete={() => setShowDeleteConfirm(true)}
          />
        )}

        {/* Delete confirmation modal — still driven by the overflow menu above. */}
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
        <BreakpointIndicator
          currentBreakpoint={currentBreakpoint}
          onBreakpointChange={onBreakpointChange}
          hasOverride={breakpointHasOverride}
        />
        {currentPseudoState !== "normal" ||
        statesWithOverrides.size > 0 ||
        stateSelectorManuallyShown ? (
          <PseudoStateSelector
            currentPseudoState={currentPseudoState}
            onChange={setCurrentPseudoState}
            statesWithOverrides={statesWithOverrides}
          />
        ) : (
          <button
            type="button"
            onClick={() => setStateSelectorManuallyShown(true)}
            aria-label="Show state override selector"
            title="Add hover / focus / active styles"
            style={{
              marginTop: 6,
              padding: "4px 10px",
              background: "transparent",
              border: "1px dashed var(--aqb-border)",
              borderRadius: 6,
              color: "var(--aqb-text-tertiary)",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              width: "fit-content",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--aqb-text-primary)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--aqb-text-tertiary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--aqb-text-tertiary)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--aqb-border)";
            }}
          >
            + state override
          </button>
        )}
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
            onCollapseAll={collapseAll}
            onExpandAll={expandAll}
          />
        </div>
        <DevModeToggle enabled={devMode} onToggle={setDevMode} />
      </div>

      {/* Tabs — Style / Element / Effects (pill segment control).
          Axis changed in Phase 6 from CSS-category to concept. */}
      <div
        style={panelStyles.tabs}
        onKeyDown={(e) => {
          const tabIds = ["style", "element", "effects"] as const;
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
          {(["style", "element", "effects"] as const).map((tab) => {
            const tabLabels = {
              style: "Style",
              element: "Element",
              effects: "Effects",
            };
            const tabAriaLabels = {
              style: "Style tab — Layout, Size, Spacing, Typography, Background, Border",
              element: "Element tab — Link, CSS classes, element properties",
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

      {/* Content — single InspectorTabContent renderer replaces the three
          old per-tab components. The search overlay still pre-empts the
          tab content when a query is active. */}
      <div
        ref={contentRef}
        role="tabpanel"
        id={`inspector-tabpanel-${activeTab}`}
        aria-labelledby={`inspector-tab-${activeTab}`}
        style={panelStyles.content}
      >
        <InspectorErrorBoundary>
          {searchQuery.trim() ? (
            <PropertySearchResults
              searchQuery={searchQuery}
              styles={styles_state}
              onChange={handleStyleChange}
              advancedState={advancedState}
            />
          ) : (
            <>
              <InspectorTabContent
                tabId={activeTab}
                composer={composer}
                selectedElement={selectedElement}
                styles={styles_state}
                onChange={handleStyleChange}
                onBatchChange={handleBatchStyleChange}
                cssContext={enrichedContext}
                propertyStates={propertyStates}
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
                advancedState={advancedState}
                onOpenMediaLibrary={onOpenMediaLibrary}
                onOpenIconPicker={onOpenIconPicker}
                devMode={devMode}
              />
              {/* VariantSection lives outside the registry because its data
                  model is tied to component instances, not element types.
                  Uses the same expandedSections key format so collapseAll/expandAll
                  and user preferences all apply to it. */}
              {activeTab === "style" && selectedElement && (
                <VariantSection
                  composer={composer ?? null}
                  elementId={selectedElement.id ?? null}
                  isOpen={expandedSections.has(`${selectedElement.type}:variants`)}
                  onToggle={() => toggleSection(selectedElement.type, "variants")}
                />
              )}
            </>
          )}
        </InspectorErrorBoundary>
      </div>
    </div>
  );
};

export default ProInspector;
