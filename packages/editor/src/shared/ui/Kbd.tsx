// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled Kbd.
/**
 * Adapter shim — translates legacy Kbd API to vibcoder Kbd.
 *
 * Strategy: bridge. Renders `<VibcoderKbd>` (`<kbd class="bd-kbd">`)
 * internally and maps the legacy `size` union onto vibcoder's narrower one.
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   size:
 *     "sm" → vibcoder size="xs"   (cmd-palette / rail variant)
 *     "md" → vibcoder undefined   (base 18px chip — no modifier)
 *   ...rest:
 *     HTMLAttributes<HTMLElement> spread directly to the `<kbd>` element
 *     (style, id, role, aria-*, data-*, className).
 *
 * Untranslatable: none. Vibcoder also exposes `variant: 'bare' | 'inverted'`
 * that the legacy API never used; not surfaced through this shim.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Kbd as VibcoderKbd } from "@/editor/shared/vibcoder";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  size?: "sm" | "md";
}

export const Kbd: React.FC<KbdProps> = ({ children, size = "md", ...rest }) => {
  const mappedSize: "xs" | undefined = size === "sm" ? "xs" : undefined;
  return (
    <VibcoderKbd size={mappedSize} {...rest}>
      {children}
    </VibcoderKbd>
  );
};

export default Kbd;
