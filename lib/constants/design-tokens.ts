// PRD Section 2: Design System tokens for dashboard
export const colors = {
  primary: "#E42313",
  destructive: "#7F1D1D",
  scrim: "#0000004D",
  bgPage: "#FAFAFA",
  bgSurface: "#FFFFFF",
  bgSubtle: "#F4F4F4",
  borderDefault: "#E8E8E8",
  borderStrong: "#D4D4D4",
  textPrimary: "#0D0D0D",
  textSecondary: "#7A7A7A",
  textMuted: "#B0B0B0",
  success: "#22C55E",
  warning: "#EA580C",
  error: "#E42313",
  info: "#3B82F6",
} as const;

export const toast = {
  success: { border: "#22C55E", bg: "#F0FDF4" },
  error: { border: "#EF4444", bg: "#FEF2F2" },
  warning: { border: "#EAB308", bg: "#FEFCE8" },
  info: { border: "#3B82F6", bg: "#EFF6FF" },
} as const;

export const spacing = {
  xs: "4px", sm: "8px", md: "12px", base: "16px", lg: "20px", xl: "24px",
} as const;

export const radius = {
  sm: "4px", md: "8px", lg: "12px", xl: "16px", full: "999px",
} as const;

export const layout = {
  sidebarWidth: 220,
  topbarHeight: 56,
  contentMaxWidth: 1220,
  contentPadding: 32,
} as const;
