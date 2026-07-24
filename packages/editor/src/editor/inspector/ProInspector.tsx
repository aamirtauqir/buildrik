import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * Aquibra Pro Inspector Panel
 * Redesign: ported to .bdi-* namespace per /design-system/preview/comp-inspector.v1.html
 * Tokens: --bd-* only
 *
 * @license BSD-3-Clause
 */

import { Crosshair, CornerLeftUp } from "lucide-react";
import * as React from "react";
import { BindingPopover } from "./components/BindingPopover";
import { BreakpointPill } from "./components/BreakpointPill";
import { ScopeDropdown } from "./components/ScopeDropdown";
import { DetachInstanceButton } from "@/editor/components-catalog/ui/DetachInstanceButton";
import { StateDropdown } from "./components/StateDropdown";
import type { Composer } from "../../engine";
import { isValidBreakpoint } from "../../shared/constants/breakpoints";
import { getEditorViewMode } from "../../shared/utils/editorViewMode";
import type { DeviceType, PseudoStateId } from "../../shared/types";
import type { BreakpointId } from "../../shared/types/breakpoints";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../shared/types/media";
import { getElementIcon } from "../../shared/ui/Icons";
import { useComposerSelection } from "../canvas/hooks/useComposerSelection";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { InspectorElementMenu } from "./components/InspectorElementMenu";
import { InspectorEmptyState } from "./components/InspectorEmptyState";
import { InspectorErrorBoundary } from "./components/InspectorErrorBoundary";
import { MultiSelectToolbar } from "./components/MultiSelectToolbar";
import { useInspectorState, useStyleHandlers, useInspectorSections } from "./hooks";
import { usePickModeReset } from "./hooks/usePickModeReset";
import { useAdvancedSettings } from "./hooks/useAdvancedSettings";
import { VariantSection } from "./sections/VariantSection";
import { buildAdvancedPropsMapFromRegistry, SECTION_REGISTRY } from "./sections/registry";
import { deriveCssContext, getPropertyStates } from "./config/cssContext";
import { computeStatesWithOverrides } from "./config/pseudoOverrides";
import { detectMixedValues } from "./shared/detectMixedValues";
import type { Element } from "../../engine";
import { InspectorTabContent } from "./tabs/InspectorTabContent";
import "./styles/inspector.css";

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
  const currentBreakpoint: BreakpointId = isValidBreakpoint(currentBreakpointProp)
    ? currentBreakpointProp
    : "desktop";

  const {
    currentPseudoState,
    setCurrentPseudoState,
  } = useInspectorState(selectedElement);
  const devMode = false;

  const {
    styles: styles_state,
    handleStyleChange,
    handleBatchStyleChange,
    overriddenProperties,
  } = useStyleHandlers(selectedElement, composer, currentBreakpoint, currentPseudoState);

  // Breakpoint override indicator
  const breakpointHasOverride = React.useMemo<boolean>(() => {
    if (!selectedElement?.id || !composer?.styles || currentBreakpoint === "desktop") return false;
    const bpStyles = composer.styles.getBreakpointStyle(selectedElement.id, currentBreakpoint);
    return Object.keys(bpStyles).length > 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElement?.id, composer, currentBreakpoint, styles_state]);

  // Pseudo-states with overrides — breakpoint-qualified so mobile/tablet
  // pseudo rules light up the indicator pills at the active zoom level.
  // Logic extracted for testability; see config/pseudoOverrides.ts.
  const statesWithOverrides = React.useMemo<Set<PseudoStateId>>(
    () => computeStatesWithOverrides(selectedElement?.id, composer, currentBreakpoint),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedElement?.id, composer, styles_state, currentBreakpoint]
  );

  const { expandedSections, toggleSection } = useInspectorSections({
    selectedElement,
    composer,
  });

  // E3 per-user density (acceptance #4) — from the shared editor view-mode SSOT.
  const inspectorDensity = React.useMemo(() => getEditorViewMode().density, []);

  const advancedPropsMap = React.useMemo(() => buildAdvancedPropsMapFromRegistry(), []);
  const advancedState = useAdvancedSettings({
    advancedPropsMap,
    searchQuery: "",
    styles: styles_state,
    elementId: selectedElement?.id ?? null,
  });
  const contentRef = React.useRef<HTMLDivElement>(null);

  const scrollPositionsRef = React.useRef<Map<string, number>>(new Map());
  const previousElementIdRef = React.useRef<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [pickActive, setPickActive] = React.useState(false);

  // Canvas signals pick completion/cancellation — clear pickActive so the
  // header button leaves its pressed state without another click.
  usePickModeReset(composer, setPickActive);

  const { selectedIds, isMultiSelect } = useComposerSelection({ composer: composer ?? null });

  const [contextState, setContextState] = React.useState(() =>
    deriveCssContext(selectedElement, composer, devMode, styles_state, currentBreakpoint, currentPseudoState)
  );
  const propertyStates = getPropertyStates(contextState);

  if (overriddenProperties) {
    overriddenProperties.forEach((prop) => {
      if (!propertyStates[prop]) propertyStates[prop] = {};
      propertyStates[prop].isOverridden = true;
    });
  }

  React.useEffect(() => {
    setContextState(deriveCssContext(selectedElement, composer, devMode, styles_state, currentBreakpoint, currentPseudoState));
  }, [selectedElement, composer, styles_state, devMode, currentBreakpoint, currentPseudoState]);

  const selectedElements = React.useMemo<readonly Element[]>(() => {
    if (!composer || selectedIds.length === 0) return [];
    return selectedIds
      .map((id) => composer.elements.getElement(id))
      .filter((el): el is Element => !!el);
  }, [composer, selectedIds]);

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

  const enrichedContext = React.useMemo(
    () => ({ ...contextState, selectedElements, mixedKeys }),
    [contextState, selectedElements, mixedKeys]
  );

  // Scroll persistence per element
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

  const ElementIcon = selectedElement
    ? getElementIcon(selectedElement.type)
    : getElementIcon("default");
  const elementLabel = selectedElement?.type
    ? selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)
    : "Element";

  // Multi-select short-circuit
  const hasMultipleSelected = selectedIds.length > 1 || isMultiSelect;
  if (hasMultipleSelected) {
    return (
      <div className="bdi-panel">
        <MultiSelectToolbar
          selectedIds={selectedIds}
          composer={composer ?? null}
          currentBreakpoint={currentBreakpoint}
          currentPseudoState={currentPseudoState}
        />
      </div>
    );
  }

  if (!selectedElement) {
    return <InspectorEmptyState composer={composer} />;
  }

  // Parent lookup drives the header's "select parent" affordance.
  const selectedInstance = composer?.elements?.getElement(selectedElement.id) ?? null;

  return (
    <div className="bdi-panel">
      {/* Live region for selection announcement */}
      <div role="status" aria-live="polite" aria-atomic="true" className="bdi-sr-only">
        {elementLabel} selected
      </div>
      {/* Figma 32-2 header — clean `[icon] <Element>  ⋯`. The verbose "YOU ARE
          EDITING / this container" banner and the tag.class DOM breadcrumb were
          dropped from the primary view; pick-element + select-parent stay as
          compact icons, binding + the ⋯ menu on the right. */}
      <div className="bdi-ehdr">
        <div className="bdi-eic" aria-hidden="true">
          <ElementIcon size="sm" />
        </div>
        <div className="bdi-ename">
          <div className="bdi-n">{elementLabel}</div>
        </div>
        <div className="bdi-eact">
          <Button
            type="button"
            className={`bdi-icon-btn${pickActive ? " on" : ""}`}
            title="Pick element on canvas"
            aria-label="Pick element on canvas"
            aria-pressed={pickActive}
            onClick={() => {
              const next = !pickActive;
              setPickActive(next);
              composer?.emit(next ? "inspector:pick-start" : "inspector:pick-cancel");
            }}
          >
            <Crosshair size={12} aria-hidden="true" />
          </Button>
          <Button
            type="button"
            className="bdi-icon-btn"
            title="Select parent"
            aria-label="Select parent element"
            disabled={!selectedInstance?.getParent()}
            onClick={() => composer?.selection.selectParent()}
          >
            <CornerLeftUp size={12} aria-hidden="true" />
          </Button>
          <BindingPopover
            elementId={selectedElement?.id ?? null}
            composer={composer ?? null}
            onOpenCreateCollection={onOpenCreateCollection}
          />
          {onDelete && (
            <InspectorElementMenu
              composer={composer}
              selectedElementId={selectedElement.id}
              onRequestDelete={() => setShowDeleteConfirm(true)}
            />
          )}
        </div>
        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            onDelete?.(selectedElement.id);
            setShowDeleteConfirm(false);
          }}
          elementLabel={elementLabel}
        />
      </div>
      {/* Figma 32-2 pill row: `This ▾ · Desktop ▾ · Base ▾` (scope · breakpoint ·
          state), three compact dropdowns on one line. S3.9: no tab strip — the
          body below is one flat scrolling column ordered per element profile. */}
      <div className="bdi-bpr">
        <ScopeDropdown composer={composer} selectedElement={{ id: selectedElement.id, type: selectedElement.type }} />
        <BreakpointPill
          current={currentBreakpoint}
          onChange={onBreakpointChange}
          hasOverride={breakpointHasOverride}
        />
        <StateDropdown
          current={currentPseudoState}
          onChange={setCurrentPseudoState}
          withOverrides={statesWithOverrides}
        />
        {/* S6: detach catalog/user-saved instance — pro-mode only, hides
            itself when selectedElement is not an instance. Self-gated. */}
        <DetachInstanceButton
          composer={composer ?? null}
          selectedElementId={selectedElement?.id}
        />
      </div>
      {/* Scrollable body */}
      <div
        ref={contentRef}
        className="bdi-panel-scroll"
        role="region"
        aria-label="Element properties"
      >
        <div className="bdi-body">
          <InspectorErrorBoundary>
            <InspectorTabContent
              flat
              tabId="style"
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
              density={inspectorDensity}
            />
            {selectedElement && (
              <VariantSection
                composer={composer ?? null}
                elementId={selectedElement.id ?? null}
                isOpen={expandedSections.has(`${selectedElement.type}:variants`)}
                onToggle={() => toggleSection(selectedElement.type, "variants")}
              />
            )}
          </InspectorErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default ProInspector;
