/**
 * Design system types — engine-owned.
 *
 * Moved from editor/design-system/types.ts on 2026-05-22 as prep for the
 * engine→editor import refactor (CLAUDE.md `engine → shared only` rule).
 * Engine code (DarkResolver, AliasResolver, would-be-moved CSSBundler/
 * DSLinter) needs these types; previously they reached into editor/ for
 * them, which violated the import-direction contract.
 *
 * editor/design-system/types.ts now re-exports from here, so existing
 * editor consumers keep their import paths unchanged.
 *
 * Pure data types only — no React, no runtime side effects. The few
 * editor-specific React props (TokenListProps) + UI constants
 * (CATEGORY_CHIPS) stay in editor/design-system/types.ts.
 *
 * @license BSD-3-Clause
 */

/**
 * Legacy 9-category union used for the existing UI chip filter and the shipped
 * color/spacing/type hooks. Kept for backward compat; new code should prefer
 * `TokenKind` (spec §5.3, defined below) which is the canonical 14-kind axis.
 * Phase A.4 polish will reconcile or remove this once all consumers migrate.
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

/**
 * Spec §5.3 token kinds — 14 total.
 */
export type TokenKind =
  | "color" | "type" | "spacing"
  | "radius" | "shadow" | "motion"
  | "border" | "opacity" | "zindex"
  | "breakpoint" | "grid" | "sizing"
  | "icon" | "imagery";

/**
 * Semantic-kind axis (B5 lock 2026-05-16).
 */
export type SemanticKind = "action" | "surface" | "text" | "feedback";

/**
 * Per-kind value shape. Discriminated by `kind`.
 */
export type TokenValue =
  | { kind: "color"; value: string }
  | { kind: "type"; family: string; weight?: number; size?: string; lineHeight?: string }
  | { kind: "spacing"; value: string }
  | { kind: "radius"; value: string }
  | { kind: "shadow"; value: string }
  | { kind: "motion"; duration: string; easing: string }
  | { kind: "border"; width: string; style: string; color?: string }
  | { kind: "opacity"; value: number }
  | { kind: "zindex"; value: number }
  | { kind: "breakpoint"; value: string }
  | { kind: "grid"; columns: number; gap?: string }
  | { kind: "sizing"; value: string }
  | { kind: "icon"; name: string; size?: string }
  | { kind: "imagery"; url: string; alt?: string };

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

  kind?: TokenKind;
  friendlyName?: string;
  aliasOf?: string;
  semanticKind?: SemanticKind;
  replacedBy?: string;
  darkValue?: string;
  typedValue?: TokenValue;
}

export type ThemeMode = "light" | "dark" | "system";

/** Canonical CSS variable name from token id. Use everywhere — never derive from token.name. */
export function tokenToCssVar(id: string): string {
  return `--buildrick-design-${id}`;
}

// ============================================================================
// PHASE B — STYLE PRESETS (spec §5.4)
// ============================================================================

/** Spec §5.4 preset categories — 11 total. */
export type PresetCategory =
  | "button" | "card" | "form" | "link"
  | "badge" | "alert" | "tooltip" | "modal"
  | "nav" | "table" | "layout";

/**
 * One preset binding maps a CSS property name to a token reference.
 */
export interface PresetBinding {
  tokenId: string;
}

/**
 * Style preset record — one row in the StylesSection editor.
 */
export interface StylePreset {
  id: string;
  friendlyName: string;
  category: PresetCategory;
  variant: string;
  bindings: Record<string, PresetBinding>;
}
