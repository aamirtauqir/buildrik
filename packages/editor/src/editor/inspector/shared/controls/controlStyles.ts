/**
 * Shared styles for Pro Inspector controls
 * Single source of truth for control styling using CSS variables
 *
 * @description All values reference CSS variables from themes/default.css
 * for consistent theming and easy maintenance.
 *
 * @license BSD-3-Clause
 */

import type * as React from "react";

// ============================================================================
// BASE STYLES
// ============================================================================
// Values reference canonical --buildrick-* DS tokens directly.
// INSPECTOR_TOKENS constant was deprecated and removed in DS V1 Phase 3.7.
// Consumers use var() strings inline; no indirection layer.

export const baseStyles = {
  section: {
    borderBottom: `1px solid ${"var(--buildrick-border)"}`,
  },
  // Calmer header: bigger hit area, no hard inner divider when open, no loud
  // left accent bar. The section's own borderBottom provides the only divider.
  sectionHeader: (isOpen: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "10px 14px",
    background: "transparent",
    border: "none",
    color: isOpen ? "var(--buildrick-text-primary)" : "var(--buildrick-text-secondary)",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.01em",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "color 0.15s",
  }),
  sectionContent: {
    padding: "4px 14px 14px",
  },
  row: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: "var(--buildrick-text-tertiary)",
    fontWeight: 500,
    minWidth: 60,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: "5px 8px",
    background: "var(--buildrick-bg-input)",
    border: `1px solid ${"var(--buildrick-border-medium)"}`,
    borderRadius: 6,
    color: "var(--buildrick-text-primary)",
    fontSize: 12,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  inputFocus: {
    borderColor: "var(--buildrick-accent)",
    boxShadow: `0 0 0 2px ${"rgba(45, 109, 255, 0.30)"}`,
  },
  select: {
    flex: 1,
    padding: "5px 8px",
    background: "var(--buildrick-bg-input)",
    border: `1px solid ${"var(--buildrick-border-medium)"}`,
    borderRadius: 6,
    color: "var(--buildrick-text-primary)",
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
    paddingRight: 24,
  },
  buttonGroup: {
    display: "flex" as const,
    gap: 2,
    background: "var(--buildrick-bg-subtle)",
    borderRadius: 6,
    padding: 2,
  },
  buttonGroupItem: (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "6px 10px",
    background: active ? "rgba(45, 109, 255, 0.20)" : "transparent",
    border: active ? `1px solid ${"rgba(45, 109, 255, 0.30)"}` : "1px solid transparent",
    borderRadius: 4,
    color: active ? "var(--buildrick-accent)" : "var(--buildrick-text-tertiary)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  }),
  compactBtn: (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "5px 4px",
    background: active ? "rgba(45, 109, 255, 0.20)" : "var(--buildrick-bg-subtle)",
    border: active ? `1px solid ${"rgba(45, 109, 255, 0.30)"}` : "1px solid transparent",
    borderRadius: 4,
    color: active ? "var(--buildrick-accent)" : "var(--buildrick-text-tertiary)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
  }),
  sectionTitle: {
    fontSize: 11,
    color: "var(--buildrick-text-secondary)",
    fontWeight: 600,
    marginBottom: 10,
    marginTop: 16,
  },
  colorInput: {
    width: 32,
    height: 32,
    padding: 0,
    border: `2px solid ${"var(--buildrick-border-medium)"}`,
    borderRadius: 6,
    cursor: "pointer",
    overflow: "hidden" as const,
  },
  unitSelect: {
    width: 50,
    padding: "4px 4px",
    background: "var(--buildrick-bg-input)",
    border: `1px solid ${"var(--buildrick-border-medium)"}`,
    borderLeft: "none",
    borderRadius: "0 4px 4px 0",
    color: "var(--buildrick-text-tertiary)",
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
  },
  inputWithUnit: {
    flex: 1,
    padding: "4px 8px",
    background: "var(--buildrick-bg-input)",
    border: `1px solid ${"var(--buildrick-border-medium)"}`,
    borderRadius: "4px 0 0 4px",
    color: "var(--buildrick-text-primary)",
    fontSize: 12,
    outline: "none",
  },
  slider: {
    flex: 1,
    height: 4,
    background: "var(--buildrick-border-medium)",
    borderRadius: 2,
    appearance: "none" as const,
    cursor: "pointer",
  },
};
