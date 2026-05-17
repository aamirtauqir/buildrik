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
 * Semantic-kind axis (B5 lock 2026-05-16). Orthogonal to TokenKind (which
 * declares value shape). A token with semanticKind set is a "semantic token"
 * and MUST have aliasOf set. A token without semanticKind is a "primitive"
 * and MUST NOT have semanticKind set. Lint rules enforce both directions
 * (DSLinter rules `semantic-needs-alias` + `primitive-rejects-semantic-kind`).
 *
 * Beginner mode hides primitives; Pro mode shows both. See utils/semanticKind.ts
 * for the mode filter.
 */
export type SemanticKind = "action" | "surface" | "text" | "feedback";

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
  semanticKind?: SemanticKind;   // B5 lock 2026-05-16 — semantic token role axis.
                                 // When set, aliasOf MUST also be set (lint enforced).
                                 // When unset, token is treated as a primitive.
  replacedBy?: string;           // B1 lock 2026-05-16 — rename alias bridge.
                                 // When set, the token is soft-deleted: resolver
                                 // returns the canonical at `replacedBy` instead.
                                 // Cleared by sweep migration after 2-version window.
                                 // See token-design-decisions.md §B1.
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
 * The runtime CSS becomes `<property>: var(<tokenId.cssVar>)` so the
 * user's :root token edits propagate without per-binding recomputation.
 *
 * Raw values are forbidden by design — every preset binding must reference
 * an existing token id. Validation lives in the binding-editor UI (S2.1)
 * and the eventual D7 DSLinter rule (preset-bindings-must-resolve).
 */
export interface PresetBinding {
  tokenId: string;
}

/**
 * Style preset record — one row in the StylesSection editor.
 *
 * Persistence: parallel to DesignToken. Loaded via Composer.getProjectSettings()
 * .designPresets. Friendly name is the only beginner-mode editable field
 * in v1; binding editor + variant rename land in S2.1.
 */
export interface StylePreset {
  id: string;                       // e.g. "button-primary"
  friendlyName: string;             // e.g. "Primary button"
  category: PresetCategory;
  variant: string;                  // e.g. "primary" | "secondary" | "ghost"
  bindings: Record<string, PresetBinding>;
}
