/**
 * Design system types
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
 * Spec §5.3 token kinds — 14 total. The 3 existing kinds (color/type/spacing)
 * have already-shipped hook + context implementations. The 11 new kinds plug
 * into the same architecture via the factory hook in useTokensForKind.ts.
 */
export type TokenKind =
  | "color" | "type" | "spacing"
  | "radius" | "shadow" | "motion"
  | "border" | "opacity" | "zindex"
  | "breakpoint" | "grid" | "sizing"
  | "icon" | "imagery";

/**
 * Per-kind value shape. Discriminated by `kind`. Validators in
 * packages/shared/schemas/designToken.ts enforce the per-kind shape.
 */
export type TokenValue =
  | { kind: "color"; value: string }                       // hex, rgb, hsl
  | { kind: "type"; family: string; weight?: number; size?: string; lineHeight?: string }
  | { kind: "spacing"; value: string }                     // px, rem, em
  | { kind: "radius"; value: string }                      // px, rem, %
  | { kind: "shadow"; value: string }                      // CSS box-shadow string
  | { kind: "motion"; duration: string; easing: string }   // "200ms", "ease-out"
  | { kind: "border"; width: string; style: string; color?: string }
  | { kind: "opacity"; value: number }                     // 0–1
  | { kind: "zindex"; value: number }                      // integer
  | { kind: "breakpoint"; value: string }                  // "768px"
  | { kind: "grid"; columns: number; gap?: string }
  | { kind: "sizing"; value: string }
  | { kind: "icon"; name: string; size?: string }          // ref to icon library
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
  // Existing fields — keep all for backward compat with shipped color/spacing/type.
  id: string;
  name: string;                  // legacy; spec §5.3 calls this `friendlyName`
  value: string;                 // legacy single-string value (color/spacing/type still use this)
  category: TokenCategory;       // legacy 9-category union
  cssVar: string;
  type: TokenType;               // legacy
  group?: string;
  options?: string[];
  description?: string;

  // Phase A.0 additions — optional so existing tokens remain valid.
  kind?: TokenKind;              // spec §5.3 — discriminator for new tokens
  friendlyName?: string;         // spec §5.3 — beginner-mode label.
                                 // RESOLUTION RULE: render sites should use `friendlyName ?? name`.
  aliasOf?: string;              // Phase A.2 — populated then; declared here so type compiles
  darkValue?: string;            // Phase B.0 — color-only dark variant.
                                 // Resolution: mode==="dark" && darkValue → use darkValue;
                                 // missing darkValue under mode==="dark" → fall back to `value`
                                 // and emit `tokens:dark-missing` (D16 spec).
                                 // darkValue === "" is treated as explicit empty, NOT missing.
  typedValue?: TokenValue;       // Structured value for the 11 NEW kinds (radius/shadow/motion/
                                 // border/opacity/zindex/breakpoint/grid/sizing/icon/imagery).
                                 // The 3 LEGACY kinds (color/type/spacing) keep using `value: string`
                                 // until Phase A.4 polish converges everything onto `typedValue`.
}

export type ThemeMode = "light" | "dark" | "system";

export interface TokenListProps {
  tokens: DesignToken[];
  onChange: (id: string, value: string) => void;
  onCopy: (id: string) => void;
}

/** Canonical CSS variable name from token id. Use everywhere — never derive from token.name. */
export function tokenToCssVar(id: string): string {
  return `--buildrick-design-${id}`;
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
