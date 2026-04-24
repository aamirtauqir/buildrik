/**
 * Aquibra Pro Inspector Panel
 * Redesign: ported to .bdi-* namespace per /design-system/preview/comp-inspector.v1.html
 * Tokens: --bd-* only
 *
 * @license BSD-3-Clause
 */

import { ChevronDown, Lock, Monitor, Tablet, Smartphone } from "lucide-react";
import * as React from "react";
import { BindingPopover } from "./components/BindingPopover";
import type { Composer } from "../../engine";
import { BREAKPOINTS, BREAKPOINT_ORDER, isValidBreakpoint } from "../../shared/constants/breakpoints";
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
import { useAdvancedSettings } from "./hooks/useAdvancedSettings";
import { VariantSection } from "./sections/VariantSection";
import { buildAdvancedPropsMapFromRegistry, SECTION_REGISTRY } from "./sections/registry";
import { deriveCssContext, getPropertyStates } from "./config/cssContext";
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
// INLINE BPR — breakpoint chooser (left) + pseudo-state pills (right)
// ============================================================================

const BP_ICONS: Record<BreakpointId, React.ReactNode> = {
  desktop: <Monitor size={11} aria-hidden="true" />,
  tablet: <Tablet size={11} aria-hidden="true" />,
  mobile: <Smartphone size={11} aria-hidden="true" />,
};

const PSEUDO_LABELS: Record<PseudoStateId, string> = {
  normal: "Base",
  hover: ":hover",
  focus: ":focus",
  active: ":active",
  disabled: ":disabled",
};

const BreakpointPill: React.FC<{
  current: BreakpointId;
  onChange?: (bp: BreakpointId) => void;
  hasOverride?: boolean;
}> = ({ current, onChange, hasOverride }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const meta = BREAKPOINTS[current];

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className="bdi-bpr-pill"
        onClick={() => onChange && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Breakpoint: ${meta.name}`}
        style={{
          border: "none",
          cursor: onChange ? "pointer" : "default",
        }}
      >
        {BP_ICONS[current]}
        <span>
          {meta.name}
          {meta.maxWidth !== undefined ? ` · ≤${meta.maxWidth}` : " · 1200+"}
        </span>
        {hasOverride && (
          <span
            aria-hidden="true"
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--bd-accent)",
            }}
          />
        )}
        {onChange && <ChevronDown size={10} aria-hidden="true" style={{ opacity: 0.7 }} />}
      </button>
      {open && onChange && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 200,
            background: "#fff",
            border: "1px solid var(--bd-border)",
            borderRadius: 6,
            padding: 4,
            minWidth: 160,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
          }}
        >
          {BREAKPOINT_ORDER.map((bp) => {
            const bpMeta = BREAKPOINTS[bp];
            const active = bp === current;
            return (
              <button
                key={bp}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setOpen(false);
                  if (bp !== current) onChange(bp);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "5px 8px",
                  background: active ? "var(--bd-accent-tint)" : "transparent",
                  border: "none",
                  borderRadius: 4,
                  color: active ? "var(--bd-accent)" : "var(--bd-fg-primary)",
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--bd-font)",
                }}
              >
                {BP_ICONS[bp]}
                <span style={{ flex: 1 }}>{bpMeta.name}</span>
                {bpMeta.maxWidth !== undefined && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--bd-fg-muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ≤{bpMeta.maxWidth}px
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const StatePills: React.FC<{
  current: PseudoStateId;
  onChange: (s: PseudoStateId) => void;
  withOverrides: Set<PseudoStateId>;
  visibleStates: readonly PseudoStateId[];
}> = ({ current, onChange, withOverrides, visibleStates }) => (
  <div className="bdi-states" role="group" aria-label="Element state selector">
    {visibleStates.map((s) => (
      <button
        key={s}
        type="button"
        className={`bdi-state-pill${current === s ? " on" : ""}${withOverrides.has(s) ? " has-override" : ""}`}
        onClick={() => onChange(s)}
        aria-pressed={current === s}
        title={s === "normal" ? "Base styles" : `Styles for :${s}`}
      >
        {PSEUDO_LABELS[s]}
      </button>
    ))}
  </div>
);

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
    activeTab,
    currentPseudoState,
    setActiveTab,
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

  // Pseudo-states with overrides
  const statesWithOverrides = React.useMemo<Set<PseudoStateId>>(
    () => {
      if (!selectedElement?.id || !composer?.styles) return new Set();
      const pseudoStates = ["hover", "focus", "active", "disabled"] as const;
      const withOverrides = new Set<PseudoStateId>();
      pseudoStates.forEach((state) => {
        const rule = composer.styles.getRule(`[data-buildrick-id="${selectedElement.id}"]:${state}`);
        if (rule && Object.keys(rule.properties ?? {}).length > 0) {
          withOverrides.add(state);
        }
      });
      return withOverrides;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedElement?.id, composer, styles_state]
  );

  const { expandedSections, toggleSection } = useInspectorSections({
    selectedElement,
    composer,
  });

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
  const [idCopied, setIdCopied] = React.useState(false);

  // Show pseudo-state pills only when non-normal / overrides exist / user opts in
  const [stateSelectorManuallyShown, setStateSelectorManuallyShown] = React.useState(false);
  React.useEffect(() => {
    setStateSelectorManuallyShown(false);
  }, [selectedElement?.id]);


  const { selectedIds, isMultiSelect } = useComposerSelection({ composer: composer ?? null });

  const [contextState, setContextState] = React.useState(() =>
    deriveCssContext(selectedElement, composer, devMode)
  );
  const propertyStates = getPropertyStates(contextState);

  if (overriddenProperties) {
    overriddenProperties.forEach((prop) => {
      if (!propertyStates[prop]) propertyStates[prop] = {};
      propertyStates[prop].isOverridden = true;
    });
  }

  React.useEffect(() => {
    setContextState(deriveCssContext(selectedElement, composer, devMode));
  }, [selectedElement, composer, styles_state, devMode]);

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
        <MultiSelectToolbar selectedIds={selectedIds} composer={composer ?? null} />
      </div>
    );
  }

  if (!selectedElement) {
    return <InspectorEmptyState composer={composer} />;
  }

  const showStatePills =
    currentPseudoState !== "normal" ||
    statesWithOverrides.size > 0 ||
    stateSelectorManuallyShown;

  const visibleStates: readonly PseudoStateId[] = showStatePills
    ? (["normal", "hover", "focus", "active", "disabled"] as const)
    : (["normal"] as const);

  return (
    <div className="bdi-panel">
      {/* Live region for selection announcement */}
      <div role="status" aria-live="polite" aria-atomic="true" className="bdi-sr-only">
        {elementLabel} selected
      </div>

      {/* Header — element identity strip */}
      <div className="bdi-h">
        <div className="bdi-el">
          <span className="bdi-el-ic">
            <ElementIcon size="sm" />
          </span>
          <span className="bdi-el-name">{elementLabel}</span>
          <button
            type="button"
            className="bdi-tag"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`#${selectedElement.id}`);
                setIdCopied(true);
                setTimeout(() => setIdCopied(false), 1500);
              } catch {
                /* clipboard API unavailable */
              }
            }}
            aria-label="Copy element ID"
            title={idCopied ? "Copied!" : "Click to copy element ID"}
            style={{ cursor: "pointer" }}
          >
            {selectedElement.tagName
              ? `${selectedElement.tagName.toLowerCase()} · #${selectedElement.id.slice(-6)}`
              : `#${selectedElement.id.slice(-6)}`}
            {idCopied && " ✓"}
          </button>
        </div>

        {/* Binding popover — link element to CMS field */}
        <BindingPopover
          elementId={selectedElement?.id ?? null}
          composer={composer ?? null}
          onOpenCreateCollection={onOpenCreateCollection}
        />

        {/* Lock placeholder (future) */}
        <button className="bdi-mini" title="Lock element" aria-label="Lock element" type="button">
          <Lock size={12} aria-hidden="true" />
        </button>

        {/* Overflow menu */}
        {onDelete && (
          <InspectorElementMenu
            composer={composer}
            selectedElementId={selectedElement.id}
            onRequestDelete={() => setShowDeleteConfirm(true)}
          />
        )}

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

      {/* Tabs */}
      <div
        className="bdi-tabs"
        role="tablist"
        aria-label="Inspector sections"
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
        {(["style", "element", "effects"] as const).map((tab) => {
          const tabLabels = { style: "Style", element: "Element", effects: "Effects" };
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
              className={`bdi-tab${activeTab === tab ? " on" : ""}`}
              onClick={() => setActiveTab(tab)}
              aria-label={tabAriaLabels[tab]}
              type="button"
            >
              {tabLabels[tab]}
            </button>
          );
        })}
      </div>

      {/* Breakpoint + state ribbon */}
      <div className="bdi-bpr">
        <span>Editing</span>
        <BreakpointPill
          current={currentBreakpoint}
          onChange={onBreakpointChange}
          hasOverride={breakpointHasOverride}
        />
        <span className="bdi-bpr-spacer" />
        {showStatePills ? (
          <StatePills
            current={currentPseudoState}
            onChange={setCurrentPseudoState}
            withOverrides={statesWithOverrides}
            visibleStates={visibleStates}
          />
        ) : (
          <button
            type="button"
            onClick={() => setStateSelectorManuallyShown(true)}
            aria-label="Show state override selector"
            title="Add hover / focus / active styles"
            style={{
              padding: "2px 6px",
              background: "transparent",
              border: "1px dashed var(--bd-border)",
              borderRadius: 3,
              color: "var(--bd-fg-muted)",
              fontSize: 10,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--bd-font)",
            }}
          >
            + state
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div
        ref={contentRef}
        className="bdi-panel-scroll"
        role="tabpanel"
        id={`inspector-tabpanel-${activeTab}`}
        aria-labelledby={`inspector-tab-${activeTab}`}
      >
        <div className="bdi-body">
          <InspectorErrorBoundary>
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
            {activeTab === "style" && selectedElement && (
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
