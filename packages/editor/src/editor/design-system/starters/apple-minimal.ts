import type { StarterDS } from "./types";

export const appleMinimal: StarterDS = {
  id: "apple-minimal",
  name: "Apple Minimal",
  description: "Almost monochrome, restrained. Premium product feel.",
  tokens: [
    { id: "color-primary",    name: "Primary",    value: "#1D1D1F", category: "colors", cssVar: "--buildrick-design-color-primary",    type: "color", kind: "color", group: "brand",   darkValue: "#F5F5F7" },
    { id: "color-secondary",  name: "Secondary",  value: "#86868B", category: "colors", cssVar: "--buildrick-design-color-secondary",  type: "color", kind: "color", group: "brand",   darkValue: "#A1A1A6" },
    { id: "color-accent",     name: "Accent",     value: "#0071E3", category: "colors", cssVar: "--buildrick-design-color-accent",     type: "color", kind: "color", group: "brand",   darkValue: "#2997FF" },
    { id: "color-background", name: "Background", value: "#FBFBFD", category: "colors", cssVar: "--buildrick-design-color-background", type: "color", kind: "color", group: "surface", darkValue: "#1D1D1F" },
    { id: "color-text",       name: "Text",       value: "#1D1D1F", category: "colors", cssVar: "--buildrick-design-color-text",       type: "color", kind: "color", group: "surface", darkValue: "#F5F5F7" },
    { id: "color-muted",      name: "Muted",      value: "#6E6E73", category: "colors", cssVar: "--buildrick-design-color-muted",      type: "color", kind: "color", group: "surface", darkValue: "#A1A1A6" },
    { id: "color-border",     name: "Border",     value: "#D2D2D7", category: "colors", cssVar: "--buildrick-design-color-border",     type: "color", kind: "color", group: "surface", darkValue: "#3E3E40" },
    { id: "color-success",    name: "Success",    value: "#34C759", category: "colors", cssVar: "--buildrick-design-color-success",    type: "color", kind: "color", group: "state",   darkValue: "#30D158" },
    { id: "color-error",      name: "Error",      value: "#FF3B30", category: "colors", cssVar: "--buildrick-design-color-error",      type: "color", kind: "color", group: "state",   darkValue: "#FF453A" },
  ],
};
