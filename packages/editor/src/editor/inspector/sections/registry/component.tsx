/**
 * Component row registry entry — board 26 (DD-16): above the type block,
 * only on a component instance. Owned by lane L2-D2.
 *
 * @license BSD-3-Clause
 */

import { defineSection, type AnySectionEntry } from "./_shared";
import { ComponentRow } from "../ComponentRow";

export const COMPONENT_SECTIONS: Record<string, AnySectionEntry> = {
  component: defineSection({
    tab: "style",
    title: "Component",
    open: "always",
    shouldRender: (ctx) => Boolean(ctx.composer?.components?.getInstanceByElementId?.(ctx.selectedElement.id)),
    Component: ComponentRow,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer ?? null, elementId: ctx.selectedElement.id }),
  }),
};
