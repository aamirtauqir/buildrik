/**
 * Content registry entries (2L9 page 04: boards 161:8480, 156:716, 255:93321,
 * 247:26594): what the element says and is, written once for every
 * breakpoint — the type's own lists (Fields, Slides, Collection), its CMS
 * binding and its Attributes (closed, one-line summary). The type block that
 * heads the tab is `./type.tsx`.
 *
 * @license BSD-3-Clause
 */

import { adaptElementProps, defineSection, ownSection as own, type AnySectionEntry } from "./_shared";
import { CmsBindingSection } from "../CmsBindingSection";
import { CollectionListSection } from "../CollectionListSection";
import { FormFieldsSection } from "../FormFieldsSection";
import { SlidesSection } from "../SlidesSection";
import { AttributesSection, attributesSummary } from "../attributes/AttributesSection";

export const CONTENT_SECTIONS: Record<string, AnySectionEntry> = {
  "form-fields": defineSection({
    tab: "content",
    title: "Fields",
    open: "open",
    capability: own("form-fields"),
    Component: FormFieldsSection,
    styleKeys: [],
    adaptProps: adaptElementProps,
  }),

  slides: defineSection({
    tab: "content",
    title: "Slides",
    open: "open",
    capability: own("slides"),
    Component: SlidesSection,
    styleKeys: [],
    adaptProps: adaptElementProps,
  }),

  collection: defineSection({
    tab: "content",
    title: "Collection",
    open: "open",
    capability: own("collection"),
    Component: CollectionListSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ ...adaptElementProps(ctx), onOpenCreateCollection: ctx.onOpenCreateCollection }),
  }),

  "cms-binding": defineSection({
    tab: "content",
    title: "CMS binding",
    open: "open",
    capability: (caps) => caps.cmsBindable && !caps.isStructuralChild,
    Component: CmsBindingSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ ...adaptElementProps(ctx), onOpenCreateCollection: ctx.onOpenCreateCollection }),
  }),

  attributes: defineSection({
    tab: "content",
    title: "Attributes",
    open: "closed",
    summary: (ctx) => attributesSummary(ctx.composer, ctx.selectedElement),
    Component: AttributesSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      composer: ctx.composer ?? null,
      element: ctx.selectedElement,
      targetIds: ctx.selectedIds,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
    }),
  }),
};
