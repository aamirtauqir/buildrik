/**
 * Type block registry entry (W1) — the defining block that heads the Style
 * tab (board 1's "Heading"). Its body is chosen by the element's true type
 * (`config/typeBlocks.ts`); the frame title is the type's own name.
 *
 * @license BSD-3-Clause
 */

import { defineSection, type AnySectionEntry } from "./_shared";
import { TypeBlockSection } from "../typeBlock/TypeBlockSection";
import { TYPE_BLOCKS } from "../../config/typeBlocks";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";

export const TYPE_SECTIONS: Record<string, AnySectionEntry> = {
  type: defineSection({
    tab: "style",
    title: "Type",
    frameTitle: (ctx) => elementTypeLabel(ctx.selectedElement.type),
    open: "always",
    capability: (caps) => caps.typeBlock !== null && Boolean(TYPE_BLOCKS[caps.typeBlock]),
    Component: TypeBlockSection,
    /* The Flex / Grid bodies read the flex and grid properties. */
    styleKeys: ["display", "flex-direction", "flex-wrap", "justify-content", "align-items", "align-content", "gap", "row-gap", "column-gap", "grid-template-columns", "grid-template-rows", "grid-auto-flow", "justify-items"],
    adaptProps: (ctx) => ({
      composer: ctx.composer,
      element: ctx.selectedElement,
      targetIds: ctx.selectedIds,
      styles: ctx.styles,
      onChange: ctx.onChange,
      onBatchChange: ctx.onBatchChange,
      mixedKeys: ctx.mixedKeys,
      onOpenMediaLibrary: ctx.onOpenMediaLibrary,
      onOpenIconPicker: ctx.onOpenIconPicker,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
    }),
  }),
};
