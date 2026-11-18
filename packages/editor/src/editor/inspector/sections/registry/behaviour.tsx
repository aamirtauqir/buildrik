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

import { adaptBaseStyleProps, adaptElementProps, defineSection, ownSection as own, type AnySectionEntry, type SectionContext, type SectionOpen, type ShouldRenderContext } from "./_shared";
import { LinkSection } from "../LinkSection";
import { DialogBehaviorSection } from "../ModalSections";
import { TabsBehaviorSection } from "../TabsSection";
import { readModal } from "@/engine/widgets/modalModel";
import { FormAfterSubmitSection } from "../FormAfterSubmitSection";
import { SliderPlaybackSection } from "../SliderPlaybackSection";
import { VisibilitySection } from "../VisibilitySection";
import { InteractionsSection, type Interaction } from "../interactions";
import { IS_DEV_BUILD } from "@/shared/utils/runtimeEnv";
import { writeElement } from "@/engine/commands/commandOperations";
import { INTERACTION_EASINGS, INTERACTION_PRESET_KEYFRAMES } from "@/engine/export/interactionRuntime";
import type { AnimationConfig } from "@/shared/types/animations";

/** The element under the canvas selection, for the interaction preview. */
const canvasNode = (id: string) => document.querySelector(`[data-buildrick-id="${id}"]`) as HTMLElement | null;

/** The preview run each canvas node is playing, so Stop can cancel exactly it. */
const previewRuns = new WeakMap<HTMLElement, Animation>();

const DEVICES = ["Desktop", "Tablet", "Mobile"] as const;

/** Visibility and Interactions arrive open, except under a type's own
 *  settings (a form's After submit, a slider's), where they shut to a
 *  summary — "All devices", "None" (2L9 156:11319). */
const behindOwnSettings = (ctx: ShouldRenderContext): SectionOpen =>
  ctx.caps.behaviourSections.some((id) => id === "form-settings" || id === "slider-settings") ? "closed" : "open";

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
  /* Plays with the published runtime's keyframes and easings (WAAPI), so the
     preview is what a visitor gets. It set a CSS `animation` shorthand with
     the GSAP easing name (`power2.out`), which CSS rejects — nothing played
     (FLOW-SENSE FS-07). No fill: the element returns to its edited state. */
  const onPreview = (interaction: Interaction) => {
    const domEl = canvasNode(ctx.selectedElement.id);
    const anim = interaction.animation;
    if (!domEl || !anim || typeof domEl.animate !== "function") return;
    const frames =
      anim.preset === "custom"
        ? anim.customProperties
          ? [{}, anim.customProperties]
          : null
        : INTERACTION_PRESET_KEYFRAMES[anim.preset];
    if (!frames) return;
    previewRuns.get(domEl)?.cancel();
    const run = domEl.animate(frames, {
      duration: anim.duration || 300,
      delay: anim.delay || 0,
      easing: INTERACTION_EASINGS[anim.easing] || "ease",
      iterations: 1,
    });
    previewRuns.set(domEl, run);
  };
  /* 2L9 I17: Stop restores the authored appearance — the preview's WAAPI run
     is cancelled. Clearing `style.animation` here (the pre-WAAPI preview's
     carrier) would also strip the element's own inline animation. */
  const onStopPreview = () => {
    const domEl = canvasNode(ctx.selectedElement.id);
    if (!domEl) return;
    previewRuns.get(domEl)?.cancel();
    previewRuns.delete(domEl);
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
    onStopPreview,
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

  /* B-21 (2L9 B4-C06): which pair visitors start on. */
  "tabs-behavior": defineSection({
    tab: "behaviour",
    title: "Tabs",
    open: "always",
    shouldRender: (ctx) => ctx.selectedIds.length <= 1 && ctx.selectedElement.type === "tabs",
    Component: TabsBehaviorSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer, elementId: ctx.selectedElement.id, isOpen: ctx.isOpen, onToggle: ctx.onToggle }),
  }),

  /* B-17 (2L9 B4-C18): the dialog's own behaviour, on the dialog. */
  "dialog-behavior": defineSection({
    tab: "behaviour",
    title: "Dialog behavior",
    open: "always",
    shouldRender: (ctx) =>
      ctx.selectedIds.length <= 1 && Boolean(ctx.composer && readModal(ctx.composer, ctx.selectedElement.id)?.dialogId === ctx.selectedElement.id),
    Component: DialogBehaviorSection,
    styleKeys: [],
    adaptProps: (ctx) => ({ composer: ctx.composer, elementId: ctx.selectedElement.id, isOpen: ctx.isOpen, onToggle: ctx.onToggle }),
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
    open: behindOwnSettings,
    summary: (ctx) => {
      const shown = DEVICES.filter((d) => ctx.authoredStyles[`--hide-${d.toLowerCase()}`] !== "true");
      return shown.length === DEVICES.length ? "All devices" : shown.length ? shown.join(" · ") : "Hidden";
    },
    /* The three keys VisibilitySection reads, and only those — declaring
       `display` would mark the section as carrying a value on every element. */
    styleKeys: ["--hide-desktop", "--hide-tablet", "--hide-mobile"],
    Component: VisibilitySection,
    adaptProps: adaptBaseStyleProps,
  }),

  interactions: defineSection({
    tab: "behaviour",
    title: "Interactions",
    open: behindOwnSettings,
    summary: (ctx) => {
      const n = (ctx.composer?.elements.getElement(ctx.selectedElement.id)?.getInteractions?.() ?? []).length;
      return n ? `${n} interaction${n === 1 ? "" : "s"}` : "None";
    },
    Component: InteractionsSection,
    styleKeys: [],
    adaptProps: adaptInteractions,
  }),
};
