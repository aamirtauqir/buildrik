/**
 * useDarkModeApplication — Phase B.1 hook
 * Listens to composer.colorMode:changed and re-applies color tokens via
 * composer.darkResolver. Color-only; other token kinds passthrough untouched.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { DesignToken } from "../../design-system/types";

function applyColorTokens(composer: Composer): void {
  const project = composer.exportProject();
  const tokens = (project.settings?.designTokens ?? []) as unknown as DesignToken[];
  const colorTokens = tokens.filter((t) => t.category === "colors");
  const mode = composer.colorMode.resolved();
  for (const token of colorTokens) {
    const effective = composer.darkResolver.resolve(token, mode);
    document.documentElement.style.setProperty(token.cssVar, effective);
  }
}

export function useDarkModeApplication(composer: Composer | null): void {
  React.useEffect(() => {
    if (!composer) return;
    const handler = () => applyColorTokens(composer);
    composer.on("colorMode:changed", handler);
    return () => {
      composer.off("colorMode:changed", handler);
    };
  }, [composer]);
}
