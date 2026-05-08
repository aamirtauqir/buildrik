import type { StarterDS } from "./types";

export const linearDark: StarterDS = {
  id: "linear-dark",
  name: "Linear Dark",
  description: "Dark-first surface with electric accent. Tool-builder default.",
  tokens: [
    { id: "color-primary",    name: "Primary",    value: "#5E6AD2", category: "colors", cssVar: "--buildrick-design-color-primary",    type: "color", kind: "color", group: "brand",   darkValue: "#7B85E7" },
    { id: "color-secondary",  name: "Secondary",  value: "#3F4253", category: "colors", cssVar: "--buildrick-design-color-secondary",  type: "color", kind: "color", group: "brand",   darkValue: "#5C6076" },
    { id: "color-accent",     name: "Accent",     value: "#26B5CE", category: "colors", cssVar: "--buildrick-design-color-accent",     type: "color", kind: "color", group: "brand",   darkValue: "#48C8DD" },
    { id: "color-background", name: "Background", value: "#F4F5F8", category: "colors", cssVar: "--buildrick-design-color-background", type: "color", kind: "color", group: "surface", darkValue: "#1B1C22" },
    { id: "color-text",       name: "Text",       value: "#15192C", category: "colors", cssVar: "--buildrick-design-color-text",       type: "color", kind: "color", group: "surface", darkValue: "#F4F5F8" },
    { id: "color-muted",      name: "Muted",      value: "#62687C", category: "colors", cssVar: "--buildrick-design-color-muted",      type: "color", kind: "color", group: "surface", darkValue: "#9098A8" },
    { id: "color-border",     name: "Border",     value: "#D8DAE0", category: "colors", cssVar: "--buildrick-design-color-border",     type: "color", kind: "color", group: "surface", darkValue: "#2D2E36" },
    { id: "color-success",    name: "Success",    value: "#3F8F58", category: "colors", cssVar: "--buildrick-design-color-success",    type: "color", kind: "color", group: "state",   darkValue: "#4EAB6C" },
    { id: "color-error",      name: "Error",      value: "#EB5757", category: "colors", cssVar: "--buildrick-design-color-error",      type: "color", kind: "color", group: "state",   darkValue: "#F47272" },
  ],
};
