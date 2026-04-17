/**
 * Aquibra Themes
 * @license BSD-3-Clause
 */

/**
 * Cobalt accent + dark surfaces — single source of truth for tokens applied
 * at runtime. Values come from packages/editor/src/themes/default.css and
 * DESIGN.md. The legacy indigo/violet defaults were the source of low-contrast
 * UI bugs in the History tab; the migration to cobalt is documented in
 * buildrik/CLAUDE.md.
 */
export const defaultTheme = {
  primary: "#2d6dff",
  primaryHover: "#4B8DFF",
  primaryActive: "#1E58D9",
  primaryLight: "rgba(45, 109, 255, 0.12)",
  primarySubtle: "rgba(45, 109, 255, 0.06)",
  secondary: "#2d6dff",
  bgDark: "#0c0c14",
  bgPanel: "#14141f",
  textPrimary: "#F5F5F0",
  textMuted: "#908D85",
  border: "rgba(255, 255, 255, 0.08)",
};

export function applyTheme(theme: Partial<typeof defaultTheme> = {}) {
  const merged = { ...defaultTheme, ...theme };
  const root = document.documentElement;

  root.style.setProperty("--aqb-primary", merged.primary);
  root.style.setProperty("--aqb-primary-hover", merged.primaryHover);
  root.style.setProperty("--aqb-primary-active", merged.primaryActive);
  root.style.setProperty("--aqb-primary-light", merged.primaryLight);
  root.style.setProperty("--aqb-primary-subtle", merged.primarySubtle);
  root.style.setProperty("--aqb-secondary", merged.secondary);
  root.style.setProperty("--aqb-bg-dark", merged.bgDark);
  root.style.setProperty("--aqb-bg-panel", merged.bgPanel);
  root.style.setProperty("--aqb-text-primary", merged.textPrimary);
  root.style.setProperty("--aqb-text-muted", merged.textMuted);
  root.style.setProperty("--aqb-border", merged.border);
}
