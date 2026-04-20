/**
 * Chrome token types — typed union of DS V1 chrome token paths.
 *
 * Source of truth is the CSS variables declared in
 * packages/editor/src/themes/design-system/{color,spacing,radius,shadow,typography}.css.
 * These unions mirror a useful subset of those tokens for compile-time
 * DS compliance via the <Box> primitive.
 *
 * Not auto-generated — kept small and manually curated to the tokens Week 3+
 * migrations actually need. Extend as new usage lands. If you find yourself
 * adding a raw var(--buildrick-*) to Box consumers, add the token here instead.
 *
 * @license BSD-3-Clause
 */

// Background surface tokens. Every entry below is grep-verified against
// packages/editor/src/themes/design-system/color.css. Do not add a value
// whose underlying --buildrick-bg-* CSS var does not exist.
export type ChromeBg =
  | "panel"           // --buildrick-bg-panel
  | "card"            // --buildrick-bg-card
  | "input"           // --buildrick-bg-input
  | "subtle"          // --buildrick-bg-subtle (search, hover fills)
  | "elevated"        // --buildrick-bg-elevated (modals, dropdowns)
  | "hover"           // --buildrick-bg-hover
  | "pressed"         // --buildrick-bg-pressed
  | "accent"          // --buildrick-accent (primary CTA surface)
  | "accent.tint"     // --buildrick-accent-tint
  | "accent.subtle"   // --buildrick-accent-subtle
  | "transparent";

// Text tokens
export type ChromeText =
  | "primary"         // --buildrick-text-primary
  | "secondary"       // --buildrick-text-secondary
  | "muted"           // --buildrick-text-muted
  | "disabled"        // --buildrick-text-disabled
  | "on-accent";      // --buildrick-text-on-accent

// Spacing scale — matches DESIGN.md §Spacing (2/4/8/12/16/24/32/48/64)
export type ChromeSpace =
  | 0
  | "xs"   // 4px
  | "sm"   // 8px
  | "md"   // 12px
  | "lg"   // 16px
  | "xl"   // 24px
  | "2xl"; // 32px

// Border radius — panel chrome caps at sm (4) per Chrome Axiom A1.3.
// Form atoms may use md (8), lg (12), xl (16), full.
export type ChromeRadius =
  | "none"
  | "sm"    // 4 — panel chrome
  | "md"    // 8 — form atoms (Button default)
  | "lg"    // 12 — modals
  | "xl"    // 16 — hero cards
  | "full"; // pill/avatar

// Shadow tokens — A1.2 requires box-shadow to come from these.
export type ChromeShadow =
  | "none"
  | "xs"         // --buildrick-shadow-xs
  | "sm"         // --buildrick-shadow-sm
  | "md"         // --buildrick-shadow-md
  | "lg"         // --buildrick-shadow-lg
  | "xl"         // --buildrick-shadow-xl
  | "dropdown"   // --buildrick-shadow-dropdown
  | "modal"      // --buildrick-shadow-modal
  | "hover"      // --buildrick-shadow-hover
  | "inner";     // --buildrick-shadow-inner

// Border tokens
export type ChromeBorder =
  | "none"
  | "default"    // --buildrick-border
  | "medium"     // --buildrick-border-medium
  | "strong"     // --buildrick-border-strong
  | "focus";     // --buildrick-border-focus

// ============================================================================
// Resolvers — map token path → CSS value (var() ref or literal)
// ============================================================================

const SPACING_PX: Record<Exclude<ChromeSpace, 0>, string> = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
};

export function resolveSpace(v: ChromeSpace | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (v === 0) return "0";
  return SPACING_PX[v];
}

const BG_VAR: Record<ChromeBg, string> = {
  "panel": "var(--buildrick-bg-panel)",
  "card": "var(--buildrick-bg-card)",
  "input": "var(--buildrick-bg-input)",
  "subtle": "var(--buildrick-bg-subtle)",
  "elevated": "var(--buildrick-bg-elevated)",
  "hover": "var(--buildrick-bg-hover)",
  "pressed": "var(--buildrick-bg-pressed)",
  "accent": "var(--buildrick-accent)",
  "accent.tint": "var(--buildrick-accent-tint)",
  "accent.subtle": "var(--buildrick-accent-subtle)",
  "transparent": "transparent",
};

export function resolveBg(v: ChromeBg | undefined): string | undefined {
  if (v === undefined) return undefined;
  return BG_VAR[v];
}

const TEXT_VAR: Record<ChromeText, string> = {
  "primary": "var(--buildrick-text-primary)",
  "secondary": "var(--buildrick-text-secondary)",
  "muted": "var(--buildrick-text-muted)",
  "disabled": "var(--buildrick-text-disabled)",
  "on-accent": "var(--buildrick-text-on-accent)",
};

export function resolveText(v: ChromeText | undefined): string | undefined {
  if (v === undefined) return undefined;
  return TEXT_VAR[v];
}

const RADIUS_VAR: Record<ChromeRadius, string> = {
  "none": "0",
  "sm": "var(--buildrick-radius-sm)",
  "md": "var(--buildrick-radius-md)",
  "lg": "var(--buildrick-radius-lg)",
  "xl": "var(--buildrick-radius-xl)",
  "full": "var(--buildrick-radius-full)",
};

export function resolveRadius(v: ChromeRadius | undefined): string | undefined {
  if (v === undefined) return undefined;
  return RADIUS_VAR[v];
}

const SHADOW_VAR: Record<ChromeShadow, string> = {
  "none": "none",
  "xs": "var(--buildrick-shadow-xs)",
  "sm": "var(--buildrick-shadow-sm)",
  "md": "var(--buildrick-shadow-md)",
  "lg": "var(--buildrick-shadow-lg)",
  "xl": "var(--buildrick-shadow-xl)",
  "dropdown": "var(--buildrick-shadow-dropdown)",
  "modal": "var(--buildrick-shadow-modal)",
  "hover": "var(--buildrick-shadow-hover)",
  "inner": "var(--buildrick-shadow-inner)",
};

export function resolveShadow(v: ChromeShadow | undefined): string | undefined {
  if (v === undefined) return undefined;
  return SHADOW_VAR[v];
}

const BORDER_VAR: Record<ChromeBorder, string> = {
  "none": "none",
  "default": "1px solid var(--buildrick-border)",
  "medium": "1px solid var(--buildrick-border-medium)",
  "strong": "1px solid var(--buildrick-border-strong)",
  "focus": "1px solid var(--buildrick-border-focus)",
};

export function resolveBorder(v: ChromeBorder | undefined): string | undefined {
  if (v === undefined) return undefined;
  return BORDER_VAR[v];
}
