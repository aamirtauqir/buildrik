/**
 * Behavior registry entries (2L9 page 04: boards 161:13919, 156:6055,
 * 249:71560): how the element acts — the type's own settings (Form
 * settings, Playback), then Link (where a link goes; its text is Content),
 * Visibility and Interactions. CSS classes sit inside Content › Advanced
 * attributes (no 2L9 board draws them as a section; class-first is
 * pending). What the element says or is —
 * Fields, Slides, Collection, CMS binding, Attributes — is Content
 * (`./content.tsx`).
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, adaptElementProps, defineSection, ownSection as own, type AnySectionEntry, type SectionContext } from "./_shared";
import { LinkSection } from "../LinkSection";
import { FormAfterSubmitSection } from "../FormAfterSubmitSection";
import { SliderPlaybackSection } from "../SliderPlaybackSection";
import { VisibilitySection } from "../VisibilitySection";
import { InteractionsSection, type Interaction } from "../interactions";
import { IS_DEV_BUILD } from "@/shared/utils/runtimeEnv";
import { writeElement } from "@/engine/commands/commandOperations";
import type { AnimationConfig } from "@/shared/types/animations";

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
  "form-settings": defineSection({
    tab: "behaviour",
    title: "After submit",
    open: "open",
    capability: own("form-settings"),
    Component: FormAfterSubmitSection,
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
};
