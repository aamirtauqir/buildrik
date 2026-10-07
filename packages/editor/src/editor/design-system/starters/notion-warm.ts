import type { StarterDS } from "./types";

export const notionWarm: StarterDS = {
  id: "notion-warm",
  name: "Notion Warm",
  description: "Warm neutrals + tan accent. Friendly editorial feel.",
  tokens: [
    { id: "color-primary",    name: "Primary", category: "colors", cssVar: "--buildrick-design-color-primary",    type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#37352F" }, dark: { value: "#E2E0DD" } }, group: "brand" },
    { id: "color-secondary",  name: "Secondary", category: "colors", cssVar: "--buildrick-design-color-secondary",  type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#787774" }, dark: { value: "#9B9A97" } }, group: "brand" },
    { id: "color-accent",     name: "Accent", category: "colors", cssVar: "--buildrick-design-color-accent",     type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#D9730D" }, dark: { value: "#FF9442" } }, group: "brand" },
    { id: "color-background", name: "Background", category: "colors", cssVar: "--buildrick-design-color-background", type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#FFFFFE" }, dark: { value: "#191919" } }, group: "surface" },
    { id: "color-text",       name: "Text", category: "colors", cssVar: "--buildrick-design-color-text",       type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#37352F" }, dark: { value: "#E2E0DD" } }, group: "surface" },
    { id: "color-muted",      name: "Muted", category: "colors", cssVar: "--buildrick-design-color-muted",      type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#787774" }, dark: { value: "#9B9A97" } }, group: "surface" },
    { id: "color-border",     name: "Border", category: "colors", cssVar: "--buildrick-design-color-border",     type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#E9E9E7" }, dark: { value: "#373737" } }, group: "surface" },
    { id: "color-success",    name: "Success", category: "colors", cssVar: "--buildrick-design-color-success",    type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#448361" }, dark: { value: "#529E72" } }, group: "state" },
    { id: "color-error",      name: "Error", category: "colors", cssVar: "--buildrick-design-color-error",      type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#D44C47" }, dark: { value: "#FF7369" } }, group: "state" },
  ],
};
