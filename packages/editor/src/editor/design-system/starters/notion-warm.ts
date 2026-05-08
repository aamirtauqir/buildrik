import type { StarterDS } from "./types";

export const notionWarm: StarterDS = {
  id: "notion-warm",
  name: "Notion Warm",
  description: "Warm neutrals + tan accent. Friendly editorial feel.",
  tokens: [
    { id: "color-primary",    name: "Primary",    value: "#37352F", category: "colors", cssVar: "--buildrick-design-color-primary",    type: "color", kind: "color", group: "brand",   darkValue: "#E2E0DD" },
    { id: "color-secondary",  name: "Secondary",  value: "#787774", category: "colors", cssVar: "--buildrick-design-color-secondary",  type: "color", kind: "color", group: "brand",   darkValue: "#9B9A97" },
    { id: "color-accent",     name: "Accent",     value: "#D9730D", category: "colors", cssVar: "--buildrick-design-color-accent",     type: "color", kind: "color", group: "brand",   darkValue: "#FF9442" },
    { id: "color-background", name: "Background", value: "#FFFFFE", category: "colors", cssVar: "--buildrick-design-color-background", type: "color", kind: "color", group: "surface", darkValue: "#191919" },
    { id: "color-text",       name: "Text",       value: "#37352F", category: "colors", cssVar: "--buildrick-design-color-text",       type: "color", kind: "color", group: "surface", darkValue: "#E2E0DD" },
    { id: "color-muted",      name: "Muted",      value: "#787774", category: "colors", cssVar: "--buildrick-design-color-muted",      type: "color", kind: "color", group: "surface", darkValue: "#9B9A97" },
    { id: "color-border",     name: "Border",     value: "#E9E9E7", category: "colors", cssVar: "--buildrick-design-color-border",     type: "color", kind: "color", group: "surface", darkValue: "#373737" },
    { id: "color-success",    name: "Success",    value: "#448361", category: "colors", cssVar: "--buildrick-design-color-success",    type: "color", kind: "color", group: "state",   darkValue: "#529E72" },
    { id: "color-error",      name: "Error",      value: "#D44C47", category: "colors", cssVar: "--buildrick-design-color-error",      type: "color", kind: "color", group: "state",   darkValue: "#FF7369" },
  ],
};
