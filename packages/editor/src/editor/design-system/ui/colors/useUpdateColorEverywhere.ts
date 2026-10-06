/**
 * "Update everywhere" — the inspector's Edit token (4428:142968, G3-155)
 * changes a Brand colour token for the whole site, the way Brand's Save does
 * for one token: the project's saved `designTokens` take the value (the
 * code contract — `projectSettings.designTokens` is where a site's brand
 * lives, see state/projectTokens.ts), and the colour registry follows so the
 * canvas re-renders the var at once.
 *
 * The write goes over the merged v6 list (`mergeProjectTokens`): a lone row
 * appended to an empty or older save would alias primitives the save does
 * not carry, and a save that does not validate loads back as the seed.
 *
 * A Brand draft is never thrown away: with other colour edits staged, this
 * token is staged too (it is already saved, so a later Save agrees); with
 * none, the registry's saved set moves to the new value.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { setTokenLiteral } from "@buildrik/shared/tokens";
import type { Composer } from "@/engine/Composer";
import { useColorRegistry } from "../../state/TokenRegistryContext";
import { mergeProjectTokens } from "../../state/projectTokens";
import { CURRENT_SCHEMA_VERSION } from "../../migrations";

export function useUpdateColorEverywhere(composer: Composer | null | undefined): (tokenId: string, hex: string) => void {
  const color = useColorRegistry();
  return React.useCallback(
    (tokenId: string, hex: string) => {
      if (!composer) return;
      const token = color.savedTokens.find((t) => t.id === tokenId) ?? color.tokens.find((t) => t.id === tokenId);
      if (!token) return;
      const current = composer.getProjectSettings();
      const stored = mergeProjectTokens(current.designTokens ?? [], current.designTokensSchemaVersion);
      composer.setProjectSettings({
        ...current,
        designTokens: setTokenLiteral(stored, tokenId, "light", hex),
        designTokensSchemaVersion: CURRENT_SCHEMA_VERSION,
      });
      if (color.isDirty) color.updateToken(tokenId, hex);
      else color.resetFromSaved(setTokenLiteral(color.savedTokens, tokenId, "light", hex));
    },
    [composer, color],
  );
}
