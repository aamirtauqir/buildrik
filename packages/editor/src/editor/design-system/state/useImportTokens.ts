/**
 * useImportTokens — orchestrator that routes incoming DesignTokens to the
 * correct kind registry. Routing rule:
 *   1. If a token's id already exists in any registry → updateToken on that
 *      registry (preserves kind regardless of the incoming token's kind hint).
 *   2. Otherwise → infer the target registry from `kind` (preferred) or
 *      `category` (legacy fallback) and call addToken.
 *
 * type/spacing registries don't expose addToken (fixed-set primitives). New
 * tokens routed there are recorded in `skipped` instead.
 *
 * Returns a `Stats` object so the UI can show "n modified, m added, k skipped".
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

export interface ImportStats {
  modified: number;
  added: number;
  skipped: string[];
}

interface RegistryHandle {
  kind: TokenKind;
  tokens: readonly DesignToken[];
  // darkValue is optional + color-specific; registries that ignore the third
  // arg (narrower signatures) remain assignable here.
  updateToken: (id: string, value: string, darkValue?: string) => void;
  addToken?: (token: DesignToken) => void;
}

/**
 * Which registry a token belongs to. `kind` is authoritative; `category` is a
 * COARSER taxonomy (9 values against 14 kinds — radius, shadow, motion and
 * border can all be "effects"), so it can only resolve the three kinds that
 * happen to have a category of their own. Everything else needs `kind`.
 *
 * Exported because the import preflight has to apply exactly this rule: a token
 * this returns null for cannot be applied, and counting it as "valid" is what
 * produced "Valid tokens 3 / Errors 0" followed by a silent "2 skipped".
 */
export function inferKind(t: DesignToken): TokenKind | null {
  if (t.kind) return t.kind;
  switch (t.category) {
    case "colors":     return "color";
    case "typography": return "type";
    case "spacing":    return "spacing";
    default:           return null;
  }
}

export function useImportTokens(): (incoming: DesignToken[]) => ImportStats {
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

  const registries: RegistryHandle[] = React.useMemo(
    () => [
      { kind: "color",      tokens: color.tokens,      updateToken: color.updateToken,      addToken: color.addToken },
      { kind: "type",       tokens: type.tokens,       updateToken: type.updateToken /* no addToken */ },
      { kind: "spacing",    tokens: spacing.tokens,    updateToken: spacing.updateToken /* no addToken */ },
      { kind: "radius",     tokens: radius.tokens,     updateToken: radius.updateToken,     addToken: radius.addToken },
      { kind: "shadow",     tokens: shadow.tokens,     updateToken: shadow.updateToken,     addToken: shadow.addToken },
      { kind: "motion",     tokens: motion.tokens,     updateToken: motion.updateToken,     addToken: motion.addToken },
      { kind: "border",     tokens: border.tokens,     updateToken: border.updateToken,     addToken: border.addToken },
      { kind: "opacity",    tokens: opacity.tokens,    updateToken: opacity.updateToken,    addToken: opacity.addToken },
      { kind: "zindex",     tokens: zindex.tokens,     updateToken: zindex.updateToken,     addToken: zindex.addToken },
      { kind: "breakpoint", tokens: breakpoint.tokens, updateToken: breakpoint.updateToken, addToken: breakpoint.addToken },
      { kind: "grid",       tokens: grid.tokens,       updateToken: grid.updateToken,       addToken: grid.addToken },
      { kind: "sizing",     tokens: sizing.tokens,     updateToken: sizing.updateToken,     addToken: sizing.addToken },
      { kind: "icon",       tokens: icon.tokens,       updateToken: icon.updateToken,       addToken: icon.addToken },
      { kind: "imagery",    tokens: imagery.tokens,    updateToken: imagery.updateToken,    addToken: imagery.addToken },
    ],
    [
      color, type, spacing, radius, shadow, motion, border,
      opacity, zindex, breakpoint, grid, sizing, icon, imagery,
    ],
  );

  return React.useCallback((incoming: DesignToken[]): ImportStats => {
    const stats: ImportStats = { modified: 0, added: 0, skipped: [] };

    for (const t of incoming) {
      // Modification path: any registry already has this id.
      const existingHost = registries.find((r) => r.tokens.some((x) => x.id === t.id));
      if (existingHost) {
        // Carry darkValue so a dark-complete re-import isn't stripped on the
        // modify path (color registry persists it; other kinds ignore it).
        existingHost.updateToken(t.id, t.value, t.darkValue);
        stats.modified++;
        continue;
      }

      // Add path: route on kind (preferred) or category fallback.
      const kind = inferKind(t);
      if (!kind) {
        stats.skipped.push(t.id);
        continue;
      }
      const target = registries.find((r) => r.kind === kind);
      if (!target || !target.addToken) {
        stats.skipped.push(t.id);
        continue;
      }
      target.addToken(t);
      stats.added++;
    }

    return stats;
  }, [registries]);
}
