import type { StarterDS } from "./types";

export const vercelMono: StarterDS = {
  id: "vercel-mono",
  name: "Vercel Mono",
  description: "Pure monochrome, technical, sharp.",
  tokens: [
    { id: "color-primary",    name: "Primary",    value: "#171717", category: "colors", cssVar: "--buildrick-design-color-primary",    type: "color", kind: "color", group: "brand",   darkValue: "#FAFAFA" },
    { id: "color-secondary",  name: "Secondary",  value: "#525252", category: "colors", cssVar: "--buildrick-design-color-secondary",  type: "color", kind: "color", group: "brand",   darkValue: "#A3A3A3" },
    { id: "color-accent",     name: "Accent",     value: "#0070F3", category: "colors", cssVar: "--buildrick-design-color-accent",     type: "color", kind: "color", group: "brand",   darkValue: "#3291FF" },
    { id: "color-background", name: "Background", value: "#FAFAFA", category: "colors", cssVar: "--buildrick-design-color-background", type: "color", kind: "color", group: "surface", darkValue: "#0A0A0A" },
    { id: "color-text",       name: "Text",       value: "#171717", category: "colors", cssVar: "--buildrick-design-color-text",       type: "color", kind: "color", group: "surface", darkValue: "#EDEDED" },
    { id: "color-muted",      name: "Muted",      value: "#737373", category: "colors", cssVar: "--buildrick-design-color-muted",      type: "color", kind: "color", group: "surface", darkValue: "#A3A3A3" },
    { id: "color-border",     name: "Border",     value: "#EAEAEA", category: "colors", cssVar: "--buildrick-design-color-border",     type: "color", kind: "color", group: "surface", darkValue: "#333333" },
    { id: "color-success",    name: "Success",    value: "#0070F3", category: "colors", cssVar: "--buildrick-design-color-success",    type: "color", kind: "color", group: "state",   darkValue: "#3291FF" },
    { id: "color-error",      name: "Error",      value: "#E00", category: "colors", cssVar: "--buildrick-design-color-error",      type: "color", kind: "color", group: "state",   darkValue: "#F33" },
  ],
};
