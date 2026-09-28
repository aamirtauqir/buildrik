/**
 * Behaviour registry entries (boards 2, 6, 18, 19, 20): the type's own
 * sections (Fields / After submit, Slides / Playback, Collection), then Link,
 * CMS binding, Visibility, Interactions (moved from Effects, Q1), CSS classes
 * and Attributes (closed, summary). Owned by lane L2-D1 after W1.
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, adaptElementProps, defineSection, type AnySectionEntry, type SectionContext } from "./_shared";
import { CSSClassesSection } from "../CSSClassesSection";
import { LinkSection } from "../LinkSection";
import { CmsBindingSection } from "../CmsBindingSection";
import { CollectionListSection } from "../CollectionListSection";
import { FormFieldsSection } from "../FormFieldsSection";
import { FormAfterSubmitSection } from "../FormAfterSubmitSection";
import { SlidesSection } from "../SlidesSection";
import { SliderPlaybackSection } from "../SliderPlaybackSection";
import { VisibilitySection } from "../VisibilitySection";
import { InteractionsSection, type Interaction } from "../interactions";
import { AttributesSection, attributesSummary } from "../attributes/AttributesSection";
import type { BehaviourSectionId } from "@/shared/constants/elementCapabilities";
import { IS_DEV_BUILD } from "@/shared/utils/runtimeEnv";
import { writeElement } from "@/engine/commands/commandOperations";
import type { AnimationConfig } from "@/shared/types/animations";

const own = (id: BehaviourSectionId) => (caps: { behaviourSections: readonly BehaviourSectionId[] }) =>
  caps.behaviourSections.includes(id);

/** The element under the canvas selection, for the interaction preview. */
const canvasNode = (id: string) => document.querySelector(`[data-buildrick-id="${id}"]`) as HTMLElement | null;

function adaptInteractions(ctx: SectionContext) {
  const element = () => ctx.composer?.elements.getElement(ctx.selectedElement.id);
  const getInteractions = (): Interaction[] => {
    const el = element();
    if (!el) return [];
    if (!el.getInteractions) {
      if (IS_DEV_BUILD) console.warn(`[Inspector] getInteractions not implemented on element ${ctx.selectedElement.id}`);
      return [];
    }
    return (el.getInteractions() as Interaction[]) ?? [];
  };
  const onInteractionsChange = (interactions: Interaction[]) => {
    if (!ctx.composer) return;
    /* P-1: the lock gate — refused (and said) when the element is locked. */
    writeElement(ctx.composer, element(), "interactions-change", (el) => {
      if (!el.setInteractions && IS_DEV_BUILD) console.warn(`[Inspector] setInteractions not implemented on element ${ctx.selectedElement.id}`);
      el.setInteractions?.(interactions);
    });
  };
  const onPreview = (interaction: Interaction) => {
    const domEl = canvasNode(ctx.selectedElement.id);
    const anim = interaction.animation;
    if (!domEl || !anim) return;
    domEl.style.animation = "";
    void domEl.offsetHeight;
    domEl.style.animation = `bd-anim-${anim.preset} ${anim.duration}ms ${anim.easing} ${anim.delay}ms 1 normal forwards`;
  };
  /* G2-157 (option A): the element's CSS animation is a row of this list. */
  const getAnimation = () => {
    const el = element();
    if (!el?.getAnimation) {
      if (IS_DEV_BUILD) console.warn(`[Inspector] getAnimation not implemented on element ${ctx.selectedElement.id}`);
      return null;
    }
    return el.getAnimation() ?? null;
  };
  const onAnimationChange = (animation: AnimationConfig | null) => {
    if (!ctx.composer) return;
    /* P-1: the lock gate — refused (and said) when the element is locked. */
    writeElement(ctx.composer, element(), "animation-change", (el) => {
      if (animation) el.setAnimation?.(animation);
      else el.clearAnimation?.();
    });
  };
  const onAnimationPreview = () => {
    const domEl = canvasNode(ctx.selectedElement.id);
    if (!domEl) return;
    const animation = domEl.style.animation;
    domEl.style.animation = "none";
    // Force a reflow so the restart actually fires.
    void domEl.offsetHeight;
    domEl.style.animation = animation;
  };
  return {
    interactions: getInteractions(),
    onInteractionsChange,
    animation: getAnimation(),
    onAnimationChange,
    onAnimationPreview,
    composer: ctx.composer,
    elementId: ctx.selectedElement.id,
    onPreview,
    isOpen: ctx.isOpen,
    onToggle: ctx.onToggle,
  };
}

export const BEHAVIOUR_SECTIONS: Record<string, AnySectionEntry> = {
  "form-fields": defineSection({
    tab: "behaviour",
    title: "Fields",
    open: "open",
    capability: own("form-fields"),
    Component: FormFieldsSection,
    styleKeys: [],
    adaptProps: adaptElementProps,
  }),

  "form-settings": defineSection({
    tab: "behaviour",
    title: "After submit",
    open: "open",
    capability: own("form-settings"),
    Component: FormAfterSubmitSection,
    styleKeys: [],
    adaptProps: adaptElementProps,
  }),

  slides: defineSection({
    tab: "behaviour",
    title: "Slides",
    open: "open",
    capability: own("slides"),
    Component: SlidesSection,
    styleKeys: [],
    adaptProps: adaptElementProps,
  }),

  "slider-settings": defineSection({
    tab: "behaviour",
    title: "Playback",
    open: "open",
    capability: own("slider-settings"),
    Component: SliderPlaybackSection,
    styleKeys: [],
    adaptProps: adaptElementProps,
  }),

  collection: defineSection({
    tab: "behaviour",
    title: "Collection",
    open: "open",
    capability: own("collection"),
    Component: CollectionListSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ ...adaptElementProps(ctx), onOpenCreateCollection: ctx.onOpenCreateCollection }),
  }),

  link: defineSection({
    tab: "behaviour",
    title: "Link",
    open: "open",
    capability: (caps) => caps.link && !caps.isStructuralChild,
    Component: LinkSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
    }),
  }),

  "cms-binding": defineSection({
    tab: "behaviour",
    title: "CMS binding",
    open: "open",
    capability: (caps) => caps.cmsBindable && !caps.isStructuralChild,
    Component: CmsBindingSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ ...adaptElementProps(ctx), onOpenCreateCollection: ctx.onOpenCreateCollection }),
  }),

  visibility: defineSection({
    tab: "behaviour",
    title: "Visibility",
    open: "open",
    /* The three keys VisibilitySection reads, and only those — declaring
       `display` would mark the section as carrying a value on every element. */
    styleKeys: ["--hide-desktop", "--hide-tablet", "--hide-mobile"],
    Component: VisibilitySection,
    adaptProps: adaptBaseStyleProps,
  }),

  interactions: defineSection({
    tab: "behaviour",
    title: "Interactions",
    open: "open",
    Component: InteractionsSection,
    styleKeys: [],
    adaptProps: adaptInteractions,
  }),

  "css-classes": defineSection({
    tab: "behaviour",
    title: "CSS classes",
    open: "open",
    Component: CSSClassesSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
    }),
  }),

  attributes: defineSection({
    tab: "behaviour",
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
