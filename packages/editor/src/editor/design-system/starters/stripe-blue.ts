import type { StarterDS } from "./types";

export const stripeBlue: StarterDS = {
  id: "stripe-blue",
  name: "Stripe Blue",
  description: "Clean blue brand. Bright, financial-friendly, high-contrast.",
  tokens: [
    { id: "color-primary",    name: "Primary",    value: "#635BFF", category: "colors", cssVar: "--buildrick-design-color-primary",    type: "color", kind: "color", group: "brand",   darkValue: "#897EFF" },
    { id: "color-secondary",  name: "Secondary",  value: "#0A2540", category: "colors", cssVar: "--buildrick-design-color-secondary",  type: "color", kind: "color", group: "brand",   darkValue: "#425466" },
    { id: "color-accent",     name: "Accent",     value: "#00D4FF", category: "colors", cssVar: "--buildrick-design-color-accent",     type: "color", kind: "color", group: "brand",   darkValue: "#5BE3FF" },
    { id: "color-background", name: "Background", value: "#FFFFFF", category: "colors", cssVar: "--buildrick-design-color-background", type: "color", kind: "color", group: "surface", darkValue: "#0A2540" },
    { id: "color-text",       name: "Text",       value: "#1A1F36", category: "colors", cssVar: "--buildrick-design-color-text",       type: "color", kind: "color", group: "surface", darkValue: "#F5F6FA" },
    { id: "color-muted",      name: "Muted",      value: "#697386", category: "colors", cssVar: "--buildrick-design-color-muted",      type: "color", kind: "color", group: "surface", darkValue: "#B9BFCB" },
    { id: "color-border",     name: "Border",     value: "#E3E8EE", category: "colors", cssVar: "--buildrick-design-color-border",     type: "color", kind: "color", group: "surface", darkValue: "#425466" },
    { id: "color-success",    name: "Success",    value: "#0F9D58", category: "colors", cssVar: "--buildrick-design-color-success",    type: "color", kind: "color", group: "state",   darkValue: "#34D399" },
    { id: "color-error",      name: "Error",      value: "#DF1B41", category: "colors", cssVar: "--buildrick-design-color-error",      type: "color", kind: "color", group: "state",   darkValue: "#F87171" },
  ],
};
