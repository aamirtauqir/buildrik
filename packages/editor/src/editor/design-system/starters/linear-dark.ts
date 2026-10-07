import type { StarterDS } from "./types";

export const linearDark: StarterDS = {
  id: "linear-dark",
  name: "Linear Dark",
  description: "Dark-first surface with electric accent. Tool-builder default.",
  tokens: [
    { id: "color-primary",    name: "Primary", category: "colors", cssVar: "--buildrick-design-color-primary",    type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#5E6AD2" }, dark: { value: "#7B85E7" } }, group: "brand" },
    { id: "color-secondary",  name: "Secondary", category: "colors", cssVar: "--buildrick-design-color-secondary",  type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#3F4253" }, dark: { value: "#5C6076" } }, group: "brand" },
    { id: "color-accent",     name: "Accent", category: "colors", cssVar: "--buildrick-design-color-accent",     type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#26B5CE" }, dark: { value: "#48C8DD" } }, group: "brand" },
    { id: "color-background", name: "Background", category: "colors", cssVar: "--buildrick-design-color-background", type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#F4F5F8" }, dark: { value: "#1B1C22" } }, group: "surface" },
    { id: "color-text",       name: "Text", category: "colors", cssVar: "--buildrick-design-color-text",       type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#15192C" }, dark: { value: "#F4F5F8" } }, group: "surface" },
    { id: "color-muted",      name: "Muted", category: "colors", cssVar: "--buildrick-design-color-muted",      type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#62687C" }, dark: { value: "#9098A8" } }, group: "surface" },
    { id: "color-border",     name: "Border", category: "colors", cssVar: "--buildrick-design-color-border",     type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#D8DAE0" }, dark: { value: "#2D2E36" } }, group: "surface" },
    { id: "color-success",    name: "Success", category: "colors", cssVar: "--buildrick-design-color-success",    type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#3F8F58" }, dark: { value: "#4EAB6C" } }, group: "state" },
    { id: "color-error",      name: "Error", category: "colors", cssVar: "--buildrick-design-color-error",      type: "color", kind: "color", layer: "semantic", modes: { light: { value: "#EB5757" }, dark: { value: "#F47272" } }, group: "state" },
  ],
};
