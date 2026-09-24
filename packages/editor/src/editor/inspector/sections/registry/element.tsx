/**
 * Element-tab section registry: link, content, element-properties,
 * css-classes. Edits the element's identity / addressing rather than its style.
 *
 * @license BSD-3-Clause
 */

import { defineSection, type AnySectionEntry } from "./_shared";
import { CSSClassesSection } from "../CSSClassesSection";
import { ElementPropertiesSection } from "../elementProperties";
import { LinkSection } from "../LinkSection";
import { ContentSection } from "../ContentSection";

export const ELEMENT_SECTIONS: Record<string, AnySectionEntry> = {
  link: defineSection({
    tab: "element",
    Component: LinkSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
    }),
    // Only renders for linkable element types. LinkSection has its own
    // isLinkable check too, but gating at the registry level keeps the
    // element tab clean for everything else.
    shouldRender: (ctx) =>
      ["link", "button", "cta"].includes(ctx.selectedElement.type),
  }),

  /* Board 4428:141642 — CONTENT (Static / From CMS). G2-144. */
  content: defineSection({
    tab: "element",
    Component: ContentSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      elementId: ctx.selectedElement.id,
      composer: ctx.composer ?? null,
      onOpenCreateCollection: ctx.onOpenCreateCollection,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
    }),
  }),

  "element-properties": defineSection({
    tab: "element",
    Component: ElementPropertiesSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
      onOpenMediaLibrary: ctx.onOpenMediaLibrary,
      onOpenIconPicker: ctx.onOpenIconPicker,
    }),
    // ElementPropertiesSection.getPropertiesForType already returns [] for
    // element types with no properties. But hiding the section header too
    // keeps the element tab from showing a header with no content.
    // For now, let it render — the component returns null internally.
  }),

  "css-classes": defineSection({
    tab: "element",
    tier: "advanced",
    Component: CSSClassesSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
    }),
    // Universal — every element can have classes.
  }),
};
