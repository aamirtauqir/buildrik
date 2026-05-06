/**
 * Effects-tab section registry: effects, animation, interactions,
 * visibility. Edits motion + dynamic behavior + final paint effects.
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, type AnySectionEntry } from "./_shared";
import { EffectsSection } from "../EffectsSection";
import { AnimationSection } from "../AnimationSection";
import { InteractionsSection, type Interaction } from "../interactions";
import { VisibilitySection } from "../VisibilitySection";

export const EFFECTS_SECTIONS: Record<string, AnySectionEntry> = {
  effects: defineSection({
    Component: EffectsSection,
    styleKeys: ["opacity", "box-shadow", "filter", "transform", "cursor", "mix-blend-mode", "transition", "transition-property", "transition-duration", "transition-timing-function"],
    adaptProps: adaptBaseStyleProps,
  }),

  animation: defineSection({
    Component: AnimationSection,
    styleKeys: [],
    adaptProps: (ctx) => {
      // Pull the live animation config from the element each render. This
      // is the same pattern the old EffectsTab used — reads via composer
      // directly because animations aren't in the styles map.
      const getAnimation = () => {
        if (!ctx.composer) return null;
        const el = ctx.composer.elements.getElement(ctx.selectedElement.id);
        if (!el?.getAnimation) {
          if (import.meta.env.DEV) console.warn(`[Inspector] getAnimation not implemented on element ${ctx.selectedElement.id}`);
          return null;
        }
        return el.getAnimation() ?? null;
      };
      const handleAnimationChange = (
        animation: import("../../../../shared/types/animations").AnimationConfig | null
      ) => {
        if (!ctx.composer) return;
        const el = ctx.composer.elements.getElement(ctx.selectedElement.id);
        if (!el) return;
        ctx.composer.beginTransaction?.("animation-change");
        try {
          if (animation) {
            if (!el.setAnimation && import.meta.env.DEV) console.warn(`[Inspector] setAnimation not implemented on element ${ctx.selectedElement.id}`);
            el.setAnimation?.(animation);
          } else {
            if (!el.clearAnimation && import.meta.env.DEV) console.warn(`[Inspector] clearAnimation not implemented on element ${ctx.selectedElement.id}`);
            el.clearAnimation?.();
          }
        } finally {
          ctx.composer.endTransaction?.();
        }
      };
      const handleAnimationPreview = () => {
        const domEl = document.querySelector(
          `[data-buildrick-id="${ctx.selectedElement.id}"]`
        ) as HTMLElement | null;
        if (!domEl) return;
        const animation = domEl.style.animation;
        domEl.style.animation = "none";
        // Force a reflow so the restart actually fires.
        void domEl.offsetHeight;
        domEl.style.animation = animation;
      };
      return {
        animation: getAnimation(),
        onAnimationChange: handleAnimationChange,
        onPreview: handleAnimationPreview,
        isOpen: ctx.isOpen,
        onToggle: ctx.onToggle,
        tier: ctx.tier,
      };
    },
  }),

  interactions: defineSection({
    Component: InteractionsSection,
    styleKeys: [],
    adaptProps: (ctx) => {
      const getInteractions = (): Interaction[] => {
        if (!ctx.composer || !ctx.selectedElement) return [];
        const el = ctx.composer.elements.getElement(ctx.selectedElement.id);
        if (!el) return [];
        if (!el.getInteractions) {
          if (import.meta.env.DEV) console.warn(`[Inspector] getInteractions not implemented on element ${ctx.selectedElement.id}`);
          return [];
        }
        return (el.getInteractions() as Interaction[]) ?? [];
      };
      const handleInteractionsChange = (interactions: Interaction[]) => {
        if (!ctx.composer) return;
        const el = ctx.composer.elements.getElement(ctx.selectedElement.id);
        if (!el) return;
        ctx.composer.beginTransaction?.("interactions-change");
        try {
          if (!el.setInteractions && import.meta.env.DEV) console.warn(`[Inspector] setInteractions not implemented on element ${ctx.selectedElement.id}`);
          el.setInteractions?.(interactions);
        } finally {
          ctx.composer.endTransaction?.();
        }
      };
      const handleInteractionPreview = (interaction: Interaction) => {
        const domEl = document.querySelector(
          `[data-buildrick-id="${ctx.selectedElement.id}"]`
        ) as HTMLElement | null;
        if (!domEl) return;
        const anim = interaction.animation;
        if (anim) {
          domEl.style.animation = "";
          void domEl.offsetHeight;
          domEl.style.animation = `buildrick-${anim.type} ${anim.duration}ms ${anim.easing} ${anim.delay}ms 1 normal forwards`;
        }
      };
      return {
        interactions: getInteractions(),
        onInteractionsChange: handleInteractionsChange,
        onPreview: handleInteractionPreview,
        onOpenTimeline: () => {
          if (import.meta.env.DEV) console.warn("[Inspector] onOpenTimeline: animation section navigation not yet implemented");
        },
        isOpen: ctx.isOpen,
        onToggle: ctx.onToggle,
        tier: ctx.tier,
      };
    },
  }),

  visibility: defineSection({
    Component: VisibilitySection,
    styleKeys: ["display", "visibility", "opacity", "pointer-events"],
    adaptProps: adaptBaseStyleProps,
  }),
};
