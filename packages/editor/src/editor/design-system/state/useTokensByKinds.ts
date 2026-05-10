/**
 * useTokensByKinds — pulls tokens from the 14 registries and returns a flat
 * list filtered to the requested kinds.
 *
 * Used by the BindingEditor (S2.1) to feed kind-compatible tokens into the
 * TokenPickerPopover for a given binding row.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken, TokenKind } from "../types";
import {
  useColorRegistry, useTypeRegistry, useSpacingRegistry,
  useRadiusRegistry, useShadowRegistry, useMotionRegistry,
  useBorderRegistry, useOpacityRegistry, useZindexRegistry,
  useBreakpointRegistry, useGridRegistry, useSizingRegistry,
  useIconRegistry, useImageryRegistry,
} from "./TokenRegistryContext";

/**
 * Returns all tokens whose kind ∈ kinds. Color/type/spacing tokens are
 * matched by both `kind` (when set) and category fallback (legacy tokens
 * from before Phase A.0 added the kind field). The 11 new-kind tokens
 * always carry kind, so they match strictly.
 */
export function useTokensByKinds(kinds: readonly TokenKind[]): DesignToken[] {
  const color      = useColorRegistry();
  const type       = useTypeRegistry();
  const spacing    = useSpacingRegistry();
  const radius     = useRadiusRegistry();
  const shadow     = useShadowRegistry();
  const motion     = useMotionRegistry();
  const border     = useBorderRegistry();
  const opacity    = useOpacityRegistry();
  const zindex     = useZindexRegistry();
  const breakpoint = useBreakpointRegistry();
  const grid       = useGridRegistry();
  const sizing     = useSizingRegistry();
  const icon       = useIconRegistry();
  const imagery    = useImageryRegistry();

  return React.useMemo(() => {
    const wanted = new Set(kinds);
    const out: DesignToken[] = [];
    const inferKind = (t: DesignToken): TokenKind | undefined => {
      if (t.kind) return t.kind;
      switch (t.category) {
        case "colors":     return "color";
        case "typography": return "type";
        case "spacing":    return "spacing";
        default:           return undefined;
      }
    };
    const all: DesignToken[] = [
      ...color.tokens, ...type.tokens, ...spacing.tokens,
      ...radius.tokens, ...shadow.tokens, ...motion.tokens,
      ...border.tokens, ...opacity.tokens, ...zindex.tokens,
      ...breakpoint.tokens, ...grid.tokens, ...sizing.tokens,
      ...icon.tokens, ...imagery.tokens,
    ];
    for (const t of all) {
      const k = inferKind(t);
      if (k && wanted.has(k)) out.push(t);
    }
    return out;
  }, [
    kinds,
    color.tokens, type.tokens, spacing.tokens,
    radius.tokens, shadow.tokens, motion.tokens,
    border.tokens, opacity.tokens, zindex.tokens,
    breakpoint.tokens, grid.tokens, sizing.tokens,
    icon.tokens, imagery.tokens,
  ]);
}
