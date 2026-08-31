/**
 * Aquibra Pro Inspector Panel
 * Redesign: ported to .bdi-* namespace per /design-system/preview/comp-inspector.v1.html
 * Tokens: --bd-* only
 *
 * @license BSD-3-Clause
 */

import { Crosshair, CornerLeftUp, Link } from "lucide-react";
import * as React from "react";
import { getElementIcon } from "@/editor/shared/elementIcons";
import { BindingBanner, useElementBinding } from "./components/BindingBanner";
import { BindingPopover } from "./components/BindingPopover";
import { BreakpointPill } from "./components/BreakpointPill";
import { ScopeDropdown } from "./components/ScopeDropdown";
import { DetachInstanceButton } from "@/editor/components-catalog/ui/DetachInstanceButton";
import { StateDropdown, pseudoStateLabel } from "./components/StateDropdown";
import { USE_DEV_MODE } from "./renderer/featureFlags";
import type { Composer } from "../../engine";
import { isValidBreakpoint } from "../../shared/constants/breakpoints";
import { getEditorViewMode } from "../../shared/utils/editorViewMode";
import type { DeviceType, PseudoStateId } from "../../shared/types";
import type { BreakpointId } from "../../shared/types/breakpoints";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../shared/types/media";
import { useComposerSelection } from "../canvas/hooks/useComposerSelection";
import { useProjectLoading } from "../shell/hooks/useProjectLoading";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { InspectorElementMenu } from "./components/InspectorElementMenu";
import { InspectorEmptyState } from "./components/InspectorEmptyState";
import { InspectorLoading } from "./components/InspectorLoading";
import { BreakpointOverrides, useBreakpointOverrides } from "./components/BreakpointOverrides";
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
import { Button } from "@/editor/chrome-ui";
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
  const devMode = USE_DEV_MODE;

  // Board 189:2 — "Whole site" scope shows the site-wide banner instead of
  // per-element controls (site styles live in the Brand panel).
  const [wholeSite, setWholeSite] = React.useState(false);
  /* Board 160:412 draws a reach beyond this element as a STATE the panel is
     in — a banner reading "Editing all 12 buttons — All like this" that stays
     up while you work. It used to be a one-shot: picking "All like this"
     copied every style off this element onto its peers and closed, which is a
     different and much larger thing than the banner describes. A peer that had
     its own padding, its own colour, its own size lost all three to an action
     whose only warning was a count.

     Now it is the mode the board draws: the edits you make from here go to the
     peers as you make them, and nothing else about them is touched. */
  const [reachAll, setReachAll] = React.useState(false);
  React.useEffect(() => {
    setWholeSite(false); // scope resets with the selection
    setReachAll(false);
  }, [selectedElement?.id]);

  /* The peers the mode reaches, recomputed off the live element set. Same
     filter ScopeDropdown counts with — one definition, so the banner's number
     and the elements actually written can never disagree. */
  const reachPeerIds = React.useMemo(() => {
    if (!reachAll || !selectedElement?.id) return [];
    try {
      return (composer?.elements?.getAllElements?.() ?? [])
        .filter(
          (e) => e.getType?.() === selectedElement.type && e.getId?.() !== selectedElement.id
        )
        .map((e) => e.getId?.())
        .filter((id): id is string => Boolean(id));
    } catch {
      return [];
    }
  }, [reachAll, composer, selectedElement?.id, selectedElement?.type]);

  // Board 160:512 — while the AI agent runs, the inspector hands over to a
  // status card; selection is kept and restored on return.
  const [agentRun, setAgentRun] = React.useState<{ running: boolean; summary: string }>({
    running: false,
    summary: "",
  });
  React.useEffect(() => {
    if (!composer) return;
    const onRun = (p: { running?: boolean; summary?: string }) =>
      setAgentRun({ running: Boolean(p?.running), summary: p?.summary ?? "" });
    composer.on("ai:agent-run", onRun);
    return () => {
      composer.off("ai:agent-run", onRun);
    };
  }, [composer]);

  const {
    styles: styles_state,
    handleStyleChange,
    handleBatchStyleChange,
    overriddenProperties,
  } = useStyleHandlers(
    selectedElement,
    composer,
    currentBreakpoint,
    currentPseudoState,
    reachPeerIds
  );

  // Breakpoint override indicator — same reading the strip below the scope row
  // shows, from the same subscription, so the dot and the list can never
  // disagree about whether this breakpoint changes anything.
  const breakpointOverrides = useBreakpointOverrides(
    composer,
    selectedElement?.id,
    currentBreakpoint
  );
  const breakpointHasOverride = breakpointOverrides.length > 0;

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
    styles: styles_state,
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
  const projectLoading = useProjectLoading(composer ?? null);
  const boundLabel = useElementBinding(composer, selectedElement?.id ?? "");

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

  /* Board 159:102 — while the site is still arriving there is nothing to
     select, and "Select something on the canvas to edit it." over an empty
     canvas reads as "your site is empty". */
  if (projectLoading && !selectedElement) {
    return <InspectorLoading />;
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
          {/* Figma 920:4546 `btn/ai` — THE AI entry point. The rail omits `ai`
              deliberately (tabsConfig RAIL_FIGMA); the 2026-08-05 Figma arc put
              this chip on every inspector header instead, and it never shipped:
              the conformance harness had no recipe for it, so nothing went red. */}
          <Button
            type="button"
            className="tw:h-[22px] tw:px-[7px] tw:rounded-[6px] tw:bg-[var(--bk-accent-tint)] tw:text-[11px] tw:font-medium tw:text-[var(--bk-accent)] tw:whitespace-nowrap"
            title="Ask AI about this element"
            aria-label="Ask AI about this element"
            data-testid="inspector-ai-chip"
            onClick={() => composer?.emit("ui:switch-tab", { tab: "ai" })}
          >
            ✦ AI
          </Button>
          <BindingPopover
            elementId={selectedElement?.id ?? null}
            composer={composer ?? null}
            onOpenCreateCollection={onOpenCreateCollection}
          />
          {/* Board 160:105 — the header carries the fact, not just the way in.
              A bound element used to be indistinguishable from a loose one
              until someone opened the link popover. */}
          {boundLabel && (
            <span
              className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-[6px] tw:border tw:border-[var(--bk-accent)] tw:px-[6px] tw:py-[2px] tw:text-[11px] tw:text-[var(--bk-accent)]"
              title={`Bound to ${boundLabel}`}
              data-testid="inspector-bound-chip"
            >
              <Link size={10} aria-hidden="true" /> Bound
            </span>
          )}
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
        <ScopeDropdown
          composer={composer}
          selectedElement={{ id: selectedElement.id, type: selectedElement.type }}
          reachAll={reachAll}
          onReachAllChange={setReachAll}
          onWholeSite={() => setWholeSite(true)}
        />
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
      {/* Every banner below annotates THE CONTROLS BELOW IT — which scope a
          write lands on, which breakpoint it overrides, which instance it
          follows. The two takeovers (whole-site, and an AI run) replace those
          controls entirely, so a banner that outlives them describes nothing
          and contradicts the takeover: measured 2026-08-31 with reach set to
          "All like this", the panel showed "Editing all 4 paragraphs — All
          like this" directly above "Editing the whole site — every page",
          with zero controls between them. A banner does not outlive its
          controls. */}
      {!wholeSite && !agentRun.running && (
        <>
        {/* Board 160:412's banner: "Editing all 12 buttons — All like this", one
            line, no exit control of its own. It counts the peers PLUS this
            element, because that is what "all" means to the person reading it,
            and it stays up for as long as the mode is on. The way out is the
            same pill that turned it on — which now reads "All like this", so the
            banner and the control agree about where you are. */}
        {reachAll && (
          <p
            className="tw:m-0 tw:border-l-2 tw:border-[var(--bk-warning)] tw:bg-[var(--bk-warning-tint)] tw:px-3 tw:py-1.5 tw:text-[12px] tw:text-[var(--bk-warning-text)]"
            role="status"
            data-testid="reach-all-banner"
          >
            Editing all {reachPeerIds.length + 1} {selectedElement.type}
            {reachPeerIds.length === 0 ? "" : "s"} — All like this
          </p>
        )}
        {/* Board 160:105 — a bound element says what it follows, above the
            controls that no longer decide anything. */}
        <BindingBanner
          composer={composer}
          elementId={selectedElement.id}
          elementLabel={elementLabel}
        />
        {/* Board 160:2 — an instance says so above its styles, not in a
            collapsed section under Animation. */}
        <VariantSection composer={composer ?? null} elementId={selectedElement.id ?? null} />
        {/* Board 160:313 — a picked state is a different layer, and every write
            from here lands on it rather than on Base. The dropdown alone said
            which state was picked, not that the panel below it had changed
            meaning. */}
        {currentPseudoState !== "normal" && (
          <p
            className="tw:m-0 tw:bg-[var(--bk-accent-tint)] tw:px-3 tw:py-1.5 tw:text-[12px] tw:text-[var(--bk-accent)]"
            data-testid="pseudo-state-banner"
          >
            Editing {pseudoStateLabel(currentPseudoState)} — not Base
          </p>
        )}
        {/* Board 160:208 — what this breakpoint changes, and the way back. */}
        <BreakpointOverrides
          composer={composer}
          elementId={selectedElement.id}
          breakpoint={currentBreakpoint}
        />
        </>
      )}
      {/* AI agent takeover (board 160:512) — the run replaces the controls;
          the selection is kept and restored when the run ends. */}
      {agentRun.running ? (
        <div role="status" aria-live="polite" style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 8 }} data-testid="inspector-ai-run">
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bk-ink)" }}>AI</div>
          <div style={{ fontSize: 13, color: "var(--bk-ink)" }}>{agentRun.summary || "Working…"}</div>
          <div style={{ fontSize: 12, color: "var(--bk-ink-muted)" }}>
            Your selection is kept and restored when you go back.
          </div>
        </div>
      ) : wholeSite ? (
        /* Whole-site scope (board 189:2) — per-element controls step aside;
           site-wide styles live in the Brand panel. */
        <div style={{ padding: "16px" }} data-testid="inspector-whole-site">
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bk-ink)", marginBottom: 6 }}>
            Editing the whole site — every page
          </div>
          <div style={{ fontSize: 12, color: "var(--bk-ink-muted)", lineHeight: 1.5, marginBottom: 12 }}>
            Site-wide colours, fonts and spacing live in the Brand panel — change them once,
            everywhere updates.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="xs" onClick={() => composer?.emit("ui:switch-tab", { tab: "design" })}>
              Open Brand
            </Button>
            <Button color="light" size="xs" onClick={() => setWholeSite(false)} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]">
              Back to this element
            </Button>
          </div>
        </div>
      ) : (
      <div
        ref={contentRef}
        className="bdi-panel-scroll"
        role="region"
        aria-label="Element properties"
      >
        <div className="bdi-body">
          <InspectorErrorBoundary>
            <InspectorTabContent
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

          </InspectorErrorBoundary>
        </div>
      </div>
      )}
    </div>
  );
};

export default ProInspector;
