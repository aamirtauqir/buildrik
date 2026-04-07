import type { Composer } from "../../../engine";
import type { InspectorContext } from "../config";
import { buildInspectorContext } from "../config";

export interface CssContext {
  display: string;
  parentDisplay: string;
  position: string;
  elementType: string;
  isFlexContainer: boolean;
  isGridContainer: boolean;
  isFlexItem: boolean;
  isGridItem: boolean;
  isInline: boolean;
  isInlineBlock: boolean;
  isPositioned: boolean;
  isMedia: boolean;
  /** Extended context for showIf evaluation */
  inspectorContext: InspectorContext;
}

export interface PropertyState {
  hidden?: boolean;
  disabled?: boolean;
  reason?: string;
  isOverridden?: boolean;
}

const FLEX_DISPLAYS = new Set(["flex", "inline-flex"]);
const GRID_DISPLAYS = new Set(["grid", "inline-grid"]);

export function deriveCssContext(
  selectedElement: { id: string; type: string } | null,
  composer?: Composer | null,
  devMode = false
): CssContext {
  const elementType = selectedElement?.type || "";

  // Build extended inspector context for showIf evaluation
  const inspectorContext = buildInspectorContext({
    elementType,
    display: "",
    devMode,
  });

  const fallback: CssContext = {
    display: "",
    parentDisplay: "",
    position: "static",
    elementType,
    isFlexContainer: false,
    isGridContainer: false,
    isFlexItem: false,
    isGridItem: false,
    isInline: false,
    isInlineBlock: false,
    isPositioned: false,
    isMedia: ["image", "video"].includes(elementType),
    inspectorContext,
  };

  if (!selectedElement?.id || !composer) return fallback;

  const el = composer.elements.getElement(selectedElement.id);
  const parent = el?.getParent?.();

  const styles = el?.getStyles?.() || {};
  const parentStyles = parent?.getStyles?.() || {};

  const display = styles.display || "";
  const parentDisplay = parentStyles.display || "";
  const position = styles.position || "static";

  // Update inspector context with actual display value
  const updatedInspectorContext = buildInspectorContext({
    elementType: selectedElement.type,
    display,
    devMode,
  });

  return {
    display,
    parentDisplay,
    position,
    elementType: selectedElement.type,
    isFlexContainer: FLEX_DISPLAYS.has(display),
    isGridContainer: GRID_DISPLAYS.has(display),
    isFlexItem: FLEX_DISPLAYS.has(parentDisplay),
    isGridItem: GRID_DISPLAYS.has(parentDisplay),
    isInline: display === "inline",
    isInlineBlock: display === "inline-block",
    isPositioned: Boolean(position && position !== "static"),
    isMedia: ["image", "video"].includes(selectedElement.type),
    inspectorContext: updatedInspectorContext,
  };
}

export function getPropertyStates(context: CssContext): Record<string, PropertyState> {
  const state: Record<string, PropertyState> = {};

  if (context.isInline) {
    ["width", "height", "min-width", "max-width", "min-height", "max-height"].forEach((prop) => {
      state[prop] = {
        disabled: true,
        reason: "Inline elements ignore width/height",
      };
    });

    ["margin-top", "margin-bottom", "padding-top", "padding-bottom"].forEach((prop) => {
      state[prop] = {
        disabled: true,
        reason: "Inline elements ignore vertical spacing",
      };
    });
  }

  if (!context.isMedia) {
    state["object-fit"] = { hidden: true };
  }

  if (!context.isFlexContainer && !context.isGridContainer) {
    ["gap", "row-gap", "column-gap"].forEach((prop) => {
      state[prop] = { disabled: true, reason: "Enable flex/grid to use gaps" };
    });
  }

  if (!context.isFlexItem) {
    ["flex-grow", "flex-shrink", "flex-basis", "align-self", "order"].forEach((prop) => {
      state[prop] = {
        disabled: true,
        reason: "Applies only to flex items",
      };
    });
  }

  if (!context.isPositioned) {
    ["top", "right", "bottom", "left", "z-index"].forEach((prop) => {
      state[prop] = {
        disabled: true,
        reason: "Set position to relative/absolute/fixed to edit offsets",
      };
    });
  }

  return state;
}
