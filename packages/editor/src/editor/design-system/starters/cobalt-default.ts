import type { StarterDS } from "./types";

/**
 * Buildrik's own DESIGN.md theme + warm slate neutrals.
 *
 * The accent followed DESIGN.md to #1A56DB with the rest of the product on
 * 2026-08-16. It sat on the retired cobalt #2D6DFF while claiming in its own
 * doc line to be "Buildrik's own theme", which stopped being true when the
 * product moved. The id stays `cobalt-default` — it is persisted on projects
 * that already picked this starter, and renaming it would orphan them.
 */
export const cobaltDefault: StarterDS = {
  id: "cobalt-default",
  name: "Buildrik Default",
  description: "Buildrick's own — brand blue on warm slate neutrals.",
  tokens: [
    { id: "color-primary",    name: "Primary", category: "colors", cssVar: "--buildrick-design-color-primary",    type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#1A56DB" }, dark: { value: "#4B83E8" } }, group: "brand" },
    { id: "color-secondary",  name: "Secondary", category: "colors", cssVar: "--buildrick-design-color-secondary",  type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#64748B" }, dark: { value: "#94A3B8" } }, group: "brand" },
    { id: "color-accent",     name: "Accent", category: "colors", cssVar: "--buildrick-design-color-accent",     type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#1A56DB" }, dark: { value: "#4B83E8" } }, group: "brand" },
    { id: "color-background", name: "Background", category: "colors", cssVar: "--buildrick-design-color-background", type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#F8FAFC" }, dark: { value: "#0F172A" } }, group: "surface" },
    { id: "color-text",       name: "Text", category: "colors", cssVar: "--buildrick-design-color-text",       type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#334155" }, dark: { value: "#E2E8F0" } }, group: "surface" },
    { id: "color-muted",      name: "Muted", category: "colors", cssVar: "--buildrick-design-color-muted",      type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#71717A" }, dark: { value: "#A1A1AA" } }, group: "surface" },
    { id: "color-border",     name: "Border", category: "colors", cssVar: "--buildrick-design-color-border",     type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#27272A" }, dark: { value: "#3F3F46" } }, group: "surface" },
    { id: "color-success",    name: "Success", category: "colors", cssVar: "--buildrick-design-color-success",    type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#22C55E" }, dark: { value: "#4ADE80" } }, group: "state" },
    { id: "color-error",      name: "Error", category: "colors", cssVar: "--buildrick-design-color-error",      type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#EF4444" }, dark: { value: "#F87171" } }, group: "state" },
  ],
};
