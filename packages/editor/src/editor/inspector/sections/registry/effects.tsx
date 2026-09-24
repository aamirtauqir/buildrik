/**
 * Effects-tab section registry: opacity, shadow, blur, effects, interactions
 * visibility. Edits motion + dynamic behavior + final paint effects.
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, type AnySectionEntry } from "./_shared";
import { EffectsSection } from "../EffectsSection";
import { BlurSection, OpacitySection, ShadowSection } from "../EffectsBasicSections";
import { InteractionsSection, type Interaction } from "../interactions";
import { VisibilitySection } from "../VisibilitySection";
import { IS_DEV_BUILD } from "@/shared/utils/runtimeEnv";

export const EFFECTS_SECTIONS: Record<string, AnySectionEntry> = {
  /* Board 4428:142686 draws OPACITY, SHADOW, BLUR, INTERACTIONS — one
     control each. The rest of what paints is "More effects" (advanced). */
  opacity: defineSection({
    tab: "effects",
    Component: OpacitySection,
    styleKeys: ["opacity"],
    adaptProps: adaptBaseStyleProps,
  }),

  shadow: defineSection({
    tab: "effects",
    Component: ShadowSection,
    styleKeys: ["box-shadow"],
    adaptProps: adaptBaseStyleProps,
  }),

  blur: defineSection({
    tab: "effects",
    Component: BlurSection,
    styleKeys: ["filter"],
    adaptProps: adaptBaseStyleProps,
  }),

  effects: defineSection({
    tab: "effects",
    tier: "advanced",
    Component: EffectsSection,
    styleKeys: ["box-shadow", "filter", "transform", "cursor", "mix-blend-mode", "transition", "transition-property", "transition-duration", "transition-delay", "transition-timing-function", "text-shadow", "will-change"],
    adaptProps: adaptBaseStyleProps,
  }),

  interactions: defineSection({
    tab: "effects",
    Component: InteractionsSection,
    styleKeys: [],
    adaptProps: (ctx) => {
      const getInteractions = (): Interaction[] => {
        if (!ctx.composer || !ctx.selectedElement) return [];
        const el = ctx.composer.elements.getElement(ctx.selectedElement.id);
        if (!el) return [];
        if (!el.getInteractions) {
          if (IS_DEV_BUILD) console.warn(`[Inspector] getInteractions not implemented on element ${ctx.selectedElement.id}`);
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
          if (!el.setInteractions && IS_DEV_BUILD) console.warn(`[Inspector] setInteractions not implemented on element ${ctx.selectedElement.id}`);
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
          domEl.style.animation = `bd-anim-${anim.preset} ${anim.duration}ms ${anim.easing} ${anim.delay}ms 1 normal forwards`;
        }
      };
      /* G2-157 (option A): the element's CSS animation is a row of this list
         — the adapters the Animation section used move here unchanged. */
      const getAnimation = () => {
        if (!ctx.composer) return null;
        const el = ctx.composer.elements.getElement(ctx.selectedElement.id);
        if (!el?.getAnimation) {
          if (IS_DEV_BUILD) console.warn(`[Inspector] getAnimation not implemented on element ${ctx.selectedElement.id}`);
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
            if (!el.setAnimation && IS_DEV_BUILD) console.warn(`[Inspector] setAnimation not implemented on element ${ctx.selectedElement.id}`);
            el.setAnimation?.(animation);
          } else {
            if (!el.clearAnimation && IS_DEV_BUILD) console.warn(`[Inspector] clearAnimation not implemented on element ${ctx.selectedElement.id}`);
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
        interactions: getInteractions(),
        onInteractionsChange: handleInteractionsChange,
        animation: getAnimation(),
        onAnimationChange: handleAnimationChange,
        onAnimationPreview: handleAnimationPreview,
        composer: ctx.composer,
        elementId: ctx.selectedElement.id,
        onPreview: handleInteractionPreview,
        isOpen: ctx.isOpen,
        onToggle: ctx.onToggle,
        tier: ctx.tier,
      };
    },
  }),

  visibility: defineSection({
    tab: "element",
    /* The THREE keys this section reads, and only those. It declared
       `display`, `visibility`, `opacity` and `pointer-events` — none of which
       VisibilitySection touches — and omitted the `--hide-<breakpoint>` custom
       properties, which are all it touches. Both halves were live defects:

       1. `styleKeys` is what `defineSection` slices `ctx.styles` down to, so
          the component was handed a bag that could never contain
          `--hide-desktop`. The three toggles therefore ALWAYS read "visible"
          and the collapsed preview ("hidden on 2") could never appear — you
          could hide an element on mobile and the panel would keep saying it
          was shown.
       2. `styleKeys` is also what `sectionApplies` counts, so declaring
          `display` opened VISIBILITY for every element that has one. Measured
          live: it was open on Flex, Grid, Container and Image, where all six
          profile boards (807:8342/8412/8475/8521/8567/8614) draw it shut —
          and on the FLEX board it displaced SIZE from the footer's count. */
    Component: VisibilitySection,
    styleKeys: ["--hide-desktop", "--hide-tablet", "--hide-mobile"],
    adaptProps: adaptBaseStyleProps,
  }),
};
