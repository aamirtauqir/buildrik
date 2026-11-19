/**
 * Effects registry entries (board 3): Opacity and Shadow arrive expanded
 * (FG-022); Filters and Transform & motion are "+" rows until the element
 * carries a value, and Advanced arrives closed with a summary ("Cursor: auto
 * · Blend: normal") — those three under "More effects" (InspectorTabContent).
 * One section per CSS property family; no property is written by two of them.
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, setSummary, type AnySectionEntry } from "./_shared";
import { EffectsAdvancedSection } from "../effects/EffectsAdvancedSection";
import { FiltersSection } from "../effects/FiltersSection";
import { OpacitySection } from "../effects/OpacitySection";
import { ShadowSection } from "../effects/ShadowSection";
import { TransformMotionSection } from "../effects/TransformMotionSection";

const set = (v: string | undefined) => Boolean(v) && v !== "none";
const TRANSFORM_KEYS = ["transform", "transition", "transition-property", "transition-duration", "transition-delay", "transition-timing-function"];
const ADVANCED_KEYS = ["cursor", "mix-blend-mode", "text-shadow", "will-change"];

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

  /* 2L9 161:12525: "Transform and transition  2 set", shut. */
  "transform-motion": defineSection({
    tab: "effects",
    title: "Transform and transition",
    open: "closed",
    summary: setSummary(TRANSFORM_KEYS),
    Component: TransformMotionSection,
    styleKeys: TRANSFORM_KEYS,
    adaptProps: adaptBaseStyleProps,
  }),

  /* 2L9 36:2: "Advanced effects  None". */
  "effects-advanced": defineSection({
    tab: "effects",
    title: "Advanced effects",
    open: "closed",
    summary: setSummary(ADVANCED_KEYS),
    Component: EffectsAdvancedSection,
    styleKeys: ADVANCED_KEYS,
    adaptProps: adaptBaseStyleProps,
  }),
};
