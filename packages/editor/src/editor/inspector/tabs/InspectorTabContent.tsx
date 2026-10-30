/**
 * InspectorTabContent — renders one tab's sections (Inspector v4).
 *
 * WHERE: the tab's one order (`config/sectionOrder.ts`, define → shape →
 * paint), the same for every element type.
 * WHETHER: every entry's `capability` against the selected type's
 * capabilities — for a multi-selection, against EVERY selected type (the
 * intersection, DD-12) — then its `shouldRender`. The type block needs every
 * selected element to share it.
 * HOW: each section's display mode (open / summary / "+" row, DD-11) from the
 * user's choice for this element type, else the entry's `open` rule and
 * whether the element carries a value. The mode, the header title and the
 * anchor reach the section's own `Section` through `SectionFrameContext`, so
 * the section files themselves are unchanged.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import type { IconConfig, MediaAsset, MediaAssetType } from "@/shared/types/media";
import type { CssContext, PropertyState } from "../config/cssContext";
import { SECTION_ORDER } from "../config/sectionOrder";
import type { UseAdvancedSettingsReturn } from "../hooks/useAdvancedSettings";
import { resolveDisplayMode, type SectionChoice } from "../hooks/useInspectorSections";
import {
  SECTION_REGISTRY,
  type SectionContext,
  type SectionId,
  type ShouldRenderContext,
  type TabId,
} from "../sections/registry";
import { sectionHasValue } from "../sections/registry";
import { SectionFrameContext, type SectionFrame } from "../shared/controls/Section";
import { InspectorFieldContext } from "../shared/controls/InspectorFieldContext";
import { sectionOverrideMarks } from "../shared/controls/OverrideDot";
import { capabilitiesFor } from "@/shared/constants/elementCapabilities";
import { BindingDetail } from "../sections/binding/BindingDetail";
import { closeSubview, openSubview, useSubview } from "./subviewStore";
import type { BreakpointId } from "@/shared/types/breakpoints";
import type { PseudoStateId } from "@/shared/types";
import { ResetStyleReview } from "../components/ResetStyleReview";
import { ApplyStyleReview } from "../components/ApplyStyleReview";

// ============================================================================
// TYPES
// ============================================================================

export interface InspectorTabContentProps {
  tabId: TabId;
  /** Where a style write lands — the Apply style review copies from here. */
  breakpoint?: BreakpointId;
  pseudoState?: PseudoStateId;
  composer: Composer | null | undefined;
  /** The primary selected element — what the sections read. */
  selectedElement: { id: string; type: string; tagName?: string };
  /** Every selected id, primary first (one entry when single). */
  selectedIds: readonly string[];
  /** The type of every selected element (the intersection rule). */
  selectedTypes: readonly string[];
  styles: Record<string, string>;
  /** The element's own values at this breakpoint + state. */
  authoredStyles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange: (changes: Record<string, string>) => void;
  cssContext: CssContext;
  propertyStates: Record<string, PropertyState>;
  /** `${elementType}:${sectionId}` → the user's open / closed choice. */
  choices: Readonly<Record<string, SectionChoice>>;
  onSetChoices: (elementType: string, sectionIds: readonly string[], choice: SectionChoice) => void;
  /** Supplied by useAdvancedSettings lifted to ProInspector. */
  advancedState: UseAdvancedSettingsReturn;
  onOpenMediaLibrary?: (
    a: MediaAssetType[],
    s: (x: MediaAsset) => void,
    /** Board 1164:4713 — what the picker is being opened for, e.g. "Hero · Image". */
    forLabel?: string
  ) => void;
  onOpenIconPicker?: (c: IconConfig | undefined, s: (i: IconConfig) => void) => void;
  onOpenCreateCollection?: () => void;
}

/** The sections of `tabId` that apply to this selection, in the tab's order. */
export function visibleSectionIds(tabId: TabId, types: readonly string[], ctx: ShouldRenderContext): SectionId[] {
  const allCaps = types.map(capabilitiesFor);
  return SECTION_ORDER[tabId].filter((id) => {
    const entry = SECTION_REGISTRY[id];
    if (!entry || entry.tab !== tabId) return false;
    if (entry.capability && !allCaps.every((caps) => entry.capability!(caps))) return false;
    if ((id === "type" || id === "type-layout") && new Set(allCaps.map((c) => c.typeBlock)).size > 1) return false;
    return entry.shouldRender ? entry.shouldRender(ctx) : true;
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export const InspectorTabContent: React.FC<InspectorTabContentProps> = (props) => {
  const {
    tabId,
    composer,
    selectedElement,
    selectedIds,
    selectedTypes,
    styles,
    authoredStyles,
    onChange,
    onBatchChange,
    cssContext,
    propertyStates,
    choices,
    onSetChoices,
    advancedState,
    onOpenMediaLibrary,
    onOpenIconPicker,
    onOpenCreateCollection,
    breakpoint = "desktop",
    pseudoState = "normal",
  } = props;

  const field = React.useContext(InspectorFieldContext);
  const subview = useSubview();
  /* Another element closes any subview (Play F2.05, 2L9 I15). */
  React.useEffect(() => () => openSubview(null), [selectedElement.id]);
  const subviewHere = subview?.elementId === selectedElement.id && selectedIds.length <= 1 ? subview.kind : null;
  const type = selectedElement.type;
  const caps = capabilitiesFor(type);
  const isMultiSelect = selectedIds.length > 1;

  const baseCtx: ShouldRenderContext = {
    composer,
    selectedElement,
    selectedIds,
    variant: "element",
    styles,
    authoredStyles,
    onChange,
    onBatchChange,
    cssContext,
    propertyStates,
    caps,
    onOpenMediaLibrary,
    onOpenIconPicker,
    onOpenCreateCollection,
    tabId,
    mixedKeys: cssContext.mixedKeys,
    isMultiSelect,
  };

  if (subviewHere === "apply-style" && composer) {
    return (
      <ApplyStyleReview composer={composer} elementId={selectedElement.id} breakpoint={breakpoint} pseudo={pseudoState} onClose={() => closeSubview("apply-style")} />
    );
  }

  if (subviewHere === "reset-style" && composer) {
    return <ResetStyleReview composer={composer} elementId={selectedElement.id} onClose={() => closeSubview("reset-style")} />;
  }

  if (tabId === "content" && subviewHere === "binding") {
    return <BindingDetail composer={composer} elementId={selectedElement.id} onOpenCreateCollection={onOpenCreateCollection} />;
  }

  const all = visibleSectionIds(tabId, selectedTypes.length ? selectedTypes : [type], baseCtx);
  /* An open interaction is the Behavior tab's whole body (2L9 I15); a
     form's Add field list is the Content tab's (156:3109). */
  const only =
    tabId === "behaviour" && subviewHere === "interaction" ? "interactions" : tabId === "content" && subviewHere === "add-field" ? "form-fields" : null;
  const ids = subviewHere === "override-review" && (tabId === "style" || tabId === "effects") ? [] : only ? all.filter((id) => id === only) : all;
  const modes = ids.map((id) => {
    const entry = SECTION_REGISTRY[id];
    const open = typeof entry.open === "function" ? entry.open(baseCtx) : entry.open;
    return resolveDisplayMode(open, sectionHasValue(id, baseCtx), choices[`${type}:${id}`]);
  });
  /* ⌥-click (DD-22): everything shut when anything is open, else all open. */
  const toggleAll = () => onSetChoices(type, ids, modes.some((m) => m === "open") ? "closed" : "open");

  return (
    <>
      {ids.map((id, i) => {
        const entry = SECTION_REGISTRY[id];
        const displayMode = modes[i];
        const setOpen = (open: boolean) => onSetChoices(type, [id], open ? "open" : "closed");
        const advancedKey = entry.advancedKey ?? id;
        const ctx: SectionContext = {
          ...baseCtx,
          isOpen: displayMode === "open",
          onToggle: () => setOpen(displayMode !== "open"),
          displayMode,
          advancedExpanded: entry.advancedKey ? advancedState.isExpanded(advancedKey) : false,
          onAdvancedToggle: entry.advancedKey ? () => advancedState.toggle(advancedKey) : () => undefined,
        };
        const frame: SectionFrame = {
          ...sectionOverrideMarks(field, entry.styleKeys as readonly string[]),
          sectionId: id,
          title: entry.frameTitle ? entry.frameTitle(baseCtx) : entry.title,
          displayMode,
          summary: displayMode === "summary" && entry.summary ? entry.summary(baseCtx) : null,
          onToggle: ctx.onToggle,
          onToggleAll: toggleAll,
          onAdd: () => {
            setOpen(true);
            entry.onAdd?.(ctx);
          },
        };
        return (
          <SectionFrameContext.Provider key={id} value={frame}>
            {entry.render(ctx)}
          </SectionFrameContext.Provider>
        );
      })}
    </>
  );
};

export default InspectorTabContent;
