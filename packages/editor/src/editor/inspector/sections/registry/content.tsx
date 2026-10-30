/**
 * Content registry entries (2L9 page 04: boards 161:8480, 156:716, 255:93321,
 * 247:26594): what the element says and is, written once for every
 * breakpoint — the type's own lists (Fields, Slides, Collection), its CMS
 * binding, Semantics (Tag, ID) and Advanced attributes (closed, "{n} set"). The type block that
 * heads the tab is `./type.tsx`.
 *
 * @license BSD-3-Clause
 */

import { isJustAdded } from "../justAddedField";
import { isTableCell, TableAccessibilitySection, TableCellSection, TableStructureSection } from "../TableSections";
import { adaptElementProps, defineSection, ownSection as own, type AnySectionEntry } from "./_shared";
import { CmsBindingSection } from "../CmsBindingSection";
import { BindingStatusSection } from "../binding/BindingStatusSection";
import { ConditionsSection } from "../conditions/ConditionsPanel";
import { TabPanelSection, TabsSection } from "../TabsSection";
import { componentTriggerOf, DialogContentSection, isModalTrigger, ModalRelationshipSection } from "../ModalSections";
import { readModal } from "@/engine/widgets/modalModel";
import { recordContextOf } from "../binding/useCmsBinding";
import { CollectionListSection } from "../CollectionListSection";
import { ChildrenSection, COMMERCE_TYPES, CommerceNoteSection } from "../ChildrenSection";
import { FormFieldsSection } from "../FormFieldsSection";
import { SlidesSection } from "../SlidesSection";
import { GalleryImageBackSection, GallerySection, galleryOf } from "../GallerySection";
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

  /* B69/04 (249:72335): an Image gallery's images — open, move, Choose asset. */
  gallery: defineSection({
    tab: "content",
    title: "Images",
    open: "open",
    shouldRender: (ctx) => ctx.selectedIds.length <= 1 && ctx.selectedElement.type === "gallery",
    Component: GallerySection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer, elementId: ctx.selectedElement.id, isOpen: ctx.isOpen, onToggle: ctx.onToggle, onOpenMediaLibrary: ctx.onOpenMediaLibrary }),
  }),

  /* B69/04 "Exact image + Back": an image of a gallery returns to it. */
  "gallery-image": defineSection({
    tab: "content",
    title: "Gallery",
    open: "always",
    shouldRender: (ctx) => ctx.selectedIds.length <= 1 && Boolean(galleryOf(ctx.composer?.elements.getElement(ctx.selectedElement.id))),
    Component: GalleryImageBackSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer, elementId: ctx.selectedElement.id }),
  }),

  collection: defineSection({
    tab: "content",
    /* 2L9 B5-D76: "Collection list". */
    title: "Collection list",
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

  /* B5-D11…D15 (173:14104): a bound property's trouble, last on the tab. */
  "binding-status": defineSection({
    tab: "content",
    title: "Binding status",
    open: "always",
    capability: (caps) => caps.cmsBindable && !caps.isStructuralChild,
    shouldRender: (ctx) => Boolean(ctx.composer?.cms?.bindings?.getBindings?.(ctx.selectedElement.id)?.length),
    Component: BindingStatusSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer, elementId: ctx.selectedElement.id }),
  }),

  /* 2L9 F02: a field's validation, shut with a summary under its block. */
  validation: defineSection({
    tab: "content",
    title: "Validation",
    open: "closed",
    capability: (caps) => caps.typeBlock === "input",
    /* 2L9 F06: a field just added shows only the rows a new field needs. */
    shouldRender: (ctx) => !isJustAdded(ctx.composer, ctx.selectedElement.id),
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
    /* 2L9: open with an ID (161:8480), else shut reading its tag (156:716);
       open right after a tag conversion, on "Content retained" (A13). */
    open: (ctx) => (isJustAdded(ctx.composer, ctx.selectedElement.id, "semantic-converted") ? "always" : "set"),
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

  /* B69 (249:71560 …): a block that holds blocks lists and opens its exact
     children. Not where the type has its own list (Fields, Slides,
     Collection list, Tabs, Table), a body of its own, or is a Modal dialog. */
  children: defineSection({
    tab: "content",
    title: "Children",
    open: "open",
    shouldRender: (ctx) => {
      if (ctx.selectedIds.length > 1 || !ctx.composer) return false;
      const el = ctx.composer.elements.getElement(ctx.selectedElement.id);
      if (!el?.canHaveChildren?.()) return false;
      if (ctx.caps.typeBlock && ctx.caps.typeBlock !== "flex" && ctx.caps.typeBlock !== "grid") return false;
      if (["form", "table", "tabs", "slider", "accordion", "theme-toggle", "gallery"].includes(ctx.selectedElement.type)) return false;
      if (["tablist", "tabpanel", "dialog"].includes(el.getAttribute?.("role") ?? "")) return false;
      if (["table", "thead", "tbody", "tr", "td", "th"].includes(el.getTagName().toLowerCase())) return false;
      return !ctx.composer.cms?.bindings?.getCollectionBinding?.(el.getId());
    },
    Component: ChildrenSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer, elementId: ctx.selectedElement.id, isOpen: ctx.isOpen, onToggle: ctx.onToggle }),
  }),

  /* B69/12: commerce blocks — existing content only, commerce planned. */
  commerce: defineSection({
    tab: "content",
    title: "Existing content",
    open: "always",
    shouldRender: (ctx) => ctx.selectedIds.length <= 1 && COMMERCE_TYPES.has(ctx.selectedElement.type),
    Component: CommerceNoteSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ isOpen: ctx.isOpen, onToggle: ctx.onToggle }),
  }),

  /* B-21 (2L9 B4-C01): a Tabs block's pairs and which opens first. */
  "tabs-pairs": defineSection({
    tab: "content",
    title: "Tabs",
    open: "always",
    shouldRender: (ctx) => ctx.selectedIds.length <= 1 && ctx.selectedElement.type === "tabs",
    Component: TabsSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer, elementId: ctx.selectedElement.id, isOpen: ctx.isOpen, onToggle: ctx.onToggle }),
  }),

  /* B-21 (2L9 B4-C05): a Tabs panel, shown in the editor while selected. */
  "tab-panel": defineSection({
    tab: "content",
    title: "Editing panel",
    open: "always",
    shouldRender: (ctx) => ctx.selectedIds.length <= 1 && ctx.composer?.elements.getElement(ctx.selectedElement.id)?.getAttribute?.("role") === "tabpanel",
    Component: TabPanelSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer, elementId: ctx.selectedElement.id, isOpen: ctx.isOpen, onToggle: ctx.onToggle }),
  }),

  /* B-17 (2L9 B4-C07): a modal trigger's dialog. */
  "modal-relationship": defineSection({
    tab: "content",
    title: "Modal relationship",
    open: "always",
    shouldRender: (ctx) =>
      ctx.selectedIds.length <= 1 &&
      Boolean(ctx.composer && (isModalTrigger(ctx.composer, ctx.selectedElement.id) || componentTriggerOf(ctx.composer, ctx.selectedElement.id))),
    Component: ModalRelationshipSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer, elementId: ctx.selectedElement.id, isOpen: ctx.isOpen, onToggle: ctx.onToggle }),
  }),

  /* B-17 (2L9 B4-C08 / C17): the dialog's own parts and the way back. */
  "dialog-content": defineSection({
    tab: "content",
    title: "Dialog content",
    open: "always",
    shouldRender: (ctx) =>
      ctx.selectedIds.length <= 1 && Boolean(ctx.composer && readModal(ctx.composer, ctx.selectedElement.id)?.dialogId === ctx.selectedElement.id),
    Component: DialogContentSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer, elementId: ctx.selectedElement.id, isOpen: ctx.isOpen, onToggle: ctx.onToggle }),
  }),

  /* B-11 (2L9 B4-D04, B5-D54): shown / hidden by the record — only where the
     element has a record to read, or already carries a condition (old or new). */
  conditions: defineSection({
    tab: "content",
    title: "Conditions",
    open: "closed",
    shouldRender: (ctx) => {
      if (ctx.selectedIds.length > 1) return false;
      const id = ctx.selectedElement.id;
      return Boolean(
        ctx.composer?.cms?.bindings?.getCondition?.(id) ||
          ctx.composer?.elements.getElement(id)?.getDataBinding?.("condition") ||
          recordContextOf(ctx.composer, id),
      );
    },
    Component: ConditionsSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer, elementId: ctx.selectedElement.id, isOpen: ctx.isOpen, onToggle: ctx.onToggle }),
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
