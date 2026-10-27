/**
 * Content registry entries (2L9 page 04: boards 161:8480, 156:716, 255:93321,
 * 247:26594): what the element says and is, written once for every
 * breakpoint — the type's own lists (Fields, Slides, Collection), its CMS
 * binding, Semantics (Tag, ID) and Advanced attributes (closed, "{n} set"). The type block that
 * heads the tab is `./type.tsx`.
 *
 * @license BSD-3-Clause
 */

import { isTableCell, TableAccessibilitySection, TableCellSection, TableStructureSection } from "../TableSections";
import { adaptElementProps, defineSection, ownSection as own, type AnySectionEntry } from "./_shared";
import { CmsBindingSection } from "../CmsBindingSection";
import { CollectionListSection } from "../CollectionListSection";
import { FormFieldsSection } from "../FormFieldsSection";
import { SlidesSection } from "../SlidesSection";
import { AttributesSection, attributesSummary } from "../attributes/AttributesSection";
import { SemanticsSection, tagLabel } from "../SemanticsSection";
import { ValidationSection, validationSummary } from "../ValidationSection";

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
    title: "Dynamic bindings",
    open: "open",
    capability: (caps) => caps.cmsBindable && !caps.isStructuralChild,
    /* Only while bound (B5-D01 draws none): a binding is made at its
       property row in the type block (binding/BindingPropertyRow). */
    shouldRender: (ctx) => Boolean(ctx.composer?.cms?.bindings?.getBindings?.(ctx.selectedElement.id)?.length),
    Component: CmsBindingSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ ...adaptElementProps(ctx), onOpenCreateCollection: ctx.onOpenCreateCollection }),
  }),

  /* 2L9 F02: a field's validation, shut with a summary under its block. */
  validation: defineSection({
    tab: "content",
    title: "Validation",
    open: "closed",
    capability: (caps) => caps.typeBlock === "input",
    summary: (ctx) => validationSummary(ctx.composer, ctx.selectedElement.id),
    Component: ValidationSection,
    styleKeys: [],
    adaptProps: adaptElementProps,
  }),

  /* Tag + ID. A multi-selection keeps it only for headings (one level for
     all); a tag or an id is one element's. */
  /* 2L9 245:42929: a table's structure and caption, from its own tree. */
  "table-structure": defineSection({
    tab: "content",
    title: "Structure",
    open: "always",
    shouldRender: (ctx) => ctx.selectedElement.type === "table" && ctx.selectedIds.length <= 1,
    Component: TableStructureSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer ?? null, elementId: ctx.selectedElement.id, isOpen: ctx.isOpen, onToggle: ctx.onToggle }),
  }),

  "table-accessibility": defineSection({
    tab: "content",
    title: "Accessibility",
    open: "always",
    shouldRender: (ctx) => ctx.selectedElement.type === "table" && ctx.selectedIds.length <= 1,
    Component: TableAccessibilitySection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer ?? null, elementId: ctx.selectedElement.id, isOpen: ctx.isOpen, onToggle: ctx.onToggle }),
  }),

  /* 2L9 245:43495: a td / th inside a table. */
  "table-cell": defineSection({
    tab: "content",
    title: "Cell",
    open: "always",
    shouldRender: (ctx) => ctx.selectedIds.length <= 1 && isTableCell(ctx.composer?.elements.getElement(ctx.selectedElement.id)),
    Component: TableCellSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer ?? null, elementId: ctx.selectedElement.id, isOpen: ctx.isOpen, onToggle: ctx.onToggle }),
  }),

  semantics: defineSection({
    tab: "content",
    title: "Semantics",
    /* A form field's ID is in Advanced attributes — F02 draws no Semantics. */
    capability: (caps) => caps.typeBlock !== "input",
    /* 2L9: open with an ID (161:8480), else shut reading its tag (156:716). */
    open: "set",
    hasValue: (ctx) => Boolean(ctx.composer?.elements.getElement(ctx.selectedElement.id)?.getAttribute?.("id")),
    summary: (ctx) => {
      const tag = ctx.composer?.elements.getElement(ctx.selectedElement.id)?.getTagName?.();
      return tag ? tagLabel(tag) : null;
    },
    shouldRender: (ctx) =>
      ctx.selectedIds.length <= 1 || ctx.selectedIds.every((id) => ctx.composer?.elements.getElement(id)?.getType?.() === ctx.selectedElement.type),
    Component: SemanticsSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      composer: ctx.composer ?? null,
      element: ctx.selectedElement,
      targetIds: ctx.selectedIds,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
    }),
  }),

  attributes: defineSection({
    tab: "content",
    title: "Advanced attributes",
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
