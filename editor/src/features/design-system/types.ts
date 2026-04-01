/**
 * Design system types
 * @license BSD-3-Clause
 */

export type TokenCategory =
  | "colors"
  | "typography"
  | "spacing"
  | "effects"
  | "layout"
  | "icons"
  | "buttons"
  | "forms"
  | "theme";

/** WCAG 2.1 contrast level */
export type WcagLevel = "aaa" | "aa" | "aa-large" | "fail" | "na";

/** Color in HSB + alpha space */
export interface ColorHSB {
  h: number; // 0–360
  s: number; // 0–1
  b: number; // 0–1
  a: number; // 0–1
}

/** A single staged change not yet applied */
export interface TokenDiff {
  tokenId: string;
  previousValue: string;
  currentValue: string;
}

/** One undo entry for a single token (stores snapshot of that token's value history) */
export interface UndoEntry {
  tokenId: string;
  snapshot: string; // previous value to restore
}

export type TokenType =
  | "color"
  | "font-family"
  | "font-size"
  | "length"
  | "shadow"
  | "number"
  | "string"
  | "select";

export interface DesignToken {
  id: string;
  name: string;
  value: string;
  category: TokenCategory;
  cssVar: string;
  type: TokenType;
  group?: string;
  options?: string[];
  description?: string;
}

export type ThemeMode = "light" | "dark" | "system";

export interface TokenListProps {
  tokens: DesignToken[];
  onChange: (id: string, value: string) => void;
  onCopy: (id: string) => void;
}

/** Canonical CSS variable name from token id. Use everywhere — never derive from token.name. */
export function tokenToCssVar(id: string): string {
  return `--aqb-${id}`;
}

export const CATEGORY_CHIPS = [
  { id: "colors", label: "Colors", icon: "⬤" },
  { id: "typography", label: "Type", icon: "Aa" },
  { id: "spacing", label: "Space", icon: "↔" },
  { id: "effects", label: "Effects", icon: "◻" },
  { id: "layout", label: "Layout", icon: "▦" },
  { id: "buttons", label: "Buttons", icon: "⬜" },
  { id: "forms", label: "Forms", icon: "▭" },
  { id: "icons", label: "Icons", icon: "◈" },
  { id: "theme", label: "Theme", icon: "◑" },
];
