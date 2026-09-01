/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source: Figma file g4GzQFqzNYz5sosz1QtZXC (Buildrick — Product)
 * Regenerate: node scripts/tokens/generate.mjs
 */

export const palette = {
  "blue-50": "#EBF5FF",
  "blue-100": "#E1EFFE",
  "blue-200": "#C3DDFD",
  "blue-300": "#A4CAFE",
  "blue-400": "#76A9FA",
  "blue-500": "#3F83F8",
  "blue-600": "#1C64F2",
  "blue-700": "#1A56DB",
  "blue-800": "#1E429F",
  "blue-900": "#233876",
  "gray-50": "#F9FAFB",
  "gray-100": "#F3F4F6",
  "gray-200": "#E5E7EB",
  "gray-300": "#D1D5DB",
  "gray-400": "#9CA3AF",
  "gray-500": "#6B7280",
  "gray-600": "#4B5563",
  "gray-700": "#374151",
  "gray-800": "#1F2937",
  "gray-900": "#111827",
  "red-50": "#FDF2F2",
  "red-100": "#FDE8E8",
  "red-500": "#F05252",
  "red-600": "#E02424",
  "red-700": "#C81E1E",
  "red-800": "#9B1C1C",
  "green-50": "#F3FAF7",
  "green-100": "#DEF7EC",
  "green-400": "#31C48D",
  "green-500": "#0E9F6E",
  "green-600": "#057A55",
  "green-700": "#046C4E",
  "green-800": "#03543F",
  "yellow-50": "#FDFDEA",
  "yellow-100": "#FDF6B2",
  "yellow-300": "#FACA15",
  "yellow-400": "#E3A008",
  "yellow-500": "#C27803",
  "yellow-800": "#723B13",
  "purple-50": "#F6F5FF",
  "purple-100": "#EDEBFE",
  "purple-500": "#9061F9",
  "purple-600": "#7E3AF2",
  "purple-700": "#6C2BD9",
  "purple-800": "#5521B5",
} as const;

export const color = {
  "bg-app": "#F3F4F6",
  "bg-panel": "#FFFFFF",
  "bg-subtle": "#F3F4F6",
  "bg-card": "#FFFFFF",
  "bg-elevated": "#FFFFFF",
  "border": "#E5E7EB",
  "border-medium": "#D1D5DB",
  "border-strong": "#9CA3AF",
  "border-input": "#9CA3AF",
  "ink": "#111827",
  "ink-soft": "#4B5563",
  "ink-muted": "#6B7280",
  "ink-disabled": "#D1D5DB",
  "accent": "#1A56DB",
  "accent-hover": "#1E429F",
  "accent-pressed": "#233876",
  "accent-subtle": "#E1EFFE",
  "accent-tint": "#EBF5FF",
  "accent-text": "#1A56DB",
  "accent-on": "#FFFFFF",
  "success": "#0E9F6E",
  "success-tint": "#DEF7EC",
  "success-text": "#057A55",
  "warning": "#C27803",
  "warning-tint": "#FDFDEA",
  "warning-text": "#723B13",
  "error": "#E02424",
  "error-tint": "#FDE8E8",
  "error-text": "#C81E1E",
} as const;

export const space = [2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 64] as const;

export const radius = {
  "sm": 4,
  "md": 6,
  "lg": 8,
  "full": 9999,
} as const;

export const size = {
  "row-dense": 28,
  "row": 32,
  "header": 44,
  "topbar": 56,
  "row-tall": 64,
  "rail": 60,
  "drawer": 280,
  "panel-right": 360,
  "inspector": 300,
  "nav": 240,
  "footer": 32,
} as const;

export const z = {
  "canvas": 0,
  "chrome": 10,
  "drawer": 20,
  "topbar": 30,
  "popover": 40,
  "overlay": 50,
  "modal": 60,
  "cmdk": 70,
  "toast": 80,
  "tooltip": 90,
} as const;

export const motion = {
  "fast": 100,
  "base": 160,
  "slow": 240,
} as const;

export const font = {
  "ui": "\"Inter\", \"Inter Tight\", sans-serif",
  "mono": "\"Geist Mono\", \"SF Mono\", Menlo, Consolas, monospace",
} as const;

export const text = {
  "11": 11,
  "12": 12,
  "13": 13,
  "14": 14,
  "16": 16,
  "20": 20,
  "24": 24,
} as const;

export const weight = {
  "regular": 400,
  "medium": 500,
  "semibold": 600,
} as const;

export type ColorToken = keyof typeof color;
export type PaletteToken = keyof typeof palette;
