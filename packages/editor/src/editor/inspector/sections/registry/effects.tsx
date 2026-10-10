/**
 * Effects registry entries (board 3): Opacity and Shadow arrive expanded
 * (FG-022); Filters and Transform & motion are "+" rows until the element
 * carries a value, and Advanced arrives closed with a summary ("Cursor: auto
 * · Blend: normal") — those three under "More effects" (InspectorTabContent).
 * One section per CSS property family; no property is written by two of them.
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, type AnySectionEntry } from "./_shared";
import { EffectsAdvancedSection } from "../effects/EffectsAdvancedSection";
import { FiltersSection } from "../effects/FiltersSection";
import { OpacitySection } from "../effects/OpacitySection";
import { ShadowSection } from "../effects/ShadowSection";
import { TransformMotionSection } from "../effects/TransformMotionSection";

const set = (v: string | undefined) => Boolean(v) && v !== "none";

export const EFFECTS_SECTIONS: Record<string, AnySectionEntry> = {
  opacity: defineSection({
    tab: "effects",
    title: "Opacity",
    /* FG-022: Opacity and Shadow arrive expanded. */
    open: "open",
    Component: OpacitySection,
    styleKeys: ["opacity"],
    adaptProps: adaptBaseStyleProps,
  }),

  shadow: defineSection({
    tab: "effects",
    title: "Shadow",
    open: "open",
    hasValue: (ctx) => set(ctx.authoredStyles["box-shadow"]),
    Component: ShadowSection,
    styleKeys: ["box-shadow"],
    adaptProps: adaptBaseStyleProps,
  }),

  filters: defineSection({
    tab: "effects",
    title: "Filters",
    open: "valued",
    hasValue: (ctx) => set(ctx.authoredStyles.filter),
    Component: FiltersSection,
    styleKeys: ["filter"],
    adaptProps: adaptBaseStyleProps,
  }),

  "transform-motion": defineSection({
    tab: "effects",
    title: "Transform & motion",
    open: "valued",
    hasValue: (ctx) =>
      ["transform", "transition", "transition-property", "transition-duration"].some((k) => set(ctx.authoredStyles[k])),
    Component: TransformMotionSection,
    styleKeys: ["transform", "transition", "transition-property", "transition-duration", "transition-delay", "transition-timing-function"],
    adaptProps: adaptBaseStyleProps,
  }),

  "effects-advanced": defineSection({
    tab: "effects",
    title: "Advanced",
    open: "closed",
    summary: (ctx) =>
      `Cursor: ${ctx.authoredStyles.cursor || "auto"} · Blend: ${ctx.authoredStyles["mix-blend-mode"] || "normal"}`,
    Component: EffectsAdvancedSection,
    styleKeys: ["cursor", "mix-blend-mode", "text-shadow", "will-change"],
    adaptProps: adaptBaseStyleProps,
  }),
};
