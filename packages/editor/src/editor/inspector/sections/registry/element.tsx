/**
 * Element-tab section registry: link, content, element-properties,
 * css-classes. Edits the element's identity / addressing rather than its style.
 *
 * @license BSD-3-Clause
 */

import { defineSection, type AnySectionEntry } from "./_shared";
import { CSSClassesSection } from "../CSSClassesSection";
import { ElementPropertiesSection } from "../elementProperties";
import { LINKABLE_TYPES, LinkSection } from "../LinkSection";
import { ContentSection } from "../ContentSection";
import { CollectionListSection } from "../CollectionListSection";

export const ELEMENT_SECTIONS: Record<string, AnySectionEntry> = {
  link: defineSection({
    tab: "element",
    title: "Link",
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
    shouldRender: (ctx) => LINKABLE_TYPES.has(ctx.selectedElement.type),
  }),

  /* Board 4428:141642 — CONTENT (Static / From CMS). G2-144. */
  content: defineSection({
    tab: "element",
    title: "Content",
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

  /* G3-079 — the Collection list's binding: which collection its children
     repeat over, and how many records. Only the collection-list profile
     lists it. */
  collection: defineSection({
    tab: "element",
    title: "Collection",
    Component: CollectionListSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      elementId: ctx.selectedElement.id,
      composer: ctx.composer ?? null,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
    }),
  }),

  "element-properties": defineSection({
    tab: "element",
    title: "Advanced",
    Component: ElementPropertiesSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
      onOpenIconPicker: ctx.onOpenIconPicker,
    }),
    // ElementPropertiesSection.getPropertiesForType already returns [] for
    // element types with no properties. But hiding the section header too
    // keeps the element tab from showing a header with no content.
    // For now, let it render — the component returns null internally.
  }),

  "css-classes": defineSection({
    tab: "element",
    title: "CSS classes",
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
