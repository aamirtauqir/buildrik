// PHASE 5 DELETE — Phase 4 adapter strategy: keep-legacy.
/**
 * Strategy: keep-legacy (NOT a vibcoder bridge).
 *
 * Why: legacy Badge variant union is a semantic palette
 * (`default | primary | success | warning | error | info`).
 * Vibcoder Badge variant union is chrome-specific state
 * (`published | draft | issues | unsaved | syncing | new | premium | count`).
 * The two are semantically disjoint — there is no honest mapping from a
 * "success" badge to a "published" badge, or from a "warning" badge to
 * "syncing".
 *
 * Throws-at-render rejected: consumers in `src/ai/` + `src/templates/` use
 * the legacy semantic union heavily. Throwing at the variant boundary
 * would brick those features at first render.
 *
 * Phase 5 handoff: this primitive cannot be migrated by file-deletion
 * alone. Either: (a) consumers in src/ai/ + src/templates/ are rewritten
 * to use vibcoder's chrome-state union (likely impossible — wrong domain),
 * (b) vibcoder gains a parallel "semantic" Badge primitive, or (c) legacy
 * Badge is renamed to SemanticBadge and kept indefinitely with the chrome
 * Badge as a separate import path.
 *
 * SemanticBadge — pill-shaped label for status/counter/tag.
 *
 * Week 1 reconciliation per P0c audit BD1, BD3, BD4.
 * BD2 (premium variant) deferred pending PRO tier UI copy confirmation.
 *
 * Props API:
 *   variant = default | primary | success | warning | error | info
 *   size    = xs | sm | md | lg
 *              xs = tab-counter (10px font, 1px 6px pad) — NEW per BD3
 *              sm/md/lg = standard status pills
 *   dot     = when true + children: render small dot as prefix INSIDE pill
 *             when true + no children: render standalone colored dot (back-compat)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import styled from "@emotion/styled";

export interface SemanticBadgeProps {
  children?: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info";
  size?: "xs" | "sm" | "md" | "lg";
  /** Show a colored dot. If children, dot prefixes children inside the pill.
   *  If no children, renders a standalone dot element (back-compat). */
  dot?: boolean;
  className?: string;
}

type Variant = NonNullable<SemanticBadgeProps["variant"]>;
type Size = NonNullable<SemanticBadgeProps["size"]>;

// info === accent family per DESIGN.md. Canonical --buildrick-info shares
// the same cobalt value as --buildrick-accent (see color.css).
const variantFg: Record<Variant, string> = {
  default: "var(--bk-ink-muted)",
  primary: "var(--bk-accent)",
  success: "var(--bk-success)",
  warning: "var(--bk-warning)",
  error: "var(--bk-error)",
  info: "var(--bk-accent)",
};

const variantBg: Record<Variant, string> = {
  default: "var(--bk-bg-subtle)",
  primary: "var(--bk-accent-tint)",
  success: "var(--bk-success-tint)",
  warning: "var(--bk-warning-tint)",
  error: "var(--bk-error-tint)",
  info: "var(--bk-accent-tint)",
};

const variantBorder: Record<Variant, string> = {
  default: "var(--bk-border)",
  primary: "var(--bk-accent-subtle)",
  success: "var(--bk-success)",
  warning: "var(--bk-warning-text)",
  error: "var(--bk-error)",
  info: "var(--bk-accent-subtle)",
};

// BD3: xs size per prototype .tab-badge (10px font, 1px 6px pad).
const sizePad: Record<Size, string> = {
  xs: "1px 6px",
  sm: "1px 6px",
  md: "2px 8px",
  lg: "3px 10px",
};

const sizeFont: Record<Size, string> = {
  xs: "var(--bk-text-11)",
  sm: "var(--bk-text-11)",
  md: "var(--bk-text-11)",
  lg: "var(--bk-text-12)",
};

const dotSize: Record<Size, string> = {
  xs: "4px",
  sm: "5px",
  md: "6px",
  lg: "8px",
};

const Pill = styled.span<{ v: Variant; s: Size }>`
  display: inline-flex;
  align-items: center;
  gap: var(--bk-space-8);
  padding: ${(p) => sizePad[p.s]};
  font-family: var(--bk-font-ui);
  font-size: ${(p) => sizeFont[p.s]};
  font-weight: var(--bk-weight-semibold);
  letter-spacing: var(--bk-tracking-wide);
  /* xs is a numeric counter — never uppercase */
  text-transform: ${(p) => (p.v === "default" || p.s === "xs" ? "none" : "uppercase")};
  border-radius: var(--bk-radius-full);
  border: 1px solid ${(p) => variantBorder[p.v]};
  background: ${(p) => variantBg[p.v]};
  color: ${(p) => variantFg[p.v]};
  line-height: 1.2;
`;

const Dot = styled.span<{ v: Variant; s: Size }>`
  display: inline-block;
  width: ${(p) => dotSize[p.s]};
  height: ${(p) => dotSize[p.s]};
  border-radius: var(--bk-radius-full);
  background: ${(p) => variantFg[p.v]};
  flex-shrink: 0;
`;

export const SemanticBadge: React.FC<SemanticBadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className,
}) => {
  // BD4 — dot prefix semantics:
  //   dot + children  -> pill with colored dot prefix inside
  //   dot + no children -> standalone dot (back-compat with prior API)
  //   no dot + children -> plain pill
  if (dot && !children) {
    return <Dot v={variant} s={size} className={className} aria-hidden />;
  }
  return (
    <Pill v={variant} s={size} className={className}>
      {dot && <Dot v={variant} s={size} aria-hidden />}
      {children}
    </Pill>
  );
};

export default SemanticBadge;
