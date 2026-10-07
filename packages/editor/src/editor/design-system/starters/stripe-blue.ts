import type { StarterDS } from "./types";

export const stripeBlue: StarterDS = {
  id: "stripe-blue",
  name: "Stripe Blue",
  description: "Clean blue brand. Bright, financial-friendly, high-contrast.",
  tokens: [
    { id: "color-primary",    name: "Primary", category: "colors", cssVar: "--buildrick-design-color-primary",    type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#635BFF" }, dark: { value: "#897EFF" } }, group: "brand" },
    { id: "color-secondary",  name: "Secondary", category: "colors", cssVar: "--buildrick-design-color-secondary",  type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#0A2540" }, dark: { value: "#425466" } }, group: "brand" },
    { id: "color-accent",     name: "Accent", category: "colors", cssVar: "--buildrick-design-color-accent",     type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#00D4FF" }, dark: { value: "#5BE3FF" } }, group: "brand" },
    { id: "color-background", name: "Background", category: "colors", cssVar: "--buildrick-design-color-background", type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#FFFFFF" }, dark: { value: "#0A2540" } }, group: "surface" },
    { id: "color-text",       name: "Text", category: "colors", cssVar: "--buildrick-design-color-text",       type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#1A1F36" }, dark: { value: "#F5F6FA" } }, group: "surface" },
    { id: "color-muted",      name: "Muted", category: "colors", cssVar: "--buildrick-design-color-muted",      type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#697386" }, dark: { value: "#B9BFCB" } }, group: "surface" },
    { id: "color-border",     name: "Border", category: "colors", cssVar: "--buildrick-design-color-border",     type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#E3E8EE" }, dark: { value: "#425466" } }, group: "surface" },
    { id: "color-success",    name: "Success", category: "colors", cssVar: "--buildrick-design-color-success",    type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#0F9D58" }, dark: { value: "#34D399" } }, group: "state" },
    { id: "color-error",      name: "Error", category: "colors", cssVar: "--buildrick-design-color-error",      type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#DF1B41" }, dark: { value: "#F87171" } }, group: "state" },
  ],
};
