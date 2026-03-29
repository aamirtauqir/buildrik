/**
 * Aquibra Themes
 * @license BSD-3-Clause
 */

export const defaultTheme = {
  primary: "#00d4aa",
  primaryHover: "#00b894",
  secondary: "#7c3aed",
  bgDark: "#0d0d1a",
  bgPanel: "#1a1a2e",
  textPrimary: "#f8fafc",
  textMuted: "#64748b",
  border: "#334155",
};

export function applyTheme(theme: Partial<typeof defaultTheme> = {}) {
  const merged = { ...defaultTheme, ...theme };
  const root = document.documentElement;

  root.style.setProperty("--aqb-primary", merged.primary);
  root.style.setProperty("--aqb-primary-hover", merged.primaryHover);
  root.style.setProperty("--aqb-secondary", merged.secondary);
  root.style.setProperty("--aqb-bg-dark", merged.bgDark);
  root.style.setProperty("--aqb-bg-panel", merged.bgPanel);
  root.style.setProperty("--aqb-text-primary", merged.textPrimary);
  root.style.setProperty("--aqb-text-muted", merged.textMuted);
  root.style.setProperty("--aqb-border", merged.border);
}
