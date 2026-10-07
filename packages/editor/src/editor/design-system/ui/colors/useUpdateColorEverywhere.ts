/**
 * "Update everywhere" — the inspector's Edit token (4428:142968, G3-155)
 * changes a Brand colour token for the whole site through the same write
 * Brand makes (spec §4: one save model): `composer.designSystem.setTokens`,
 * one transaction, one ⌘Z, refused while the tokens are read-only. Every
 * colour registry and the canvas follow from that write.
 *
 * The write goes over the merged v6 list (`mergeProjectTokens`): a lone row
 * appended to an empty or older save would alias primitives the save does
 * not carry. On a read-only site that merge is the seed — which is exactly
 * why setTokens refuses there instead of letting it replace the real tokens.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { setTokenLiteral } from "@buildrik/shared/tokens";
import type { Composer } from "@/engine/Composer";
import { mergeProjectTokens } from "@/engine/designSystem/projectTokens";

/** Returns false when nothing was written (no composer, unknown token, read-only, invalid). */
export function useUpdateColorEverywhere(
  composer: Composer | null | undefined,
): (tokenId: string, hex: string) => boolean {
  return React.useCallback(
    (tokenId: string, hex: string) => {
      if (!composer) return false;
      const settings = composer.getProjectSettings();
      const tokens = mergeProjectTokens(settings.designTokens ?? [], settings.designTokensSchemaVersion);
      if (!tokens.some((t) => t.id === tokenId)) return false;
      return composer.designSystem.setTokens(setTokenLiteral(tokens, tokenId, "light", hex), "Update everywhere");
    },
    [composer],
  );
}
