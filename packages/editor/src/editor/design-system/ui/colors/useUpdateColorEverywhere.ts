/**
 * "Update everywhere" — the inspector's Edit token (4428:142968, G3-155)
 * changes a Brand colour token for the whole site, the way Brand's Save does
 * for one token: the project's saved `designTokens` row takes the value (the
 * code contract — `projectSettings.designTokens` is where a site's brand
 * lives, see state/projectTokens.ts), and the colour registry follows so the
 * canvas re-renders the var at once.
 *
 * A Brand draft is never thrown away: with other colour edits staged, this
 * token is staged too (it is already saved, so a later Save agrees); with
 * none, the registry's saved set moves to the new value.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../../engine/Composer";
import type { DesignTokenRecord } from "../../../../shared/types/project";
import { useColorRegistry } from "../../state/TokenRegistryContext";

export function useUpdateColorEverywhere(composer: Composer | null | undefined): (tokenId: string, hex: string) => void {
  const color = useColorRegistry();
  return React.useCallback(
    (tokenId: string, hex: string) => {
      if (!composer) return;
      const token = color.savedTokens.find((t) => t.id === tokenId) ?? color.tokens.find((t) => t.id === tokenId);
      if (!token) return;
      const current = composer.getProjectSettings();
      const stored: DesignTokenRecord[] = current.designTokens ?? [];
      const row: DesignTokenRecord = {
        id: token.id,
        name: token.name,
        value: hex,
        cssVar: token.cssVar,
        category: "colors",
        type: token.type,
        ...(token.group ? { group: token.group } : {}),
        ...(token.darkValue ? { darkValue: token.darkValue } : {}),
      };
      const next = stored.some((r) => r.id === tokenId)
        ? stored.map((r) => (r.id === tokenId ? { ...r, value: hex } : r))
        : [...stored, row];
      composer.setProjectSettings({ ...current, designTokens: next });
      if (color.isDirty) color.updateToken(tokenId, hex);
      else color.resetFromSaved(color.savedTokens.map((t) => (t.id === tokenId ? { ...t, value: hex } : t)));
    },
    [composer, color],
  );
}
