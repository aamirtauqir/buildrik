import type { StarterDS } from "./types";

export const appleMinimal: StarterDS = {
  id: "apple-minimal",
  name: "Apple Minimal",
  description: "Almost monochrome, restrained. Premium product feel.",
  tokens: [
    { id: "color-primary",    name: "Primary", category: "colors", cssVar: "--buildrick-design-color-primary",    type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#1D1D1F" }, dark: { value: "#F5F5F7" } }, group: "brand" },
    { id: "color-secondary",  name: "Secondary", category: "colors", cssVar: "--buildrick-design-color-secondary",  type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#86868B" }, dark: { value: "#A1A1A6" } }, group: "brand" },
    { id: "color-accent",     name: "Accent", category: "colors", cssVar: "--buildrick-design-color-accent",     type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#0071E3" }, dark: { value: "#2997FF" } }, group: "brand" },
    { id: "color-background", name: "Background", category: "colors", cssVar: "--buildrick-design-color-background", type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#FBFBFD" }, dark: { value: "#1D1D1F" } }, group: "surface" },
    { id: "color-text",       name: "Text", category: "colors", cssVar: "--buildrick-design-color-text",       type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#1D1D1F" }, dark: { value: "#F5F5F7" } }, group: "surface" },
    { id: "color-muted",      name: "Muted", category: "colors", cssVar: "--buildrick-design-color-muted",      type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#6E6E73" }, dark: { value: "#A1A1A6" } }, group: "surface" },
    { id: "color-border",     name: "Border", category: "colors", cssVar: "--buildrick-design-color-border",     type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#D2D2D7" }, dark: { value: "#3E3E40" } }, group: "surface" },
    { id: "color-success",    name: "Success", category: "colors", cssVar: "--buildrick-design-color-success",    type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#34C759" }, dark: { value: "#30D158" } }, group: "state" },
    { id: "color-error",      name: "Error", category: "colors", cssVar: "--buildrick-design-color-error",      type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#FF3B30" }, dark: { value: "#FF453A" } }, group: "state" },
  ],
};
