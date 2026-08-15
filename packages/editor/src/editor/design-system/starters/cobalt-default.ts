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
    { id: "color-primary",    name: "Primary",    value: "#1A56DB", category: "colors", cssVar: "--buildrick-design-color-primary",    type: "color", kind: "color", group: "brand",   darkValue: "#4B83E8" },
    { id: "color-secondary",  name: "Secondary",  value: "#64748B", category: "colors", cssVar: "--buildrick-design-color-secondary",  type: "color", kind: "color", group: "brand",   darkValue: "#94A3B8" },
    { id: "color-accent",     name: "Accent",     value: "#1A56DB", category: "colors", cssVar: "--buildrick-design-color-accent",     type: "color", kind: "color", group: "brand",   darkValue: "#4B83E8" },
    { id: "color-background", name: "Background", value: "#F8FAFC", category: "colors", cssVar: "--buildrick-design-color-background", type: "color", kind: "color", group: "surface", darkValue: "#0F172A" },
    { id: "color-text",       name: "Text",       value: "#334155", category: "colors", cssVar: "--buildrick-design-color-text",       type: "color", kind: "color", group: "surface", darkValue: "#E2E8F0" },
    { id: "color-muted",      name: "Muted",      value: "#71717A", category: "colors", cssVar: "--buildrick-design-color-muted",      type: "color", kind: "color", group: "surface", darkValue: "#A1A1AA" },
    { id: "color-border",     name: "Border",     value: "#27272A", category: "colors", cssVar: "--buildrick-design-color-border",     type: "color", kind: "color", group: "surface", darkValue: "#3F3F46" },
    { id: "color-success",    name: "Success",    value: "#22C55E", category: "colors", cssVar: "--buildrick-design-color-success",    type: "color", kind: "color", group: "state",   darkValue: "#4ADE80" },
    { id: "color-error",      name: "Error",      value: "#EF4444", category: "colors", cssVar: "--buildrick-design-color-error",      type: "color", kind: "color", group: "state",   darkValue: "#F87171" },
  ],
};
