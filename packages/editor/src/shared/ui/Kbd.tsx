// PHASE 5 DELETE — Phase 4 adapter shim. Legacy/vibcoder shapes diverge;
// translation deferred. Legacy Kbd: `size: 'sm' | 'md'`; vibcoder Kbd:
// `size: 'xs'` + `variant: 'bare' | 'inverted'`. Translation will land
// alongside Phase 5 chrome migration; until then the legacy
// implementation stays as the canonical import route.
/**
 * Kbd — keyboard hint pill (mono font, subtle bg, thin border).
 *
 * Used inline next to search bars, menu items, tooltips to show shortcuts.
 * Example: <Kbd>⌘K</Kbd>, <Kbd>Esc</Kbd>.
 *
 * Phase 2 primitive port — uses --bd-* tokens (alias layer → canonical).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import styled from "@emotion/styled";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  size?: "sm" | "md";
}

const Key = styled.kbd<{ s: NonNullable<KbdProps["size"]> }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--bd-mono);
  font-size: ${(p) => (p.s === "sm" ? "var(--bd-text-2xs)" : "var(--bd-text-xs)")};
  font-weight: var(--bd-weight-medium);
  color: var(--bd-fg-muted);
  background: var(--bd-bg-card);
  border: 1px solid var(--bd-border);
  border-radius: var(--buildrick-radius-sm);
  padding: ${(p) => (p.s === "sm" ? "0 3px" : "1px 5px")};
  line-height: 1.2;
  min-width: ${(p) => (p.s === "sm" ? "14px" : "16px")};
  font-variant-numeric: tabular-nums;
`;

// Spread `...rest` (style, id, role, aria-*, data-*) so codemod-rewritten
// `<kbd style={...}>` → `<Kbd style={...}>` consumers preserve inline styles.
export const Kbd: React.FC<KbdProps> = ({ children, size = "md", ...rest }) => {
  return (
    <Key s={size} {...rest}>
      {children}
    </Key>
  );
};

export default Kbd;
