/**
 * Effects registry entries (board 3): Opacity, Shadow, Filters, Transform &
 * motion — each a "+" row until it carries a value — and Advanced, closed
 * with a summary ("Cursor: auto · Blend: normal").
 *
 * W1 points them at today's sections; lane L2-C splits "More effects" into
 * the new Filters / Transform & motion / Advanced bodies and merges the
 * shadow presets. Until then Transform & motion and Advanced both open the
 * existing "More effects" controls.
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, type AnySectionEntry } from "./_shared";
import { EffectsSection } from "../EffectsSection";
import { BlurSection, OpacitySection, ShadowSection } from "../EffectsBasicSections";

const MORE_EFFECTS_KEYS = ["box-shadow", "filter", "transform", "cursor", "mix-blend-mode", "transition", "transition-property", "transition-duration", "transition-delay", "transition-timing-function", "text-shadow", "will-change"];

export const EFFECTS_SECTIONS: Record<string, AnySectionEntry> = {
  opacity: defineSection({
    tab: "effects",
    title: "Opacity",
    open: "valued",
    Component: OpacitySection,
    styleKeys: ["opacity"],
    adaptProps: adaptBaseStyleProps,
  }),

  shadow: defineSection({
    tab: "effects",
    title: "Shadow",
    open: "valued",
    Component: ShadowSection,
    styleKeys: ["box-shadow"],
    adaptProps: adaptBaseStyleProps,
  }),

  filters: defineSection({
    tab: "effects",
    title: "Filters",
    open: "valued",
    Component: BlurSection,
    styleKeys: ["filter"],
    adaptProps: adaptBaseStyleProps,
  }),

  "transform-motion": defineSection({
    tab: "effects",
    title: "Transform & motion",
    open: "valued",
    hasValue: (ctx) =>
      ["transform", "transition", "transition-property", "transition-duration"].some((k) => Boolean(ctx.authoredStyles[k])),
    Component: EffectsSection,
    styleKeys: MORE_EFFECTS_KEYS,
    adaptProps: adaptBaseStyleProps,
  }),

  "effects-advanced": defineSection({
    tab: "effects",
    title: "Advanced",
    open: "closed",
    summary: (ctx) =>
      `Cursor: ${ctx.authoredStyles.cursor || "auto"} · Blend: ${ctx.authoredStyles["mix-blend-mode"] || "normal"}`,
    Component: EffectsSection,
    styleKeys: MORE_EFFECTS_KEYS,
    adaptProps: adaptBaseStyleProps,
  }),
};
