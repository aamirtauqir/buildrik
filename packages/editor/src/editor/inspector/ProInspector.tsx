/**
 * ProInspector — the right-column Inspector (v4 chassis, build plan §1).
 *
 * Composition, top to bottom:
 *   header       — breadcrumb · icon + name · ✦ AI · ⋯ · ✕ · status marks
 *   status line  — why the panel is read-only (locked / save conflict)
 *   multi bar    — Align / Distribute / Group, when 2+ are selected (DD-12)
 *   tabs         — Style · Behaviour · Effects (DD-1, Q1)
 *   context row  — State / breakpoint, on Style and Effects only (R-DD-14)
 *   tab panel    — the tab's sections in their fixed order (InspectorTabContent)
 *
 * Nothing selected, or the page root selected → the Page panel (DD-13).
 * The field context (read-only, Mixed, override dots) is provided once here
 * and read by the shared controls.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer, Element } from "@/engine";
import { isValidBreakpoint, BREAKPOINTS } from "@/shared/constants/breakpoints";
import { EVENTS } from "@/shared/constants/events";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import type { DeviceType, PseudoStateId } from "@/shared/types";
import type { BreakpointId } from "@/shared/types/breakpoints";
import type { IconConfig, MediaAsset, MediaAssetType } from "@/shared/types/media";
import { Tabs } from "@/editor/chrome-ui";
import { useComposerSelection } from "../canvas/hooks/useComposerSelection";
import { useProjectLoading } from "../shell/hooks/useProjectLoading";
import { useSaveConflict } from "../shell/hooks/useSaveConflict";
import { ApplyStyleDialog } from "./components/ApplyStyleDialog";
import { ContextRow } from "./components/ContextRow";
import { InspectorErrorBoundary } from "./components/InspectorErrorBoundary";
import { InspectorHeader } from "./components/InspectorHeader";
import { InspectorLoading } from "./components/InspectorLoading";
import { MultiSelectBar } from "./components/MultiSelectBar";
import { PagePanel } from "./components/PagePanel";
import { StatusLine } from "./components/StatusLine";
import { useInspectorState, useStyleHandlers, useInspectorSections } from "./hooks";
import { useAdvancedSettings } from "./hooks/useAdvancedSettings";
import { useElementBinding } from "./hooks/useElementBinding";
import { useElementLocked } from "./hooks/useElementLocked";
import { useFieldOverrides } from "./hooks/useFieldOverrides";
import { usePropertyJump } from "./hooks/usePropertyJump";
import { buildAdvancedPropsMapFromRegistry, INSPECTOR_TABS, SECTION_REGISTRY, type TabId } from "./sections/registry";
import { computeEffectiveStyles, deriveCssContext, getPropertyStates } from "./config/cssContext";
import { computeStatesWithOverrides } from "./config/pseudoOverrides";
import { detectMixedValues, shownStylesAt } from "./shared/detectMixedValues";
import { InspectorFieldContext, type InspectorFieldContextValue } from "./shared/controls/InspectorFieldContext";
import { InspectorTabContent } from "./tabs/InspectorTabContent";
import "./styles/inspector.css";

/** Three equal 100px tabs, 32 tall, the active one accent with a 2px
 *  underline (board 1), merged over chrome-ui's pill tab via twMerge. */
const INSPECTOR_TAB_CLASS =
  "tw:flex-1 tw:h-8 tw:px-0 tw:rounded-none tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink-muted)] tw:bg-transparent " +
  "tw:border-b-2 tw:border-transparent tw:hover:bg-transparent " +
  "tw:aria-selected:font-medium tw:aria-selected:text-[var(--bk-accent-text)] " +
  "tw:aria-selected:bg-transparent tw:aria-selected:hover:bg-transparent tw:aria-selected:border-[var(--bk-accent)]";


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
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void,
    /** Board 1164:4713 — what the picker is being opened for, e.g. "Hero · Image". */
    forLabel?: string
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
  selectedElement: selectedProp,
  composer,
  currentBreakpoint: currentBreakpointProp = "desktop",
  onOpenMediaLibrary,
  onOpenIconPicker,
  onOpenCreateCollection,
}) => {
  const currentBreakpoint: BreakpointId = isValidBreakpoint(currentBreakpointProp)
    ? currentBreakpointProp
    : "desktop";

  /* The page root is the page, not an element: it gets the Page panel (DD-13). */
  const rootId = composer?.elements?.getActivePage?.()?.root.id;
  const selectedElement = selectedProp && selectedProp.id !== rootId ? selectedProp : null;

  const { currentPseudoState, setCurrentPseudoState } = useInspectorState(selectedElement);

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

  /* ⋯ "Apply style to all … on this page" asks for its confirm (DD-6b). */
  const [applyStyleFor, setApplyStyleFor] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const onRequest = (p: { elementId?: string }) => setApplyStyleFor(p?.elementId ?? null);
    composer.on(EVENTS.UI_APPLY_STYLE_REQUESTED, onRequest);
    return () => {
      composer.off(EVENTS.UI_APPLY_STYLE_REQUESTED, onRequest);
    };
  }, [composer]);

  const { selectedIds } = useComposerSelection({ composer: composer ?? null });
  const projectLoading = useProjectLoading(composer ?? null);

  /* The whole selection, primary first — a write lands on every one (DD-12). */
  const targetIds = React.useMemo<readonly string[]>(() => {
    const primary = selectedElement?.id;
    if (!primary) return [];
    return [primary, ...selectedIds.filter((id) => id !== primary && id !== rootId)];
  }, [selectedElement?.id, selectedIds, rootId]);
  const extraTargetIds = React.useMemo(() => targetIds.slice(1), [targetIds]);

  const locked = useElementLocked(composer, selectedElement?.id);
  const conflict = useSaveConflict();
  const binding = useElementBinding(composer, selectedElement?.id ?? "");

  const {
    styles: styles_state,
    handleStyleChange,
    handleBatchStyleChange,
    overriddenProperties,
  } = useStyleHandlers(selectedElement, composer, currentBreakpoint, currentPseudoState, extraTargetIds, conflict.pending);

  // Pseudo-states with overrides — breakpoint-qualified so mobile/tablet
  // pseudo rules light up at the active breakpoint (config/pseudoOverrides.ts).
  const statesWithOverrides = React.useMemo(
    () => computeStatesWithOverrides(selectedElement?.id, composer, currentBreakpoint),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedElement?.id, composer, styles_state, currentBreakpoint]
  );

  const { choices, setChoices } = useInspectorSections();

  /* The strip. A new element of the SAME type keeps the tab; a different
     type starts on Style (DD-20) — its Behaviour tab holds other things. */
  const [activeTab, setActiveTab] = React.useState<TabId>("style");
  const prevTypeRef = React.useRef(selectedElement?.type);
  React.useEffect(() => {
    if (selectedElement?.type && selectedElement.type !== prevTypeRef.current) setActiveTab("style");
    prevTypeRef.current = selectedElement?.type ?? prevTypeRef.current;
  }, [selectedElement?.type]);

  const advancedPropsMap = React.useMemo(() => buildAdvancedPropsMapFromRegistry(), []);
  const advancedState = useAdvancedSettings({
    advancedPropsMap,
    searchQuery: "",
    styles: styles_state,
    elementId: selectedElement?.id ?? null,
  });
  const contentRef = React.useRef<HTMLDivElement>(null);
  const scrollPositionsRef = React.useRef<Map<string, number>>(new Map());

  const [contextState, setContextState] = React.useState(() =>
    deriveCssContext(selectedElement, composer, styles_state, currentBreakpoint, currentPseudoState)
  );
  const propertyStates = getPropertyStates(contextState);
  overriddenProperties?.forEach((prop) => {
    if (!propertyStates[prop]) propertyStates[prop] = {};
    propertyStates[prop].isOverridden = true;
  });
  React.useEffect(() => {
    setContextState(deriveCssContext(selectedElement, composer, styles_state, currentBreakpoint, currentPseudoState));
  }, [selectedElement, composer, styles_state, currentBreakpoint, currentPseudoState]);

  const selectedElements = React.useMemo<readonly Element[]>(() => {
    if (!composer) return [];
    return targetIds.map((id) => composer.elements.getElement(id)).filter((el): el is Element => !!el);
  }, [composer, targetIds]);
  const selectedTypes = React.useMemo(() => selectedElements.map((el) => el.getType?.() ?? "custom"), [selectedElements]);

  /* The element's OWN values here — what "has a value" means for the "+"
     rows (DD-11); `styles_state` also carries type defaults and computed
     fallbacks, which would open Fill on every element. */
  const authoredStyles = React.useMemo<Record<string, string>>(() => {
    const el = selectedElement?.id ? composer?.elements?.getElement?.(selectedElement.id) : null;
    return el && composer ? computeEffectiveStyles(el, composer, currentBreakpoint, currentPseudoState) : {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElement?.id, composer, currentBreakpoint, currentPseudoState, styles_state]);

  const allStyleKeys = React.useMemo<readonly string[]>(
    () => Array.from(new Set(Object.values(SECTION_REGISTRY).flatMap((entry) => entry.styleKeys as string[]))),
    []
  );
  /* What each selected element SHOWS here, re-read after every edit (an edit
     can make the selection agree). */
  const mixedKeys = React.useMemo(
    () => detectMixedValues(selectedElements, allStyleKeys, shownStylesAt(composer, currentBreakpoint, currentPseudoState)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedElements, allStyleKeys, composer, currentBreakpoint, currentPseudoState, styles_state]
  );
  const enrichedContext = React.useMemo(
    () => ({ ...contextState, selectedElements, mixedKeys }),
    [contextState, selectedElements, mixedKeys]
  );

  /* Overrides (breakpoint, :state, master) + the context row's counts. */
  const fieldOverrides = useFieldOverrides(composer, selectedElement?.id, currentBreakpoint, currentPseudoState);
  const breakpointName = currentBreakpoint === "desktop" ? null : BREAKPOINTS[currentBreakpoint]?.name ?? currentBreakpoint;

  const readOnly = locked || conflict.pending;
  const fieldContext = React.useMemo<InspectorFieldContextValue>(
    () => ({
      readOnly,
      readOnlyReason: conflict.pending ? "conflict" : locked ? "locked" : null,
      mixedKeys,
      overrides: fieldOverrides.overrides,
      overrideLabels: fieldOverrides.labels,
      resetOverride: fieldOverrides.resetOverride,
    }),
    [readOnly, conflict.pending, locked, mixedKeys, fieldOverrides]
  );

  /* Scroll persistence per element (P-7b). The scroll listener is the only
     writer: it records the element whose body is on screen, bound in a
     LAYOUT effect so it is detached before the next element's body renders
     into the same container. A hidden column (full page: 0×0) is not a
     position. */
  React.useLayoutEffect(() => {
    const container = contentRef.current;
    if (!container || !selectedElement?.id) return;
    const id = selectedElement.id;
    const handleScroll = () => {
      if (container.clientHeight === 0) return;
      scrollPositionsRef.current.set(id, container.scrollTop);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [selectedElement?.id]);

  /* The restore: re-applied as the body grows, until it holds, the user takes
     the wheel, or a second has passed. */
  React.useEffect(() => {
    const container = contentRef.current;
    if (!selectedElement?.id || !container) return;
    const target = scrollPositionsRef.current.get(selectedElement.id) ?? 0;
    let settled = false;
    const apply = () => {
      if (settled) return;
      container.scrollTop = target;
      if (Math.abs(container.scrollTop - target) < 1) settled = true;
    };
    const settle = () => {
      settled = true;
    };
    const frame = requestAnimationFrame(apply);
    const ro = new ResizeObserver(apply);
    const body = container.firstElementChild;
    if (body) ro.observe(body);
    const lapse = setTimeout(settle, 1000);
    container.addEventListener("wheel", settle, { passive: true });
    container.addEventListener("pointerdown", settle);
    container.addEventListener("keydown", settle);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      clearTimeout(lapse);
      container.removeEventListener("wheel", settle);
      container.removeEventListener("pointerdown", settle);
      container.removeEventListener("keydown", settle);
    };
  }, [selectedElement?.id]);

  /* G2-146 — ⌘K "Jump to property" rows + the reveal behind them, the canvas
     menu's "Add interaction" and the header's binding chip. */
  usePropertyJump({
    composer,
    selectedType: selectedElement?.type ?? null,
    contentRef,
    setActiveTab,
    openSection: (type, section) => setChoices(type, [section], "open"),
    advancedState,
  });

  /* Board 159:102 — while the site is still arriving there is nothing to
     select; an empty canvas message would read as "your site is empty". */
  if (projectLoading && !selectedElement) return <InspectorLoading />;
  if (!selectedElement) return <PagePanel composer={composer} />;

  const showContextRow = activeTab !== "behaviour";

  return (
    <InspectorFieldContext.Provider value={fieldContext}>
      <div className="bdi-panel" data-testid="inspector-panel" data-readonly={readOnly || undefined}>
        <ApplyStyleDialog
          composer={composer}
          elementId={applyStyleFor}
          breakpoint={currentBreakpoint}
          pseudo={currentPseudoState}
          onClose={() => setApplyStyleFor(null)}
        />
        {/* Live region for the selection announcement. */}
        <div role="status" aria-live="polite" aria-atomic="true" className="bdi-sr-only">
          {elementTypeLabel(selectedElement.type)} selected
        </div>
        <InspectorHeader composer={composer} element={selectedElement} selectedIds={targetIds} binding={binding} locked={locked} />
        <StatusLine composer={composer} elementId={selectedElement.id} locked={locked} conflict={conflict} />
        {targetIds.length > 1 ? <MultiSelectBar composer={composer} selectedIds={targetIds} /> : null}
        {agentRun.running ? (
          /* AI agent takeover (board 160:512) — the run replaces the
             controls; the selection is kept and restored when it ends. */
          <div role="status" aria-live="polite" className="tw:flex tw:flex-col tw:gap-2 tw:px-4 tw:py-5" data-testid="inspector-ai-run">
            <div className="tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">AI</div>
            <div className="tw:text-[13px] tw:text-[var(--bk-ink)]">{agentRun.summary || "Working…"}</div>
            <div className="tw:text-[12px] tw:text-[var(--bk-ink-muted)]">Your selection is kept and restored when you go back.</div>
          </div>
        ) : (
          <>
            <Tabs
              tabs={INSPECTOR_TABS}
              value={activeTab}
              onChange={(id) => setActiveTab(id as TabId)}
              label="Inspector tabs"
              data-testid="inspector-tab-strip"
              className="tw:h-8 tw:p-0 tw:gap-0"
              tabClassName={INSPECTOR_TAB_CLASS}
            />
            {showContextRow ? (
              <ContextRow
                state={currentPseudoState}
                onStateChange={(s: PseudoStateId) => setCurrentPseudoState(s)}
                statesWithOverrides={statesWithOverrides}
                stateOverrideCount={fieldOverrides.counts.pseudo}
                onResetState={fieldOverrides.resetPseudo}
                breakpointName={breakpointName}
                breakpointOverrideCount={fieldOverrides.counts.breakpoint}
                onRevertBreakpoint={fieldOverrides.revertBreakpoint}
              />
            ) : null}
            <div
              ref={contentRef}
              className="bdi-panel-scroll"
              role="tabpanel"
              aria-label={`${INSPECTOR_TABS.find((t) => t.id === activeTab)?.label ?? ""} properties`}
            >
              <div className="bdi-body">
                <InspectorErrorBoundary>
                  <InspectorTabContent
                    tabId={activeTab}
                    composer={composer}
                    selectedElement={selectedElement}
                    selectedIds={targetIds}
                    selectedTypes={selectedTypes}
                    styles={styles_state}
                    authoredStyles={authoredStyles}
                    onChange={handleStyleChange}
                    onBatchChange={handleBatchStyleChange}
                    cssContext={enrichedContext}
                    propertyStates={propertyStates}
                    choices={choices}
                    onSetChoices={setChoices}
                    advancedState={advancedState}
                    onOpenMediaLibrary={onOpenMediaLibrary}
                    onOpenIconPicker={onOpenIconPicker}
                    onOpenCreateCollection={onOpenCreateCollection}
                  />
                </InspectorErrorBoundary>
              </div>
            </div>
          </>
        )}
      </div>
    </InspectorFieldContext.Provider>
  );
};

export default ProInspector;
