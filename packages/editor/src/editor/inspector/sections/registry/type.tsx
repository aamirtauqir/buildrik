/**
 * Type block registry entries (W1) — the defining block, titled with the
 * type's own name ("Heading", "Image"). Its body is chosen by the element's
 * true type (`config/typeBlocks.ts`).
 *
 * The block heads the tab its body belongs to (2L9 page 04): a text, field,
 * media, embed or widget body is what the element says or plays, so it heads
 * Content (boards 161:8480, 36:2 "Image content"); the Flex / Grid bodies are
 * the children-layout controls, so they head Style (36:2 "Container layout").
 *
 * @license BSD-3-Clause
 */

import { defineSection, type AnySectionEntry, type SectionContext } from "./_shared";
import { TypeBlockSection } from "../typeBlock/TypeBlockSection";
import { TYPE_BLOCKS } from "@/editor/inspector/config/typeBlocks";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import type { ElementCapabilities, TypeBlockId } from "@/shared/constants/elementCapabilities";

/** The type blocks that lay out children — Style's, not Content's. */
const LAYOUT_TYPE_BLOCKS: ReadonlySet<TypeBlockId> = new Set(["flex", "grid"]);

const hasBody = (caps: ElementCapabilities) => caps.typeBlock !== null && Boolean(TYPE_BLOCKS[caps.typeBlock]);

const adaptTypeBlock = (ctx: SectionContext) => ({
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
});

export const TYPE_SECTIONS: Record<string, AnySectionEntry> = {
  type: defineSection({
    tab: "content",
    title: "Type",
    frameTitle: (ctx) => elementTypeLabel(ctx.selectedElement.type),
    open: "always",
    capability: (caps) => hasBody(caps) && !LAYOUT_TYPE_BLOCKS.has(caps.typeBlock!),
    Component: TypeBlockSection,
    /* An embed's URL change clears the legacy padding-ratio box it replaces
       (embedBodies.tsx). Content writes no other style. */
    styleKeys: ["padding-bottom", "height"],
    adaptProps: adaptTypeBlock,
  }),

  "type-layout": defineSection({
    tab: "style",
    title: "Type",
    frameTitle: (ctx) => elementTypeLabel(ctx.selectedElement.type),
    open: "always",
    capability: (caps) => hasBody(caps) && LAYOUT_TYPE_BLOCKS.has(caps.typeBlock!),
    Component: TypeBlockSection,
    /* The Flex / Grid bodies read the flex and grid properties. */
    styleKeys: ["display", "flex-direction", "flex-wrap", "justify-content", "align-items", "align-content", "gap", "row-gap", "column-gap", "grid-template-columns", "grid-template-rows", "grid-auto-flow", "justify-items"],
    adaptProps: adaptTypeBlock,
  }),
};
