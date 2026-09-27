/**
 * Component row registry entry — created by W1, owned by lane L2-D2 (which
 * turns VariantSection into the compact ComponentRow, board 26). Above the
 * type block (DD-16), only on a component instance.
 *
 * @license BSD-3-Clause
 */

import { defineSection, type AnySectionEntry } from "./_shared";
import { VariantSection } from "../VariantSection";

export const COMPONENT_SECTIONS: Record<string, AnySectionEntry> = {
  component: defineSection({
    tab: "style",
    title: "Component",
    open: "always",
    shouldRender: (ctx) => Boolean(ctx.composer?.components?.getInstanceByElementId?.(ctx.selectedElement.id)),
    Component: VariantSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer ?? null, elementId: ctx.selectedElement.id }),
  }),
};
